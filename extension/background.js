// background.js

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
        // Fallback saved quietly
      });
    }
  }
});

// Initialize context menu
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "save-highlight", // ID kept stable involved in logic
    title: "Save Snippet",
    contexts: ["selection"]
  });
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
