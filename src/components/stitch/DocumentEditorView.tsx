import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useReactToPrint } from 'react-to-print';
import { useToast } from '@/contexts/ToastContext';
import DocumentEditor from '@/components/DocumentEditor';
import Header from '@/components/Header';
import SourcesSidebar from '@/components/SourcesSidebar';
import { DocumentType, HighlightType } from '@/services/FileSystemService';
import { Editor } from '@tiptap/react';

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
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <Header variant="back" />
                <p>Document not found (ID: {editingDocId})</p>
                <button
                    onClick={() => {
                        router.push('/');
                    }}
                    style={{ marginTop: '1rem', padding: '8px 16px', cursor: 'pointer' }}
                >
                    Go Back
                </button>
            </div>
        );
    }

    if (editingDoc) {
        return (
            <div style={{
                display: 'flex',
                minHeight: '100vh',
                backgroundColor: 'hsl(var(--background))',
                gap: '24px',
                padding: '80px var(--space-4) var(--space-8)',
                justifyContent: 'center',
                alignItems: 'flex-start',
                minWidth: '1200px',
            }}>
                <Header
                    variant="back"
                    actions={
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <button
                                onClick={() => handlePrint()}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '8px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'hsl(var(--foreground))',
                                    transition: 'background-color 0.2s ease',
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'hsl(var(--muted) / 0.1)'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                title="Export to PDF"
                            >
                                <i className="ri-file-pdf-line" style={{ fontSize: '1rem' }}></i>
                            </button>
                            <button
                                onClick={handleCopy}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '8px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'hsl(var(--foreground))',
                                    transition: 'background-color 0.2s ease',
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'hsl(var(--muted) / 0.1)'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                title="Copy entire text"
                            >
                                <i className="ri-file-copy-line" style={{ fontSize: '1rem' }}></i>
                            </button>
                        </div>
                    }
                />
                <div
                    ref={contentRef}
                    style={{
                        flex: '1 1 auto',
                        maxWidth: '800px',
                        minWidth: '320px',
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        // Ensure print styles look good (text color on white background usually)
                        // But inheriting current theme is also fine for dark mode users who want dark pdfs?
                        // Usually PDFs are preferred light.
                        // For now, let's keep it WYSIWYG.
                    }}
                >
                    <DocumentEditor
                        documentId={editingDoc.id}
                        initialTitle={editingDoc.title}
                        initialContent={editingDoc.content || ''}
                        onEditorReady={setEditor}
                    />
                </div>

                {docHighlights.length > 0 && (
                    <div style={{
                        flex: '0 1 280px',
                        minWidth: '220px',
                        position: 'sticky',
                        top: '80px',
                        maxHeight: 'calc(100vh - 100px)',
                        overflowY: 'auto',
                        scrollbarWidth: 'none',
                    }}>
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

    // Fallback for loading state (usually handled by parent, but safe to keep)
    return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
            Loading document...
        </div>
    );
}
