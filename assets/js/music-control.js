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
    
    // Show share button (with install button if PWA installable)
function showShareBadge() {
    centerBadgeContainer.innerHTML = `
        <div style="display: flex; gap: 10px; align-items: center;">
            <button class="center-badge" id="share-badge" onclick="handleShare()">
                SHARE ↗️
            </button>
            <button class="center-badge" id="install-badge" style="display: none;" onclick="handleInstall()">
                📱 INSTALL
            </button>
        </div>
    `;
    
    // Check if PWA is installable and show install button
    checkPWAInstallable();
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

    // Check if PWA is installable
function checkPWAInstallable() {
    const installBtn = document.getElementById('install-badge');
    if (!installBtn) return;
    
    // Show if deferredPrompt exists (set by install-prompt.js)
    if (window.deferredPrompt) {
        installBtn.style.display = 'inline-flex';
    }
    
    // Listen for beforeinstallprompt
    window.addEventListener('beforeinstallprompt', (e) => {
        if (installBtn) {
            installBtn.style.display = 'inline-flex';
        }
    });
    
    // Hide after installation
    window.addEventListener('appinstalled', () => {
        if (installBtn) {
            installBtn.style.display = 'none';
        }
    });
}

// Make handleInstall global
window.handleInstall = function() {
    if (window.deferredPrompt) {
        window.deferredPrompt.prompt();
        window.deferredPrompt.userChoice.then((result) => {
            console.log('Install result:', result.outcome);
            window.deferredPrompt = null;
            
            // Hide install button
            const installBtn = document.getElementById('install-badge');
            if (installBtn) {
                installBtn.style.display = 'none';
            }
        });
    } else {
        // Fallback: show manual instructions
        showInstallInstructions();
    }
};

// Show manual install instructions
function showInstallInstructions() {
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    let message = '';
    
    if (isIOS) {
        message = 'To install VibeDrips on iOS:\n\n1. Tap Share (□↑) in Safari\n2. Scroll and tap "Add to Home Screen"\n3. Tap "Add"';
    } else if (isAndroid) {
        message = 'To install VibeDrips:\n\n1. Tap menu (⋮) in browser\n2. Select "Add to Home Screen"\n3. Tap "Install"';
    } else {
        message = 'To install VibeDrips:\n\n1. Click install icon in address bar\n2. Or use browser menu > "Install VibeDrips"';
    }
    
    alert(message);
}

    
    console.log('✅ Music control fully initialized');
});
