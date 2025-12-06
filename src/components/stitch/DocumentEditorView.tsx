import React from 'react';
import { useRouter } from 'next/navigation';
import DocumentEditor from '@/components/DocumentEditor';
import Header from '@/components/Header';
import SourcesSidebar from '@/components/SourcesSidebar';
import { DocumentType, HighlightType } from '@/services/FileSystemService';

interface DocumentEditorViewProps {
    editingDoc: DocumentType | undefined;
    documents: DocumentType[];
    docHighlights: HighlightType[];
    editingDocId: string;
}

export default function DocumentEditorView({
    editingDoc,
    documents,
    docHighlights,
    editingDocId
}: DocumentEditorViewProps) {
    const router = useRouter();

    if (!editingDoc && documents.length > 0) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <Header variant="back" />
                <p>Document not found (ID: {editingDocId})</p>
                <button
                    onClick={() => {
                        router.push('/');
                    }}
                    style={{ marginTop: '1rem', padding: '8px 16px', cursor: 'pointer' }}
                >
                    Go Back
                </button>
            </div>
        );
    }

    if (editingDoc) {
        return (
            <div style={{
                display: 'flex',
                minHeight: '100vh',
                backgroundColor: 'hsl(var(--background))',
                gap: '24px',
                padding: '80px var(--space-4) var(--space-8)',
                justifyContent: 'center',
                alignItems: 'flex-start',
                minWidth: '1200px',
            }}>
                <Header variant="back" />
                <div style={{
                    flex: '1 1 auto',
                    maxWidth: '800px',
                    minWidth: '320px',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                }}>
                    <DocumentEditor
                        documentId={editingDoc.id}
                        initialTitle={editingDoc.title}
                        initialContent={editingDoc.content || ''}
                    />
                </div>

                {docHighlights.length > 0 && (
                    <div style={{
                        flex: '0 1 280px',
                        minWidth: '220px',
                        position: 'sticky',
                        top: '80px',
                        maxHeight: 'calc(100vh - 100px)',
                        overflowY: 'auto',
                        scrollbarWidth: 'none',
                    }}>
                        <SourcesSidebar highlights={docHighlights.map(h => ({
                            ...h,
                            title: h.title || null,
                            favicon: h.favicon || null,
                            documentId: h.documentId || null
                        }))} />
                    </div>
                )}
            </div>
        );
    }

    // Fallback for loading state (usually handled by parent, but safe to keep)
    return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
            Loading document...
        </div>
    );
}
