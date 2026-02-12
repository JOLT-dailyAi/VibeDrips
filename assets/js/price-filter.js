/* assets/js/price-filter.js */

window.VibeDripsPriceFilter = {
    config: null,
    currentMin: 0,
    currentMax: 0,
    rangeMin: 0,
    rangeMax: 0,

    /**
     * Initialize the price filter component
     */
    async init() {
        console.log('💸 Initializing Price Filter...');
        try {
            const response = await fetch('./data/UnderTheBag.json');
            const data = await response.json();
            this.config = data.config;

            this.setupUI();
            this.updateForCurrency(window.VibeDrips.currentCurrency);

            // Listen for currency changes
            window.addEventListener('currencyChanged', (e) => {
                this.updateForCurrency(e.detail.currency);
            });
        } catch (error) {
            console.error('❌ Failed to load UnderTheBag.json:', error);
        }
    },

    /**
     * Setup the HTML structure for the price filter
     */
    setupUI() {
        const controls = document.querySelector('.filter-controls');
        if (!controls) return;

        // Create the group
        const group = document.createElement('div');
        group.className = 'filter-group price-filter-group';
        group.innerHTML = `
            <div class="price-filter-header">
                <span class="price-filter-label">Budget Range</span>
                <button class="price-reset-btn" onclick="VibeDripsPriceFilter.reset()">Reset</button>
            </div>
            <div class="price-range-container">
                <div class="price-sliders-wrapper">
                    <div class="price-slider-track" id="price-track"></div>
                </div>
                <input type="range" class="price-input-range" id="price-min-slider" step="1">
                <input type="range" class="price-input-range" id="price-max-slider" step="1">
            </div>
            <div class="price-values-row">
                <input type="number" class="price-input-field" id="price-min-input">
                <span class="price-separator">to</span>
                <input type="number" class="price-input-field" id="price-max-input">
            </div>
        `;

        // Insert after category-filter group
        const categoryGroup = document.getElementById('category-filter').closest('.filter-group');
        if (categoryGroup) {
            categoryGroup.after(group);
        } else {
            controls.appendChild(group);
        }

        // Cache elements
        this.els = {
            minSlider: document.getElementById('price-min-slider'),
            maxSlider: document.getElementById('price-max-slider'),
            minInput: document.getElementById('price-min-input'),
            maxInput: document.getElementById('price-max-input'),
            track: document.getElementById('price-track')
        };

        // Attach events
        this.els.minSlider.addEventListener('input', () => this.handleSliderChange('min'));
        this.els.maxSlider.addEventListener('input', () => this.handleSliderChange('max'));
        this.els.minInput.addEventListener('change', () => this.handleInputChange('min'));
        this.els.maxInput.addEventListener('change', () => this.handleInputChange('max'));
    },

    /**
     * Update ranges based on selected currency
     */
    updateForCurrency(currency) {
        if (!this.config || !this.config.currencies[currency]) {
            // Fallback to hiding filter if currency not supported
            const group = document.querySelector('.price-filter-group');
            if (group) group.style.display = 'none';
            return;
        }

        const currencyConfig = this.config.currencies[currency];
        const group = document.querySelector('.price-filter-group');
        if (group) group.style.display = 'flex';

        this.rangeMin = currencyConfig.range_min;
        this.rangeMax = currencyConfig.range_max;
        this.currentMin = currencyConfig.user_min;
        this.currentMax = currencyConfig.user_max;

        // Update slider attributes
        this.els.minSlider.min = this.rangeMin;
        this.els.maxSlider.min = this.rangeMin;
        this.els.minSlider.max = this.rangeMax;
        this.els.maxSlider.max = this.rangeMax;
        this.els.minSlider.step = currencyConfig.step;
        this.els.maxSlider.step = currencyConfig.step;

        this.syncUI();
    },

    /**
     * Synchronize sliders and input boxes
     */
    syncUI() {
        this.els.minSlider.value = this.currentMin;
        this.els.maxSlider.value = this.currentMax;
        this.els.minInput.value = this.currentMin;
        this.els.maxInput.value = this.currentMax;

        // Update track highlight
        const minPercent = ((this.currentMin - this.rangeMin) / (this.rangeMax - this.rangeMin)) * 100;
        const maxPercent = ((this.currentMax - this.rangeMin) / (this.rangeMax - this.rangeMin)) * 100;

        this.els.track.style.left = minPercent + '%';
        this.els.track.style.width = (maxPercent - minPercent) + '%';

        // Notify app to filter
        if (window.filterProducts) {
            window.filterProducts();
        }
    },

    /**
     * Handle slider movement
     */
    handleSliderChange(type) {
        let minVal = parseInt(this.els.minSlider.value);
        let maxVal = parseInt(this.els.maxSlider.value);

        if (type === 'min' && minVal > maxVal) {
            this.els.minSlider.value = maxVal;
            minVal = maxVal;
        } else if (type === 'max' && maxVal < minVal) {
            this.els.maxSlider.value = minVal;
            maxVal = minVal;
        }

        this.currentMin = minVal;
        this.currentMax = maxVal;
        this.syncUI();
    },

    /**
     * Handle direct input field changes
     */
    handleInputChange(type) {
        let val = parseInt(type === 'min' ? this.els.minInput.value : this.els.maxInput.value);

        if (isNaN(val)) {
            val = type === 'min' ? this.rangeMin : this.rangeMax;
        }

        // Clamp
        val = Math.max(this.rangeMin, Math.min(this.rangeMax, val));

        if (type === 'min') {
            this.currentMin = Math.min(val, this.currentMax);
        } else {
            this.currentMax = Math.max(val, this.currentMin);
        }

        this.syncUI();
    },

    /**
     * Reset to default range
     */
    reset() {
        this.currentMin = this.rangeMin;
        this.currentMax = this.rangeMax;
        this.syncUI();
    },

    /**
     * Check if a product price is within the current range
     */
    matches(price) {
        const p = parseFloat(price);
        if (isNaN(p)) return true; // Show items with invalid price if any
        return p >= this.currentMin && p <= this.currentMax;
    }
};

// Auto-init when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Wait for main core data to be ready
    const checkInit = setInterval(() => {
        if (window.VibeDrips && window.VibeDrips.currentCurrency) {
            VibeDripsPriceFilter.init();
            clearInterval(checkInit);
        }
    }, 100);
});
