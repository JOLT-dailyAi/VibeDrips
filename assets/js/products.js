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

    // Make entire card clickable to open modal - PHASE_7: Pass 'this' for context detection
    card.onclick = function () { showProductModal(productId, this); };
    card.style.cursor = 'pointer';

    // ✅ PHASE_7: Add ID for DOM-based context extraction
    card.setAttribute('data-product-id', productId);

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
                            ${(() => {
                const flattened = Object.entries(product.additionalInfo)
                    .flatMap(([groupName, items]) => {
                        if (groupName === 'Books' && product.category !== 'Book') return [];
                        return items || [];
                    })
                    .filter(item => {
                        const key = (item.key || '').toLowerCase();
                        const val = (item.value || '').trim();
                        if (!val) return false;
                        if (['timestamp', 'discount', 'net quantity', 'generic name', 'item weight', 'item dimensions', 'product dimensions', 'country of origin'].includes(key)) return false;
                        return true;
                    });

                // Group by normalized value to catch duplicates
                const groups = [];
                flattened.forEach(item => {
                    const val = (item.value || '').trim();
                    const label = (item.label || '').trim();
                    const existingGroup = groups.find(g => g.value === val);
                    if (existingGroup) {
                        if (!existingGroup.labels.includes(label)) {
                            existingGroup.labels.push(label);
                        }
                    } else {
                        groups.push({ value: val, labels: [label] });
                    }
                });

                return groups.map(group => `
                                    <div class="info-row">
                                        <span class="emoji"></span>
                                        <span class="label">${escapeHtml(group.labels.join(' / '))}</span>
                                        <span class="value">${escapeHtml(group.value)}</span>
                                    </div>
                                `).join('');
            })()}
                        </div>
                    </div>
                    ` : ''}
                    
                    <!-- Description Section -->
                    ${description ? `
                    <div class="modal-description-section">
                        <div class="modal-section-header" onclick="toggleDescription_${productId}()" style="cursor: pointer;">
                            <div class="title">
                                <span class="emoji">📝</span>
                                <span>Description & Reviews</span>
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
 * PHASE_7: Uses currentProductList for context-awareness
 */
function build5ProductCache(centerIndex) {
    const cache = [];
    const productList = VibeDrips.modalState.currentProductList;
    const totalProducts = productList.length;

    if (totalProducts === 0) return [];

    for (let i = -2; i <= 2; i++) {
        const idx = (centerIndex + i + totalProducts) % totalProducts;
        cache.push(productList[idx]);
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

        // PHASE_3: Add Swipe/Drag support to the internal gallery containers
        // We use a small timeout to ensure DOM is ready after modal insertion
        setTimeout(() => {
            const desktopGallery = document.querySelector(`#main-image-${productId}`)?.parentElement;
            const mobileGallery = document.querySelector(`#main-image-mobile-${productId}`)?.parentElement;

            const callbacks = {
                onNext: () => carousel.next(),
                onPrev: () => carousel.prev()
            };

            if (desktopGallery) CarouselUtils.addSwipeHandle(desktopGallery, callbacks);
            if (mobileGallery) CarouselUtils.addSwipeHandle(mobileGallery, callbacks);
        }, 100);
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

    const productList = VibeDrips.modalState.currentProductList;
    const centerIndex = productList.findIndex(p => p.id === centerProductId);
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

    // Center the active product (index 2 in 5-product cache)
    // Child 0: 0%, Child 1: -20%, Child 2: -40%, Child 3: -60%, Child 4: -80%
    slidingStrip.style.transform = 'translate3d(-40%, 0, 0)';

    // Add strip to container
    navContainer.appendChild(slidingStrip);

    // ✅ PHASE_9: Relocated Hybrid Indicator (Dots or Counter)
    // Create indicator container at the modal level, not inside navContainer
    let indicatorContainer = existingModal.querySelector('.modal-nav-indicator');
    if (!indicatorContainer) {
        indicatorContainer = document.createElement('div');
        indicatorContainer.className = 'modal-nav-indicator glass-pill';
        existingModal.appendChild(indicatorContainer);
    }

    // Determine type and update (Dots if <= 10, Counter if > 10)
    const totalItems = productList.length;
    if (totalItems <= 10 && window.CarouselUtils) {
        window.CarouselUtils.enableDots(indicatorContainer, totalItems, centerIndex);
    } else if (window.CarouselUtils) {
        window.CarouselUtils.updateCounter(indicatorContainer, centerIndex, totalItems);
    }

    // Add click listeners to dots if they exist
    indicatorContainer.addEventListener('click', (e) => {
        const dot = e.target.closest('.dot');
        if (dot) {
            const targetIndex = parseInt(dot.getAttribute('data-index'));
            // Navigation logic for direct dot jump could be added here
        }
    });

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

    // PHASE_2: Add boundary glow overlays
    const glowHTML = `
        <div class="boundary-glow-overlay left"></div>
        <div class="boundary-glow-overlay right"></div>
    `;
    // Add to existingModal alongside glass zones
    existingModal.insertAdjacentHTML('beforeend', glowHTML);

    // PHASE_1: Add glass zones HTML - FIXED: Add to MODAL (not navContainer) so they're outside scrollable content
    const glassZonesHTML = `
        <button class="arrow-button glass-zone left" aria-label="Previous product">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            <span class="prohibited-icon" aria-hidden="true">⛔</span>
        </button>
        <button class="arrow-button glass-zone right" aria-label="Next product">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
            <span class="prohibited-icon" aria-hidden="true">⛔</span>
        </button>
    `;
    // Add to MODAL, not navContainer
    existingModal.insertAdjacentHTML('beforeend', glassZonesHTML);

    // Setup event listeners for all cached products
    cache.forEach(product => {
        setupProductInteractions(product);
    });

    // PHASE_1: Setup glass zones and update states
    setupGlassZones();
    updateGlassZoneStates();

    // PHASE_2: Setup unified global drag and isolation
    setupUnifiedModalDrag();
    setupEventIsolation();
}

/**
 * PHASE_1: Navigate to next/prev product (basic version)
 */
function navigateModal(direction) {
    const productList = VibeDrips.modalState.currentProductList;
    const totalProducts = productList.length;
    const strip = document.querySelector('.modal-sliding-strip');

    if (!strip || VibeDrips.modalState.isSliding) return;

    VibeDrips.modalState.isSliding = true;

    // Calculate new index
    // Calculate new index with boundary clamping (no cycling)
    if (direction === 'next') {
        if (VibeDrips.modalState.currentIndex >= totalProducts - 1) {
            VibeDrips.modalState.isSliding = false;
            return;
        }
        VibeDrips.modalState.currentIndex++;
    } else {
        if (VibeDrips.modalState.currentIndex <= 0) {
            VibeDrips.modalState.isSliding = false;
            return;
        }
        VibeDrips.modalState.currentIndex--;
    }

    // ✅ PHASE_9: Simultaneous Trigger (Timing Sync)
    // Update indicators at the START of navigation so they move with the slide
    updateGlassZoneStates();

    // Explicit math for 500% width strip (each product is 20%)
    // Center is -40% (2 products left of active)
    const currentTransform = -40;
    const offset = direction === 'next' ? -20 : 20;
    const newTransform = currentTransform + offset;

    // Apply transition - FIXED: translate3d for maximal GPU stability
    strip.classList.remove('no-transition');
    strip.style.transition = 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)';
    strip.style.transform = `translate3d(${newTransform}%, 0, 0)`;

    // On transitionend: Atomic Teleport + Re-cache
    strip.addEventListener('transitionend', function handler(e) {
        // STRICT CHECK: Only respond to transform transition on the strip itself
        if (e.target !== strip || e.propertyName !== 'transform') return;

        strip.removeEventListener('transitionend', handler);

        // ATOMIC TELEPORT SEQUENCE START
        // 1. Kill transition instantly
        strip.style.transition = 'none';
        strip.classList.add('no-transition');

        // 2. Set teleport target (back to center)
        strip.style.transform = 'translate3d(-40%, 0, 0)';

        // 3. Update DOM content while transition is dead
        const cache = build5ProductCache(VibeDrips.modalState.currentIndex);
        strip.innerHTML = '';
        cache.forEach(product => {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = generateModalHTML(product);
            const modalContent = tempDiv.querySelector('.simple-modal-content');
            modalContent.scrollTop = 0; // Reset scroll position
            strip.appendChild(modalContent);
        });

        // 4. Update interactions
        cache.forEach(product => {
            setupProductInteractions(product);
        });

        // 5. CRITICAL: Force Reflow to ensure browser acknowledges position before re-enabling transition
        void strip.offsetWidth;

        // 6. Re-enable transition for NEXT navigation with double RAF safety
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                strip.classList.remove('no-transition');
                strip.style.transition = 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)';
                VibeDrips.modalState.isSliding = false;
                // updateGlassZoneStates() moved to start for Timing Sync
            });
        });
    });
}
// END_PHASE_1

// ============================================
// PHASE_1: Keyboard Navigation & Glass Zones
// ============================================

/**
 * PHASE_1: Setup keyboard navigation for modal
 */
function setupModalKeyboardNav() {
    document.addEventListener('keydown', (e) => {
        // Only if modal is open
        if (!document.querySelector('.dynamic-modal')) return;

        const productList = VibeDrips.modalState.currentProductList;
        const currentIndex = VibeDrips.modalState.currentIndex;
        const totalProducts = productList.length;

        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            if (currentIndex === 0) {
                const leftZone = document.querySelector('.glass-zone.left');
                if (leftZone) {
                    leftZone.classList.add('pulse');
                    setTimeout(() => leftZone.classList.remove('pulse'), 1000);
                }
                return;
            }
            navigateModal('prev');
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            if (currentIndex === totalProducts - 1) {
                const rightZone = document.querySelector('.glass-zone.right');
                if (rightZone) {
                    rightZone.classList.add('pulse');
                    setTimeout(() => rightZone.classList.remove('pulse'), 1000);
                }
                return;
            }
            navigateModal('next');
        } else if (e.key === 'Escape') {
            const modal = document.querySelector('.dynamic-modal');
            if (modal) {
                const overlay = modal.querySelector('.modal-overlay');
                if (overlay) closeDynamicModal({ target: overlay, stopPropagation: () => { } });
            }
        }
    });
}

/**
 * PHASE_1: Update glass zone states based on current position
 */
function updateGlassZoneStates() {
    const leftZone = document.querySelector('.glass-zone.left');
    const rightZone = document.querySelector('.glass-zone.right');

    if (!leftZone || !rightZone) return;

    const productList = VibeDrips.modalState.currentProductList;
    const currentIndex = VibeDrips.modalState.currentIndex;
    const totalProducts = productList.length;

    // ✅ PHASE_9: Update Hybrid Indicator
    const indicator = document.querySelector('.dynamic-modal .modal-nav-indicator');
    if (indicator && window.CarouselUtils) {
        if (totalProducts <= 10) {
            window.CarouselUtils.enableDots(indicator, totalProducts, currentIndex);
        } else {
            window.CarouselUtils.updateCounter(indicator, currentIndex, totalProducts);
        }
    }

    // Left zone disabled at first product
    if (currentIndex === 0) {
        leftZone.classList.add('disabled');
        leftZone.setAttribute('aria-disabled', 'true');
    } else {
        leftZone.classList.remove('disabled', 'pulse');
        leftZone.setAttribute('aria-disabled', 'false');
    }

    // Right zone disabled at last product
    if (currentIndex === totalProducts - 1) {
        rightZone.classList.add('disabled');
        rightZone.setAttribute('aria-disabled', 'true');
    } else {
        rightZone.classList.remove('disabled', 'pulse');
        rightZone.setAttribute('aria-disabled', 'false');
    }
}

function setupGlassZones() {
    const leftZone = document.querySelector('.glass-zone.left');
    const rightZone = document.querySelector('.glass-zone.right');

    if (!leftZone || !rightZone) return;

    // Left zone navigation
    leftZone.addEventListener('click', (e) => {
        e.stopPropagation();
        if (leftZone.classList.contains('disabled')) {
            // Trigger pulse animation on boundary click
            leftZone.classList.add('pulse');
            setTimeout(() => leftZone.classList.remove('pulse'), 1000);
            return;
        }
        navigateModal('prev');
    });

    // Right zone navigation
    rightZone.addEventListener('click', (e) => {
        e.stopPropagation();
        if (rightZone.classList.contains('disabled')) {
            // Trigger pulse animation on boundary click
            rightZone.classList.add('pulse');
            setTimeout(() => rightZone.classList.remove('pulse'), 1000);
            return;
        }
        navigateModal('next');
    });
}

/**
 * PHASE_2: Setup Event Isolation
 * Protect internal gallery/buttons from triggering the main modal swipe
 */
function setupEventIsolation() {
    const protectedSelectors = [
        '.modal-image-gallery',
        '.carousel-controls',
        '.thumbnail',
        '.amazon-button',
        '.read-more-btn',
        '.modal-close-button',
        '.modal-section-content' // Allow vertical scroll inside sections without horizontal snap
    ];

    protectedSelectors.forEach(selector => {
        const elements = document.querySelectorAll(`.dynamic-modal ${selector}`);
        elements.forEach(el => {
            // Mousedown/Touchstart isolation
            el.addEventListener('mousedown', (e) => e.stopPropagation());
            el.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });
        });
    });
}

/**
 * PHASE_2: Setup Unified Modal Drag
 * Drag content ANYWHERE to trigger navigation/elasticity
 */
function setupUnifiedModalDrag() {
    const container = document.querySelector('.modal-nav-container');
    const modalBase = document.querySelector('.dynamic-modal');
    const leftZone = document.querySelector('.glass-zone.left');
    const rightZone = document.querySelector('.glass-zone.right');

    if (!container || !modalBase) return;

    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let currentX = 0;
    let currentY = 0;
    let activeZone = null;
    let activeGlow = null;

    const handleStart = (e) => {
        if (VibeDrips.modalState.isSliding) return;

        // Don't drag if we're clicking a collapsible header or the close button
        if (e.target.closest('.modal-section-header') || e.target.closest('.modal-close-button')) return;

        isDragging = true;
        modalBase.classList.add('dragging');

        const touch = e.type.startsWith('mouse') ? e : e.touches[0];
        startX = touch.clientX;
        startY = touch.clientY;
        currentX = startX;
        currentY = startY;

        // Reset transitions
        if (leftZone) leftZone.style.transition = 'none';
        if (rightZone) rightZone.style.transition = 'none';

        // Add document listeners only while dragging to prevent leaks and conflicts
        document.addEventListener('mousemove', handleMove);
        document.addEventListener('touchmove', handleMove, { passive: false });
        document.addEventListener('mouseup', handleEnd);
        document.addEventListener('touchend', handleEnd);
        document.addEventListener('touchcancel', handleEnd);
    };

    const handleMove = (e) => {
        if (!isDragging) return;

        const touch = e.type.startsWith('mouse') ? e : e.touches[0];
        currentX = touch.clientX;
        currentY = touch.clientY;

        const deltaX = currentX - startX;
        const deltaY = currentY - startY;
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);

        // VERTICAL INTENT DETECTION
        // If the user swiped more than 10px vertically and it's clearly more vertical than horizontal,
        // cancel the horizontal drag to allow native vertical scrolling.
        if (absY > absX && absY > 10) {
            handleEnd();
            return;
        }

        // Only prevent default if we've actually moved enough horizontally to be sure it's a drag
        // This stops the initial slight touch from blocking vertical scroll start
        if (absX > 10) {
            if (e.cancelable) e.preventDefault();
        } else {
            // Not enough movement yet to commit
            return;
        }

        const rawPull = Math.abs(deltaX);

        // Determine which lever we are "pulling"
        // Swipe Right (deltaX > 0) -> Pulling LEFT Lever
        // Swipe Left (deltaX < 0) -> Pulling RIGHT Lever
        const side = deltaX > 0 ? 'left' : 'right';

        // Switch active zone if direction changes mid-drag
        const zone = (side === 'left') ? leftZone : rightZone;
        if (zone !== activeZone) {
            // Reset previous if we crossed the center line
            if (activeZone) {
                activeZone.style.setProperty('--lever-x', '0px');
                activeZone.classList.remove('pulse'); // Safety
            }
            if (activeGlow) {
                activeGlow.classList.remove('active');
                activeGlow.style.width = '0px';
            }

            activeZone = zone;
            activeGlow = document.querySelector(`.boundary-glow-overlay.${side}`);
            if (activeGlow) {
                activeGlow.classList.add('active');
                activeGlow.style.transition = 'none';
            }
        }

        // Apply 0.4x Dampening
        const pull = deltaX * 0.4;
        if (activeZone) {
            activeZone.style.setProperty('--lever-x', `${pull}px`);
        }

        // Color Logic and Width
        const productList = VibeDrips.modalState.currentProductList;
        const totalProducts = productList.length;
        const isBoundary = (side === 'left' && VibeDrips.modalState.currentIndex === 0) ||
            (side === 'right' && VibeDrips.modalState.currentIndex === totalProducts - 1);

        const glowColor = isBoundary ? "255, 50, 50" : "90, 75, 255";
        const intensity = Math.min(rawPull / 150, 1);
        const glowWidth = 30 + Math.abs(pull);

        if (activeGlow) {
            activeGlow.style.setProperty('--glow-rgb', glowColor);
            activeGlow.style.setProperty('--glow-intensity', intensity);
            activeGlow.style.width = `${glowWidth}px`;
        }
    };

    const handleEnd = () => {
        if (!isDragging) return;
        isDragging = false;
        modalBase.classList.remove('dragging');

        // Clean up document listeners
        document.removeEventListener('mousemove', handleMove);
        document.removeEventListener('touchmove', handleMove);
        document.removeEventListener('mouseup', handleEnd);
        document.removeEventListener('touchend', handleEnd);
        document.removeEventListener('touchcancel', handleEnd);

        const deltaX = currentX - startX;
        const absoluteDelta = Math.abs(deltaX);
        const side = deltaX > 0 ? 'left' : 'right';

        // Reference captured zone for async cleanup
        const zoneToClean = activeZone;
        const glowToClean = activeGlow;

        // Snap-back Lever
        if (zoneToClean) {
            zoneToClean.style.transition = 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)';
            zoneToClean.style.setProperty('--lever-x', '0px');

            // Wobble
            const dirMultiplier = side === 'left' ? 1 : -1;
            setTimeout(() => {
                if (zoneToClean) {
                    zoneToClean.style.setProperty('--wobble-dir', `${-8 * dirMultiplier}px`);
                    zoneToClean.style.setProperty('--wobble-rebound', `${4 * dirMultiplier}px`);
                    zoneToClean.style.setProperty('--wobble-settle', `${-2 * dirMultiplier}px`);
                    zoneToClean.classList.add('wobbling');
                    setTimeout(() => zoneToClean.classList.remove('wobbling'), 400);
                }
            }, 400);
        }

        // Navigation Trigger (80px Threshold)
        if (absoluteDelta > 80) {
            if (side === 'left' && VibeDrips.modalState.currentIndex > 0) {
                navigateModal('prev');
            } else if (side === 'right' && VibeDrips.modalState.currentIndex < VibeDrips.filteredProducts.length - 1) {
                navigateModal('next');
            } else if (zoneToClean) {
                // Boundary hit feedback
                zoneToClean.classList.add('pulse');
                setTimeout(() => zoneToClean.classList.remove('pulse'), 1000);
            }
        }

        // Reset Glows
        if (glowToClean) {
            glowToClean.style.transition = 'opacity 0.2s ease, width 0.2s ease';
            glowToClean.classList.remove('active');
            glowToClean.style.width = '0px';
        }

        activeZone = null;
        activeGlow = null;
    };

    // ONLY add start listener to container
    container.addEventListener('mousedown', handleStart);
    container.addEventListener('touchstart', handleStart, { passive: true });
}

// Initialize keyboard navigation on page load
setupModalKeyboardNav();

// END_PHASE_1_FUNCTIONS


/**
 * Show detailed product modal with enhanced UI
 * PHASE_7: Added triggerElement for context-aware navigation
 */
function showProductModal(productId, triggerElement = null) {
    const product = VibeDrips.allProducts.find(p => p.id === productId);
    if (!product) {
        console.error('Product not found:', productId);
        return;
    }

    // ✅ PHASE_7: Scoped Context Detection (Supports Main Grid, Reels, etc.)
    let scopedProducts = [];
    if (triggerElement) {
        // Special Case: Reels Carousel (which is paginated, so DOM query isn't enough)
        const reelCarousel = triggerElement.closest('.products-carousel');
        if (reelCarousel && window.getReelsDataFromProducts) {
            const reelIndex = parseInt(reelCarousel.getAttribute('data-reel-index'));
            const reels = window.getReelsDataFromProducts();
            if (reels[reelIndex]) {
                scopedProducts = reels[reelIndex].products;
                console.log(`🎬 Scoped modal to ALL ${scopedProducts.length} products in Reel #${reelIndex}.`);
            }
        }

        // Standard Case: Grid query (for main page or other gridded sections)
        if (scopedProducts.length === 0) {
            const parentGrid = triggerElement.closest('.reel-products') ||
                triggerElement.closest('#products-container') ||
                triggerElement.closest('.products-section') ||
                triggerElement.closest('.products-grid');

            if (parentGrid) {
                // Extract IDs in current visual order from DOM
                const siblingCards = parentGrid.querySelectorAll('[data-product-id]');
                const scopedIds = Array.from(siblingCards).map(card => card.getAttribute('data-product-id'));

                // Map IDs back to full product objects
                scopedProducts = scopedIds.map(id => VibeDrips.allProducts.find(p => p.id === id)).filter(Boolean);
                console.log(`🔍 Scoped modal to ${scopedProducts.length} products from DOM container.`);
            }
        }
    }

    // Fallback to global list if no context found
    if (scopedProducts.length === 0) {
        scopedProducts = [...VibeDrips.filteredProducts];
        console.log('🔍 No scoped context found, falling back to global filtered list.');
    }

    // Save context to global state
    VibeDrips.modalState.currentProductList = scopedProducts;

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
    // First, decode existing entities to prevent double-escaping (&amp; -> &)
    const decoded = unsafe.toString()
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&#39;/g, "'");

    return decoded
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

