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
     * Detects if the user is on an iOS device (iPhone/iPad/iPod)
     * Includes iPad Pro desktop-class browser detection
     */
    isIOS() {
        return /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
            (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
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
     * 'ios'     = Strict Muted-First (Safari Engine Policy)
     * 'unmuted' = Desktop or Android PWA (Trusted environment, allow persistence)
     * 'muted'   = Mobile Browser (Restricted environment, requires engagement pill)
     */
    getStrategy() {
        if (this.isIOS()) return 'ios';
        if (!this.isMobile() || this.isPWA()) return 'unmuted';
        return 'muted';
    }
};

window.Device = Device;
console.log(`📡 Device Strategy: ${Device.getStrategy().toUpperCase()} (${Device.isIOS() ? 'iOS' : 'Android/M-Web'})`);
