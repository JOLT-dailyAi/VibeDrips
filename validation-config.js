/**
 * Validation Configuration for VibeDrips Product Data
 * 
 * Add new validation rules here without touching convert-csv.js
 * Integrates with existing currency-based processing system
 * 
 * @author VibeDrips Team
 * @version 1.0.0
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
        // Case: originalPrice < price → invalid, normalize to price
        if (value && data.price && value < data.price) {
          return { 
            valid: false, 
            corrected: data.price, 
            reason: 'INVALID_ORIGINAL: originalPrice < price, normalized to price' 
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
      tolerance: 1, // ±1% tolerance for mismatch detection
      computed: (data) => {
        const price = data.price || 0;
        const originalPrice = data.originalPrice || 0;
        
        if (originalPrice > price && price > 0) {
          return Math.round(((originalPrice - price) / originalPrice) * 100);
        }
        return 0;
      },
      validate: (value, data, computed) => {
        // Cross-check scraped discount with computed discount (±1% tolerance)
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
        // If unavailable, force price to 0 (won't display in UI)
        if (value === 'Currently Unavailable') {
          return { price: 0 };
        }
        return {};
      }
    }
  },

  // Global validation settings
  settings: {
    logAllErrors: true,
    generateStats: true
  },

  /**
   * Future field examples (uncomment to enable):
   * 
   * warranty_period: {
   *   required: false,
   *   type: 'string',
   *   default: 'N/A',
   *   allowedValues: ['1 Year', '2 Years', 'Lifetime', 'N/A'],
   *   validate: (value) => {
   *     const validPeriods = ['1 Year', '2 Years', 'Lifetime', 'N/A'];
   *     if (!validPeriods.includes(value)) {
   *       return { valid: false, corrected: 'N/A', reason: 'INVALID_WARRANTY' };
   *     }
   *     return { valid: true };
   *   }
   * },
   * 
   * shipping_weight: {
   *   required: false,
   *   type: 'number',
   *   min: 0,
   *   max: 100000, // 100kg max
   *   normalize: (value) => {
   *     // Convert grams to kg if needed
   *     if (value > 1000) return value / 1000;
   *     return value;
   *   }
   * }
   */
};
