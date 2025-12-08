// music-control.js - Background music control with mobile detection

console.log('🎵 Music control script loading...');

document.addEventListener('DOMContentLoaded', function() {
    console.log('🎵 DOM loaded, initializing music control...');
    
    const mediaFloat = document.querySelector('.media-float');
    const audio = document.getElementById('bg-music');
    
    if (!mediaFloat) {
        console.error('❌ .media-float container not found!');
        return;
    }
    
    if (!audio) {
        console.error('❌ #bg-music audio element not found!');
        return;
    }
    
    console.log('✅ Found media-float and audio element');
    
    // Detect if mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    let hideTimeout;
    
    // Create music control
    const musicWrapper = document.createElement('div');
    musicWrapper.className = 'music-control-wrapper';
    
    // On mobile, hide volume controls (they don't work anyway)
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
    console.log('✅ Music control added to DOM');
    
    const volumePanel = document.querySelector('.volume-panel');
    
    // Set initial volume (desktop only)
    if (!isMobile) {
        audio.volume = 0.5;
    }
    
    // Function to show volume panel temporarily (desktop only)
    function showVolumePanel() {
        if (isMobile || !volumePanel) return;
        
        volumePanel.classList.add('visible');
        
        if (hideTimeout) {
            clearTimeout(hideTimeout);
        }
        
        hideTimeout = setTimeout(() => {
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
                console.log('▶️ Music playing');
            }).catch(err => {
                console.error('❌ Play failed:', err);
            });
        } else {
            audio.pause();
            this.innerHTML = '▶️';
            this.title = 'Play music';
            showVolumePanel();
            console.log('⏸️ Music paused');
        }
    });
    
    // Desktop-only volume controls
    if (!isMobile) {
        // Mute toggle
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
        
        // Volume slider
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
        
        // Show panel on hover
        musicWrapper.addEventListener('mouseenter', function() {
            showVolumePanel();
        });
    }
    
    console.log('✅ Music control fully initialized' + (isMobile ? ' (mobile mode - no volume controls)' : ' with auto-hide volume'));
});
