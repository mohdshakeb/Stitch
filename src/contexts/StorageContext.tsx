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
    exportData: () => Promise<void>;
    extensionId: string | null;
    isExtensionAvailable: boolean;
    // Workspaces
    workspaces: WorkspaceMetadata[];
    activeWorkspaceId: string | null;
    createWorkspace: () => Promise<void>;
    switchWorkspace: (id: string) => Promise<void>;
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

    const refreshData = useCallback(async () => {
        if (!fileSystemService.isConnected()) return;
        try {
            // ... (keep existing extension sync logic same) ...
            if (extensionId && typeof chrome !== 'undefined' && chrome.runtime) {
                // Sent protocol message to extension to notify of data update
                // The actual payload logic was lost, but usually we just notify to re-fetch
                chrome.runtime.sendMessage(extensionId, { type: 'HIGHLIGHTS_UPDATED' });
            } else {
                setIsExtensionAvailable(false);
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
    }, [extensionId]);

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
            await fileSystemService.createWorkspace();
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

    const switchWorkspace = async (id: string) => {
        setIsConnecting(true);
        try {
            const success = await fileSystemService.switchToWorkspace(id);
            if (success) {
                await refreshData();
            } else {
                // Should not happen if ID is valid, but maybe permission denied and not forced? 
                // Service handles prompt.
            }
        } catch (error) {
            console.error('Switch failed:', error);
        } finally {
            setIsConnecting(false);
        }
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

            // Sync Logic: Check for deleted highlights
            if (typeof updates.content === 'string') {
                // ... content sync logic (KEEP SAME) ...
                const content = updates.content;
                const presentHighlightIds = new Set<string>();
                const regex = /data-highlight-id="([^"]+)"/g;
                let match;
                while ((match = regex.exec(content)) !== null) {
                    presentHighlightIds.add(match[1]);
                }

                const allHighlights = await fileSystemService.getHighlights();
                const assignedHighlights = allHighlights.filter(h =>
                    (h.documentIds && h.documentIds.includes(id)) || h.documentId === id
                );

                const highlightsToUpdate: HighlightType[] = [];

                for (const h of assignedHighlights) {
                    if (!presentHighlightIds.has(h.id)) {
                        let newDocIds = (h.documentIds || []).filter(dId => dId !== id);
                        const newLegacyId = newDocIds.length > 0 ? newDocIds[newDocIds.length - 1] : null;

                        highlightsToUpdate.push({
                            ...h,
                            documentIds: newDocIds,
                            documentId: newLegacyId
                        });
                    }
                }

                if (highlightsToUpdate.length > 0) {
                    for (const h of highlightsToUpdate) {
                        await fileSystemService.saveHighlight(h);
                    }
                }
            }
            await refreshData();
        }
    };

    const exportData = async () => {
        // ... export logic (KEEP SAME) ...
        try {
            const data = await fileSystemService.exportData();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `highlight-export-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Export failed:', error);
            alert('Failed to export data');
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
                exportData,
                extensionId,
                isExtensionAvailable,
                // Workspaces
                workspaces,
                activeWorkspaceId,
                createWorkspace,
                switchWorkspace
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
