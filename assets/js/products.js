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
        container.appendChild(productCard); // ← Append directly to container
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
    // ✅ UPDATED: No decimals in compact mode
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
    const category = truncateText(product.subcategory || product.itemTypeName || product.category || 'General', 18);
    const brand = truncateText(product.brand || 'VibeDrips', 18);
    const rating = parseFloat(product.customer_rating) || 0;
    const reviewCount = parseInt(product.review_count) || 0;

    // ✅ Format review count helper
    const formatCount = (n) => {
      if (!n || n < 1000) return String(n || 0);
      if (n < 10000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
      return Math.round(n / 1000) + 'k';
    };

    // ✅ Truncate text to max chars at last complete word (reusable)
    const truncateText = (text, maxChars = 18) => {
      if (!text || text.length <= maxChars) return text;
      const truncated = text.substring(0, maxChars);
      const lastSpace = truncated.lastIndexOf(' ');
      if (lastSpace > 0) {
        return truncated.substring(0, lastSpace) + '...';
      }
      return truncated + '...';
    };

    // ✅ Use formatPrice with currency awareness (compact, no decimals)
    const price = product.display_price || product.price || 0;
    const currencyCode = product.currency || 'INR';
    const symbol = product.symbol || '₹';
    const priceFormatted = formatPrice(price, currencyCode, symbol, true); // Compact format

    // Discount badge logic (NEW)
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
 * Show detailed product modal
 */
function showProductModal(productId) {
    const product = VibeDrips.allProducts.find(p => p.id === productId);
    if (!product) {
        console.error('Product not found:', productId);
        return;
    }

    // ✅ Use formatPrice for modal (full format with decimals)
    const currencyCode = product.currency || 'INR';
    const symbol = product.symbol || '₹';
    const priceFormatted = formatPrice(product.price, currencyCode, symbol, false); // Full format

    // Create dynamic modal with separate overlay and content
    const modalContent = `
        <div class="simple-modal dynamic-modal">
            <div class="modal-overlay" onclick="closeDynamicModal(event)"></div>
            <div class="simple-modal-content">
                <div class="simple-modal-header">
                    <h2>${escapeHtml(product.name)}</h2>
                    <button onclick="closeDynamicModal(event)">X</button>
                </div>
                <div class="simple-modal-body">
                    <img src="${product.main_image}" alt="${escapeHtml(product.name)}" style="max-width: 200px;">
                    <p><strong>Price:</strong> ${priceFormatted}</p>
                    <p><strong>Brand:</strong> ${escapeHtml(product.brand)}</p>
                    <p><strong>Category:</strong> ${escapeHtml(product.category)}</p>
                    <p><strong>Description:</strong> ${escapeHtml(product.description)}</p>
                    <button onclick="openAmazonLink('${escapeHtml(product.amazon_short || product.amazon_long || product.source_link || '#')}', '${product.id}')" 
                            class="amazon-button">🛒 Buy on Amazon</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalContent);
}

/**
 * Close dynamic modal (specific to modals created by showProductModal)
 */
function closeDynamicModal(event) {
    event.stopPropagation(); // Prevent event from bubbling further if needed
    const modal = event.target.closest('.dynamic-modal');
    if (modal) {
        if (event.target.classList.contains('modal-overlay') || event.target.closest('button')) {
            modal.remove();
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
// Do not export closeDynamicModal to avoid conflict with closeSimpleModal
console.log('Products.js loaded successfully with currency-aware price formatting');
