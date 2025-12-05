'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import HighlightCard from '@/components/HighlightCard';
import DocumentPreviewCard from '@/components/DocumentPreviewCard';
import DocumentEditor from '@/components/DocumentEditor';
import SourcesSidebar from '@/components/SourcesSidebar';
import { useRouter, useSearchParams } from 'next/navigation';
import { getCategoryStyles, CATEGORY_CONFIG, Category, getCategoryFromUrl } from '@/utils/categories';
import { useToast } from '@/contexts/ToastContext';
import Header from '@/components/Header';
import { useStorage } from '@/contexts/StorageContext';
import ConnectFolder from '@/components/ConnectFolder';
import { HighlightType, DocumentType } from '@/services/FileSystemService';

function HomeContent() {
  const { showToast } = useToast();
  const {
    isConnected,
    isConnecting,
    highlights,
    documents,
    addHighlight,
    removeHighlight,
    addDocument,
    removeDocument,
    refreshData
  } = useStorage();

  const router = useRouter();
  const searchParams = useSearchParams();
  const editingDocId = searchParams.get('doc'); // Reactive directly from URL

  const [orderedHighlights, setOrderedHighlights] = useState<HighlightType[]>([]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [newlyCreatedDocId, setNewlyCreatedDocId] = useState<string | null>(null);

  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [dragOverDocId, setDragOverDocId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Set up intersection observer to track active document
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the entry with the highest intersection ratio
        const mostVisible = entries.reduce((prev, current) => {
          return (prev.intersectionRatio > current.intersectionRatio) ? prev : current;
        });

        if (mostVisible.isIntersecting && mostVisible.intersectionRatio > 0.3) {
          setActiveDocId(mostVisible.target.getAttribute('data-id'));
        }
      },
      {
        root: container,
        threshold: [0.1, 0.3, 0.5, 0.7, 0.9], // Multiple thresholds for better tracking
        rootMargin: '-10% 0px -10% 0px'
      }
    );

    const cards = container.querySelectorAll('.document-wrapper');
    cards.forEach((card) => observer.observe(card));

    return () => observer.disconnect();
  }, [documents]);

  // Set initial active doc
  useEffect(() => {
    if (documents.length > 0 && !activeDocId) {
      setActiveDocId(documents[0].id);
    }
  }, [documents]);

  if (isConnecting) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        Loading...
      </div>
    );
  }

  if (!isConnected) {
    return <ConnectFolder />;
  }

  // Document Editor Mode - when ?doc=ID is in URL
  if (editingDocId) {
    const editingDoc = documents.find(d => d.id === editingDocId);
    const docHighlights = highlights.filter(h => h.documentId === editingDocId);

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
          <Header variant="back" />
          <div style={{
            flex: '1 1 auto',
            maxWidth: '800px',
            minWidth: '320px',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <DocumentEditor
              documentId={editingDoc.id}
              initialTitle={editingDoc.title}
              initialContent={editingDoc.content || ''}
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

    // Still loading documents
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        Loading document...
      </div>
    );
  }

  const handleCreateDocument = async () => {
    try {
      const newDoc: DocumentType = {
        id: crypto.randomUUID(),
        title: 'Untitled Document',
        url: '', // Not really used for docs but required by type
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        content: ''
      };

      await addDocument(newDoc);
      setNewlyCreatedDocId(newDoc.id);

      // Scroll to the new document after a brief delay to allow rendering
      setTimeout(() => {
        scrollToDocument(newDoc.id);
      }, 100);
    } catch (error) {
      console.error('Error creating document:', error);
    }
  };

  const handleDeleteHighlight = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const highlightToDelete = highlights.find(h => h.id === id);
    if (!highlightToDelete) return;

    try {
      await removeHighlight(id);

      showToast('Highlight deleted', {
        type: 'success',
        onUndo: async () => {
          await addHighlight(highlightToDelete);
        }
      });
    } catch (error) {
      console.error('Error deleting highlight:', error);
    }
  };

  const handleMoveHighlight = () => {
    refreshData();
  };

  const handleDeleteDocument = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const docToDelete = documents.find(d => d.id === id);
    if (!docToDelete) return;

    try {
      // 1. Unlink associated highlights first (Orphan Cleanup)
      const linkedHighlights = highlights.filter(h => h.documentId === id);
      await Promise.all(linkedHighlights.map(h => addHighlight({ ...h, documentId: null })));

      // 2. Delete the document
      await removeDocument(id);
      showToast('Document deleted', {
        type: 'success',
        onUndo: async () => {
          // Restore document
          await addDocument(docToDelete);
          // Restore links
          await Promise.all(linkedHighlights.map(h => addHighlight({ ...h, documentId: id })));
        }
      });
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, highlightId: string) => {
    e.dataTransfer.setData('text/plain', highlightId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOverDoc = (e: React.DragEvent, docId: string) => {
    e.preventDefault(); // Allow dropping
    setDragOverDocId(docId);
  };

  const handleDragLeaveDoc = (e: React.DragEvent) => {
    setDragOverDocId(null);
  };

  const handleDropOnDoc = async (e: React.DragEvent, docId: string) => {
    e.preventDefault();
    setDragOverDocId(null);
    const highlightId = e.dataTransfer.getData('text/plain');

    if (highlightId) {
      try {
        const highlight = highlights.find(h => h.id === highlightId);
        if (highlight) {
          if (highlight.documentId === docId) {
            showToast('Already added to this document', { type: 'info' });
            return;
          }

          const updatedHighlight = { ...highlight, documentId: docId };
          await addHighlight(updatedHighlight); // Links metadata (Sidebar)

          // Also append text to document body (Editable Content)
          const targetDoc = documents.find(d => d.id === docId);
          if (targetDoc) {
            const newContent = targetDoc.content
              ? `${targetDoc.content}<p><br></p><p>${highlight.text}</p>`
              : `<p>${highlight.text}</p>`;

            await addDocument({
              ...targetDoc,
              content: newContent,
              updatedAt: new Date().toISOString()
            });

            showToast('Added to document', { type: 'success' });
          }
        }
      } catch (error) {
        console.error('Error moving highlight:', error);
      }
    }
  };

  const scrollToDocument = (docId: string) => {
    if (!scrollContainerRef.current) return;
    const element = scrollContainerRef.current.querySelector(`[data-id="${docId}"]`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleTitleUpdate = async (id: string, newTitle: string) => {
    try {
      const doc = documents.find(d => d.id === id);
      if (doc) {
        await addDocument({ ...doc, title: newTitle });
      }
    } catch (error) {
      console.error('Error updating document title:', error);
    }
  };

  // Filter highlights
  const filteredHighlights = selectedCategory
    ? highlights.filter(h => getCategoryFromUrl(h.url) === selectedCategory)
    : highlights;

  const unassignedHighlights = filteredHighlights.filter(h => !h.documentId);
  const assignedHighlights = filteredHighlights.filter(h => h.documentId);

  return (
    <main style={{
      height: '100vh',
      overflow: 'hidden',
      display: 'flex',
      justifyContent: 'center',
      backgroundColor: 'hsl(var(--background))',
    }}>
      <Header />
      <div style={{
        display: 'flex',
        width: 'fit-content', // Only take up needed space
        maxWidth: '100%',
        padding: '0 24px', // Requested 24px padding
        gap: '24px', // Reduced gap
        justifyContent: 'center',
        minWidth: '1200px', // Prevent layout shift below 1200px
      }}>

        {/* LEFT COLUMN: Highlights (Sticky) */}
        <div style={{
          width: '240px', // Reduced from 300px to make sticky notes smaller
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
                    // @ts-ignore - will add prop next
                    activeDocId={activeDocId}
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
                        onDelete={handleDeleteHighlight}
                        onMove={handleMoveHighlight}
                        // @ts-ignore
                        documents={documents}
                        // @ts-ignore - will add prop next
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

        {/* CENTER COLUMN: Documents (Scrollable) */}
        <div
          ref={scrollContainerRef}
          className="document-scroll-container"
          style={{
            flex: 1,
            height: '100vh',
            overflowY: 'auto',
            scrollSnapType: 'y mandatory',
            paddingTop: 'calc(50vh - 318px)', // Adjusted for 450px width (~636px height -> half is 318px)
            paddingBottom: '50vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            scrollbarWidth: 'none',
          }}
        >
          {documents.map((doc) => (
            <DocumentPreviewCard
              key={doc.id}
              // @ts-ignore
              doc={doc}
              highlights={highlights.filter(h => h.documentId === doc.id)}
              isActive={activeDocId === doc.id}
              isDragOver={dragOverDocId === doc.id}
              onDragOver={handleDragOverDoc}
              onDragLeave={handleDragLeaveDoc}
              onDrop={handleDropOnDoc}
              onDelete={handleDeleteDocument}
              onTitleUpdate={handleTitleUpdate}
              autoFocus={doc.id === newlyCreatedDocId}
            />
          ))}

          {documents.length === 0 && (
            <div style={{
              width: '100%',
              maxWidth: '650px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '0 20px',
            }}>
              <div
                onClick={handleCreateDocument}
                style={{
                  width: '450px', // Fixed width to prevent collapse
                  maxWidth: '100%',
                  aspectRatio: '1 / 1.414',
                  border: '2px dashed hsl(var(--border))',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '16px',
                  cursor: 'pointer',
                  color: 'hsl(var(--muted))',
                  transition: 'all 0.2s ease',
                  backgroundColor: 'transparent',
                  // transform: 'scale(1)', // Default to full size
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'hsl(var(--primary))';
                  e.currentTarget.style.color = 'hsl(var(--primary))';
                  e.currentTarget.style.backgroundColor = 'hsl(var(--primary) / 0.05)';
                  // e.currentTarget.style.transform = 'scale(1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'hsl(var(--border))';
                  e.currentTarget.style.color = 'hsl(var(--muted))';
                  e.currentTarget.style.backgroundColor = 'transparent';
                  // e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  border: '2px solid currentColor',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  fontWeight: 300,
                }}>
                  +
                </div>
                <span style={{ fontSize: '1rem', fontWeight: 500 }}>Create a Document</span>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Document Index (Sticky) */}
        <div style={{
          width: '250px',
          paddingTop: 'calc(50vh - 300px)',
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          position: 'sticky',
          top: 0,
          justifyContent: documents.length === 0 ? 'flex-start' : 'space-between', // Top align if empty
          paddingBottom: 'calc(50vh - 300px)',
        }}>

          {/* App Info Section (Empty State) - Shown when filters are NOT shown */}
          {!(highlights.length > 0 && Array.from(new Set(highlights.map(h => getCategoryFromUrl(h.url)))).filter(c => c !== 'other').length > 1) && (
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

          {/* Category Tags - Only show if highlights exist and there is more than one category */}
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

          {/* Document List - Bottom Aligned */}
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

          {/* Create Button (Bottom) - Only show if documents exist */}
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

      </div>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}

