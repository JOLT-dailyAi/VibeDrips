// assets/js/media-state.js - Global Media State Manager (Asymmetric Strategy)

const UNMUTE_STORAGE_KEY = 'vibedrips-unmute-intent-active';
const VOLUME_STORAGE_KEY = 'vibedrips-volume-level';
// 🔊 GLOBAL CACHE: Single source of truth. 
let _cachedVolume = null;
let _lastLockTime = 0; // 🛡️ FEEDBACK GUARD: Timestamp of the last programmatic lock

const MediaState = {
    // 🎯 DYNAMIC DEFAULT: Replaced static 0.2 with a logic-driven getter
    get DEFAULT_VOLUME() {
        return _cachedVolume !== null ? _cachedVolume : 0.2;
    },
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

        // 💊 SMART PILL CLEANUP: Unified UI cleanup for ALL pills once unmuted intent is registered
        document.querySelectorAll('.engagement-pill').forEach(p => {
            p.classList.add('instantly-hidden');
            p.classList.remove('smart-cycling');
        });
    },

    /**
     * Get the preferred volume level
     * 🔊 DYNAMIC INHERITANCE: The "Default" is now the "Last Known Setting".
     */
    getVolume() {
        // 1. High-Priority: Session Cache
        if (_cachedVolume !== null) return _cachedVolume;

        // 2. Medium-Priority: Disk Memory
        const stored = localStorage.getItem(VOLUME_STORAGE_KEY);
        if (stored !== null) {
            const parsed = parseFloat(stored);
            _cachedVolume = isNaN(parsed) ? this.DEFAULT_VOLUME : parsed;
            return _cachedVolume;
        }

        // 3. Fallback: Factory Default (Only for brand new users)
        return this.DEFAULT_VOLUME;
    },

    /**
     * Set the preferred volume level
     * @param {number} level - 0.0 to 1.0
     * @param {boolean} silent - If true, don't dispatch event (prevents loops)
     * @param {boolean} isManual - If true, this is a human interaction (bypass police)
     */
    setVolume(level, silent = false, isManual = false) {
        let vol = Math.max(0, Math.min(1, level));
        let forceSync = false;

        // 👮 STATE POLICE: Reverts to 0.2 (20%) are usually browser artifacts
        // Only block if it's NOT a manual user interaction
        if (!isManual && _cachedVolume !== null && _cachedVolume !== 0.2 && vol === 0.2) {
            console.warn(`守 MediaState: Blocked suspicious birth-revert to 0.2. Restoring ${_cachedVolume}`);
            vol = _cachedVolume;
            forceSync = true; // 📣 MANDATORY: Force align the component that tried to reset
        }

        // 🔊 INTENT BRIDGE: If the user manually turns up the volume, register unmuted intent
        if (isManual && vol > 0 && !this.isUnmuted()) {
            this.setUnmuted();
        }

        // Only trigger if value actually changed (unless we are forcing sync)
        if (!forceSync && vol === _cachedVolume && _cachedVolume !== null) return;

        _cachedVolume = vol;
        localStorage.setItem(VOLUME_STORAGE_KEY, vol.toString());
        console.log(`🔊 Global Media State: Volume updated to ${vol} (Manual: ${isManual})`);

        if (!silent || forceSync) {
            console.log(`🔊 MediaState: Dispatching volume sync event: ${vol}`);
            window.dispatchEvent(new CustomEvent('vibedrips-media-volume', {
                detail: { volume: vol, isManual: isManual }
            }));
        }
    },

    /**
     * Report that media (Reels/Lightbox) has started playing.
     * This signals the background music to pause.
     */
    reportMediaPlay() {
        window.dispatchEvent(new CustomEvent('vibedrips-media-play'));
    },

    /**
     * Safely applies the current global volume to a media element.
     * Prevents the volumechange event from triggering a feedback loop.
     */
    lockVolume(media, forceUnmute = false) {
        if (!media) return;
        const vol = this.getVolume();
        const shouldUnmute = forceUnmute || this.isUnmuted();

        if (media.tagName === 'VIDEO') {
            media.dataset.scriptTriggeredVolume = 'true';
            media.volume = vol;
            _lastLockTime = Date.now(); // 🛡️ Mark birth timestamp
            if (shouldUnmute && media.dataset.userMuted !== 'true') media.muted = false;
            // 🛡️ Guard release
            setTimeout(() => { if (media) media.dataset.scriptTriggeredVolume = 'false'; }, 500);
        } else if (media.tagName === 'IFRAME' && media.contentWindow) {
            const ytVol = Math.round(vol * 100);
            const trySend = () => {
                if (!media.contentWindow) return;
                _lastLockTime = Date.now(); // Mark as scripted
                // 🔊 Volume
                media.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'setVolume', args: [ytVol] }), '*');
                media.contentWindow.postMessage(JSON.stringify({ method: 'setVolume', value: vol }), '*');
                // 🔇 Unmute if requested
                if (shouldUnmute) {
                    media.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'unMute', args: '' }), '*');
                    media.contentWindow.postMessage('unmute', '*');
                }
            };
            trySend();
            // YouTube birth-race: Send again in 400ms, 1000ms, and 2500ms
            setTimeout(trySend, 400);
            setTimeout(trySend, 1000);
            setTimeout(trySend, 2500);
        }
    }
};

// Export to window
window.MediaState = MediaState;

// 🏁 IMMEDIATE INITIALIZATION: Prevent "randomness" on first load
MediaState.getVolume();

console.log('🔊 Media State Manager Loaded (Asymmetric Mode)');
