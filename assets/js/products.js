/**
 * Set time-based filter for products
 */
function setTimeFilter(filter) {
    console.log(`Setting time filter: ${filter}`);
    VibeDrips.currentTimeFilter = filter;

    // Update active filter UI
    document.querySelectorAll('.time-category').forEach(cat => {
        cat.classList.remove('active');
        if (cat.getAttribute('data-filter') === filter) {
            cat.classList.add('active');
        }
    });

    // Filter products based on selected filter
    switch (filter) {
        case 'hot':
            VibeDrips.filteredProducts = getHotProducts();
            break;
        case 'featured':
            VibeDrips.filteredProducts = VibeDrips.allProducts.filter(product => product.featured);
            break;
        case 'new':
            VibeDrips.filteredProducts = getNewArrivals();
            break;
        case 'trending':
            VibeDrips.filteredProducts = VibeDrips.allProducts.filter(product => product.trending);
            break;
        case 'all':
            VibeDrips.filteredProducts = [...VibeDrips.allProducts];
            break;
        default:
            VibeDrips.filteredProducts = [...VibeDrips.allProducts];
    }

    updateSectionTitle(filter);
    applyCurrentFilters();
    renderProducts();
}

/**
 * Get "Hot This Month" products based on dateFirstAvailable
 */
function getHotProducts() {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    return VibeDrips.allProducts.filter(product => {
        const dateStr = product.date_first_available || product.dateFirstAvailable || product.timestamp;
        if (!dateStr) return false;

        try {
            const productDate = new Date(dateStr);
            return (productDate.getMonth() === currentMonth &&
                productDate.getFullYear() === currentYear) ||
                (productDate.getMonth() === (currentMonth - 1 + 12) % 12 &&
                    productDate.getFullYear() === currentYear);
        } catch (error) {
            console.warn('Invalid date format for product:', product.name, dateStr);
            return false;
        }
    }).sort((a, b) => {
        const dateA = new Date(a.date_first_available || a.dateFirstAvailable || a.timestamp);
        const dateB = new Date(b.date_first_available || b.dateFirstAvailable || b.timestamp);
        return dateB - dateA;
    });
}

/**
 * Get new arrivals (last 30 days based on timestamp)
 */
function getNewArrivals() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return VibeDrips.allProducts
        .filter(product => {
            const productDate = new Date(product.timestamp);
            return productDate >= thirtyDaysAgo;
        })
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

/**
 * Update section titles
 */
function updateSectionTitle(filter) {
    const titles = {
        'hot': {
            title: 'Hot This Month',
            subtitle: 'Trending products that just dropped and making waves'
        },
        'featured': {
            title: 'Featured Products',
            subtitle: 'Our hand-picked recommendations just for you'
        },
        'new': {
            title: 'New Arrivals',
            subtitle: 'Fresh drops from the last 30 days'
        },
        'trending': {
            title: 'Trending Now',
            subtitle: 'What everyone is talking about'
        },
        'all': {
            title: 'All Products',
            subtitle: 'Complete collection of curated finds'
        }
    };

    const titleInfo = titles[filter] || titles['all'];

    if (VibeDrips.elements.sectionTitle) {
        VibeDrips.elements.sectionTitle.textContent = titleInfo.title;
    }
    if (VibeDrips.elements.sectionSubtitle) {
        VibeDrips.elements.sectionSubtitle.textContent = titleInfo.subtitle;
    }
}

/**
 * Apply current search and category filters
 */
function applyCurrentFilters() {
    const searchInput = VibeDrips.elements.search;
    const categoryFilter = VibeDrips.elements.categoryFilter;

    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const categoryValue = categoryFilter ? categoryFilter.value.trim() : '';

    if (searchTerm || categoryValue) {
        VibeDrips.filteredProducts = VibeDrips.filteredProducts.filter(product => {
            const searchFields = [
                product.name,
                product.description,
                product.category,
                product.subcategory,
                product.brand
            ].filter(field => field && field.toString().trim());

            const matchesSearch = !searchTerm || searchFields.some(field =>
                field.toString().toLowerCase().includes(searchTerm)
            );

            const matchesCategory = !categoryValue ||
                product.category === categoryValue ||
                product.subcategory === categoryValue;

            return matchesSearch && matchesCategory;
        });
    }
}

/**
 * Filter products based on search and category
 */
function filterProducts() {
    setTimeFilter(VibeDrips.currentTimeFilter);
}

/**
 * Sort products based on selected criteria
 */
function sortProducts() {
    const sortSelect = VibeDrips.elements.priceSort;
    if (!sortSelect) return;

    const sortBy = sortSelect.value;

    switch (sortBy) {
        case 'price-low':
            VibeDrips.filteredProducts.sort((a, b) => a.price - b.price);
            break;
        case 'price-high':
            VibeDrips.filteredProducts.sort((a, b) => b.price - a.price);
            break;
        case 'name':
            VibeDrips.filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'rating':
            VibeDrips.filteredProducts.sort((a, b) => b.customer_rating - a.customer_rating);
            break;
        case 'date-new':
            VibeDrips.filteredProducts.sort((a, b) => {
                const dateA = new Date(a.date_first_available || a.timestamp);
                const dateB = new Date(b.date_first_available || b.timestamp);
                return dateB - dateA;
            });
            break;
        default:
            VibeDrips.filteredProducts.sort((a, b) => {
                if (a.featured && !b.featured) return -1;
                if (!a.featured && b.featured) return 1;

                const dateA = new Date(a.date_first_available || a.timestamp);
                const dateB = new Date(b.date_first_available || b.timestamp);
                return dateB - dateA;
            });
    }

    renderProducts();
}

/**
 * Render all filtered products
 */
function renderProducts() {
    const container = VibeDrips.elements.productsContainer;
    if (!container) return;

    if (VibeDrips.filteredProducts.length === 0) {
        container.innerHTML = `
            <div class="no-products">
                <div class="no-products-icon">🔍</div>
                <h3>No products found</h3>
                <p>Try adjusting your search or filters to see more products.</p>
                <button onclick="setTimeFilter('all')" class="retry-button">
                    Show All Products
                </button>
            </div>`;
        updateStats();
        return;
    }

    // Clear container and add cards directly (no wrapper needed)
    container.innerHTML = '';

    VibeDrips.filteredProducts.forEach(product => {
        const productCard = createProductCard(product);
        container.appendChild(productCard);
    });

    updateStats();
}

// ============================================
// ✅ Currency-aware price formatting
// ============================================

const CURRENCY_FORMAT_RULES = {
    'INR': {
        units: [
            { value: 10000000, suffix: 'Cr' },
            { value: 100000, suffix: 'L' },
            { value: 1000, suffix: 'K' }
        ],
        locale: 'en-IN'
    },
    'USD': {
        units: [
            { value: 1000000000, suffix: 'B' },
            { value: 1000000, suffix: 'M' },
            { value: 1000, suffix: 'K' }
        ],
        locale: 'en-US'
    },
    'EUR': {
        units: [
            { value: 1000000000, suffix: 'Mrd' },
            { value: 1000000, suffix: 'Mio' },
            { value: 1000, suffix: 'K' }
        ],
        locale: 'de-DE'
    },
    'GBP': {
        units: [
            { value: 1000000000, suffix: 'B' },
            { value: 1000000, suffix: 'M' },
            { value: 1000, suffix: 'K' }
        ],
        locale: 'en-GB'
    },
    'JPY': {
        units: [
            { value: 100000000, suffix: '億' },
            { value: 10000, suffix: '万' },
            { value: 1000, suffix: 'K' }
        ],
        locale: 'ja-JP'
    },
    'DEFAULT': {
        units: [
            { value: 1000000, suffix: 'M' },
            { value: 1000, suffix: 'K' }
        ],
        locale: 'en-US'
    }
};

const formatPrice = (amount, currencyCode = 'INR', symbol = '₹', compact = true) => {
    if (!amount || amount === 0) return `${symbol}0`;
    const num = parseFloat(amount);
    if (isNaN(num)) return `${symbol}0`;

    const rules = CURRENCY_FORMAT_RULES[currencyCode] || CURRENCY_FORMAT_RULES['DEFAULT'];

    if (compact) {
        // No decimals in compact mode
        if (num < 1000) return `${symbol}${Math.round(num)}`;
        for (const unit of rules.units) {
            if (num >= unit.value) {
                const formatted = (num / unit.value).toFixed(1).replace(/\.0$/, '');
                return `${symbol}${formatted}${unit.suffix}`;
            }
        }
        return `${symbol}${Math.round(num)}`;
    } else {
        return `${symbol}${num.toLocaleString(rules.locale, { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`;
    }
};

// ✅ NEW: Truncate text with word boundary (for brand/category)
const truncateTextAtWord = (text, maxChars = 18) => {
    if (!text || text.length <= maxChars) return text;
    const truncated = text.substring(0, maxChars);
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > 0) {
        return truncated.substring(0, lastSpace) + '...';
    }
    return truncated + '...';
};

/**
 * Create a product card element - UPDATED WITH DISCOUNT BADGE
 */
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';

    // Extract all fields from product data
    const imageUrl = product.main_image || '';
    const allImages = [...(product.all_images || [])].filter(Boolean);
    const imageCount = allImages.length;
    const amazonLink = product.amazon_short || product.amazon_long || product.source_link || '#';
    const productName = product.name || product.productTitle || 'Product Name';
    const productId = product.asin || product.id || '';

    // ✅ UPDATED: Truncate category and brand to 18 chars at word boundary
    const category = truncateTextAtWord(product.category || 'General', 18);
    const brand = truncateTextAtWord(product.brand || 'VibeDrips', 18);

    const rating = parseFloat(product.customer_rating) || 0;
    const reviewCount = parseInt(product.review_count) || 0;

    // ✅ Format review count helper
    const formatCount = (n) => {
        if (!n || n < 1000) return String(n || 0);
        if (n < 10000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
        return Math.round(n / 1000) + 'k';
    };

    // ✅ Use formatPrice with currency awareness (compact, no decimals)
    const price = product.display_price || product.price || 0;
    const currencyCode = product.currency || 'INR';
    const symbol = product.symbol || '₹';
    const priceFormatted = formatPrice(price, currencyCode, symbol, true); // Compact format

    // Discount badge logic
    const showDiscount = product.show_discount || false;
    const discountPercent = product.computed_discount || 0;
    const discountBadge = showDiscount && discountPercent > 0
        ? `<span class="discount-badge"><span class="live-dot" aria-hidden="true"></span>${discountPercent}%</span>`
        : '';

    // SVG fallback
    const svgFallback = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill='%23333' width='200' height='200'/%3E%3Ctext fill='%23fff' font-size='14' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3E${encodeURIComponent(productName?.substring(0, 20) || 'No Image')}%3C/text%3E%3C/svg%3E`;

    card.innerHTML = `
        <div class="product-image-wrapper">
            <img src="${imageUrl || svgFallback}" 
                 alt="${productName}"
                 loading="lazy"
                 onerror="this.src='${svgFallback}'">

            ${imageCount > 1 ? `<div class="image-count">${imageCount} photos</div>` : ''}
            ${brand ? `<div class="brand-tag">🏷️ ${brand}</div>` : ''}
        </div>

        <div class="product-category">${category}</div>
        <h3 class="product-name">${productName}</h3>

        <div class="product-price-row">
            <div class="price-container">
                <span class="product-price">${priceFormatted}</span>
                ${discountBadge}
            </div>
            ${rating > 0 ? `<span class="rating">⭐ ${rating.toFixed(1)}${reviewCount > 0 ? ` (${formatCount(reviewCount)})` : ''}</span>` : ''}
        </div>

        <button class="amazon-button" onclick="event.stopPropagation(); openAmazonLink('${amazonLink}', '${productId}')">
            🛒 Buy on Amazon
        </button>
    `;

    // Make entire card clickable to open modal
    card.onclick = () => showProductModal(productId);
    card.style.cursor = 'pointer';

    return card;
}

/**
 * Open Amazon/affiliate link
 */
function openAmazonLink(link, productId) {
    if (link && link !== '#' && link !== '') {
        console.log('Amazon redirect:', productId, link);
        window.open(link, '_blank', 'noopener,noreferrer');
    } else {
        console.warn('No Amazon link available for product:', productId);
    }
}

// ============================================
// PHASE_1: Modal Navigation Helper Functions
// ============================================

/**
 * PHASE_1: Generate modal HTML for a single product
 * Extracted from showProductModal - NO LOGIC CHANGES
 * This is an exact copy of the HTML generation code (lines 426-700 from original)
 */
function generateModalHTML(product) {
    // Helper: Format price with conditional decimals
    const formatPriceFull = (amount, currencyCode, symbol) => {
        const hasDecimals = amount % 1 !== 0;
        if (hasDecimals) {
            return `${symbol}${amount.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })}`;
        } else {
            return `${symbol}${amount.toLocaleString('en-US')}`;
        }
    };

    // Helper: Format review count with commas
    const formatCountFull = (n) => {
        return n ? n.toLocaleString('en-US') : '0';
    };

    // Prepare data (TRIM all values)
    const productId = product.id;
    const currencyCode = product.currency || 'INR';
    const symbol = product.symbol || '₹';
    const priceFormatted = formatPriceFull(product.price || 0, currencyCode, symbol);
    const rating = parseFloat(product.customer_rating) || 0;
    const reviewCount = parseInt(product.review_count) || 0;
    const showDiscount = product.show_discount || false;
    const discountPercent = product.computed_discount || 0;

    // Prepare images for gallery
    const images = product.all_images || [];

    // Title truncation
    const isMobile = window.innerWidth <= 768;
    const maxTitleLength = isMobile ? 35 : 80;
    const productTitle = (product.name || 'Product').trim();
    const isTitleLong = productTitle.length > maxTitleLength;
    const displayTitle = isTitleLong
        ? productTitle.substring(0, maxTitleLength).trim() + '...'
        : productTitle;

    // Description truncation
    const maxDescLength = 200;
    const description = (product.description || '').trim();
    const isDescLong = description.length > maxDescLength;
    const displayDesc = isDescLong
        ? description.substring(0, 200).trim() + '...'
        : description;

    // Build modal HTML - EXACT COPY from original showProductModal
    return `
        <div class="simple-modal dynamic-modal">
            <div class="modal-overlay" onclick="closeDynamicModal(event)"></div>
            <div class="simple-modal-content">
                <div class="simple-modal-header">
                    <h2 id="modal-title-${productId}" 
                        class="${isTitleLong ? 'expandable' : ''}" 
                        ${isTitleLong ? `onclick="toggleTitle_${productId}()"` : ''}>
                        ${escapeHtml(displayTitle)}
                    </h2>
                    <button class="modal-close-button" onclick="closeDynamicModal(event)">❌</button>
                </div>
                <div class="simple-modal-body">
                    
                    <!-- Brand Section (SEPARATE) -->
                    <div class="modal-brand-section">
                        <div class="info-row">
                            <span class="label">Brand 🏷️</span>
                            <span class="value">${escapeHtml((product.brand || 'Unknown').trim())}</span>
                        </div>
                    </div>
                    
                    <!-- Image Gallery Section (BEFORE Category) -->
                    ${images.length > 0 ? `
                    <div class="modal-image-gallery">
                        <!-- Desktop: Split View -->
                        <div class="gallery-desktop">
                            <div class="gallery-thumbnails">
                                ${images.map((img, idx) => `
                                <div class="thumbnail ${idx === 0 ? 'active' : ''}" 
                                     onmouseover="previewImage_${productId}(${idx})"
                                     onclick="selectImage_${productId}(${idx})"
                                     ondblclick="openImageGallery_${productId}(${idx})">
                                    <img src="${img}" alt="Thumb ${idx + 1}">
                                </div>
                                `).join('')}
                            </div>
                            <div class="gallery-main">
                                <img src="${images[0]}" 
                                     alt="${escapeHtml(product.name)}" 
                                     style="max-width: 100%; max-height: 400px; border-radius: 12px; cursor: pointer;"
                                     ondblclick="openImageGallery_${productId}()" id="main-image-${productId}">
                                <div class="zoom-hint">🔍 Double-click to view full screen</div>
                                <div class="carousel-controls">
                                    <button class="arrow-button lightbox-arrow lightbox-prev" onclick="prevImage_${productId}()" aria-label="Previous">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <polyline points="15 18 9 12 15 6"></polyline>
                                        </svg>
                                    </button>
                                    <span class="counter" id="counter-${productId}">1 / ${images.length}</span>
                                    <button class="arrow-button lightbox-arrow lightbox-next" onclick="nextImage_${productId}()" aria-label="Next">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <polyline points="9 18 15 12 9 6"></polyline>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Mobile: Main + Slider -->
                        <div class="gallery-mobile">
                            <div class="mobile-main">
                                <img id="main-image-mobile-${productId}" 
                                     src="${images[0]}" 
                                     onclick="openImageGallery_${productId}()">
                                <div class="zoom-hint">🔍</div>
                                <div class="carousel-controls" onclick="event.stopPropagation()">
                                    <button class="arrow-button lightbox-arrow lightbox-prev" onclick="prevImage_${productId}()" aria-label="Previous">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <polyline points="15 18 9 12 15 6"></polyline>
                                        </svg>
                                    </button>
                                    <span class="counter" id="counter-mobile-${productId}">1 / ${images.length}</span>
                                    <button class="arrow-button lightbox-arrow lightbox-next" onclick="nextImage_${productId}()" aria-label="Next">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <polyline points="9 18 15 12 9 6"></polyline>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            <div class="mobile-thumbnails">
                                ${images.map((img, idx) => `
                                <div class="thumbnail ${idx === 0 ? 'active' : ''}" onclick="selectImage_${productId}(${idx})">
                                    <img src="${img}" alt="Thumb ${idx + 1}">
                                </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                    ` : ''}
                    
                    <!-- Category Section (SEPARATE) -->
                    <div class="modal-category-section">
                        <div class="info-row">
                            <span class="label">Category 📦</span>
                            <span class="value">${escapeHtml((product.category || 'General').trim())}</span>
                        </div>
                    </div>
                    
                    <!-- Price + Rating + Reviews Section (NO Brand/Category) -->
                    <div class="modal-core-info">
                        <div class="info-row">
                            <span class="label">Price 💰</span>
                            <span class="value">
                                ${priceFormatted}
                                ${showDiscount && discountPercent > 0 ? `
                                    <span class="discount-badge">
                                        <span class="live-dot" aria-hidden="true"></span>${discountPercent}%
                                    </span>
                                ` : ''}
                            </span>
                        </div>
                        ${rating > 0 ? `
                        <div class="info-row">
                            <span class="label">Rating ⭐</span>
                            <span class="value">${rating.toFixed(1)} out of 5 stars</span>
                        </div>
                        ` : ''}
                        ${reviewCount > 0 ? `
                        <div class="info-row">
                            <span class="label">Reviews 👥</span>
                            <span class="value">${formatCountFull(reviewCount)} customer reviews</span>
                        </div>
                        ` : ''}
                    </div>
                    
                    <!-- Product Details Section (Collapsible) -->
                    ${product.productDetails && product.productDetails.length > 0 ? `
                    <div class="modal-section">
                        <div class="modal-section-header" onclick="toggleSection(this)">
                            <div class="title">
                                <span class="emoji">📋</span>
                                <span>Product Details</span>
                            </div>
                            <span class="toggle-icon">▶</span>
                        </div>
                        <div class="modal-section-content">
                            ${product.productDetails.sort((a, b) => (a.priority || 0) - (b.priority || 0)).map(item => {
        const emoji = getDetailEmoji(item.key, item.value);
        const label = escapeHtml((item.label || '').trim());
        return `
                                <div class="detail-row">
                                    <span class="label">${label} ${emoji}</span>
                                    <span class="value">${escapeHtml((item.value || '').trim())}</span>
                                </div>
                                `;
    }).join('')}
                        </div>
                    </div>
                    ` : ''}
                    
                    <!-- Additional Info Section (Collapsible, Collapsed by Default) -->
                    ${product.additionalInfo && Object.keys(product.additionalInfo).length > 0 ? `
                    <div class="modal-section">
                        <div class="modal-section-header" onclick="toggleSection(this)">
                            <div class="title">
                                <span class="emoji">ℹ️</span>
                                <span>Additional Information</span>
                            </div>
                            <span class="toggle-icon">▶</span>
                        </div>
                        <div class="modal-section-content">
                            ${Object.entries(product.additionalInfo)
                .flatMap(([groupName, items]) => {
                    if (groupName === 'Books' && product.category !== 'Book') return [];
                    return items || [];
                })
                .filter(item => {
                    if (item.key === 'Timestamp' || item.key === 'timestamp') return false;
                    if (item.key === 'Discount' || item.key === 'discount') return false;
                    if (item.key === 'Net Quantity' || item.key === 'net_quantity') return false;
                    if (item.key === 'Generic Name' || item.key === 'generic_name') return false;
                    if (item.key === 'Item Weight' || item.key === 'item_weight') return false;
                    if (item.key === 'Item Dimensions' || item.key === 'item_dimensions') return false;
                    if (item.key === 'Product Dimensions' || item.key === 'product_dimensions') return false;
                    if (item.key === 'Country of Origin' || item.key === 'country_of_origin') return false;
                    if ((item.key === 'Packer' || item.key === 'packer') && product.manufacturer && item.value === product.manufacturer) return false;
                    return true;
                })
                .map(item => `
                            <div class="info-row">
                                <span class="emoji"></span>
                                <span class="label">${escapeHtml((item.label || '').trim())}</span>
                                <span class="value">${escapeHtml((item.value || '').trim())}</span>
                            </div>
                                `).join('')}
                        </div>
                    </div>
                    ` : ''}
                    
                    <!-- Description Section -->
                    ${description ? `
                    <div class="modal-description-section">
                        <div class="modal-section-header" onclick="toggleDescription_${productId}()" style="cursor: pointer;">
                            <div class="title">
                                <span class="emoji">📝</span>
                                <span>Description</span>
                            </div>
                            <span class="toggle-icon">▼</span>
                        </div>
                        <div class="modal-section-content expanded">
                            <div class="description-text" id="desc-${productId}" onclick="toggleDescription_${productId}()" style="cursor: pointer;">${escapeHtml(displayDesc)}</div>
                            ${isDescLong ? `
                            <button class="read-more-btn" onclick="toggleDescription_${productId}()">Read More ▼</button>
                            ` : ''}
                        </div>
                    </div>
                    ` : ''}
                    
                    <!-- Buy Button -->
                    <div class="modal-actions">
                        <button onclick="openAmazonLink('${escapeHtml(product.amazon_short || product.amazon_long || product.source_link || '#')}', '${product.id}')" 
                                class="amazon-button">🛒 Buy on Amazon</button>
                    </div>
                    
                </div>
            </div>
        </div>
    `;
}

/**
 * PHASE_1: Build 5-product cache [P-2, P-1, Active, N+1, N+2]
 */
function build5ProductCache(centerIndex) {
    const cache = [];
    const totalProducts = VibeDrips.filteredProducts.length;

    for (let i = -2; i <= 2; i++) {
        const idx = (centerIndex + i + totalProducts) % totalProducts;
        cache.push(VibeDrips.filteredProducts[idx]);
    }

    return cache;
}

/**
 * PHASE_1: Setup interactive functions for a product
 * Extracted from showProductModal (lines 704-767)
 */
function setupProductInteractions(product) {
    const productId = product.id;
    const images = product.all_images || [];

    // Setup image gallery
    if (images.length > 0 && typeof MediaLightbox !== 'undefined') {
        window[`openImageGallery_${productId}`] = function () {
            const lightbox = new MediaLightbox({
                showCounter: true,
                showDots: true,
                enableSwipe: true,
                enableKeyboard: true
            });
            lightbox.open(images, 0);
        };
    }

    // Setup carousel navigation
    if (images.length > 0) {
        const carousel = CarouselUtils.createCarousel(productId, images);
        window[`selectImage_${productId}`] = (index) => carousel.selectImage(index);
        window[`previewImage_${productId}`] = (index) => carousel.previewImage(index);
        window[`prevImage_${productId}`] = () => carousel.prev();
        window[`nextImage_${productId}`] = () => carousel.next();
    }

    // Setup title toggle
    const isMobile = window.innerWidth <= 768;
    const maxTitleLength = isMobile ? 35 : 80;
    const productTitle = (product.name || 'Product').trim();
    const isTitleLong = productTitle.length > maxTitleLength;

    if (isTitleLong) {
        window[`toggleTitle_${productId}`] = function () {
            const titleEl = document.getElementById(`modal-title-${productId}`);
            const isExpanded = titleEl.classList.contains('expanded');

            if (isExpanded) {
                const isMobile = window.innerWidth <= 768;
                const maxLen = isMobile ? 35 : 80;
                titleEl.textContent = productTitle.substring(0, maxLen).trim() + '...';
                titleEl.classList.remove('expanded');
            } else {
                titleEl.textContent = productTitle;
                titleEl.classList.add('expanded');
            }
        };
    }

    // Setup description toggle
    const description = (product.description || '').trim();
    const maxDescLength = 200;
    const isDescLong = description.length > maxDescLength;

    if (isDescLong) {
        window[`toggleDescription_${productId}`] = function () {
            const descEl = document.getElementById(`desc-${productId}`);
            const btn = descEl.parentElement.querySelector('.read-more-btn');
            const header = descEl.closest('.modal-description-section').querySelector('.modal-section-header');

            if (btn.textContent.includes('More')) {
                descEl.textContent = description;
                btn.textContent = 'Read Less ▲';
                header.classList.add('expanded');
            } else {
                descEl.textContent = description.substring(0, 200).trim() + '...';
                btn.textContent = 'Read More ▼';
                header.classList.remove('expanded');
            }
        };
    }
}

/**
 * PHASE_1: Wrap existing modal with sliding navigation structure
 */
function wrapModalForSliding(centerProductId) {
    const existingModal = document.querySelector('.dynamic-modal');
    if (!existingModal) return;

    const centerIndex = VibeDrips.filteredProducts.findIndex(p => p.id === centerProductId);
    VibeDrips.modalState.currentIndex = centerIndex;

    // Build 5-product cache
    const cache = build5ProductCache(centerIndex);

    // Create navigation container
    const navContainer = document.createElement('div');
    navContainer.className = 'modal-nav-container';

    // Create sliding strip
    const slidingStrip = document.createElement('div');
    slidingStrip.className = 'modal-sliding-strip';

    // Generate HTML for all 5 products
    cache.forEach(product => {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = generateModalHTML(product);
        const modalContent = tempDiv.querySelector('.simple-modal-content');
        slidingStrip.appendChild(modalContent);
    });

    // Center the active product (index 2)
    slidingStrip.style.transform = 'translateX(-200%)';

    // Add strip to container
    navContainer.appendChild(slidingStrip);

    // CRITICAL FIX: Insert navContainer AFTER overlay to maintain z-index stacking
    // The overlay must be BEFORE the content in DOM order for z-index to work
    const overlay = existingModal.querySelector('.modal-overlay');
    const oldContent = existingModal.querySelector('.simple-modal-content');
    if (oldContent) oldContent.remove();

    // Insert AFTER overlay (overlay is z-index 999, navContainer is 1001)
    if (overlay.nextSibling) {
        existingModal.insertBefore(navContainer, overlay.nextSibling);
    } else {
        existingModal.appendChild(navContainer);
    }

    // Setup event listeners for all cached products
    cache.forEach(product => {
        setupProductInteractions(product);
    });
}

/**
 * PHASE_1: Navigate to next/prev product (basic version)
 */
function navigateModal(direction) {
    const totalProducts = VibeDrips.filteredProducts.length;
    const strip = document.querySelector('.modal-sliding-strip');

    if (!strip || VibeDrips.modalState.isSliding) return;

    VibeDrips.modalState.isSliding = true;

    // Calculate new index
    if (direction === 'next') {
        VibeDrips.modalState.currentIndex = (VibeDrips.modalState.currentIndex + 1) % totalProducts;
    } else {
        VibeDrips.modalState.currentIndex = (VibeDrips.modalState.currentIndex - 1 + totalProducts) % totalProducts;
    }

    // Calculate new transform
    const offset = direction === 'next' ? -100 : 100;
    const newTransform = -200 + offset;

    // Apply transition
    strip.style.transition = 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)';
    strip.style.transform = `translateX(${newTransform}%)`;

    // On transitionend: Teleport + Re-cache
    strip.addEventListener('transitionend', function handler() {
        strip.removeEventListener('transitionend', handler);

        // Instant teleport
        strip.style.transition = 'none';
        strip.style.transform = 'translateX(-200%)';

        // Update cache
        const cache = build5ProductCache(VibeDrips.modalState.currentIndex);

        // Re-render strip
        strip.innerHTML = '';
        cache.forEach(product => {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = generateModalHTML(product);
            const modalContent = tempDiv.querySelector('.simple-modal-content');
            strip.appendChild(modalContent);
        });

        // Setup interactions for new products
        cache.forEach(product => {
            setupProductInteractions(product);
        });

        // Re-enable transition
        requestAnimationFrame(() => {
            strip.style.transition = 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)';
            VibeDrips.modalState.isSliding = false;
        });
    }, { once: true });
}
// END_PHASE_1


/**
 * Show detailed product modal with enhanced UI
 * PHASE_1: Modified to use wrapModalForSliding
 */
function showProductModal(productId) {
    const product = VibeDrips.allProducts.find(p => p.id === productId);
    if (!product) {
        console.error('Product not found:', productId);
        return;
    }

    // CRITICAL FIX: Remove any existing modal first
    const existingModal = document.querySelector('.dynamic-modal');
    if (existingModal) {
        existingModal.remove();
    }

    // PHASE_1: Generate modal HTML using extracted function
    const modalContent = generateModalHTML(product);

    // Insert into DOM
    document.body.insertAdjacentHTML('beforeend', modalContent);

    // PHASE_1: Wrap modal for sliding navigation
    wrapModalForSliding(productId);

    // Note: setupProductInteractions is now called inside wrapModalForSliding
    // for all 5 cached products
}

// Helper: Get emoji for product detail keys
// Helper: Get dynamic Material emoji based on value
function getMaterialEmoji(materialValue) {
    if (!materialValue) return '🧵';
    const material = materialValue.toLowerCase();

    // Paper
    if (material.includes('paper') || material.includes('cardboard')) return '📄';
    // Wood
    if (material.includes('wood') || material.includes('timber') || material.includes('bamboo') || material.includes('pine')) return '🪵';
    // Metal
    if (material.includes('metal') || material.includes('steel') || material.includes('aluminum') || material.includes('iron') || material.includes('brass') || material.includes('copper')) return '🔩';
    // Plastic
    if (material.includes('plastic') || material.includes('polymer') || material.includes('pvc') || material.includes('abs') || material.includes('pet') || material.includes('synthetic')) return '🧪';
    // Fabric
    if (material.includes('fabric') || material.includes('cloth') || material.includes('silk') || material.includes('cotton') || material.includes('polyester') || material.includes('wool')) return '🧵';
    // Glass
    if (material.includes('glass') || material.includes('crystal')) return '🪟';
    // Leather
    if (material.includes('leather')) return '🎒';
    // Stone
    if (material.includes('stone') || material.includes('marble') || material.includes('granite') || material.includes('ceramic')) return '🪨';
    // Masonry
    if (material.includes('brick') || material.includes('concrete')) return '🧱';
    // Eco
    if (material.includes('recycled') || material.includes('eco') || material.includes('sustainable') || material.includes('bio')) return '♻️';

    return '🧵'; // Default
}

function getDetailEmoji(key, value) {
    const emojiMap = {
        // Priority 0 - Country
        'country_of_origin': '🌍',
        'countryOfOrigin': '🌍',
        'country': '🌍',
        'origin': '🌍',
        'made_in': '🌍',

        // Physical
        'weight': '⚖️',
        'dimensions': '📏',
        'color': '🎨',
        'material': (value) => getMaterialEmoji(value), // DYNAMIC!

        // Performance
        'wattage': '⚡',
        'voltage': '⚡',
        'noise_level': '🔊',
        'sound_level': '🔊',
        'floor_area': '📐',
        'coverage_area': '📐',
        'room_type': '🏠',

        // Features
        'special_feature': '⭐',
        'special_features': '⭐',
        'included_components': '🧩', // REVERTIBLE: Change back to '📦' if needed
        'includedComponents': '🧩', // Actual key from JSON data

        // Books
        'paperback': '📄',
        'hardcover': '📘',
        'publisher': '📚',
        'language': '🌐',
        'publication_date': '📅',
        'print_length': '📄',
        'number_of_pages': '📄'
    };

    const emoji = emojiMap[key];
    // If emoji is a function (like Material), call it with the value
    if (typeof emoji === 'function') {
        return emoji(value);
    }
    return emoji || '•';
}

// Helper: Get emoji for additional info groups
function getGroupEmoji(groupName) {
    const emojiMap = {
        'Manufacturing': '🏭',
        'Product Specs': '🔢',
        'Books': '📚',
        'Technical': '⚡',
        'Care Instructions': '🧼',
        'Other': 'ℹ️'
    };
    return emojiMap[groupName] || 'ℹ️';
}

// Helper: Toggle collapsible section
function toggleSection(header) {
    header.classList.toggle('expanded');
    const content = header.nextElementSibling;
    content.classList.toggle('expanded');

    // Update toggle icon
    const icon = header.querySelector('.toggle-icon');
    icon.textContent = header.classList.contains('expanded') ? '▼' : '▶';
}

/**
 * Close dynamic modal (specific to modals created by showProductModal)
 */
function closeDynamicModal(event) {
    event.stopPropagation();
    const modal = event.target.closest('.dynamic-modal');
    const button = event.target.closest('button');

    if (modal) {
        if (event.target.classList.contains('modal-overlay') || button) {
            // Detect touch device
            const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

            if (isTouchDevice && button && button.classList.contains('modal-close-button')) {
                // Add closing animation class
                button.classList.add('closing');

                // Delay close to show animation
                setTimeout(() => {
                    modal.remove();
                    // Clean up class (in case button is reused)
                    button.classList.remove('closing');
                }, 300); // Match animation duration
            } else {
                // Desktop or non-button close: immediate
                modal.remove();
            }
        }
    }
}

/**
 * Update statistics display
 */
function updateStats() {
    if (VibeDrips.elements.productCount) {
        VibeDrips.elements.productCount.textContent = VibeDrips.filteredProducts.length;
    }
    if (VibeDrips.elements.categoryCount) {
        VibeDrips.elements.categoryCount.textContent = VibeDrips.categories.size;
    }
}

/**
 * Utility functions
 */
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "'");
}

function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
}

// Export functions to global scope
window.setTimeFilter = setTimeFilter;
window.filterProducts = filterProducts;
window.sortProducts = sortProducts;
window.openAmazonLink = openAmazonLink;
window.showProductModal = showProductModal;
// PHASE_1: Export navigation functions
window.navigateModal = navigateModal;
window.setupProductInteractions = setupProductInteractions;
console.log('Products.js loaded successfully with currency-aware price formatting and text truncation');

