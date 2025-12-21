import { useState, useMemo } from 'react';
import { HighlightType } from '@/services/FileSystemService';
import { getCategoryStyles } from '@/utils/categories';
import { motion } from 'framer-motion';

import {
    RiExternalLinkLine,
    RiLinkUnlinkM,
    RiInputMethodLine,
    RiArrowDownSLine,
    RiArrowRightSLine
} from '@remixicon/react';

interface CitationPanelProps {
    highlights: HighlightType[];
    onUnlink: (url: string) => void;
    onRetrieve: (text: string) => void;
}

const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05,
            delayChildren: 0.2
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: {
        opacity: 1,
        y: 0,
        transition: {
            type: "spring",
            stiffness: 350,
            damping: 30
        }
    }
};

export default function CitationPanel({ highlights, onUnlink, onRetrieve }: CitationPanelProps) {
    const [expandedUrls, setExpandedUrls] = useState<Set<string>>(new Set());

    // 1. Deduplicate sources based on URL base (or exact URL)
    const uniqueSources = useMemo(() => {
        const map = new Map<string, HighlightType>();
        highlights.forEach(h => {
            if (!map.has(h.url)) {
                map.set(h.url, h);
            }
        });
        return Array.from(map.values()).sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ); // Newest first (Activity Log style)
    }, [highlights]);

    const toggleExpand = (url: string) => {
        const newSet = new Set(expandedUrls);
        if (newSet.has(url)) {
            newSet.delete(url);
        } else {
            newSet.add(url);
        }
        setExpandedUrls(newSet);
    };

    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        } catch {
            return 'n.d.';
        }
    };

    const getHostname = (url: string) => {
        try {
            return new URL(url).hostname.replace('www.', '');
        } catch {
            return 'Website';
        }
    };

    if (uniqueSources.length === 0) return null;

    return (
        <aside className="w-[300px] pl-2">
            <motion.div
                className="space-y-6 pb-10 ml-2"
                variants={containerVariants}
                initial="hidden"
                animate="show"
            >
                {uniqueSources.map((source, index) => {
                    const sourceHighlights = highlights.filter(h => h.url === source.url);
                    const isExpanded = expandedUrls.has(source.url);
                    const showConnector = index < uniqueSources.length - 1;

                    // Determine Colors:
                    const defaultStyles = getCategoryStyles(source.url);
                    // Dot: Use 'borderColor' (darker shade) for visibility
                    const dotColor = defaultStyles.borderColor;
                    // Note Bg: Use stored color or fallback to category background (lighter)
                    const noteBgColor = source.color || defaultStyles.color;
                    // Note Text: Use category text color (darker contrast)
                    const noteTextColor = defaultStyles.textColor;

                    return (
                        <motion.div
                            key={source.id}
                            variants={itemVariants}
                            className="relative pl-6 group will-change-transform"
                        >
                            {/* Connector Line (only between points) */}
                            {showConnector && (
                                <div
                                    className="absolute left-[-1px] top-[14px] bottom-[-24px] w-[2px] bg-border/50"
                                    aria-hidden="true"
                                />
                            )}

                            {/* Timeline Dot */}
                            <div
                                className="absolute left-[-5px] top-[4px] w-2.5 h-2.5 rounded-full shadow-sm transition-transform duration-200 group-hover:scale-125 z-10"
                                style={{ backgroundColor: dotColor }}
                            />

                            {/* Clickable Header */}
                            <button
                                onClick={() => toggleExpand(source.url)}
                                className="w-full text-left mb-1 focus:outline-none"
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                                        {formatDate(source.createdAt)}
                                    </span>
                                    {/* Chevron */}
                                    {isExpanded ? (
                                        <RiArrowDownSLine size={14} className="text-muted-foreground opacity-50" />
                                    ) : (
                                        <RiArrowRightSLine size={14} className="text-muted-foreground opacity-50" />
                                    )}
                                </div>

                                <h4 className={`text-sm font-medium leading-tight transition-colors line-clamp-2 ${isExpanded ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                                    {source.title || 'Untitled Page'}
                                </h4>
                            </button>

                            {/* Collapsible Content */}
                            {isExpanded && (
                                <div className="mt-3 animate-in fade-in slide-in-from-top-1 duration-200">
                                    {/* Metadata */}
                                    <div className="text-xs text-muted-foreground italic mb-3 opacity-80">
                                        {getHostname(source.url)}
                                    </div>

                                    {/* List of Notes */}
                                    <div className="flex flex-col gap-2 mb-4">
                                        {sourceHighlights.map(note => (
                                            <div
                                                key={note.id}
                                                className="p-3 rounded-md border border-black/5 hover:border-black/10 transition-colors flex gap-2 items-start group/note shadow-sm"
                                                style={{
                                                    backgroundColor: note.color || noteBgColor,
                                                    color: noteTextColor
                                                }}
                                            >
                                                <span className="flex-1 text-xs leading-relaxed font-medium">
                                                    "{note.text}"
                                                </span>
                                                <button
                                                    onClick={() => onRetrieve(note.text)}
                                                    className="hover:text-foreground transition-colors p-0.5 opacity-0 group-hover/note:opacity-100"
                                                    style={{ color: noteTextColor }}
                                                    title="Insert text using cursor"
                                                >
                                                    <RiInputMethodLine size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Actions Row */}
                                    <div className="flex items-center gap-3 pt-2 border-t border-dashed border-border/40">
                                        <a
                                            href={source.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors font-medium"
                                            title="Go to source"
                                        >
                                            <RiExternalLinkLine size={12} />
                                            <span>Source</span>
                                        </a>

                                        <button
                                            onClick={() => onUnlink(source.url)}
                                            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-red-500 transition-colors bg-transparent border-none cursor-pointer p-0 font-medium ml-auto"
                                            title="Unlink source"
                                        >
                                            <RiLinkUnlinkM size={12} />
                                            <span>Unlink</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    );
                })}
            </motion.div>
        </aside>
    );
}
