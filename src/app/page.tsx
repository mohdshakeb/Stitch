'use client';

import { useState, useEffect, useRef, Suspense, useCallback, useLayoutEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/contexts/ToastContext';
import { useStorage } from '@/contexts/StorageContext';
import { HighlightType, DocumentType } from '@/services/FileSystemService';
import { Category, getCategoryStyles } from '@/utils/categories';

// Components
import ConnectFolder from '@/components/ConnectFolder';
import HighlightFeed from '@/components/stitch/HighlightFeed';
import DocumentFeed from '@/components/stitch/DocumentFeed';
import RightSidebar from '@/components/stitch/RightSidebar';
import DocumentEditorView from '@/components/stitch/DocumentEditorView';
import StitchLayout from '@/components/stitch/StitchLayout';
import HighlightCard from '@/components/HighlightCard';
import { useDraggableHighlights } from '@/hooks/useDraggableHighlights';

// Dnd Kit Imports
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { motion } from 'framer-motion';

const defaultDropAnimation = {
  duration: 300,
  easing: 'cubic-bezier(0.60, 0.04, 0.98, 0.34)',
};

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
  const isBackNav = searchParams.get('nav') === 'back';
  const focusReq = searchParams.get('focusReq');

  // Instant scroll to target card to ensure View Transition validity
  useLayoutEffect(() => {
    if (focusReq && isBackNav && scrollContainerRef.current) {
      const element = scrollContainerRef.current.querySelector(`[data-id="${focusReq}"]`);
      if (element) {
        element.scrollIntoView({ behavior: 'auto', block: 'center' });
      }
    }
  }, [focusReq, isBackNav, documents]);

  // Clean up the URL query param so refreshes animate normally
  useEffect(() => {
    if (isBackNav) {
      const url = new URL(window.location.href);
      url.searchParams.delete('nav');
      window.history.replaceState({}, '', url);
    }
  }, [isBackNav]);

  const [newlyCreatedDocId, setNewlyCreatedDocId] = useState<string | null>(null);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // --- Drag and Drop Hook ---
  const {
    activeDragItem,
    processingDropId,
    dropAnimation,
    dragPreviewRef,
    sensors,
    handleDragStart,
    handleDragEnd
  } = useDraggableHighlights({
    documents,
    highlights,
    addHighlight,
    addDocument,
    showToast
  });

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

      // Scroll to the new document immediately (RAF handles timing)
      scrollToDocument(newDoc.id);

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


  // Handlers moved to useDraggableHighlights hook

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

    // Use requestAnimationFrame to ensure DOM is updated
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!scrollContainerRef.current) return;
        const element = scrollContainerRef.current.querySelector(`[data-id="${docId}"]`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
    });
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
    return null; // Or a loading spinner if preferred, but null prevents flash
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
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <StitchLayout>
        {/* 1. Left Column: Highlight Stream */}
        <motion.div
          initial={isBackNav ? false : { x: -30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{
            duration: 1,
            ease: [0.175, 0.885, 0.32, 1.1],
            delay: 0.5,
          }}
          className="h-screen w-[240px]"
        >
          <HighlightFeed
            highlights={highlights}
            documents={documents}
            activeDocId={activeDocId}
            selectedCategory={selectedCategory}
            filteredIds={processingDropId ? [processingDropId] : []}
            handleDeleteHighlight={handleDeleteHighlight}
            handleMoveHighlight={handleMoveHighlight}
          />
        </motion.div>

        {/* 2. Center Column: Document Feed */}
        <motion.div
          initial={isBackNav ? false : { opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="h-screen flex-[0.8]"
        >
          <DocumentFeed
            ref={scrollContainerRef}
            documents={documents}
            highlights={highlights}
            activeDocId={activeDocId}
            newlyCreatedDocId={newlyCreatedDocId}
            handleDeleteDocument={handleDeleteDocument}
            handleTitleUpdate={handleTitleUpdate}
            handleCreateDocument={handleCreateDocument}
            disableSnap={isBackNav}
          />
        </motion.div>

        {/* 3. Right Column: Sidebar & Navigation */}
        <motion.div
          initial={isBackNav ? false : { x: 30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{
            duration: 1,
            ease: [0.175, 0.885, 0.32, 1.1],
            delay: 0.5,
          }}
          className="h-screen w-[250px]"
        >
          <RightSidebar
            documents={documents}
            highlights={highlights}
            activeDocId={activeDocId}
            scrollToDocument={scrollToDocument}
            isExtensionAvailable={isExtensionAvailable}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            handleCreateDocument={handleCreateDocument}
          />
        </motion.div>

        <DragOverlay dropAnimation={dropAnimation}>
          {activeDragItem ? (
            <div ref={dragPreviewRef} className="w-[220px] h-[220px] -rotate-6 shadow-2xl cursor-grabbing">
              <HighlightCard
                id={activeDragItem.id}
                text={activeDragItem.text}
                url={activeDragItem.url}
                title={activeDragItem.title}
                favicon={activeDragItem.favicon}
                createdAt={activeDragItem.createdAt}
                color={activeDragItem.color}
                documentId={activeDragItem.documentId || undefined}
                documentIds={activeDragItem.documentIds}
                documents={documents}
                className="w-full h-full"
              />
            </div>
          ) : null}
        </DragOverlay>
      </StitchLayout>
    </DndContext>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}
