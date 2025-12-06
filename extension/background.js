// background.js

// Initialize alarm for sync
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "save-highlight",
    title: "Save Highlight",
    contexts: ["selection"]
  });
});

// Open App on Icon Click
chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: 'app/index.html' });
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "save-highlight" && info.selectionText) {
    const highlightData = {
      text: info.selectionText,
      url: tab.url,
      title: tab.title,
      favicon: tab.favIconUrl
    };

    // Send message to content script to show modal
    try {
      await chrome.tabs.sendMessage(tab.id, {
        type: 'SHOW_SAVE_MODAL',
        data: highlightData,
        documents: [] // No documents for now as we are offline/local
      });
    } catch (err) {
      console.error('Could not send message to content script:', err);
      // Fallback: save directly if content script fails (e.g. restricted page)
      saveToStorage({
        ...highlightData,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        tags: [],
        documentId: null
      }).then(() => {
        showToast(tab.id, 'Highlight saved (fallback)!');
      });
    }
  }
});

// Handle internal messages (Content Script -> Background)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'SAVE_HIGHLIGHT') {
    saveToStorage({
      ...request.data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      tags: [],
      documentId: request.documentId || null
    }).then(() => {
      showToast(sender.tab.id, 'Highlight saved!');
    });
  }
});

// Handle external messages (Web App -> Background)
chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
  if (request.type === 'PING') {
    sendResponse('PONG');
  } else if (request.type === 'GET_PENDING') {
    chrome.storage.local.get(['pendingHighlights']).then((result) => {
      sendResponse({ highlights: result.pendingHighlights || [] });
    });
    return true; // async response
  } else if (request.type === 'CLEAR_PENDING') {
    chrome.storage.local.set({ pendingHighlights: [] }).then(() => {
      sendResponse({ success: true });
    });
    return true; // async response
  }
});

async function saveToStorage(highlight) {
  const result = await chrome.storage.local.get(['pendingHighlights']);
  const pending = result.pendingHighlights || [];
  pending.push(highlight);
  await chrome.storage.local.set({ pendingHighlights: pending });
}

function showToast(tabId, message, isError = false) {
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    func: (msg, err) => {
      const toast = document.createElement('div');
      toast.textContent = msg;
      Object.assign(toast.style, {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        padding: '12px 24px',
        backgroundColor: err ? '#ef4444' : '#10b981',
        color: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        zIndex: '2147483647', // Max z-index
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        fontWeight: '500',
        transition: 'opacity 0.3s ease, transform 0.3s ease',
        opacity: '0',
        transform: 'translateY(10px)',
        pointerEvents: 'none'
      });

      document.body.appendChild(toast);

      requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
      });

      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        setTimeout(() => {
          document.body.removeChild(toast);
        }, 300);
      }, 3000);
    },
    args: [message, isError]
  });
}
