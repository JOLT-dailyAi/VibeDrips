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


/**
 * Create a product card element - NEW UNIFIED LAYOUT
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
    const category = product.subcategory || product.itemTypeName || product.category || 'General';
    const brand = product.brand || 'VibeDrips';
    const rating = parseFloat(product.customer_rating) || 0;
    
    // Format price
    const price = product.price || 0;
    const currency = product.symbol || '₹';
    const priceFormatted = typeof price === 'number' 
        ? `${currency}${price.toLocaleString('en-IN')}` 
        : price;
    
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
            <span class="product-price">${priceFormatted}</span>
            ${rating > 0 ? `<span class="rating">⭐ ${rating.toFixed(1)}</span>` : ''}
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
 * Initialize MediaLightbox for image gallery
 */
function initLightbox() {
    if (!window.lightboxInstance) {
        window.lightboxInstance = new MediaLightbox({
            enableSwipe: true,
            enableKeyboard: true,
            showCounter: true,
            showDots: true
        });
    }
}

/**
 * Open lightbox with product images
 */
function openProductLightbox(images, startIndex = 0) {
    initLightbox();
    window.lightboxInstance.open(images, startIndex);
}

/**
 * Show detailed product modal - ENHANCED LAYOUT
 */
function showProductModal(productId) {
    const product = VibeDrips.allProducts.find(p => (p.asin || p.id) === productId);
    if (!product) {
        console.error('Product not found:', productId);
        return;
    }

    // Get all images
    const allImages = [product.main_image || product.MainImage, ...(product.all_images || product.AllImages || [])].filter(Boolean);
    const imageCount = allImages.length;
    
    // Store images globally for lightbox access
    window.currentProductImages = allImages;
    
    // Core fields mapping with fallbacks
    const coreFields = {
        weight: product.item_weight || product.weight,
        dimensions: product.product_dimensions || product.dimensions || product.item_dimensions_l_x_w_x_h || product.item_dimensions_lxwxh,
        color: product.color || product.colour || product.Colour,
        material: product.material || product.Material,
        origin: product.country_of_origin || product.countryOfOrigin
    };
    
    // Icon mapping
    const fieldIcons = {
        weight: '⚖️',
        dimensions: '📏',
        color: '🎨',
        material: '🧱',
        origin: '🌍',
        model_name: '🔢',
        item_model_number: '🔢',
        voltage: '⚡',
        wattage: '💡',
        manufacturer: '🏭',
        isbn_10: '📚',
        isbn_13: '📚',
        connectivity_technology: '📡',
        battery_cell_composition: '🔋',
        wireless_communication_technology: '📡',
        operation_mode: '⚙️'
    };
    
    // Base fields to exclude from additional info
    const baseFields = new Set([
        'id', 'asin', 'ASIN', 'name', 'productTitle', 'Title', 'brand', 'Brand',
        'main_image', 'MainImage', 'all_images', 'AllImages', 'allImages',
        'category', 'Category', 'categoryHierarchy', 'itemTypeName', 'subcategory',
        'price', 'Price', 'originalPrice', 'OriginalPrice', 'symbol', 'Currency',
        'customer_rating', 'Rating', 'customerRating', 'review_count', 'reviewCount', 'ReviewCount',
        'amazon_short', 'amazon_long', 'source_link', 'Amazon SiteStripe (Short)', 'Amazon SiteStripe (Long)',
        'description', 'Description', 'timestamp', 'date_first_available',
        'Timestamp', 'Product Source Link', 'Amazon marketplace domain', 'Influencer',
        'Reference Media for similar products', 'Discount', 'discountPercentage',
        'availability', 'featured', 'trending',
        // Metadata fields to exclude
        'Error-Flag', 'Error-Reason', 'currency', 'regional_availability', 'regional_variants',
        'referenceMedia', 'affiliate_link', 'product_type'
    ]);
    
    // Add core fields to exclusion
    Object.keys(coreFields).forEach(key => baseFields.add(key));
    
    // Build core details HTML
    let coreDetailsHTML = '';
    let hasCoreFields = false;
    Object.entries(coreFields).forEach(([key, value]) => {
        if (value && value.toString().trim()) {
            hasCoreFields = true;
            const icon = fieldIcons[key] || '📋';
            const label = key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            coreDetailsHTML += `
                <div class="detail-item">
                    <span class="detail-icon">${icon}</span>
                    <span class="detail-label">${label}:</span>
                    <span class="detail-value">${escapeHtml(value)}</span>
                </div>
            `;
        }
    });
    
    // Build additional info HTML
    let additionalInfoHTML = '';
    let hasAdditionalInfo = false;
    Object.entries(product).forEach(([key, value]) => {
        if (!baseFields.has(key) && value && value.toString().trim()) {
            hasAdditionalInfo = true;
            const icon = fieldIcons[key] || '📋';
            const label = key.split(/[_\s]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            additionalInfoHTML += `
                <div class="detail-item">
                    <span class="detail-icon">${icon}</span>
                    <span class="detail-label">${label}:</span>
                    <span class="detail-value">${escapeHtml(value)}</span>
                </div>
            `;
        }
    });
    
    // Format price
    const currency = product.symbol || product.Currency || '₹';
    const price = product.price || product.Price || 0;
    const priceFormatted = typeof price === 'number' ? `${currency}${price.toLocaleString('en-IN')}` : price;
    
    // Format rating
    const rating = parseFloat(product.customer_rating || product.customerRating || product.Rating) || 0;
    const reviewCount = product.review_count || product.reviewCount || product.ReviewCount || 0;
    
    // Description with expand/collapse
    const description = product.description || product.Description || '';
    const descriptionPreview = description.length > 200 ? description.substring(0, 200) : description;
    const showReadMore = description.length > 200;
    
    // Current gallery image index
    window.currentImageIndex = 0;

    const modalContent = `
        <div class="simple-modal dynamic-modal">
            <div class="modal-overlay" onclick="closeDynamicModal(event)"></div>
            <div class="simple-modal-content">
                <div class="simple-modal-header">
                    <h2>${escapeHtml(product.name || product.productTitle || product.Title)}</h2>
                    <button class="modal-close-button" onclick="closeDynamicModal(event)">❌</button>
                </div>
                <div class="simple-modal-body">
                    ${product.brand || product.Brand ? `
                        <div class="modal-brand">
                            <span class="brand-icon">🏷️</span>
                            <span class="brand-name">${escapeHtml(product.brand || product.Brand)}</span>
                        </div>
                    ` : ''}
                    
                    ${imageCount > 0 ? `
                        <div class="modal-gallery">
                            <div class="gallery-main-image" onclick="openProductLightbox(window.currentProductImages, 0)">
                                <img id="modalGalleryImage" src="${allImages[0]}" alt="${escapeHtml(product.name || '')}" />
                                <div class="gallery-zoom-hint">🔍 Click to zoom</div>
                            </div>
                            ${imageCount > 1 ? `
                                <div class="gallery-thumbnails">
                                    ${allImages.map((img, idx) => `
                                        <div class="gallery-thumbnail ${idx === 0 ? 'active' : ''}" 
                                             onclick="updateMainImage(${idx})"
                                             data-index="${idx}">
                                            <img src="${img}" alt="Thumbnail ${idx + 1}" />
                                        </div>
                                    `).join('')}
                                </div>
                            ` : ''}
                        </div>
                    ` : ''}
                    
                    <div class="modal-category">📦 ${escapeHtml(product.subcategory || product.category || product.itemTypeName || 'General')}</div>
                    
                    <div class="modal-price-rating">
                        <span class="modal-price">💰 ${priceFormatted}</span>
                        ${rating > 0 ? `
                            <span class="modal-rating">⭐ ${rating.toFixed(1)} ${reviewCount > 0 ? `(${reviewCount.toLocaleString()} reviews)` : ''}</span>
                        ` : ''}
                    </div>
                    
                    ${hasCoreFields ? `
                        <div class="modal-section">
                            <div class="section-header collapsible" onclick="toggleSection(this)">
                                <span>📋 Product Details</span>
                                <span class="toggle-icon">▼</span>
                            </div>
                            <div class="section-content expanded">
                                ${coreDetailsHTML}
                            </div>
                        </div>
                    ` : ''}
                    
                    ${hasAdditionalInfo ? `
                        <div class="modal-section">
                            <div class="section-header collapsible" onclick="toggleSection(this)">
                                <span>ℹ️ Additional Info</span>
                                <span class="toggle-icon">▶</span>
                            </div>
                            <div class="section-content">
                                ${additionalInfoHTML}
                            </div>
                        </div>
                    ` : ''}
                    
                    ${description ? `
                        <div class="modal-section">
                            <div class="section-header">
                                <span>📝 Description/Reviews:</span>
                            </div>
                            <div class="section-content expanded">
                                <div class="description-text" id="descriptionText" data-full="${escapeHtml(description)}">
                                    ${escapeHtml(descriptionPreview)}${showReadMore ? '...' : ''}
                                </div>
                                ${showReadMore ? `
                                    <button class="read-more-btn" onclick="toggleDescription()">
                                        <span id="readMoreText">Read More ▼</span>
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    ` : ''}
                    
                    <button onclick="openAmazonLink('${escapeHtml(product.amazon_short || product.amazon_long || product.source_link || '#')}', '${productId}')" 
                            class="amazon-button modal-amazon-button">
                        🛒 Buy on Amazon
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalContent);
    
    // Initialize lightbox
    initLightbox();
}

/**
 * Update main gallery image when thumbnail is clicked
 */
window.updateMainImage = function(index) {
    const mainImg = document.getElementById('modalGalleryImage');
    const thumbnails = document.querySelectorAll('.gallery-thumbnail');
    const images = window.currentProductImages || [];
    
    if (mainImg && images[index]) {
        mainImg.src = images[index];
        
        // Update active thumbnail
        thumbnails.forEach((thumb, idx) => {
            thumb.classList.toggle('active', idx === index);
        });
    }
};

/**
 * Navigate product image gallery (DEPRECATED - keeping for backward compatibility)
 */
window.navigateGallery = function(direction) {
    const images = window.currentProductImages || [];
    if (images.length <= 1) return;
    
    window.currentImageIndex = window.currentImageIndex || 0;
    window.currentImageIndex = (window.currentImageIndex + direction + images.length) % images.length;
    
    updateMainImage(window.currentImageIndex);
};

/**
 * Toggle collapsible sections
 */
window.toggleSection = function(header) {
    const content = header.nextElementSibling;
    const icon = header.querySelector('.toggle-icon');
    
    if (content.classList.contains('expanded')) {
        content.classList.remove('expanded');
        icon.textContent = '▶';
    } else {
        content.classList.add('expanded');
        icon.textContent = '▼';
    }
};

/**
 * Toggle description expand/collapse
 */
window.toggleDescription = function() {
    const descText = document.getElementById('descriptionText');
    const btnText = document.getElementById('readMoreText');
    
    if (!descText || !btnText) return;
    
    const fullDesc = (descText.dataset.full || '').trim();
    const isExpanded = descText.dataset.expanded === 'true';
    
    if (isExpanded) {
        // Collapse - show first 200 chars
        descText.textContent = fullDesc.substring(0, 200).trim() + '...';
        descText.dataset.expanded = 'false';
        btnText.textContent = 'Read More ▼';
    } else {
        // Expand - show full text
        descText.textContent = fullDesc;
        descText.dataset.expanded = 'true';
        btnText.textContent = 'Show Less ▲';
    }
};

/**
 * Close dynamic modal (specific to modals created by showProductModal)
 */
function closeDynamicModal(event) {
    event.stopPropagation();
    const modal = event.target.closest('.dynamic-modal');
    if (modal) {
        if (event.target.classList.contains('modal-overlay') || event.target.closest('button')) {
            modal.remove();
            window.currentImageIndex = 0;
            window.currentProductImages = null;
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
        .replace(/'/g, "&#039;");
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

console.log('Products.js loaded successfully');
