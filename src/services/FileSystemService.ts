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
const DELETION_LOG_KEY = 'deletion_log';
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
        text: 'I already belong somewhere — but I can be at two places at once.',
        url: 'https://example.com/welcome', // social domain logic fallback
        title: 'Organization Tip',
        favicon: 'https://www.google.com/s2/favicons?domain=notion.so',
        createdAt: new Date().toISOString(),
        tags: [],
        color: 'var(--cat-social-bg)', // Yellow (Social)
    },
    {
        id: 'seed-2',
        text: 'I came from the web. Reshape me to make the idea take form.',
        url: 'https://example.com/source',
        title: 'Source Example',
        favicon: 'https://www.google.com/s2/favicons?domain=wikipedia.org',
        createdAt: new Date().toISOString(),
        tags: [],
        color: 'var(--cat-ai-bg)', // Blue (AI)
    },
    {
        id: 'seed-3',
        text: '👋 Welcome to Stitch. I’m a sticky note — drag me into a document.',
        url: 'https://example.com/organize',
        title: 'Welcome Guide',
        favicon: 'https://www.google.com/s2/favicons?domain=example.com',
        createdAt: new Date().toISOString(),
        tags: [],
        color: 'var(--cat-article-bg)', // Green (Article)
    }
];

const SEED_DOCUMENTS: DocumentType[] = [
    {
        id: 'doc-1',
        title: 'My First Project',
        url: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        content: ''
    },
    {
        id: 'doc-2',
        title: 'Reading List',
        url: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        content: '<p><span data-highlight-id="seed-1" class="highlight-marker" style="--highlight-color: var(--cat-social-bg)">I already belong somewhere — but I can be at two places at once.</span></p><p><span data-highlight-id="seed-2" class="highlight-marker" style="--highlight-color: var(--cat-ai-bg)">I came from the web. Reshape me to make the idea take form.</span></p>'
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

    async createWorkspace(initialHighlights?: HighlightType[]): Promise<WorkspaceMetadata> {
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

            // Sanitize highlights for CLONE (reset document associations)
            let sanitizedHighlights: HighlightType[] | undefined = initialHighlights;
            if (initialHighlights && initialHighlights.length > 0) {
                sanitizedHighlights = initialHighlights.map(h => ({
                    ...h,
                    documentId: null,
                    documentIds: []
                }));
            }

            await this.calculateActiveWorkspace(workspace, sanitizedHighlights);
            return workspace;
        } catch (error) {
            if ((error as Error).name === 'AbortError') {
                throw new Error('User cancelled folder selection');
            }
            throw error;
        }
    }

    async switchToWorkspace(id: string, sourceHighlights: HighlightType[] = []): Promise<boolean> {
        const workspaces = await this.getWorkspaces();
        const target = workspaces.find(w => w.id === id);
        if (!target) return false;

        const hasPermission = await this.verifyPermission(target.handle, true, true);
        if (hasPermission) {
            // Capture previous state for rollback
            const oldHandle = this.dirHandle;
            const oldId = this.currentWorkspaceId;
            const oldInternal = this.useInternalStorage;

            try {
                // Get Deletion Log
                const db = await this.dbPromise;
                const deletionLog = (await db.get(STORE_NAME, DELETION_LOG_KEY) as unknown as string[]) || [];

                // Perform switch (in-memory)
                this.dirHandle = target.handle;
                this.currentWorkspaceId = target.id;
                this.useInternalStorage = false;

                // Read TARGET highlights (to merge with SOURCE)
                const targetHighlights = await this.getHighlights() || [];

                // MERGE: Source + Target
                // Rule: If ID exists in both, prefer Source? Or prefer latest modified? 
                // Since we don't track 'modifiedAt', let's assume Source (active session) is fresher or equal.
                // Re-map to ensure uniqueness by ID.
                const combinedMap = new Map<string, HighlightType>();

                [...targetHighlights, ...sourceHighlights].forEach(h => {
                    // Filter out zombie notes (if in deletion log)
                    if (!deletionLog.includes(h.id)) {
                        combinedMap.set(h.id, h);
                    }
                });

                const mergedHighlights = Array.from(combinedMap.values());

                // Seed/Write the merged list to the TARGET workspace
                await this.seedData(mergedHighlights);

                // Persist State (Success path)
                await db.put(STORE_NAME, target.handle, HANDLE_KEY);
                await db.put(STORE_NAME, target.id, ACTIVE_WORKSPACE_ID_KEY);
                await db.put(STORE_NAME, 'folder', STORAGE_MODE_KEY);

                const list = await this.getWorkspaces();
                const updatedList = list.map(w => w.id === target.id ? { ...w, lastAccessed: new Date().toISOString() } : w);
                await db.put(STORE_NAME, updatedList, WORKSPACES_KEY);

                return true;
            } catch (error) {
                console.warn('Switch passed permission but failed validation/sync. Rolling back state.', error);

                // Rollback
                this.dirHandle = oldHandle;
                this.currentWorkspaceId = oldId;
                this.useInternalStorage = oldInternal;
                return false;
            }
        }
        return false;
    }

    private async calculateActiveWorkspace(ws: WorkspaceMetadata, initialHighlights?: HighlightType[]) {
        // Set memory state tentatively to allow seedData to attempt I/O
        this.dirHandle = ws.handle;
        this.currentWorkspaceId = ws.id;
        this.useInternalStorage = false;

        // Verify I/O (and seed if needed) - THIS THROWS IF INVALID
        await this.seedData(initialHighlights);

        // ONLY persist if verification succeeded
        const db = await this.dbPromise;
        await db.put(STORE_NAME, ws.handle, HANDLE_KEY); // Keep legacy updated
        await db.put(STORE_NAME, ws.id, ACTIVE_WORKSPACE_ID_KEY);
        await db.put(STORE_NAME, 'folder', STORAGE_MODE_KEY);

        const list = await this.getWorkspaces();
        const updatedList = list.map(w => w.id === ws.id ? { ...w, lastAccessed: new Date().toISOString() } : w);
        await db.put(STORE_NAME, updatedList, WORKSPACES_KEY);
    }

    async removeWorkspace(id: string): Promise<void> {

        const db = await this.dbPromise;
        const list = (await db.get(STORE_NAME, WORKSPACES_KEY) as WorkspaceMetadata[]) || [];
        const updatedList = list.filter(w => w.id !== id);
        await db.put(STORE_NAME, updatedList, WORKSPACES_KEY);

        // If we just removed the ACTIVE workspace, we should probably disconnect or switch?
        // But for "Lazy Validation", we are likely removing a workspace we failed to switch TO.
        // So the current active one (if any) is safe.
        // If we ARE active on it (somehow), we should probably disconnect.
        if (this.currentWorkspaceId === id) {
            console.warn('Removed active workspace! Disconnecting.');
            // This case shouldn't happen via the "switch failed" flow, but for robustness:
            // await this.disconnect();
        } else {
            // Removed workspace was not active. Safe.
        }
    }

    async recordDeletion(id: string): Promise<void> {
        const db = await this.dbPromise;
        const log = (await db.get(STORE_NAME, DELETION_LOG_KEY) as unknown as string[]) || [];
        if (!log.includes(id)) {
            log.push(id);
            await db.put(STORE_NAME, log as unknown as WorkspaceMetadata[], DELETION_LOG_KEY);
        }
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

    private async seedData(initialHighlights?: HighlightType[]): Promise<void> {
        // If initialHighlights provided (Sync or Clone), we always WRITE using them.
        if (initialHighlights && initialHighlights.length > 0) {

            await this.writeJsonFile(HIGHLIGHTS_FILE, initialHighlights);
        } else {
            // Default Seeding or Migration
            let highlights = await this.readJsonFile<HighlightType[]>(HIGHLIGHTS_FILE, null as any);

            if (!highlights) {

                // Default Seed logic
                const seededHighlights = SEED_HIGHLIGHTS.map(h => ({
                    ...h,
                    documentId: h.id === 'seed-3' ? null : 'doc-2'
                }));
                await this.writeJsonFile(HIGHLIGHTS_FILE, seededHighlights);
            } else {
                // MIGRATION: Check if we have legacy hex colors for seed notes and update them
                let needsUpdate = false;
                const legacyColors: Record<string, string> = {
                    '#fef3c7': 'var(--cat-social-bg)',
                    '#dbeafe': 'var(--cat-ai-bg)',
                    '#dcfce7': 'var(--cat-article-bg)'
                };

                highlights = highlights.map(h => {
                    // Only target known seed IDs to avoid messing with user data too much, 
                    // though generally migrating these hexes is safe if they match exactly.
                    if ((h.id === 'seed-1' || h.id === 'seed-2' || h.id === 'seed-3') && h.color && legacyColors[h.color]) {
                        needsUpdate = true;
                        return { ...h, color: legacyColors[h.color] };
                    }
                    return h;
                });

                if (needsUpdate) {

                    await this.writeJsonFile(HIGHLIGHTS_FILE, highlights);
                }
            }
        }

        // Check if documents exist
        const docs = await this.readJsonFile<DocumentType[]>(DOCUMENTS_FILE, null as any);
        if (!docs) {

            // If we cloned highlights, we probably want NO documents (clean slate), 
            // or just the default seeds but empty?
            // User request: "Documents will remain empty".
            // So if initialHighlights were passed, we write EMPTY list.
            // If NOT passed (true fresh install), we write SEED_DOCUMENTS.

            if (initialHighlights && initialHighlights.length > 0) {
                await this.writeJsonFile(DOCUMENTS_FILE, []);
            } else {
                await this.writeJsonFile(DOCUMENTS_FILE, SEED_DOCUMENTS);
            }
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
                        try {
                            this.dirHandle = handle;
                            this.useInternalStorage = false;

                            // Try to seed/access data to verify handle is actually valid (folder exists)
                            await this.seedData();
                            return true;
                        } catch (e) {
                            console.warn('Reconnection failed - Handle likely stale/deleted:', e);
                            this.dirHandle = null;
                            // Optionally clear the bad handle from DB?
                            // await this.disconnect(); // This clears everything. Maybe just return false.
                            return false;
                        }
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
