// music-control.js - Background music control with credits/share toggle

console.log('🎵 Music control script loading...');

document.addEventListener('DOMContentLoaded', function() {
    console.log('🎵 DOM loaded, initializing music control...');
    
    const mediaFloat = document.querySelector('.media-float');
    const audio = document.getElementById('bg-music');
    const centerBadgeContainer = document.querySelector('.center-badge-container');
    
    if (!mediaFloat) {
        console.error('❌ .media-float container not found!');
        return;
    }
    
    if (!audio) {
        console.error('❌ #bg-music audio element not found!');
        return;
    }

    if (!centerBadgeContainer) {
        console.error('❌ .center-badge-container not found!');
        return;
    }
    
    console.log('✅ Found required containers');
    
    // Detect mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    let hideVolumeTimeout;
    let hideTooltipTimeout;
    let currentTooltip = null;
    
    // Create music control button
    const musicWrapper = document.createElement('div');
    musicWrapper.className = 'music-control-wrapper';
    
    if (isMobile) {
        musicWrapper.innerHTML = `
            <button id="music-toggle" class="music-control-button" title="Play music">
                ▶️
            </button>
        `;
    } else {
        musicWrapper.innerHTML = `
            <button id="music-toggle" class="music-control-button" title="Play music">
                ▶️
            </button>
            <div class="volume-panel">
                <button id="volume-toggle" class="volume-btn" title="Mute/Unmute">
                    🔊
                </button>
                <input type="range" id="volume-slider" class="volume-slider" 
                       min="0" max="1" step="0.01" value="0.5">
            </div>
        `;
    }
    
    mediaFloat.appendChild(musicWrapper);
    
    const volumePanel = document.querySelector('.volume-panel');
    
    if (!isMobile) {
        audio.volume = 0.5;
    }
    
    // Update center badge based on music state
    function updateCenterBadge() {
        if (audio.paused) {
            showShareBadge();
        } else {
            showCreditsBadge();
        }
    }
    
    // Show share button (with install button - always visible unless already installed)
    function showShareBadge() {
        // Check if already installed (PWA standalone mode)
        const isInstalled = window.matchMedia('(display-mode: standalone)').matches 
                         || window.navigator.standalone === true;
        
        centerBadgeContainer.innerHTML = `
            <div style="display: flex; gap: 10px; align-items: center;">
                <button class="center-badge" id="share-badge" onclick="handleShare()">
                    SHARE ↗️
                </button>
                ${!isInstalled ? `
                    <button class="center-badge" id="install-badge" onclick="handleInstall()">
                        📱 INSTALL
                    </button>
                ` : ''}
            </div>
        `;
    }
    
    // Show credits badge with truncation
    function showCreditsBadge() {
        const songName = 'Losstime';
        const artistName = 'Creepy Nuts';
        const fullText = `♪ ${songName} • ${artistName} 🎵`;
        
        centerBadgeContainer.innerHTML = `
            <div style="position: relative;">
                <a href="https://youtu.be/O6WjVGEVbNc" 
                   target="_blank" 
                   rel="noopener"
                   class="center-badge" 
                   id="credits-badge">
                    <span class="credits-text">${fullText}</span>
                </a>
                <div class="credits-tooltip" id="credits-tooltip">
                    <div class="credits-tooltip-title">🎵 ${songName}</div>
                    <div class="credits-tooltip-artist">${artistName}</div>
                    <div class="credits-tooltip-divider"></div>
                    <a href="https://youtu.be/O6WjVGEVbNc" 
                       target="_blank" 
                       rel="noopener"
                       class="credits-tooltip-link"
                       onclick="audio.pause()">
                        Listen on YouTube ↗️
                    </a>
                </div>
            </div>
        `;
        
        // Truncate text dynamically on mobile
        setTimeout(() => {
            truncateCreditsText();
        }, 100);
        
        // Setup tooltip behavior
        setupCreditsTooltip();
    }
    
    // Truncate credits text to fit
    function truncateCreditsText() {
        const badge = document.getElementById('credits-badge');
        const textSpan = badge?.querySelector('.credits-text');
        
        if (!badge || !textSpan) return;
        
        const maxWidth = window.innerWidth < 768 
            ? window.innerWidth - 140  // Mobile: leave space for side buttons
            : 400; // Desktop
        
        const fullText = '♪ Losstime • Creepy Nuts 🎵';
        textSpan.textContent = fullText;
        
        // Check if truncation needed
        if (badge.offsetWidth > maxWidth) {
            const shortText = '♪ Losstime... 🎵';
            textSpan.textContent = shortText;
        }
    }
    
    // Setup credits tooltip behavior
    function setupCreditsTooltip() {
        const badge = document.getElementById('credits-badge');
        const tooltip = document.getElementById('credits-tooltip');
        
        if (!badge || !tooltip) return;
        
        // Desktop: hover
        if (!isMobile) {
            badge.addEventListener('mouseenter', () => {
                showTooltip(tooltip);
            });
            
            badge.addEventListener('mouseleave', () => {
                hideTooltip(tooltip);
            });
            
            // Click opens YouTube
            badge.addEventListener('click', (e) => {
                audio.pause();
            });
        } else {
            // Mobile: tap to show tooltip
            let tapCount = 0;
            
            badge.addEventListener('click', (e) => {
                e.preventDefault();
                
                if (tapCount === 0) {
                    // First tap: show tooltip
                    showTooltip(tooltip);
                    tapCount = 1;
                    
                    // Reset after delay
                    setTimeout(() => {
                        tapCount = 0;
                    }, 6000);
                }
                // Second tap handled by link inside tooltip
            });
        }
        
        // Click outside to close
        document.addEventListener('click', (e) => {
            if (tooltip && !badge.contains(e.target) && !tooltip.contains(e.target)) {
                hideTooltip(tooltip);
            }
        });
    }
    
    // Show tooltip
    function showTooltip(tooltip) {
        if (!tooltip) return;
        
        // Close any existing tooltip
        if (currentTooltip && currentTooltip !== tooltip) {
            hideTooltip(currentTooltip);
        }
        
        tooltip.classList.add('visible');
        currentTooltip = tooltip;
        
        // Auto-hide after 5 seconds
        if (hideTooltipTimeout) {
            clearTimeout(hideTooltipTimeout);
        }
        
        hideTooltipTimeout = setTimeout(() => {
            hideTooltip(tooltip);
        }, 5000);
    }
    
    // Hide tooltip
    function hideTooltip(tooltip) {
        if (!tooltip) return;
        tooltip.classList.remove('visible');
        if (currentTooltip === tooltip) {
            currentTooltip = null;
        }
    }
    
    // Show volume panel
    function showVolumePanel() {
        if (isMobile || !volumePanel) return;
        
        volumePanel.classList.add('visible');
        
        if (hideVolumeTimeout) {
            clearTimeout(hideVolumeTimeout);
        }
        
        hideVolumeTimeout = setTimeout(() => {
            volumePanel.classList.remove('visible');
        }, 5000);
    }
    
    // Play/Pause
    document.getElementById('music-toggle').addEventListener('click', function() {
        if (audio.paused) {
            audio.play().then(() => {
                this.innerHTML = '⏸️';
                this.title = 'Pause music';
                showVolumePanel();
                updateCenterBadge();
                console.log('▶️ Music playing');
            }).catch(err => {
                console.error('❌ Play failed:', err);
            });
        } else {
            audio.pause();
            this.innerHTML = '▶️';
            this.title = 'Play music';
            showVolumePanel();
            updateCenterBadge();
            console.log('⏸️ Music paused');
        }
    });
    
    // Desktop volume controls
    if (!isMobile) {
        document.getElementById('volume-toggle').addEventListener('click', function() {
            const slider = document.getElementById('volume-slider');
            if (audio.volume > 0) {
                audio.dataset.prevVol = audio.volume;
                audio.volume = 0;
                slider.value = 0;
                this.innerHTML = '🔇';
            } else {
                audio.volume = audio.dataset.prevVol || 0.5;
                slider.value = audio.volume;
                this.innerHTML = audio.volume < 0.5 ? '🔉' : '🔊';
            }
            showVolumePanel();
        });
        
        document.getElementById('volume-slider').addEventListener('input', function() {
            const btn = document.getElementById('volume-toggle');
            audio.volume = this.value;
            
            if (this.value == 0) {
                btn.innerHTML = '🔇';
            } else if (this.value < 0.5) {
                btn.innerHTML = '🔉';
            } else {
                btn.innerHTML = '🔊';
            }
            showVolumePanel();
        });
        
        musicWrapper.addEventListener('mouseenter', function() {
            showVolumePanel();
        });
    }
    
    // Initialize with share badge
    updateCenterBadge();
    
    // Listen for audio state changes
    audio.addEventListener('play', updateCenterBadge);
    audio.addEventListener('pause', updateCenterBadge);
    
    // Handle window resize for truncation
    window.addEventListener('resize', () => {
        if (!audio.paused) {
            truncateCreditsText();
        }
    });

    // Make handleInstall global
    window.handleInstall = function() {
        // Check if native prompt is available
        if (window.deferredPrompt) {
            // Chrome/Edge: Use native prompt
            window.deferredPrompt.prompt();
            window.deferredPrompt.userChoice.then((result) => {
                console.log('Install result:', result.outcome);
                
                if (result.outcome === 'accepted') {
                    showToast('✓ Installing VibeDrips...');
                }
                
                window.deferredPrompt = null;
                
                // Remove install button after acceptance
                const installBtn = document.getElementById('install-badge');
                if (installBtn && result.outcome === 'accepted') {
                    setTimeout(() => {
                        if (installBtn.parentElement) {
                            installBtn.remove();
                        }
                    }, 2000);
                }
            });
        } else {
            // Safari/Opera/Others: Show manual instructions
            showInstallInstructions();
        }
    };

    // Show manual install instructions with device detection
    function showInstallInstructions() {
        const userAgent = navigator.userAgent;
        const isIOS = /iPhone|iPad|iPod/.test(userAgent);
        const isAndroid = /Android/.test(userAgent);
        const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
        const isChrome = /Chrome/.test(userAgent) && !/Edg/.test(userAgent);
        const isOpera = /OPR|Opera/.test(userAgent);
        
        let title = 'Install VibeDrips';
        let message = '';
        
        if (isIOS) {
            if (isSafari) {
                // Safari iOS
                title = 'Install on iPhone/iPad (Safari)';
                message = `
    📱 To install VibeDrips:
    
    1. Tap the Share icon [image:2] in the toolbar
       (bottom of screen on iPhone, top on iPad)
       
    2. Scroll down and tap "Add to Home Screen"
    
    3. Tap "Add" to confirm
    
    ✨ App icon will appear on your home screen!
                `.trim();
            } else if (isChrome) {
                // Chrome iOS
                title = 'Install on iPhone/iPad (Chrome)';
                message = `
    📱 To install VibeDrips:
    
    1. Tap the Share icon [image:2] in the address bar
       (top right corner)
       
    2. Scroll down and tap "Add to Home Screen"
    
    3. Tap "Add" to confirm
    
    ✨ App icon will appear on your home screen!
                `.trim();
            } else if (isOpera) {
                // Opera iOS
                title = 'Install on iPhone/iPad (Opera)';
                message = `
    📱 To install VibeDrips:
    
    1. Tap the Opera menu (bottom center)
    
    2. Find and tap the Share icon [image:2]
    
    3. Scroll down and tap "Add to Home Screen"
    
    4. Tap "Add" to confirm
    
    ✨ App icon will appear on your home screen!
                `.trim();
            } else {
                // Other iOS browsers
                title = 'Install on iPhone/iPad';
                message = `
    📱 To install VibeDrips:
    
    1. Look for the Share icon [image:2]
       (usually in browser menu or toolbar)
       
    2. Tap "Add to Home Screen"
    
    3. Tap "Add" to confirm
    
    ✨ App icon will appear on your home screen!
                `.trim();
            }
        } else if (isAndroid) {
            if (isChrome) {
                // Chrome Android
                title = 'Install on Android (Chrome)';
                message = `
    📱 To install VibeDrips:
    
    1. Tap the menu icon (⋮) in the top right
    
    2. Look for "Add to Home screen" or "Install app"
    
    3. Tap "Install" to confirm
    
    ✨ App icon will appear on your home screen!
                `.trim();
            } else if (isOpera) {
                // Opera Android
                title = 'Install on Android (Opera)';
                message = `
    📱 To install VibeDrips:
    
    1. Tap the Opera menu (⊕) at the bottom
    
    2. Look for "Add to Home screen"
    
    3. Tap "Add" to confirm
    
    ✨ App icon will appear on your home screen!
                `.trim();
            } else {
                // Other Android browsers
                title = 'Install on Android';
                message = `
    📱 To install VibeDrips:
    
    1. Tap the browser menu (⋮ or ≡)
    
    2. Look for "Add to Home screen" or "Install app"
    
    3. Tap "Install" to confirm
    
    ✨ App icon will appear on your home screen!
                `.trim();
            }
        } else {
            // Desktop
            title = 'Install on Desktop';
            message = `
    💻 To install VibeDrips:
    
    • Look for the install icon [image:3] in your browser:
      
      Chrome/Edge: Address bar (right side)
      Opera: Address bar or menu
      
    • Click the install icon and confirm
    
    • Or use: Browser Menu > "Install VibeDrips"
    
    ✨ Quick access from your desktop/taskbar!
            `.trim();
        }
        
        // Use custom modal with icon support
        showInstallModal(title, message);
    }


    // Show custom install instructions modal
    function showInstallModal(title, message) {
        // Remove existing modal if any
        const existing = document.querySelector('.install-modal');
        if (existing) existing.remove();
        
        // Replace [image:X] with actual icon display
        const messageWithIcons = message
            .replace(/\[image:2\]/g, '<span class="inline-icon share-icon">⎋</span>') // iOS share icon placeholder
            .replace(/\[image:3\]/g, '<span class="inline-icon install-icon">⊕</span>'); // Desktop install icon
        
        const modal = document.createElement('div');
        modal.className = 'install-modal';
        modal.innerHTML = `
            <div class="install-modal-content">
                <h3>${title}</h3>
                <div class="install-instructions">${messageWithIcons.replace(/\n/g, '<br>')}</div>
                <button class="install-modal-close" onclick="this.closest('.install-modal').remove()">
                    Got it!
                </button>
            </div>
        `;
        
        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('visible'), 10);
        
        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }


    // Show toast notification (reuse from share.js)
    function showToast(message) {
        const toast = document.getElementById('toast-notification');
        if (!toast) return;
        
        toast.textContent = message;
        toast.classList.remove('hidden');
        toast.classList.add('visible');
        
        setTimeout(() => {
            toast.classList.remove('visible');
            setTimeout(() => {
                toast.classList.add('hidden');
            }, 300);
        }, 3000);
    }
    
    console.log('✅ Music control fully initialized');
});
