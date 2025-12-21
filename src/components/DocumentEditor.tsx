'use client';

import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import { Mark, mergeAttributes, Extension } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import BubbleMenuExtension from '@tiptap/extension-bubble-menu';
import { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { useStorage } from '@/contexts/StorageContext';

export interface DocumentEditorHandle {
    removeHighlightMark: (id: string) => void;
}

interface DocumentEditorProps {
    documentId: string;
    initialTitle: string;
    initialContent: string;
    onEditorReady?: (editor: any) => void;
}




const HighlightMark = Mark.create({
    name: 'highlightMarker',

    addOptions() {
        return {
            HTMLAttributes: {},
        }
    },

    inclusive: false,

    parseHTML() {
        return [
            {
                tag: 'span.highlight-marker',
                getAttrs: (node: string | HTMLElement) => {
                    if (typeof node === 'string') return {};
                    const element = node as HTMLElement;
                    const style = element.getAttribute('style');
                    const id = element.getAttribute('data-highlight-id');
                    return { style, id };
                }
            },
        ]
    },

    renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, any> }) {
        // @ts-ignore
        return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { class: 'highlight-marker' }), 0]
    },

    addAttributes() {
        return {
            style: {
                default: null,
                parseHTML: (element: HTMLElement) => element.getAttribute('style'),
                renderHTML: (attributes: Record<string, any>) => {
                    if (!attributes.style) return {}
                    return { style: attributes.style }
                },
            },
            id: {
                default: null,
                parseHTML: (element: HTMLElement) => element.getAttribute('data-highlight-id'),
                renderHTML: (attributes: Record<string, any>) => {
                    if (!attributes.id) return {}
                    return { 'data-highlight-id': attributes.id }
                },
            },
        }
    },
});

const RTLSupport = Extension.create({
    name: 'rtlSupport',

    addGlobalAttributes() {
        return [
            {
                types: ['paragraph', 'heading', 'bulletList', 'orderedList', 'listItem'],
                attributes: {
                    dir: {
                        default: 'auto',
                        parseHTML: (element: HTMLElement) => element.getAttribute('dir'),
                        renderHTML: (attributes: Record<string, any>) => {
                            return { dir: attributes.dir }
                        },
                    },
                },
            },
        ]
    },
});

const DocumentEditor = forwardRef<DocumentEditorHandle, DocumentEditorProps>(({ documentId, initialTitle, initialContent, onEditorReady }, ref) => {
    // ... existing state ...
    const { updateDocument } = useStorage();
    const [title, setTitle] = useState(initialTitle);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const saveDocument = useCallback(async (currentTitle: string, currentContent: string) => {
        setIsSaving(true);
        try {
            await updateDocument(documentId, { title: currentTitle, content: currentContent });
            setLastSaved(new Date());
        } catch (error) {
            console.error('Error saving document:', error);
        } finally {
            setIsSaving(false);
        }
    }, [documentId, updateDocument]);

    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({
                placeholder: 'Start writing...',
            }),
            BubbleMenuExtension,
            HighlightMark,
            RTLSupport,
        ],
        content: initialContent, // Tiptap handles HTML content
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[400px] text-lg leading-relaxed text-foreground font-body outline-none',
            },
        },
        immediatelyRender: false, // Fix for SSR hydration mismatch
        onUpdate: ({ editor }) => {
            // Debounce save
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
            saveTimeoutRef.current = setTimeout(() => {
                saveDocument(title, editor.getHTML());
            }, 1000);
        },
    });

    // ... sync effects ...
    // Sync title changes
    useEffect(() => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        saveTimeoutRef.current = setTimeout(() => {
            if (editor) {
                saveDocument(title, editor.getHTML());
            }
        }, 1000);
    }, [title, editor, saveDocument]);

    // Handle initial content updates from server (e.g. if new highlights added)
    useEffect(() => {
        if (editor && initialContent && initialContent !== editor.getHTML()) {
            // Only update if significantly different/longer to avoid overwriting cursor state
            // This is a simple check; for real-time collab, use Yjs
            if (initialContent.length > (editor.getHTML()?.length || 0)) {
                editor.commands.setContent(initialContent);
            }
        }
    }, [initialContent, editor]);

    // Expose methods to parent via ref
    useImperativeHandle(ref, () => ({
        removeHighlightMark: (id: string) => {
            if (!editor) return;
            const { tr } = editor.state;
            let transactionModified = false;

            editor.state.doc.descendants((node, pos) => {
                if (!node.marks || node.marks.length === 0) return true;

                node.marks.forEach((mark: any) => { // Type cast for Mark if needed, or rely on inference
                    if (mark.type.name === 'highlightMarker' &&
                        mark.attrs.id &&
                        mark.attrs.id === id) {

                        tr.removeMark(pos, pos + node.nodeSize, mark);
                        transactionModified = true;
                    }
                });
                return true;
            });

            if (transactionModified) {
                editor.view.dispatch(tr);
            }
        }
    }));

    // Expose editor instance
    useEffect(() => {
        if (editor && onEditorReady) {
            onEditorReady(editor);
        }
    }, [editor, onEditorReady]);

    return (
        <div
            style={{ viewTransitionName: `document-card-${documentId}` }}
            className="w-full max-w-[800px] mx-auto"
        >

            {/* Title */}
            {/* Title */}
            <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{
                    viewTransitionName: `doc-title-${documentId}`,
                    fieldSizing: 'content'
                } as React.CSSProperties}
                className="text-[2.5rem] font-heading font-bold border-none outline-none bg-transparent text-foreground w-auto min-w-[300px] max-w-full mb-4 p-0 placeholder:text-muted/50"
                placeholder="Untitled"
            />

            {/* Floating Bubble Menu */}
            {editor && (
                <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
                    <div className="flex gap-1 p-2 rounded-lg bg-popover border border-border shadow-md">
                        <button
                            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                            className={`px-2 py-1 rounded border-none cursor-pointer font-bold text-sm ${editor.isActive('heading', { level: 1 }) ? 'bg-accent text-accent-foreground' : 'bg-transparent text-foreground hover:bg-muted/10'}`}
                        >
                            H1
                        </button>
                        <button
                            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                            className={`px-2 py-1 rounded border-none cursor-pointer font-bold text-sm ${editor.isActive('heading', { level: 2 }) ? 'bg-accent text-accent-foreground' : 'bg-transparent text-foreground hover:bg-muted/10'}`}
                        >
                            H2
                        </button>
                        <div className="w-px bg-border mx-1" />
                        <button
                            onClick={() => editor.chain().focus().toggleBold().run()}
                            className={`px-2 py-1 rounded border-none cursor-pointer font-bold text-sm ${editor.isActive('bold') ? 'bg-accent text-accent-foreground' : 'bg-transparent text-foreground hover:bg-muted/10'}`}
                        >
                            B
                        </button>
                        <button
                            onClick={() => editor.chain().focus().toggleItalic().run()}
                            className={`px-2 py-1 rounded border-none cursor-pointer italic text-sm ${editor.isActive('italic') ? 'bg-accent text-accent-foreground' : 'bg-transparent text-foreground hover:bg-muted/10'}`}
                        >
                            I
                        </button>
                        <div className="w-px bg-border mx-1" />
                        <button
                            onClick={() => editor.chain().focus().toggleBulletList().run()}
                            className={`px-2 py-1 rounded border-none cursor-pointer text-sm ${editor.isActive('bulletList') ? 'bg-accent text-accent-foreground' : 'bg-transparent text-foreground hover:bg-muted/10'}`}
                        >
                            • List
                        </button>
                    </div>
                </BubbleMenu>
            )}

            {/* Editor Content */}
            <EditorContent editor={editor} />

            <style jsx global>{`
                /* Hide highlights in the editor as per user request */
                .ProseMirror .highlight-marker {
                    background-color: transparent !important;
                    background-image: none !important;
                    color: inherit !important;
                    padding: 0 !important;
                    /* We still keep the class/element for data persistence, just invisible styling */
                }
                
                .ProseMirror p.is-editor-empty:first-child::before {
                    color: hsl(var(--muted));
                    content: attr(data-placeholder);
                    float: left;
                    height: 0;
                    pointer-events: none;
                }
                .ProseMirror ul {
                    list-style-type: disc;
                    padding-left: 1.5em;
                }
                .ProseMirror ol {
                    list-style-type: decimal;
                    padding-left: 1.5em;
                }
                .ProseMirror h1 {
                    font-size: 2em;
                    font-weight: bold;
                    margin-top: 0.67em;
                    margin-bottom: 0.67em;
                }
                .ProseMirror h2 {
                    font-size: 1.5em;
                    font-weight: bold;
                    margin-top: 0.83em;
                    margin-bottom: 0.83em;
                }
                .ProseMirror p {
                    margin-bottom: 1.5em; /* Increased spacing between notes/paragraphs */
                }
                .ProseMirror h3 {
                    font-size: 1.17em;
                    font-weight: bold;
                    margin-top: 1em;
                    margin-bottom: 1em;
                }
            `}</style>
        </div>
    );
});

DocumentEditor.displayName = 'DocumentEditor';
export default DocumentEditor;
