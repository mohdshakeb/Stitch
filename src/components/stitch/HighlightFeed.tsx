import React from 'react';
import HighlightCard from '@/components/HighlightCard';
import { HighlightType, DocumentType } from '@/services/FileSystemService';
import { Category, getCategoryFromUrl } from '@/utils/categories';
import { useDraggable } from '@dnd-kit/core';
import { LayoutGroup, motion, AnimatePresence } from 'framer-motion';

interface HighlightFeedProps {
    highlights: HighlightType[];
    documents: DocumentType[];
    activeDocId: string | null;
    selectedCategory: Category | null;
    filteredIds?: string[]; // IDs to optimistically hide (e.g. while dropping)
    handleDeleteHighlight: (id: string, e: React.MouseEvent) => void;
    handleMoveHighlight: () => void;
}

// Draggable Wrapper Component
function DraggableHighlightWrapper({ highlight, children, type }: { highlight: HighlightType, children: React.ReactNode, type: 'unassigned' | 'assigned' }) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: highlight.id,
        data: highlight
    });

    // Sticky state: Keep showing placeholder for a moment after drag ends
    // This ensures the exit animation (vanish) happens on the placeholder, not the real card
    const [visualDragging, setVisualDragging] = React.useState(isDragging);

    React.useEffect(() => {
        if (isDragging) {
            setVisualDragging(true);
        } else {
            // Delay reverting to real card to allow exit animation to complete if dropped
            const timer = setTimeout(() => setVisualDragging(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isDragging]);

    if (visualDragging) {
        return (
            <motion.div
                ref={setNodeRef}
                layoutId={`${highlight.id}-${type}`}
                className="aspect-square rounded-2xl bg-muted/10 border-2 border-dashed border-muted/20"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.2 } }}
            />
        );
    }

    return (
        <motion.div
            ref={setNodeRef}
            layoutId={`${highlight.id}-${type}`}
            {...listeners}
            {...attributes}
            className="cursor-grab active:cursor-grabbing origin-center will-change-transform"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 0.95 }}
            exit={{ opacity: 0, scale: 0, transition: { duration: 0.15 } }}
        >
            {children}
        </motion.div>
    );
}

export default function HighlightFeed({
    highlights,
    documents,
    activeDocId,
    selectedCategory,
    filteredIds = [],
    handleDeleteHighlight,
    handleMoveHighlight,
}: HighlightFeedProps) {

    // Filter logic logic inside the component
    const filteredHighlights = selectedCategory
        ? highlights.filter(h => getCategoryFromUrl(h.url) === selectedCategory)
        : [...highlights];

    // Optimistic filtering: Remove items that are currently being processed
    const visibleHighlights = filteredHighlights.filter(h => !filteredIds.includes(h.id));

    // Sort by latest -> oldest
    visibleHighlights.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Helper to normalize document IDs (duplicated slightly but safe)
    const getDocIds = (h: HighlightType) => {
        if (h.documentIds && h.documentIds.length > 0) return h.documentIds;
        if (h.documentId) return [h.documentId];
        return [];
    };

    const unassignedHighlights = visibleHighlights.filter(h => getDocIds(h).length === 0);
    const assignedHighlights = visibleHighlights.filter(h => getDocIds(h).length > 0);

    return (
        <div className="w-[240px] pt-[calc(50vh-320px)] flex flex-col gap-4 h-screen overflow-y-auto no-scrollbar pb-8">
            <LayoutGroup>
                <div className="flex flex-col gap-3 p-2.5">
                    {/* Unassigned Highlights */}
                    <AnimatePresence mode='popLayout'>
                        {unassignedHighlights.map((highlight) => (
                            <DraggableHighlightWrapper key={highlight.id} highlight={highlight} type="unassigned">
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
                                    documents={documents}
                                    activeDocId={activeDocId}
                                    color={highlight.color}
                                />
                            </DraggableHighlightWrapper>
                        ))}
                    </AnimatePresence>

                    {/* Assigned Highlights Section */}
                    {assignedHighlights.length > 0 && (
                        <div className="mt-8 flex flex-col gap-3">
                            <motion.div layout className="text-xs font-semibold text-muted mb-1 pl-1 uppercase tracking-wider">
                                Added to Documents
                            </motion.div>

                            <AnimatePresence mode='popLayout'>
                                {assignedHighlights.map((highlight) => (
                                    <div key={highlight.id} className="opacity-80">
                                        <DraggableHighlightWrapper highlight={highlight} type="assigned">
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
                                                documents={documents}
                                                activeDocId={activeDocId}
                                            />
                                        </DraggableHighlightWrapper>
                                    </div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}

                    {/* Empty State - Only if NO highlights exist */}
                    {highlights.length === 0 && (
                        <div className="aspect-square rounded-[2px] flex items-center justify-center p-5 text-center text-black/40 text-sm bg-amber-100/50 cursor-default select-none border border-black/5">
                            Highlight text on the web to add notes here.
                        </div>
                    )}
                </div>
            </LayoutGroup>
        </div>
    );
}
