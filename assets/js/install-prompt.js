// install-prompt.js - PWA installation handling

// Store the prompt event globally
window.deferredPrompt = null;

// Listen for beforeinstallprompt event
window.addEventListener('beforeinstallprompt', (e) => {
    console.log('💾 PWA installable');
    
    // Prevent default mini-infobar
    e.preventDefault();
    
    // Store event globally
    window.deferredPrompt = e;
    
    // Trigger check in music-control.js if it exists
    if (window.checkPWAInstallable) {
        window.checkPWAInstallable();
    }
});

// Listen for successful installation
window.addEventListener('appinstalled', () => {
    console.log('✅ PWA installed successfully');
    window.deferredPrompt = null;
});

console.log('✅ PWA install handler ready');
