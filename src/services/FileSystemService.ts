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
    documentId?: string | null;
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

export class FileSystemService {
    private dirHandle: FileSystemDirectoryHandle | null = null;
    constructor() {
        // Lazy init
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
            const fileHandle = await this.dirHandle.getFileHandle(filename, { create: true });
            const file = await fileHandle.getFile();
            const text = await file.text();
            if (!text.trim()) return defaultValue;
            return JSON.parse(text) as T;
        } catch (error) {
            console.error(`Error reading ${filename}:`, error);
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
