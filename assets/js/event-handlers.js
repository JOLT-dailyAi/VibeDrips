// event-handlers.js - EXACT COPY from main.js lines 62-84
function setupEventListeners() {
    document.querySelectorAll('.time-category').forEach(category => {
        category.addEventListener('click', function() {
            const filter = this.getAttribute('data-filter');
            setTimeFilter(filter);
        });
    });
    
    if (VibeDrips.elements.currencySelector) {
        VibeDrips.elements.currencySelector.addEventListener('change', setCurrency);
    }
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAllModals();
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            VibeDrips.elements.search?.focus();
        }
    });
    
    console.log('🎧 Event listeners set up');
}

// Export to global scope
window.setupEventListeners = setupEventListeners;
