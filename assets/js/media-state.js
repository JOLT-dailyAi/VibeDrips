// assets/js/media-state.js - Global Media State Manager (Asymmetric Strategy)

const UNMUTE_STORAGE_KEY = 'vibedrips-unmute-intent-active';

const MediaState = {
    /**
     * Determines if the media should start muted based on OS and user intent.
     * @returns {boolean}
     */
    shouldStartMuted() {
        const strategy = window.Device?.getStrategy() || 'muted';

        // 🍎 iOS: Strictly muted-first for EVERY video.
        if (strategy === 'ios') return true;

        // 🤖 Android/Desktop: Persistent trust after the first tap.
        const hasUnmutedIntent = localStorage.getItem(UNMUTE_STORAGE_KEY) === 'true';
        return !hasUnmutedIntent;
    },

    /**
     * Check if the session is currently considered unmuted (for UI pulsing/auto-unmute).
     * @returns {boolean}
     */
    isUnmuted() {
        const strategy = window.Device?.getStrategy() || 'muted';
        if (strategy === 'ios') return false; // iOS never pre-unmutes; requires fresh per-video tap
        return localStorage.getItem(UNMUTE_STORAGE_KEY) === 'true';
    },

    /**
     * Register a user's intent to unmute.
     * On Android/Desktop, this persists across videos and sessions.
     * On iOS, this is strictly for analytics/internal state but doesn't override muted-first rule.
     */
    setUnmuted() {
        const isIOS = window.Device?.isIOS();

        if (!isIOS) {
            localStorage.setItem(UNMUTE_STORAGE_KEY, 'true');
            console.log('🔊 Global Media State: Persistent Unmute Enabled');
        } else {
            console.log('🔊 Global Media State: iOS Feedback Pulse');
        }

        // Phase 3: Site-wide release (Notify components)
        window.dispatchEvent(new CustomEvent('vibedrips-media-unmute', {
            detail: { isIOS: isIOS }
        }));

        // Universal UI cleanup for the ACTIVE element
        document.querySelectorAll('.engagement-pill.active').forEach(p => {
            // On iOS, we only hide the pill for the video that was actually tapped
            // For now, we allow the pill to hide on tap, but it will reappear on next video
            p.classList.remove('active');
        });
    },

    /**
     * Get the preferred volume level
     */
    getVolume() {
        return 0.2;
    }
};

// Export to window
window.MediaState = MediaState;
console.log('🔊 Media State Manager Loaded (Asymmetric Mode)');
