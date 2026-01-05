const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const validationConfig = require('./validation-config.js');

const dataDir = path.join(__dirname, 'data');

// Currency mapping for supported countries/regions
const CURRENCY_MAP = {
  'INR': { symbol: '₹', countries: ['India'], name: 'Indian Rupee' },
  'USD': { symbol: '$', countries: ['United States'], name: 'US Dollar' },
  'EUR': { symbol: '€', countries: ['Germany', 'France', 'Italy', 'Spain', 'Netherlands', 'Belgium', 'Ireland'], name: 'Euro' },
  'GBP': { symbol: '£', countries: ['United Kingdom'], name: 'British Pound' },
  'JPY': { symbol: '¥', countries: ['Japan'], name: 'Japanese Yen' },
  'CAD': { symbol: 'C$', countries: ['Canada'], name: 'Canadian Dollar' },
  'AUD': { symbol: 'A$', countries: ['Australia'], name: 'Australian Dollar' },
  'BRL': { symbol: 'R$', countries: ['Brazil'], name: 'Brazilian Real' },
  'MXN': { symbol: '$', countries: ['Mexico'], name: 'Mexican Peso' },
  'AED': { symbol: 'د.إ', countries: ['United Arab Emirates'], name: 'UAE Dirham' },
  'SGD': { symbol: 'S$', countries: ['Singapore'], name: 'Singapore Dollar' },
  'SAR': { symbol: '﷼', countries: ['Saudi Arabia'], name: 'Saudi Riyal' },
  'SEK': { symbol: 'kr', countries: ['Sweden'], name: 'Swedish Krona' },
  'PLN': { symbol: 'zł', countries: ['Poland'], name: 'Polish Zloty' }
};

// Currency symbol detection patterns
const CURRENCY_PATTERNS = {
  '₹': 'INR',
  '$': 'USD',
  '€': 'EUR',
  '£': 'GBP',
  '¥': 'JPY',
  'C$': 'CAD',
  'A$': 'AUD',
  'R$': 'BRL',
  'د.إ': 'AED',
  'S$': 'SGD',
  '﷼': 'SAR',
  'kr': 'SEK',
  'zł': 'PLN'
};

// ============================================
// DYNAMIC FIELD CLASSIFICATION SYSTEM
// ============================================

const FIELD_CONFIG = {
  // Meta-data fields that should NEVER display
  METADATA_PATTERNS: [
    'Timestamp', 'timestamp',
    'Product Source Link', 'source_link',
    'Amazon SiteStripe (Short)', 'amazon_short',
    'Amazon SiteStripe (Long)', 'amazon_long',
    'Reference Media for similar products', 'reference_media', 'referenceMedia',
    'Error-Flag', 'Error-Reason', 'Error-Fields',
    'regional_availability', 'regional_variants',
    'featured', 'trending',
    /^asin$/i,
    /affiliate.*link/i,
    /sitestripe/i,
    /_id$/i,
    /^id$/i
  ],
  
  // Core display fields (handled by modal header/pricing section)
  CORE_FIELDS: [
    'productTitle', 'Title', 'name',
    'brand',
    'Currency', 'symbol', 'currency',
    'price', 'originalPrice', 'discountPercentage', 'display_price', 'original_price', 'discount_percentage',
    'availability',
    'MainImage', 'AllImages', 'all_images', 'main_image',
    'customerRating', 'Rating', 'customer_rating',
    'reviewCount', 'ReviewCount', 'review_count',
    'Description', 'description',
    'Category', 'categoryHierarchy', 'category', 'subcategory', 'itemTypeName',
    'productType', 'product_type'
  ],
  
  // Product Details (Priority display - NO EMOJIS)
  PRODUCT_DETAILS_KEYWORDS: {
    weight: { label: 'Weight', priority: 1, patterns: [/weight/i] },
    dimensions: { label: 'Dimensions', priority: 1, patterns: [/dimension/i, /size/i] },
    color: { label: 'Color', priority: 1, patterns: [/colou?r/i] },
    material: { label: 'Material', priority: 1, patterns: [/material/i, /fabric/i] },
    origin: { label: 'Made in', priority: 2, patterns: [/country.*origin/i, /made.*in/i, /origin/i] }
  },
  
  // Additional Info categories (NO EMOJIS)
  ADDITIONAL_INFO_CATEGORIES: {
    'Manufacturing': {
      patterns: [/manufacturer/i, /packer/i, /importer/i, /imported.*by/i]
    },
    'Technical': {
      patterns: [/model/i, /voltage/i, /wattage/i, /battery/i, /connectivity/i, /noise/i, /power/i, /frequency/i, /charging/i, /capacity/i]
    },
    'Books': {
      patterns: [/isbn/i, /publisher/i, /reading.*age/i, /hardcover/i, /paperback/i, /pages/i, /language/i, /edition/i, /author/i]
    },
    'Product Specs': {
      patterns: [/theme/i, /character/i, /pieces/i, /count/i, /age/i, /component/i, /feature/i, /pattern/i, /finish/i, /style/i, /occasion/i]
    },
    'Care Instructions': {
      patterns: [/care/i, /wash/i, /clean/i, /maintenance/i, /instruction/i]
    }
  },
  
  // Field aliases (map multiple CSV columns to canonical field)
  FIELD_ALIASES: {
    'weight': ['weight', 'itemweight', 'productweight', 'netweight'],
    'dimensions': ['dimensions', 'productdimensions', 'itemdimensionslxwxh', 'size'],
    'color': ['color', 'colour', 'colorname', 'itemcolor'],
    'origin': ['countryoforigin', 'madein', 'origin'],
    'model': ['modelname', 'itemmodelnumber', 'modelnumber', 'model']
  }
};

// ============================================
// DROPS SYSTEM (Emojis for badges/tags only)
// ============================================

const DROPS_CONFIG = {
  THRESHOLDS: {
    HIGH_VISIBILITY_MEDIA_COUNT: 2,
    MULTI_REGION_THRESHOLD: 2,
    INFLUENCER_KEYWORDS: [
      'instagram.com/reel',
      'youtube.com/shorts',
      'tiktok.com',
      '@',
      'influencer'
    ]
  },
  
  CATEGORIES: {
    'creator-picks': {
      label: 'Creator Picks',
      emoji: '🎬',
      subtitle: 'Featured by content creators',
      priority: 1
    },
    'global-drops': {
      label: 'Global Drops',
      emoji: '🌍',
      subtitle: 'Available across regions',
      priority: 2
    },
    'viral-reels': {
      label: 'Viral Reels',
      emoji: '📱',
      subtitle: 'Trending on social platforms',
      priority: 3
    },
    'hot-this-month': {
      label: 'Hot This Month',
      emoji: '🔥',
      subtitle: 'Latest drops',
      priority: 4
    }
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function isMetadataField(fieldName) {
  return FIELD_CONFIG.METADATA_PATTERNS.some(pattern => {
    if (pattern instanceof RegExp) {
      return pattern.test(fieldName);
    }
    return fieldName === pattern || fieldName.toLowerCase() === pattern.toLowerCase();
  });
}

function isCoreField(fieldName) {
  return FIELD_CONFIG.CORE_FIELDS.some(core => 
    fieldName === core || fieldName.toLowerCase() === core.toLowerCase()
  );
}

function isEmptyValue(value) {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') {
    const trimmed = value.trim().toLowerCase();
    const emptyPatterns = ['', 'not specified', 'n/a', 'na', 'null', 'undefined', 'none', '-', '--'];
    return emptyPatterns.includes(trimmed);
  }
  if (typeof value === 'number') return value === 0;
  return false;
}

function resolveFieldAlias(fieldName) {
  const lowerField = fieldName.toLowerCase().replace(/[_\s-]/g, '');
  
  for (const [canonical, aliases] of Object.entries(FIELD_CONFIG.FIELD_ALIASES)) {
    if (aliases.some(alias => lowerField.includes(alias.toLowerCase().replace(/[_\s-]/g, '')))) {
      return canonical;
    }
  }
  return fieldName;
}

function normalizeValueForComparison(value) {
  if (typeof value !== 'string') return String(value).toLowerCase().trim();
  
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[,]/g, '')
    .replace(/(\d+\.?\d*)\s*(kg|g|lb|oz|cm|mm|inch|in)/gi, (match, num, unit) => {
      const number = parseFloat(num);
      const lowerUnit = unit.toLowerCase();
      
      if (['kg', 'kilogram'].includes(lowerUnit)) return `${number * 1000}g`;
      if (['lb', 'pound'].includes(lowerUnit)) return `${number * 453.592}g`;
      if (['oz', 'ounce'].includes(lowerUnit)) return `${number * 28.3495}g`;
      if (['mm', 'millimeter'].includes(lowerUnit)) return `${number / 10}cm`;
      if (['inch', 'in'].includes(lowerUnit)) return `${number * 2.54}cm`;
      
      return `${number}${lowerUnit}`;
    });
}

function isValueInCoreFields(value, coreProductData) {
  if (!value || isEmptyValue(value)) return false;
  
  const normalizedValue = normalizeValueForComparison(value);
  const title = normalizeValueForComparison(coreProductData.name || '');
  const description = normalizeValueForComparison(coreProductData.description || '');
  
  if (normalizedValue.length > 3) {
    return title.includes(normalizedValue) || description.includes(normalizedValue);
  }
  
  return false;
}

function detectProductDetail(fieldName, value) {
  if (isEmptyValue(value)) return null;
  
  const canonicalField = resolveFieldAlias(fieldName);
  
  for (const [key, config] of Object.entries(FIELD_CONFIG.PRODUCT_DETAILS_KEYWORDS)) {
    if (canonicalField === key || config.patterns.some(pattern => pattern.test(fieldName))) {
      return {
        key: canonicalField,
        label: config.label,
        value: value,
        priority: config.priority
      };
    }
  }
  return null;
}

function detectAdditionalInfoCategory(fieldName) {
  for (const [category, config] of Object.entries(FIELD_CONFIG.ADDITIONAL_INFO_CATEGORIES)) {
    const matches = config.patterns.some(pattern => pattern.test(fieldName));
    if (matches) {
      return { category };
    }
  }
  return { category: 'Other' };
}

function humanizeFieldName(fieldName) {
  return fieldName
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
    .trim();
}

function structureProductData(rawData, coreProductData) {
  const productDetails = [];
  const additionalInfo = [];
  const seenLabels = new Set();
  const seenValues = new Map();
  const errorFields = [];
  
  Object.keys(rawData).forEach(fieldName => {
    const value = rawData[fieldName];
    
    if (isMetadataField(fieldName)) return;
    if (isCoreField(fieldName)) return;
    if (isEmptyValue(value)) return;
    
    const canonicalField = resolveFieldAlias(fieldName);
    const normalizedValue = normalizeValueForComparison(value);
    
    // Check for value already in title/description
    if (isValueInCoreFields(value, coreProductData)) {
      errorFields.push(fieldName);
      console.warn(`⚠️ Redundant field "${fieldName}": value already in title/description`);
      return;
    }
    
    // Check for metadata leaked into wrong field
    const metadataKeywords = ['http', 'www', 'amazon', 'asin', 'timestamp'];
    if (metadataKeywords.some(kw => normalizedValue.includes(kw))) {
      errorFields.push(fieldName);
      console.warn(`⚠️ Metadata leaked into field "${fieldName}": ${value}`);
      return;
    }
    
    const productDetail = detectProductDetail(fieldName, value);
    if (productDetail) {
      const canonicalKey = canonicalField.toLowerCase();
      
      // Value-based deduplication with conflict detection
      if (seenValues.has(canonicalKey)) {
        const existing = seenValues.get(canonicalKey);
        const existingNormalized = normalizeValueForComparison(existing.value);
        
        if (existingNormalized !== normalizedValue) {
          errorFields.push(fieldName);
          console.warn(`⚠️ CONFLICT in ${canonicalField}:`);
          console.warn(`   ${existing.source}: "${existing.value}"`);
          console.warn(`   ${fieldName}: "${value}"`);
          console.warn(`   → Keeping first value`);
        }
        return;
      }
      
      const labelKey = productDetail.label.toLowerCase();
      if (!seenLabels.has(labelKey)) {
        productDetails.push(productDetail);
        seenLabels.add(labelKey);
        seenValues.set(canonicalKey, { value, source: fieldName });
      }
      return;
    }
    
    // Additional Info
    const { category } = detectAdditionalInfoCategory(fieldName);
    const label = humanizeFieldName(fieldName);
    const labelKey = label.toLowerCase();
    const canonicalKey = canonicalField.toLowerCase();
    
    if (seenValues.has(canonicalKey)) {
      const existing = seenValues.get(canonicalKey);
      const existingNormalized = normalizeValueForComparison(existing.value);
      
      if (existingNormalized !== normalizedValue) {
        errorFields.push(fieldName);
        console.warn(`⚠️ CONFLICT in ${canonicalField}:`);
        console.warn(`   ${existing.source}: "${existing.value}"`);
        console.warn(`   ${fieldName}: "${value}"`);
      }
      return;
    }
    
    if (!seenLabels.has(labelKey)) {
      additionalInfo.push({
        key: fieldName,
        label,
        category,
        value
      });
      seenLabels.add(labelKey);
      seenValues.set(canonicalKey, { value, source: fieldName });
    }
  });
  
  productDetails.sort((a, b) => a.priority - b.priority);
  
  const groupedAdditionalInfo = {};
  additionalInfo.forEach(item => {
    if (!groupedAdditionalInfo[item.category]) {
      groupedAdditionalInfo[item.category] = [];
    }
    groupedAdditionalInfo[item.category].push(item);
  });
  
  const structured = {
    ...coreProductData,
    productDetails,
    additionalInfo: groupedAdditionalInfo
  };
  
  // Merge error fields from pricing validation and field processing
  const existingErrorFields = coreProductData['Error-Fields'] || [];
  const allErrorFields = [...new Set([...existingErrorFields, ...errorFields])];
  
  if (allErrorFields.length > 0) {
    structured['Error-Flag'] = 1;
    structured['Error-Fields'] = allErrorFields;
  }
  
  return structured;
}

// ============================================
// DROPS SIGNAL COMPUTATION
// ============================================

function detectInfluencerPresence(data, sourceLink, referenceMedia) {
  if (data.Influencer && data.Influencer.trim() !== '') {
    return true;
  }
  
  const allLinks = [sourceLink, ...(referenceMedia || [])].filter(Boolean);
  
  return allLinks.some(link => {
    return DROPS_CONFIG.THRESHOLDS.INFLUENCER_KEYWORDS.some(keyword => 
      link.toLowerCase().includes(keyword.toLowerCase())
    );
  });
}

function computeDropCategories(signals) {
  const categories = [];
  
  if (signals.is_social_proof || signals.is_high_visibility) {
    categories.push('creator-picks');
  }
  
  if (signals.is_global) {
    categories.push('global-drops');
  }
  
  if (signals.is_high_visibility && signals.is_social_proof) {
    categories.push('viral-reels');
  }
  
  if (signals.is_this_month) {
    categories.push('hot-this-month');
  }
  
  return categories;
}

function computeDropSignals(data, referenceMedia, regionalVariants) {
  const sourceLink = data['Product Source Link'] || '';
  
  const has_reference_media = referenceMedia && referenceMedia.length > 1;
  const media_count = referenceMedia ? referenceMedia.length : (sourceLink ? 1 : 0);
  
  const available_regions = regionalVariants ? Object.keys(regionalVariants) : [];
  const regional_availability = available_regions.length > 0;
  
  const influencer_presence = detectInfluencerPresence(data, sourceLink, referenceMedia);
  
  const is_global = regional_availability && available_regions.length >= DROPS_CONFIG.THRESHOLDS.MULTI_REGION_THRESHOLD;
  const is_high_visibility = media_count >= DROPS_CONFIG.THRESHOLDS.HIGH_VISIBILITY_MEDIA_COUNT;
  const is_social_proof = influencer_presence;
  
  const timestamp = data.Timestamp ? new Date(data.Timestamp) : new Date();
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const is_this_month = timestamp.getMonth() === currentMonth && timestamp.getFullYear() === currentYear;
  
  return {
    has_reference_media,
    media_count,
    regional_availability,
    available_regions,
    influencer_presence,
    is_global,
    is_high_visibility,
    is_social_proof,
    is_this_month,
    drop_categories: computeDropCategories({
      is_global,
      is_high_visibility,
      is_social_proof,
      is_this_month,
      influencer_presence
    })
  };
}

// ============================================
// VALIDATION SYSTEM
// ============================================

function parsePrice(val) {
  if (!val || val === '' || val === 'Not Specified' || val === '0') return null;
  const cleaned = String(val).replace(/[^\d.]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
}

function validateField(fieldName, rules, data, allNormalized = {}) {
  let value = data[fieldName];
  let errorFlag = 0;
  let errorReason = '';
  let errorFields = [];

  if (rules.type === 'number') {
    value = parsePrice(value);
  }

  if (rules.normalize) {
    value = rules.normalize(value, data);
  }

  let computedValue = null;
  if (rules.computed) {
    computedValue = rules.computed({ ...data, ...allNormalized });
    if (!value && value !== 0) {
      value = computedValue;
    }
  }

  if (rules.validate) {
    const result = rules.validate(value, { ...data, ...allNormalized }, computedValue);
    if (!result.valid) {
      errorFlag = 1;
      errorReason = result.reason;
      errorFields.push(fieldName);
      value = result.corrected !== undefined ? result.corrected : value;
    }
  }

  if ((value === null || value === undefined || value === '') && rules.fallback) {
    const fallbackValue = rules.fallback({ ...data, ...allNormalized });
    if (fallbackValue !== null && fallbackValue !== undefined) {
      value = fallbackValue;
      if (rules.errorMessage) {
        errorFlag = 1;
        errorReason = rules.errorMessage;
        errorFields.push(fieldName);
      }
    }
  }

  if (rules.type === 'number' && value !== null) {
    if (rules.min !== undefined && value < rules.min) {
      value = rules.min;
      errorFlag = 1;
      errorReason = `VALUE_TOO_LOW: ${fieldName}`;
      errorFields.push(fieldName);
    }
    if (rules.max !== undefined && value > rules.max) {
      value = rules.max;
      errorFlag = 1;
      errorReason = `VALUE_TOO_HIGH: ${fieldName}`;
      errorFields.push(fieldName);
    }
  }

  return { value, errorFlag, errorReason, errorFields };
}

function validatePricing(data) {
  const normalized = {
    price: parsePrice(data.price),
    originalPrice: parsePrice(data.originalPrice),
    discountPercentage: parsePrice(data.discountPercentage),
    availability: data.availability
  };

  let errorFlags = [];
  let errorReasons = [];
  let errorFields = [];

  for (const [fieldName, rules] of Object.entries(validationConfig.fields)) {
    if (['price', 'originalPrice', 'discountPercentage', 'availability'].includes(fieldName)) {
      const result = validateField(fieldName, rules, data, normalized);
      normalized[fieldName] = result.value;
      
      if (result.errorFlag) {
        errorFlags.push(fieldName);
        errorReasons.push(result.errorReason);
        errorFields.push(...result.errorFields);
      }
    }
  }

  if (validationConfig.fields.availability.cascade) {
    const cascadeUpdates = validationConfig.fields.availability.cascade(
      normalized.availability, 
      normalized
    );
    Object.assign(normalized, cascadeUpdates);
  }

  if ((!normalized.price || normalized.price === 0) && 
      (!normalized.originalPrice || normalized.originalPrice === 0)) {
    normalized.price = 0;
    normalized.originalPrice = 0;
    normalized.discountPercentage = 0;
    normalized.availability = 'Currently Unavailable';
    errorFlags.push('price_data');
    errorReasons.push('MISSING_DATA: Both price & originalPrice missing');
    errorFields.push('price', 'originalPrice');
  }

  return {
    ...normalized,
    errorFlag: errorFlags.length > 0 ? 1 : 0,
    errorReason: errorReasons.join('; '),
    errorFields: [...new Set(errorFields)]
  };
}

// ============================================
// CURRENCY & CATEGORY HELPERS
// ============================================

function detectCurrencyFromPrice(priceString) {
  if (!priceString) return null;
  for (const [symbol, currency] of Object.entries(CURRENCY_PATTERNS)) {
    if (priceString.includes(symbol)) return currency;
  }
  return null;
}

function detectCurrencyFromField(currencyField) {
  if (!currencyField || !currencyField.trim()) return null;
  const trimmed = currencyField.trim();
  
  if (CURRENCY_MAP[trimmed.toUpperCase()]) {
    return trimmed.toUpperCase();
  }
  
  if (CURRENCY_PATTERNS[trimmed]) {
    return CURRENCY_PATTERNS[trimmed];
  }
  
  for (const [symbol, currency] of Object.entries(CURRENCY_PATTERNS)) {
    if (trimmed.includes(symbol)) {
      return currency;
    }
  }
  
  return null;
}

function extractMainCategory(categoryHierarchy) {
  if (!categoryHierarchy) return '';
  
  const parts = categoryHierarchy.split('>').map(part => part.trim()).filter(Boolean);
  
  if (parts.length === 1) {
    return parts[0].toLowerCase() !== 'general' ? parts[0] : '';
  }
  
  const genericCategories = ['general', 'all', 'products', 'shop', 'store'];
  const nonGeneric = parts.filter(cat => !genericCategories.includes(cat.toLowerCase()));
  
  if (nonGeneric.length > 0) return nonGeneric[0];
  
  return parts[0] || '';
}

function generateAsin(row) {
  return row.asin || `B0${Date.now().toString().slice(-8)}${Math.random().toString(36).substr(2, 2).toUpperCase()}`;
}

function parseReferenceMedia(referenceMediaValue, productSourceLink) {
  const urls = [];
  
  if (!referenceMediaValue || referenceMediaValue.trim() === '') {
    return productSourceLink ? [productSourceLink] : [];
  }
  
  const trimmed = referenceMediaValue.trim();
  
  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        urls.push(...parsed.map(url => url.trim()).filter(Boolean));
      }
    } catch (e) {
      console.warn(`⚠️ Invalid JSON in reference_media`);
    }
  } else {
    let separator = '|';
    if (trimmed.includes('|')) separator = '|';
    else if (trimmed.includes(';')) separator = ';';
    else if (trimmed.includes(',')) separator = ',';
    
    urls.push(...trimmed.split(separator).map(url => url.trim()).filter(Boolean));
  }
  
  if (productSourceLink && !urls.includes(productSourceLink)) {
    urls.unshift(productSourceLink);
  }
  
  return [...new Set(urls)];
}

function detectRegionalVariants(products) {
  const regionalMap = {};
  
  products.forEach(product => {
    product.referenceMedia.forEach(url => {
      if (!regionalMap[url]) regionalMap[url] = [];
      regionalMap[url].push(product);
    });
  });
  
  Object.values(regionalMap).forEach(sharedProducts => {
    if (sharedProducts.length > 1) {
      sharedProducts.forEach(productA => {
        sharedProducts.forEach(productB => {
          if (productA.asin !== productB.asin && 
              productA.currency !== productB.currency) {
            if (!productA.regional_variants) {
              productA.regional_variants = {};
            }
            productA.regional_variants[productB.currency] = productB.asin;
            productA.regional_availability = 1;
          }
        });
      });
    }
  });
}

function extractCoreFields(data, pricingValidation, currency, referenceMedia) {
  const categoryFromHierarchy = extractMainCategory(data.categoryHierarchy || '');
  const categoryFromField = data.Category?.trim() || '';
  
  let finalCategory = '';
  if (categoryFromHierarchy && categoryFromHierarchy.toLowerCase() !== 'general') {
    finalCategory = categoryFromHierarchy;
  } else if (categoryFromField && categoryFromField.toLowerCase() !== 'general') {
    finalCategory = categoryFromField;
  } else {
    finalCategory = categoryFromHierarchy || categoryFromField || 'General';
  }
  
  return {
    asin: generateAsin(data),
    name: data.productTitle || data.Title || '',
    description: data.Description || '',
    
    price: pricingValidation.price || 0,
    original_price: pricingValidation.originalPrice || 0,
    originalPrice: pricingValidation.originalPrice || 0,
    discount_percentage: pricingValidation.discountPercentage || 0,
    discountPercentage: pricingValidation.discountPercentage || 0,
    availability: pricingValidation.availability || 'In Stock',
    
    'Error-Flag': pricingValidation.errorFlag,
    'Error-Reason': pricingValidation.errorReason || '',
    'Error-Fields': pricingValidation.errorFields || [],
    
    currency: currency,
    symbol: currency === 'MISC' ? '🎁' : (CURRENCY_MAP[currency]?.symbol || currency),
    brand: data.brand || '',
    category: finalCategory,
    subcategory: data.itemTypeName || '',
    
    main_image: data.MainImage || '',
    all_images: (() => {
      if (!data.AllImages) return [];
      try {
        return typeof data.AllImages === 'string' ? JSON.parse(data.AllImages) : data.AllImages;
      } catch (e) {
        return data.AllImages.split(',').map(url => url.trim());
      }
    })(),
    
    customer_rating: data.customerRating || data.Rating || '',
    review_count: parseInt(data.reviewCount || data.ReviewCount) || 0,

    source_link: data['Product Source Link'] || '',
    referenceMedia: referenceMedia,
    regional_availability: 0,
    regional_variants: {},
    
    amazon_short: data['Amazon SiteStripe (Short)'] || '',
    amazon_long: data['Amazon SiteStripe (Long)'] || '',
    affiliate_link: data['Amazon SiteStripe (Short)'] || '',
    
    timestamp: data.Timestamp ? new Date(data.Timestamp).toISOString() : new Date().toISOString(),
    
    featured: false,
    trending: false
  };
}

function deleteOldFiles() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    return [];
  }
  
  const files = fs.readdirSync(dataDir);
  const deletedFiles = [];
  
  files.forEach(file => {
    const filePath = path.join(dataDir, file);
    if (file !== 'products.csv' && file !== 'last_updated.txt') {
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts) {
        try {
          fs.unlinkSync(filePath);
          deletedFiles.push(file);
          break;
        } catch (error) {
          attempts++;
          if (attempts === maxAttempts) {
            console.error(`Failed to delete ${file} after ${maxAttempts} attempts`);
          }
        }
      }
    }
  });
  
  return deletedFiles;
}

// ============================================
// MAIN CONVERSION FUNCTION
// ============================================

function convertCsvToJson() {
  const currencyResults = {};
  const processingStats = {
    total: 0,
    processed: 0,
    errors: 0,
    validationErrors: 0,
    fieldConflicts: 0,
    currenciesFound: new Set(),
    categoriesFound: new Set(),
    brandsFound: new Set()
  };
  
  const errorBreakdown = {};
  
  console.log('🔄 Checking files before deletion...');
  const filesBeforeDeletion = fs.existsSync(dataDir) ? fs.readdirSync(dataDir) : [];
  
  console.log('🔄 Deleting old files...');
  const deletedFiles = deleteOldFiles();
  console.log('✅ Old files deletion complete.');
  
  let lastUpdatedContent = `VibeDrips Data Processing Summary
Generated: ${new Date().toISOString()}

📊 STATISTICS
- Total Rows Processed: 0
- Products Successfully Processed: 0
- Errors Encountered: 0
- Success Rate: 0.0%

💰 CURRENCIES
- Currencies Found: 0
- Available: 

📦 CATEGORIES
- Categories Found: 0
- Top Categories: 

🏷️ BRANDS
- Brands Found: 0
- Top Brands: 

📁 FILES BEFORE DELETION
${filesBeforeDeletion.map(file => `- ${file}`).join('\n') || '- None'}

📁 FILES DELETED
${deletedFiles.length > 0 ? deletedFiles.map(file => `- ${file}`).join('\n') : '- None'}`;

  const filesAfterDeletion = fs.existsSync(dataDir) ? fs.readdirSync(dataDir) : [];
  const expectedFiles = ['last_updated.txt', 'products.csv'];
  const unexpectedFiles = filesAfterDeletion.filter(file => !expectedFiles.includes(file));
  
  lastUpdatedContent += `\n\n📁 FILES PRESENT AFTER DELETION\n${filesAfterDeletion.map(file => `- ${file}`).join('\n') || '- None'}`;
  
  if (unexpectedFiles.length > 0) {
    lastUpdatedContent += `\n⚠️ Deletion failed for unexpected files:\n${unexpectedFiles.map(file => `- ${file}`).join('\n')}`;
  }
  
  fs.writeFileSync(path.join(dataDir, 'last_updated.txt'), lastUpdatedContent);
  
  console.log('🔄 Processing CSV from input...');
  
  process.stdin
    .pipe(csv())
    .on('data', (data) => {
      processingStats.total++;
      try {
        console.log(`\n--- Row ${processingStats.total} ---`);
        
        let currency = null;
        if (data.Currency && data.Currency.trim()) {
          currency = detectCurrencyFromField(data.Currency);
        }
        if (!currency && data.price) {
          currency = detectCurrencyFromPrice(data.price);
        }
        if (!currency) {
          currency = 'MISC';
        }
        console.log(`✅ Currency: ${currency}`);
        
        processingStats.currenciesFound.add(currency);
        if (data.categoryHierarchy) processingStats.categoriesFound.add(extractMainCategory(data.categoryHierarchy));
        if (data.brand) processingStats.brandsFound.add(data.brand);
        
        const pricingValidation = validatePricing({
          price: data.price,
          originalPrice: data.originalPrice,
          discountPercentage: data.discountPercentage,
          availability: data.availability
        });
        
        if (pricingValidation.errorFlag === 1) {
          processingStats.validationErrors++;
          console.log(`⚠️ Validation: ${pricingValidation.errorReason}`);
          
          const reasons = pricingValidation.errorReason.split('; ');
          reasons.forEach(reason => {
            const errorType = reason.split(':')[0];
            errorBreakdown[errorType] = (errorBreakdown[errorType] || 0) + 1;
          });
        }
        
        const referenceMedia = parseReferenceMedia(
          data.reference_media || data['Reference Media for similar products'],
          data['Product Source Link']
        );
        
        const coreFields = extractCoreFields(data, pricingValidation, currency, referenceMedia);
        
        const product = structureProductData(data, coreFields);
        
        if (product['Error-Fields'] && product['Error-Fields'].length > 0) {
          processingStats.fieldConflicts++;
        }
        
        product._dropSignalsPreCompute = {
          sourceLink: data['Product Source Link'] || '',
          influencer: data.Influencer || '',
          timestamp: data.Timestamp
        };
        
        if (!currencyResults[currency]) currencyResults[currency] = [];
        currencyResults[currency].push(product);
        processingStats.processed++;
        
      } catch (error) {
        processingStats.errors++;
        console.error(`Error processing row ${processingStats.total}:`, error.message);
      }
    })
    .on('end', () => {
      console.log('📊 Processing Complete! Generating files...');

      const allProducts = Object.values(currencyResults).flat();
      console.log(`🔍 Detecting regional variants across ${allProducts.length} products...`);
      detectRegionalVariants(allProducts);
      
      const regionalCount = allProducts.filter(p => p.regional_availability === 1).length;
      console.log(`✅ Found ${regionalCount} products with regional variants`);
      
      console.log(`🎬 Computing drop signals...`);
      const dropStats = {
        'creator-picks': 0,
        'global-drops': 0,
        'viral-reels': 0,
        'hot-this-month': 0
      };
      
      allProducts.forEach(product => {
        const dropSignals = computeDropSignals(
          product._dropSignalsPreCompute || {},
          product.referenceMedia,
          product.regional_variants
        );
        
        product.drop_signals = dropSignals;
        
        dropSignals.drop_categories.forEach(cat => {
          dropStats[cat] = (dropStats[cat] || 0) + 1;
        });
        
        delete product._dropSignalsPreCompute;
      });
      
      console.log(`✅ Drop signals computed:`);
      Object.entries(dropStats).forEach(([cat, count]) => {
        console.log(`   ${DROPS_CONFIG.CATEGORIES[cat].emoji} ${DROPS_CONFIG.CATEGORIES[cat].label}: ${count} products`);
      });
      
      Object.keys(currencyResults).forEach(currency => {
        currencyResults[currency].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      });
      
      const currencyManifest = {
        available_currencies: [],
        last_updated: new Date().toISOString(),
        total_products: processingStats.processed,
        default_currency: 'INR'
      };
      
      Object.keys(currencyResults).forEach(currency => {
        const products = currencyResults[currency];
        const filename = `products-${currency}.json`;
        const filepath = path.join(dataDir, filename);
        
        fs.writeFileSync(filepath, JSON.stringify(products, null, 2));
        
        const currencyInfo = {
          code: currency,
          name: currency === 'MISC' ? 'Mixed Currency Products' : (CURRENCY_MAP[currency]?.name || currency),
          symbol: currency === 'MISC' ? '🎁' : (CURRENCY_MAP[currency]?.symbol || currency),
          countries: currency === 'MISC' ? ['Global'] : (CURRENCY_MAP[currency]?.countries || []),
          product_count: products.length,
          filename: filename,
          categories: [...new Set(products.map(p => p.category))].filter(Boolean),
          brands: [...new Set(products.map(p => p.brand))].filter(Boolean),
          price_range: products.length > 0 ? {
            min: Math.min(...products.map(p => p.price).filter(p => p > 0)),
            max: Math.max(...products.map(p => p.price))
          } : { min: 0, max: 0 }
        };
        
        currencyManifest.available_currencies.push(currencyInfo);
        console.log(`💰 ${currency}: ${products.length} products → ${filename}`);
      });
      
      currencyManifest.available_currencies.sort((a, b) => b.product_count - a.product_count);
      
      const manifestPath = path.join(dataDir, 'currencies.json');
      fs.writeFileSync(manifestPath, JSON.stringify(currencyManifest, null, 2));
      
      const dropsManifest = {
        categories: DROPS_CONFIG.CATEGORIES,
        stats: dropStats,
        last_updated: new Date().toISOString()
      };
      
      const dropsManifestPath = path.join(dataDir, 'drops.json');
      fs.writeFileSync(dropsManifestPath, JSON.stringify(dropsManifest, null, 2));
      console.log(`🎬 Drops manifest created: drops.json`);
      
      const finalFiles = fs.existsSync(dataDir) ? fs.readdirSync(dataDir) : [];
      const generatedFiles = new Set([
        'last_updated.txt',
        'products.csv',
        ...Object.keys(currencyResults).map(c => `products-${c}.json`),
        'currencies.json',
        'drops.json'
      ]);
      const remnantFiles = finalFiles.filter(file => !generatedFiles.has(file));
      
      const summary = `VibeDrips Data Processing Summary
Generated: ${new Date().toISOString()}

📊 STATISTICS
- Total Rows Processed: ${processingStats.total}
- Products Successfully Processed: ${processingStats.processed}
- Errors Encountered: ${processingStats.errors}
- Success Rate: ${((processingStats.processed / processingStats.total) * 100).toFixed(1)}%

⚠️ VALIDATION
- Records Flagged: ${processingStats.validationErrors}
- Field Conflicts: ${processingStats.fieldConflicts}
${Object.entries(errorBreakdown).length > 0 ? 
  '- Error Breakdown:\n' + Object.entries(errorBreakdown)
    .sort(([,a], [,b]) => b - a)
    .map(([type, count]) => `  • ${type}: ${count}`)
    .join('\n') : ''}

💰 CURRENCIES
- Currencies Found: ${processingStats.currenciesFound.size}
- Available: ${Array.from(processingStats.currenciesFound).join(', ')}

📦 CATEGORIES
- Categories Found: ${processingStats.categoriesFound.size}
- Top Categories: ${Array.from(processingStats.categoriesFound).slice(0, 5).join(', ') || 'None'}

🏷️ BRANDS
- Brands Found: ${processingStats.brandsFound.size}
- Top Brands: ${Array.from(processingStats.brandsFound).slice(0, 5).join(', ') || 'None'}

🎬 DROPS
${Object.entries(dropStats).map(([cat, count]) => 
  `- ${DROPS_CONFIG.CATEGORIES[cat].emoji} ${DROPS_CONFIG.CATEGORIES[cat].label}: ${count} products`
).join('\n')}

📁 FILES BEFORE DELETION
${filesBeforeDeletion.map(file => `- ${file}`).join('\n') || '- None'}

📁 FILES DELETED
${deletedFiles.length > 0 ? deletedFiles.map(file => `- ${file}`).join('\n') : '- None'}

📁 FILES GENERATED
${Object.keys(currencyResults).map(currency => `- products-${currency}.json (${currencyResults[currency].length} products)`).join('\n')}
- currencies.json (manifest)
- drops.json (drops manifest)

📁 FINAL FILES PRESENT
${finalFiles.map(file => `- ${file}`).join('\n') || '- None'}
${remnantFiles.length > 0 ? `\n⚠️ Remnant files detected:\n${remnantFiles.map(file => `- ${file}`).join('\n')}` : ''}`;

      fs.writeFileSync(path.join(dataDir, 'last_updated.txt'), summary);
      
      console.log('\n✅ SUCCESS! Multi-currency data processing complete.');
      console.log(`📁 Generated ${Object.keys(currencyResults).length} currency files`);
      console.log(`📊 Processed ${processingStats.processed} products from ${processingStats.total} rows`);
      console.log(`💰 Currencies: ${Array.from(processingStats.currenciesFound).join(', ')}`);
      
      if (processingStats.validationErrors > 0) {
        console.log(`⚠️  ${processingStats.validationErrors} products flagged for review (Error-Flag=1)`);
      }
      
      if (processingStats.fieldConflicts > 0) {
        console.log(`⚠️  ${processingStats.fieldConflicts} products with field conflicts (check Error-Fields)`);
      }
      
      if (processingStats.errors > 0) {
        console.log(`⚠️ ${processingStats.errors} rows had processing errors`);
      }
    })
    .on('error', (error) => {
      console.error('❌ Error processing CSV:', error);
      process.exit(1);
    });
}

console.log('🚀 VibeDrips Multi-Currency Product Processor v4.0');
console.log('================================================');
console.log('✨ With Dynamic Fields, Drops, & Error Tracking');
console.log('');
convertCsvToJson();
