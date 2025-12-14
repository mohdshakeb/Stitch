import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useReactToPrint } from 'react-to-print';
import { useToast } from '@/contexts/ToastContext';
import DocumentEditor from '@/components/DocumentEditor';
import Header from '@/components/Header';
import SourcesSidebar from '@/components/SourcesSidebar';
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
    const [editor, setEditor] = useState<Editor | null>(null);
    const contentRef = useRef<HTMLDivElement>(null);

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
            <div className="flex min-h-screen bg-background gap-6 pt-20 px-4 pb-8 justify-center items-start min-w-[1200px]">
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
                <div
                    ref={contentRef}
                    className="flex-auto max-w-[800px] min-w-[320px] w-full flex flex-col"
                >
                    <DocumentEditor
                        documentId={editingDoc.id}
                        initialTitle={editingDoc.title}
                        initialContent={editingDoc.content || ''}
                        onEditorReady={setEditor}
                    />
                </div>

                {docHighlights.length > 0 && (
                    <div className="flex-[0_1_280px] min-w-[220px] sticky top-20 max-h-[calc(100vh-100px)] overflow-y-auto no-scrollbar">
                        <SourcesSidebar highlights={docHighlights.map(h => ({
                            ...h,
                            title: h.title || null,
                            favicon: h.favicon || null,
                            documentId: h.documentId || null
                        }))} />
                    </div>
                )}
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
