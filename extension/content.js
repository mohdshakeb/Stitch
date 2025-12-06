// content.js

// Handshake Protocol for Web App (Auto-Discovery)
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const isProduction = window.location.hostname.endsWith('.vercel.app'); // Broader check

if (isLocalhost || isProduction) {
  console.log('[Highlight Extension] Handshake initiated with:', window.location.origin);

  // 1. Announce existence immediately
  window.postMessage({ type: 'HIGHLIGHT_EXTENSION_ID', id: chrome.runtime.id }, '*');

  // 2. Listen for "PING" from the Web App
  window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    if (event.data.type === 'HIGHLIGHT_EXTENSION_PING') {
      console.log('[Highlight Extension] Received PING, replying with ID');
      window.postMessage({ type: 'HIGHLIGHT_EXTENSION_ID', id: chrome.runtime.id }, '*');
    }
  });
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'SHOW_SAVE_MODAL') {
    showSaveModal(request.data, request.documents);
  }
});

function showSaveModal(highlightData, documents) {
  // Remove existing modal if any
  const existingModal = document.getElementById('highlight-extension-modal-host');
  if (existingModal) existingModal.remove();

  // Create host for Shadow DOM
  const host = document.createElement('div');
  host.id = 'highlight-extension-modal-host';
  host.style.position = 'fixed';
  host.style.zIndex = '2147483647';
  host.style.top = '0';
  host.style.left = '0';
  host.style.width = '0';
  host.style.height = '0';
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: 'open' });

  // Styles
  const style = document.createElement('style');
  style.textContent = `
    .overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(2px);
      animation: fadeIn 0.2s ease;
    }
    .modal {
      background: white;
      width: 320px;
      max-width: 90vw;
      border-radius: 16px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      padding: 24px;
      box-sizing: border-box;
    }
    .sticky-note {
      background: #FFF9C4;
      padding: 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
      margin: 0 auto 32px auto;
      font-size: 14px;
      color: #1a1a1a;
      line-height: 1.5;
      width: 100%;
      max-width: 240px;
      aspect-ratio: 1 / 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .sticky-text {
      margin: 0;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      display: -webkit-box;
      -webkit-line-clamp: 9;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding-inline: 8px;
    }
    .brand-area {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .add-to-text {
      font-size: 12px;
      color: #9ca3af;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    }
    .logo {
      height: 24px;
      width: auto;
    }
    .fab-btn {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #1a3d36;
      color: white;
      border: none;
      font-size: 28px;
      font-weight: 300;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      transition: transform 0.2s ease, background 0.2s ease;
    }
    .fab-btn:hover {
      background: #0f2620;
      transform: scale(1.05);
    }
    
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes slideUp {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
  `;
  shadow.appendChild(style);

  // Get logo URL
  const logoUrl = chrome.runtime.getURL('header-logo.png');

  // Modal HTML
  const container = document.createElement('div');
  container.className = 'overlay';

  container.innerHTML = `
    <div class="modal">
      <div class="sticky-note">
        <p class="sticky-text">${highlightData.text}</p>
      </div>
      
      <div class="footer">
        <div class="brand-area">
          <span class="add-to-text">Add to</span>
          <img src="${logoUrl}" alt="Highlight" class="logo" />
        </div>
        <button class="fab-btn" id="save-btn">+</button>
      </div>
    </div>
  `;

  shadow.appendChild(container);

  // Event Listeners
  const close = () => host.remove();

  // Handle click outside
  container.onclick = (e) => {
    if (e.target === container) close();
  };

  // Handle Save (FAB click)
  shadow.getElementById('save-btn').onclick = () => {
    // Save as standalone / quick save
    chrome.runtime.sendMessage({
      type: 'SAVE_HIGHLIGHT',
      data: highlightData,
      documentId: null, // null means standalone/quick save
      newDocumentTitle: null
    });
    close();
  };
}
