// music-control.js - Background music control with volume, play/pause

(function() {
    const audio = document.getElementById('bg-music');
    
    if (!audio) return;

    // Load saved preferences
    const isMuted = localStorage.getItem('musicMuted') === 'true';
    const savedVolume = localStorage.getItem('musicVolume') || '0.5'; // Default 50%
    
    audio.volume = parseFloat(savedVolume);
    
    if (isMuted) {
        audio.pause();
    } else {
        // Auto-play with user interaction fallback
        audio.play().catch(() => {
            console.log('Auto-play blocked - waiting for user interaction');
        });
    }

    // Create music control panel
    createMusicControls();

    function createMusicControls() {
        const controlPanel = document.createElement('div');
        controlPanel.id = 'music-controls';
        controlPanel.className = 'music-controls';
        controlPanel.innerHTML = `
            <button id="music-toggle" class="music-btn" title="${isMuted ? 'Play music' : 'Pause music'}">
                ${isMuted ? '▶️' : '⏸️'}
            </button>
            <div class="volume-control">
                <button id="volume-toggle" class="volume-btn" title="Mute/Unmute">
                    ${audio.volume === 0 ? '🔇' : audio.volume < 0.5 ? '🔉' : '🔊'}
                </button>
                <input type="range" id="volume-slider" class="volume-slider" 
                       min="0" max="1" step="0.01" value="${audio.volume}">
            </div>
        `;
        
        document.body.appendChild(controlPanel);

        // Add event listeners
        document.getElementById('music-toggle').addEventListener('click', togglePlayPause);
        document.getElementById('volume-toggle').addEventListener('click', toggleMute);
        document.getElementById('volume-slider').addEventListener('input', changeVolume);
    }

    function togglePlayPause() {
        const playBtn = document.getElementById('music-toggle');
        
        if (audio.paused) {
            audio.play();
            playBtn.innerHTML = '⏸️';
            playBtn.title = 'Pause music';
            localStorage.setItem('musicMuted', 'false');
        } else {
            audio.pause();
            playBtn.innerHTML = '▶️';
            playBtn.title = 'Play music';
            localStorage.setItem('musicMuted', 'true');
        }
    }

    function toggleMute() {
        const volumeBtn = document.getElementById('volume-toggle');
        const volumeSlider = document.getElementById('volume-slider');
        
        if (audio.volume > 0) {
            // Mute
            audio.dataset.previousVolume = audio.volume; // Save current volume
            audio.volume = 0;
            volumeSlider.value = 0;
            volumeBtn.innerHTML = '🔇';
            volumeBtn.title = 'Unmute';
        } else {
            // Unmute to previous volume or 0.5
            const previousVolume = audio.dataset.previousVolume || 0.5;
            audio.volume = parseFloat(previousVolume);
            volumeSlider.value = audio.volume;
            updateVolumeIcon();
        }
        
        localStorage.setItem('musicVolume', audio.volume);
    }

    function changeVolume(e) {
        audio.volume = e.target.value;
        updateVolumeIcon();
        localStorage.setItem('musicVolume', audio.volume);
    }

    function updateVolumeIcon() {
        const volumeBtn = document.getElementById('volume-toggle');
        
        if (audio.volume === 0) {
            volumeBtn.innerHTML = '🔇';
            volumeBtn.title = 'Unmute';
        } else if (audio.volume < 0.5) {
            volumeBtn.innerHTML = '🔉';
            volumeBtn.title = 'Volume: Low';
        } else {
            volumeBtn.innerHTML = '🔊';
            volumeBtn.title = 'Volume: High';
        }
    }
})();

console.log('Music control loaded (with volume control)');
