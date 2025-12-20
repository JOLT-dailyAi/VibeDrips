/**
 * Validation Configuration for Product Data
 * 
 * Add new fields here without touching convert-csv.js
 * Each field can have: type, required, default, normalize, validate, computed, cascade
 */

module.exports = {
  // Field definitions with validation rules
  fields: {
    asin: {
      required: true,
      type: 'string',
      errorMessage: 'MISSING_ASIN: Required field'
    },

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
        // Case: originalPrice < price → invalid
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
        // Cross-check scraped discount with computed discount
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
        if (!value || value === '') {
          return 'In Stock';
        }
        if (value === '0') {
          return 'Currently Unavailable';
        }
        if (value !== 'Currently Unavailable') {
          return 'In Stock';
        }
        return value;
      },
      cascade: (value, data) => {
        // If unavailable, force price to 0
        if (value === 'Currently Unavailable') {
          return { price: 0 };
        }
        return {};
      }
    },

    title: {
      required: true,
      type: 'string',
      sourceFields: ['productTitle', 'Title', 'title'],
      normalize: (value) => {
        if (!value) return 'Untitled Product';
        return value
          .replace(/\s+/g, ' ')
          .trim()
          .substring(0, 200); // Limit to 200 chars
      },
      errorMessage: 'MISSING_TITLE: Using fallback'
    },

    brand: {
      required: false,
      type: 'string',
      default: 'Generic',
      normalize: (value) => {
        if (!value) return 'Generic';
        return value.replace(/^(Brand:|Visit the|by)\s*/i, '').trim();
      }
    },

    rating: {
      required: false,
      type: 'number',
      min: 0,
      max: 5,
      default: 0,
      sourceFields: ['Rating', 'rating', 'customerRating'],
      normalize: (value) => {
        if (!value) return 0;
        const parsed = parseFloat(String(value).match(/[\d.]+/)?.[0] || 0);
        return Math.min(Math.max(parsed, 0), 5);
      }
    },

    reviewCount: {
      required: false,
      type: 'number',
      min: 0,
      default: 0,
      sourceFields: ['reviewCount', 'ReviewCount'],
      normalize: (value) => {
        if (!value) return 0;
        const parsed = parseInt(String(value).replace(/[^\d]/g, ''), 10);
        return isNaN(parsed) ? 0 : parsed;
      }
    },

    // Example: Easy to add future fields
    /*
    warranty_period: {
      required: false,
      type: 'string',
      default: 'N/A',
      allowedValues: ['1 Year', '2 Years', 'Lifetime', 'N/A'],
      validate: (value) => {
        const validPeriods = ['1 Year', '2 Years', 'Lifetime', 'N/A'];
        if (!validPeriods.includes(value)) {
          return { valid: false, corrected: 'N/A', reason: 'INVALID_WARRANTY' };
        }
        return { valid: true };
      }
    }
    */
  },

  // Global validation settings
  settings: {
    skipInvalidRecords: false, // Set to true to skip instead of correcting
    logAllErrors: true,
    generateStats: true
  }
};
