import React from 'react';
import { DocumentType, HighlightType } from '@/services/FileSystemService';
import { Category, CATEGORY_CONFIG, getCategoryFromUrl } from '@/utils/categories';

interface RightSidebarProps {
    documents: DocumentType[];
    highlights: HighlightType[];
    activeDocId: string | null;
    scrollToDocument: (id: string) => void;
    isExtensionAvailable: boolean;
    setIsInstallModalOpen: (isOpen: boolean) => void;
    selectedCategory: Category | null;
    setSelectedCategory: (category: Category | null) => void;
    handleCreateDocument: () => void;
}

export default function RightSidebar({
    documents,
    highlights,
    activeDocId,
    scrollToDocument,
    isExtensionAvailable,
    setIsInstallModalOpen,
    selectedCategory,
    setSelectedCategory,
    handleCreateDocument
}: RightSidebarProps) {
    return (
        <div style={{
            width: '250px',
            paddingTop: 'calc(50vh - 300px)',
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            position: 'sticky',
            top: 0,
            justifyContent: documents.length === 0 ? 'flex-start' : 'space-between',
            paddingBottom: 'calc(50vh - 300px)',
        }}>

            {/* 1. Onboarding State - Shown when Extension NOT available */}
            {!isExtensionAvailable && (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-4)',
                    marginTop: '0',
                }}>
                    <div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '8px' }}>Welcome to Highlight</h3>
                        <p style={{ fontSize: '0.9rem', color: 'hsl(var(--muted))', lineHeight: '1.5' }}>
                            To start collecting highlights from the web, you'll need our helper extension.
                        </p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-start' }}>
                        <button
                            onClick={() => setIsInstallModalOpen(true)}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'hsl(var(--foreground))',
                                fontSize: '0.9rem',
                                textDecoration: 'underline',
                                textUnderlineOffset: '4px',
                                cursor: 'pointer',
                                padding: 0
                            }}
                        >
                            See How
                        </button>

                        <button
                            onClick={() => setIsInstallModalOpen(true)}
                            style={{
                                padding: '10px 16px',
                                backgroundColor: 'hsl(var(--muted) / 0.1)',
                                color: 'hsl(var(--foreground))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: 'var(--radius-md)',
                                fontSize: '0.9rem',
                                fontWeight: 500,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                transition: 'all 0.2s',
                                width: '100%',
                                justifyContent: 'center',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'hsl(var(--muted) / 0.15)';
                                e.currentTarget.style.borderColor = 'hsl(var(--foreground))';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'hsl(var(--muted) / 0.1)';
                                e.currentTarget.style.borderColor = 'hsl(var(--border))';
                            }}
                        >
                            <i className="ri-download-2-line"></i>
                            Download Extension
                        </button>
                    </div>
                </div>
            )}

            {/* 2. Welcome State - Shown when Connected AND No Filters */}
            {isExtensionAvailable && !(highlights.length > 0 && Array.from(new Set(highlights.map(h => getCategoryFromUrl(h.url)))).filter(c => c !== 'other').length > 1) && (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-4)',
                    opacity: 0.8,
                    marginTop: '0', // Align to top
                }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Welcome to Highlight</h3>
                    <p style={{ fontSize: '0.9rem', color: 'hsl(var(--muted))', lineHeight: '1.5' }}>
                        Your personal knowledge base. Collect highlights from the web, organize them into documents, and keep your thoughts in sync.
                    </p>
                </div>
            )}

            {/* 3. Category Tags - Only show if highlights exist and there is more than one category */}
            {highlights.length > 0 && Array.from(new Set(highlights.map(h => getCategoryFromUrl(h.url)))).filter(c => c !== 'other').length > 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                    <span style={{ fontSize: '0.9rem', lineHeight: '1.5', color: 'hsl(var(--foreground))', fontWeight: 500 }}>Snippets from which type of source are you looking for?</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                        <button
                            onClick={() => setSelectedCategory(null)}
                            style={{
                                padding: '4px 12px',
                                borderRadius: '100px',
                                border: '1px solid',
                                borderColor: selectedCategory === null ? 'hsl(var(--foreground))' : 'transparent',
                                backgroundColor: selectedCategory === null ? 'hsl(var(--foreground))' : 'hsl(var(--muted) / 0.1)',
                                color: selectedCategory === null ? 'hsl(var(--background))' : 'hsl(var(--muted))',
                                fontSize: '0.75rem',
                                fontWeight: 500,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            All
                        </button>
                        {['social', 'article', 'academic', 'ai']
                            .filter(cat => highlights.some(h => getCategoryFromUrl(h.url) === cat))
                            .map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(selectedCategory === cat ? null : (cat as Category))}
                                    style={{
                                        padding: '4px 12px',
                                        borderRadius: '100px',
                                        border: '1px solid',
                                        borderColor: selectedCategory === cat ? CATEGORY_CONFIG[cat as Category].borderColor : 'transparent',
                                        backgroundColor: selectedCategory === cat ? CATEGORY_CONFIG[cat as Category].color : 'hsl(var(--muted) / 0.1)',
                                        color: selectedCategory === cat ? CATEGORY_CONFIG[cat as Category].textColor : 'hsl(var(--muted))',
                                        fontSize: '0.75rem',
                                        fontWeight: 500,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                    }}
                                >
                                    {CATEGORY_CONFIG[cat as Category].label}
                                </button>
                            ))}
                    </div>
                </div>
            )}

            {/* 4. Document List - Bottom Aligned */}
            {documents.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', flex: 1, justifyContent: 'flex-end', paddingBottom: 'var(--space-8)' }}>
                    {documents.map((doc) => {
                        const isActive = activeDocId === doc.id;
                        return (
                            <button
                                key={doc.id}
                                onClick={() => scrollToDocument(doc.id)}
                                className="nav-item"
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    textAlign: 'left',
                                    padding: '6px 0', // Reduced padding
                                    fontSize: '0.85rem', // Reduced font size
                                    color: isActive ? 'hsl(var(--foreground))' : 'hsl(var(--muted))',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    fontWeight: isActive ? 500 : 400, // Reduced weight
                                    position: 'relative',
                                    opacity: isActive ? 1 : 0.6, // Make inactive items more subtle
                                    transition: 'opacity 0.2s ease',
                                }}
                                onMouseEnter={(e) => {
                                    if (!isActive) e.currentTarget.style.opacity = '1';
                                }}
                                onMouseLeave={(e) => {
                                    if (!isActive) e.currentTarget.style.opacity = '0.6';
                                }}
                            >
                                {/* Dot Indicator */}
                                <span style={{
                                    width: '6px', // Smaller dot
                                    height: '6px',
                                    borderRadius: '50%',
                                    border: isActive ? 'none' : '1px solid currentColor', // Thinner border, use current color
                                    backgroundColor: isActive ? 'hsl(var(--foreground))' : 'transparent', // Solid black for active
                                    flexShrink: 0,
                                    transition: 'all 0.2s ease',
                                }} />

                                {/* Text Label */}
                                <span
                                    className="nav-text"
                                    style={{
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        transition: 'transform 0.2s ease', // Smooth movement
                                    }}
                                >
                                    {doc.title}
                                </span>
                            </button>
                        );
                    })}
                    <style jsx>{`
            .nav-item:hover .nav-text {
              transform: translateX(4px); /* Move ONLY text */
              color: hsl(var(--foreground));
            }
            .nav-item:hover {
              color: hsl(var(--foreground)); /* Darken text on hover */
            }
          `}</style>
                </div>
            )}

            {/* 5. Create Button (Bottom) - Only show if documents exist */}
            {documents.length > 0 && (
                <button
                    onClick={handleCreateDocument}
                    style={{
                        padding: '8px 16px',
                        backgroundColor: 'hsl(var(--foreground))',
                        color: 'hsl(var(--background))',
                        border: 'none',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        width: 'fit-content',
                        boxShadow: 'var(--shadow-sm)',
                        transition: 'transform 0.1s ease',
                    }}
                    onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
                    onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                    + New Document
                </button>
            )}
        </div>
    );
}
