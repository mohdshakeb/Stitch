import React, { forwardRef } from 'react';
import DocumentPreviewCard from '@/components/DocumentPreviewCard';
import { DocumentType, HighlightType } from '@/services/FileSystemService';

interface DocumentFeedProps {
    documents: DocumentType[];
    highlights: HighlightType[];
    activeDocId: string | null;
    dragOverDocId: string | null;
    newlyCreatedDocId: string | null;
    handleDragOverDoc: (e: React.DragEvent, docId: string) => void;
    handleDragLeaveDoc: (e: React.DragEvent) => void;
    handleDropOnDoc: (e: React.DragEvent, docId: string) => void;
    handleDeleteDocument: (id: string, e: React.MouseEvent) => void;
    handleTitleUpdate: (id: string, newTitle: string) => void;
    handleCreateDocument: () => void;
}

const DocumentFeed = forwardRef<HTMLDivElement, DocumentFeedProps>(({
    documents,
    highlights,
    activeDocId,
    dragOverDocId,
    newlyCreatedDocId,
    handleDragOverDoc,
    handleDragLeaveDoc,
    handleDropOnDoc,
    handleDeleteDocument,
    handleTitleUpdate,
    handleCreateDocument
}, ref) => {

    // Helper to get doc ids from highlight (duplicated safe helper)
    const getDocIds = (h: HighlightType) => {
        if (h.documentIds && h.documentIds.length > 0) return h.documentIds;
        if (h.documentId) return [h.documentId];
        return [];
    };

    return (
        <div
            ref={ref}
            className="document-scroll-container"
            style={{
                flex: 0.8,
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px',
                scrollbarWidth: 'none',
                // Conditional styles for empty state
                overflowY: documents.length === 0 ? 'hidden' : 'auto',
                scrollSnapType: documents.length === 0 ? 'none' : 'y mandatory',
                paddingTop: documents.length === 0 ? 0 : 'calc(50vh - 318px)',
                paddingBottom: documents.length === 0 ? 0 : '50vh',
                justifyContent: documents.length === 0 ? 'center' : 'flex-start',
            }}
        >
            {documents.map((doc) => (
                <DocumentPreviewCard
                    key={doc.id}
                    // @ts-ignore
                    doc={doc}
                    highlights={highlights.filter(h => getDocIds(h).includes(doc.id))}
                    isActive={activeDocId === doc.id}
                    isDragOver={dragOverDocId === doc.id}
                    onDragOver={handleDragOverDoc}
                    onDragLeave={handleDragLeaveDoc}
                    onDrop={handleDropOnDoc}
                    onDelete={handleDeleteDocument}
                    onTitleUpdate={handleTitleUpdate}
                    autoFocus={doc.id === newlyCreatedDocId}
                />
            ))}

            {documents.length === 0 && (
                <div style={{
                    width: '100%',
                    maxWidth: '650px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '0 20px',
                }}>
                    <div
                        onClick={handleCreateDocument}
                        style={{
                            width: '450px', // Fixed width to prevent collapse
                            maxWidth: '100%',
                            aspectRatio: '1 / 1.414',
                            border: '2px dashed hsl(var(--border))',
                            borderRadius: 'var(--radius-sm)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '16px',
                            cursor: 'pointer',
                            color: 'hsl(var(--muted))',
                            transition: 'all 0.2s ease',
                            backgroundColor: 'transparent',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'hsl(var(--primary))';
                            e.currentTarget.style.color = 'hsl(var(--primary))';
                            e.currentTarget.style.backgroundColor = 'hsl(var(--primary) / 0.05)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'hsl(var(--border))';
                            e.currentTarget.style.color = 'hsl(var(--muted))';
                            e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                    >
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            border: '2px solid currentColor',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '24px',
                            fontWeight: 300,
                        }}>
                            +
                        </div>
                        <span style={{ fontSize: '1rem', fontWeight: 500 }}>Create a Document</span>
                    </div>
                </div>
            )}
        </div>
    );
});

DocumentFeed.displayName = 'DocumentFeed';

export default DocumentFeed;
