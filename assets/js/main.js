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
        await loadProducts(VibeDrips.currentCurrency); // Load products after currency
        setupThemeToggle(); // Add theme toggle
        
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
    elements.currencyTrigger = document.getElementById('currency-trigger');
    elements.productsContainer = document.getElementById('products-container');
    elements.sectionTitle = document.getElementById('section-title');
    elements.sectionSubtitle = document.getElementById('section-subtitle');
    elements.productCount = document.getElementById('product-count');
    elements.categoryCount = document.getElementById('category-count');
    elements.lastUpdated = document.getElementById('last-updated');
    elements.search = document.getElementById('search');
    elements.categoryFilter = document.getElementById('category-filter');
    elements.priceSort = document.getElementById('price-sort');
    elements.themeToggle = document.getElementById('theme-toggle');
    
    console.log('📋 DOM elements cached');
}

// Set up event listeners
function setupEventListeners() {
    document.querySelectorAll('.time-category').forEach(category => {
        category.addEventListener('click', function() {
            const filter = this.getAttribute('data-filter');
            setTimeFilter(filter);
        });
    });
    
    if (VibeDrips.elements.currencySelector) {
        VibeDrips.elements.currencySelector.addEventListener('change', setCurrency);
    }
    
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

// Setup theme toggle
function setupThemeToggle() {
    const body = document.body;
    const savedTheme = localStorage.getItem('theme') || 'light-theme'; // Default to light
    body.className = savedTheme;

    VibeDrips.elements.themeToggle.addEventListener('click', () => {
        if (body.classList.contains('light-theme')) {
            body.classList.remove('light-theme');
            body.classList.add('dark-theme');
        } else {
            body.classList.remove('dark-theme');
            body.classList.add('light-theme');
        }
        localStorage.setItem('theme', body.className);
    });
}

// Detect user region using IP
async function detectUserRegion() {
    try {
        console.log('🌍 Detecting user region...');
        
        const response = await fetch(VibeDrips.config.ipApiUrl);
        if (!response.ok) throw new Error('IP API failed');
        
        const data = await response.json();
        VibeDrips.currentRegion = {
            country: data.country_name,
            countryCode: data.country_code,
            currency: data.currency
        };
        
        console.log('📍 Region detected:', VibeDrips.currentRegion);
        
        const detectedCurrency = VibeDrips.config.regionToCurrency[data.country_code] || 
                                 VibeDrips.config.regionToCurrency[data.country_name] || 
                                 data.currency;
        
        if (detectedCurrency) {
            VibeDrips.currentCurrency = detectedCurrency;
            console.log('💰 Currency detected:', detectedCurrency);
        }
        
    } catch (error) {
        console.warn('⚠️ Region detection failed, using fallback');
        VibeDrips.currentCurrency = VibeDrips.config.fallbackCurrency;
        VibeDrips.currentRegion = { country: 'India', countryCode: 'IN' };
    }
}

// HYBRID APPROACH: Load only available currencies
async function loadAvailableCurrencies() {
    try {
        console.log('💱 Loading available currencies...');
        
        const response = await fetch(`${VibeDrips.config.dataUrl}/currencies.json`);
        if (!response.ok) throw new Error('Failed to load currencies');
        
        const data = await response.json();
        const potentialCurrencies = data.available_currencies || [];
        
        // Test which currencies actually have product files
        const availableCurrencies = [];
        
        for (const currency of potentialCurrencies) {
            try {
                const testResponse = await fetch(`${VibeDrips.config.dataUrl}/${currency.filename}`, 
                    { method: 'HEAD' }); // Just check if file exists
                
                if (testResponse.ok) {
                    availableCurrencies.push(currency);
                    console.log(`✅ ${currency.code} products available`);
                } else {
                    console.log(`⏳ ${currency.code} products coming soon`);
                }
            } catch (error) {
                console.log(`❌ ${currency.code} products not available`);
            }
        }
        
        // Add "Coming Soon" placeholder if no currencies available
        if (availableCurrencies.length === 0) {
            availableCurrencies.push({
                code: 'COMING_SOON',
                name: 'Products Coming Soon',
                symbol: '⏳',
                product_count: 0,
                filename: 'none'
            });
        }
        
        VibeDrips.availableCurrencies = availableCurrencies;
        
        // Update last updated info
        if (VibeDrips.elements.lastUpdated && data.last_updated) {
            const lastUpdated = new Date(data.last_updated);
            VibeDrips.elements.lastUpdated.textContent = lastUpdated.toLocaleDateString();
        }
        
        console.log(`💼 Found ${availableCurrencies.length} available currencies`);
        populateCurrencySelector();
        
    } catch (error) {
        console.error('❌ Failed to load currencies:', error);
        // Ultimate fallback
        VibeDrips.availableCurrencies = [{
            code: 'INR',
            name: 'Indian Rupee',
            symbol: '₹',
            product_count: 0,
            filename: 'products-INR.json'
        }];
        populateCurrencySelector();
    }
}

// Populate currency selector with only available currencies
function populateCurrencySelector() {
    const selector = VibeDrips.elements.currencySelector;
    if (!selector) return;
    
    // Clear existing options except the first
    while (selector.children.length > 1) {
        selector.removeChild(selector.lastChild);
    }
    
    // Add available currencies
    VibeDrips.availableCurrencies.forEach(currency => {
        const option = document.createElement('option');
        option.value = currency.code;
        
        if (currency.code === 'COMING_SOON') {
            option.textContent = `${currency.symbol} ${currency.name}`;
            option.disabled = true;
        } else {
            option.textContent = `${currency.code} - ${currency.name} (${currency.product_count} products)`;
        }
        
        selector.appendChild(option);
    });
    
    console.log('🎛️ Currency selector populated with available options');
}

// Initialize currency selection
async function initializeCurrency() {
    const detectedCurrency = VibeDrips.currentCurrency;
    const availableCodes = VibeDrips.availableCurrencies.map(c => c.code);
    
    // Check if detected currency is available
    if (detectedCurrency && availableCodes.includes(detectedCurrency)) {
        console.log(`🎯 Auto-selecting detected currency: ${detectedCurrency}`);
        VibeDrips.elements.currencySelector.value = detectedCurrency;
        await setCurrency();
    } else if (availableCodes.length > 0 && availableCodes[0] !== 'COMING_SOON') {
        // Auto-select first available currency
        console.log(`🎯 Auto-selecting first available: ${availableCodes[0]}`);
        VibeDrips.elements.currencySelector.value = availableCodes[0];
        await setCurrency();
    } else {
        // Show coming soon state
        showComingSoonState();
    }
}

// Show/hide currency modal
function showCurrencyModal() {
    if (VibeDrips.elements.currencyModal) {
        VibeDrips.elements.currencyModal.classList.remove('hidden');
        setTimeout(() => {
            VibeDrips.elements.currencySelector?.focus();
        }, 300);
    }
}

function hideCurrencyModal() {
    if (VibeDrips.elements.currencyModal) {
        VibeDrips.elements.currencyModal.classList.add('hidden');
    }
}

// Set selected currency and load products
async function setCurrency() {
    const selector = VibeDrips.elements.currencySelector;
    if (!selector || !selector.value || selector.value === 'COMING_SOON') {
        showComingSoonState();
        return;
    }
    
    const selectedCurrency = selector.value;
    console.log(`💰 Currency selected: ${selectedCurrency}`);
    
    VibeDrips.currentCurrency = selectedCurrency;
    
    // Update UI displays
    if (VibeDrips.elements.currentCurrency) {
        VibeDrips.elements.currentCurrency.textContent = selectedCurrency;
    }
    if (VibeDrips.elements.currencyDisplay) {
        VibeDrips.elements.currencyDisplay.textContent = selectedCurrency;
    }
    if (VibeDrips.elements.currencyTrigger) {
        VibeDrips.elements.currencyTrigger.textContent = selectedCurrency;
    }
    
    hideCurrencyModal();
    
    try {
        await loadProducts(selectedCurrency);
    } catch (error) {
        console.error('❌ Failed to load products:', error);
        showError('Failed to load products. Please try refreshing the page.');
    }
}

// Load products for specified currency
async function loadProducts(currency) {
    console.log(`📦 Loading products for ${currency}...`);
    
    try {
        showLoadingState();
        
        // Find the currency data
        const currencyData = VibeDrips.availableCurrencies.find(c => c.code === currency);
        if (!currencyData) {
            throw new Error(`Currency ${currency} not found`);
        }
        
        // Load the specific JSON file
        const response = await fetch(`${VibeDrips.config.dataUrl}/${currencyData.filename}`);
        if (!response.ok) {
            throw new Error(`Failed to load ${currencyData.filename}: ${response.status}`);
        }
        
        const products = await response.json();
        console.log(`✅ Loaded ${products.length} products`);
        
        // Process and store products
        VibeDrips.allProducts = products.map(processProductData);
        VibeDrips.filteredProducts = [...VibeDrips.allProducts];
        
        extractCategories();
        populateCategoryFilter();
        setTimeFilter(VibeDrips.currentTimeFilter);
        
        // Update stats
        VibeDrips.elements.productCount.textContent = VibeDrips.allProducts.length || 0;
        VibeDrips.elements.categoryCount.textContent = VibeDrips.categories.size || 0;
    } catch (error) {
        console.error('❌ Product loading failed:', error);
        showError('Unable to load products. Please check your connection and try again.');
    }
}

// Process raw product data
function processProductData(product) {
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

// Generate random ID
function generateId() {
    return 'prod-' + Math.random().toString(36).substr(2, 9);
}

// Extract categories
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

// Populate category filter
function populateCategoryFilter() {
    const categoryFilter = VibeDrips.elements.categoryFilter;
    if (!categoryFilter) return;
    
    categoryFilter.innerHTML = '<option value="">All Categories</option>';
    
    Array.from(VibeDrips.categories).sort().forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categoryFilter.appendChild(option);
    });
}

// Set time filter and update UI
function setTimeFilter(filter) {
    VibeDrips.currentTimeFilter = filter;
    document.querySelectorAll('.time-category').forEach(c => c.classList.remove('active'));
    document.querySelector(`.time-category[data-filter="${filter}"]`).classList.add('active');
    filterProducts();
}

// Filter products
function filterProducts() {
    VibeDrips.filteredProducts = VibeDrips.allProducts.filter(product => {
        const searchTerm = (VibeDrips.elements.search.value || '').toLowerCase();
        const category = VibeDrips.elements.categoryFilter.value;
        return (!searchTerm || (product.name && product.name.toLowerCase().includes(searchTerm))) &&
               (!category || (product.category && product.category === category)) &&
               (VibeDrips.currentTimeFilter === 'all' || (product.timeFilter && product.timeFilter === VibeDrips.currentTimeFilter));
    });
    if (VibeDrips.elements.productsContainer) {
        VibeDrips.elements.productsContainer.innerHTML = VibeDrips.filteredProducts.length > 0 ?
            VibeDrips.filteredProducts.map(p => `<div class="product-item">${p.name || 'Unnamed Product'}</div>`).join('') :
            '<div class="no-products">No products found.</div>';
    }
    console.log('Filtered products:', VibeDrips.filteredProducts.length);
}

// Sort products
function sortProducts() {
    const sortBy = VibeDrips.elements.priceSort.value;
    if (sortBy && VibeDrips.filteredProducts.length) {
        VibeDrips.filteredProducts.sort((a, b) => {
            switch (sortBy) {
                case 'price-low': return (a.price || 0) - (b.price || 0);
                case 'price-high': return (b.price || 0) - (a.price || 0);
                case 'name': return (a.name || '').localeCompare(b.name || '');
                case 'rating': return (b.customer_rating || 0) - (a.customer_rating || 0);
                case 'date-new': return new Date(b.date_first_available || 0) - new Date(a.date_first_available || 0);
                default: return 0;
            }
        });
    }
    if (VibeDrips.elements.productsContainer) {
        VibeDrips.elements.productsContainer.innerHTML = VibeDrips.filteredProducts.length > 0 ?
            VibeDrips.filteredProducts.map(p => `<div class="product-item">${p.name || 'Unnamed Product'}</div>`).join('') :
            '<div class="no-products">No products found.</div>';
    }
    console.log('Sorted products:', sortBy);
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
    if (VibeDrips.elements.currencyDisplay) {
        VibeDrips.elements.currencyDisplay.textContent = 'INR';
    }
    if (VibeDrips.elements.currencyTrigger) {
        VibeDrips.elements.currencyTrigger.textContent = 'INR';
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
