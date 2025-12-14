import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { RiDeleteBinLine } from '@remixicon/react';

interface Highlight {
    id: string;
    text: string;
    url: string;
}

interface Document {
    id: string;
    title: string;
    content: string;
    updatedAt: string;
    _count?: {
        highlights: number;
    };
}

interface DocumentPreviewCardProps {
    doc: Document;
    highlights?: Highlight[];  // Highlights associated with this document
    isActive: boolean;
    isDragOver: boolean;
    onDragOver: (e: React.DragEvent, id: string) => void;
    onDragLeave: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent, id: string) => void;
    onDelete: (id: string, e: React.MouseEvent) => void;
    onTitleUpdate: (id: string, newTitle: string) => void;
    autoFocus?: boolean;
}

export default function DocumentPreviewCard({
    doc,
    highlights = [],
    isActive,
    isDragOver,
    onDragOver,
    onDragLeave,
    onDrop,
    onDelete,
    onTitleUpdate,
    autoFocus = false
}: DocumentPreviewCardProps) {
    const router = useRouter();
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(doc.title);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-focus if requested
    if (autoFocus && inputRef.current && document.activeElement !== inputRef.current) {
        inputRef.current.focus();
    }

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

    const renderContent = () => {
        if (!doc.content) {
            return <div className="italic opacity-50">Drop highlights here or start writing...</div>;
        }

        const isLongContent = doc.content.length > 1200; // Increased threshold to prevent duplication on medium files

        if (isLongContent) {
            return (
                <div className="flex flex-col h-full">
                    {/* Top Half */}
                    <div
                        dangerouslySetInnerHTML={{ __html: doc.content }}
                        className="document-preview-content h-1/2 overflow-hidden [&_p]:mb-3 [&_p]:leading-relaxed"
                    />

                    {/* Separator */}
                    <div className="flex items-center justify-center gap-2 py-3 text-muted opacity-50">
                        <div className="h-px flex-1 bg-border"></div>
                        <span className="text-xs tracking-[2px]">•••</span>
                        <div className="h-px flex-1 bg-border"></div>
                    </div>

                    {/* Bottom Half */}
                    <div className="h-1/2 overflow-hidden flex items-end">
                        <div
                            dangerouslySetInnerHTML={{ __html: doc.content }}
                            className="document-preview-content w-full [&_p]:mb-3 [&_p]:leading-relaxed"
                        />
                    </div>
                </div>
            );
        }

        return (
            <>
                <div
                    dangerouslySetInnerHTML={{ __html: doc.content }}
                    className="document-preview-content line-clamp-[12] overflow-hidden text-ellipsis break-words [&_p]:mb-3 [&_p]:leading-relaxed"
                />
            </>
        );
    };

    return (
        <div
            data-id={doc.id}
            onDragOver={(e) => onDragOver(e, doc.id)}
            onDragLeave={onDragLeave}
            onDrop={(e) => onDrop(e, doc.id)}
            className="document-wrapper group/wrapper w-full max-w-[650px] flex flex-col items-center gap-4 px-5 opacity-100 transition-opacity duration-300 snap-center"
        >
            <div
                onClick={(e) => {
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
                className={`document-paper group relative flex flex-col w-[450px] max-w-full aspect-[1/1.414] bg-surface rounded-sm p-10 cursor-pointer transition-all duration-300 overflow-hidden hover:-translate-y-0.5 ${isActive ? 'scale-100 shadow-[0_20px_25px_-5px_rgba(0,0,0,0.05),0_8px_10px_-6px_rgba(0,0,0,0.01)]' : 'scale-95'} ${isDragOver ? 'border-2 border-primary shadow-[0_0_0_4px_hsl(var(--primary)/0.2),_var(--shadow-xl)]' : 'border-none'}`}
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
                            className="text-2xl font-heading font-semibold text-foreground border-none bg-transparent w-full outline-none cursor-text pr-6 placeholder:text-muted/50"
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
                    {renderContent()}
                </div>

                <div className="text-xs text-muted mt-auto pt-4 shrink-0">
                    {highlights.length} Highlight{highlights.length !== 1 ? 's' : ''}
                </div>
            </div>

        </div >
    );
}
