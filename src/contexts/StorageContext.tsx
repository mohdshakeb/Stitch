'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fileSystemService, HighlightType, DocumentType, WorkspaceMetadata } from '../services/FileSystemService';

interface StorageContextType {
    isConnected: boolean;
    isConnecting: boolean;
    highlights: HighlightType[];
    documents: DocumentType[];
    connect: () => Promise<void>;
    disconnect: () => Promise<void>;
    connectInternal: () => Promise<void>;
    addHighlight: (highlight: HighlightType) => Promise<void>;
    removeHighlight: (id: string) => Promise<void>;
    addDocument: (doc: DocumentType) => Promise<void>;
    removeDocument: (id: string) => Promise<void>;
    updateDocument: (id: string, updates: Partial<DocumentType>) => Promise<void>;
    refreshData: () => Promise<void>;

    extensionId: string | null;
    isExtensionAvailable: boolean;
    // Workspaces
    workspaces: WorkspaceMetadata[];
    activeWorkspaceId: string | null;
    createWorkspace: () => Promise<void>;
    switchWorkspace: (id: string) => Promise<boolean>;
    removeWorkspace: (id: string) => Promise<void>;
}

const StorageContext = createContext<StorageContextType | undefined>(undefined);

export function StorageProvider({ children }: { children: React.ReactNode }) {
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(true);
    const [highlights, setHighlights] = useState<HighlightType[]>([]);
    const [documents, setDocuments] = useState<DocumentType[]>([]);
    const [extensionId, setExtensionId] = useState<string | null>(process.env.NEXT_PUBLIC_EXTENSION_ID || null);
    const [isExtensionAvailable, setIsExtensionAvailable] = useState(false);

    // Workspace State
    const [workspaces, setWorkspaces] = useState<WorkspaceMetadata[]>([]);
    const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);



    // --- Extension Sync Logic ---
    const syncExtensionData = useCallback(async () => {
        if (!extensionId || typeof chrome === 'undefined' || !chrome.runtime || !fileSystemService.isConnected()) return;

        try {

            const response = await new Promise<{ highlights: HighlightType[] }>((resolve, reject) => {
                // Set a timeout to avoid hanging forever if extension doesn't respond
                const timeout = setTimeout(() => {
                    resolve({ highlights: [] });
                }, 2000);

                try {
                    chrome.runtime.sendMessage(extensionId, { type: 'GET_PENDING' }, (response) => {
                        clearTimeout(timeout);
                        if (chrome.runtime.lastError) {
                            console.warn('Extension sync error:', chrome.runtime.lastError);
                            resolve({ highlights: [] }); // Resolve empty on error
                        } else {
                            resolve(response);
                        }
                    });
                } catch (e) {
                    clearTimeout(timeout);
                    resolve({ highlights: [] });
                }
            });

            if (response && response.highlights && Array.isArray(response.highlights) && response.highlights.length > 0) {


                // Save locally
                for (const h of response.highlights) {
                    await fileSystemService.saveHighlight(h);
                }

                // Clear from extension
                // Use a fire-and-forget approach or short timeout for clear
                chrome.runtime.sendMessage(extensionId, { type: 'CLEAR_PENDING' });

                return true;
            }
        } catch (error) {
            console.error('Failed to sync with extension:', error);
        }
        return false;
    }, [extensionId]);

    const refreshData = useCallback(async () => {
        if (!fileSystemService.isConnected()) return;
        try {
            // 1. Sync from Extension (Pull)
            // We do this BEFORE loading from FS so we include just-imported items
            if (extensionId) {
                await syncExtensionData();
            }

            // ... (keep existing push logic same) ...
            if (extensionId && typeof chrome !== 'undefined' && chrome.runtime) {
                // Sent protocol message to extension to notify of data update
                chrome.runtime.sendMessage(extensionId, { type: 'HIGHLIGHTS_UPDATED' });
            }

            // 2. Load from File System
            const h = await fileSystemService.getHighlights();
            const d = await fileSystemService.getDocuments();
            setHighlights(h);
            setDocuments(d);

            // 3. Load Workspaces info
            const ws = await fileSystemService.getWorkspaces();
            const active = await fileSystemService.getActiveWorkspaceId();
            setWorkspaces(ws);
            setActiveWorkspaceId(active);

        } catch (error) {
            console.error('Failed to refresh data:', error);
        }
    }, [extensionId, syncExtensionData]);

    // ... (Protocol useEffects same) ...
    useEffect(() => {
        // 1. Listen for ID from content script
        const handleMessage = (event: MessageEvent) => {
            if (event.source !== window) return;
            if (event.data?.type === 'HIGHLIGHT_EXTENSION_ID' && event.data?.id) {
                setExtensionId(event.data.id);
                setIsExtensionAvailable(true);
            }
        };
        window.addEventListener('message', handleMessage);
        window.postMessage({ type: 'HIGHLIGHT_EXTENSION_PING' }, '*');
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    useEffect(() => {
        const init = async () => {
            // ...
            // Attempt silent reconnection
            const reconnected = await fileSystemService.reconnect();
            if (reconnected) {
                setIsConnected(true);
                await refreshData();
            }
            setIsConnecting(false);
        };
        init();
    }, [refreshData]);

    // ... (Visibility Effect same) ...
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && fileSystemService.isConnected()) {
                refreshData();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [refreshData]);

    const connect = async () => {
        // Legacy Connect is now Create First Workspace
        await createWorkspace();
    };

    const createWorkspace = async () => {
        setIsConnecting(true);
        try {
            // Pass current highlights to clone them into the new workspace
            await fileSystemService.createWorkspace(highlights);
            setIsConnected(true);
            await refreshData();
        } catch (error) {
            console.error('Workspace creation failed:', error);
            if ((error as Error).message !== 'User cancelled folder selection') {
                alert((error as Error).message);
            }
        } finally {
            setIsConnecting(false);
        }
    };

    const switchWorkspace = async (id: string): Promise<boolean> => {
        setIsConnecting(true);
        try {
            // Pass current highlights to sync them to the target workspace
            const success = await fileSystemService.switchToWorkspace(id, highlights);
            if (success) {
                await refreshData();
                return true;
            } else {
                return false;
            }
        } catch (error) {
            console.error('Switch failed:', error);
            return false;
        } finally {
            setIsConnecting(false);
        }
    };

    const removeWorkspace = async (id: string) => {

        await fileSystemService.removeWorkspace(id);

        await refreshData();

    };

    const disconnect = async () => {
        try {
            await fileSystemService.disconnect();
            setIsConnected(false);
            setHighlights([]);
            setDocuments([]);
            setWorkspaces([]);
            setActiveWorkspaceId(null);
        } catch (error) {
            console.error('Disconnect failed:', error);
        }
    };

    // ... (rest of methods same: connectInternal, addHighlight, etc.) ...
    const connectInternal = async () => {
        setIsConnecting(true);
        try {
            await fileSystemService.enableInternalStorage();
            setIsConnected(true);
            await refreshData();
        } catch (error) {
            console.error('Internal connection failed:', error);
        } finally {
            setIsConnecting(false);
        }
    };

    const addHighlight = async (highlight: HighlightType) => {
        await fileSystemService.saveHighlight(highlight);
        await refreshData();
    };

    const removeHighlight = async (id: string) => {
        // Record deletion globally for sync
        await fileSystemService.recordDeletion(id);

        await fileSystemService.deleteHighlight(id);
        await refreshData();
    };

    const addDocument = async (doc: DocumentType) => {
        try {
            await fileSystemService.saveDocument(doc);
            await refreshData();
        } catch (error) {
            if ((error as Error).name === 'NotFoundError') {
                alert('Connection to folder lost. Please reconnect.');
                await disconnect();
            }
        }
    };

    const removeDocument = async (id: string) => {
        await fileSystemService.deleteDocument(id);
        await refreshData();
    };

    const updateDocument = async (id: string, updates: Partial<DocumentType>) => {
        const doc = documents.find(d => d.id === id);
        if (doc) {
            const updated = { ...doc, ...updates, updatedAt: new Date().toISOString() };
            await fileSystemService.saveDocument(updated);

            // Sync Logic: Check for deleted highlights - DISABLED for "Citation Manager" model
            // Highlights are only removed via explicit "Unlink" action in the panel.
            await refreshData();
        }
    };



    return (
        <StorageContext.Provider
            value={{
                isConnected,
                isConnecting,
                connect,
                disconnect,
                connectInternal,
                highlights,
                documents,
                refreshData,
                addHighlight,
                removeHighlight,
                addDocument,
                removeDocument,
                updateDocument,

                extensionId,
                isExtensionAvailable,
                // Workspaces
                workspaces,
                activeWorkspaceId,
                createWorkspace,
                switchWorkspace,
                removeWorkspace
            }}
        >
            {children}
        </StorageContext.Provider>
    );
}

export function useStorage() {
    const context = useContext(StorageContext);
    if (context === undefined) {
        throw new Error('useStorage must be used within a StorageProvider');
    }
    return context;
}
