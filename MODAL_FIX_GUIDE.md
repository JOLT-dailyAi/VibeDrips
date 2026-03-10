# Modal Refinement - Quick Reference

## Changes Needed in products.js (Line 419-632)

### Issues in Current Version:
1. ❌ Still has colons after labels (`Brand:`, `Price:`, etc.)
2. ❌ Missing discount badge
3. ❌ Missing value trimming (`.trim()`)
4. ❌ Not filtering timestamp
5. ❌ Not filtering Books for non-books
6. ❌ Wrong section order (Image after Core Info)
7. ❌ Product Details expanded by default (should be collapsed)

### Required Changes:

**Line 444-450**: Add discount variables
```javascript
const showDiscount = product.show_discount || false;
const discountPercent = product.computed_discount || 0;
```

**Line 465-496**: Replace entire Core Info section with:
```html
<!-- Brand Section (SEPARATE) -->
<div class="modal-brand-section">
    <div class="info-row">
        <span class="emoji">🏷️</span>
        <span class="label">Brand</span>
        <span class="value">${escapeHtml((product.brand || 'Unknown').trim())}</span>
    </div>
</div>

<!-- Image Gallery Section (BEFORE Category) -->
${images.length > 0 ? `
<div class="modal-image-gallery">
    <img src="${images[0]}" 
         alt="${escapeHtml(product.name)}" 
         style="max-width: 100%; max-height: 400px; border-radius: 12px; cursor: pointer;"
         onclick="openImageGallery_${productId}()">
    ${images.length > 1 ? `<p style="margin-top: 8px; opacity: 0.8; font-size: 13px;">Click to view ${images.length} images</p>` : ''}
</div>
` : ''}

<!-- Category Section (SEPARATE) -->
<div class="modal-category-section">
    <div class="info-row">
        <span class="emoji">📦</span>
        <span class="label">Category</span>
        <span class="value">${escapeHtml((product.category || 'General').trim())}</span>
    </div>
</div>

<!-- Price + Rating + Reviews Section -->
<div class="modal-core-info">
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
    ${rating > 0 ? `
    <div class="info-row">
        <span class="emoji">⭐</span>
        <span class="label">Rating</span>
        <span class="value">${rating.toFixed(1)} out of 5 stars</span>
    </div>
    ` : ''}
    ${reviewCount > 0 ? `
    <div class="info-row">
        <span class="emoji">👥</span>
        <span class="label">Reviews</span>
        <span class="value">${formatCountFull(reviewCount)} customer reviews</span>
    </div>
    ` : ''}
</div>
```

**Line 510-520**: Product Details - Change to COLLAPSED
```html
<span class="toggle-icon">▶</span>  <!-- NOT ▼ -->
</div>
<div class="modal-section-content">  <!-- NO "expanded" class -->
```

**Line 522-524**: Add `.trim()` to labels and values
```html
<span class="label">${escapeHtml((item.label || '').trim())}</span>
<span class="value">${escapeHtml((item.value || '').trim())}</span>
```

**Line 535**: Additional Info - Change to COLLAPSED
```html
<span class="toggle-icon">▶</span>  <!-- NOT ▼ -->
```

**Line 540-542**: Filter Books and Timestamp
```javascript
if (groupName === 'Books' && product.category !== 'Book') return '';
...
${items
    .filter(item => item.key !== 'Timestamp' && item.key !== 'timestamp')
    .map(item => `
```

**Line 545-546**: Add `.trim()` to Additional Info
```html
<span class="label">${escapeHtml((item.label || '').trim())}</span>
<span class="value">${escapeHtml((item.value || '').trim())}</span>
```

## Manual Fix Steps:
1. Open `products.js`
2. Find line 419 (`function showProductModal`)
3. Apply changes above
4. Save and test

Or use `modal-final.js` as reference for complete corrected version.
