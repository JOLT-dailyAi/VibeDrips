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
        await loadProducts();
        setupCollapsibleHeader();
        setupThemeToggle();
        setupCurrencyTrigger();
        
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
    elements.currencyTrigger = document.getElementById('currency-trigger');
    
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
        if (!elements.currencyModal.contains(e.target)) {
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
        if (body.classList.contains('dark-theme')) {
            body.classList.remove('dark-theme');
            body.classList.add('light-theme');
        } else {
            body.classList.remove('light-theme');
            body.classList.add('dark-theme');
        }
        localStorage.setItem('theme', body.className);
    });
}

// Setup currency trigger
function setupCurrencyTrigger() {
    if (VibeDrips.elements.currencyTrigger) {
        VibeDrips.elements.currencyTrigger.addEventListener('click', () => {
            showCurrencyModal();
        });
        VibeDrips.elements.currencyTrigger.textContent = VibeDrips.currentCurrency || 'INR'; // Set initial currency
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
    if (VibeDrips.elements.currencyTrigger) {
        VibeDrips.elements.currencyTrigger.textContent = VibeDrips.currentCurrency;
    }
    localStorage.setItem('selectedCurrency', VibeDrips.currentCurrency);

    showCurrencyModal();
}

// Load products
async function loadProducts() {
    try {
        showLoadingState();
        const response = await fetch(`${VibeDrips.config.dataUrl}/products-${VibeDrips.currentCurrency}.json`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        VibeDrips.allProducts = await response.json();
        console.log('Products loaded:', VibeDrips.allProducts); // Debug log
        VibeDrips.categories = new Set(VibeDrips.allProducts.map(p => p.category || 'Uncategorized'));
        VibeDrips.elements.productCount.textContent = VibeDrips.allProducts.length || 0;
        VibeDrips.elements.categoryCount.textContent = VibeDrips.categories.size || 0;
        VibeDrips.elements.lastUpdated.textContent = '9/15/2025'; // Current date
        populateCategoryFilter();
        filterProducts(); // Initial filter
    } catch (error) {
        console.error('❌ Failed to load products:', error, `URL: ${VibeDrips.config.dataUrl}/products-${VibeDrips.currentCurrency}.json`);
        showError('Failed to load products. Check console for details or ensure JSON files exist in ./data/.');
    }
}

// Populate category filter
function populateCategoryFilter() {
    if (!VibeDrips.elements.categoryFilter) return;
    VibeDrips.elements.categoryFilter.innerHTML = '<option value="">All Categories</option>';
    VibeDrips.categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        VibeDrips.elements.categoryFilter.appendChild(option);
    });
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
        if (VibeDrips.elements.currencyTrigger) {
            VibeDrips.elements.currencyTrigger.textContent = VibeDrips.currentCurrency;
        }
        localStorage.setItem('selectedCurrency', VibeDrips.currentCurrency);
        loadProducts(); // Reload products with new currency
        hideCurrencyModal();
    }
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
                case 'rating': return (b.rating || 0) - (a.rating || 0);
                case 'date-new': return new Date(b.date || 0) - new Date(a.date || 0);
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
