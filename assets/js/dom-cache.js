// dom-cache.js - EXACT COPY from main.js lines 33-60
function cacheElements() {
    const elements = VibeDrips.elements;

    elements.currencyModal = document.getElementById('currency-modal');
    elements.currencySelector = document.getElementById('currency-selector');
    elements.currencyDisplay = document.getElementById('currency-display');
    elements.currencyTrigger = document.getElementById('currency-trigger');
    elements.productsContainer = document.getElementById('products-container');
    elements.sectionTitle = document.getElementById('section-title');
    elements.sectionSubtitle = document.getElementById('section-subtitle');
    elements.productCount = document.getElementById('product-count');
    elements.categoryCount = document.getElementById('category-count');
    elements.lastUpdated = document.getElementById('last-updated');
    elements.search = document.getElementById('search');
    elements.discoverySelect = document.getElementById('discovery-select');
    elements.priceSort = document.getElementById('price-sort');
    elements.themeToggle = document.getElementById('theme-toggle');
    elements.staticModal = document.getElementById('static-modal');

    console.log('📋 DOM elements cached');
}

// Export to global scope
window.cacheElements = cacheElements;
