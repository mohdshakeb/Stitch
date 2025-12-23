import React from 'react';
import { DocumentType, HighlightType } from '@/services/FileSystemService';
import { Category, CATEGORY_CONFIG, getCategoryFromUrl } from '@/utils/categories';
import { RiDownload2Line } from '@remixicon/react';

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
        <div className="w-[250px] flex flex-col items-center justify-between h-screen sticky top-0 py-[calc(50vh-300px)]">

            {/* 1. Onboarding State - Shown when Extension NOT available */}
            {!isExtensionAvailable && (
                <div className="flex flex-col gap-4 mt-0 w-full">
                    <div>
                        <h3 className="text-xl font-semibold mb-2">Welcome to Highlight</h3>
                        <p className="text-sm text-muted leading-relaxed">
                            To start collecting highlights from the web, you'll need our helper extension.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 items-start w-full">
                        <button
                            onClick={() => setIsInstallModalOpen(true)}
                            className="bg-transparent border-none text-foreground text-sm underline underline-offset-4 cursor-pointer p-0 hover:text-foreground/80"
                        >
                            See How
                        </button>

                        <button
                            onClick={() => setIsInstallModalOpen(true)}
                            className="px-4 py-2.5 bg-muted/10 text-foreground border border-border rounded-md text-sm font-medium cursor-pointer flex items-center justify-center gap-2 transition-all duration-200 w-full hover:bg-muted/15 hover:border-foreground"
                        >
                            <RiDownload2Line />
                            Download Extension
                        </button>
                    </div>
                </div>
            )}

            {/* 2. Welcome State - Shown when Connected AND No Filters */}
            {isExtensionAvailable && !(highlights.length > 0 && Array.from(new Set(highlights.map(h => getCategoryFromUrl(h.url)))).filter(c => c !== 'other').length > 1) && (
                <div className="flex flex-col gap-2 opacity-80 mt-0 w-full">
                    <h3 className="text-xl font-semibold">A place for your fragments</h3>
                    <p className="text-md text-muted leading-relaxed">
                        Stitch is a place where ideas come together — gently, naturally, piece by piece. Most of what we read leaves behind small traces: a line that resonates, a paragraph that sparks a thought, an excerpt that could lead somewhere. It’s where your ideas learn to belong to each other.
                    </p>
                </div>
            )}

            {/* 3. Category Tags - Only show if highlights exist and there is more than one category */}
            {highlights.length > 0 && Array.from(new Set(highlights.map(h => getCategoryFromUrl(h.url)))).filter(c => c !== 'other').length > 1 && (
                <div className="flex flex-col gap-4 w-full">
                    <span className="text-sm leading-relaxed text-foreground font-medium">Snippets from which type of source are you looking for?</span>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setSelectedCategory(null)}
                            className={`px-3 py-1 rounded-full border text-xs font-medium cursor-pointer transition-all duration-200 ${selectedCategory === null ? 'border-foreground bg-foreground text-background' : 'border-transparent bg-muted/10 text-muted hover:bg-muted/20'}`}
                        >
                            All
                        </button>
                        {['social', 'article', 'academic', 'ai']
                            .filter(cat => highlights.some(h => getCategoryFromUrl(h.url) === cat))
                            .map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(selectedCategory === cat ? null : (cat as Category))}
                                    className={`px-3 py-1 rounded-full border text-xs font-medium cursor-pointer transition-all duration-200 ${selectedCategory === cat ? '' : 'border-transparent bg-muted/10 text-muted hover:bg-muted/20'}`}
                                    style={selectedCategory === cat ? {
                                        borderColor: CATEGORY_CONFIG[cat as Category].borderColor,
                                        backgroundColor: CATEGORY_CONFIG[cat as Category].color,
                                        color: CATEGORY_CONFIG[cat as Category].textColor,
                                    } : {}}
                                >
                                    {CATEGORY_CONFIG[cat as Category].label}
                                </button>
                            ))}
                    </div>
                </div>
            )}

            {/* 4. Document List - Bottom Aligned */}
            {documents.length > 0 && (
                <div className="flex flex-col gap-2 flex-1 justify-end pb-8 w-full">
                    {documents.map((doc) => {
                        const isActive = activeDocId === doc.id;
                        return (
                            <button
                                key={doc.id}
                                onClick={() => scrollToDocument(doc.id)}
                                className={`nav-item bg-transparent border-none text-left py-1.5 text-[0.85rem] cursor-pointer flex items-center gap-3 relative transition-all duration-200 group ${isActive ? 'text-foreground font-medium opacity-100' : 'text-muted font-normal opacity-60 hover:opacity-100 hover:text-foreground'}`}
                            >
                                {/* Dot Indicator */}
                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 transition-all duration-200 ${isActive ? 'bg-foreground border-none' : 'bg-transparent border border-current'}`} />

                                {/* Text Label */}
                                <span className="whitespace-nowrap overflow-hidden text-ellipsis transition-transform duration-200 group-hover:translate-x-1">
                                    {doc.title}
                                </span>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* 5. Create Button (Bottom) - Only show if documents exist */}
            {documents.length > 0 && (
                <div className="w-full">
                    <button
                        onClick={handleCreateDocument}
                        className="px-4 py-2 bg-foreground text-background border-none rounded-md cursor-pointer text-[0.8rem] font-medium flex items-center justify-center gap-2 w-fit shadow-sm transition-transform duration-100 hover:scale-[0.98] active:scale-95 mx-0"
                    >
                        + New Document
                    </button>
                </div>
            )}
        </div>
    );
}
