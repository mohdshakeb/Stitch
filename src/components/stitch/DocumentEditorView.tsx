import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useReactToPrint } from 'react-to-print';
import { useToast } from '@/contexts/ToastContext';
import { useStorage } from '@/contexts/StorageContext';
import DocumentEditor, { DocumentEditorHandle } from '@/components/DocumentEditor';
import Header from '@/components/Header';
import CitationPanel from '@/components/stitch/CitationPanel';
import { DocumentType, HighlightType } from '@/services/FileSystemService';
import { Editor } from '@tiptap/react';
import { RiFilePdfLine, RiFileCopyLine } from '@remixicon/react';

interface DocumentEditorViewProps {
    editingDoc: DocumentType | undefined;
    documents: DocumentType[];
    docHighlights: HighlightType[];
    editingDocId: string;
}

export default function DocumentEditorView({
    editingDoc,
    documents,
    docHighlights,
    editingDocId
}: DocumentEditorViewProps) {
    const router = useRouter();
    const { showToast } = useToast();
    const { addHighlight } = useStorage();
    const [editor, setEditor] = useState<Editor | null>(null);
    const editorRef = useRef<DocumentEditorHandle>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    const handleRetrieve = (text: string) => {
        if (editor) {
            // Insert text at current selection
            // We can wrap it in a highlight mark if we want to restore "highlight" status in the editor,
            // but the user said "retrieved notes are just text".
            // However, sticking to the philosophy "Citation Manager", maybe just text is best.
            // "Everything added notes... are all just text".
            editor.chain().focus().insertContent(text).run();
            showToast('Note inserted', { type: 'success', duration: 1500 });
        }
    };

    const handleUnlink = async (url: string) => {
        if (!editingDoc) return;

        // Find all highlights in this doc that match the URL
        const highlightsToUnlink = docHighlights.filter(h => h.url === url);

        if (highlightsToUnlink.length === 0) return;

        let successCount = 0;
        for (const h of highlightsToUnlink) {
            // Remove current doc ID from documentIds
            const currentDocIds = h.documentIds || [];
            const newDocIds = currentDocIds.filter(id => id !== editingDocId);

            // Legacy check (if documentId is essentially just the last item of newDocIds)
            const newLegacyId = newDocIds.length > 0 ? newDocIds[newDocIds.length - 1] : undefined;

            await addHighlight({
                ...h,
                documentIds: newDocIds,
                documentId: newLegacyId
            });
            successCount++;
        }

        // Editor logic update in handleUnlink
        // Clean up the editor visual state: Remove the highlights from the text
        if (editorRef.current && successCount > 0) {
            const unlinkedIds = highlightsToUnlink.map(h => h.id);
            unlinkedIds.forEach(id => {
                editorRef.current?.removeHighlightMark(id);
            });
        }

        // Usage in JSX
        <DocumentEditor
            ref={editorRef}
            documentId={editingDoc.id}
            initialTitle={editingDoc.title}
            initialContent={editingDoc.content || ''}
            onEditorReady={setEditor}
        />

        if (successCount > 0) {
            showToast('Unlinked from document', {
                type: 'success',
                description: `Removed citation and ${successCount} notes.`
            });
        }
    };

    // Light-weight PDF export using native browser print
    const handlePrint = useReactToPrint({
        contentRef,
        documentTitle: editingDoc ? editingDoc.title : 'Document',
        onAfterPrint: () => showToast('Exported successfully', { type: 'success' }),
        pageStyle: `
            @page {
                size: auto;
                margin: 20mm;
            }
            @media print {
                body {
                    -webkit-print-color-adjust: exact;
                }
                /* Hide browser default headers/footers */
                @page {
                    margin: 0;
                }
                /* Add padding to the content body instead of page margin to simulate margins w/o headers */
                body {
                    padding: 20mm;
                }
            }
        `
    });

    const handleCopy = () => {
        if (!editor) return;

        // Copy formatted HTML to clipboard via Clipboard API if supported, or generic text
        // Tiptap's getText gives plain text. getHTML gives HTML.
        // We generally want "entire text" mostly readable.
        // Using writeText with getText() is safest for "paste anywhere".
        const text = editor.getText();
        if (text) {
            navigator.clipboard.writeText(text).then(() => {
                showToast('Copied to clipboard', { type: 'success' });
            }).catch(() => {
                showToast('Failed to copy', { type: 'error' });
            });
        }
    };

    if (!editingDoc && documents.length > 0) {
        return (
            <div className="p-8 text-center">
                <Header variant="back" />
                <p>Document not found (ID: {editingDocId})</p>
                <button
                    onClick={() => {
                        router.push('/');
                    }}
                    className="mt-4 px-4 py-2 cursor-pointer bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                    Go Back
                </button>
            </div>
        );
    }

    if (editingDoc) {
        return (
            <div className="flex flex-col xl:flex-row items-center xl:items-stretch justify-center min-h-screen bg-surface gap-6 pt-20 px-4 pb-8 transition-colors duration-300">
                <Header
                    variant="back"
                    actions={
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => handlePrint()}
                                className="bg-transparent border-none cursor-pointer p-2 rounded-full flex items-center justify-center text-foreground transition-colors duration-200 hover:bg-muted/10"
                                title="Export to PDF"
                            >
                                <RiFilePdfLine size={16} />
                            </button>
                            <button
                                onClick={handleCopy}
                                className="bg-transparent border-none cursor-pointer p-2 rounded-full flex items-center justify-center text-foreground transition-colors duration-200 hover:bg-muted/10"
                                title="Copy entire text"
                            >
                                <RiFileCopyLine size={16} />
                            </button>
                        </div>
                    }
                />

                {/* Main Editor Area */}
                <div
                    ref={contentRef}
                    className="w-full max-w-[680px] flex flex-col"
                >
                    <DocumentEditor
                        ref={editorRef}
                        documentId={editingDoc.id}
                        initialTitle={editingDoc.title}
                        initialContent={editingDoc.content || ''}
                        onEditorReady={setEditor}
                    />
                </div>

                {/* Right Citation Panel */}
                <div className="w-full max-w-[680px] xl:max-w-none xl:w-auto flex justify-start items-start pt-10 xl:pt-24 xl:pl-0">
                    {docHighlights.length > 0 && (
                        <div className="sticky top-24 w-full xl:w-[300px]">
                            <CitationPanel highlights={docHighlights} onUnlink={handleUnlink} onRetrieve={handleRetrieve} />
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Fallback for loading state
    return (
        <div className="p-8 text-center text-muted">
            Loading document...
        </div>
    );
}
