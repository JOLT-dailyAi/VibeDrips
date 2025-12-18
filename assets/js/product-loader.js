// product-loader.js - Product data loader with cache-busting
// IMPORTANT: Update DATA_VERSION every time you update products.csv
const DATA_VERSION = '20251217-auto'; // ⬅️ CHANGE THIS ON EVERY CSV UPDATE (format: YYYYMMDD-vX)

// Load products for specified currency
async function loadProducts(currency) {
    console.log(`📦 Loading products for ${currency}...`);
    
    try {
        showLoadingState();
        
        const currencyData = VibeDrips.availableCurrencies.find(c => c.code === currency);
        if (!currencyData) {
            throw new Error(`Currency ${currency} not found`);
        }
        
        // Add cache-busting parameter to force fresh data
        const url = `${VibeDrips.config.dataUrl}/${currencyData.filename}?v=${DATA_VERSION}`;
        console.log(`🔄 Fetching: ${url}`);
        
        const response = await fetch(url, {
            cache: 'no-store' // Don't use browser cache
        });
        
        if (!response.ok) {
            throw new Error(`Failed to load ${currencyData.filename}: ${response.status}`);
        }
        
        const products = await response.json();
        console.log(`✅ Loaded ${products.length} products (version: ${DATA_VERSION})`);
        
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

// Process raw product data with fallback support
function processProductData(product) {
    // ========================================
    // DISCOUNT VALIDATION & COMPUTATION LOGIC
    // ========================================
    
    // Helper function to safely parse price (handles both string and number)
    const parsePrice = (value) => {
        if (!value) return 0;
        if (typeof value === 'number') return value;
        if (typeof value === 'string') {
            return parseFloat(value.replace(/[^\d.]/g, '')) || 0;
        }
        return 0;
    };
    
        // Parse pricing fields from CSV (exact column names from products.csv)
    const currentPrice = parsePrice(product.price);
    const originalPrice = parsePrice(product.originalPrice);
    
    // Parse discount percentage (handles "27%" format)
    let discountPercent = 0;
    if (product.discountPercentage) {
        const percentStr = String(product.discountPercentage).replace(/[^\d.]/g, '');
        discountPercent = parseInt(percentStr) || 0;
    }
    
    // Auto-calculate discount if missing but prices differ
    if (discountPercent === 0 && originalPrice > currentPrice && currentPrice > 0) {
        discountPercent = Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
    }
    
    // Validate discount logic
    let showDiscount = false;
    
    // Check if originalPrice field was actually provided (not just missing)
    const hasOriginalPrice = product.originalPrice !== undefined && 
                             product.originalPrice !== null && 
                             product.originalPrice !== '' &&
                             originalPrice > 0;
    
    if (hasOriginalPrice && currentPrice > originalPrice) {
        // INVALID: Current price higher than original (real data error)
        // Action: Ignore discount, show only current price, log warning
        showDiscount = false;
        console.warn(`⚠️ Invalid pricing for ${product.asin || 'unknown'}: price (${currentPrice}) > originalPrice (${originalPrice})`);
    } else if (!hasOriginalPrice || currentPrice === originalPrice) {
        // No discount: Original price missing or prices match
        showDiscount = false;
    } else if (discountPercent > 0 && originalPrice > currentPrice) {
        // VALID: Show discount badge (any positive discount, no minimum threshold)
        showDiscount = true;
    }

    
    // ========================================
    // RETURN NORMALIZED PRODUCT DATA
    // ========================================
    
    return {
        ...product,
        id: product.asin || product.id || generateId(),
        name: product.name || product.productTitle || product.Title || 'Untitled Product',
        description: product.description || product.Description || 'No description available',
        
        // Normalized pricing fields
        price: currentPrice, // Always display this value
        display_price: currentPrice, // Explicit display field
        display_original: originalPrice, // For internal use only (not rendered in UI)
        computed_discount: discountPercent, // Discount percentage as number
        show_discount: showDiscount, // Boolean flag for badge visibility
        
        main_image: product.main_image || product.MainImage || '',
        all_images: (() => {
            // Handle JSON string format from new scraper
            if (typeof product.all_images === 'string') {
                try {
                    return JSON.parse(product.all_images);
                } catch (e) {
                    return [];
                }
            }
            // Handle AllImages field (JSON string)
            if (typeof product.AllImages === 'string') {
                try {
                    return JSON.parse(product.AllImages);
                } catch (e) {
                    return [];
                }
            }
            return Array.isArray(product.all_images) ? product.all_images : [];
        })(),
        affiliate_link: product.amazon_short || product['Amazon SiteStripe (Short)'] || product.amazon_long || product.affiliate_link || '',
        source_link: product.source_link || product['Product Source Link'] || '',
        timestamp: product.timestamp || product.Timestamp || new Date().toISOString(),
        customer_rating: parseFloat(product.customer_rating || product.customerRating || product.Rating) || 0,
        review_count: parseInt(product.review_count || product.reviewCount || product.ReviewCount) || 0,
        brand: product.brand || 'VibeDrips',
        category: product.category || product.categoryHierarchy || product.Category || 'General',
        subcategory: product.subcategory || product.itemTypeName || '',
        
        // New fields from updated scraper
        material: product.material || '',
        dimensions: product.dimensions || '',
        weight: product.weight || '',
        color: product.color || '',
        theme: product.theme || '',
        character: product.character || '',
        minimum_age: product.minimum_age || product.minimumAge || '',
        number_of_pieces: product.number_of_pieces || product.numberOfPieces || '',
        included_components: product.included_components || product.includedComponents || '',
        additional_features: product.additional_features || product.additionalFeatures || '',
        manufacturer: product.manufacturer || '',
        country_of_origin: product.country_of_origin || product.countryOfOrigin || '',
        product_type: product.product_type || product.productType || '',
        availability: product.availability || ''
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
window.DATA_VERSION = DATA_VERSION; // Expose version for debugging
