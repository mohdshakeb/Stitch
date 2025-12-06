import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

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
        // Render sanitized content (in this case, raw from DB as it's local) 
        // We use CSS line-clamp to handle truncation now
        if (!doc.content) {
            return <div style={{ fontStyle: 'italic', opacity: 0.5 }}>Drop highlights here or start writing...</div>;
        }

        return (
            <div
                dangerouslySetInnerHTML={{ __html: doc.content }}
                className="document-preview-content"
                style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 12, // Show more content since we have space
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    wordBreak: 'break-word',
                }}
            />
        );
    };

    return (
        <div
            data-id={doc.id}
            className="document-wrapper"
            onDragOver={(e) => onDragOver(e, doc.id)}
            onDragLeave={onDragLeave}
            onDrop={(e) => onDrop(e, doc.id)}
            style={{
                scrollSnapAlign: 'center',
                width: '100%',
                maxWidth: '650px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 'var(--space-4)',
                opacity: 1, // Always fully visible
                transition: 'opacity 0.3s ease',
                padding: '0 20px', // Add side padding to ensure it doesn't touch edges
            }}
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
                style={{
                    width: '450px', // Fixed size to match placeholder
                    maxWidth: '100%',
                    aspectRatio: '1 / 1.414',
                    backgroundColor: 'hsl(var(--surface))',
                    boxShadow: isDragOver
                        ? '0 0 0 4px hsl(var(--primary) / 0.2), var(--shadow-xl)'
                        : isActive ? 'var(--shadow-xl)' : 'none',
                    borderRadius: 'var(--radius-sm)',
                    padding: '40px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    overflow: 'hidden',
                    position: 'relative',
                    transform: isActive ? 'scale(1)' : 'scale(0.95)', // Slightly smaller inactive state
                    border: isDragOver ? '2px solid hsl(var(--primary))' : 'none',
                    display: 'flex',
                    flexDirection: 'column',
                }}
                className="document-paper group"
            >
                {/* Title Row */}
                <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    marginBottom: 'var(--space-4)',
                    gap: '12px',
                    flexShrink: 0,
                }} onClick={(e) => e.stopPropagation()}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <input
                            ref={inputRef}
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            onBlur={handleTitleBlur}
                            onKeyDown={handleKeyDown}
                            style={{
                                fontSize: '1.5rem',
                                fontFamily: 'var(--font-heading)',
                                fontWeight: 600,
                                color: 'hsl(var(--foreground))',
                                border: 'none',
                                background: 'transparent',
                                width: '100%',
                                outline: 'none',
                                cursor: 'text',
                                paddingRight: '24px',
                            }}
                            placeholder="Untitled Document"
                        />
                    </div>

                    <button
                        onClick={(e) => onDelete(doc.id, e)}
                        className="delete-btn"
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'hsl(var(--muted))',
                            cursor: 'pointer',
                            padding: '4px',
                            borderRadius: '4px',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                        title="Delete Document"
                    >
                        <i className="ri-delete-bin-line" style={{ fontSize: '1.2rem' }}></i>
                    </button>
                </div>

                <div style={{
                    fontSize: '0.875rem',
                    color: 'hsl(var(--muted))',
                    lineHeight: '1.6',
                    whiteSpace: 'pre-wrap',
                    overflow: 'hidden',
                    flex: 1, // Take remaining space
                    maskImage: 'linear-gradient(to bottom, black 90%, transparent 100%)', // Fade out bottom slightly
                }}>
                    {renderContent()}
                </div>

                <div style={{
                    fontSize: '0.75rem',
                    color: 'hsl(var(--muted))',
                    marginTop: 'auto',
                    paddingTop: '16px',
                    flexShrink: 0,
                }}>
                    {highlights.length} Highlight{highlights.length !== 1 ? 's' : ''}
                </div>
            </div>

            <style jsx>{`
        :global(.document-paper:hover) {
          transform: translateY(-2px);
        }
        /* Input placeholder style */
        input::placeholder {
          color: hsl(var(--muted) / 0.5);
        }
        
        /* Delete button hover effect */
        .delete-btn {
            opacity: 0;
        }
        .document-wrapper:hover .delete-btn {
            opacity: 1;
        }
        .delete-btn:hover {
            color: #ef4444 !important;
            background-color: hsl(var(--muted) / 0.1) !important;
        }
      `}</style>
        </div >
    );
}
