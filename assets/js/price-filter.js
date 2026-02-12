/* assets/js/price-filter.js - Minimalistic Dropdown Refinement */

window.VibeDripsPriceFilter = {
    config: null,
    currentMin: 0,
    currentMax: 0,
    rangeMin: 0,
    rangeMax: 0,
    currencySymbol: '',

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

            // Initial update based on current global currency
            if (window.VibeDrips && window.VibeDrips.currentCurrency) {
                this.updateForCurrency(window.VibeDrips.currentCurrency);
            }

            // Global Currency Switch Observer
            window.addEventListener('currencyChanged', (e) => {
                console.log('💱 Currency switch detected by Price Filter:', e.detail.currency);
                this.updateForCurrency(e.detail.currency);
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                const group = document.querySelector('.price-filter-group');
                if (group && !group.contains(e.target)) {
                    this.els.dropdown.classList.remove('active');
                }
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

        // Check if group already exists (prevent duplicates)
        let group = document.querySelector('.price-filter-group');
        if (!group) {
            group = document.createElement('div');
            group.className = 'filter-group price-filter-group';

            // Insert after category-filter group for logical flow
            const categoryFilter = document.getElementById('category-filter');
            const categoryGroup = categoryFilter ? categoryFilter.closest('.filter-group') : null;

            if (categoryGroup) {
                categoryGroup.after(group);
            } else {
                controls.appendChild(group);
            }
        }

        // Layout: [Min] --- [Slider] --- [Max]
        group.innerHTML = `
            <button class="price-filter-trigger" id="price-trigger">Price</button>
            <div class="price-filter-dropdown">
                <div class="price-filter-header">
                    <span class="price-filter-title">💸 Under the Bag</span>
                    <button class="price-reset-btn" id="price-reset">Reset</button>
                </div>
                <div class="price-minimal-row">
                    <!-- Left: Min Value -->
                    <div class="price-value-container">
                        <div class="price-value-box" id="price-min-display"></div>
                        <input type="number" class="price-value-input" id="price-min-input">
                    </div>
                    
                    <!-- Center: Slider Body -->
                    <div class="price-range-container">
                        <div class="price-sliders-wrapper">
                            <div class="price-slider-track" id="price-track"></div>
                        </div>
                        <input type="range" class="price-input-range" id="price-min-slider">
                        <input type="range" class="price-input-range" id="price-max-slider">
                    </div>

                    <!-- Right: Max Value -->
                    <div class="price-value-container">
                        <div class="price-value-box" id="price-max-display"></div>
                        <input type="number" class="price-value-input" id="price-max-input">
                    </div>
                </div>
            </div>
        `;

        // Cache elements
        this.els = {
            trigger: document.getElementById('price-trigger'),
            dropdown: group.querySelector('.price-filter-dropdown'),
            reset: document.getElementById('price-reset'),
            minDisplay: document.getElementById('price-min-display'),
            maxDisplay: document.getElementById('price-max-display'),
            minInput: document.getElementById('price-min-input'),
            maxInput: document.getElementById('price-max-input'),
            minSlider: document.getElementById('price-min-slider'),
            maxSlider: document.getElementById('price-max-slider'),
            track: document.getElementById('price-track')
        };

        // Attach events
        this.els.trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            this.els.dropdown.classList.toggle('active');
        });

        this.els.reset.addEventListener('click', () => this.reset());

        this.els.minSlider.addEventListener('input', () => this.handleSliderChange('min'));
        this.els.maxSlider.addEventListener('input', () => this.handleSliderChange('max'));

        // Inline editing logic
        this.els.minDisplay.addEventListener('click', () => this.toggleEdit('min', true));
        this.els.maxDisplay.addEventListener('click', () => this.toggleEdit('max', true));

        this.els.minInput.addEventListener('blur', () => this.toggleEdit('min', false));
        this.els.maxInput.addEventListener('blur', () => this.toggleEdit('max', false));

        this.els.minInput.addEventListener('change', () => this.handleInputChange('min'));
        this.els.maxInput.addEventListener('change', () => this.handleInputChange('max'));

        // Handle Enter key on inputs
        this.els.minInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') this.els.minInput.blur(); });
        this.els.maxInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') this.els.maxInput.blur(); });
    },

    /**
     * Update ranges based on selected currency
     */
    updateForCurrency(currency) {
        if (!this.config || !this.config.currencies[currency]) {
            console.warn('⚠️ No config found for currency:', currency);
            return;
        }

        const currencyConfig = this.config.currencies[currency];

        // Localized Currency Map
        const currencyMap = {
            'INR': '₹', 'USD': '$', 'EUR': '€', 'GBP': '£', 'JPY': '¥',
            'CAD': 'C$', 'AUD': 'A$', 'BRL': 'R$', 'MXN': '$', 'AED': 'د.إ',
            'SGD': 'S$', 'SAR': '﷼', 'SEK': 'kr', 'PLN': 'zł'
        };
        this.currencySymbol = currencyMap[currency] || currency;

        // Update trigger label with dynamic currency symbol
        this.els.trigger.textContent = `Price ${this.currencySymbol}`;

        // Map range keys
        this.rangeMin = currencyConfig.range_min !== undefined ? currencyConfig.range_min : currencyConfig.min;
        this.rangeMax = currencyConfig.range_max !== undefined ? currencyConfig.range_max : currencyConfig.max;

        // Set current selection to full range on currency switch
        this.currentMin = this.rangeMin;
        this.currentMax = this.rangeMax;

        // Update slider attributes
        this.els.minSlider.min = this.rangeMin;
        this.els.maxSlider.min = this.rangeMin;
        this.els.minSlider.max = this.rangeMax;
        this.els.maxSlider.max = this.rangeMax;
        this.els.minSlider.step = currencyConfig.step || 1;
        this.els.maxSlider.step = currencyConfig.step || 1;

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

        // Update human-readable labels
        this.els.minDisplay.textContent = `${this.currencySymbol}${this.currentMin.toLocaleString()}`;
        this.els.maxDisplay.textContent = `${this.currencySymbol}${this.currentMax.toLocaleString()}${this.currentMax >= this.rangeMax ? '+' : ''}`;

        // Update track highlight
        const range = this.rangeMax - this.rangeMin;
        const minPercent = range === 0 ? 0 : ((this.currentMin - this.rangeMin) / range) * 100;
        const maxPercent = range === 0 ? 100 : ((this.currentMax - this.rangeMin) / range) * 100;

        this.els.track.style.left = minPercent + '%';
        this.els.track.style.width = (maxPercent - minPercent) + '%';

        // Notify app to filter
        if (window.filterProducts) {
            window.filterProducts();
        }
    },

    /**
     * Toggle between label display and input field
     */
    toggleEdit(type, showInput) {
        const display = type === 'min' ? this.els.minDisplay : this.els.maxDisplay;
        const input = type === 'min' ? this.els.minInput : this.els.maxInput;

        if (showInput) {
            display.style.display = 'none';
            input.style.display = 'block';
            input.focus();
            input.select();
        } else {
            display.style.display = 'block';
            input.style.display = 'none';
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
        if (isNaN(p)) return true;
        return p >= this.currentMin && p <= this.currentMax;
    }
};

// Auto-init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => VibeDripsPriceFilter.init());
} else {
    VibeDripsPriceFilter.init();
}
