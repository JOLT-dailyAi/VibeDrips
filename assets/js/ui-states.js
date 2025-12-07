// ui-states.js - EXACT COPY from main.js lines 444-502

// Show different UI states
function showLoadingState() {
    if (VibeDrips.elements.productsContainer) {
        VibeDrips.elements.productsContainer.innerHTML = `
            <div class="loading-state">
                <div class="loading-spinner"></div>
                <div>Loading your curated drops...</div>
            </div>
        `;
    }
}

function showComingSoonState() {
    if (VibeDrips.elements.productsContainer) {
        const availableList = VibeDrips.availableCurrencies
            .filter(c => c.code !== 'COMING_SOON')
            .map(c => `<a href="?currency=${c.code}" onclick="selectCurrency('${c.code}'); return false;">
                       ${c.symbol} ${c.name}</a>`)
            .join(' • ');

        VibeDrips.elements.productsContainer.innerHTML = `
            <div class="coming-soon-state">
                <div class="coming-soon-icon">⏳</div>
                <h3>Products Loading Soon</h3>
                <p>We're curating amazing drops for this region. Check back soon!</p>
                ${availableList ? `
                <div class="available-now">
                    <strong>Available Now:</strong><br>
                    ${availableList}
                </div>` : ''}
            </div>
        `;
    }
}

function showError(message) {
    if (VibeDrips.elements.productsContainer) {
        VibeDrips.elements.productsContainer.innerHTML = `
            <div class="error-state">
                <div class="error-icon">⚠️</div>
                <div class="error-message">${message}</div>
                <button onclick="location.reload()" class="retry-button">Retry</button>
            </div>
        `;
    }
}

// Fallback initialization
async function fallbackInitialization() {
    console.log('🆘 Running fallback initialization...');
    
    VibeDrips.currentCurrency = 'INR';
    
    if (VibeDrips.elements.currencyDisplay) {
        VibeDrips.elements.currencyDisplay.textContent = 'INR';
    }
    if (VibeDrips.elements.currencyTrigger) {
        VibeDrips.elements.currencyTrigger.textContent = 'INR';
    }
    
    showComingSoonState();
}

// Export to global scope
window.showLoadingState = showLoadingState;
window.showComingSoonState = showComingSoonState;
window.showError = showError;
window.fallbackInitialization = fallbackInitialization;
