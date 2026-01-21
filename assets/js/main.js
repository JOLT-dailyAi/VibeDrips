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
    }
};

// Initialize the application
async function initializeApp() {
    console.log('🎯 Starting VibeDrips initialization...');

    try {
        cacheElements();
        setupEventListeners();
        await detectUserRegion();
        await loadAvailableCurrencies();
        await initializeCurrency();
        await loadProducts(VibeDrips.currentCurrency);
        setupThemeToggle();
        closeSimpleModal();

        console.log('✅ VibeDrips initialized successfully!');

    } catch (error) {
        console.error('❌ Initialization failed:', error);
        await fallbackInitialization();
    }
}

// Export to global scope
window.initializeApp = initializeApp;

console.log('🔧 Main.js loaded successfully');
