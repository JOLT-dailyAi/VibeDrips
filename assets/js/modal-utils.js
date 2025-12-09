// modal-utils.js - Shared modal utilities

// Close all modals
function closeAllModals() {
    // Close currency modal
    if (window.hideCurrencyModal) {
        window.hideCurrencyModal();
    }
    
    // Close product modal
    if (window.closeSimpleModal) {
        window.closeSimpleModal();
    }
    
    console.log('🔒 All modals closed');
}

// Export to global scope
window.closeAllModals = closeAllModals;

console.log('✅ Modal utilities loaded');
