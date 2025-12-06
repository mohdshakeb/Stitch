'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fileSystemService, HighlightType, DocumentType } from '../services/FileSystemService';

interface StorageContextType {
    isConnected: boolean;
    isConnecting: boolean;
    highlights: HighlightType[];
    documents: DocumentType[];
    connect: () => Promise<void>;
    connectInternal: () => Promise<void>;
    addHighlight: (highlight: HighlightType) => Promise<void>;
    removeHighlight: (id: string) => Promise<void>;
    addDocument: (doc: DocumentType) => Promise<void>;
    removeDocument: (id: string) => Promise<void>;
    updateDocument: (id: string, updates: Partial<DocumentType>) => Promise<void>;
    refreshData: () => Promise<void>;
    extensionId: string | null;
    isExtensionAvailable: boolean;
}

const StorageContext = createContext<StorageContextType | undefined>(undefined);

export function StorageProvider({ children }: { children: React.ReactNode }) {
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(true); // Start as connecting to check DB
    const [highlights, setHighlights] = useState<HighlightType[]>([]);
    const [documents, setDocuments] = useState<DocumentType[]>([]);
    const [extensionId, setExtensionId] = useState<string | null>(process.env.NEXT_PUBLIC_EXTENSION_ID || null);
    const [isExtensionAvailable, setIsExtensionAvailable] = useState(false);

    const refreshData = useCallback(async () => {
        if (!fileSystemService.isConnected()) return;
        try {
            // 1. Sync from Extension Storage (Messaging)
            // Use dynamically discovered ID or env var
            if (extensionId && typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
                try {
                    const response = await new Promise<any>((resolve, reject) => {
                        try {
                            chrome.runtime.sendMessage(extensionId, { type: 'GET_PENDING' }, (res) => {
                                if (chrome.runtime.lastError) {
                                    // Don't reject, just resolve null - legitimate case if extension not running
                                    console.log('Extension check:', chrome.runtime.lastError.message);
                                    setIsExtensionAvailable(false);
                                    resolve(null);
                                } else {
                                    console.log('Extension check success. Response:', res);
                                    setIsExtensionAvailable(true);
                                    resolve(res);
                                }
                            });
                        } catch (e) {
                            resolve(null);
                        }
                    });

                    if (response && response.highlights && response.highlights.length > 0) {
                        const pending = response.highlights;
                        console.log(`Found ${pending.length} pending highlights from extension. Importing...`);

                        for (const h of pending) {
                            await fileSystemService.saveHighlight(h);
                        }

                        // Clear pending in extension
                        await new Promise<void>((resolve) => {
                            chrome.runtime.sendMessage(extensionId, { type: 'CLEAR_PENDING' }, () => resolve());
                        });
                    }
                } catch (e) {
                    console.log('Extension sync skipped (not connected).');
                    // setIsExtensionAvailable(false); // Optional: we might not want to set false just on catch, but probably safe
                }
            } else {
                // No ID or no runtime
                setIsExtensionAvailable(false);
            }

            // 2. Load from File System
            const h = await fileSystemService.getHighlights();
            const d = await fileSystemService.getDocuments();
            setHighlights(h);
            setDocuments(d);
        } catch (error) {
            console.error('Failed to refresh data:', error);
        }
    }, [extensionId]);

    // Protocol: Auto-Discover Extension ID
    useEffect(() => {
        // 1. Listen for ID from content script
        const handleMessage = (event: MessageEvent) => {
            if (event.source !== window) return;
            if (event.data?.type === 'HIGHLIGHT_EXTENSION_ID' && event.data?.id) {
                console.log('Extension ID discovered:', event.data.id);
                setExtensionId(event.data.id);
                setIsExtensionAvailable(true);
            }
        };
        window.addEventListener('message', handleMessage);

        // 2. Ping extension in case it loaded before us
        window.postMessage({ type: 'HIGHLIGHT_EXTENSION_PING' }, '*');

        return () => window.removeEventListener('message', handleMessage);
    }, []);

    useEffect(() => {
        const init = async () => {
            try {
                // Attempt silent reconnection
                const reconnected = await fileSystemService.reconnect();
                if (reconnected) {
                    setIsConnected(true);
                    await refreshData();
                }
            } catch (e) {
                console.log('Auto-connect skipped:', (e as Error).message);
            } finally {
                setIsConnecting(false);
            }
        };
        init();
    }, [refreshData]); // Re-create when ID is discovered

    // Auto-refresh when tab becomes visible (e.g., user switches back after saving highlight)
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
        setIsConnecting(true);
        try {
            await fileSystemService.connect();
            setIsConnected(true);
            await refreshData();
        } catch (error) {
            console.error('Connection failed:', error);
            alert((error as Error).message);
        } finally {
            setIsConnecting(false);
        }
    };

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
        await fileSystemService.saveDocument(doc);
        await refreshData();
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
            await refreshData();
        }
    };

    return (
        <StorageContext.Provider
            value={{
                isConnected,
                isConnecting,
                connect,
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
                isExtensionAvailable
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
