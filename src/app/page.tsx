'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/contexts/ToastContext';
import { useStorage } from '@/contexts/StorageContext';
import { HighlightType, DocumentType } from '@/services/FileSystemService';
import { Category, getCategoryStyles } from '@/utils/categories';

// Components
import ConnectFolder from '@/components/ConnectFolder';
import InstallExtensionModal from '@/components/InstallExtensionModal';
import HighlightFeed from '@/components/stitch/HighlightFeed';
import DocumentFeed from '@/components/stitch/DocumentFeed';
import RightSidebar from '@/components/stitch/RightSidebar';
import DocumentEditorView from '@/components/stitch/DocumentEditorView';
import StitchLayout from '@/components/stitch/StitchLayout';

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
    refreshData,
    extensionId,
    isExtensionAvailable
  } = useStorage();

  const router = useRouter();
  const searchParams = useSearchParams();
  const editingDocId = searchParams.get('doc'); // Reactive directly from URL

  const [newlyCreatedDocId, setNewlyCreatedDocId] = useState<string | null>(null);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [dragOverDocId, setDragOverDocId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
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

  // --- Handlers ---

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

      // Clear the auto-focus state after a short delay so subsequent updates (like drops) don't re-focus/scroll to this doc
      setTimeout(() => {
        setNewlyCreatedDocId(null);
      }, 2000);
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
        description: 'The selected highlight has been removed.',
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

  const getDocIds = (h: HighlightType) => {
    if (h.documentIds && h.documentIds.length > 0) return h.documentIds;
    if (h.documentId) return [h.documentId];
    return [];
  };

  const handleDragStart = (e: React.DragEvent, highlightId: string) => {
    e.dataTransfer.setData('text/plain', highlightId);
    e.dataTransfer.effectAllowed = 'copyMove'; // Enable copy behavior for multi-assign
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
          const currentIds = getDocIds(highlight);

          if (currentIds.includes(docId)) {
            showToast('Already added', {
              type: 'info',
              description: 'This highlight is already part of this document.'
            });
            return;
          }

          // Append new Doc ID
          const newIds = [...currentIds, docId];
          const updatedHighlight = {
            ...highlight,
            documentIds: newIds,
            documentId: docId // Update legacy field to point to most recent
          };

          await addHighlight(updatedHighlight); // Links metadata (Sidebar)

          // Also append text to document body (Editable Content)
          const targetDoc = documents.find(d => d.id === docId);

          if (!targetDoc) {
            console.error('Target document not found');
            return;
          }
          const color = highlight.color || getCategoryStyles(highlight.url).color;
          // Calculate duration based on text length (0.02s per char), min 0.8s, max 3s
          const duration = Math.min(3, Math.max(0.8, highlight.text.length * 0.02));

          const newContent = targetDoc.content
            ? `${targetDoc.content}<p><span data-highlight-id="${highlight.id}" class="highlight-marker highlight-animate" style="--highlight-color: ${color}; --highlight-duration: ${duration}s">${highlight.text}</span></p>`
            : `<p><span data-highlight-id="${highlight.id}" class="highlight-marker highlight-animate" style="--highlight-color: ${color}; --highlight-duration: ${duration}s">${highlight.text}</span></p>`;

          await addDocument({
            ...targetDoc,
            content: newContent,
            updatedAt: new Date().toISOString()
          });

          showToast('Added to document', {
            type: 'success',
            description: 'The highlight text has been appended to the document.'
          });

          // Cleanup animation class after it plays to prevent re-triggering
          setTimeout(async () => {
            // Remove the animation class but keep the marker class and inline style
            // This is a "blind" update assuming no other concurrent edits occurred in the last few seconds.
            // For a local-first single-user app, this is an acceptable trade-off for the visual effect.
            const cleanContent = newContent.replace(/ highlight-animate/g, '');

            await addDocument({
              ...targetDoc,
              content: cleanContent, // Using the variable from closure is safe here as it hasn't changed locally
              updatedAt: new Date().toISOString()
            });
          }, duration * 1000 + 500); // Wait for animation + buffer

        }
      } catch (error) {
        console.error('Error moving highlight:', error);
      }
    }
  };

  const handleDeleteDocument = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const docToDelete = documents.find(d => d.id === id);
    if (!docToDelete) return;

    try {
      // 1. Unlink associated highlights first (Orphan Cleanup)
      const linkedHighlights = highlights.filter(h => getDocIds(h).includes(id));

      for (const h of linkedHighlights) {
        const currentIds = getDocIds(h);
        const newIds = currentIds.filter(d => d !== id);
        const newLegacyId = newIds.length > 0 ? newIds[newIds.length - 1] : null;

        await addHighlight({
          ...h,
          documentIds: newIds,
          documentId: newLegacyId
        });
      }

      // 2. Delete the document
      await removeDocument(id);
      showToast('Document deleted', {
        type: 'success',
        description: 'The document and its content have been removed.',
        onUndo: async () => {
          await addDocument(docToDelete);
          for (const h of linkedHighlights) {
            await addHighlight({ ...h, documentIds: [...getDocIds(h), id], documentId: id });
          }
        }
      });
    } catch (error) {
      console.error('Error deleting document:', error);
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

  // --- Render ---

  if (isConnecting) {
    return (
      <div className="flex h-screen items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!isConnected) {
    return <ConnectFolder />;
  }

  // Document Editor Mode
  if (editingDocId) {
    const editingDoc = documents.find(d => d.id === editingDocId);
    const docHighlights = highlights.filter(h => getDocIds(h).includes(editingDocId || '')); // Safer check
    return <DocumentEditorView
      editingDoc={editingDoc}
      documents={documents}
      docHighlights={docHighlights}
      editingDocId={editingDocId}
    />;
  }

  return (
    <StitchLayout>
      {/* 1. Left Column: Highlight Stream */}
      <HighlightFeed
        highlights={highlights}
        documents={documents}
        activeDocId={activeDocId}
        selectedCategory={selectedCategory}
        handleDeleteHighlight={handleDeleteHighlight}
        handleMoveHighlight={handleMoveHighlight}
        handleDragStart={handleDragStart}
      />

      {/* 2. Center Column: Document Feed */}
      <DocumentFeed
        ref={scrollContainerRef}
        documents={documents}
        highlights={highlights}
        activeDocId={activeDocId}
        dragOverDocId={dragOverDocId}
        newlyCreatedDocId={newlyCreatedDocId}
        handleDragOverDoc={handleDragOverDoc}
        handleDragLeaveDoc={handleDragLeaveDoc}
        handleDropOnDoc={handleDropOnDoc}
        handleDeleteDocument={handleDeleteDocument}
        handleTitleUpdate={handleTitleUpdate}
        handleCreateDocument={handleCreateDocument}
      />

      {/* 3. Right Column: Sidebar & Navigation */}
      <RightSidebar
        documents={documents}
        highlights={highlights}
        activeDocId={activeDocId}
        scrollToDocument={scrollToDocument}
        isExtensionAvailable={isExtensionAvailable}
        setIsInstallModalOpen={setIsInstallModalOpen}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        handleCreateDocument={handleCreateDocument}
      />

      <InstallExtensionModal isOpen={isInstallModalOpen} onClose={() => setIsInstallModalOpen(false)} />
    </StitchLayout>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}
