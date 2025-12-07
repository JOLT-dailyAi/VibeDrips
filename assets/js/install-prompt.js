// install-prompt.js - Custom install prompt banner (shows on every visit)

(function() {
    let deferredPrompt;
    let installBanner;

    // Listen for the browser's install prompt event
    window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent the default mini-infobar
        e.preventDefault();
        
        // Store the event for later use
        deferredPrompt = e;
        
        // Show custom install banner (always show, no localStorage check)
        showInstallBanner();
    });

    function showInstallBanner() {
        // Create banner HTML
        installBanner = document.createElement('div');
        installBanner.className = 'install-banner';
        installBanner.innerHTML = `
            <div class="install-banner-content">
                <div class="install-banner-text">
                    <strong>📱 Install VibeDrips</strong>
                    <span>Get quick access from your home screen!</span>
                </div>
                <div class="install-banner-actions">
                    <button id="install-button" class="install-btn">Install</button>
                    <button id="dismiss-button" class="dismiss-btn">×</button>
                </div>
            </div>
        `;

        // Insert at top of page
        document.body.insertBefore(installBanner, document.body.firstChild);

        // Add event listeners
        document.getElementById('install-button').addEventListener('click', installApp);
        document.getElementById('dismiss-button').addEventListener('click', dismissBanner);
    }

    function installApp() {
        if (!deferredPrompt) return;

        // Show the browser's install prompt
        deferredPrompt.prompt();

        // Wait for user's response
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the install prompt');
            }
            
            // Clear the prompt
            deferredPrompt = null;
            
            // Remove banner
            if (installBanner) {
                installBanner.remove();
            }
        });
    }

    function dismissBanner() {
        // Just remove banner (no localStorage)
        if (installBanner) {
            installBanner.remove();
        }
    }

    // For iOS (no beforeinstallprompt support)
    if (isIOS() && !isInStandaloneMode()) {
        showIOSInstallPrompt();
    }

    function isIOS() {
        return /iPhone|iPad|iPod/.test(navigator.userAgent) && !window.MSStream;
    }

    function isInStandaloneMode() {
        return ('standalone' in window.navigator) && window.navigator.standalone;
    }

    function showIOSInstallPrompt() {
        const iosPrompt = document.createElement('div');
        iosPrompt.className = 'install-banner ios-prompt';
        iosPrompt.innerHTML = `
            <div class="install-banner-content">
                <div class="install-banner-text">
                    <strong>📱 Install VibeDrips</strong>
                    <span>Tap Share <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24'%3E%3Cpath fill='%23007AFF' d='M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z'/%3E%3C/svg%3E" style="display:inline;width:16px;height:16px;vertical-align:middle;">, then "Add to Home Screen"</span>
                </div>
                <button id="ios-dismiss-button" class="dismiss-btn">×</button>
            </div>
        `;

        document.body.insertBefore(iosPrompt, document.body.firstChild);

        document.getElementById('ios-dismiss-button').addEventListener('click', () => {
            iosPrompt.remove();
        });
    }
})();

console.log('Install prompt loaded (shows on every visit)');
