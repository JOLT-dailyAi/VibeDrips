// currency-loader.js - EXACT COPY from main.js lines 147-275

// Detect user region using IP
async function detectUserRegion() {
    try {
        console.log('🌍 Detecting user region...');
        
        const response = await fetch(VibeDrips.config.ipApiUrl);
        if (!response.ok) throw new Error('IP API failed');
        
        const data = await response.json();
        VibeDrips.currentRegion = {
            country: data.country_name,
            countryCode: data.country_code,
            currency: data.currency
        };
        
        console.log('📍 Region detected:', VibeDrips.currentRegion);
        
        const detectedCurrency = VibeDrips.config.regionToCurrency[data.country_code] || 
                                 VibeDrips.config.regionToCurrency[data.country_name] || 
                                 data.currency;
        
        if (detectedCurrency) {
            VibeDrips.currentCurrency = detectedCurrency;
            console.log('💰 Currency detected:', detectedCurrency);
        }
        
    } catch (error) {
        console.warn('⚠️ Region detection failed, using fallback');
        VibeDrips.currentCurrency = VibeDrips.config.fallbackCurrency;
        VibeDrips.currentRegion = { country: 'India', countryCode: 'IN' };
    }
}

// HYBRID APPROACH: Load only available currencies
async function loadAvailableCurrencies() {
    try {
        console.log('💱 Loading available currencies...');
        
        const response = await fetch(`${VibeDrips.config.dataUrl}/currencies.json`);
        if (!response.ok) throw new Error('Failed to load currencies');
        
        const data = await response.json();
        const potentialCurrencies = data.available_currencies || [];
        
        const availableCurrencies = [];
        
        for (const currency of potentialCurrencies) {
            try {
                const testResponse = await fetch(`${VibeDrips.config.dataUrl}/${currency.filename}`, 
                    { method: 'HEAD' });
                
                if (testResponse.ok) {
                    availableCurrencies.push(currency);
                    console.log(`✅ ${currency.code} products available`);
                } else {
                    console.log(`⏳ ${currency.code} products coming soon`);
                }
            } catch (error) {
                console.log(`❌ ${currency.code} products not available`);
            }
        }
        
        if (availableCurrencies.length === 0) {
            availableCurrencies.push({
                code: 'COMING_SOON',
                name: 'Products Coming Soon',
                symbol: '⏳',
                product_count: 0,
                filename: 'none'
            });
        }
        
        VibeDrips.availableCurrencies = availableCurrencies;
        
        if (VibeDrips.elements.lastUpdated && data.last_updated) {
            const lastUpdated = new Date(data.last_updated);
            VibeDrips.elements.lastUpdated.textContent = lastUpdated.toLocaleDateString();
        }
        
        console.log(`💼 Found ${availableCurrencies.length} available currencies`);
        populateCurrencySelector();
        
    } catch (error) {
        console.error('❌ Failed to load currencies:', error);
        VibeDrips.availableCurrencies = [{
            code: 'INR',
            name: 'Indian Rupee',
            symbol: '₹',
            product_count: 0,
            filename: 'products-INR.json'
        }];
        populateCurrencySelector();
    }
}

// Populate currency selector with only available currencies
function populateCurrencySelector() {
    const selector = VibeDrips.elements.currencySelector;
    if (!selector) return;
    
    while (selector.children.length > 1) {
        selector.removeChild(selector.lastChild);
    }
    
    VibeDrips.availableCurrencies.forEach(currency => {
        const option = document.createElement('option');
        option.value = currency.code;
        
        if (currency.code === 'COMING_SOON') {
            option.textContent = `${currency.symbol} ${currency.name}`;
            option.disabled = true;
        } else {
            option.textContent = `${currency.code} - ${currency.name} (${currency.product_count} products)`;
        }
        
        selector.appendChild(option);
    });
    
    console.log('🎛️ Currency selector populated with available options');
}

// Initialize currency selection
async function initializeCurrency() {
    const detectedCurrency = VibeDrips.currentCurrency;
    const availableCodes = VibeDrips.availableCurrencies.map(c => c.code);
    
    if (detectedCurrency && availableCodes.includes(detectedCurrency)) {
        console.log(`🎯 Auto-selecting detected currency: ${detectedCurrency}`);
        VibeDrips.elements.currencySelector.value = detectedCurrency;
        await setCurrency();
    } else if (availableCodes.length > 0 && availableCodes[0] !== 'COMING_SOON') {
        console.log(`🎯 Auto-selecting first available: ${availableCodes[0]}`);
        VibeDrips.elements.currencySelector.value = availableCodes[0];
        await setCurrency();
    } else {
        showComingSoonState();
    }
}

// Set selected currency and load products
async function setCurrency() {
    const selector = VibeDrips.elements.currencySelector;
    if (!selector || !selector.value || selector.value === 'COMING_SOON') {
        showComingSoonState();
        return;
    }
    
    const selectedCurrency = selector.value;
    console.log(`💰 Currency selected: ${selectedCurrency}`);
    
    VibeDrips.currentCurrency = selectedCurrency;
    
    if (VibeDrips.elements.currencyDisplay) {
        VibeDrips.elements.currencyDisplay.textContent = selectedCurrency;
    }
    if (VibeDrips.elements.currencyTrigger) {
        VibeDrips.elements.currencyTrigger.textContent = selectedCurrency;
    }
    
    hideCurrencyModal();
    
    try {
        await loadProducts(selectedCurrency);
    } catch (error) {
        console.error('❌ Failed to load products:', error);
        showError('Failed to load products. Please try refreshing the page.');
    }
}

// Export to global scope
window.detectUserRegion = detectUserRegion;
window.loadAvailableCurrencies = loadAvailableCurrencies;
window.populateCurrencySelector = populateCurrencySelector;
window.initializeCurrency = initializeCurrency;
window.setCurrency = setCurrency;
