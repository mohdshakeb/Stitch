'use client';

import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import { Mark, mergeAttributes } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import BubbleMenuExtension from '@tiptap/extension-bubble-menu';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useStorage } from '@/contexts/StorageContext';

interface DocumentEditorProps {
    documentId: string;
    initialTitle: string;
    initialContent: string;
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
                    return { style };
                }
            },
        ]
    },

    renderHTML({ HTMLAttributes }) {
        // @ts-ignore
        return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { class: 'highlight-marker' }), 0]
    },

    addAttributes() {
        return {
            style: {
                default: null,
                parseHTML: (element: HTMLElement) => element.getAttribute('style'),
                renderHTML: (attributes: Record<string, any>) => {
                    if (!attributes.style) {
                        return {}
                    }
                    return {
                        style: attributes.style,
                    }
                },
            },
        }
    },
});

export default function DocumentEditor({ documentId, initialTitle, initialContent }: DocumentEditorProps) {
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
        ],
        content: initialContent, // Tiptap handles HTML content
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none',
                style: 'min-height: 400px; outline: none; font-size: 1.125rem; line-height: 1.8; color: hsl(var(--foreground)); font-family: var(--font-body);',
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

    return (
        <div style={{
            width: '100%',
            maxWidth: '800px', // Ensure it matches parent constraint
            margin: '0 auto',
            // padding removed here as parent handles it
        }}>

            {/* Title */}
            <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{
                    fontSize: '2.5rem',
                    fontFamily: 'var(--font-heading)',
                    fontWeight: 700,
                    border: 'none',
                    outline: 'none',
                    backgroundColor: 'transparent',
                    color: 'hsl(var(--foreground))',
                    width: '100%',
                    marginBottom: 'var(--space-4)',
                    padding: 0,
                }}
                placeholder="Untitled"
            />

            {/* Floating Bubble Menu */}
            {editor && (
                <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
                    <div style={{
                        display: 'flex',
                        gap: '4px',
                        padding: '8px',
                        borderRadius: '8px',
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        boxShadow: 'var(--shadow-md)',
                    }}>
                        <button
                            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                            className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}
                            style={{
                                padding: '4px 8px',
                                borderRadius: '4px',
                                backgroundColor: editor.isActive('heading', { level: 1 }) ? 'hsl(var(--accent))' : 'transparent',
                                color: editor.isActive('heading', { level: 1 }) ? 'hsl(var(--accent-foreground))' : 'hsl(var(--foreground))',
                                border: 'none',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                fontSize: '0.875rem'
                            }}
                        >
                            H1
                        </button>
                        <button
                            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                            className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}
                            style={{
                                padding: '4px 8px',
                                borderRadius: '4px',
                                backgroundColor: editor.isActive('heading', { level: 2 }) ? 'hsl(var(--accent))' : 'transparent',
                                color: editor.isActive('heading', { level: 2 }) ? 'hsl(var(--accent-foreground))' : 'hsl(var(--foreground))',
                                border: 'none',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                fontSize: '0.875rem'
                            }}
                        >
                            H2
                        </button>
                        <div style={{ width: '1px', backgroundColor: 'hsl(var(--border))', margin: '0 4px' }} />
                        <button
                            onClick={() => editor.chain().focus().toggleBold().run()}
                            className={editor.isActive('bold') ? 'is-active' : ''}
                            style={{
                                padding: '4px 8px',
                                borderRadius: '4px',
                                backgroundColor: editor.isActive('bold') ? 'hsl(var(--accent))' : 'transparent',
                                color: editor.isActive('bold') ? 'hsl(var(--accent-foreground))' : 'hsl(var(--foreground))',
                                border: 'none',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                fontSize: '0.875rem'
                            }}
                        >
                            B
                        </button>
                        <button
                            onClick={() => editor.chain().focus().toggleItalic().run()}
                            className={editor.isActive('italic') ? 'is-active' : ''}
                            style={{
                                padding: '4px 8px',
                                borderRadius: '4px',
                                backgroundColor: editor.isActive('italic') ? 'hsl(var(--accent))' : 'transparent',
                                color: editor.isActive('italic') ? 'hsl(var(--accent-foreground))' : 'hsl(var(--foreground))',
                                border: 'none',
                                cursor: 'pointer',
                                fontStyle: 'italic',
                                fontSize: '0.875rem'
                            }}
                        >
                            I
                        </button>
                        <div style={{ width: '1px', backgroundColor: 'hsl(var(--border))', margin: '0 4px' }} />
                        <button
                            onClick={() => editor.chain().focus().toggleBulletList().run()}
                            className={editor.isActive('bulletList') ? 'is-active' : ''}
                            style={{
                                padding: '4px 8px',
                                borderRadius: '4px',
                                backgroundColor: editor.isActive('bulletList') ? 'hsl(var(--accent))' : 'transparent',
                                color: editor.isActive('bulletList') ? 'hsl(var(--accent-foreground))' : 'hsl(var(--foreground))',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '0.875rem'
                            }}
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
                .ProseMirror h3 {
                    font-size: 1.17em;
                    font-weight: bold;
                    margin-top: 1em;
                    margin-bottom: 1em;
                }
            `}</style>
        </div>
    );
}
