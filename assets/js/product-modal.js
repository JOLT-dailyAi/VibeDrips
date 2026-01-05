// product-modal.js - Product details modal management

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Parse product images from AllImages field (JSON array or delimited string)
 * @param {Object} product - Product object
 * @returns {Array} Array of image URLs
 */
function parseProductImages(product) {
  let images = [];

  // Try AllImages (JSON array format)
  if (product.AllImages) {
    try {
      images = JSON.parse(product.AllImages);
    } catch {
      // Fallback: split by common separators (pipe, comma, semicolon)
      images = product.AllImages.split(/[|,;]/).map(s => s.trim()).filter(Boolean);
    }
  }

  // Fallback to MainImage
  if (!images.length && product.MainImage) {
    images = [product.MainImage];
  }

  // Final fallback to SVG placeholder
  if (!images.length) {
    const svgFallback = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill='%23333' width='200' height='200'/%3E%3Ctext fill='%23fff' font-size='14' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3E${encodeURIComponent(product.productTitle?.substring(0, 20) || 'No Image')}%3C/text%3E%3C/svg%3E`;
    images = [svgFallback];
  }

  return images.filter(Boolean);
}

/**
 * Get field value with fallback chain (returns first non-empty value)
 * @param {Object} product - Product object
 * @param {...string} keys - Field names in priority order
 * @returns {string|null} First non-empty value or null
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
 * Format review count with commas (88860 → "88,860")
 * @param {number|string} count - Review count
 * @returns {string} Formatted count with commas
 */
function formatReviewCount(count) {
  const num = parseInt(count);
  if (!num || isNaN(num)) return '0';
  return num.toLocaleString('en-US');
}

/**
 * Convert snake_case field names to Title Case labels
 * @param {string} fieldName - Field name in snake_case
 * @returns {string} Human-readable label
 */
function humanizeLabel(fieldName) {
  return fieldName
    .replace(/_/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase())
    .replace(/Lxwxh/gi, 'L×W×H')
    .replace(/Isbn/gi, 'ISBN')
    .replace(/Pm(\d)/gi, 'PM$1')
    .replace(/Upc/gi, 'UPC')
    .replace(/Voc/gi, 'VOC');
}

/**
 * Get contextual emoji icon for field
 * @param {string} fieldKey - Field name
 * @returns {string} Emoji icon
 */
function getIconForField(fieldKey) {
  const key = fieldKey.toLowerCase();

  const iconMap = {
    weight: '⚖️',
    dimension: '📏',
    color: '🎨',
    colour: '🎨',
    material: '🧱',
    origin: '🌍',
    country: '🌍',
    model: '🔢',
    voltage: '⚡',
    wattage: '💡',
    power: '💡',
    battery: '🔋',
    connectivity: '📡',
    wireless: '📡',
    noise: '🔇',
    operation: '⚙️',
    room: '🏠',
    floor: '📐',
    coverage: '📐',
    area: '📐',
    manufacturer: '🏭',
    packer: '📦',
    importer: '📦',
    specification: '✅',
    filter: '🔍',
    year: '📅',
    isbn: '📚',
    publisher: '📖',
    hardcover: '📕',
    paperback: '📘',
    edition: '📑',
    pages: '📄',
    print: '📄',
    reading: '👶',
    age: '👶'
  };

  for (const [pattern, icon] of Object.entries(iconMap)) {
    if (key.includes(pattern)) return icon;
  }

  return '•'; // Default bullet
}

/**
 * Render field value with 80-character truncation and "Show More" toggle
 * @param {string} value - Field value
 * @param {string} fieldKey - Unique identifier for toggle functionality
 * @returns {string} HTML string with truncation logic
 */
function renderFieldValue(value, fieldKey) {
  const str = String(value).trim();
  const MAX_LENGTH = 80;

  if (str.length <= MAX_LENGTH) {
    return `<span class="field-value">${escapeHtml(str)}</span>`;
  }

  // Truncate at 80 chars
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
 * Build Core Product Details section (Priority 1-2 fields)
 * @param {Object} product - Product object
 * @returns {string} HTML string for Core Details section
 */
function buildCoreDetailsSection(product) {
  const coreFields = {
    weight: getFieldValue(product, 'weight', 'item_weight'),
    dimensions: getFieldValue(product, 'dimensions', 'product_dimensions', 'item_dimensions_lxwxh', 'item_dimensions_l_x_w_x_h'),
    color: getFieldValue(product, 'color', 'colour'),
    material: getFieldValue(product, 'material'),
    origin: getFieldValue(product, 'countryOfOrigin', 'country_of_origin')
  };

  const iconMap = {
    weight: '⚖️',
    dimensions: '📏',
    color: '🎨',
    material: '🧱',
    origin: '🌍'
  };

  const labelMap = {
    weight: 'Weight',
    dimensions: 'Dimensions',
    color: 'Color',
    material: 'Material',
    origin: 'Country of Origin'
  };

  // Build HTML for populated fields
  const fieldsHTML = Object.entries(coreFields)
    .filter(([key, value]) => value)
    .map(([key, value]) => `
      <div class="detail-row">
        <span class="detail-icon">${iconMap[key]}</span>
        <span class="detail-label">${labelMap[key]}:</span>
        ${renderFieldValue(value, \`core-\${key}\`)}
      </div>
    `).join('');

  // Only show section if at least 1 field is populated
  if (!fieldsHTML) return '';

  return `
    <details class="info-section core-details" open>
      <summary>📋 Product Details</summary>
      <div class="details-content">
        ${fieldsHTML}
      </div>
    </details>
  `;
}

/**
 * Build Additional Info section (Priority 3+ fields, dynamically generated)
 * @param {Object} product - Product object
 * @returns {string} HTML string for Additional Info section
 */
function buildAdditionalInfoSection(product) {
  // Fields to exclude (already shown elsewhere or not relevant)
  const EXCLUDE_FIELDS = [
    'Timestamp', 'Product Source Link', 'Amazon SiteStripe (Short)', 'Amazon SiteStripe (Long)',
    'asin', 'ASIN', 'productTitle', 'Title', 'brand', 'Brand', 'MainImage', 'AllImages',
    'Category', 'categoryHierarchy', 'itemTypeName', 'Price', 'price', 'originalPrice', 'OriginalPrice',
    'Rating', 'customerRating', 'ReviewCount', 'reviewCount', 'Description', 'availability',
    'Discount', 'discountPercentage', 'Currency', 'Amazon marketplace domain', 'Influencer',
    'weight', 'item_weight', 'dimensions', 'product_dimensions', 'item_dimensions_lxwxh',
    'item_dimensions_l_x_w_x_h', 'package_dimensions', 'color', 'colour', 'material',
    'countryOfOrigin', 'country_of_origin', 'Reference Media for similar products '
  ];

  const seenValues = new Set(); // Track values to avoid duplicates
  const fields = [];

  // Loop through all product fields dynamically
  for (const [key, value] of Object.entries(product)) {
    // Skip excluded fields
    if (EXCLUDE_FIELDS.includes(key)) continue;

    // Skip empty/null values
    if (value == null || String(value).trim() === '') continue;

    // Check for duplicate values (case-insensitive)
    const normalizedValue = String(value).toLowerCase().trim();
    if (seenValues.has(normalizedValue)) continue;
    seenValues.add(normalizedValue);

    // Add field
    fields.push({
      key: key,
      label: humanizeLabel(key),
      value: value,
      icon: getIconForField(key)
    });
  }

  // Build HTML
  const fieldsHTML = fields.map(field => `
    <div class="detail-row">
      <span class="detail-icon">${field.icon}</span>
      <span class="detail-label">${escapeHtml(field.label)}:</span>
      ${renderFieldValue(field.value, \`additional-\${field.key}\`)}
    </div>
  `).join('');

  // Only show section if at least 1 field is populated
  if (!fieldsHTML) return '';

  return `
    <details class="info-section additional-info">
      <summary>ℹ️ Additional Info</summary>
      <div class="details-content">
        ${fieldsHTML}
      </div>
    </details>
  `;
}

/**
 * Build Description section with 200-character truncation
 * @param {string} description - Product description
 * @returns {string} HTML string for description section
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
      ${needsExpand ? \`
        <button class="desc-toggle" data-expanded="false">
          <span class="toggle-text">Read More ▼</span>
        </button>
        <p class="desc-full" id="desc-full" style="display:none;">\${escapeHtml(description)}</p>
      \` : ''}
    </div>
  `;
}

/**
 * Escape HTML to prevent XSS (reuse existing utility if available)
 */
function escapeHtml(unsafe) {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ============================================================================
// MODAL DISPLAY FUNCTION
// ============================================================================

/**
 * Show detailed product modal with enhanced layout
 * @param {string} productId - Product ASIN or ID
 */
function showProductModal(productId) {
  console.log('🔍 Opening product modal for:', productId);

  // Find product from global products array
  const product = window.products?.find(p => 
    p.asin === productId || p.ASIN === productId || p.id === productId
  );

  if (!product) {
    console.error('❌ Product not found:', productId);
    return;
  }

  // Parse images
  const allImages = parseProductImages(product);

  // Get product metadata
  const productName = getFieldValue(product, 'productTitle', 'Title', 'name') || 'Product';
  const brand = getFieldValue(product, 'brand', 'Brand') || 'VibeDrips';
  const category = getFieldValue(product, 'Category', 'category', 'itemTypeName') || '';
  const price = getFieldValue(product, 'price', 'Price') || '';
  const rating = getFieldValue(product, 'customerRating', 'Rating') || '';
  const reviewCount = getFieldValue(product, 'reviewCount', 'ReviewCount') || '0';
  const description = getFieldValue(product, 'Description') || '';

  // Format rating (full text: "4.3 out of 5 stars")
  const ratingFormatted = rating ? \`\${parseFloat(rating).toFixed(1)} out of 5 stars\` : '';

  // Format review count (with commas: "88,860")
  const reviewCountFormatted = formatReviewCount(reviewCount);

  // Build sections
  const coreDetailsHTML = buildCoreDetailsSection(product);
  const additionalInfoHTML = buildAdditionalInfoSection(product);
  const descriptionHTML = buildDescriptionSection(description);

  // Get Amazon link
  const amazonLink = getFieldValue(product, 'Amazon SiteStripe (Short)', 'Amazon SiteStripe (Long)') || '#';

  // Create modal HTML
  const modalContent = \`
    <div class="simple-modal dynamic-modal" data-product-id="\${productId}">
      <div class="modal-overlay" onclick="closeDynamicModal(event)"></div>

      <div class="simple-modal-content">
        <!-- Header with Title and Close Button -->
        <div class="simple-modal-header">
          <h2 class="product-title-modal">\${escapeHtml(productName)}</h2>
          <button class="modal-close-button" onclick="closeDynamicModal(event)">❌</button>
        </div>

        <!-- Brand Tag (below title) -->
        <div class="brand-tag">🏷️ \${escapeHtml(brand)}</div>

        <!-- Modal Body -->
        <div class="simple-modal-body">
          <!-- Image Gallery with Navigation -->
          <div class="product-gallery">
            \${allImages.length > 1 ? '<button class="gallery-nav gallery-prev" data-direction="prev">←</button>' : ''}
            <img src="\${allImages[0]}" alt="\${escapeHtml(productName)}" class="gallery-main-image" data-current-index="0" loading="lazy">
            \${allImages.length > 1 ? '<button class="gallery-nav gallery-next" data-direction="next">→</button>' : ''}
          </div>

          \${allImages.length > 1 ? \`
            <div class="gallery-thumbnails">
              \${allImages.map((img, i) => \`
                <span class="thumb-indicator \${i === 0 ? 'active' : ''}" data-index="\${i}">○</span>
              \`).join('')}
            </div>
          \` : ''}

          <!-- Category, Price, Rating -->
          <div class="modal-metadata">
            \${category ? \`<div class="modal-category">📦 \${escapeHtml(category)}</div>\` : ''}
            <div class="modal-price-rating">
              \${price ? \`<span class="modal-price">💰 \${escapeHtml(price)}</span>\` : ''}
              \${ratingFormatted ? \`<span class="modal-rating">⭐ \${ratingFormatted} (\${reviewCountFormatted} reviews)</span>\` : ''}
            </div>
          </div>

          <!-- Core Product Details -->
          \${coreDetailsHTML}

          <!-- Additional Info -->
          \${additionalInfoHTML}

          <!-- Description -->
          \${descriptionHTML}

          <!-- Buy Button -->
          <div class="modal-actions">
            <a href="\${amazonLink}" target="_blank" rel="noopener noreferrer" class="amazon-button">
              🛒 Buy on Amazon
            </a>
          </div>
        </div>
      </div>
    </div>
  \`;

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

      // Update thumbnails
      thumbnails.forEach((thumb, i) => {
        thumb.classList.toggle('active', i === newIndex);
      });

      // Update button states
      if (prevBtn) prevBtn.disabled = newIndex === 0;
      if (nextBtn) nextBtn.disabled = newIndex === allImages.length - 1;
    };

    // Previous button
    prevBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (currentIndex > 0) updateGallery(currentIndex - 1);
    });

    // Next button
    nextBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (currentIndex < allImages.length - 1) updateGallery(currentIndex + 1);
    });

    // Thumbnail indicators
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
      const shortText = document.getElementById(\`\${targetId}-short\`);
      const fullText = document.getElementById(\`\${targetId}-full\`);
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

  console.log('✅ Product modal opened successfully');
}

// ============================================================================
// EXISTING MODAL FUNCTIONS (PRESERVED)
// ============================================================================

// Show simple modal (product modal)
function showSimpleModal() {
  const modal = document.getElementById('static-modal');
  if (!modal) {
    console.error('❌ Product modal not found!');
    return;
  }
  console.log('✅ Opening product modal');
  modal.classList.remove('hidden');
}

// Close simple modal (for static modal with ID 'static-modal')
function closeSimpleModal() {
  const modal = document.getElementById('static-modal');
  if (!modal) return;
  console.log('❌ Closing simple modal');
  modal.classList.add('hidden');
}

// Close dynamic modal (for dynamically generated product modals)
function closeDynamicModal(event) {
  console.log('🖱️ Close dynamic modal triggered');

  // Find the closest modal parent
  const modal = event.target.closest('.simple-modal');
  if (!modal) {
    console.error('❌ Could not find modal to close');
    return;
  }

  // Check if clicking on overlay or close button (not modal content)
  const clickedOverlay = event.target.classList.contains('modal-overlay');
  const clickedCloseButton = event.target.tagName === 'BUTTON';

  console.log('🖱️ Click details:', {
    clickedOverlay,
    clickedCloseButton,
    targetClass: event.target.className,
    targetTag: event.target.tagName
  });

  if (clickedOverlay || clickedCloseButton) {
    console.log('💥 Closing modal...');
    modal.remove(); // Remove dynamically created modal from DOM
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

// Export to global scope
window.showSimpleModal = showSimpleModal;
window.closeSimpleModal = closeSimpleModal;
window.closeDynamicModal = closeDynamicModal;
window.showProductModal = showProductModal;

console.log('✅ Product modal module loaded');
