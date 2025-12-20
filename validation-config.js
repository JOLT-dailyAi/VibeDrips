/**
 * Validation Configuration for VibeDrips Product Data
 * 
 * Add new validation rules here without touching convert-csv.js
 * Integrates with existing currency-based processing system
 */

module.exports = {
  // Field validation rules
  fields: {
    price: {
      required: false,
      type: 'number',
      min: 0,
      fallback: (data) => data.originalPrice || null,
      errorMessage: 'MISSING_PRICE: Set to originalPrice'
    },

    originalPrice: {
      required: false,
      type: 'number',
      min: 0,
      fallback: (data) => data.price || null,
      validate: (value, data) => {
        if (value && data.price && value < data.price) {
          return { 
            valid: false, 
            corrected: data.price, 
            reason: 'INVALID_ORIGINAL: originalPrice < price, normalized' 
          };
        }
        return { valid: true };
      }
    },

    discountPercentage: {
      required: false,
      type: 'number',
      min: 0,
      max: 100,
      tolerance: 1,
      computed: (data) => {
        const price = data.price || 0;
        const originalPrice = data.originalPrice || 0;
        
        if (originalPrice > price && price > 0) {
          return Math.round(((originalPrice - price) / originalPrice) * 100);
        }
        return 0;
      },
      validate: (value, data, computed) => {
        if (computed && value && Math.abs(value - computed) > 1) {
          return {
            valid: false,
            corrected: computed,
            reason: `DISCOUNT_MISMATCH: Scraped ${value}% vs expected ${computed}%`
          };
        }
        return { valid: true };
      }
    },

    availability: {
      required: true,
      type: 'string',
      allowedValues: ['In Stock', 'Currently Unavailable'],
      normalize: (value) => {
        if (!value || value === '') return 'In Stock';
        if (value === '0') return 'Currently Unavailable';
        if (value !== 'Currently Unavailable') return 'In Stock';
        return value;
      },
      cascade: (value, data) => {
        if (value === 'Currently Unavailable') {
          return { price: 0 };
        }
        return {};
      }
    }
  },

  // Global settings
  settings: {
    logAllErrors: true,
    generateStats: true
  }
};
