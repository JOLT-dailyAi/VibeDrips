// main.js - Fixed VibeDrips Application with Hybrid Approach

// Global application state
window.VibeDrips = {
    currentCurrency: null,
    currentRegion: null,
    allProducts: [],
    filteredProducts: [],
    categories: new Set(),
    currentTimeFilter: 'hot',
    
    // Configuration - FIXED URLs
    config: {
        dataUrl: './data', // Relative path for GitHub Pages
        fallbackCurrency: 'INR',
        ipApiUrl: 'https://ipapi.co/json/',
        
        // Currency to region mapping
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
    elements: {}
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
        setupCollapsibleHeader();
        setupThemeToggle();
        setupKoFiTrigger();
        
        console.log('✅ VibeDrips initialized successfully!');
        
    } catch (error) {
        console.error('❌ Initialization failed:', error);
        await fallbackInitialization();
    }
}

// Cache DOM elements
function cacheElements() {
    const elements = VibeDrips.elements;
    
    elements.currencyModal = document.getElementById('currency-modal');
    elements.currencySelector = document.getElementById('currency-selector');
    elements.currentCurrency = document.getElementById('current-currency');
    elements.currencyDisplay = document.getElementById('currency-display');
    elements.productsContainer = document.getElementById('products-container');
    elements.sectionTitle = document.getElementById('section-title');
    elements.sectionSubtitle = document.getElementById('section-subtitle');
    elements.productCount = document.getElementById('product-count');
    elements.categoryCount = document.getElementById('category-count');
    elements.lastUpdated = document.getElementById('last-updated');
    elements.search = document.getElementById('search');
    elements.categoryFilter = document.getElementById('category-filter');
    elements.priceSort = document.getElementById('price-sort');
    elements.header = document.querySelector('.main-header');
    elements.themeToggle = document.getElementById('theme-toggle');
    elements.kofiTrigger = document.getElementById('kofi-trigger');
    
    console.log('📋 DOM elements cached');
}

// Set up event listeners
function setupEventListeners() {
    document.querySelectorAll('.time-category').forEach(category => {
        category.addEventListener('click', function() {
            const filter = this.getAttribute('data-filter');
            VibeDrips.currentTimeFilter = filter;
            document.querySelectorAll('.time-category').forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            filterProducts();
        });
    });

    elements.search.addEventListener('input', filterProducts);
    elements.categoryFilter.addEventListener('change', filterProducts);
    elements.priceSort.addEventListener('change', sortProducts);

    // Close modal on outside click
    document.addEventListener('click', (e) => {
        if (!elements.currencyModal.contains(e.target) && e.target !== elements.currencyDisplay) {
            hideCurrencyModal();
        }
    });

    // Prevent modal close when clicking inside
    elements.currencyModal.addEventListener('click', (e) => e.stopPropagation());
}

// Setup collapsible header
function setupCollapsibleHeader() {
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        if (currentScroll > lastScroll && currentScroll > 50) {
            VibeDrips.elements.header.classList.add('collapsed');
        } else {
            VibeDrips.elements.header.classList.remove('collapsed');
        }
        lastScroll = currentScroll <= 0 ? 0 : currentScroll;
    });
}

// Setup theme toggle
function setupThemeToggle() {
    const body = document.body;
    const savedTheme = localStorage.getItem('theme') || 'dark-theme';
    body.className = savedTheme;

    VibeDrips.elements.themeToggle.addEventListener('click', () => {
        body.classList.toggle('dark-theme');
        body.classList.toggle('light-theme');
        localStorage.setItem('theme', body.className);
    });
}

// Setup Ko-fi trigger
function setupKoFiTrigger() {
    if (VibeDrips.elements.kofiTrigger) {
        VibeDrips.elements.kofiTrigger.addEventListener('click', () => {
            if (typeof kofiWidgetOverlay !== 'undefined') {
                kofiWidgetOverlay.show();
            }
        });
    }
}

// Detect user region
async function detectUserRegion() {
    try {
        const response = await fetch(VibeDrips.config.ipApiUrl);
        const data = await response.json();
        VibeDrips.currentRegion = data.country_code || data.country_name || 'IN';
        console.log(`🌐 Detected region: ${VibeDrips.currentRegion}`);
    } catch (error) {
        console.warn('⚠️ Region detection failed, falling back to IN:', error);
        VibeDrips.currentRegion = 'IN';
    }
}

// Load available currencies
async function loadAvailableCurrencies() {
    try {
        const response = await fetch(`${VibeDrips.config.dataUrl}/currencies.json`);
        VibeDrips.availableCurrencies = await response.json();
        populateCurrencySelector();
    } catch (error) {
        console.error('❌ Failed to load currencies:', error);
    }
}

// Populate currency selector
function populateCurrencySelector() {
    if (!VibeDrips.elements.currencySelector) return;
    VibeDrips.elements.currencySelector.innerHTML = '<option value="">Choose your currency...</option>';
    VibeDrips.availableCurrencies.forEach(currency => {
        const option = document.createElement('option');
        option.value = currency.code;
        option.textContent = `${currency.symbol} ${currency.name} (${currency.code})`;
        VibeDrips.elements.currencySelector.appendChild(option);
    });
}

// Initialize currency
async function initializeCurrency() {
    if (!VibeDrips.elements.currentCurrency) return;

    const savedCurrency = localStorage.getItem('selectedCurrency');
    if (savedCurrency && VibeDrips.availableCurrencies.some(c => c.code === savedCurrency)) {
        VibeDrips.currentCurrency = savedCurrency;
    } else {
        VibeDrips.currentCurrency = VibeDrips.config.regionToCurrency[VibeDrips.currentRegion] || VibeDrips.config.fallbackCurrency;
    }

    VibeDrips.elements.currentCurrency.textContent = VibeDrips.currentCurrency;
    localStorage.setItem('selectedCurrency', VibeDrips.currentCurrency);

    showCurrencyModal();
}

// Show currency modal
function showCurrencyModal() {
    if (VibeDrips.elements.currencyModal) {
        VibeDrips.elements.currencyModal.classList.remove('hidden');
        VibeDrips.elements.currencySelector.value = VibeDrips.currentCurrency || '';
    }
}

// Hide currency modal
function hideCurrencyModal() {
    if (VibeDrips.elements.currencyModal) {
        VibeDrips.elements.currencyModal.classList.add('hidden');
    }
}

// Set currency
function setCurrency() {
    const selectedCurrency = VibeDrips.elements.currencySelector.value;
    if (selectedCurrency && VibeDrips.availableCurrencies.some(c => c.code === selectedCurrency)) {
        VibeDrips.currentCurrency = selectedCurrency;
        VibeDrips.elements.currentCurrency.textContent = VibeDrips.currentCurrency;
        localStorage.setItem('selectedCurrency', VibeDrips.currentCurrency);
        hideCurrencyModal();
        filterProducts(); // Refresh products with new currency
    }
}

// Filter products (to be implemented with products.js integration)
function filterProducts() {
    // This will be enhanced in products.js
    console.log('Filtering products...', VibeDrips.currentTimeFilter);
}

// Sort products (to be implemented with products.js integration)
function sortProducts() {
    // This will be enhanced in products.js
    console.log('Sorting products...');
}

// Show different UI states
function showLoadingState() {
    if (VibeDrips.elements.productsContainer) {
        VibeDrips.elements.productsContainer.innerHTML = `
            <div class="loading-state">
                <div class="loading-spinner"></div>
                <div>Loading your curated drops...</div>
            </div>
        `;
    }
}

function showComingSoonState() {
    if (VibeDrips.elements.productsContainer) {
        const availableList = VibeDrips.availableCurrencies
            .filter(c => c.code !== 'COMING_SOON')
            .map(c => `<a href="?currency=${c.code}" onclick="selectCurrency('${c.code}'); return false;">
                       ${c.symbol} ${c.name}</a>`)
            .join(' • ');

        VibeDrips.elements.productsContainer.innerHTML = `
            <div class="coming-soon-state">
                <div class="coming-soon-icon">⏳</div>
                <h3>Products Loading Soon</h3>
                <p>We're curating amazing drops for this region. Check back soon!</p>
                ${availableList ? `
                <div class="available-now">
                    <strong>Available Now:</strong><br>
                    ${availableList}
                </div>` : ''}
            </div>
        `;
    }
}

function showError(message) {
    if (VibeDrips.elements.productsContainer) {
        VibeDrips.elements.productsContainer.innerHTML = `
            <div class="error-state">
                <div class="error-icon">⚠️</div>
                <div class="error-message">${message}</div>
                <button onclick="location.reload()" class="retry-button">Retry</button>
            </div>
        `;
    }
}

// Fallback initialization
async function fallbackInitialization() {
    console.log('🆘 Running fallback initialization...');
    
    VibeDrips.currentCurrency = 'INR';
    
    if (VibeDrips.elements.currentCurrency) {
        VibeDrips.elements.currentCurrency.textContent = 'INR';
    }
    
    showComingSoonState();
}

// Close all modals
function closeAllModals() {
    if (VibeDrips.currentCurrency) {
        hideCurrencyModal();
    }
    if (window.closeProductModal) {
        window.closeProductModal();
    }
}

// Helper function for URL currency selection
function selectCurrency(currencyCode) {
    if (VibeDrips.elements.currencySelector) {
        VibeDrips.elements.currencySelector.value = currencyCode;
        setCurrency();
    }
}

// Export functions to global scope
window.initializeApp = initializeApp;
window.showCurrencyModal = showCurrencyModal;
window.setCurrency = setCurrency;
window.selectCurrency = selectCurrency;

console.log('🔧 Fixed Main.js loaded successfully');
