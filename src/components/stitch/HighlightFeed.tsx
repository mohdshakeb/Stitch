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
        <div style={{
            width: '240px',
            paddingTop: 'calc(50vh - 320px)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-4)',
            height: '100vh',
            overflowY: 'auto',
            scrollbarWidth: 'none',
            paddingBottom: 'var(--space-8)',
        }}>
            <div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', padding: '10px' }}>
                    {/* Unassigned Highlights */}
                    {unassignedHighlights.map((highlight) => (
                        <div
                            key={highlight.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, highlight.id)}
                            style={{
                                transform: 'scale(0.95)',
                                transformOrigin: 'center',
                                cursor: 'grab',
                            }}
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
                        <div style={{ marginTop: 'var(--space-8)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                            <div style={{
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                color: 'hsl(var(--muted))',
                                marginBottom: 'var(--space-1)',
                                paddingLeft: '4px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                            }}>
                                Added to Documents
                            </div>

                            {assignedHighlights.map((highlight) => (
                                <div
                                    key={highlight.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, highlight.id)}
                                    style={{
                                        transform: 'scale(0.95)',
                                        transformOrigin: 'center',
                                        cursor: 'grab',
                                        opacity: 0.8, // Slightly faded
                                    }}
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
                        <div style={{
                            aspectRatio: '1/1',
                            borderRadius: '2px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '20px',
                            textAlign: 'center',
                            color: 'rgba(0, 0, 0, 0.4)', // Visible but muted text
                            fontSize: '0.875rem',
                            backgroundColor: 'rgba(254, 243, 199, 0.5)', // Low opacity amber
                            boxShadow: 'none',
                            cursor: 'default',
                            userSelect: 'none',
                            border: '1px solid rgba(0,0,0,0.05)',
                        }}>
                            Highlight text on the web to add notes here.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
