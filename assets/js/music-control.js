// music-control.js - Background music control with auto-hide volume

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
    
    // Check if music button already exists
    if (document.getElementById('music-toggle-manual')) {
        console.log('✅ Manual music button already exists, skipping JS creation');
        return;
    }
    
    let hideTimeout;
    
    // Create music control
    const musicWrapper = document.createElement('div');
    musicWrapper.className = 'music-control-wrapper';
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
    
    mediaFloat.appendChild(musicWrapper);
    console.log('✅ Music control added to DOM');
    
    const volumePanel = document.querySelector('.volume-panel');
    
    // Set initial volume
    audio.volume = 0.5;
    
    // Function to show volume panel temporarily
    function showVolumePanel() {
        volumePanel.classList.add('visible');
        
        // Clear existing timeout
        if (hideTimeout) {
            clearTimeout(hideTimeout);
        }
        
        // Hide after 5 seconds
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
                showVolumePanel(); // Show volume when music starts
                console.log('▶️ Music playing');
            }).catch(err => {
                console.error('❌ Play failed:', err);
            });
        } else {
            audio.pause();
            this.innerHTML = '▶️';
            this.title = 'Play music';
            showVolumePanel(); // Show volume when paused too
            console.log('⏸️ Music paused');
        }
    });
    
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
        showVolumePanel(); // Keep visible when interacting
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
        showVolumePanel(); // Keep visible while adjusting
    });
    
    // Show panel on hover (desktop)
    musicWrapper.addEventListener('mouseenter', function() {
        showVolumePanel();
    });
    
    console.log('✅ Music control fully initialized with auto-hide volume');
});
