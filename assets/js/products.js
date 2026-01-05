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
    const category = truncateTextAtWord(product.subcategory || product.itemTypeName || product.category || 'General', 18);
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

// ============================================================================
// MODAL UTILITY FUNCTIONS (Add these BEFORE showProductModal)
// ============================================================================

/**
 * Parse product images from AllImages field
 */
function parseProductImages(product) {
  let images = [];
  
  if (product.AllImages || product.allImages) {
    const allImagesStr = product.AllImages || product.allImages;
    try {
      images = JSON.parse(allImagesStr);
    } catch {
      images = allImagesStr.split(/[|,;]/).map(s => s.trim()).filter(Boolean);
    }
  }
  
  if (!images.length && (product.MainImage || product.mainimage)) {
    images = [product.MainImage || product.mainimage];
  }
  
  return images.filter(Boolean);
}

/**
 * Get field value with fallback chain
 */
function getFieldValue(product, ...keys) {
  for (const key of keys) {
    const value = product[key];
    if (value != null && String(value).trim() !== '') {
      return String(value).trim();
    }
  }
  return null;
}

/**
 * Format review count with commas
 */
function formatReviewCount(count) {
  const num = parseInt(count);
  if (!num || isNaN(num)) return '0';
  return num.toLocaleString('en-US');
}

/**
 * Convert snake_case to Title Case
 */
function humanizeLabel(fieldName) {
  return fieldName
    .replace(/_/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase())
    .replace(/Lxwxh/gi, 'L×W×H')
    .replace(/Isbn/gi, 'ISBN')
    .replace(/Upc/gi, 'UPC');
}

/**
 * Get emoji icon for field
 */
function getIconForField(fieldKey) {
  const key = fieldKey.toLowerCase();
  
  if (key.includes('weight')) return '⚖️';
  if (key.includes('dimension')) return '📏';
  if (key.includes('color') || key.includes('colour')) return '🎨';
  if (key.includes('material')) return '🧱';
  if (key.includes('origin') || key.includes('country')) return '🌍';
  if (key.includes('model')) return '🔢';
  if (key.includes('voltage')) return '⚡';
  if (key.includes('wattage') || key.includes('power')) return '💡';
  if (key.includes('battery')) return '🔋';
  if (key.includes('connectivity') || key.includes('wireless')) return '📡';
  if (key.includes('noise')) return '🔇';
  if (key.includes('manufacturer') || key.includes('packer') || key.includes('importer')) return '🏭';
  if (key.includes('isbn') || key.includes('publisher')) return '📚';
  
  return '•';
}

/**
 * Render field value with 80-char truncation
 */
function renderFieldValue(value, fieldKey) {
  const str = String(value).trim();
  const MAX_LENGTH = 80;
  
  if (str.length <= MAX_LENGTH) {
    return `<span class="field-value">${escapeHtml(str)}</span>`;
  }
  
  const truncated = str.substring(0, MAX_LENGTH);
  const uniqueId = `field-${fieldKey.replace(/[^a-z0-9]/gi, '-')}`;
  
  return `
    <span class="field-value field-value-truncated" id="${uniqueId}-short">${escapeHtml(truncated)}...</span>
    <button class="field-toggle" data-target="${uniqueId}" data-expanded="false">
      <span class="toggle-text">Show More ▼</span>
    </button>
    <span class="field-value field-value-full" id="${uniqueId}-full" style="display:none;">${escapeHtml(str)}</span>
  `;
}

/**
 * Build Core Details section
 */
function buildCoreDetailsSection(product) {
  const coreFields = {
    weight: getFieldValue(product, 'weight', 'item_weight', 'itemweight'),
    dimensions: getFieldValue(product, 'dimensions', 'product_dimensions', 'item_dimensions_lxwxh', 'item_dimensions_l_x_w_x_h'),
    color: getFieldValue(product, 'color', 'colour'),
    material: getFieldValue(product, 'material'),
    origin: getFieldValue(product, 'countryOfOrigin', 'country_of_origin', 'country')
  };
  
  const iconMap = { weight: '⚖️', dimensions: '📏', color: '🎨', material: '🧱', origin: '🌍' };
  const labelMap = { weight: 'Weight', dimensions: 'Dimensions', color: 'Color', material: 'Material', origin: 'Country of Origin' };
  
  const fieldsHTML = Object.entries(coreFields)
    .filter(([key, value]) => value)
    .map(([key, value]) => `
      <div class="detail-row">
        <span class="detail-icon">${iconMap[key]}</span>
        <span class="detail-label">${labelMap[key]}:</span>
        ${renderFieldValue(value, `core-${key}`)}
      </div>
    `).join('');
  
  if (!fieldsHTML) return '';
  
  return `
    <details class="info-section core-details" open>
      <summary>📋 Product Details</summary>
      <div class="details-content">${fieldsHTML}</div>
    </details>
  `;
}

/**
 * Build Additional Info section
 */
function buildAdditionalInfoSection(product) {
  const EXCLUDE_FIELDS = [
    'Timestamp', 'Product Source Link', 'Amazon SiteStripe (Short)', 'Amazon SiteStripe (Long)',
    'asin', 'ASIN', 'productTitle', 'Title', 'name', 'brand', 'Brand', 'MainImage', 'mainimage', 'AllImages', 'allImages',
    'Category', 'category', 'categoryHierarchy', 'itemTypeName', 'subcategory',
    'Price', 'price', 'originalPrice', 'OriginalPrice', 'symbol',
    'Rating', 'customerRating', 'customer_rating', 'ReviewCount', 'reviewCount', 'review_count',
    'Description', 'description', 'availability', 'Discount', 'discountPercentage',
    'Currency', 'Amazon marketplace domain', 'Influencer', 'amazonshort', 'amazonlong', 'sourcelink',
    'weight', 'item_weight', 'itemweight', 'dimensions', 'product_dimensions', 'item_dimensions_lxwxh',
    'item_dimensions_l_x_w_x_h', 'package_dimensions', 'color', 'colour', 'material',
    'countryOfOrigin', 'country_of_origin', 'country', 'Reference Media for similar products',
    'id', 'timestamp', 'featured', 'trending'
  ];
  
  const seenValues = new Set();
  const fields = [];
  
  for (const [key, value] of Object.entries(product)) {
    if (EXCLUDE_FIELDS.includes(key)) continue;
    if (value == null || String(value).trim() === '') continue;
    
    const normalizedValue = String(value).toLowerCase().trim();
    if (seenValues.has(normalizedValue)) continue;
    seenValues.add(normalizedValue);
    
    fields.push({
      key: key,
      label: humanizeLabel(key),
      value: value,
      icon: getIconForField(key)
    });
  }
  
  const fieldsHTML = fields.map(field => `
    <div class="detail-row">
      <span class="detail-icon">${field.icon}</span>
      <span class="detail-label">${escapeHtml(field.label)}:</span>
      ${renderFieldValue(field.value, `additional-${field.key}`)}
    </div>
  `).join('');
  
  if (!fieldsHTML) return '';
  
  return `
    <details class="info-section additional-info">
      <summary>ℹ️ Additional Info</summary>
      <div class="details-content">${fieldsHTML}</div>
    </details>
  `;
}

/**
 * Build Description section with 200-char truncation
 */
function buildDescriptionSection(description) {
  if (!description || !description.trim()) return '';
  
  const MAX_LENGTH = 200;
  const needsExpand = description.length > MAX_LENGTH;
  const shortDesc = needsExpand ? description.substring(0, MAX_LENGTH) : description;
  
  return `
    <div class="product-description">
      <h3 class="description-title">📝 Description</h3>
      <p class="desc-text" id="desc-short">${escapeHtml(shortDesc)}${needsExpand ? '...' : ''}</p>
      ${needsExpand ? `
        <button class="desc-toggle" data-expanded="false">
          <span class="toggle-text">Read More ▼</span>
        </button>
        <p class="desc-full" id="desc-full" style="display:none;">${escapeHtml(description)}</p>
      ` : ''}
    </div>
  `;
}

/**
 * Show detailed product modal with enhanced layout
 */
function showProductModal(productId) {
  const product = VibeDrips.allProducts.find(p => p.id === productId);
  
  if (!product) {
    console.error('Product not found:', productId);
    return;
  }
  
  // Parse images
  const allImages = parseProductImages(product);
  
  // Get product metadata
  const productName = getFieldValue(product, 'name', 'productTitle', 'Title') || 'Product';
  const brand = getFieldValue(product, 'brand', 'Brand') || 'VibeDrips';
  const category = getFieldValue(product, 'category', 'subcategory', 'Category', 'itemTypeName') || '';
  const price = getFieldValue(product, 'price', 'Price') || '';
  const rating = getFieldValue(product, 'customerRating', 'customer_rating', 'Rating') || '';
  const reviewCount = getFieldValue(product, 'reviewCount', 'review_count', 'ReviewCount') || '0';
  const description = getFieldValue(product, 'description', 'Description') || '';
  
  // Format rating (full text: "4.3 out of 5 stars")
  const ratingFormatted = rating ? `${parseFloat(rating).toFixed(1)} out of 5 stars` : '';
  
  // Format review count (with commas: "88,860")
  const reviewCountFormatted = formatReviewCount(reviewCount);
  
  // Build sections
  const coreDetailsHTML = buildCoreDetailsSection(product);
  const additionalInfoHTML = buildAdditionalInfoSection(product);
  const descriptionHTML = buildDescriptionSection(description);
  
  // Get Amazon link
  const amazonLink = getFieldValue(product, 'amazonshort', 'amazonlong', 'sourcelink', 'Amazon SiteStripe (Short)', 'Amazon SiteStripe (Long)') || '#';
  
  // Create modal HTML
  const modalContent = `
    <div class="simple-modal dynamic-modal" data-product-id="${productId}">
      <div class="modal-overlay" onclick="closeDynamicModal(event)"></div>
      
      <div class="simple-modal-content">
        <!-- Header with Title and Close Button -->
        <div class="simple-modal-header">
          <h2 class="product-title-modal">${escapeHtml(productName)}</h2>
          <button class="modal-close-button" onclick="closeDynamicModal(event)">❌</button>
        </div>
        
        <!-- Brand Tag (below title) -->
        <div class="brand-tag">🏷️ ${escapeHtml(brand)}</div>
        
        <!-- Modal Body -->
        <div class="simple-modal-body">
          <!-- Image Gallery with Navigation -->
          <div class="product-gallery">
            ${allImages.length > 1 ? '<button class="gallery-nav gallery-prev" data-direction="prev">←</button>' : ''}
            <img src="${allImages[0]}" alt="${escapeHtml(productName)}" class="gallery-main-image" data-current-index="0" loading="lazy">
            ${allImages.length > 1 ? '<button class="gallery-nav gallery-next" data-direction="next">→</button>' : ''}
          </div>
          
          ${allImages.length > 1 ? `
            <div class="gallery-thumbnails">
              ${allImages.map((img, i) => `
                <span class="thumb-indicator ${i === 0 ? 'active' : ''}" data-index="${i}">○</span>
              `).join('')}
            </div>
          ` : ''}
          
          <!-- Category, Price, Rating -->
          <div class="modal-metadata">
            ${category ? `<div class="modal-category">📦 ${escapeHtml(category)}</div>` : ''}
            <div class="modal-price-rating">
              ${price ? `<span class="modal-price">💰 ${escapeHtml(price)}</span>` : ''}
              ${ratingFormatted ? `<span class="modal-rating">⭐ ${ratingFormatted} (${reviewCountFormatted} reviews)</span>` : ''}
            </div>
          </div>
          
          <!-- Core Product Details -->
          ${coreDetailsHTML}
          
          <!-- Additional Info -->
          ${additionalInfoHTML}
          
          <!-- Description -->
          ${descriptionHTML}
          
          <!-- Buy Button -->
          <div class="modal-actions">
            <a href="${amazonLink}" target="_blank" rel="noopener noreferrer" class="amazon-button">
              🛒 Buy on Amazon
            </a>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Insert modal into DOM
  document.body.insertAdjacentHTML('beforeend', modalContent);
  
  // Get modal element
  const modalEl = document.querySelector('.simple-modal.dynamic-modal:last-of-type');
  
  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================
  
  // Gallery Navigation
  if (allImages.length > 1) {
    const galleryImg = modalEl.querySelector('.gallery-main-image');
    const prevBtn = modalEl.querySelector('.gallery-prev');
    const nextBtn = modalEl.querySelector('.gallery-next');
    const thumbnails = modalEl.querySelectorAll('.thumb-indicator');
    
    let currentIndex = 0;
    
    const updateGallery = (newIndex) => {
      if (newIndex < 0 || newIndex >= allImages.length) return;
      
      currentIndex = newIndex;
      galleryImg.src = allImages[newIndex];
      galleryImg.dataset.currentIndex = newIndex;
      
      thumbnails.forEach((thumb, i) => {
        thumb.classList.toggle('active', i === newIndex);
      });
      
      if (prevBtn) prevBtn.disabled = newIndex === 0;
      if (nextBtn) nextBtn.disabled = newIndex === allImages.length - 1;
    };
    
    prevBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (currentIndex > 0) updateGallery(currentIndex - 1);
    });
    
    nextBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (currentIndex < allImages.length - 1) updateGallery(currentIndex + 1);
    });
    
    thumbnails.forEach((thumb, i) => {
      thumb.addEventListener('click', (e) => {
        e.stopPropagation();
        updateGallery(i);
      });
    });
  }
  
  // Field Value Toggle (80-char truncation)
  const fieldToggles = modalEl.querySelectorAll('.field-toggle');
  fieldToggles.forEach(toggle => {
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const targetId = toggle.dataset.target;
      const shortText = document.getElementById(`${targetId}-short`);
      const fullText = document.getElementById(`${targetId}-full`);
      const isExpanded = toggle.dataset.expanded === 'true';
      
      if (isExpanded) {
        shortText.style.display = 'inline';
        fullText.style.display = 'none';
        toggle.querySelector('.toggle-text').textContent = 'Show More ▼';
        toggle.dataset.expanded = 'false';
      } else {
        shortText.style.display = 'none';
        fullText.style.display = 'inline';
        toggle.querySelector('.toggle-text').textContent = 'Show Less ▲';
        toggle.dataset.expanded = 'true';
      }
    });
  });
  
  // Description Toggle (200-char truncation)
  const descToggle = modalEl.querySelector('.desc-toggle');
  if (descToggle) {
    descToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const shortText = modalEl.querySelector('#desc-short');
      const fullText = modalEl.querySelector('#desc-full');
      const isExpanded = descToggle.dataset.expanded === 'true';
      
      if (isExpanded) {
        shortText.style.display = 'block';
        fullText.style.display = 'none';
        descToggle.querySelector('.toggle-text').textContent = 'Read More ▼';
        descToggle.dataset.expanded = 'false';
      } else {
        shortText.style.display = 'none';
        fullText.style.display = 'block';
        descToggle.querySelector('.toggle-text').textContent = 'Show Less ▲';
        descToggle.dataset.expanded = 'true';
      }
    });
  }
}

/**
 * Close dynamic modal (specific to modals created by showProductModal)
 */
function closeDynamicModal(event) {
    event.stopPropagation();
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
console.log('Products.js loaded successfully with currency-aware price formatting and text truncation');
