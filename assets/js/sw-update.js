// Service Worker Update Detection
// Add this to main.js or create new file: assets/js/sw-update.js

if ('serviceWorker' in navigator) {
  let refreshing = false;
  
  // Register service worker
  navigator.serviceWorker.register('/VibeDrips/sw.js')
    .then(registration => {
      console.log('✅ Service Worker registered');
      
      // Check for updates every 60 seconds
      setInterval(() => {
        registration.update();
      }, 60000);
      
      // Listen for new service worker taking control
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        refreshing = true;
        
        console.log('🔄 New service worker active - reloading page');
        window.location.reload();
      });
      
      // Check for waiting service worker
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New service worker available - show update prompt
            console.log('📦 New version available');
            showUpdatePrompt(registration);
          }
        });
      });
    })
    .catch(error => {
      console.error('❌ Service Worker registration failed:', error);
    });
}

function showUpdatePrompt(registration) {
  // Remove existing prompt if any
  const existingPrompt = document.getElementById('update-prompt');
  if (existingPrompt) existingPrompt.remove();
  
  // Create update prompt
  const prompt = document.createElement('div');
  prompt.id = 'update-prompt';
  prompt.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 16px 24px;
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.3);
    z-index: 10000;
    display: flex;
    align-items: center;
    gap: 16px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    animation: slideUp 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    max-width: 90vw;
  `;
  
  prompt.innerHTML = `
    <span style="font-weight: 600; font-size: 14px;">
      ✨ New products available!
    </span>
    <button id="update-btn" style="
      background: white;
      color: #667eea;
      border: none;
      padding: 8px 16px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s;
    " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
      Update Now
    </button>
    <button id="dismiss-btn" style="
      background: transparent;
      color: white;
      border: 1px solid rgba(255,255,255,0.3);
      padding: 8px 12px;
      border-radius: 8px;
      font-weight: 500;
      cursor: pointer;
      font-size: 13px;
    ">
      Later
    </button>
  `;
  
  document.body.appendChild(prompt);
  
  // Update button - force new SW to activate
  document.getElementById('update-btn').addEventListener('click', () => {
    if (registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
    prompt.remove();
  });
  
  // Dismiss button
  document.getElementById('dismiss-btn').addEventListener('click', () => {
    prompt.remove();
  });
  
  // Auto-dismiss after 10 seconds
  setTimeout(() => {
    if (document.getElementById('update-prompt')) {
      prompt.remove();
    }
  }, 10000);
}

// Add animation CSS
if (!document.getElementById('sw-update-styles')) {
  const style = document.createElement('style');
  style.id = 'sw-update-styles';
  style.textContent = `
    @keyframes slideUp {
      from {
        transform: translateX(-50%) translateY(100px);
        opacity: 0;
      }
      to {
        transform: translateX(-50%) translateY(0);
        opacity: 1;
      }
    }
  `;
  document.head.appendChild(style);
}
