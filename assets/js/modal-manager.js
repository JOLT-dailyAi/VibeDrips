// modal-manager.js - EXACT COPY from main.js lines 263-275, 504-529

// modal-manager.js - Modal management with toggle and click-outside support

// Show/hide currency modal with toggle
function showCurrencyModal() {
    if (!VibeDrips.elements.currencyModal) return;
    
    const modal = VibeDrips.elements.currencyModal;
    const isVisible = !modal.classList.contains('hidden');
    
    // Toggle: if already visible, hide it
    if (isVisible) {
        hideCurrencyModal();
        return;
    }
    
    // Show modal
    modal.classList.remove('hidden');
    
    // Focus selector after animation
    setTimeout(() => {
        VibeDrips.elements.currencySelector?.focus();
    }, 300);
    
    // Add active state to currency button
    const currencyDisplay = document.querySelector('.currency-display');
    if (currencyDisplay) {
        currencyDisplay.classList.add('active');
    }
    
    // Add click-outside listener after a delay to prevent immediate closing
    setTimeout(() => {
        document.addEventListener('click', handleOutsideClick);
    }, 100);
}

function hideCurrencyModal() {
    if (!VibeDrips.elements.currencyModal) return;
    
    VibeDrips.elements.currencyModal.classList.add('hidden');
    
    // Remove active state from currency button
    const currencyDisplay = document.querySelector('.currency-display');
    if (currencyDisplay) {
        currencyDisplay.classList.remove('active');
    }
    
    // Remove click-outside listener
    document.removeEventListener('click', handleOutsideClick);
}

// Handle clicks outside the modal
function handleOutsideClick(event) {
    const modal = VibeDrips.elements.currencyModal;
    const currencyDisplay = document.querySelector('.currency-display');
    
    if (!modal || modal.classList.contains('hidden')) return;
    
    // Don't close if clicking inside modal or on the currency button
    const clickedInside = modal.contains(event.target);
    const clickedTrigger = currencyDisplay && currencyDisplay.contains(event.target);
    
    if (!clickedInside && !clickedTrigger) {
        hideCurrencyModal();
    }
}

// Close all modals
function closeAllModals() {
    hideCurrencyModal();
    closeSimpleModal();
}

// Close simple modal (for static modal with ID 'static-modal')
function closeSimpleModal() {
    if (VibeDrips.elements.staticModal) {
        VibeDrips.elements.staticModal.classList.add('hidden');
    }
}

// Helper function for URL currency selection
function selectCurrency(currencyCode) {
    if (VibeDrips.elements.currencySelector) {
        VibeDrips.elements.currencySelector.value = currencyCode;
        setCurrency();
        // Close modal after selection
        hideCurrencyModal();
    }
}

// Export to global scope
window.showCurrencyModal = showCurrencyModal;
window.hideCurrencyModal = hideCurrencyModal;
window.closeAllModals = closeAllModals;
window.closeSimpleModal = closeSimpleModal;
window.selectCurrency = selectCurrency;

