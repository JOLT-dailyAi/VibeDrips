// sw-update-detector.js - Automatic PWA update detection
// Add this to your HTML: <script src="assets/js/sw-update-detector.js"></script>

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

        newWorker.addEventListener('statechange', async () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New service worker available - query version for custom message
            console.log('📦 New version available');

            const messageChannel = new MessageChannel();
            messageChannel.port1.onmessage = (event) => {
              const version = event.data.version || '';
              console.log('🏷️ Update version tag:', version);
              showUpdatePrompt(registration, version);
            };

            newWorker.postMessage({ type: 'GET_VERSION' }, [messageChannel.port2]);

            // Fallback if version check fails
            setTimeout(() => {
              if (!document.getElementById('update-prompt')) {
                showUpdatePrompt(registration);
              }
            }, 2000);
          }
        });
      });
    })
    .catch(error => {
      console.error('❌ Service Worker registration failed:', error);
    });
}

function showUpdatePrompt(registration, version = '') {
  // Remove existing prompt if any
  const existingPrompt = document.getElementById('update-prompt');
  if (existingPrompt) existingPrompt.remove();

  // Determine message based on version suffix
  let displayMessage = '✨ New version available!';
  if (version.endsWith('-data')) {
    displayMessage = '✨ New products available!';
  } else if (version.endsWith('-ui')) {
    displayMessage = '✨ VibeDrips has been updated!';
  }

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
    flex-wrap: wrap;
    justify-content: center;
  `;

  prompt.innerHTML = `
    <span style="font-weight: 600; font-size: 14px;">
      ${displayMessage}
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
    ">
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

  // Hover effects
  const updateBtn = document.getElementById('update-btn');
  updateBtn.addEventListener('mouseenter', () => updateBtn.style.transform = 'scale(1.05)');
  updateBtn.addEventListener('mouseleave', () => updateBtn.style.transform = 'scale(1)');

  // Update button - force new SW to activate
  updateBtn.addEventListener('click', () => {
    if (registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
    prompt.remove();
  });

  // Dismiss button
  document.getElementById('dismiss-btn').addEventListener('click', () => {
    prompt.remove();
  });

  // Auto-dismiss after 15 seconds
  setTimeout(() => {
    if (document.getElementById('update-prompt')) {
      prompt.remove();
    }
  }, 15000);
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
