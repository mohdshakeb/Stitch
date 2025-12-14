import React from 'react';
import HighlightCard from '@/components/HighlightCard';
import { HighlightType, DocumentType } from '@/services/FileSystemService';
import { Category, getCategoryFromUrl } from '@/utils/categories';

interface HighlightFeedProps {
    highlights: HighlightType[];
    documents: DocumentType[];
    activeDocId: string | null;
    selectedCategory: Category | null;
    handleDeleteHighlight: (id: string, e: React.MouseEvent) => void;
    handleMoveHighlight: () => void;
    handleDragStart: (e: React.DragEvent, highlightId: string) => void;
}

export default function HighlightFeed({
    highlights,
    documents,
    activeDocId,
    selectedCategory,
    handleDeleteHighlight,
    handleMoveHighlight,
    handleDragStart
}: HighlightFeedProps) {

    // Filter logic logic inside the component
    const filteredHighlights = selectedCategory
        ? highlights.filter(h => getCategoryFromUrl(h.url) === selectedCategory)
        : [...highlights];

    // Sort by latest -> oldest
    filteredHighlights.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Helper to normalize document IDs (duplicated slightly but safe)
    const getDocIds = (h: HighlightType) => {
        if (h.documentIds && h.documentIds.length > 0) return h.documentIds;
        if (h.documentId) return [h.documentId];
        return [];
    };

    const unassignedHighlights = filteredHighlights.filter(h => getDocIds(h).length === 0);
    const assignedHighlights = filteredHighlights.filter(h => getDocIds(h).length > 0);

    return (
        <div className="w-[240px] pt-[calc(50vh-320px)] flex flex-col gap-4 h-screen overflow-y-auto no-scrollbar pb-8">
            <div>
                <div className="flex flex-col gap-3 p-2.5">
                    {/* Unassigned Highlights */}
                    {unassignedHighlights.map((highlight) => (
                        <div
                            key={highlight.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, highlight.id)}
                            className="scale-95 origin-center cursor-grab"
                        >
                            <HighlightCard
                                id={highlight.id}
                                text={highlight.text}
                                url={highlight.url}
                                title={highlight.title || ''}
                                favicon={highlight.favicon || ''}
                                createdAt={highlight.createdAt}
                                documentId={highlight.documentId || null}
                                onDelete={handleDeleteHighlight}
                                onMove={handleMoveHighlight}
                                // @ts-ignore
                                documents={documents}
                                // @ts-ignore
                                activeDocId={activeDocId}
                                color={highlight.color}
                            />
                        </div>
                    ))}

                    {/* Assigned Highlights Section */}
                    {assignedHighlights.length > 0 && (
                        <div className="mt-8 flex flex-col gap-3">
                            <div className="text-xs font-semibold text-muted mb-1 pl-1 uppercase tracking-wider">
                                Added to Documents
                            </div>

                            {assignedHighlights.map((highlight) => (
                                <div
                                    key={highlight.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, highlight.id)}
                                    className="scale-95 origin-center cursor-grab opacity-80"
                                >
                                    <HighlightCard
                                        id={highlight.id}
                                        text={highlight.text}
                                        url={highlight.url}
                                        title={highlight.title || ''}
                                        favicon={highlight.favicon || ''}
                                        createdAt={highlight.createdAt}
                                        documentId={highlight.documentId || null}
                                        documentIds={getDocIds(highlight)}
                                        onDelete={handleDeleteHighlight}
                                        onMove={handleMoveHighlight}
                                        // @ts-ignore
                                        documents={documents}
                                        // @ts-ignore
                                        activeDocId={activeDocId}
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Empty State - Only if NO highlights exist */}
                    {highlights.length === 0 && (
                        <div className="aspect-square rounded-[2px] flex items-center justify-center p-5 text-center text-black/40 text-sm bg-amber-100/50 cursor-default select-none border border-black/5">
                            Highlight text on the web to add notes here.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
