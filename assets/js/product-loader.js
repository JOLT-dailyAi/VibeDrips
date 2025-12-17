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
  return {
    ...product,
    id: product.asin || product.id || generateId(),
    name: product.name || product.productTitle || 'Untitled Product',
    description: product.description || product.Description || 'No description available',
    price: parseFloat(product.price) || 0,
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
    original_price: product.original_price || product.originalPrice || '',
    discount_percentage: product.discount_percentage || product.discountPercentage || '',
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
