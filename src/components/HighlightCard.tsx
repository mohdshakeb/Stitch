'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getCategoryStyles } from '@/utils/categories';
import { RiCheckLine } from '@remixicon/react';

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
    color?: string | null;
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
    activeDocId,
    color
}: HighlightProps) {
    const [showActions, setShowActions] = useState(false);
    const [showMoveMenu, setShowMoveMenu] = useState(false);

    const styles = getCategoryStyles(url);
    const bg = color || styles.color;

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
                className="fixed top-0 left-0 w-screen h-screen bg-background/75 flex justify-center items-center z-[9999] backdrop-blur-md"
                onClick={() => setIsExpanded(false)}
            >
                <motion.div
                    initial={initialProps}
                    animate={{
                        opacity: 1,
                        scale: 1,
                        x: 0,
                        y: 0,
                        transition: { type: 'spring', stiffness: 320, damping: 30, delay: 0.05 } // Delay entry
                    }}
                    exit={{
                        ...initialProps,
                        transition: { type: 'spring', stiffness: 280, damping: 20, delay: 0 } // No delay on exit
                    }}
                    onClick={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    className="w-[90%] max-w-[500px] aspect-square rounded p-10 shadow-xl flex flex-col relative -rotate-1"
                    style={{
                        backgroundColor: bg,
                        color: styles.textColor,
                    }}
                >
                    <button
                        onClick={() => setIsExpanded(false)}
                        className="absolute top-4 right-4 bg-transparent border-none text-2xl cursor-pointer opacity-60 hover:opacity-100 transition-opacity"
                        style={{ color: styles.textColor }}
                    >
                        ×
                    </button>

                    <blockquote className="text-xl leading-relaxed font-heading m-0 flex-1 overflow-y-auto whitespace-pre-wrap pr-2.5">
                        {text}
                    </blockquote>

                    <div className="mt-6 pt-4 border-t flex justify-between items-center" style={{ borderColor: `${styles.textColor}40` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {favicon && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={favicon} alt="" className="w-6 h-6 rounded" />
                            )}
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <a
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm font-semibold no-underline hover:underline"
                                    style={{ color: styles.textColor }}
                                >
                                    {title || new URL(url).hostname}
                                </a>
                                <span className="text-xs opacity-80" style={{ color: styles.textColor }}>
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
                className={`relative border-none rounded-2xl shadow-sm p-6 transition-all duration-200 aspect-square flex flex-col cursor-grab ${showActions ? 'z-20 shadow-xl scale-105 -rotate-1' : 'z-1 rotate-0'}`}
                onClick={handleCardClick}
                onMouseEnter={() => setShowActions(true)}
                onMouseLeave={() => setShowActions(false)}
                style={{
                    backgroundColor: bg,
                    color: styles.textColor,
                }}
            >
                {showActions && (
                    <div
                        className="absolute -top-3 -right-3 flex gap-1 z-10"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={handleDelete}
                            className="w-6 h-6 rounded-full border border-border bg-border text-foreground text-base cursor-pointer flex items-center justify-center font-bold shadow-sm hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors"
                        >
                            −
                        </button>
                    </div>
                )}

                <blockquote
                    className="text-sm leading-relaxed font-heading m-0 mb-4 overflow-hidden border-none p-0 line-clamp-6"
                    style={{ color: styles.textColor }}
                >
                    {text}
                </blockquote>

                <div className="flex items-center gap-2 mt-auto opacity-70">
                    {favicon && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={favicon} alt="" className="w-4 h-4 rounded-sm" />
                    )}
                    <div className="flex flex-col overflow-hidden">
                        <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs font-semibold whitespace-nowrap overflow-hidden text-ellipsis no-underline hover:underline"
                            style={{ color: styles.textColor }}
                        >
                            {title || new URL(url).hostname}
                        </a>
                        <span className="text-[0.7rem] opacity-80" style={{ color: styles.textColor }}>
                            {date}
                        </span>
                    </div>
                </div>

                {/* Assignment Indicator */}
                {(documentId || (documentIds && documentIds.length > 0)) && (
                    <div className="mt-2 pt-2 border-t text-[0.7rem] font-medium flex items-center gap-1" style={{ borderColor: `${styles.textColor}20`, color: styles.textColor }}>
                        <RiCheckLine size={14} />
                        <span className="whitespace-nowrap overflow-hidden text-ellipsis">
                            Added to {(() => {
                                const ids = documentIds && documentIds.length > 0 ? documentIds : (documentId ? [documentId] : []);
                                const lastId = ids[ids.length - 1];
                                const doc = documents.find(d => d.id === lastId);
                                const extra = ids.length - 1;

                                return (
                                    <>
                                        <span className="font-semibold">{doc?.title || 'Document'}</span>
                                        {extra > 0 && <span className="opacity-70 ml-1">+{extra}</span>}
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
