import React, { forwardRef } from 'react';
import DocumentPreviewCard from '@/components/DocumentPreviewCard';
import { DocumentType, HighlightType } from '@/services/FileSystemService';

interface DocumentFeedProps {
    documents: DocumentType[];
    highlights: HighlightType[];
    activeDocId: string | null;
    newlyCreatedDocId: string | null;
    handleDeleteDocument: (id: string, e: React.MouseEvent) => void;
    handleTitleUpdate: (id: string, newTitle: string) => void;
    handleCreateDocument: () => void;
}

const DocumentFeed = forwardRef<HTMLDivElement, DocumentFeedProps>(({
    documents,
    highlights,
    activeDocId,
    newlyCreatedDocId,
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
            className={`document-scroll-container flex-[0.8] h-screen flex flex-col items-center gap-4 no-scrollbar ${documents.length === 0 ? 'overflow-y-hidden snap-none pt-0 pb-0 justify-center' : 'overflow-y-auto snap-y snap-mandatory pt-[calc(50vh-318px)] pb-[50vh] justify-start'}`}
        >
            {documents.map((doc) => (
                <DocumentPreviewCard
                    key={doc.id}
                    // @ts-ignore
                    doc={doc}
                    highlights={highlights.filter(h => getDocIds(h).includes(doc.id))}
                    isActive={activeDocId === doc.id}
                    onDelete={handleDeleteDocument}
                    onTitleUpdate={handleTitleUpdate}
                    autoFocus={doc.id === newlyCreatedDocId}
                />
            ))}

            {documents.length === 0 && (
                <div className="w-full max-w-[650px] flex flex-col items-center px-5">
                    <div
                        onClick={handleCreateDocument}
                        className="w-[450px] max-w-full aspect-[1/1.414] border-2 border-dashed border-border rounded-sm flex flex-col items-center justify-center gap-4 cursor-pointer text-muted transition-all duration-200 bg-transparent hover:border-primary hover:text-primary hover:bg-primary/5"
                    >
                        <div className="w-12 h-12 rounded-full border-2 border-current flex items-center justify-center text-2xl font-light">
                            +
                        </div>
                        <span className="text-base font-medium">Create a Document</span>
                    </div>
                </div>
            )}
        </div>
    );
});

DocumentFeed.displayName = 'DocumentFeed';

export default DocumentFeed;
