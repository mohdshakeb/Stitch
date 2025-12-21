import { useState, useRef } from 'react';
import {
    DragStartEvent,
    DragEndEvent,
    useSensor,
    useSensors,
    PointerSensor,
} from '@dnd-kit/core';
import { HighlightType, DocumentType } from '@/services/FileSystemService';
import { getCategoryStyles } from '@/utils/categories';

const defaultDropAnimation = {
    duration: 300,
    easing: 'cubic-bezier(0.60, 0.04, 0.98, 0.34)',
};

interface UseDraggableHighlightsProps {
    documents: DocumentType[];
    highlights: HighlightType[];
    addHighlight: (h: HighlightType) => Promise<void>;
    addDocument: (d: DocumentType) => Promise<void>;
    showToast: (message: string, options?: any) => void;
}

export function useDraggableHighlights({
    documents,
    highlights,
    addHighlight,
    addDocument,
    showToast,
}: UseDraggableHighlightsProps) {
    const [activeDragItem, setActiveDragItem] = useState<HighlightType | null>(null);
    const [processingDropId, setProcessingDropId] = useState<string | null>(null);
    const [dropAnimation, setDropAnimation] = useState<typeof defaultDropAnimation | null>(defaultDropAnimation);
    const dragPreviewRef = useRef<HTMLDivElement>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const getDocIds = (h: HighlightType) => {
        if (h.documentIds && h.documentIds.length > 0) return h.documentIds;
        if (h.documentId) return [h.documentId];
        return [];
    };

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const item = highlights.find(h => h.id === active.id);
        if (item) {
            setActiveDragItem(item);
            setDropAnimation(defaultDropAnimation);
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (over) {
            setDropAnimation(null);
        } else {
            setDropAnimation(defaultDropAnimation);
            if (dragPreviewRef.current) {
                dragPreviewRef.current.style.transition = 'all 300ms cubic-bezier(0.60, 0.04, 0.98, 0.34)';
                dragPreviewRef.current.style.transform = 'rotate(0deg)';
                dragPreviewRef.current.style.boxShadow = '0 1px 2px 0 rgb(0 0 0 / 0.05)';
            }
        }

        setTimeout(() => {
            setActiveDragItem(null);
        }, 0);

        if (!over) return;

        const docId = over.id as string;
        const highlightId = active.id as string;

        const highlight = highlights.find(h => h.id === highlightId);
        if (!highlight) return;

        try {
            const currentIds = getDocIds(highlight);

            if (currentIds.includes(docId)) {
                showToast('Already added', {
                    type: 'info',
                    description: 'This highlight is already part of this document.'
                });
                return;
            }

            setProcessingDropId(highlightId);

            const newIds = [...currentIds, docId];
            const updatedHighlight = {
                ...highlight,
                documentIds: newIds,
                documentId: docId
            };

            await addHighlight(updatedHighlight);

            const targetDoc = documents.find(d => d.id === docId);

            if (!targetDoc) {
                console.error('Target document not found');
                return;
            }
            const color = highlight.color || getCategoryStyles(highlight.url).color;
            const duration = Math.min(3, Math.max(0.8, highlight.text.length * 0.02));

            const cleanExistingContent = (targetDoc.content || '').replace(/ highlight-animate/g, '');
            const newContent = cleanExistingContent
                ? `${cleanExistingContent}<p><span data-highlight-id="${highlight.id}" class="highlight-marker highlight-animate" style="--highlight-color: ${color}; --highlight-duration: ${duration}s">${highlight.text}</span></p>`
                : `<p><span data-highlight-id="${highlight.id}" class="highlight-marker highlight-animate" style="--highlight-color: ${color}; --highlight-duration: ${duration}s">${highlight.text}</span></p>`;

            await addDocument({
                ...targetDoc,
                content: newContent,
                updatedAt: new Date().toISOString()
            });

            showToast('Added to document', {
                type: 'success',
                description: 'The highlight text has been appended to the document.'
            });

            setTimeout(() => {
                setProcessingDropId(null);
            }, 500);

        } catch (error) {
            console.error('Error moving highlight:', error);
            setProcessingDropId(null);
        }
    };

    return {
        activeDragItem,
        processingDropId,
        dropAnimation,
        dragPreviewRef,
        sensors,
        handleDragStart,
        handleDragEnd
    };
}
