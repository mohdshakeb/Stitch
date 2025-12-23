import { useState, useRef, memo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RiDeleteBinLine } from '@remixicon/react';
import { useDroppable } from '@dnd-kit/core';
import { Link, useTransitionRouter } from 'next-view-transitions';
import { motion } from 'framer-motion';
import { DocumentType, HighlightType } from '@/services/FileSystemService';

interface DocumentPreviewCardProps {
    doc: DocumentType;
    highlights?: HighlightType[];  // Highlights associated with this document
    isActive: boolean;
    // Removed manual drag props as Dnd-Kit handles state
    onDelete: (id: string, e: React.MouseEvent) => void;
    onTitleUpdate: (id: string, newTitle: string) => void;
    autoFocus?: boolean;
}

// Memoized Content Component to prevent animation resets on parent re-renders
const DocumentContentPreview = memo(({ html }: { html: string }) => {
    if (!html) {
        return <div className="italic opacity-50">Drop highlights here or start writing...</div>;
    }

    return (
        <div
            dangerouslySetInnerHTML={{ __html: html }}
            className="document-preview-content [&_p]:mb-3 [&_p]:leading-relaxed"
        />
    );
}, (prev, next) => prev.html === next.html);

const DocumentPreviewCard = memo(function DocumentPreviewCard({
    doc,
    highlights = [],
    isActive,
    onDelete,
    onTitleUpdate,
    autoFocus = false
}: DocumentPreviewCardProps) {
    const router = useTransitionRouter();
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(doc.title);
    const inputRef = useRef<HTMLInputElement>(null);

    const { isOver, setNodeRef } = useDroppable({
        id: doc.id,
        data: doc
    });

    // Auto-focus if requested
    useEffect(() => {
        if (autoFocus && inputRef.current && document.activeElement !== inputRef.current) {
            inputRef.current.focus({ preventScroll: true });
        }
    }, [autoFocus]);

    const handleTitleBlur = () => {
        setIsEditing(false);
        if (title !== doc.title) {
            onTitleUpdate(doc.id, title);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            (e.currentTarget as HTMLInputElement).blur();
        }
    };

    return (
        <div
            ref={setNodeRef}
            data-id={doc.id}
            className="document-wrapper group/wrapper w-full max-w-[650px] flex flex-col items-center gap-4 px-5 opacity-100 transition-opacity duration-300 snap-center"
        >
            <div
                style={{ viewTransitionName: `document-card-${doc.id}` }}
                onClick={(e: React.MouseEvent) => {
                    e.preventDefault();
                    // Extension Environment: Use full URL redirection
                    const chromeAny = (window as any).chrome;
                    if (chromeAny?.runtime?.getURL) {
                        try {
                            const url = chromeAny.runtime.getURL(`app/index.html?doc=${doc.id}`);
                            window.location.href = url;
                        } catch (e) {
                            console.error('Extension navigation failed:', e);
                            // Fallback
                            window.location.href = `index.html?doc=${doc.id}`;
                        }
                    } else {
                        // Web Environment: Use Next.js Router for SPA transition
                        // This prevents full page reloads and feels native
                        router.push(`/?doc=${doc.id}`);
                    }
                }}
                className={`document-paper group relative flex flex-col w-[450px] max-w-full aspect-[1/1.414] bg-surface rounded-sm p-10 cursor-pointer transition-all duration-300 overflow-hidden hover:-translate-y-0.5 will-change-transform ${isActive ? 'scale-100 shadow-[0_20px_25px_-5px_rgba(0,0,0,0.05),0_8px_10px_-6px_rgba(0,0,0,0.01)]' : 'scale-95'} ${isOver ? 'border-2 border-primary-light shadow-[0_0_0_4px_hsl(var(--primary-light)/0.2),_var(--shadow-xl)] scale-[1.02] rotate-1' : 'border-none'}`}
            >
                {/* Title Row */}
                <div
                    className="flex items-start justify-between mb-4 gap-3 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="relative flex-1">
                        <input
                            ref={inputRef}
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            onBlur={handleTitleBlur}
                            onKeyDown={handleKeyDown}
                            style={{
                                viewTransitionName: `doc-title-${doc.id}`,
                                fieldSizing: 'content'
                            } as React.CSSProperties}
                            className="text-2xl font-heading font-bold text-foreground border-none bg-transparent w-auto min-w-[150px] max-w-full outline-none cursor-text pr-6 placeholder:text-muted/50"
                            placeholder="Untitled Document"
                        />
                    </div>

                    <button
                        onClick={(e) => onDelete(doc.id, e)}
                        className="delete-btn bg-transparent border-none text-muted cursor-pointer p-1 rounded transition-all duration-200 flex items-center justify-center opacity-0 group-hover/wrapper:opacity-100 hover:text-red-500 hover:bg-muted/10"
                        title="Delete Document"
                    >
                        <RiDeleteBinLine size={20} />
                    </button>
                </div>

                <div className="text-sm text-muted leading-relaxed whitespace-pre-wrap overflow-hidden flex-1 [mask-image:linear-gradient(to_bottom,black_90%,transparent_100%)]">
                    <DocumentContentPreview html={doc.content || ''} />
                </div>

                <div className="text-xs text-muted mt-auto pt-4 shrink-0">
                    {highlights.length} Highlight{highlights.length !== 1 ? 's' : ''}
                </div>
            </div>

        </div >
    );
}, (prevProps, nextProps) => {
    // Custom comparison function for performance
    return prevProps.doc.id === nextProps.doc.id &&
        prevProps.doc.content === nextProps.doc.content &&
        prevProps.doc.title === nextProps.doc.title &&
        (prevProps.highlights?.length ?? 0) === (nextProps.highlights?.length ?? 0) &&
        prevProps.isActive === nextProps.isActive &&
        prevProps.autoFocus === nextProps.autoFocus;
});

export default DocumentPreviewCard;
