console.log(">>> TSD-1 convert-csv.js LOADED <<<");
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
  METADATA_PATTERNS: [
    'Influencer', 'influencer',
    'ManualCollections', 'manual_collections',
    'SeasonOverride', 'season_override',
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
  CORE_FIELDS: [
    'productTitle', 'Title', 'name',
    'brand',
    'Currency', 'symbol', 'currency',
    'price', 'originalPrice', 'discountPercentage',
    'display_price', 'original_price', 'discount_percentage',
    'availability',
    'MainImage', 'AllImages', 'all_images', 'main_image',
    'customerRating', 'Rating', 'customer_rating',
    'reviewCount', 'ReviewCount', 'review_count',
    'Description', 'description',
    'Category', 'categoryHierarchy', 'category', 'subcategory',
    'itemTypeName', 'productType', 'product_type',
    'generic_name'
  ],
  PRODUCT_DETAILS_KEYWORDS: {
    weight: { label: 'Weight', priority: 1, patterns: [/weight/i] },
    dimensions: { label: 'Dimensions', priority: 1, patterns: [/dimension/i, /size/i] },
    color: { label: 'Color', priority: 1, patterns: [/colou?r/i] },
    material: { label: 'Material', priority: 1, patterns: [/material/i, /fabric/i] },
    origin: { label: 'Made in', priority: 2, patterns: [/country.*origin/i, /made.*in/i, /origin/i] }
  },
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
  FIELD_ALIASES: {
    'weight': ['weight', 'itemweight', 'productweight', 'netweight'],
    'dimensions': ['dimensions', 'productdimensions', 'itemdimensionslxwxh', 'size'],
    'color': ['color', 'colour', 'colorname', 'itemcolor'],
    'origin': ['countryoforigin', 'madein', 'origin'],
    'model': ['modelname', 'itemmodelnumber', 'modelnumber', 'model']
  }
};

// ============================================
// SEASONS & COLLECTIONS CONFIG
// ============================================

const SEASONS_CONFIG = {
  VALID_OPTIONS: ['', 'Winter', 'Summer', 'Monsoon', 'Autumn', 'None'],
  PATTERNS: {
    'Winter': /winter|cold|snow|warm|jacket|sweater|hoodie|thermal/i,
    'Summer': /summer|cool|hot|heat|light|breathable|shorts|tank/i,
    'Monsoon': /monsoon|rain|waterproof|umbrella|raincoat/i,
    'Autumn': /autumn|fall/i
  }
};

// ============================================
// DROPS SYSTEM
// ============================================

const DROPS_CONFIG = {
  THRESHOLDS: {
    HIGH_VISIBILITY_MEDIA_COUNT: 2,
    MULTI_REGION_THRESHOLD: 2,
    NEW_RELEASE_DAYS: 60,
    ARCHIVE_THRESHOLD_DAYS: 60,
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
    'new-releases': {
      label: 'New Releases',
      emoji: '🆕',
      subtitle: 'Recently launched products',
      priority: 4
    }
  }
};

// ============================================
// CATEGORY EXTRACTION CONFIG (TSD-1)
// ============================================

// Semantic generic blacklist seed (non-frequency-based)
const GENERIC_CATEGORY_SEED = [
  'general',
  'all products',
  'all items',
  'shop now',
  'best sellers',
  'top picks',
  'new arrivals',
  'hot deals',
  'special offer',
  'summer sale',
  'winter sale',
  'discount offer',
  'combo pack',
  'value pack',
  'gift pack',
  'assorted items',
  'accessories',
  'miscellaneous items',
  'home products',
  'kitchen products',
  'fashion products',
  'beauty products',
  'electronics items',
  'sports items'
];

// Marketing adjectives that should be stripped from candidate phrases
const MARKETING_ADJECTIVES = [
  'smart',
  'pro',
  'ultra',
  'max',
  'plus',
  'mini',
  'lite',
  'advanced',
  'premium',
  'basic',
  'new',
  'latest',
  'improved',
  'wireless',
  'cordless'
];

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

// ============================================
// DATE, SEASON, COLLECTIONS FUNCTIONS
// ============================================

function getProductReleaseDate(data) {
  if (data.date_first_available && data.date_first_available.trim()) {
    try {
      const date = new Date(data.date_first_available);
      if (!isNaN(date.getTime())) return date;
    } catch (e) {
      console.warn(`⚠️ Invalid date_first_available: ${data.date_first_available}`);
    }
  }

  if (data.publication_date && data.publication_date.trim()) {
    try {
      const date = new Date(data.publication_date);
      if (!isNaN(date.getTime())) return date;
    } catch (e) {
      console.warn(`⚠️ Invalid publication_date: ${data.publication_date}`);
    }
  }

  if (data.manufacture_year && data.manufacture_year.trim()) {
    const year = parseInt(data.manufacture_year);
    if (year >= 2000 && year <= 2030) {
      return new Date(`${year}-01-01`);
    }
  }

  for (const [key, value] of Object.entries(data)) {
    if (key.toLowerCase().includes('year') && value && value.trim()) {
      const year = parseInt(value);
      if (year >= 2000 && year <= 2030) {
        return new Date(`${year}-01-01`);
      }
    }
  }

  return null;
}

function detectSeasonFromText(text, seasonOverride) {
  if (seasonOverride && seasonOverride.trim() !== '') {
    const override = seasonOverride.trim();
    if (override === 'None') return null;
    if (SEASONS_CONFIG.VALID_OPTIONS.includes(override)) {
      return override;
    }
    console.warn(`⚠️ Invalid SeasonOverride: "${override}". Using auto-detect.`);
  }

  if (!text) return null;
  const lowerText = text.toLowerCase();
  for (const [season, pattern] of Object.entries(SEASONS_CONFIG.PATTERNS)) {
    if (pattern.test(lowerText)) {
      return season;
    }
  }
  return null;
}

function extractInfluencerAndCollections(data) {
  const influencer = data.Influencer?.trim() || null;
  const manualCollections = [];
  if (data.ManualCollections && data.ManualCollections.trim()) {
    const collections = data.ManualCollections.split(/[|,]/)
      .map(c => c.trim())
      .filter(Boolean);
    manualCollections.push(...collections);
  }
  const seasonOverride = data.SeasonOverride?.trim() || '';
  return { influencer, manualCollections, seasonOverride };
}

// ============================================
// PRODUCT DATA STRUCTURING
// ============================================

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

    if (isValueInCoreFields(value, coreProductData)) {
      errorFields.push(fieldName);
      console.warn(`⚠️ Redundant field "${fieldName}": value already in title/description`);
      return;
    }

    const metadataKeywords = ['http', 'www', 'amazon', 'asin'];
    if (metadataKeywords.some(kw => normalizedValue.includes(kw))) {
      errorFields.push(fieldName);
      console.warn(`⚠️ Metadata leaked into field "${fieldName}": ${value}`);
      return;
    }

    const productDetail = detectProductDetail(fieldName, value);
    if (productDetail) {
      const canonicalKey = canonicalField.toLowerCase();
      if (seenValues.has(canonicalKey)) {
        const existing = seenValues.get(canonicalKey);
        const existingNormalized = normalizeValueForComparison(existing.value);
        if (existingNormalized !== normalizedValue) {
          errorFields.push(fieldName);
          console.warn(`⚠️ CONFLICT in ${canonicalField}:`);
          console.warn(`  ${existing.source}: "${existing.value}"`);
          console.warn(`  ${fieldName}: "${value}"`);
          console.warn('  → Keeping first value');
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
        console.warn(`  ${existing.source}: "${existing.value}"`);
        console.warn(`  ${fieldName}: "${value}"`);
        return;
      }
    }

    if (!seenLabels.has(labelKey)) {
      additionalInfo.push({ key: fieldName, label, category, value });
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

  if (signals.is_new_release) {
    categories.push('new-releases');
  }

  return categories;
}

function computeDropSignals(data, referenceMedia, regionalVariants, releaseDate) {
  const sourceLink = data.sourceLink || data['Product Source Link'] || '';
  const has_reference_media = referenceMedia && referenceMedia.length > 1;
  const media_count = referenceMedia ? referenceMedia.length : (sourceLink ? 1 : 0);
  const available_regions = regionalVariants ? Object.keys(regionalVariants) : [];
  const regional_availability = available_regions.length > 0;
  const influencer_presence = detectInfluencerPresence(data, sourceLink, referenceMedia);

  const is_global =
    regional_availability && available_regions.length >= DROPS_CONFIG.THRESHOLDS.MULTI_REGION_THRESHOLD;

  const is_high_visibility =
    media_count >= DROPS_CONFIG.THRESHOLDS.HIGH_VISIBILITY_MEDIA_COUNT;

  const is_social_proof = influencer_presence;

  let is_new_release = false;
  let product_age_days = null;

  if (releaseDate) {
    try {
      const productDate = new Date(releaseDate);
      const now = new Date();
      product_age_days = Math.floor((now - productDate) / (1000 * 60 * 60 * 24));
      is_new_release = product_age_days <= DROPS_CONFIG.THRESHOLDS.NEW_RELEASE_DAYS;
    } catch (e) {
      console.warn(`⚠️ Invalid release_date for drop signals: ${releaseDate}`);
    }
  }

  return {
    has_reference_media,
    media_count,
    regional_availability,
    available_regions,
    influencer_presence,
    is_global,
    is_high_visibility,
    is_social_proof,
    is_new_release,
    product_age_days,
    drop_categories: computeDropCategories({
      is_global,
      is_high_visibility,
      is_social_proof,
      is_new_release,
      influencer_presence
    })
  };
}

// ============================================
// LEAN MANIFESTS: INFLUENCERS & COLLECTIONS
// ============================================

function generateInfluencersJSON(products) {
  const influencers = {};

  products.forEach(product => {
    if (!product.influencer) return;

    if (!influencers[product.influencer]) {
      influencers[product.influencer] = {
        name: product.influencer,
        productCount: 0,
        totalValue: 0,
        categories: new Set(),
        brands: new Set(),
        currencies: new Set(),
        products: []
      };
    }

    const inf = influencers[product.influencer];
    inf.productCount++;
    inf.totalValue += product.price || 0;
    if (product.category) inf.categories.add(product.category);
    if (product.brand) inf.brands.add(product.brand);
    if (product.currency) inf.currencies.add(product.currency);

    // ONLY store ASIN + currency + computed signals
    inf.products.push({
      asin: product.asin,
      currency: product.currency,
      drop_categories: product.drop_signals?.drop_categories || []
    });
  });

  Object.values(influencers).forEach(inf => {
    inf.categories = Array.from(inf.categories);
    inf.brands = Array.from(inf.brands);
    inf.currencies = Array.from(inf.currencies);
  });

  return influencers;
}

function generateCollectionsJSON(products) {
  const collections = {};

  products.forEach(product => {
    if (!product.manual_collections || product.manual_collections.length === 0) return;

    product.manual_collections.forEach(collectionName => {
      if (!collections[collectionName]) {
        collections[collectionName] = {
          name: collectionName,
          productCount: 0,
          totalValue: 0,
          categories: new Set(),
          brands: new Set(),
          currencies: new Set(),
          influencers: new Set(),
          priceRange: { min: Infinity, max: 0 },
          products: []
        };
      }

      const col = collections[collectionName];
      col.productCount++;
      col.totalValue += product.price || 0;
      if (product.category) col.categories.add(product.category);
      if (product.brand) col.brands.add(product.brand);
      if (product.currency) col.currencies.add(product.currency);
      if (product.influencer) col.influencers.add(product.influencer);
      if (product.price) {
        col.priceRange.min = Math.min(col.priceRange.min, product.price);
        col.priceRange.max = Math.max(col.priceRange.max, product.price);
      }

      // ONLY store ASIN + currency + computed signals
      col.products.push({
        asin: product.asin,
        currency: product.currency,
        drop_categories: product.drop_signals?.drop_categories || [],
        influencer: product.influencer
      });
    });
  });

  Object.values(collections).forEach(col => {
    col.categories = Array.from(col.categories);
    col.brands = Array.from(col.brands);
    col.currencies = Array.from(col.currencies);
    col.influencers = Array.from(col.influencers);
    if (col.priceRange.min === Infinity) col.priceRange.min = 0;
  });

  return collections;
}

// ============================================
// DROPS JSON WITH PRODUCT REFERENCES
// ============================================

function generateDropsJSON(products) {
  const drops = {
    categories: DROPS_CONFIG.CATEGORIES,
    last_updated: new Date().toISOString()
  };

  const productsByCategory = {};
  Object.keys(DROPS_CONFIG.CATEGORIES).forEach(catKey => {
    productsByCategory[catKey] = {
      ...DROPS_CONFIG.CATEGORIES[catKey],
      productCount: 0,
      products: []
    };
  });

  products.forEach(product => {
    const dropCats = product.drop_signals?.drop_categories || [];
    dropCats.forEach(catKey => {
      if (productsByCategory[catKey]) {
        productsByCategory[catKey].productCount++;
        productsByCategory[catKey].products.push({
          asin: product.asin,
          currency: product.currency,
          influencer: product.influencer,
          release_date: product.release_date
        });
      }
    });
  });

  Object.values(productsByCategory).forEach(cat => {
    cat.products.sort((a, b) => {
      const dateA = a.release_date ? new Date(a.release_date) : new Date(0);
      const dateB = b.release_date ? new Date(b.release_date) : new Date(0);
      return dateB - dateA;
    });
  });

  drops.drops_by_category = productsByCategory;
  return drops;
}

// ============================================
// ERRORS JSON FOR ADMIN DASHBOARD
// ============================================

function generateErrorsJSON(products) {
  const flaggedProducts = products.filter(p => p['Error-Flag'] === 1);
  const errorBreakdown = {};
  const errorsByField = {};

  flaggedProducts.forEach(product => {
    const reasons = (product['Error-Reason'] || '').split('; ');
    reasons.forEach(reason => {
      const errorType = reason.split(':')[0].trim();
      if (errorType) {
        errorBreakdown[errorType] = (errorBreakdown[errorType] || 0) + 1;
      }
    });

    (product['Error-Fields'] || []).forEach(field => {
      if (!errorsByField[field]) {
        errorsByField[field] = 0;
      }
      errorsByField[field]++;
    });
  });

  const getSeverity = (errorReason) => {
    if (!errorReason) return 'info';
    if (errorReason.includes('MISSING_DATA')) return 'critical';
    if (errorReason.includes('INVALID')) return 'warning';
    if (errorReason.includes('CONFLICT')) return 'warning';
    return 'info';
  };

  return {
    summary: {
      total_products: products.length,
      products_with_errors: flaggedProducts.length,
      error_rate: products.length > 0 ?
        parseFloat(((flaggedProducts.length / products.length) * 100).toFixed(2)) : 0,
      last_updated: new Date().toISOString()
    },
    error_breakdown: errorBreakdown,
    errors_by_field: errorsByField,
    flagged_products: flaggedProducts.map(p => ({
      asin: p.asin,
      name: p.name,
      currency: p.currency,
      error_flag: p['Error-Flag'],
      error_reason: p['Error-Reason'] || '',
      error_fields: p['Error-Fields'] || [],
      price: p.price,
      original_price: p.originalPrice,
      discount_percentage: p.discountPercentage,
      affiliate_link: p.affiliate_link,
      main_image: p.main_image,
      category: p.category,
      brand: p.brand,
      severity: getSeverity(p['Error-Reason'])
    })).sort((a, b) => {
      const severityOrder = { critical: 0, warning: 1, info: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
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

  if ((!normalized.price || normalized.price === 0) && (!normalized.originalPrice || normalized.originalPrice === 0)) {
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
// CURRENCY HELPERS
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

// ============================================
// TSD-1 CATEGORY EXTRACTION (TWO PASS)
// ============================================

// Basic text normalization for category pipeline
function normalizeCategoryText(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[_\-]+/g, ' ')
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Remove marketing adjectives from edges of phrase
function stripMarketingAdjectives(phrase) {
  if (!phrase) return '';
  let words = phrase.split(' ').filter(Boolean);
  if (words.length === 0) return '';

  const adjectiveSet = new Set(MARKETING_ADJECTIVES.map(a => a.toLowerCase()));

  // strip from start
  while (words.length > 0 && adjectiveSet.has(words[0])) {
    words.shift();
  }
  // strip from end
  while (words.length > 0 && adjectiveSet.has(words[words.length - 1])) {
    words.pop();
  }

  return words.join(' ').trim();
}

// Split categoryHierarchy safely
function splitHierarchy(hierarchy) {
  if (!hierarchy) return [];
  return hierarchy
    .split('>')
    .map(p => normalizeCategoryText(p))
    .filter(Boolean);
}

// Extract raw candidate phrases from one row (no brand trimming yet)
function extractRawCategoryCandidatesFromRow(row) {
  const candidates = [];

  // itemTypeName
  if (row.itemTypeName) {
    const norm = normalizeCategoryText(row.itemTypeName);
    if (norm) candidates.push(norm);
  }

  // Title
  const title = row.productTitle || row.Title || '';
  if (title) {
    const normTitle = normalizeCategoryText(title);
    if (normTitle) {
      // naive multi-word segmentation: keep full phrase
      candidates.push(normTitle);
    }
  }

  // generic_name
  if (row.generic_name) {
    const norm = normalizeCategoryText(row.generic_name);
    if (norm) candidates.push(norm);
  }

  // categoryHierarchy segments (not trusted alone, but used as sources)
  if (row.categoryHierarchy) {
    splitHierarchy(row.categoryHierarchy).forEach(seg => {
      candidates.push(seg);
    });
  }

  return candidates;
}

// Extract normalized brand tokens from Brand/brand
function extractBrandTokensFromRow(row) {
  const brandField = row.brand || row.Brand || '';
  const tokens = new Set();
  if (!brandField || !brandField.trim()) return tokens;

  const norm = normalizeCategoryText(brandField);
  if (!norm) return tokens;

  norm.split(' ').forEach(t => {
    if (t) tokens.add(t);
  });

  return tokens;
}

// Pass 1: vocabulary learning over full CSV
function runCategoryPass1() {
  const productsCsvPath = path.join(dataDir, 'products.csv');
  if (!fs.existsSync(productsCsvPath)) {
    console.warn('⚠️ products.csv not found, skipping category learning pass.');
    return {
      brandTokensGlobal: new Set(),
      phraseFrequency: {},
      productCountByPhrase: {}
    };
  }

  const rawCsv = fs.readFileSync(productsCsvPath, 'utf8');
  const lines = rawCsv.split(/\r?\n/);
  if (lines.length <= 1) {
    return {
      brandTokensGlobal: new Set(),
      phraseFrequency: {},
      productCountByPhrase: {}
    };
  }

  const header = lines[0].split(',');
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    const cols = line.split(',');
    const row = {};
    header.forEach((h, idx) => {
      row[h] = cols[idx] !== undefined ? cols[idx] : '';
    });
    rows.push(row);
  }

  const phraseFrequency = {};
  const productCountByPhrase = {};
  const brandTokensGlobal = new Set();

  // First collect global brand tokens
  rows.forEach(row => {
    const tokens = extractBrandTokensFromRow(row);
    tokens.forEach(t => brandTokensGlobal.add(t));
  });

  // Now process each row's phrases
  rows.forEach((row, rowIndex) => {
    const rawCandidates = extractRawCategoryCandidatesFromRow(row);
    const brandTokensForRow = extractBrandTokensFromRow(row);
    const rowSeenPhrases = new Set();

    rawCandidates.forEach(rawPhrase => {
      if (!rawPhrase) return;

      // phrase-level brand trimming
      let words = rawPhrase.split(' ').filter(Boolean);
      if (words.length < 2) return; // single-word phrases discarded

      // remove any word that is a brand token (global)
      words = words.filter(w => !brandTokensGlobal.has(w));
      if (words.length < 2) return;

      let phrase = words.join(' ').trim();
      phrase = stripMarketingAdjectives(phrase);
      if (!phrase) return;

      const wordCount = phrase.split(' ').filter(Boolean).length;
      if (wordCount < 2) return;

      // noise rejection: generic blacklist seed
      const lowerPhrase = phrase.toLowerCase();
      if (GENERIC_CATEGORY_SEED.includes(lowerPhrase)) {
        return;
      }

      // track frequencies
      phraseFrequency[phrase] = (phraseFrequency[phrase] || 0) + 1;

      if (!rowSeenPhrases.has(phrase)) {
        rowSeenPhrases.add(phrase);
        productCountByPhrase[phrase] = (productCountByPhrase[phrase] || 0) + 1;
      }
    });
  });

  return {
    brandTokensGlobal,
    phraseFrequency,
    productCountByPhrase
  };
}

// Persist artifacts to data/
function writeCategoryArtifacts(pass1Result) {
  const { brandTokensGlobal, productCountByPhrase } = pass1Result;

  // brand-blacklist.json: all global brand tokens
  const brandBlacklist = Array.from(brandTokensGlobal).sort();
  fs.writeFileSync(
    path.join(dataDir, 'brand-blacklist.json'),
    JSON.stringify(brandBlacklist, null, 2)
  );

  // category-blacklist.json: semantic seed terms only (non-frequency-based)
  const categoryBlacklist = GENERIC_CATEGORY_SEED.slice().sort();
  fs.writeFileSync(
    path.join(dataDir, 'category-blacklist.json'),
    JSON.stringify(categoryBlacklist, null, 2)
  );

  // category-whitelist.json: phrases that appear in ≥2 distinct products and are not generic
  const whitelist = [];
  Object.entries(productCountByPhrase).forEach(([phrase, productCount]) => {
    if (productCount >= 2) {
      const lower = phrase.toLowerCase();
      if (!GENERIC_CATEGORY_SEED.includes(lower)) {
        whitelist.push(phrase);
      }
    }
  });

  whitelist.sort((a, b) => a.localeCompare(b));
  fs.writeFileSync(
    path.join(dataDir, 'category-whitelist.json'),
    JSON.stringify(whitelist, null, 2)
  );

  return {
    brandBlacklist,
    categoryBlacklist,
    categoryWhitelist: whitelist
  };
}

// Load artifacts for Pass 2
function loadCategoryArtifacts() {
  const brandPath = path.join(dataDir, 'brand-blacklist.json');
  const catBlackPath = path.join(dataDir, 'category-blacklist.json');
  const catWhitePath = path.join(dataDir, 'category-whitelist.json');

  let brandTokens = [];
  let categoryBlacklist = [];
  let categoryWhitelist = [];

  try {
    if (fs.existsSync(brandPath)) {
      brandTokens = JSON.parse(fs.readFileSync(brandPath, 'utf8'));
    }
  } catch (e) {
    console.warn('⚠️ Failed to read brand-blacklist.json, falling back to empty list.');
  }

  try {
    if (fs.existsSync(catBlackPath)) {
      categoryBlacklist = JSON.parse(fs.readFileSync(catBlackPath, 'utf8'));
    }
  } catch (e) {
    console.warn('⚠️ Failed to read category-blacklist.json, falling back to seed list.');
    categoryBlacklist = GENERIC_CATEGORY_SEED.slice();
  }

  try {
    if (fs.existsSync(catWhitePath)) {
      categoryWhitelist = JSON.parse(fs.readFileSync(catWhitePath, 'utf8'));
    }
  } catch (e) {
    console.warn('⚠️ Failed to read category-whitelist.json, using empty whitelist.');
  }

  const brandTokenSet = new Set(
    brandTokens.map(t => normalizeCategoryText(t)).filter(Boolean)
  );
  const catBlackSet = new Set(
    categoryBlacklist.map(t => normalizeCategoryText(t)).filter(Boolean)
  );
  const catWhiteSet = new Set(
    categoryWhitelist.map(t => normalizeCategoryText(t)).filter(Boolean)
  );

  return {
    brandTokensRaw: brandTokens,
    brandTokenSet,
    categoryBlacklistRaw: categoryBlacklist,
    categoryBlacklistSet: catBlackSet,
    categoryWhitelistRaw: categoryWhitelist,
    categoryWhitelistSet: catWhiteSet
  };
}

// Pass 2: assign ONE dominant category per product
function assignCategoryForProduct(product, originalRow, artifacts) {
  const {
    brandTokenSet,
    categoryBlacklistSet,
    categoryWhitelistSet
  } = artifacts;

  // Collect candidate phrases from same sources, but now enforce whitelist/blacklist/brand rules
  const rawCandidates = extractRawCategoryCandidatesFromRow({
    productTitle: originalRow.productTitle || originalRow.Title,
    Title: originalRow.Title,
    itemTypeName: originalRow.itemTypeName,
    generic_name: originalRow.generic_name,
    categoryHierarchy: originalRow.categoryHierarchy
  });

  const brandTokensForRow = extractBrandTokensFromRow(originalRow);
  const allBrandTokens = new Set([...brandTokenSet, ...brandTokensForRow]);

  const validCandidates = [];

  rawCandidates.forEach(rawPhrase => {
    if (!rawPhrase) return;

    let words = rawPhrase.split(' ').filter(Boolean);
    if (words.length < 2) return;

    // Remove any brand tokens
    words = words.filter(w => !allBrandTokens.has(w));
    if (words.length < 2) return;

    let phrase = words.join(' ').trim();
    phrase = stripMarketingAdjectives(phrase);
    if (!phrase) return;

    const normPhrase = normalizeCategoryText(phrase);
    if (!normPhrase) return;

    const wordCount = normPhrase.split(' ').filter(Boolean).length;
    if (wordCount < 2) return;

    // Rule 1: present in whitelist
    if (!categoryWhitelistSet.has(normPhrase)) return;

    // Rule 2: not present in blacklist
    if (categoryBlacklistSet.has(normPhrase)) return;

    // Rule 3 & 4: does not contain or equal any brand token
    const phraseWords = normPhrase.split(' ').filter(Boolean);
    for (const w of phraseWords) {
      if (allBrandTokens.has(w)) {
        return;
      }
    }
    if (allBrandTokens.has(normPhrase)) {
      return;
    }

    validCandidates.push({
      phrase: phrase,
      normalized: normPhrase,
      wordCount
    });
  });

  if (validCandidates.length === 0) {
    return '';
  }

  // Rule 6: longest valid phrase wins
  validCandidates.sort((a, b) => {
    if (b.wordCount !== a.wordCount) {
      return b.wordCount - a.wordCount;
    }
    return a.phrase.localeCompare(b.phrase);
  });

  return validCandidates[0].phrase;
}

// ============================================
// REGIONAL VARIANTS & CORE FIELDS
// ============================================

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
      console.warn('⚠️ Invalid JSON in reference_media');
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
          if (productA.asin !== productB.asin && productA.currency !== productB.currency) {
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

// extractCoreFields: now sets category = '' (Pass 2 assigns final category)
function extractCoreFields(data, pricingValidation, currency, referenceMedia) {
  const releaseDate = getProductReleaseDate(data);
  const { influencer, manualCollections, seasonOverride } = extractInfluencerAndCollections(data);
  const season = detectSeasonFromText(
    (data.productTitle || '') + ' ' + (data.Description || ''),
    seasonOverride
  );

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
    // category is assigned in Pass 2; keep empty placeholder here
    category: '',
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
    release_date: releaseDate ? releaseDate.toISOString() : null,
    influencer: influencer,
    manual_collections: manualCollections,
    season: season,
    featured: false,
    trending: false
  };
}

// ============================================
// FILE MANAGEMENT
// ============================================

function deleteOldFiles() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    return [];
  }

  const files = fs.readdirSync(dataDir);
  const deletedFiles = [];

  const preservedFiles = [
    'products.csv',
    'last_updated.txt',
    'brand-blacklist.json',
    'category-blacklist.json',
    'category-whitelist.json'
  ];

  files.forEach(file => {
    const filePath = path.join(dataDir, file);
    if (!preservedFiles.includes(file)) {
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
    brandsFound: new Set(),
    influencersFound: new Set(),
    manualCollectionsFound: new Set(),
    seasonsFound: new Set()
  };
  const errorBreakdown = {};

  console.log('📄 Checking files before deletion...');
  const filesBeforeDeletion = fs.existsSync(dataDir) ? fs.readdirSync(dataDir) : [];

  console.log('📄 Deleting old files...');
  const deletedFiles = deleteOldFiles();
  console.log('✅ Old files deletion complete.');

  // TSD-1: Pass 1 — vocabulary learning and artifacts regeneration
  console.log('📚 TSD-1: Running category Pass 1 (vocabulary learning)...');
  const pass1Result = runCategoryPass1();
  const artifacts = writeCategoryArtifacts(pass1Result);
  console.log(`✅ TSD-1: category artifacts regenerated (whitelist: ${artifacts.categoryWhitelist.length}, brands: ${artifacts.brandBlacklist.length})`);

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
  const expectedFiles = ['last_updated.txt', 'products.csv', 'category-blacklist.json', 'brand-blacklist.json', 'category-whitelist.json'];
  const unexpectedFiles = filesAfterDeletion.filter(file => !expectedFiles.includes(file));

  lastUpdatedContent += `

📁 FILES PRESENT AFTER DELETION
${filesAfterDeletion.map(file => `- ${file}`).join('\n') || '- None'}`;
  if (unexpectedFiles.length > 0) {
    lastUpdatedContent += `\n⚠️ Deletion failed for unexpected files:\n${unexpectedFiles.map(file => `- ${file}`).join('\n')}`;
  }

  fs.writeFileSync(path.join(dataDir, 'last_updated.txt'), lastUpdatedContent);

  console.log('📄 Processing CSV from input...');
  const categoryArtifactsForPass2 = loadCategoryArtifacts();

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

        if (data.brand) processingStats.brandsFound.add(data.brand);
        if (data.Influencer?.trim()) processingStats.influencersFound.add(data.Influencer.trim());
        if (data.ManualCollections?.trim()) {
          data.ManualCollections.split(/[|,]/).forEach(c => {
            const trimmed = c.trim();
            if (trimmed) processingStats.manualCollectionsFound.add(trimmed);
          });
        }

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

        // Core fields with category placeholder = ''
        const coreFields = extractCoreFields(data, pricingValidation, currency, referenceMedia);
        if (coreFields.season) processingStats.seasonsFound.add(coreFields.season);

        // Pass 2 category assignment based on artifacts
        const assignedCategory = assignCategoryForProduct(coreFields, data, categoryArtifactsForPass2);
        coreFields.category = assignedCategory || '';

        if (assignedCategory) {
          processingStats.categoriesFound.add(assignedCategory);
        }

        const product = structureProductData(data, coreFields);
        if (product['Error-Fields'] && product['Error-Fields'].length > 0) {
          processingStats.fieldConflicts++;
        }

        product._dropSignalsPreCompute = {
          sourceLink: data['Product Source Link'] || '',
          influencer: data.Influencer || ''
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

      console.log('🎬 Computing drop signals...');
      const dropStats = {
        'creator-picks': 0,
        'global-drops': 0,
        'viral-reels': 0,
        'new-releases': 0
      };

      allProducts.forEach(product => {
        const dropSignals = computeDropSignals(
          product._dropSignalsPreCompute || {},
          product.referenceMedia,
          product.regional_variants,
          product.release_date
        );
        product.drop_signals = dropSignals;
        dropSignals.drop_categories.forEach(cat => {
          dropStats[cat] = (dropStats[cat] || 0) + 1;
        });
        delete product._dropSignalsPreCompute;
      });

      console.log('✅ Drop signals computed:');
      Object.entries(dropStats).forEach(([cat, count]) => {
        console.log(` ${DROPS_CONFIG.CATEGORIES[cat].emoji} ${DROPS_CONFIG.CATEGORIES[cat].label}: ${count} products`);
      });

      Object.keys(currencyResults).forEach(currency => {
        currencyResults[currency].sort((a, b) => {
          const dateA = a.release_date ? new Date(a.release_date) : new Date(0);
          const dateB = b.release_date ? new Date(b.release_date) : new Date(0);
          return dateB - dateA;
        });
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

      // DROPS
      console.log('\n🎬 Generating drops.json...');
      const dropsData = generateDropsJSON(allProducts);
      const dropsPath = path.join(dataDir, 'drops.json');
      fs.writeFileSync(dropsPath, JSON.stringify(dropsData, null, 2));
      console.log('✅ Drops manifest created: drops.json');

      // INFLUENCERS
      console.log('\n👤 Generating influencers.json...');
      const influencersData = generateInfluencersJSON(allProducts);
      const influencersPath = path.join(dataDir, 'influencers.json');
      fs.writeFileSync(influencersPath, JSON.stringify(influencersData, null, 2));
      console.log(`✅ Influencers manifest created: influencers.json (${Object.keys(influencersData).length} influencers)`);

      // COLLECTIONS
      console.log('\n💎 Generating collections.json...');
      const collectionsData = generateCollectionsJSON(allProducts);
      const collectionsPath = path.join(dataDir, 'collections.json');
      fs.writeFileSync(collectionsPath, JSON.stringify(collectionsData, null, 2));
      console.log(`✅ Collections manifest created: collections.json (${Object.keys(collectionsData).length} collections)`);

      // ERRORS
      console.log('\n⚠️ Generating errors.json...');
      const errorsData = generateErrorsJSON(allProducts);
      const errorsPath = path.join(dataDir, 'errors.json');
      fs.writeFileSync(errorsPath, JSON.stringify(errorsData, null, 2));
      console.log(`✅ Errors manifest created: errors.json (${errorsData.flagged_products.length} flagged products)`);

      const finalFiles = fs.existsSync(dataDir) ? fs.readdirSync(dataDir) : [];
      const generatedFiles = new Set([
        'last_updated.txt',
        'products.csv',
        ...Object.keys(currencyResults).map(c => `products-${c}.json`),
        'currencies.json',
        'drops.json',
        'influencers.json',
        'collections.json',
        'errors.json',
        'category-blacklist.json',
        'brand-blacklist.json',
        'category-whitelist.json'
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
${Object.entries(errorBreakdown).length > 0 ? '- Error Breakdown:\n' + Object.entries(errorBreakdown)
          .sort(([, a], [, b]) => b - a)
          .map(([type, count]) => ` • ${type}: ${count}`)
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

👤 INFLUENCERS

- Products with influencers: ${allProducts.filter(p => p.influencer).length}
- Unique influencers: ${Object.keys(influencersData).length}
- List: ${Object.keys(influencersData).join(', ') || 'None'}

💎 COLLECTIONS

- Products in collections: ${allProducts.filter(p => p.manual_collections && p.manual_collections.length > 0).length}
- Unique collections: ${Object.keys(collectionsData).length}
- List: ${Object.keys(collectionsData).join(', ') || 'None'}

🌿 SEASONS

- Seasons Detected: ${processingStats.seasonsFound.size}
- Active: ${Array.from(processingStats.seasonsFound).join(', ') || 'None'}

⚠️ ERRORS & VALIDATION

- Products with errors: ${errorsData.flagged_products.length}
- Error rate: ${errorsData.summary.error_rate}%
- Critical errors: ${errorsData.flagged_products.filter(p => p.severity === 'critical').length}
- Warnings: ${errorsData.flagged_products.filter(p => p.severity === 'warning').length}
- Top error types: ${Object.entries(errorsData.error_breakdown)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3)
          .map(([type, count]) => `${type} (${count})`)
          .join(', ') || 'None'}

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
- influencers.json (${Object.keys(influencersData).length} influencers)
- collections.json (${Object.keys(collectionsData).length} collections)
- errors.json (${errorsData.flagged_products.length} flagged products)
- category-blacklist.json (generic blacklist seed)
- brand-blacklist.json (learned brand tokens)
- category-whitelist.json (stable category phrases)

📁 FINAL FILES PRESENT

${finalFiles.map(file => `- ${file}`).join('\n') || '- None'}
${remnantFiles.length > 0 ? `\n⚠️ Remnant files detected:\n${remnantFiles.map(file => `- ${file}`).join('\n')}` : ''}`;

      fs.writeFileSync(path.join(dataDir, 'last_updated.txt'), summary);

      console.log('\n✅ SUCCESS! Multi-currency data processing complete.');
      console.log(`📁 Generated ${Object.keys(currencyResults).length} currency files`);
      console.log(`📊 Processed ${processingStats.processed} products from ${processingStats.total} rows`);
      console.log(`💰 Currencies: ${Array.from(processingStats.currenciesFound).join(', ')}`);
      console.log(`👤 Influencers: ${Object.keys(influencersData).length}`);
      console.log(`💎 Collections: ${Object.keys(collectionsData).length}`);
      console.log(`🌿 Seasons: ${Array.from(processingStats.seasonsFound).join(', ')}`);
      console.log(`⚠️ Errors: ${errorsData.flagged_products.length} flagged (${errorsData.summary.error_rate}% error rate)`);
      if (processingStats.validationErrors > 0) {
        console.log(`⚠️ ${processingStats.validationErrors} products flagged for review (Error-Flag=1)`);
      }
      if (processingStats.fieldConflicts > 0) {
        console.log(`⚠️ ${processingStats.fieldConflicts} products with field conflicts (check Error-Fields)`);
      }
      if (processingStats.errors > 0) {
        console.log(`⚠️ ${processingStats.errors} rows had processing errors`);
      }
    })
    .on('error', (error) => {
      console.error('❌ Error processing CSV:', error);
      process.exit(1);
    });

  console.log('🚀 VibeDrips Multi-Currency Product Processor v7.1 (TSD-1)');
  console.log('=========================================================');
  console.log('✨ Lean Manifests + Error Tracking + Drop Products + Two-Pass Categories');
}

convertCsvToJson();
