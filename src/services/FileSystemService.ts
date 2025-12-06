import { openDB, DBSchema, IDBPDatabase } from 'idb';

// Temporary type definitions until we fully remove Prisma
export interface HighlightType {
    id: string;
    text: string;
    url: string;
    title?: string;
    favicon?: string;
    createdAt: string;
    tags: string[];
    documentId?: string | null; // Deprecated, use documentIds
    documentIds?: string[];
    color?: string;
    note?: string;
}

export interface DocumentType {
    id: string;
    title: string;
    url: string;
    createdAt: string;
    updatedAt: string;
    content?: string;
}

export interface AppData {
    highlights: HighlightType[];
    documents: DocumentType[];
}


const HIGHLIGHTS_FILE = 'highlights.json';
const DOCUMENTS_FILE = 'documents.json';
const DB_NAME = 'highlight-db';
const STORE_NAME = 'handles';
const FILES_STORE = 'files'; // New store for internal file content
const HANDLE_KEY = 'root_dir';
const STORAGE_MODE_KEY = 'storage_mode'; // 'folder' | 'internal'

interface HighlightDB extends DBSchema {
    handles: {
        key: string;
        value: FileSystemDirectoryHandle | string;
    };
    files: {
        key: string;
        value: any; // Stores the JSON content directly
    };
}

const SEED_HIGHLIGHTS: HighlightType[] = [
    {
        id: 'seed-1',
        text: '👋 Welcome to Highlight! I\'m a sticky note. You can drag me around.',
        url: 'https://example.com/welcome',
        title: 'Welcome Guide',
        favicon: 'https://www.google.com/s2/favicons?domain=example.com',
        createdAt: new Date().toISOString(),
        tags: [],
        color: '#fef3c7', // Yellow
    },
    {
        id: 'seed-2',
        text: '🔗 I was clipped from the web. Click my link icon to go back to the source.',
        url: 'https://example.com/source',
        title: 'Source Example',
        favicon: 'https://www.google.com/s2/favicons?domain=wikipedia.org',
        createdAt: new Date().toISOString(),
        tags: [],
        color: '#dbeafe', // Blue
    },
    {
        id: 'seed-3',
        text: '📂 Drag me onto a Document to organize me!',
        url: 'https://example.com/organize',
        title: 'Organization Tip',
        favicon: 'https://www.google.com/s2/favicons?domain=notion.so',
        createdAt: new Date().toISOString(),
        tags: [],
        color: '#dcfce7', // Green
    }
];

const SEED_DOCUMENTS: DocumentType[] = [
    {
        id: 'doc-1',
        title: 'My First Project',
        url: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        content: '👋 Welcome to Highlight! I\'m a sticky note. You can drag me around.\n\n🔗 I was clipped from the web. Click my link icon to go back to the source.'
    },
    {
        id: 'doc-2',
        title: 'Reading List',
        url: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        content: ''
    }
];

export class FileSystemService {
    private dirHandle: FileSystemDirectoryHandle | null = null;
    constructor() {
        // Lazy init
        // Ensure manual seeding happens only once per session if needed, but checking file existence is better
    }

    private _dbPromise: Promise<IDBPDatabase<HighlightDB>> | null = null;
    private useInternalStorage: boolean = false;

    private get dbPromise(): Promise<IDBPDatabase<HighlightDB>> {
        if (!this._dbPromise) {
            if (typeof window === 'undefined') {
                // Return a never-resolving promise or reject if called on server
                return Promise.reject(new Error('IndexedDB not available on server'));
            }
            this._dbPromise = openDB<HighlightDB>(DB_NAME, 2, { // Bump version to 2
                upgrade(db, oldVersion, newVersion, transaction) {
                    if (oldVersion < 1) {
                        db.createObjectStore(STORE_NAME);
                    }
                    if (oldVersion < 2) {
                        db.createObjectStore(FILES_STORE);
                    }
                },
            });
        }
        return this._dbPromise;
    }

    async connect(): Promise<void> {
        // Check if API is supported
        if (typeof window.showDirectoryPicker !== 'function') {
            throw new Error('File System Access API (window.showDirectoryPicker) is not available in this browser.');
        }

        try {
            this.dirHandle = await window.showDirectoryPicker({
                mode: 'readwrite',
                id: 'highlight-app-data',
            });

            const db = await this.dbPromise;
            await db.put(STORE_NAME, this.dirHandle, HANDLE_KEY);
            await db.put(STORE_NAME, 'folder', STORAGE_MODE_KEY);
            this.useInternalStorage = false;

            await this.seedData();

        } catch (error) {
            if ((error as Error).name === 'AbortError') {
                throw new Error('User cancelled folder selection');
            }
            throw error;
        }
    }

    async enableInternalStorage(): Promise<void> {
        this.useInternalStorage = true;
        // Clear any existing handle and save preference
        const db = await this.dbPromise;
        await db.delete(STORE_NAME, HANDLE_KEY);
        await db.put(STORE_NAME, 'internal', STORAGE_MODE_KEY);

        await this.seedData();
    }

    private async seedData(): Promise<void> {
        try {
            // Check if highlights exist
            const highlights = await this.readJsonFile<HighlightType[]>(HIGHLIGHTS_FILE, null as any);
            if (!highlights) {
                console.log('Seeding initial highlights...');
                // Add seed highlights to the first document as an example?
                // User said "Document 1 contains a few example notes".
                const seededHighlights = SEED_HIGHLIGHTS.map(h => ({
                    ...h,
                    documentId: h.id === 'seed-3' ? null : 'doc-1' // Put first two in doc-1, keep 3rd unassigned to drag
                }));
                await this.writeJsonFile(HIGHLIGHTS_FILE, seededHighlights);
            }

            // Check if documents exist
            const docs = await this.readJsonFile<DocumentType[]>(DOCUMENTS_FILE, null as any);
            if (!docs) {
                console.log('Seeding initial documents...');
                await this.writeJsonFile(DOCUMENTS_FILE, SEED_DOCUMENTS);
            }
        } catch (e) {
            console.error('Error seeding data:', e);
        }
    }

    async reconnect(): Promise<boolean> {
        try {
            const db = await this.dbPromise;

            // Check saved storage mode preference
            const storageMode = await db.get(STORE_NAME, STORAGE_MODE_KEY);

            // If user previously chose internal storage, restore that
            if (storageMode === 'internal') {
                this.useInternalStorage = true;
                return true;
            }

            // If storage mode is 'folder', try to restore folder handle
            if (storageMode === 'folder') {
                const handle = await db.get(STORE_NAME, HANDLE_KEY);
                if (handle && typeof handle !== 'string') {
                    // Start with silent verification (force=false)
                    // We cannot prompt for permission during auto-connect (it triggers User Activation error)
                    const permission = await this.verifyPermission(handle, true, false);
                    if (permission) {
                        this.dirHandle = handle;
                        this.useInternalStorage = false;
                        return true;
                    }
                }
            }

            // No saved preference or permission denied
            return false;
        } catch (error) {
            console.error('Error reconnecting:', error);
        }
        return false;
    }

    async verifyPermission(fileHandle: FileSystemHandle, readWrite: boolean, force: boolean = true): Promise<boolean> {
        const options: FileSystemHandlePermissionDescriptor = {};
        if (readWrite) {
            options.mode = 'readwrite';
        }
        if ((await fileHandle.queryPermission(options)) === 'granted') {
            return true;
        }
        // Only request permission if we are allowed to (e.g. inside a click handler)
        if (force && (await fileHandle.requestPermission(options)) === 'granted') {
            return true;
        }
        return false;
    }

    isConnected(): boolean {
        return this.dirHandle !== null || this.useInternalStorage;
    }

    isInternal(): boolean {
        return this.useInternalStorage;
    }

    async getHighlights(): Promise<HighlightType[]> {
        return this.readJsonFile<HighlightType[]>(HIGHLIGHTS_FILE, []);
    }

    async saveHighlight(highlight: HighlightType): Promise<void> {
        const highlights = await this.getHighlights();
        const index = highlights.findIndex((h) => h.id === highlight.id);
        if (index >= 0) {
            highlights[index] = highlight;
        } else {
            highlights.push(highlight);
        }
        await this.writeJsonFile(HIGHLIGHTS_FILE, highlights);
    }

    async deleteHighlight(id: string): Promise<void> {
        const highlights = await this.getHighlights();
        const filtered = highlights.filter((h) => h.id !== id);
        await this.writeJsonFile(HIGHLIGHTS_FILE, filtered);
    }

    async getDocuments(): Promise<DocumentType[]> {
        return this.readJsonFile<DocumentType[]>(DOCUMENTS_FILE, []);
    }

    async saveDocument(doc: DocumentType): Promise<void> {
        const docs = await this.getDocuments();
        const index = docs.findIndex(d => d.id === doc.id);
        if (index >= 0) {
            docs[index] = doc;
        } else {
            docs.push(doc);
        }
        await this.writeJsonFile(DOCUMENTS_FILE, docs);
    }

    async deleteDocument(id: string): Promise<void> {
        const docs = await this.getDocuments();
        const filtered = docs.filter(d => d.id !== id);
        await this.writeJsonFile(DOCUMENTS_FILE, filtered);
    }

    private async readJsonFile<T>(filename: string, defaultValue: T): Promise<T> {
        if (this.useInternalStorage) {
            const db = await this.dbPromise;
            const data = await db.get(FILES_STORE, filename);
            return data !== undefined ? data as T : defaultValue;
        }

        if (!this.dirHandle) throw new Error('Not connected to file system');

        try {
            // Check if file exists first
            // getFileHandle will throw if not found unless {create:true}
            // We want to FAIL if not found so we know to seed
            // But usually we want create:true.
            // Let's rely on detection:
            // If we are calling from seedData, defaultValue is explicitly null to detect absence.

            // Wait, getFileHandle(create: true) creates an empty file? Yes.
            // If it creates an empty file, logic sees "" -> JSON.parse fails or returns default.

            // To detect "Fresh Install", we should try to open WITHOUT create: true first?
            // No, simpler: Read file. If content is empty string OR file missing (caught error), return default.
            // If default is null, we know it's missing.

            const fileHandle = await this.dirHandle.getFileHandle(filename, { create: true });
            const file = await fileHandle.getFile();
            const text = await file.text();
            if (!text.trim()) return defaultValue;
            return JSON.parse(text) as T;
        } catch (error) {
            // console.error(`Error reading ${filename}:`, error);
            // If file not found (and we didn't create), or other error
            return defaultValue;
        }
    }

    private async writeJsonFile<T>(filename: string, data: T): Promise<void> {
        if (this.useInternalStorage) {
            const db = await this.dbPromise;
            await db.put(FILES_STORE, data, filename);
            return;
        }

        if (!this.dirHandle) throw new Error('Not connected to file system');

        try {
            const fileHandle = await this.dirHandle.getFileHandle(filename, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(JSON.stringify(data, null, 2));
            await writable.close();
        } catch (error) {
            console.error(`Error writing ${filename}:`, error);
            throw error;
        }
    }
}

export const fileSystemService = new FileSystemService();
