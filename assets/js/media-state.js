// assets/js/media-state.js - Global Media State Manager (Asymmetric Strategy)

const UNMUTE_STORAGE_KEY = 'vibedrips-unmute-intent-active';
const VOLUME_STORAGE_KEY = 'vibedrips-volume-level';
const DEFAULT_VOLUME = 0.2;

// 🔊 GLOBAL CACHE: Single source of truth to prevent loop overhead
let _cachedVolume = null;

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
        if (_cachedVolume !== null) return _cachedVolume;

        const stored = localStorage.getItem(VOLUME_STORAGE_KEY);
        if (stored !== null) {
            const parsed = parseFloat(stored);
            _cachedVolume = isNaN(parsed) ? DEFAULT_VOLUME : parsed;
            return _cachedVolume;
        }

        _cachedVolume = DEFAULT_VOLUME;
        console.log(`🔊 MediaState: Using default volume ${DEFAULT_VOLUME}`);
        return _cachedVolume;
    },

    /**
     * Set the preferred volume level
     * @param {number} level - 0.0 to 1.0
     * @param {boolean} silent - If true, don't dispatch event (prevents loops)
     */
    setVolume(level, silent = false) {
        const vol = Math.max(0, Math.min(1, level));

        // Only trigger if value actually changed
        if (vol === _cachedVolume) return;

        _cachedVolume = vol;
        localStorage.setItem(VOLUME_STORAGE_KEY, vol.toString());
        console.log(`🔊 Global Media State: Volume updated to ${vol}`);

        if (!silent) {
            console.log(`🔊 MediaState: Dispatching volume sync event: ${vol}`);
            window.dispatchEvent(new CustomEvent('vibedrips-media-volume', {
                detail: { volume: vol }
            }));
        }
    }
};

// Export to window
window.MediaState = MediaState;

// 🏁 IMMEDIATE INITIALIZATION: Prevent "randomness" on first load
MediaState.getVolume();

console.log('🔊 Media State Manager Loaded (Asymmetric Mode)');
