// content.js
// Idempotency check removed to ensure listeners are re-attached after extension reloads.
// The showSaveModal function handles UI cleanup (removing existing modals), so duplicate execution is safe.

// Handshake Protocol for Web App (Auto-Discovery)
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const isProduction = window.location.hostname === 'stitch.mostlyuseful.in'; // Production check

if (isLocalhost || isProduction) {
  // Console log removed for cleaner production output in handshake
  // console.log('[Highlight Extension] Handshake initiated...');

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
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300..800&family=Outfit:wght@300;400;500;600&display=swap');

    .overlay {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 2147483647;
      display: flex;
      align-items: flex-end;
      justify-content: flex-end;
      pointer-events: none;
      width: auto;
      height: auto;
    }
    .modal {
      background: white;
      width: 320px;
      border-radius: 16px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 20px 25px -5px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      overflow: hidden;
      font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      padding: 24px;
      box-sizing: border-box;
      pointer-events: auto;
      position: relative;
    }
    .sticky-note {
      background: #FEF3C7; /* Design System: cat-social-bg */
      padding: 20px;
      box-sizing: border-box; /* Prevent overflow */
      border-radius: 4px; /* More like a note */
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
      margin: 16px auto 20px auto; /* Add top margin for close button */
      font-size: 14px;
      color: #1a1a1a;
      line-height: 1.5;
      width: 100%;
      /* max-width: 240px; removed to fill container */
      aspect-ratio: 1 / 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .sticky-text {
      margin: 0;
      font-family: 'DM Sans', sans-serif;
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
      padding-inline: 0; /* Align directly with sticky note edges */
      width: 100%;       /* Ensure full width */
      margin: 0 auto;    /* Center footer to match sticky note */
    }
    .brand-area {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding-bottom: 2px; /* Visual alignment */
    }
    .add-to-text {
      font-size: 11px;
      color: #9ca3af;
      font-family: 'DM Sans', sans-serif;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .logo {
      height: 32px; /* Increased size */
      width: auto;
      object-fit: contain;
      object-position: left bottom;
    }
    .fab-btn {
      min-width: 40px;
      width: 40px;
      height: 40px;
      border-radius: 20px;
      background: #1a3d36;
      color: white;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      transition: width 0.4s cubic-bezier(0.2, 0, 0, 1), background 0.2s ease;
      overflow: hidden;
      position: relative;
    }
    .fab-btn:hover {
      background: #0f2620;
    }
    
    .close-btn {
      position: absolute;
      top: 8px;
      right: 8px;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: rgba(0,0,0,0.05);
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #9ca3af;
      transition: all 0.2s ease;
      padding: 0;
      z-index: 10;
    }
    .close-btn:hover {
      background: rgba(0,0,0,0.1);
      color: #4b5563;
    }
    .fab-btn.saved {
      width: 100px;
      background: #1a3d36;
      cursor: default;
    }
    .fab-btn.secondary {
      width: 110px;
      background: white;
      color: #1a3d36;
      border: 1px solid #e5e7eb;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    .fab-btn.secondary:hover {
      background: #f9fafb;
      transform: scale(1.02);
    }
    
    .btn-content {
      position: relative;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .icon-plus {
      position: absolute;
      font-size: 24px;
      font-weight: 300;
      transition: transform 0.4s cubic-bezier(0.2, 0, 0, 1), opacity 0.3s ease;
      left: 50%;
      transform: translateX(-50%);
    }
    
    .text-open {
      position: absolute;
      font-size: 14px;
      font-weight: 500;
      white-space: nowrap;
      opacity: 0;
      transform: translateX(30px);
      transition: transform 0.4s cubic-bezier(0.2, 0, 0, 1), opacity 0.3s ease;
      left: 0;
      width: 100%;
      text-align: center;
    }

    .text-saved {
      position: absolute;
      font-size: 14px;
      font-weight: 500;
      white-space: nowrap;
      opacity: 0;
      transform: translateX(30px);
      transition: transform 0.4s cubic-bezier(0.2, 0, 0, 1), opacity 0.3s ease;
      left: 0;
      width: 100%;
      text-align: center;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }
    
    /* Saved State */
    .fab-btn.saved .icon-plus {
      transform: translateX(-40px);
      opacity: 0;
    }
    .fab-btn.saved .text-saved {
      transform: translateX(0);
      opacity: 1;
    }

    /* Open App State (from Saved) */
    .fab-btn.secondary .icon-plus {
      transform: translateX(-40px);
      opacity: 0;
    }
    .fab-btn.secondary .text-saved {
      transform: translateX(-40px);
      opacity: 0;
    }
    .fab-btn.secondary .text-open {
      transform: translateX(0);
      opacity: 1;
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
      <button class="close-btn" id="close-btn" aria-label="Close modal">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>

      <div class="sticky-note">
        <p class="sticky-text">${highlightData.text}</p>
      </div>
      
      <div class="footer">
        <div class="brand-area">
          <span class="add-to-text">Add to</span>
          <img src="${logoUrl}" alt="Stitch" class="logo" />
        </div>
        <button class="fab-btn" id="save-btn" aria-label="Save snippet">
          <div class="btn-content">
            <span class="icon-plus">+</span>
            <span class="text-saved">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              Saved
            </span>
            <span class="text-open">Open App</span>
          </div>
        </button>
      </div>
    </div>
  `;

  shadow.appendChild(container);

  // Event Listeners
  const close = () => {
    host.remove();
  };

  // Close button click
  shadow.getElementById('close-btn').onclick = close;

  // Remove click outside (no longer needed as overlay is gone)

  // Handle Save (FAB click)
  const saveBtn = shadow.getElementById('save-btn');

  saveBtn.onclick = () => {
    // 1. Save
    chrome.runtime.sendMessage({
      type: 'SAVE_HIGHLIGHT',
      data: highlightData,
      documentId: null,
      newDocumentTitle: null
    });

    // 2. Transfrom to "Saved"
    saveBtn.classList.add('saved');

    // 3. Wait, then transform to "Open App"
    setTimeout(() => {
      saveBtn.classList.remove('saved');
      saveBtn.classList.add('secondary');

      // Update click handler to open app
      saveBtn.onclick = () => {
        window.open('https://stitch.mostlyuseful.in/', '_blank');
        close();
      };
    }, 1500);
  };
}
