// modal-manager.js - EXACT COPY from main.js lines 263-275, 504-529
// modal-manager.js - Modal management with toggle and click-outside support

// Show/hide currency modal with toggle
function showCurrencyModal() {
    const modal = document.getElementById('currency-modal');
    if (!modal) {
        console.error('❌ Currency modal not found!');
        return;
    }
    
    const isVisible = !modal.classList.contains('hidden');
    
    // Toggle: if already visible, hide it
    if (isVisible) {
        console.log('🔄 Toggling modal closed');
        hideCurrencyModal();
        return;
    }
    
    // Show modal
    console.log('✅ Opening modal');
    modal.classList.remove('hidden');
    
    // Focus selector after animation
    setTimeout(() => {
        const selector = document.getElementById('currency-selector');
        if (selector) selector.focus();
    }, 300);
    
    // Add active state to currency button
    const currencyDisplay = document.querySelector('.currency-display');
    if (currencyDisplay) {
        currencyDisplay.classList.add('active');
    }
    
    // Add click-outside listener after a delay
    setTimeout(() => {
        console.log('👂 Adding outside click listener');
        document.addEventListener('click', handleOutsideClick);
    }, 150); // Increased delay slightly
}

function hideCurrencyModal() {
    const modal = document.getElementById('currency-modal');
    if (!modal) return;
    
    console.log('❌ Closing modal');
    modal.classList.add('hidden');
    
    // Remove active state from currency button
    const currencyDisplay = document.querySelector('.currency-display');
    if (currencyDisplay) {
        currencyDisplay.classList.remove('active');
    }
    
    // Remove click-outside listener
    console.log('🔇 Removing outside click listener');
    document.removeEventListener('click', handleOutsideClick);
}

// Handle clicks outside the modal content
function handleOutsideClick(event) {
    const modal = document.getElementById('currency-modal');
    const currencyContent = document.querySelector('.currency-content'); // Inner content box
    const currencyDisplay = document.querySelector('.currency-display');
    
    if (!modal) return;
    
    // Check if modal is visible
    const isHidden = modal.classList.contains('hidden');
    if (isHidden) return;
    
    // Don't close if clicking inside the content box or on the currency button
    const clickedInside = currencyContent && currencyContent.contains(event.target);
    const clickedTrigger = currencyDisplay && currencyDisplay.contains(event.target);
    
    console.log('🖱️ Click detected:', {
        clickedInside,
        clickedTrigger,
        targetClass: event.target.className
    });
    
    if (!clickedInside && !clickedTrigger) {
        console.log('💥 Clicked outside content! Closing modal...');
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
    const staticModal = document.getElementById('static-modal');
    if (staticModal) {
        staticModal.classList.add('hidden');
    }
}

// Helper function for URL currency selection
function selectCurrency(currencyCode) {
    const selector = document.getElementById('currency-selector');
    if (selector) {
        selector.value = currencyCode;
        if (window.setCurrency) {
            window.setCurrency();
        }
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
