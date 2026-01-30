// assets/js/media-state.js - Global Media State Manager (Unmuting persistence)

const UNMUTE_STORAGE_KEY = 'vibedrips-unmute-session-active';

const MediaState = {
    /**
     * Check if the user has previously unmuted in this session (or permanently)
     * @returns {boolean}
     */
    isUnmuted() {
        return localStorage.getItem(UNMUTE_STORAGE_KEY) === 'true';
    },

    /**
     * Set the global unmuted state to TRUE
     * Called after the first successful user interaction (Shield Tap)
     */
    setUnmuted() {
        localStorage.setItem(UNMUTE_STORAGE_KEY, 'true');
        console.log('🔊 Global Media State: Session Unmuted');

        // Dispatch event for components to listen and react immediately
        window.dispatchEvent(new CustomEvent('vibedrips-media-unmute'));
    },

    /**
     * Get the preferred volume level for unmuted media
     */
    getVolume() {
        return 0.2; // 20% Sweet Spot
    }
};

// Export to window
window.MediaState = MediaState;
console.log('🔊 Media State Manager Loaded');
