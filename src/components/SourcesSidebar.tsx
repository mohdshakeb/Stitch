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
        <aside className="w-[280px] h-fit">
            <div className="flex flex-col gap-2">
                {highlights.map((highlight) => (
                    <a
                        key={highlight.id}
                        href={highlight.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2 rounded-md bg-surface border border-border no-underline transition-all duration-200 hover:border-primary hover:bg-primary/5"
                    >
                        {highlight.favicon && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={highlight.favicon}
                                alt=""
                                className="w-4 h-4 rounded-sm shrink-0"
                            />
                        )}
                        <div className="overflow-hidden flex-1">
                            <div className="text-sm font-medium text-foreground whitespace-nowrap overflow-hidden text-ellipsis">
                                {highlight.title || new URL(highlight.url).hostname}
                            </div>
                            <div className="text-xs text-muted whitespace-nowrap overflow-hidden text-ellipsis">
                                {new URL(highlight.url).hostname}
                            </div>
                        </div>
                    </a>
                ))}
            </div>
        </aside>
    );
}
