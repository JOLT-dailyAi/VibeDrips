// filter-manager.js - EXACT COPY from main.js lines 392-442

// Set time filter and update UI
function setTimeFilter(filter) {
    VibeDrips.currentTimeFilter = filter;
    document.querySelectorAll('.time-category').forEach(c => c.classList.remove('active'));
    document.querySelector(`.time-category[data-filter="${filter}"]`).classList.add('active');
    filterProducts();
}

// Filter products
function filterProducts() {
    VibeDrips.filteredProducts = [...VibeDrips.allProducts];
    applyCurrentFilters();
    sortProducts();
    renderProducts();
}

// Apply current search and category filters
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

// Sort products
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

// Export to global scope
window.setTimeFilter = setTimeFilter;
window.filterProducts = filterProducts;
window.applyCurrentFilters = applyCurrentFilters;
window.sortProducts = sortProducts;
