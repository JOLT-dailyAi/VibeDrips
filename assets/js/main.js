// main.js - Fixed VibeDrips Application for MISC Currency

// Global application state
window.VibeDrips = {
    currentCurrency: 'MISC',
    currentRegion: null,
    allProducts: [],
    filteredProducts: [],
    categories: new Set(),
    currentTimeFilter: 'all', // Default to 'all' products
    
    // Configuration - Fixed for GitHub Pages
    config: {
        dataUrl: './data',
        fallbackCurrency: 'MISC',
        ipApiUrl: 'https://ipapi.co/json/'
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
        await loadAvailableCurrencies();
        await initializeCurrency();
        
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
    
    // Close modal when clicking outside
    if (VibeDrips.elements.currencyModal) {
        VibeDrips.elements.currencyModal.addEventListener('click', (e) => {
            if (e.target === VibeDrips.elements.currencyModal) {
                hideCurrencyModal();
            }
        });
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

// Load available currencies and test file existence
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
                    { method: 'HEAD' });
                
                if (testResponse.ok) {
                    availableCurrencies.push(currency);
                    console.log(`✅ ${currency.code} products available (${currency.product_count} products)`);
                } else {
                    console.log(`⏳ ${currency.code} products coming soon`);
                }
            } catch (error) {
                console.log(`❌ ${currency.code} products not available`);
            }
        }
        
        VibeDrips.availableCurrencies = availableCurrencies;
        
        // Update last updated info
        if (VibeDrips.elements.lastUpdated && data.last_updated) {
            const lastUpdated = new Date(data.last_updated);
            VibeDrips.elements.lastUpdated.textContent = lastUpdated.toLocaleDateString();
        }
        
        console.log(`💼 Found ${availableCurrencies.length} available currencies`);
        populateCurrencySelector();
        
        return availableCurrencies.length > 0;
        
    } catch (error) {
        console.error('❌ Failed to load currencies:', error);
        return false;
    }
}

// Populate currency selector with available currencies only
function populateCurrencySelector() {
    const selector = VibeDrips.elements.currencySelector;
    if (!selector) return;
    
    // Clear existing options except the first placeholder
    while (selector.children.length > 1) {
        selector.removeChild(selector.lastChild);
    }
    
    if (VibeDrips.availableCurrencies.length === 0) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'No products available yet';
        option.disabled = true;
        selector.appendChild(option);
        return;
    }
    
    // Add available currencies
    VibeDrips.availableCurrencies.forEach(currency => {
        const option = document.createElement('option');
        option.value = currency.code;
        option.textContent = `${currency.symbol} ${currency.name} (${currency.product_count} products)`;
        selector.appendChild(option);
    });
    
    console.log('🎛️ Currency selector populated');
}

// Initialize currency selection
async function initializeCurrency() {
    if (VibeDrips.availableCurrencies.length === 0) {
        showComingSoonState();
        return;
    }
    
    // For now, just auto-select the first available currency (MISC)
    const firstCurrency = VibeDrips.availableCurrencies[0];
    console.log(`🎯 Auto-selecting currency: ${firstCurrency.code}`);
    
    VibeDrips.currentCurrency = firstCurrency.code;
    
    // Update UI
    if (VibeDrips.elements.currencySelector) {
        VibeDrips.elements.currencySelector.value = firstCurrency.code;
    }
    
    // Load products automatically
    await setCurrency();
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
    if (!selector || !selector.value) {
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
        console.log(`✅ Loaded ${products.length} products for ${currency}`);
        
        // Process and store products
        VibeDrips.allProducts = products.map(processProductData).filter(p => p && p.name);
        VibeDrips.filteredProducts = [...VibeDrips.allProducts];
        
        extractCategories();
        populateCategoryFilter();
        
        // Set default to 'All Products' with Rating sort
        setTimeFilter('all');
        
    } catch (error) {
        console.error('❌ Product loading failed:', error);
        showError('Unable to load products. Please check your connection and try again.');
    }
}

// Process raw product data from CSV conversion
function processProductData(product) {
    if (!product) return null;
    
    // Handle different possible field names from CSV conversion
    const name = product.productTitle || product.name || 'Untitled Product';
    if (!name || name.trim() === '') return null;
    
    return {
        ...product,
        id: product.asin || product.id || generateId(),
        name: name.trim(),
        description: product.Description || product.description || 'No description available',
        price: parseFloat(product.price) || 0,
        main_image: product.MainImage || product.main_image || '',
        all_images: product.AllImages || product.all_images || [],
        amazon_short: product['Amazon SiteStripe (Short)'] || product.amazon_short || '',
        amazon_long: product['Amazon SiteStripe (Long)'] || product.amazon_long || '',
        source_link: product['Product Source Link'] || product.source_link || '',
        date_first_available: product.dateFirstAvailable || product.date_first_available || '',
        timestamp: product.Timestamp || product.timestamp || new Date().toISOString(),
        customer_rating: parseFloat(product.customerRating || product.customer_rating) || 0,
        review_count: parseInt(product.reviewCount || product.review_count) || 0,
        brand: product.brand || 'VibeDrips',
        category: product.categoryHierarchy || product.category || 'General',
        subcategory: product.itemTypeName || product.subcategory || '',
        material: product.material || '',
        color: product.color || '',
        dimensions: product.dimensions || '',
        weight: product.weight || '',
        availability: product.availability || 'In Stock'
    };
}

// Generate random ID
function generateId() {
    return 'prod-' + Math.random().toString(36).substr(2, 9);
}

// Extract categories from products
function extractCategories() {
    VibeDrips.categories.clear();
    
    VibeDrips.allProducts.forEach(product => {
        // Handle hierarchical categories (e.g., "Toys & Games › Action & Toy Figures › Toy Figures")
        if (product.category && product.category.trim()) {
            const categoryParts = product.category.split('›').map(c => c.trim());
            categoryParts.forEach(cat => {
                if (cat) VibeDrips.categories.add(cat);
            });
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
    
    Array.from(VibeDrips.categories).sort().forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categoryFilter.appendChild(option);
    });
    
    console.log('🎛️ Category filter populated');
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
        VibeDrips.elements.productsContainer.innerHTML = `
            <div class="coming-soon-state">
                <div class="coming-soon-icon">⏳</div>
                <h3>Products Loading Soon</h3>
                <p>We're curating amazing drops for different regions. Check back soon!</p>
                <div class="available-now">
                    <strong>Coming Soon:</strong><br>
                    🇺🇸 USA • 🇬🇧 UK • 🇮🇳 India • 🇪🇺 Europe • 🇯🇵 Japan
                </div>
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

// Fallback initialization when everything fails
async function fallbackInitialization() {
    console.log('🆘 Running fallback initialization...');
    
    VibeDrips.currentCurrency = VibeDrips.config.fallbackCurrency;
    
    if (VibeDrips.elements.currentCurrency) {
        VibeDrips.elements.currentCurrency.textContent = VibeDrips.config.fallbackCurrency;
    }
    
    if (VibeDrips.elements.currencyDisplay) {
        VibeDrips.elements.currencyDisplay.textContent = VibeDrips.config.fallbackCurrency;
    }
    
    showComingSoonState();
}

// Close all modals
function closeAllModals() {
    hideCurrencyModal();
    if (window.closeProductModal) {
        window.closeProductModal();
    }
}

// Utility function for notifications
function showNotification(message) {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notif => notif.remove());
    
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(45deg, #667eea, #764ba2);
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        z-index: 3000;
        font-weight: 600;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        transform: translateX(400px);
        transition: transform 0.4s ease;
        max-width: 300px;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 400);
    }, 3000);
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
window.showNotification = showNotification;

console.log('🔧 Fixed Main.js for MISC currency loaded successfully');
