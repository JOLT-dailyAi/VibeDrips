// currency-modal.js - Currency selection modal management

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
        console.log('🔄 Toggling currency modal closed');
        hideCurrencyModal();
        return;
    }
    
    // Show modal
    console.log('✅ Opening currency modal');
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
        console.log('👂 Adding currency modal outside click listener');
        document.addEventListener('click', handleCurrencyOutsideClick);
    }, 150);
}

function hideCurrencyModal() {
    const modal = document.getElementById('currency-modal');
    if (!modal) return;
    
    console.log('❌ Closing currency modal');
    modal.classList.add('hidden');
    
    // Remove active state from currency button
    const currencyDisplay = document.querySelector('.currency-display');
    if (currencyDisplay) {
        currencyDisplay.classList.remove('active');
    }
    
    // Remove click-outside listener
    console.log('🔇 Removing currency modal outside click listener');
    document.removeEventListener('click', handleCurrencyOutsideClick);
}

// Handle clicks outside the currency modal content
function handleCurrencyOutsideClick(event) {
    const modal = document.getElementById('currency-modal');
    const currencyContent = document.querySelector('.currency-content');
    const currencyDisplay = document.querySelector('.currency-display');
    
    if (!modal) return;
    
    // Check if modal is visible
    const isHidden = modal.classList.contains('hidden');
    if (isHidden) return;
    
    // Don't close if clicking inside the content box or on the currency button
    const clickedInside = currencyContent && currencyContent.contains(event.target);
    const clickedTrigger = currencyDisplay && currencyDisplay.contains(event.target);
    
    console.log('🖱️ Currency modal click detected:', {
        clickedInside,
        clickedTrigger,
        targetClass: event.target.className
    });
    
    if (!clickedInside && !clickedTrigger) {
        console.log('💥 Clicked outside currency modal content! Closing...');
        hideCurrencyModal();
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
window.selectCurrency = selectCurrency;

console.log('✅ Currency modal module loaded');
