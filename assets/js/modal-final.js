/**
 * Show detailed product modal with enhanced UI - FINAL VERSION
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

    // Prepare data (TRIM all values)
    const currencyCode = product.currency || 'INR';
    const symbol = product.symbol || '₹';
    const priceFormatted = formatPriceFull(product.price || 0, currencyCode, symbol);
    const rating = parseFloat(product.customer_rating) || 0;
    const reviewCount = parseInt(product.review_count) || 0;
    const showDiscount = product.show_discount || false;
    const discountPercent = product.computed_discount || 0;

    // Prepare images for gallery
    const images = [product.main_image, ...(product.all_images || [])].filter(Boolean);

    // Title truncation (1 line, 80 chars)
    const maxTitleLength = 80;
    const productTitle = (product.name || 'Product').trim();
    const isTitleLong = productTitle.length > maxTitleLength;
    const displayTitle = isTitleLong
        ? productTitle.substring(0, 80).trim() + '...'
        : productTitle;

    // Build modal HTML
    const modalContent = `
        <div class="simple-modal dynamic-modal">
            <div class="modal-overlay" onclick="closeDynamicModal(event)"></div>
            <div class="simple-modal-content">
                <div class="simple-modal-header">
                    <h2 id="modal-title-${productId}">${escapeHtml(displayTitle)}</h2>
                    ${isTitleLong ? `<button class="title-expand-btn" onclick="toggleTitle('${productId}', '${escapeHtml(productTitle.replace(/'/g, "\\'"))}')">Expand Title ▼</button>` : ''}
                    <button class="modal-close-button" onclick="closeDynamicModal(event)">❌</button>
                </div>
                <div class="simple-modal-body">
                    
                    <!-- Brand Section -->
                    <div class="modal-brand-section">
                        <div class="info-row">
                            <span class="emoji">🏷️</span>
                            <span class="label">Brand</span>
                            <span class="value">${escapeHtml((product.brand || 'Unknown').trim())}</span>
                        </div>
                    </div>
                    
                    <!-- Image Gallery Section -->
                    ${images.length > 0 ? `
                    <div class="modal-image-gallery">
                        <img src="${images[0]}" 
                             alt="${escapeHtml(productTitle)}" 
                             style="max-width: 100%; max-height: 400px; border-radius: 12px; cursor: pointer;"
                             onclick="openImageGallery_${productId}()">
                        ${images.length > 1 ? `<p style="margin-top: 8px; opacity: 0.8; font-size: 13px;">Click to view ${images.length} images</p>` : ''}
                    </div>
                    ` : ''}
                    
                    <!-- Category Section -->
                    <div class="modal-category-section">
                        <div class="info-row">
                            <span class="emoji">📦</span>
                            <span class="label">Category</span>
                            <span class="value">${escapeHtml((product.category || 'General').trim())}</span>
                        </div>
                    </div>
                    
                    <!-- Price + Discount + Rating + Reviews Section -->
                    <div class="modal-core-info">
                        <!-- Price + Discount -->
                        <div class="info-row">
                            <span class="emoji">💰</span>
                            <span class="label">Price</span>
                            <span class="value">
                                ${priceFormatted}
                                ${showDiscount && discountPercent > 0 ? `
                                    <span class="discount-badge">
                                        <span class="live-dot" aria-hidden="true"></span>${discountPercent}%
                                    </span>
                                ` : ''}
                            </span>
                        </div>
                        
                        <!-- Rating -->
                        ${rating > 0 ? `
                        <div class="info-row">
                            <span class="emoji">⭐</span>
                            <span class="label">Rating</span>
                            <span class="value">${rating.toFixed(1)} out of 5 stars</span>
                        </div>
                        ` : ''}
                        
                        <!-- Reviews -->
                        ${reviewCount > 0 ? `
                        <div class="info-row">
                            <span class="emoji">👥</span>
                            <span class="label">Reviews</span>
                            <span class="value">${formatCountFull(reviewCount)} customer reviews</span>
                        </div>
                        ` : ''}
                    </div>
                    
                    <!-- Product Details Section (COLLAPSED) -->
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
        const emoji = getDetailEmoji(item.key);
        return `
                                <div class="detail-row">
                                    <span class="emoji">${emoji}</span>
                                    <span class="label">${escapeHtml((item.label || '').trim())}</span>
                                    <span class="value">${escapeHtml((item.value || '').trim())}</span>
                                </div>
                                `;
    }).join('')}
                        </div>
                    </div>
                    ` : ''}
                    
                    <!-- Additional Info Section (COLLAPSED) -->
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
                            ${Object.entries(product.additionalInfo).map(([groupName, items]) => {
        if (!items || items.length === 0) return '';
        // Skip Books group for non-book products
        if (groupName === 'Books' && product.category !== 'Book') return '';

        const groupEmoji = getGroupEmoji(groupName);
        return `
                                <div class="info-group">
                                    <div class="info-group-header">
                                        <span class="emoji">${groupEmoji}</span>
                                        <span>${escapeHtml(groupName)}</span>
                                    </div>
                                    ${items
                .filter(item => item.key !== 'Timestamp' && item.key !== 'timestamp')
                .map(item => `
                                        <div class="info-item">
                                            <span class="label">${escapeHtml((item.label || '').trim())}</span>
                                            <span class="value">${escapeHtml((item.value || '').trim())}</span>
                                        </div>
                                    `).join('')}
                                </div>
                                `;
    }).join('')}
                        </div>
                    </div>
                    ` : ''}
                    
                    <!-- Description Section (COLLAPSED) -->
                    ${product.description ? `
                    <div class="modal-section">
                        <div class="modal-section-header" onclick="toggleSection(this)">
                            <div class="title">
                                <span class="emoji">📝</span>
                                <span>Description</span>
                            </div>
                            <span class="toggle-icon">▶</span>
                        </div>
                        <div class="modal-section-content">
                            <div class="description-text">${escapeHtml(product.description.trim())}</div>
                        </div>
                    </div>
                    ` : ''}
                    
                    <!-- Buy Button (ALWAYS VISIBLE) -->
                    <div class="modal-actions">
                        <button onclick="openAmazonLink('${escapeHtml(product.amazon_short || product.amazon_long || product.source_link || '#')}', '${product.id}')" 
                                class="amazon-button">🛒 Buy on Amazon</button>
                    </div>
                    
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalContent);

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

// Helper: Get emoji for product detail keys
function getDetailEmoji(key) {
    const emojiMap = {
        'weight': '⚖️',
        'dimensions': '📏',
        'color': '🎨',
        'material': '🧱',
        'origin': '🌍',
        'made_in': '🌍'
    };
    return emojiMap[key] || '•';
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

// Helper: Toggle title expansion
function toggleTitle(productId, fullTitle) {
    const titleEl = document.getElementById(`modal-title-${productId}`);
    const btn = titleEl.nextElementSibling;

    if (titleEl.classList.contains('expanded')) {
        // Collapse
        titleEl.textContent = fullTitle.substring(0, 80).trim() + '...';
        titleEl.classList.remove('expanded');
        btn.textContent = 'Expand Title ▼';
    } else {
        // Expand
        titleEl.textContent = fullTitle;
        titleEl.classList.add('expanded');
        btn.textContent = 'Collapse Title ▲';
    }
}
