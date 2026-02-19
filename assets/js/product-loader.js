// product-loader.js - Product data loader with cache-busting
// IMPORTANT: Update DATA_VERSION every time you update products.csv
const DATA_VERSION = '20260212-auto'; // ⬅️ CHANGE THIS ON EVERY CSV UPDATE (format: YYYYMMDD-vX)

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

        // New: Load all discovery index artifacts for relational navigation BEFORE initial render
        await loadDiscoveryIndices();

        setTimeFilter(VibeDrips.currentTimeFilter);

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

    // Helper function to safely parse price (handles both string and number, removes currency symbols)
    const parsePrice = (value) => {
        if (!value) return 0;
        if (typeof value === 'number') return value;
        if (typeof value === 'string') {
            const cleaned = value.replace(/[^\d.]/g, '');
            const parsed = parseFloat(cleaned) || 0;
            // 🐛 DEBUG LOG
            if (product.asin === '9355995008' || product.asin === 'B0FM2Y25HP') {
                console.log(`🔍 parsePrice("${value}") → cleaned: "${cleaned}" → parsed: ${parsed}`);
            }
            return parsed;
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

    // Check if originalPrice field was actually provided (not just missing/empty)
    const hasOriginalPrice = product.originalPrice !== undefined &&
        product.originalPrice !== null &&
        product.originalPrice !== '' &&
        originalPrice > 0;

    if (hasOriginalPrice && currentPrice > originalPrice) {
        // INVALID: Current price higher than original (real data error)
        showDiscount = false;
        console.warn(`⚠️ Invalid pricing for ${product.asin}: price (${currentPrice}) > originalPrice (${originalPrice})`);
    } else if (!hasOriginalPrice || currentPrice === originalPrice) {
        // No discount: Original price missing or prices match
        showDiscount = false;
    } else if (discountPercent > 0 && originalPrice > currentPrice) {
        // VALID: Show discount badge
        showDiscount = true;
    }

    // 🐛 ENHANCED DEBUG - Log first 3 products
    const debugProducts = ['9355995008', 'B0FM2Y25HP', '9388550315'];
    if (debugProducts.includes(product.asin)) {
        console.log(`💰 ${product.asin}:`, {
            rawPrice: product.price,
            rawOriginal: product.originalPrice,
            rawDiscount: product.discountPercentage,
            parsedPrice: currentPrice,
            parsedOriginal: originalPrice,
            computedDiscount: discountPercent,
            hasOriginalPrice,
            showDiscount
        });
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
        source_link: product.source_link || product.productSourceLink || product['Product Source Link'] || '',
        reference_media: (() => {
            const raw = product.reference_media || product.referenceMedia || product['Reference Media for similar products'] || product.reference_links || [];
            if (Array.isArray(raw)) return raw;
            if (typeof raw === 'string' && raw.trim()) {
                const sep = raw.includes('|') ? '|' : (raw.includes(';') ? ';' : ',');
                return raw.split(sep).map(url => url.trim()).filter(Boolean);
            }
            return [];
        })(),

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

/**
 * Load all discovery index artifacts in parallel
 */
async function loadDiscoveryIndices() {
    console.log('📂 Loading discovery index artifacts...');
    const v = window.DATA_VERSION || DATA_VERSION;
    const baseUrl = VibeDrips.config.dataUrl;

    const files = [
        { key: 'influencers', name: 'influencers.json' },
        { key: 'seasons', name: 'seasons.json' },
        { key: 'collections', name: 'collections.json' },
        { key: 'recentDrops', name: 'recent-drops.json' }
    ];

    try {
        const results = await Promise.all(
            files.map(async file => {
                const response = await fetch(`${baseUrl}/${file.name}?v=${v}`);
                if (!response.ok) throw new Error(`Failed to load ${file.name}`);
                return { key: file.key, data: await response.json() };
            })
        );

        results.forEach(res => {
            if (!res || !res.data) return;

            if (res.key === 'collections') {
                VibeDrips.collections = res.data.collections || {};
            } else if (res.key === 'recentDrops') {
                VibeDrips.recentDrops = res.data.recent_drops || [];
                // Attach expiry_time to master products for countdowns
                VibeDrips.recentDrops.forEach(drop => {
                    if (!drop || !drop.asin) return;
                    const product = (VibeDrips.allProducts || []).find(p => p.asin === drop.asin);
                    if (product) product.expiry_time = drop.expiry_time;
                });
            } else {
                VibeDrips[res.key] = res.data[res.key] || [];
            }
        });

        console.log('✅ Discovery indices loaded successfully');
    } catch (error) {
        console.warn('⚠️ Some discovery indices failed to load, falling back to basic nav:', error);
    }
}

// Extract categories from products
function extractCategories() {
    VibeDrips.categories.clear();
    VibeDrips.allProducts.forEach(product => {
        if (product.category && product.category.trim()) {
            VibeDrips.categories.add(product.category.trim());
        }
    });
    console.log(`📂 Found ${VibeDrips.categories.size} categories`);
}

// Populate category filter dropdown
function populateCategoryFilter() {
    const subMenu = document.getElementById('categories-sub-menu');
    if (!subMenu) return;

    subMenu.innerHTML = '';

    Array.from(VibeDrips.categories).sort().forEach(category => {
        const item = document.createElement('div');
        item.className = 'dropdown-item';
        item.onclick = () => setTimeFilter(category);
        item.textContent = category;
        subMenu.appendChild(item);
    });
}

/**
 * PHASE_6: Automated High-Fidelity Sequence
 * Step 7: Wait for data load, then trigger click on Reels category
 */
function handleWarpLanding() {
    const targetAsin = localStorage.getItem('vibedrips-warp-target');
    if (targetAsin && window.openReelsModal) {
        console.log(`🎯 Warp Landing Detected: ${targetAsin}`);

        // 🏙️ Phase 12: Smart Cinematic Interaction Traversal
        // 1. Smooth Scroll to top so elements are in view
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // 2. Settlement Delay + Dynamic Tab Pathfinding
        setTimeout(async () => {
            const tabs = Array.from(document.querySelectorAll('.time-category'));
            const targetTab = tabs.find(t => t.getAttribute('data-filter') === 'reels');
            const activeTab = tabs.find(t => t.classList.contains('active'));

            if (targetTab && tabs.length > 0) {
                const targetIndex = tabs.indexOf(targetTab);
                const startIndex = activeTab ? tabs.indexOf(activeTab) : tabs.length - 1;

                console.log(`🛤️ Traversing category tabs from index ${startIndex} to ${targetIndex}`);

                // Sequential Hover Flow
                const step = startIndex <= targetIndex ? 1 : -1;
                for (let i = startIndex; i !== targetIndex + step; i += step) {
                    const currentTab = tabs[i];
                    currentTab.classList.add('system-hover');

                    // Delay for visibility of each tab hover
                    await new Promise(r => setTimeout(r, 300));

                    if (i !== targetIndex) {
                        currentTab.classList.remove('system-hover');
                    }
                }

                // Final Selection Pause
                setTimeout(() => {
                    targetTab.classList.remove('system-hover');
                    window.openReelsModal();
                }, 800);
            } else if (window.openReelsModal) {
                window.openReelsModal();
            }
        }, 1200); // Initial settlement delay
    }
}


// Export to global scope
window.loadProducts = loadProducts;
window.processProductData = processProductData;
window.generateId = generateId;
window.extractCategories = extractCategories;
window.populateCategoryFilter = populateCategoryFilter;
window.handleWarpLanding = handleWarpLanding;
window.loadDiscoveryIndices = loadDiscoveryIndices;
window.DATA_VERSION = DATA_VERSION; // Expose version for debugging
