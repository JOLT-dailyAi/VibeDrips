// assets/js/device-detector.js - Intelligent Environment Detection
const Device = {
    /**
     * Detects if the site is running as a Standalone PWA (Home Screen)
     */
    isPWA() {
        return window.matchMedia('(display-mode: standalone)').matches ||
            window.navigator.standalone ||
            document.referrer.includes('android-app://');
    },

    /**
     * Detects if the user is on a Mobile or Tablet device
     */
    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
            (window.innerWidth < 1024 && 'ontouchstart' in window);
    },

    /**
     * Determines the optimal media strategy for the current device.
     * 'unmuted' = Desktop or PWA (Trusted environment, allow instant sound)
     * 'muted'   = Mobile Browser (Restricted environment, requires engagement pill)
     */
    getStrategy() {
        if (!this.isMobile() || this.isPWA()) {
            return 'unmuted';
        }
        return 'muted';
    }
};

window.Device = Device;
console.log(`📡 Device Strategy: ${Device.getStrategy().toUpperCase()}`);
