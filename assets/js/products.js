// products.js - Product Display and Filtering Functions (Fixed)

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

    const productsGrid = document.createElement('div');
    productsGrid.className = 'products-grid';

    VibeDrips.filteredProducts.forEach(product => {
        const productCard = createProductCard(product);
        productsGrid.appendChild(productCard);
    });

    container.innerHTML = '';
    container.appendChild(productsGrid);
    updateStats();
}

/**
 * Create a product card element
 */
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    const images = [product.main_image, ...product.all_images].filter(img => img && img.trim());
    const primaryImage = images[0] || '';
    
    const formattedPrice = product.price ? `₹${product.price}` : 'Price not available';
    
    let badge = '';
    if (VibeDrips.currentTimeFilter === 'hot') {
        badge = `<div class="product-badge hot">🔥 Hot</div>`;
    } else if (product.featured) {
        badge = `<div class="product-badge featured">⭐ Featured</div>`;
    }

    const ratingDisplay = product.customer_rating > 0 ? 
        `<div class="rating">⭐ ${product.customer_rating.toFixed(1)} (${product.review_count})</div>` : 
        `<div class="rating no-rating">No ratings yet</div>`;

    const redirectLink = product.amazon_short || product.amazon_long || product.source_link || '#';

    card.innerHTML = `
        <div class="product-image">
            ${primaryImage ? 
                `<img src="${primaryImage}" alt="${escapeHtml(product.name)}" 
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" 
                     loading="lazy">
                 <div class="product-image-placeholder" style="display:none;">🛍️</div>` :
                `<div class="product-image-placeholder">🛍️</div>`
            }
            ${badge}
            ${images.length > 1 ? `<div class="image-count">${images.length} photos</div>` : ''}
        </div>
        <div class="product-info">
            <div class="product-category">${escapeHtml(product.subcategory || product.category)}</div>
            <h3 class="product-title">${escapeHtml(product.name)}</h3>
            <div class="product-description">${escapeHtml(truncateText(product.description, 100))}</div>
            <div class="product-price">${formattedPrice}</div>
            
            <div class="product-meta">
                <span class="brand">🏷️ ${escapeHtml(product.brand)}</span>
                ${ratingDisplay}
            </div>
            
            <div class="product-actions">
                <button class="amazon-button" onclick="openAmazonLink('${escapeHtml(redirectLink)}', '${product.id}')">
                    🛒 Buy on Amazon
                </button>
                <button class="details-button" onclick="showProductModal('${product.id}')">
                    👁️ Details
                </button>
            </div>
        </div>
    `;

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
                    <p><strong>Price:</strong> ₹${product.price}</p>
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
    if (modal && event.target.classList.contains('modal-overlay')) {
        modal.remove();
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
// Do not export closeDynamicModal to avoid conflict with closeSimpleModal

console.log('Products.js loaded successfully');
