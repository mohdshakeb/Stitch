'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getCategoryStyles } from '@/utils/categories';

interface HighlightProps {
    id: string;
    text: string;
    url: string;
    title?: string | null;
    favicon?: string | null;
    createdAt: string;
    documentId?: string | null;
    documentIds?: string[];
    documents?: { id: string; title: string }[];
    onDelete?: (id: string, e: React.MouseEvent) => void;
    onMove?: (documentId: string | null) => void;
    activeDocId?: string | null;
}

export default function HighlightCard({
    id,
    text,
    url,
    title,
    favicon,
    createdAt,
    documentId,
    documentIds,
    documents = [],
    onDelete,
    onMove,
    activeDocId
}: HighlightProps) {
    const [showActions, setShowActions] = useState(false);
    const [showMoveMenu, setShowMoveMenu] = useState(false);

    const styles = getCategoryStyles(url);

    const date = new Date(createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent card expansion
        if (!confirm('Are you sure you want to delete this highlight?')) return;
        onDelete?.(id, e);
    };

    const handleMove = async (targetDocId: string | null) => {
        try {
            await fetch(`/api/highlights/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ documentId: targetDocId }),
            });
            onMove?.(targetDocId);
            setShowMoveMenu(false);
        } catch (error) {
            console.error('Error moving highlight:', error);
        }
    };

    const [isExpanded, setIsExpanded] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [originRect, setOriginRect] = useState<DOMRect | null>(null);

    useEffect(() => {
        setMounted(true);
        if (isExpanded) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isExpanded]);

    const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setOriginRect(rect);
        setIsExpanded(true);
    };

    const Modal = () => {
        if (!mounted) return null;

        let initialProps = { opacity: 0, scale: 0.8, x: 0, y: 0 };

        if (originRect) {
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;

            // Calculate center of the screen
            const cx = windowWidth / 2;
            const cy = windowHeight / 2;

            // Calculate center of the original element
            const ox = originRect.left + originRect.width / 2;
            const oy = originRect.top + originRect.height / 2;

            // Calculate delta
            const dx = ox - cx;
            const dy = oy - cy;

            initialProps = {
                opacity: 0,
                scale: originRect.width / 500, // Approximate scale based on max width
                x: dx,
                y: dy
            };
        }

        return createPortal(
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { delay: 0.15, duration: 0.15 } }} // Wait for note to exit
                transition={{ duration: 0.15 }} // Default duration for entry
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    backgroundColor: 'hsl(var(--background) / 0.75)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 9999,
                    backdropFilter: 'blur(8px)',
                }}
                onClick={() => setIsExpanded(false)}
            >
                <motion.div
                    initial={initialProps}
                    animate={{
                        opacity: 1,
                        scale: 1,
                        x: 0,
                        y: 0,
                        transition: { type: 'spring', stiffness: 500, damping: 30, delay: 0.05 } // Delay entry
                    }}
                    exit={{
                        ...initialProps,
                        transition: { type: 'spring', stiffness: 500, damping: 30, delay: 0 } // No delay on exit
                    }}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        backgroundColor: styles.color,
                        width: '90%',
                        maxWidth: '500px',
                        aspectRatio: '1 / 1',
                        borderRadius: '4px',
                        padding: '40px',
                        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'relative',
                        color: styles.textColor,
                        transform: 'rotate(-1deg)',
                    }}
                >
                    <button
                        onClick={() => setIsExpanded(false)}
                        style={{
                            position: 'absolute',
                            top: '16px',
                            right: '16px',
                            background: 'none',
                            border: 'none',
                            fontSize: '1.5rem',
                            cursor: 'pointer',
                            color: styles.textColor,
                            opacity: 0.6,
                        }}
                    >
                        ×
                    </button>

                    <blockquote style={{
                        fontSize: '1.25rem',
                        lineHeight: '1.6',
                        fontFamily: 'var(--font-heading)',
                        margin: 0,
                        flex: 1,
                        overflowY: 'auto',
                        whiteSpace: 'pre-wrap',
                        paddingRight: '10px',
                    }}>
                        {text}
                    </blockquote>

                    <div style={{
                        marginTop: '24px',
                        paddingTop: '16px',
                        borderTop: `1px solid ${styles.textColor}40`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {favicon && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={favicon} alt="" style={{ width: 24, height: 24, borderRadius: 4 }} />
                            )}
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <a
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        fontSize: '0.875rem',
                                        fontWeight: 600,
                                        color: styles.textColor,
                                        textDecoration: 'none',
                                    }}
                                >
                                    {title || new URL(url).hostname}
                                </a>
                                <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                                    {date}
                                </span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>,
            document.body
        );
    };

    return (
        <>
            <div
                className="card"
                onClick={handleCardClick}
                onMouseEnter={() => setShowActions(true)}
                onMouseLeave={() => setShowActions(false)}
                style={{
                    position: 'relative',
                    backgroundColor: styles.color,
                    border: 'none',
                    borderRadius: '2px',
                    boxShadow: '2px 2px 5px rgba(0,0,0,0.1)',
                    padding: '12px',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    transform: showActions ? 'scale(1.05) rotate(-2deg)' : 'rotate(0deg)',
                    color: styles.textColor,
                    aspectRatio: '1 / 1',
                    display: 'flex',
                    flexDirection: 'column',
                    zIndex: showActions ? 20 : 1,
                    cursor: 'grab',
                }}
            >
                {showActions && (
                    <div style={{
                        position: 'absolute',
                        top: '-12px',
                        right: '-12px',
                        display: 'flex',
                        gap: '4px',
                        zIndex: 10,
                    }} onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={handleDelete}
                            style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                border: '1px solid hsl(var(--border))',
                                backgroundColor: 'hsl(var(--border))',
                                color: 'hsl(var(--foreground))',
                                fontSize: '1rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 'bold',
                                boxShadow: 'var(--shadow-sm)',
                            }}
                        >
                            −
                        </button>
                    </div>
                )}

                <blockquote style={{
                    fontSize: '0.875rem',
                    lineHeight: '1.4',
                    fontFamily: 'var(--font-heading)',
                    color: styles.textColor,
                    borderLeft: 'none',
                    paddingLeft: 0,
                    margin: 0,
                    marginBottom: '16px', // Ensure margin is applied
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 6,
                    WebkitBoxOrient: 'vertical',
                }}>
                    {text}
                </blockquote>

                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: 'auto', opacity: 0.7 }}>
                    {favicon && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={favicon} alt="" style={{ width: 16, height: 16, borderRadius: 2 }} />
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, overflow: 'hidden' }}>
                        <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                color: styles.textColor,
                                textDecoration: 'none',
                            }}
                        >
                            {title || new URL(url).hostname}
                        </a>
                        <span style={{ fontSize: '0.7rem', color: styles.textColor, opacity: 0.8 }}>
                            {date}
                        </span>
                    </div>
                </div>

                {/* Assignment Indicator */}
                {(documentId || (documentIds && documentIds.length > 0)) && (
                    <div style={{
                        marginTop: '8px',
                        paddingTop: '8px',
                        borderTop: `1px solid ${styles.textColor}20`,
                        fontSize: '0.7rem',
                        color: styles.textColor,
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                    }}>
                        <i className="ri-check-line"></i>
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            Added to {(() => {
                                const ids = documentIds && documentIds.length > 0 ? documentIds : (documentId ? [documentId] : []);
                                const lastId = ids[ids.length - 1];
                                const doc = documents.find(d => d.id === lastId);
                                const extra = ids.length - 1;

                                return (
                                    <>
                                        <span style={{ fontWeight: 600 }}>{doc?.title || 'Document'}</span>
                                        {extra > 0 && <span style={{ opacity: 0.7, marginLeft: '4px' }}>+{extra}</span>}
                                    </>
                                );
                            })()}
                        </span>
                    </div>
                )}
            </div>
            <AnimatePresence>
                {isExpanded && <Modal />}
            </AnimatePresence>
        </>
    );
}
