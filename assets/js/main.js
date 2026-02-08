// main.js - Orchestrator only

// Global application state (keep as-is)
window.VibeDrips = {
    currentCurrency: null,
    currentRegion: null,
    allProducts: [],
    filteredProducts: [],
    categories: new Set(),
    currentTimeFilter: 'all',
    config: {
        dataUrl: './data',
        fallbackCurrency: 'INR',
        ipApiUrl: 'https://ipapi.co/json/',
        regionToCurrency: {
            'US': 'USD', 'United States': 'USD',
            'IN': 'INR', 'India': 'INR',
            'GB': 'GBP', 'United Kingdom': 'GBP', 'UK': 'GBP',
            'DE': 'EUR', 'Germany': 'EUR',
            'FR': 'EUR', 'France': 'EUR',
            'IT': 'EUR', 'Italy': 'EUR',
            'JP': 'JPY', 'Japan': 'JPY',
            'CA': 'CAD', 'Canada': 'CAD',
            'AU': 'AUD', 'Australia': 'AUD'
        }
    },
    availableCurrencies: [],
    elements: {},
    // PHASE_1: Modal state management
    modalState: {
        currentIndex: 0,
        isSliding: false,
        currentProductList: [] // PHASE_7: Scoped list for context-aware navigation
    },
    // 📱 PWA Detection Helper: Comprehensive check for all standalone-like modes
    isStandalone: () => {
        return window.matchMedia('(display-mode: standalone)').matches ||
            window.matchMedia('(display-mode: minimal-ui)').matches ||
            window.matchMedia('(display-mode: fullscreen)').matches ||
            window.matchMedia('(display-mode: window-controls-overlay)').matches ||
            window.navigator.standalone === true ||
            document.referrer.includes('android-app://');
    }
};

// Initialize the application
async function initializeApp() {
    console.log('🎯 Starting VibeDrips initialization...');

    try {
        cacheElements();
        // 📱 PHASE_27: Persist PWA installation status
        if (window.VibeDrips.isStandalone()) {
            document.body.classList.add('pwa-mode');
            localStorage.setItem('vibedrips_pwa_installed', 'true');
            console.log('📱 PWA Detection: Standalone mode detected, persisting state.');
        }

        // Detect currency and region from IP
        setupEventListeners();
        await detectUserRegion();
        await loadAvailableCurrencies();
        await initializeCurrency();
        await loadProducts(VibeDrips.currentCurrency);
        setupThemeToggle();
        closeSimpleModal();

        // 🔗 PHASE_25: Deep-Link Parameter Detection & Orchestration
        const urlParams = new URLSearchParams(window.location.search);
        const warpAsin = urlParams.get('asin');
        const warpCurrency = urlParams.get('currency');
        const landingView = urlParams.get('view'); // 'modal' or 'reel'

        if (warpAsin && warpCurrency) {
            console.log(`🔗 Deep-Link detected: ASIN ${warpAsin}, Currency ${warpCurrency}, View ${landingView}`);

            // Store landing mode for post-warp actions
            if (landingView) {
                localStorage.setItem('vibedrips-deeplink-mode', landingView);
            }

            // Trigger High-Fidelity Warp (Cinematic Glow + Tab Jump)
            if (window.triggerHighFidelityWarp) {
                window.triggerHighFidelityWarp(warpCurrency, warpAsin, false);
            }

            // 📱 PWA Nudge: Encourage App experience if on browser
            if (!VibeDrips.isStandalone() && window.showDeepLinkNudge) {
                setTimeout(() => window.showDeepLinkNudge(), 3000);
            }
        }

        console.log('✅ VibeDrips initialized successfully!');

    } catch (error) {
        console.error('❌ Initialization failed:', error);
        await fallbackInitialization();
    }
}

// Export to global scope
window.initializeApp = initializeApp;

console.log('🔧 Main.js loaded successfully');
