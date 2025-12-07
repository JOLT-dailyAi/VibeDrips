// product-loader.js - EXACT COPY from main.js lines 277-390

// Load products for specified currency
async function loadProducts(currency) {
    console.log(`📦 Loading products for ${currency}...`);
    
    try {
        showLoadingState();
        
        const currencyData = VibeDrips.availableCurrencies.find(c => c.code === currency);
        if (!currencyData) {
            throw new Error(`Currency ${currency} not found`);
        }
        
        const response = await fetch(`${VibeDrips.config.dataUrl}/${currencyData.filename}`);
        if (!response.ok) {
            throw new Error(`Failed to load ${currencyData.filename}: ${response.status}`);
        }
        
        const products = await response.json();
        console.log(`✅ Loaded ${products.length} products`);
        
        VibeDrips.allProducts = products.map(processProductData);
        VibeDrips.filteredProducts = [...VibeDrips.allProducts];
        
        extractCategories();
        populateCategoryFilter();
        setTimeFilter(VibeDrips.currentTimeFilter);
        
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

// Export to global scope
window.loadProducts = loadProducts;
window.processProductData = processProductData;
window.generateId = generateId;
window.extractCategories = extractCategories;
window.populateCategoryFilter = populateCategoryFilter;
