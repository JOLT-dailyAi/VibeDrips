// music-control.js - Background music control with user activation

(function() {
    const audio = document.getElementById('bg-music');
    
    if (!audio) {
        console.error('Audio element #bg-music not found');
        return;
    }

    // Load saved preferences
    const savedVolume = localStorage.getItem('musicVolume') || '0.5';
    const musicEnabled = localStorage.getItem('musicEnabled') !== 'false'; // Default true
    
    audio.volume = parseFloat(savedVolume);
    audio.loop = true;

    // Try autoplay (will likely be blocked on desktop)
    let musicStarted = false;
    if (musicEnabled) {
        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    musicStarted = true;
                    console.log('Music autoplayed successfully');
                })
                .catch(() => {
                    console.log('Autoplay blocked - user must click music button');
                    musicStarted = false;
                });
        }
    }

    // Add music control to media-float
    addMusicControl();

    function addMusicControl() {
        const mediaFloat = document.querySelector('.media-float');
        
        if (!mediaFloat) {
            console.error('media-float container not found');
            return;
        }

        const musicWrapper = document.createElement('div');
        musicWrapper.className = 'music-control-wrapper';
        musicWrapper.innerHTML = `
            <button id="music-toggle" class="music-control-button" title="${audio.paused ? 'Play music' : 'Pause music'}">
                ${audio.paused ? '▶️' : '⏸️'}
            </button>
            <div class="volume-panel">
                <button id="volume-toggle" class="volume-btn" title="Mute/Unmute">
                    ${audio.volume === 0 ? '🔇' : audio.volume < 0.5 ? '🔉' : '🔊'}
                </button>
                <input type="range" id="volume-slider" class="volume-slider" 
                       min="0" max="1" step="0.01" value="${audio.volume}">
            </div>
        `;
        
        mediaFloat.appendChild(musicWrapper);

        // Add event listeners
        document.getElementById('music-toggle').addEventListener('click', togglePlayPause);
        document.getElementById('volume-toggle').addEventListener('click', toggleMute);
        document.getElementById('volume-slider').addEventListener('input', changeVolume);

        // Update button state after a short delay (check if autoplay worked)
        setTimeout(() => {
            updatePlayButton();
        }, 500);
    }

    function togglePlayPause() {
        const playBtn = document.getElementById('music-toggle');
        
        if (audio.paused) {
            audio.play()
                .then(() => {
                    playBtn.innerHTML = '⏸️';
                    playBtn.title = 'Pause music';
                    localStorage.setItem('musicEnabled', 'true');
                    console.log('Music playing');
                })
                .catch(error => {
                    console.error('Play failed:', error);
                    alert('Unable to play music. Please check your browser settings.');
                });
        } else {
            audio.pause();
            playBtn.innerHTML = '▶️';
            playBtn.title = 'Play music';
            localStorage.setItem('musicEnabled', 'false');
            console.log('Music paused');
        }
    }

    function updatePlayButton() {
        const playBtn = document.getElementById('music-toggle');
        if (!playBtn) return;

        if (audio.paused) {
            playBtn.innerHTML = '▶️';
            playBtn.title = 'Play music';
        } else {
            playBtn.innerHTML = '⏸️';
            playBtn.title = 'Pause music';
        }
    }

    function toggleMute() {
        const volumeBtn = document.getElementById('volume-toggle');
        const volumeSlider = document.getElementById('volume-slider');
        
        if (audio.volume > 0) {
            audio.dataset.previousVolume = audio.volume;
            audio.volume = 0;
            volumeSlider.value = 0;
            volumeBtn.innerHTML = '🔇';
            volumeBtn.title = 'Unmute';
        } else {
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
        if (!volumeBtn) return;
        
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

    // Listen for audio events
    audio.addEventListener('play', updatePlayButton);
    audio.addEventListener('pause', updatePlayButton);
    audio.addEventListener('ended', updatePlayButton);
})();

console.log('Music control loaded');
