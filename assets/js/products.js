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
    const allImages = [product.main_image, ...(product.all_images || [])].filter(Boolean);
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

/**
 * Show detailed product modal with enhanced UI
 */
function showProductModal(productId) {
    const product = VibeDrips.allProducts.find(p => p.id === productId);
    if (!product) {
        console.error('Product not found:', productId);
        return;
    }

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

    // Prepare data
    const currencyCode = product.currency || 'INR';
    const symbol = product.symbol || '₹';
    const priceFormatted = formatPriceFull(product.price || 0, currencyCode, symbol);
    const rating = parseFloat(product.customer_rating) || 0;
    const reviewCount = parseInt(product.review_count) || 0;

    // Prepare images for gallery
    const images = [product.main_image, ...(product.all_images || [])].filter(Boolean);

    // Build modal HTML
    const modalContent = `
        <div class="simple-modal dynamic-modal">
            <div class="modal-overlay" onclick="closeDynamicModal(event)"></div>
            <div class="simple-modal-content">
                <div class="simple-modal-header">
                    <h2>${escapeHtml(product.name)}</h2>
                    <button class="modal-close-button" onclick="closeDynamicModal(event)">❌</button>
                </div>
                <div class="simple-modal-body">
                    
                    <!-- Core Info Section -->
                    <div class="modal-core-info">
                        <div class="info-row">
                            <span class="emoji">💰</span>
                            <span class="label">Price:</span>
                            <span class="value">${priceFormatted}</span>
                        </div>
                        <div class="info-row">
                            <span class="emoji">🏷️</span>
                            <span class="label">Brand:</span>
                            <span class="value">${escapeHtml(product.brand || 'Unknown')}</span>
                        </div>
                        <div class="info-row">
                            <span class="emoji">📦</span>
                            <span class="label">Category:</span>
                            <span class="value">${escapeHtml(product.category || 'General')}</span>
                        </div>
                        ${rating > 0 ? `
                        <div class="info-row">
                            <span class="emoji">⭐</span>
                            <span class="label">Rating:</span>
                            <span class="value">${rating.toFixed(1)} out of 5 stars</span>
                        </div>
                        ` : ''}
                        ${reviewCount > 0 ? `
                        <div class="info-row">
                            <span class="emoji">👥</span>
                            <span class="label">Reviews:</span>
                            <span class="value">${formatCountFull(reviewCount)} customer reviews</span>
                        </div>
                        ` : ''}
                    </div>
                    
                    <!-- Image Gallery Section -->
                    ${images.length > 0 ? `
                    <div class="modal-image-gallery">
                        <img src="${images[0]}" 
                             alt="${escapeHtml(product.name)}" 
                             style="max-width: 100%; max-height: 400px; border-radius: 12px; cursor: pointer;"
                             onclick="openImageGallery_${productId}()">
                        ${images.length > 1 ? `<p style="margin-top: 8px; opacity: 0.8; font-size: 13px;">Click to view ${images.length} images</p>` : ''}
                    </div>
                    ` : ''}
                    
                    <!-- Product Details Section (Collapsible) -->
                    ${product.productDetails && product.productDetails.length > 0 ? `
                    <div class="modal-section">
                        <div class="modal-section-header" onclick="toggleSection(this)">
                            <div class="title">
                                <span class="emoji">📋</span>
                                <span>Product Details</span>
                            </div>
                            <span class="toggle-icon">▼</span>
                        </div>
                        <div class="modal-section-content expanded">
                            ${product.productDetails.sort((a, b) => (a.priority || 0) - (b.priority || 0)).map(item => {
        const emoji = getDetailEmoji(item.key);
        return `
                                <div class="detail-row">
                                    <span class="emoji">${emoji}</span>
                                    <span class="label">${escapeHtml(item.label)}:</span>
                                    <span class="value">${escapeHtml(item.value)}</span>
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
                            <span class="toggle-icon">▼</span>
                        </div>
                        <div class="modal-section-content">
                            ${Object.entries(product.additionalInfo).map(([groupName, items]) => {
        if (!items || items.length === 0) return '';
        const groupEmoji = getGroupEmoji(groupName);
        return `
                                <div class="info-group">
                                    <div class="info-group-header">
                                        <span class="emoji">${groupEmoji}</span>
                                        <span>${escapeHtml(groupName)}</span>
                                    </div>
                                    ${items.map(item => `
                                    <div class="info-item">
                                        <span class="label">${escapeHtml(item.label)}:</span>
                                        <span class="value">${escapeHtml(item.value)}</span>
                                    </div>
                                    `).join('')}
                                </div>
                                `;
    }).join('')}
                        </div>
                    </div>
                    ` : ''}
                    
                    <!-- Description Section -->
                    ${product.description ? `
                    <div class="modal-description">
                        <div class="description-text">${escapeHtml(product.description)}</div>
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

    // Wrap modal with carousel container (peek left/right)
    const wrappedModal = wrapModalWithCarousel(modalContent, productId);

    // Insert into DOM
    document.body.insertAdjacentHTML('beforeend', wrappedModal);

    // Attach carousel navigation events
    attachModalCarouselNavigation();

    // Setup image gallery if MediaLightbox is available
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
}

/**
 * Generate HTML for the peek preview of a product
 */
function generatePeekHTML(product) {
    if (!product) return '';
    const img = product.main_image || '';
    const name = product.name || 'Product';
    const price = formatPrice(product.price || 0, product.currency || 'INR', product.symbol || '₹', true);

    return `
        <div class="peek-content">
            <img src="${img}" alt="${escapeHtml(name)}">
            <div class="peek-info">
                <div class="peek-name">${escapeHtml(truncateText(name, 20))}</div>
                <div class="peek-price">${price}</div>
            </div>
        </div>
    `;
}

/**
 * Wrap the existing modal HTML with a carousel container that allows 5% peeks
 */
function wrapModalWithCarousel(modalHTML, productId) {
    const products = VibeDrips.filteredProducts || VibeDrips.allProducts;
    const productIndex = products.findIndex(p => p.id === productId || p.asin === productId);

    if (productIndex === -1) {
        console.warn('Product index not found for carousel');
        return modalHTML; // Fallback to original
    }

    // Get prev/next products
    const prevProduct = productIndex > 0 ? products[productIndex - 1] : null;
    const nextProduct = productIndex < products.length - 1 ? products[productIndex + 1] : null;

    // Store context for navigation
    window.modalCarouselContext = {
        products: products,
        currentIndex: productIndex
    };

    // Generate peek HTML
    const prevPeekHTML = prevProduct ? generatePeekHTML(prevProduct) : '';
    const nextPeekHTML = nextProduct ? generatePeekHTML(nextProduct) : '';

    /**
     * ROBUST WRAPPING: 
     * Instead of parsing the existing modalHTML with potentially breaking regex,
     * we wrap the ENTIRE modalHTML in a new container that handles the carousel.
     * We just need to make sure the outer overlay covers everything.
     */

    return `
        <div class="modal-overlay dynamic-modal" id="dynamic-modal-overlay">
            <div class="modal-carousel-container">
                <!-- Left Peek Area (5%) -->
                ${prevPeekHTML ? `
                    <div class="modal-peek modal-peek-left" data-direction="-1">
                        ${prevPeekHTML}
                    </div>
                ` : '<div style="width: 5%"></div>'}
                
                <!-- Main Modal Wrapper (90%) -->
                <div class="modal-main-wrapper" style="flex: 1; position: relative; z-index: 10;">
                    ${modalHTML}
                </div>
                
                <!-- Right Peek Area (5%) -->
                ${nextPeekHTML ? `
                    <div class="modal-peek modal-peek-right" data-direction="1">
                        ${nextPeekHTML}
                    </div>
                ` : '<div style="width: 5%"></div>'}
            </div>
        </div>
    `;
}

/**
 * Attach carousel navigation events (Option C: Touch/Drag/Keyboard, NO Scroll)
 */
function attachModalCarouselNavigation() {
    const overlay = document.getElementById('dynamic-modal-overlay');
    if (!overlay || !window.modalCarouselContext) return;

    // 1. Click on peek areas
    overlay.querySelectorAll('.modal-peek').forEach(peek => {
        peek.addEventListener('click', (e) => {
            e.stopPropagation();
            const direction = parseInt(peek.dataset.direction);
            navigateModal(direction);
        });
    });

    // 2. Touch swipe (Mobile/Trackpad)
    let touchStartX = 0;
    overlay.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
    }, { passive: true });

    overlay.addEventListener('touchend', (e) => {
        const diff = touchStartX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) {
            navigateModal(diff > 0 ? 1 : -1);
        }
    }, { passive: true });

    // 3. Mouse Drag (Desktop alternative to swipe)
    let isDragging = false;
    let dragStartX = 0;
    let dragThreshold = 100; // Require 100px drag for navigation

    overlay.addEventListener('mousedown', (e) => {
        // Only start drag if clicking on overlay or peeks, not on the product content itself
        if (e.target === overlay || e.target.classList.contains('modal-carousel-container') || e.target.closest('.modal-peek')) {
            isDragging = true;
            dragStartX = e.clientX;
        }
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        // Optional: you could add visual feedback here based on (dragStartX - e.clientX)
    });

    window.addEventListener('mouseup', (e) => {
        if (!isDragging) return;
        isDragging = false;

        const diff = dragStartX - e.clientX;
        if (Math.abs(diff) > dragThreshold) {
            navigateModal(diff > 0 ? 1 : -1);
        }
    });

    // 4. Keyboard Arrow Keys
    const keyHandler = (e) => {
        // Check if modal is still in the DOM
        if (!document.getElementById('dynamic-modal-overlay')) {
            document.removeEventListener('keydown', keyHandler);
            return;
        }

        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            navigateModal(-1);
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            navigateModal(1);
        }
    };
    document.addEventListener('keydown', keyHandler);
}

/**
 * Navigate to prev/next product with boundary checks and flash feedback
 */
function navigateModal(direction) {
    const context = window.modalCarouselContext;
    if (!context) return;

    const newIndex = context.currentIndex + direction;

    // Boundary Check
    if (newIndex < 0 || newIndex >= context.products.length) {
        // Flash red glow as feedback
        const overlay = document.getElementById('dynamic-modal-overlay');
        if (overlay) {
            const flashClass = direction < 0 ? 'flash-left' : 'flash-right';
            overlay.classList.add(flashClass);
            setTimeout(() => overlay.classList.remove(flashClass), 400);
        }
        return;
    }

    // Switch to new product
    context.currentIndex = newIndex;
    closeDynamicModal(); // Close current modal using the existing function (passed event-less because of our fix)

    // We need to ensure closeDynamicModal works without an event for programmatic calls
    // Since we reverted products.js, let's redefine closeDynamicModal slightly to be safer

    const nextProduct = context.products[newIndex];
    showProductModal(nextProduct.id || nextProduct.asin);
}

// Helper: Ensure closeDynamicModal works for programmatic calls and removes the entire carousel overlay
const originalCloseDynamicModal = window.closeDynamicModal;
window.closeDynamicModal = function (e) {
    // Priority: Remove the outer carousel overlay if it exists
    const overlay = document.getElementById('dynamic-modal-overlay');
    if (overlay) {
        overlay.remove();
        return;
    }

    if (!e) {
        const modal = document.querySelector('.dynamic-modal');
        if (modal) modal.remove();
        return;
    }

    // Fallback: Check if it's the old version or our new exported one
    if (typeof originalCloseDynamicModal === 'function') {
        originalCloseDynamicModal(e);
    } else {
        const modal = e.target.closest('.dynamic-modal');
        if (modal && (e.target.classList.contains('modal-overlay') || e.target.closest('button'))) {
            modal.remove();
        }
    }
};

// Update exports
window.setTimeFilter = setTimeFilter;
window.filterProducts = filterProducts;
window.sortProducts = sortProducts;
window.openAmazonLink = openAmazonLink;
window.showProductModal = showProductModal;
window.closeDynamicModal = window.closeDynamicModal;

console.log('Products.js (Carousel Option C) loaded successfully');
