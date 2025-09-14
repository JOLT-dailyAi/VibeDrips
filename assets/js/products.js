// products.js - Product Display and Filtering Functions

/**
 * Set time-based filter for products
 * @param {string} filter - Filter type (hot, featured, new, trending, all)
 */
function setTimeFilter(filter) {
    console.log(`🎯 Setting time filter: ${filter}`);
    VibeDrips.currentTimeFilter = filter;
    
    // Update active filter UI
    document.querySelectorAll('.time-category').forEach(cat => {
        cat.classList.remove('active');
        if (cat.getAttribute('data-filter') === filter) {
            cat.classList.add('active');
        }
    });

    // Filter products based on the selected time filter
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

    // Update section titles
    updateSectionTitle(filter);
    
    // Apply any existing search/category filters
    applyCurrentFilters();
    
    // Render products
    renderProducts();
}

/**
 * Get "Hot This Month" products based on dateFirstAvailable
 * Prioritizes dateFirstAvailable, falls back to timestamp
 */
function getHotProducts() {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    return VibeDrips.allProducts.filter(product => {
        // Use dateFirstAvailable if available, otherwise fall back to timestamp
        const dateStr = product.date_first_available || product.dateFirstAvailable || product.timestamp;
        if (!dateStr) return false;
        
        try {
            const productDate = new Date(dateStr);
            
            // Check if product was first available this month (Sep/Oct 2025)
            return (productDate.getMonth() === currentMonth && 
                    productDate.getFullYear() === currentYear) ||
                   // Also include products from last month to ensure we have enough content
                   (productDate.getMonth() === (currentMonth - 1 + 12) % 12 && 
                    productDate.getFullYear() === currentYear);
        } catch (error) {
            console.warn('Invalid date format for product:', product.name, dateStr);
            return false;
        }
    }).sort((a, b) => {
        // Sort by dateFirstAvailable (newest first)
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
 * Update section title based on current filter
 */
function updateSectionTitle(filter) {
    const titles = {
        'hot': { 
            title: '🔥 Hot This Month', 
            subtitle: 'Trending products that just dropped and making waves'
        },
        'featured': { 
            title: '⭐ Featured Products', 
            subtitle: 'Our hand-picked recommendations just for you'
        },
        'new': { 
            title: '🆕 New Arrivals', 
            subtitle: 'Fresh drops from the last 30 days'
        },
        'trending': { 
            title: '📈 Trending Now', 
            subtitle: 'What everyone is talking about'
        },
        'all': { 
            title: '🛍️ All Products', 
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
                product.brand,
                product.theme,
                product.character
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
            // Default sorting - featured first, then by date
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
 * Create a product card element with new layout requirements
 * @param {Object} product - Product data
 * @returns {HTMLElement} Product card element
 */
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    // Prepare images for carousel
    const images = [product.main_image, ...product.all_images].filter(img => img && img.trim());
    const primaryImage = images[0] || '';
    
    // Format price using currency utilities
    const formattedPrice = window.CurrencyUtils ? 
        window.CurrencyUtils.formatPrice(product.price, product.currency) :
        `₹${product.price}`;
    
    // Create badge if applicable
    let badge = '';
    if (VibeDrips.currentTimeFilter === 'hot') {
        badge = `<div class="product-badge hot">🔥 Hot</div>`;
    } else if (product.featured) {
        badge = `<div class="product-badge featured">⭐ Featured</div>`;
    } else if (product.trending) {
        badge = `<div class="product-badge trending">📈 Trending</div>`;
    }

    // Rating display
    const ratingDisplay = product.customer_rating > 0 ? 
        `<div class="rating">⭐ ${product.customer_rating.toFixed(1)} (${product.review_count})</div>` : 
        `<div class="rating no-rating">No ratings yet</div>`;

    // Amazon redirect link priority: Short > Long > Source
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
 * Open Amazon/affiliate link in new tab
 */
function openAmazonLink(link, productId) {
    if (link && link !== '#' && link !== '') {
        console.log('🔗 Amazon redirect:', productId, link);
        window.open(link, '_blank', 'noopener,noreferrer');
    } else {
        console.warn('⚠️ No Amazon link available for product:', productId);
    }
}

/**
 * Show detailed product modal with new layout
 */
function showProductModal(productId) {
    const product = VibeDrips.allProducts.find(p => p.id === productId);
    if (!product) {
        console.error('❌ Product not found:', productId);
        return;
    }

    console.log('📖 Opening product modal:', product.name);

    // Get modal elements
    const modal = document.getElementById('product-modal');
    const modalTitle = document.getElementById('modal-product-title');
    const sourceEmbed = document.getElementById('modal-source-embed');
    const sourceIframe = document.getElementById('source-iframe');
    const carousel = document.getElementById('modal-image-carousel');
    const details = document.getElementById('modal-product-details');
    const amazonBtn = document.getElementById('amazon-buy-btn');

    if (!modal) return;

    // Set title
    if (modalTitle) {
        modalTitle.textContent = product.name;
    }

    // Set source embed (left side)
    if (sourceEmbed && sourceIframe && product.source_link) {
        sourceIframe.src = product.source_link;
        sourceEmbed.style.display = 'block';
    } else if (sourceEmbed) {
        sourceEmbed.style.display = 'none';
    }

    // Set up image carousel (right side)
    setupImageCarousel(product);

    // Set product details
    if (details) {
        const formattedPrice = product.price ? `₹${product.price}` : 'Price not available';

        details.innerHTML = `
            <div class="detail-grid">
                <div class="detail-item">
                    <div class="detail-label">Price</div>
                    <div class="detail-value price">${formattedPrice}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Brand</div>
                    <div class="detail-value">${escapeHtml(product.brand)}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Category</div>
                    <div class="detail-value">${escapeHtml(product.category)}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Rating</div>
                    <div class="detail-value">
                        ${product.customer_rating > 0 ? 
                            `⭐ ${product.customer_rating.toFixed(1)} (${product.review_count} reviews)` : 
                            'No ratings yet'}
                    </div>
                </div>
                ${product.color ? `
                <div class="detail-item">
                    <div class="detail-label">Color</div>
                    <div class="detail-value">${escapeHtml(product.color)}</div>
                </div>` : ''}
                ${product.material ? `
                <div class="detail-item">
                    <div class="detail-label">Material</div>
                    <div class="detail-value">${escapeHtml(product.material)}</div>
                </div>` : ''}
                <div class="detail-item full-width">
                    <div class="detail-label">Description</div>
                    <div class="detail-value">${escapeHtml(product.description)}</div>
                </div>
            </div>
        `;
    }

    // Set Amazon button
    if (amazonBtn) {
        const redirectLink = product.amazon_short || product.amazon_long || product.source_link || '#';
        amazonBtn.onclick = () => openAmazonLink(redirectLink, product.id);
        
        const formattedPrice = window.CurrencyUtils ? 
            window.CurrencyUtils.formatPrice(product.price, product.currency) :
            `₹${product.price}`;
        amazonBtn.textContent = `🛒 Buy on Amazon - ${formattedPrice}`;
    }

    // Show modal
    modal.classList.add('show');
}

/**
 * Set up image carousel for product modal
 */
function setupImageCarousel(product) {
    const carouselTrack = document.getElementById('carousel-track');
    const carouselDots = document.getElementById('carousel-dots');
    const prevBtn = document.getElementById('carousel-prev');
    const nextBtn = document.getElementById('carousel-next');
    
    if (!carouselTrack) return;

    // Prepare images
    const images = [product.main_image, ...product.all_images].filter(img => img && img.trim());
    
    if (images.length === 0) {
        carouselTrack.innerHTML = '<div class="no-image-placeholder">🛍️<br>No Image Available</div>';
        return;
    }

    // Create carousel slides
    carouselTrack.innerHTML = '';
    images.forEach((image, index) => {
        const slide = document.createElement('div');
        slide.className = 'carousel-slide';
        slide.innerHTML = `<img src="${image}" alt="${escapeHtml(product.name)} - Image ${index + 1}" loading="lazy">`;
        carouselTrack.appendChild(slide);
    });

    // Create dots
    if (carouselDots && images.length > 1) {
        carouselDots.innerHTML = '';
        images.forEach((_, index) => {
            const dot = document.createElement('button');
            dot.className = 'carousel-dot';
            if (index === 0) dot.classList.add('active');
            dot.onclick = () => goToSlide(index);
            carouselDots.appendChild(dot);
        });
    }

    // Set up navigation
    let currentSlide = 0;
    
    function goToSlide(slideIndex) {
        currentSlide = slideIndex;
        const translateX = -slideIndex * 100;
        carouselTrack.style.transform = `translateX(${translateX}%)`;
        
        // Update dots
        document.querySelectorAll('.carousel-dot').forEach((dot, index) => {
            dot.classList.toggle('active', index === slideIndex);
        });
    }
    
    if (prevBtn) {
        prevBtn.onclick = () => {
            currentSlide = (currentSlide - 1 + images.length) % images.length;
            goToSlide(currentSlide);
        };
    }
    
    if (nextBtn) {
        nextBtn.onclick = () => {
            currentSlide = (currentSlide + 1) % images.length;
            goToSlide(currentSlide);
        };
    }
}

/**
 * Close product modal
 */
function closeProductModal() {
    const modal = document.getElementById('product-modal');
    if (modal) {
        modal.classList.remove('show');
        
        // Clear iframe src to stop any loading
        const iframe = document.getElementById('source-iframe');
        if (iframe) {
            iframe.src = '';
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
 * Utility function to escape HTML
 */
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
