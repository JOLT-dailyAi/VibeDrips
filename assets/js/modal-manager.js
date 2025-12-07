// modal-manager.js - EXACT COPY from main.js lines 263-275, 504-529

// Show/hide currency modal
function showCurrencyModal() {
    if (VibeDrips.elements.currencyModal) {
        VibeDrips.elements.currencyModal.classList.remove('hidden');
        setTimeout(() => {
            VibeDrips.elements.currencySelector?.focus();
        }, 300);
    }
}

function hideCurrencyModal() {
    if (VibeDrips.elements.currencyModal) {
        VibeDrips.elements.currencyModal.classList.add('hidden');
    }
}

// Close all modals
function closeAllModals() {
    if (VibeDrips.elements.currencyModal) {
        VibeDrips.elements.currencyModal.classList.add('hidden');
    }
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
    }
}

// Export to global scope
window.showCurrencyModal = showCurrencyModal;
window.hideCurrencyModal = hideCurrencyModal;
window.closeAllModals = closeAllModals;
window.closeSimpleModal = closeSimpleModal;
window.selectCurrency = selectCurrency;
