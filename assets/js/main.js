// main.js - Core VibeDrips Application Logic

// Global application state
window.VibeDrips = {
    // App State
    currentCurrency: null,
    currentRegion: null,
    allProducts: [],
    filteredProducts: [],
    categories: new Set(),
    currentTimeFilter: 'hot',
    
    // Configuration
    config: {
        dataUrl: 'https://raw.githubusercontent.com/JOLT-dailyAi/VibeDrips/main/data',
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
            'ES': 'EUR', 'Spain': 'EUR',
            'NL': 'EUR', 'Netherlands': 'EUR',
            'BE': 'EUR', 'Belgium': 'EUR',
            'IE': 'EUR', 'Ireland': 'EUR',
            'JP': 'JPY', 'Japan': 'JPY',
            'CA': 'CAD', 'Canada': 'CAD',
            'AU': 'AUD', 'Australia': 'AUD',
            'BR': 'BRL', 'Brazil': 'BRL',
            'MX': 'MXN', 'Mexico': 'MXN',
            'AE': 'AED', 'UAE': 'AED', 'United Arab Emirates': 'AED',
            'SG': 'SGD', 'Singapore': 'SGD',
            'SA': 'SAR', 'Saudi Arabia': 'SAR',
            'SE': 'SEK', 'Sweden': 'SEK',
            'PL': 'PLN', 'Poland': 'PLN'
        }
    },
    
    // Available currencies (loaded dynamically)
    availableCurrencies: [],
    
    // UI Elements Cache
    elements: {}
};

// Initialize the application
async function initializeApp() {
    console.log('🎯 Starting VibeDrips initialization...');
    
    try {
        // Cache DOM elements
        cacheElements();
        
        // Set up event listeners
        setupEventListeners();
        
        // Detect user region and currency
        await detectUserRegion();
        
        // Load available currencies
        await loadAvailableCurrencies();
        
        // Show currency selection or auto-select based on region
        await initializeCurrency();
        
        console.log('✅ VibeDrips initialized successfully!');
        
    } catch (error) {
        console.error('❌ Initialization failed:', error);
        // Fallback to INR if everything fails
        await fallbackInitialization();
    }
}

// Cache frequently used DOM elements
function cacheElements() {
    const elements = VibeDrips.elements;
    
    elements.currencyModal = document.getElementById('currency-modal');
    elements.currencySelector = document.getElementById('currency-selector');
    elements.currencyLoading = document.getElementById('currency-loading');
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
    
    console.log('📋 DOM elements cached');
}

// Set up global event listeners
function setupEventListeners() {
    // Time category filters
    document.querySelectorAll('.time-category').forEach(category => {
        category.addEventListener('click', function() {
            const filter = this.getAttribute('data-filter');
            setTimeFilter(filter);
        });
    });
    
    // Currency selector change
    if (VibeDrips.elements.currencySelector) {
        VibeDrips.elements.currencySelector.addEventListener('change', setCurrency);
    }
    
    // Modal close handlers
    document.addEventListener('click', (e) => {
        if (e.target === VibeDrips.elements.currencyModal) {
            // Don't close currency modal by clicking outside on first visit
        }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAllModals();
        }
        
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            VibeDrips.elements.search?.focus();
        }
    });
    
    console.log('🎧 Event listeners set up');
}

// Detect user region using IP geolocation
async function detectUserRegion() {
    try {
        console.log('🌍 Detecting user region...');
        
        const response = await fetch(VibeDrips.config.ipApiUrl);
        if (!response.ok) throw new Error('IP API failed');
        
        const data = await response.json();
        VibeDrips.currentRegion = {
            country: data.country_name,
            countryCode: data.country_code,
            currency: data.currency,
            timezone: data.timezone
        };
        
        console.log('📍 Region detected:', VibeDrips.currentRegion);
        
        // Map region to our supported currency
        const detectedCurrency = VibeDrips.config.regionToCurrency[data.country_code] || 
                                 VibeDrips.config.regionToCurrency[data.country_name] || 
                                 data.currency;
        
        if (detectedCurrency) {
            VibeDrips.currentCurrency = detectedCurrency;
            console.log('💰 Currency detected:', detectedCurrency);
        }
        
    } catch (error) {
        console.warn('⚠️ Region detection failed:', error.message);
        // Fallback to INR
        VibeDrips.currentCurrency = VibeDrips.config.fallbackCurrency;
        VibeDrips.currentRegion = { country: 'India', countryCode: 'IN' };
    }
}

// Load available currencies from GitHub data
async function loadAvailableCurrencies() {
    try {
        console.log('💱 Loading available currencies...');
        
        const response = await fetch(`${VibeDrips.config.dataUrl}/currencies.json`);
        if (!response.ok) throw new Error('Failed to load currencies');
        
        const data = await response.json();
        VibeDrips.availableCurrencies = data.available_currencies || [];
        
        // Update last updated info
        if (VibeDrips.elements.lastUpdated) {
            const lastUpdated = new Date(data.last_updated);
            VibeDrips.elements.lastUpdated.textContent = lastUpdated.toLocaleDateString();
        }
        
        console.log(`💼 Loaded ${VibeDrips.availableCurrencies.length} currencies`);
        
        // Populate currency selector
        populateCurrencySelector();
        
    } catch (error) {
        console.error('❌ Failed to load currencies:', error);
        // Use fallback currencies
        VibeDrips.availableCurrencies = [
            { code: 'INR', name: 'Indian Rupee', symbol: '₹', product_count: 0 }
        ];
        populateCurrencySelector();
    }
}

// Populate the currency selector dropdown
function populateCurrencySelector() {
    const selector = VibeDrips.elements.currencySelector;
    if (!selector) return;
    
    // Clear existing options except the first one
    while (selector.children.length > 1) {
        selector.removeChild(selector.lastChild);
    }
    
    // Add available currencies
    VibeDrips.availableCurrencies
        .filter(currency => currency.product_count > 0) // Only show currencies with products
        .sort((a, b) => b.product_count - a.product_count) // Sort by product count
        .forEach(currency => {
            const option = document.createElement('option');
            option.value = currency.code;
            option.textContent = `${currency.code} - ${currency.name} (${currency.product_count} products)`;
            selector.appendChild(option);
        });
    
    console.log('🎛️ Currency selector populated');
}

// Initialize currency selection
async function initializeCurrency() {
    const detectedCurrency = VibeDrips.currentCurrency;
    const availableCurrencies = VibeDrips.availableCurrencies.map(c => c.code);
    
    // Check if detected currency is available
    if (detectedCurrency && availableCurrencies.includes(detectedCurrency)) {
        console.log(`🎯 Auto-selecting detected currency: ${detectedCurrency}`);
        VibeDrips.elements.currencySelector.value = detectedCurrency;
        await setCurrency();
    } else {
        // Show modal for manual selection
        console.log('🎯 Showing currency selection modal');
        showCurrencyModal();
    }
}

// Show currency selection modal
function showCurrencyModal() {
    if (VibeDrips.elements.currencyModal) {
        VibeDrips.elements.currencyModal.classList.remove('hidden');
        
        // Focus on selector after a brief delay
        setTimeout(() => {
            VibeDrips.elements.currencySelector?.focus();
        }, 300);
    }
}

// Hide currency selection modal
function hideCurrencyModal() {
    if (VibeDrips.elements.currencyModal) {
        VibeDrips.elements.currencyModal.classList.add('hidden');
    }
}

// Set the selected currency and load products
async function setCurrency() {
    const selector = VibeDrips.elements.currencySelector;
    if (!selector || !selector.value) return;
    
    const selectedCurrency = selector.value;
    console.log(`💰 Currency selected: ${selectedCurrency}`);
    
    // Update app state
    VibeDrips.currentCurrency = selectedCurrency;
    
    // Update UI displays
    if (VibeDrips.elements.currentCurrency) {
        VibeDrips.elements.currentCurrency.textContent = selectedCurrency;
    }
    if (VibeDrips.elements.currencyDisplay) {
        VibeDrips.elements.currencyDisplay.textContent = selectedCurrency;
    }
    
    // Hide currency modal
    hideCurrencyModal();
    
    // Load products for selected currency
    try {
        await loadProducts(selectedCurrency);
    } catch (error) {
        console.error('❌ Failed to load products:', error);
        showError('Failed to load products. Please try refreshing the page.');
    }
}

// Load products for the specified currency
async function loadProducts(currency) {
    console.log(`📦 Loading products for ${currency}...`);
    
    try {
        // Show loading state
        showLoadingState();
        
        // Try to load currency-specific products
        let productUrl = `${VibeDrips.config.dataUrl}/products-${currency}.json`;
        let response = await fetch(productUrl);
        
        // Fallback to MISC if currency-specific file doesn't exist
        if (!response.ok && currency !== 'MISC') {
            console.warn(`⚠️ No products found for ${currency}, trying MISC...`);
            productUrl = `${VibeDrips.config.dataUrl}/products-MISC.json`;
            response = await fetch(productUrl);
        }
        
        if (!response.ok) {
            throw new Error(`Failed to load products: ${response.status}`);
        }
        
        const products = await response.json();
        console.log(`✅ Loaded ${products.length} products`);
        
        // Process and store products
        VibeDrips.allProducts = products.map(processProductData);
        VibeDrips.filteredProducts = [...VibeDrips.allProducts];
        
        // Extract categories
        extractCategories();
        populateCategoryFilter();
        
        // Apply current time filter
        setTimeFilter(VibeDrips.currentTimeFilter);
        
    } catch (error) {
        console.error('❌ Product loading failed:', error);
        showError('Unable to load products. Please check your internet connection.');
    }
}

// Process raw product data
function processProductData(product) {
    // Ensure all required fields exist with defaults
    return {
        ...product,
        id: product.asin || product.id || generateId(),
        name: product.name || product.productTitle || 'Untitled Product',
        description: product.description || 'No description available',
        price: parseFloat(product.price) || 0,
        main_image: product.main_image || product.MainImage || '',
        all_images: Array.isArray(product.all_images) ? product.all_images : [],
        affiliate_link: product.amazon_short || product.amazon_long || product.affiliate_link || '',
        source_link: product.source_link || product['Product Source Link'] || '',
        date_first_available: product.date_first_available || product.dateFirstAvailable || '',
        timestamp: product.timestamp || new Date().toISOString(),
        customer_rating: parseFloat(product.customer_rating) || 0,
        review_count: parseInt(product.review_count) || 0,
        brand: product.brand || 'VibeDrips',
        category: product.category || 'General',
        subcategory: product.subcategory || ''
    };
}

// Generate a random ID for products without one
function generateId() {
    return 'prod-' + Math.random().toString(36).substr(2, 9);
}

// Extract unique categories from products
function extractCategories() {
    VibeDrips.categories.clear();
    VibeDrips.allProducts.forEach(product => {
        if (product.category && product.category.trim()) {
            VibeDrips.categories.add(product.category.trim());
        }
        if (product.subcategory && product.subcategory.trim()) {
            VibeDrips.categories.add(product.subcategory.trim());
        }
    });
    
    console.log(`📂 Found ${VibeDrips.categories.size} categories`);
}

// Populate category filter dropdown
function populateCategoryFilter() {
    const categoryFilter = VibeDrips.elements.categoryFilter;
    if (!categoryFilter) return;
    
    categoryFilter.innerHTML = '<option value="">All Categories</option>';
    
    const sortedCategories = Array.from(VibeDrips.categories).sort();
    sortedCategories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categoryFilter.appendChild(option);
    });
}

// Fallback initialization when everything fails
async function fallbackInitialization() {
    console.log('🆘 Running fallback initialization...');
    
    VibeDrips.currentCurrency = 'INR';
    
    if (VibeDrips.elements.currentCurrency) {
        VibeDrips.elements.currentCurrency.textContent = 'INR';
    }
    
    showError('Unable to load product data. Please check your internet connection and refresh the page.');
}

// Show loading state
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

// Show error message
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

// Close all open modals
function closeAllModals() {
    // Close currency modal (only if currency is already selected)
    if (VibeDrips.currentCurrency) {
        hideCurrencyModal();
    }
    
    // Close product modal
    window.closeProductModal && window.closeProductModal();
}

// Export functions to global scope for HTML onclick handlers
window.initializeApp = initializeApp;
window.showCurrencyModal = showCurrencyModal;
window.setCurrency = setCurrency;

console.log('🔧 Main.js loaded successfully');
