'use client';

interface Highlight {
    id: string;
    url: string;
    title: string | null;
    favicon: string | null;
}

interface SourcesSidebarProps {
    highlights: Highlight[];
}

export default function SourcesSidebar({ highlights }: SourcesSidebarProps) {
    return (
        <aside style={{
            width: '280px',
            height: 'fit-content',
        }}>
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-2)',
            }}>
                {highlights.map((highlight) => (
                    <a
                        key={highlight.id}
                        href={highlight.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-2)',
                            padding: 'var(--space-2)',
                            borderRadius: 'var(--radius-md)',
                            backgroundColor: 'hsl(var(--surface))',
                            border: '1px solid hsl(var(--border))',
                            textDecoration: 'none',
                            transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'hsl(var(--primary))';
                            e.currentTarget.style.backgroundColor = 'hsl(var(--primary) / 0.05)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'hsl(var(--border))';
                            e.currentTarget.style.backgroundColor = 'hsl(var(--surface))';
                        }}
                    >
                        {highlight.favicon && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={highlight.favicon}
                                alt=""
                                style={{
                                    width: 16,
                                    height: 16,
                                    borderRadius: 2,
                                    flexShrink: 0,
                                }}
                            />
                        )}
                        <div style={{
                            overflow: 'hidden',
                            flex: 1,
                        }}>
                            <div style={{
                                fontSize: '0.875rem',
                                fontWeight: 500,
                                color: 'hsl(var(--foreground))',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                            }}>
                                {highlight.title || new URL(highlight.url).hostname}
                            </div>
                            <div style={{
                                fontSize: '0.75rem',
                                color: 'hsl(var(--muted))',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                            }}>
                                {new URL(highlight.url).hostname}
                            </div>
                        </div>
                    </a>
                ))}
            </div>
        </aside>
    );
}
