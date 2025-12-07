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
const WORKING_HANDLE_KEY = 'active_handle'; // Key for the currently active workspace handle
const WORKSPACES_KEY = 'workspaces_list';
const ACTIVE_WORKSPACE_ID_KEY = 'active_workspace_id';

export interface WorkspaceMetadata {
    id: string;
    name: string;
    handle: FileSystemDirectoryHandle;
    lastAccessed: string;
}

interface HighlightDB extends DBSchema {
    handles: {
        key: string;
        value: FileSystemDirectoryHandle | string | WorkspaceMetadata[];
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
    private currentWorkspaceId: string | null = null;

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
            this._dbPromise = openDB<HighlightDB>(DB_NAME, 3, { // Bump version to 3
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

    // --- WORKSPACE METHODS ---

    async getWorkspaces(): Promise<WorkspaceMetadata[]> {
        const db = await this.dbPromise;
        const list = await db.get(STORE_NAME, WORKSPACES_KEY) as WorkspaceMetadata[] | undefined;
        return list || [];
    }

    async getActiveWorkspaceId(): Promise<string | null> {
        const db = await this.dbPromise;
        return (await db.get(STORE_NAME, ACTIVE_WORKSPACE_ID_KEY) as string) || null;
    }

    async createWorkspace(): Promise<WorkspaceMetadata> {
        if (typeof window.showDirectoryPicker !== 'function') {
            throw new Error('File System Access API is not available.');
        }

        try {
            const handle = await window.showDirectoryPicker({
                mode: 'readwrite',
                id: 'highlight-app-data',
            });

            const workspace: WorkspaceMetadata = {
                id: crypto.randomUUID(),
                name: handle.name,
                handle: handle,
                lastAccessed: new Date().toISOString()
            };

            const db = await this.dbPromise;
            const existing = (await db.get(STORE_NAME, WORKSPACES_KEY) as WorkspaceMetadata[]) || [];

            // Avoid duplicates by simple name check if needed, or just append
            await db.put(STORE_NAME, [...existing, workspace], WORKSPACES_KEY);

            await this.calculateActiveWorkspace(workspace);
            return workspace;
        } catch (error) {
            if ((error as Error).name === 'AbortError') {
                throw new Error('User cancelled folder selection');
            }
            throw error;
        }
    }

    async switchToWorkspace(id: string): Promise<boolean> {
        const workspaces = await this.getWorkspaces();
        const target = workspaces.find(w => w.id === id);
        if (!target) return false;

        const hasPermission = await this.verifyPermission(target.handle, true, true);
        if (hasPermission) {
            await this.calculateActiveWorkspace(target);
            return true;
        }
        return false;
    }

    private async calculateActiveWorkspace(ws: WorkspaceMetadata) {
        this.dirHandle = ws.handle;
        this.currentWorkspaceId = ws.id;
        this.useInternalStorage = false;

        const db = await this.dbPromise;
        await db.put(STORE_NAME, ws.handle, HANDLE_KEY); // Keep legacy updated
        await db.put(STORE_NAME, ws.id, ACTIVE_WORKSPACE_ID_KEY);
        await db.put(STORE_NAME, 'folder', STORAGE_MODE_KEY);

        const list = await this.getWorkspaces();
        const updatedList = list.map(w => w.id === ws.id ? { ...w, lastAccessed: new Date().toISOString() } : w);
        await db.put(STORE_NAME, updatedList, WORKSPACES_KEY);

        await this.seedData();
    }

    async connect(): Promise<void> {
        await this.createWorkspace();
    }

    async enableInternalStorage(): Promise<void> {
        this.useInternalStorage = true;
        this.dirHandle = null;
        this.currentWorkspaceId = null;

        const db = await this.dbPromise;
        await db.delete(STORE_NAME, HANDLE_KEY);
        // We don't delete workspaces list, just unset active
        await db.delete(STORE_NAME, ACTIVE_WORKSPACE_ID_KEY);
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

    // -------------------------

    async reconnect(): Promise<boolean> {
        try {
            const db = await this.dbPromise;

            // Check saved storage mode preference
            const storageMode = await db.get(STORE_NAME, STORAGE_MODE_KEY);

            // If user previously chose internal storage, restore that
            if (storageMode === 'internal') {
                this.useInternalStorage = true;
                await this.seedData();
                return true;
            }

            // If storage mode is 'folder', try to restore folder handle
            if (storageMode === 'folder') {
                const handle = await db.get(STORE_NAME, HANDLE_KEY);
                if (handle && typeof handle !== 'string' && !Array.isArray(handle)) { // Check isn't array
                    // It is a handle
                    const h = handle as FileSystemDirectoryHandle;
                    const permission = await this.verifyPermission(h, true, false);
                    if (permission) {
                        this.dirHandle = handle;
                        this.useInternalStorage = false;
                        await this.seedData();
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

    async disconnect(): Promise<void> {
        this.dirHandle = null;
        this.useInternalStorage = false;
        this.currentWorkspaceId = null;
        const db = await this.dbPromise;
        // Don't clear EVERYTHING, just active state?
        // User asked for "Disconnect" usually implies "Close current folder"
        // But the original code cleared STORE_NAME completely.
        // Let's keep it safe: clear active state.

        // Wait, "Disconnect" in UI means "Close folder".
        // Use case: Resetting app state.
        // If we want to keep workspaces, we shouldn't clear STORE_NAME.
        // But let's stick to original behavior for now: Logout.
        await db.clear(STORE_NAME);
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

    async exportData(): Promise<AppData> {
        const highlights = await this.getHighlights();
        const documents = await this.getDocuments();
        return { highlights, documents };
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
