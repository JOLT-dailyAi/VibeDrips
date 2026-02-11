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
    'itemTypeName', 'productType', 'product_type'
  ],


  PRODUCT_DETAILS_KEYWORDS: {
    // Priority 0 - Country (always first)
    country_of_origin: { label: 'Country of Origin', priority: 0, patterns: [/country.*origin/i, /countryoforigin/i] },
    origin: { label: 'Country of Origin', priority: 0, patterns: [/^origin$/i, /made.*in/i] },

    // Priority 1-4 - Physical
    weight: { label: 'Weight', priority: 1, patterns: [/weight/i] },
    dimensions: { label: 'Dimensions', priority: 2, patterns: [/dimension/i, /size/i] },
    color: { label: 'Color', priority: 3, patterns: [/colou?r/i] },
    material: { label: 'Material', priority: 4, patterns: [/material/i, /fabric/i] },

    // Priority 5-9 - Performance
    wattage: { label: 'Wattage', priority: 5, patterns: [/wattage/i, /watts/i] },
    voltage: { label: 'Voltage', priority: 6, patterns: [/voltage/i, /volts/i] },
    noise_level: { label: 'Noise Level', priority: 7, patterns: [/noise.*level/i, /noiselevel/i, /sound.*level/i] },
    floor_area: { label: 'Floor Area', priority: 8, patterns: [/floor.*area/i, /coverage.*area/i] },
    room_type: { label: 'Room Type', priority: 9, patterns: [/room.*type/i, /roomtype/i] },

    // Priority 10-11 - Features
    special_feature: { label: 'Special Features', priority: 10, patterns: [/special.*feature/i, /specialfeature/i] },
    included_components: { label: 'Included Components', priority: 11, patterns: [/included.*component/i, /includedcomponent/i] },

    // Priority 12-17 - Books
    hardcover: { label: 'Hardcover', priority: 12, patterns: [/hardcover/i] },
    paperback: { label: 'Paperback', priority: 13, patterns: [/paperback/i] },
    publisher: { label: 'Publisher', priority: 14, patterns: [/publisher/i] },
    language: { label: 'Language', priority: 15, patterns: [/language/i] },
    publication_date: { label: 'Publication Date', priority: 16, patterns: [/publication.*date/i, /publicationdate/i] },
    print_length: { label: 'Number of Pages', priority: 17, patterns: [/print.*length/i, /number.*pages/i] }
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
  VALID_OPTIONS: ['', 'Winter', 'Spring', 'Summer', 'Monsoon', 'Fall', 'None'],

  PATTERNS: {
    'Winter': /winter|cold|snow|warm|jacket|sweater|hoodie|thermal/i,
    'Spring': /spring|floral|bloom|linen|pastel/i,
    'Summer': /summer|cool|hot|heat|light|breathable|shorts|tank/i,
    'Monsoon': /monsoon|rain|waterproof|umbrella|raincoat/i,
    'Fall': /autumn|fall/i
  }
};

const SEASON_UI_META = {
  'Spring': {
    id: 'spring',
    name: 'Spring',
    emoji: '🌱',
    label: 'Spring Bloom'
  },
  'Summer': {
    id: 'summer',
    name: 'Summer',
    emoji: '☀️',
    label: 'Summer Vibe'
  },
  'Monsoon': {
    id: 'monsoon',
    name: 'Monsoon',
    emoji: '🌦️',
    localized_label: { 'INR': 'Monsoon', 'default': 'Rainy' }
  },
  'Fall': {
    id: 'fall',
    name: 'Fall',
    emoji: '🍂',
    localized_label: { 'USD': 'Fall', 'CAD': 'Fall', 'default': 'Autumn' }
  },
  'Winter': {
    id: 'winter',
    name: 'Winter',
    emoji: '❄️',
    label: 'Winter Collection'
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
  // 1. SMART SKIP: If SeasonOverride is already populated (and not 'None'), use it and skip auto-detection
  if (seasonOverride && seasonOverride.trim() && seasonOverride.trim().toLowerCase() !== 'none') {
    return {
      season: seasonOverride.trim(),
      is_auto_detected: false
    };
  }

  if (seasonOverride === 'None') return { season: null, is_auto_detected: false };

  const lowerText = (text || '').toLowerCase();
  for (const [season, pattern] of Object.entries(SEASONS_CONFIG.PATTERNS)) {
    if (pattern.test(lowerText)) {
      return {
        season,
        is_auto_detected: true
      };
    }
  }

  return {
    season: null,
    is_auto_detected: false
  };
}

function extractInfluencerAndCollections(data) {
  const influencer = data.Influencer?.trim() || null;

  const manualCollections = [];
  if (data.ManualCollections && data.ManualCollections.trim()) {
    const collections = data.ManualCollections.split(/[|,]/).map(c => c.trim()).filter(Boolean);
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
  const warnings = []; // { field, reason, severity }

  Object.keys(rawData).forEach(fieldName => {
    const value = rawData[fieldName];

    if (isMetadataField(fieldName)) return;
    if (isCoreField(fieldName)) return;
    if (isEmptyValue(value)) return;

    const canonicalField = resolveFieldAlias(fieldName);
    const normalizedValue = normalizeValueForComparison(value);

    if (isValueInCoreFields(value, coreProductData)) {
      warnings.push({ field: fieldName, reason: 'Value already in title/description', severity: 'INFO' });
      return;
    }

    const metadataKeywords = ['http', 'www', 'amazon', 'asin'];
    if (metadataKeywords.some(kw => normalizedValue.includes(kw))) {
      warnings.push({ field: fieldName, reason: `Metadata leaked: ${value}`, severity: 'WARNING' });
      return;
    }

    const productDetail = detectProductDetail(fieldName, value);

    if (productDetail) {
      const canonicalKey = canonicalField.toLowerCase();
      if (seenValues.has(canonicalKey)) {
        const existing = seenValues.get(canonicalKey);
        if (normalizeValueForComparison(existing.value) !== normalizedValue) {
          warnings.push({ field: fieldName, reason: `Conflict with ${existing.source}`, severity: 'WARNING' });
        }
        return;
      }
      productDetails.push(productDetail);
      seenLabels.add(productDetail.label.toLowerCase());
      seenValues.set(canonicalKey, { value, source: fieldName });
      return;
    }

    const { category } = detectAdditionalInfoCategory(fieldName);
    const label = humanizeFieldName(fieldName);
    const canonicalKey = canonicalField.toLowerCase();

    if (seenValues.has(canonicalKey)) {
      const existing = seenValues.get(canonicalKey);
      if (normalizeValueForComparison(existing.value) !== normalizedValue) {
        warnings.push({ field: fieldName, reason: `Conflict with ${existing.source}`, severity: 'WARNING' });
      }
      return;
    }

    additionalInfo.push({ key: fieldName, label, category, value });
    seenLabels.add(label.toLowerCase());
    seenValues.set(canonicalKey, { value, source: fieldName });
  });

  const structured = {
    ...coreProductData,
    productDetails: productDetails.sort((a, b) => a.priority - b.priority),
    additionalInfo: additionalInfo.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {})
  };

  // Merge legacy error logic with new severity model
  const legacyErrors = coreProductData['Error-Fields'] || [];
  const criticalErrors = legacyErrors.filter(f => !['Amazon marketplace domain'].includes(f)); // Example exclusion

  const allErrorFields = [...new Set([...legacyErrors, ...warnings.map(w => w.field)])];

  if (allErrorFields.length > 0) {
    structured['Error-Fields'] = allErrorFields;
    // ONLY set flag if it's a critical error (from validatePricing)
    if (coreProductData['Error-Flag'] === 1 || criticalErrors.length > 0) {
      structured['Error-Flag'] = 1;
    }
    structured['Warnings'] = warnings;
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

  const is_global = regional_availability && available_regions.length >= DROPS_CONFIG.THRESHOLDS.MULTI_REGION_THRESHOLD;
  const is_high_visibility = media_count >= DROPS_CONFIG.THRESHOLDS.HIGH_VISIBILITY_MEDIA_COUNT;
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

    const name = product.influencer;
    if (!influencers[name]) {
      influencers[name] = {
        name: name,
        product_count: 0,
        has_creator_video: false,
        regions: new Set(),
        media_groups: {} // Keyed by shared URL + Category
      };
    }

    const inf = influencers[name];
    inf.product_count++;
    inf.regions.add(product.currency);

    // Classification boolean
    const hasVideo = product.referenceMedia && product.referenceMedia.some(link =>
      DROPS_CONFIG.THRESHOLDS.INFLUENCER_KEYWORDS.some(kw => link.toLowerCase().includes(kw.toLowerCase()))
    );
    if (hasVideo) inf.has_creator_video = true;

    // Media + Category Grouping
    const primaryMedia = product.referenceMedia && product.referenceMedia.length > 0
      ? product.referenceMedia[0]
      : product.source_link;

    const groupKey = `${primaryMedia || 'no-link'}|${product.category}`;
    if (!inf.media_groups[groupKey]) {
      inf.media_groups[groupKey] = {
        media_url: primaryMedia,
        category: product.category,
        asins: []
      };
    }
    inf.media_groups[groupKey].asins.push(product.asin);
  });

  const finalInfluencers = Object.values(influencers).map(inf => ({
    ...inf,
    regions: Array.from(inf.regions),
    media_groups: Object.values(inf.media_groups)
  })).sort((a, b) => b.product_count - a.product_count);

  return {
    summary: {
      total_influencers: finalInfluencers.length,
      total_products: products.filter(p => p.influencer).length,
      last_updated: new Date().toISOString()
    },
    influencers: finalInfluencers
  };
}

function generateCollectionsJSON(products) {
  const collections = {};

  products.forEach(product => {
    if (!product.manual_collections) return;

    product.manual_collections.forEach(collName => {
      const parts = collName.split('>').map(p => p.trim());
      let currentLevel = collections;

      parts.forEach((part, index) => {
        if (!currentLevel[part]) {
          currentLevel[part] = {
            name: part,
            product_count: 0,
            asins: [],
            sub_collections: {}
          };
        }

        currentLevel[part].product_count++;
        currentLevel[part].asins.push(product.asin);

        if (index < parts.length - 1) {
          currentLevel = currentLevel[part].sub_collections;
        }
      });
    });
  });

  return {
    summary: {
      total_top_level: Object.keys(collections).length,
      last_updated: new Date().toISOString()
    },
    collections: collections
  };
}

// ============================================
// CATEGORIES JSON MANIFEST
// ============================================

function generateCategoriesJSON(products) {
  const categories = {};
  const autoDetectList = [];

  products.forEach(product => {
    const cat = product.category || 'General';
    if (!categories[cat]) {
      categories[cat] = {
        id: cat.toLowerCase().replace(/\s+/g, '-'),
        name: cat,
        product_count: 0,
        asins: []
      };
    }
    categories[cat].product_count++;
    categories[cat].asins.push(product.asin);

    if (product.category_is_auto_detected) {
      autoDetectList.push({
        asin: product.asin,
        name: product.name,
        guessed_category: cat
      });
    }
  });

  return {
    manifest: {
      summary: {
        total_categories: Object.keys(categories).length,
        total_products: products.length,
        last_updated: new Date().toISOString()
      },
      categories: Object.values(categories).sort((a, b) => b.product_count - a.product_count)
    },
    review: {
      summary: {
        total_to_review: autoDetectList.length,
        last_updated: new Date().toISOString()
      },
      products: autoDetectList
    }
  };
}

// ============================================
// BRANDS JSON MANIFEST
// ============================================

function generateBrandsJSON(products) {
  const brands = {};

  products.forEach(product => {
    const brand = product.brand || 'Unknown';

    if (!brands[brand]) {
      brands[brand] = {
        name: brand,
        product_count: 0,
        asins: []
      };
    }

    brands[brand].product_count++;
    brands[brand].asins.push(product.asin);
  });

  // Convert to array and sort by product count (descending)
  const brandsArray = Object.values(brands).sort((a, b) => b.product_count - a.product_count);

  return {
    summary: {
      total_brands: brandsArray.length,
      total_products: products.length,
      last_updated: new Date().toISOString()
    },
    brands: brandsArray
  };
}

// ============================================
// NEW: DROPS JSON WITH PRODUCT REFERENCES
// ============================================

function generateDropsJSON(products) {
  const drops = {
    categories: DROPS_CONFIG.CATEGORIES,
    last_updated: new Date().toISOString()
  };

  // Group products by drop category
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

        // ✅ ONLY store ASIN + currency + metadata
        productsByCategory[catKey].products.push({
          asin: product.asin,
          currency: product.currency,
          influencer: product.influencer,
          release_date: product.release_date
        });
      }
    });
  });

  // Sort products by release date (newest first)
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
// NEW: SEASONS JSON MANIFEST
// ============================================

function generateSeasonsJSON(products) {
  const seasons = {};
  const autoDetectList = [];

  // Initialize all 5 seasons to ensure stable UI structure
  Object.keys(SEASON_UI_META).forEach(key => {
    seasons[key] = {
      ...SEASON_UI_META[key],
      product_count: 0,
      asins: []
    };
  });

  products.forEach(product => {
    if (product.season && seasons[product.season]) {
      seasons[product.season].product_count++;
      seasons[product.season].asins.push(product.asin);

      if (product.season_is_auto_detected) {
        autoDetectList.push({
          asin: product.asin,
          name: product.name,
          guessed_season: product.season
        });
      }
    }
  });

  return {
    manifest: {
      summary: {
        total_seasons: Object.keys(seasons).length,
        total_products: products.length,
        last_updated: new Date().toISOString()
      },
      seasons: Object.values(seasons)
    },
    review: {
      summary: {
        total_to_review: autoDetectList.length,
        last_updated: new Date().toISOString()
      },
      products: autoDetectList
    }
  };
}

function generateRecentDropsJSON(products) {
  const RECENT_WINDOW = DROPS_CONFIG.THRESHOLDS.NEW_RELEASE_DAYS; // 60 days
  const recentProducts = [];

  products.forEach(product => {
    if (!product.timestamp) return;

    try {
      const addedDate = new Date(product.timestamp);
      const expiryDate = new Date(addedDate.getTime() + (RECENT_WINDOW * 24 * 60 * 60 * 1000));
      const now = new Date();

      if (expiryDate > now) {
        recentProducts.push({
          asin: product.asin,
          currency: product.currency,
          added_date: product.timestamp,
          expiry_time: expiryDate.toISOString()
        });
      }
    } catch (e) {
      // Skip invalid timestamps
    }
  });

  // Sort by newest first
  recentProducts.sort((a, b) => new Date(b.added_date) - new Date(a.added_date));

  return {
    summary: {
      total_recent: recentProducts.length,
      window_days: RECENT_WINDOW,
      last_updated: new Date().toISOString()
    },
    recent_drops: recentProducts
  };
}

function generateUnderTheBagJSON() {
  return {
    config: {
      title: "💸 Under the Bag",
      enabled: true,
      last_updated: new Date().toISOString(),
      currencies: {
        'INR': { default_budget: 5000, slider_min: 500, slider_max: 50000, step: 500 },
        'USD': { default_budget: 80, slider_min: 10, slider_max: 1000, step: 10 },
        'AUD': { default_budget: 120, slider_min: 20, slider_max: 1500, step: 20 },
        'CAD': { default_budget: 100, slider_min: 20, slider_max: 1500, step: 20 },
        'GBP': { default_budget: 60, slider_min: 10, slider_max: 800, step: 10 },
        'EUR': { default_budget: 75, slider_min: 10, slider_max: 1000, step: 10 },
        'JPY': { default_budget: 10000, slider_min: 1000, slider_max: 100000, step: 1000 }
      },
      tier_labels: ["Best Value", "Budget Pick", "High-value"],
      max_variants_per_group: 3
    }
  };
}

// ============================================
// NEW: ERRORS JSON FOR ADMIN DASHBOARD
// ============================================

function generateErrorsJSON(products) {
  const flaggedProducts = products.filter(p => p['Error-Flag'] === 1);

  // Count error types
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

    // Track which fields have errors
    (product['Error-Fields'] || []).forEach(field => {
      if (!errorsByField[field]) {
        errorsByField[field] = 0;
      }
      errorsByField[field]++;
    });
  });

  // Determine severity based on error type
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
      // Sort by severity: critical > warning > info
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

const GENERIC_BLACKLIST = [
  'general',
  'electronics',
  'appliance',
  'appliances',
  'home appliance',
  'furniture',
  'beauty & personal care',
  'beauty',
  'home',
  'product',
  'products',
  'item',
  'items',
  'kitchen',
  'office'
];

function normalizeCategory(value) {
  if (!value || typeof value !== 'string') return '';

  let normalized = value.toLowerCase().trim();

  // Remove extra whitespace
  normalized = normalized.replace(/\s+/g, ' ');

  // Singularize (remove trailing 's' for plurals)
  if (normalized.endsWith('s') && normalized.length > 3) {
    normalized = normalized.slice(0, -1);
  }

  return normalized;
}

function isBlacklisted(value) {
  const normalized = normalizeCategory(value);
  return GENERIC_BLACKLIST.includes(normalized);
}

function assignCategory(data, CANDIDATE_MAP) {
  // 1. SMART SKIP: If Category is already populated in CSV, use it and skip auto-detection
  if (data.Category && data.Category.trim()) {
    return {
      category: data.Category.trim(),
      is_auto_detected: false
    };
  }

  // Extract and normalize values from all priority fields
  const candidates = {
    itemTypeName: normalizeCategory(data.itemTypeName),
    generic_name: normalizeCategory(data.generic_name),
    Category: normalizeCategory(data.Category),
    categoryHierarchy: normalizeCategory(
      data.categoryHierarchy ? data.categoryHierarchy.split('>')[0] : ''
    )
  };

  // Store original (non-normalized) values
  const originals = {
    itemTypeName: (data.itemTypeName || '').trim(),
    generic_name: (data.generic_name || '').trim(),
    Category: (data.Category || '').trim(),
    categoryHierarchy: data.categoryHierarchy ? data.categoryHierarchy.split('>')[0].trim() : ''
  };

  const titleLower = (data.Title || data.productTitle || '').toLowerCase();

  // Priority order for matching
  const priorities = [
    { source: 'itemTypeName', normalized: candidates.itemTypeName, original: originals.itemTypeName },
    { source: 'generic_name', normalized: candidates.generic_name, original: originals.generic_name },
    { source: 'Category', normalized: candidates.Category, original: originals.Category },
    { source: 'categoryHierarchy', normalized: candidates.categoryHierarchy, original: originals.categoryHierarchy }
  ];

  let detected = 'General';
  let is_auto_detected = false;

  // Try each priority level
  for (const priority of priorities) {
    if (!priority.normalized) continue;

    // EXACT MATCH: Check if this normalized value exists in CANDIDATE_MAP
    if (CANDIDATE_MAP[priority.normalized] && !isBlacklisted(priority.normalized)) {
      const canonicalCategory = CANDIDATE_MAP[priority.normalized];
      const validated = titleLower.includes(priority.normalized);

      console.log(`📦 ${data.productTitle || data.Title}`);
      console.log(`   Category: "${canonicalCategory}" (from ${priority.source}, ${validated ? '✅ validated' : '⚠️ not validated'})`);

      detected = canonicalCategory;
      is_auto_detected = true;
      break; // Found a category, break from loop
    }

    // SUBSTRING EXTRACTION: Try to find a known category within the value
    // This handles cases like "uBreathe Life Air Purifier" -> extract "Air Purifier"
    const originalValue = priority.original.toLowerCase();
    for (const [knownNorm, knownCanonical] of Object.entries(CANDIDATE_MAP)) {
      if (originalValue.includes(knownNorm) && !isBlacklisted(knownNorm)) {
        const validated = titleLower.includes(knownNorm);
        console.log(`📦 ${data.productTitle || data.Title}`);
        console.log(`   Category: "${knownCanonical}" (extracted from ${priority.source}: "${priority.original}", ${validated ? '✅ validated' : '⚠️ not validated'})`);
        detected = knownCanonical;
        is_auto_detected = true;
        break; // Found a category, break from loop
      }
    }
    if (is_auto_detected) break; // If category found in substring extraction, break from outer loop
  }

  // Final fallback: use original Category or categoryHierarchy if not blacklisted
  if (!is_auto_detected) {
    if (originals.Category && !isBlacklisted(candidates.Category)) {
      console.log(`📦 ${data.productTitle || data.Title}`);
      console.log(`   Category: "${originals.Category}" (fallback: raw Category)`);
      detected = originals.Category;
      is_auto_detected = true;
    } else if (originals.categoryHierarchy && !isBlacklisted(candidates.categoryHierarchy)) {
      console.log(`📦 ${data.productTitle || data.Title}`);
      console.log(`   Category: "${originals.categoryHierarchy}" (fallback: raw categoryHierarchy)`);
      detected = originals.categoryHierarchy;
      is_auto_detected = true;
    } else {
      // Default
      console.log(`📦 ${data.productTitle || data.Title}`);
      console.log(`   Category: "General" (default)`);
      detected = 'General';
      is_auto_detected = true; // Default is also considered auto-detected
    }
  }

  return {
    category: detected,
    is_auto_detected: is_auto_detected
  };
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

function extractCoreFields(data, pricingValidation, currency, referenceMedia, categoryResult) {
  const finalCategory = categoryResult.category || 'General';

  const releaseDate = getProductReleaseDate(data);
  const { influencer, manualCollections, seasonOverride } = extractInfluencerAndCollections(data);
  const seasonResult = detectSeasonFromText(
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
    amazon_long: data.amazon_long || '',
    affiliate_link: data['Amazon SiteStripe (Short)'] || '',

    release_date: releaseDate,
    timestamp: data.Timestamp || new Date().toISOString(),
    influencer: influencer,
    manual_collections: manualCollections,
    season: seasonResult.season,
    category_is_auto_detected: categoryResult.is_auto_detected,
    season_is_auto_detected: seasonResult.is_auto_detected,

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

    // Skip source and logs
    if (file === 'products.csv' || file === 'last_updated.txt') return;

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
  });

  return deletedFiles;
}

// ============================================
// MAIN CONVERSION FUNCTION
// ============================================

function convertCsvToJson() {
  const categoryFrequency = {};
  const csvFilePath = path.join(dataDir, 'products.csv');

  if (!fs.existsSync(csvFilePath)) {
    console.error(`❌ Error: ${csvFilePath} not found.`);
    return;
  }

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

  console.log('🔄 PASS 1: Building category candidates...');

  fs.createReadStream(csvFilePath)
    .pipe(csv({
      mapHeaders: ({ header }) => header.trim()
    }))
    .on('data', (row) => {
      const record = (val) => {
        if (!val) return;

        const trimmed = val.trim();

        // Reject if too long (likely a product name)
        if (trimmed.length > 40) {
          console.log(`⚠️ Rejected (too long): "${trimmed.substring(0, 40)}..."`);
          return;
        }

        // Reject if too many words (likely a product title)
        const wordCount = trimmed.split(/\s+/).length;
        if (wordCount > 2) {
          console.log(`⚠️ Rejected (too many words): "${trimmed}"`);
          return;
        }

        const norm = normalizeCategory(val);
        if (!norm || isBlacklisted(norm)) return;

        // Reject if contains common product name patterns
        const productNamePatterns = [
          /\d+[a-z]/i,           // "11L", "300S", "Zero"
          /\bsmart\b/i,          // "Smart"
          /\bpro\b/i,            // "Pro"
          /\bmini\b/i,           // "Mini"
          /\badvanced\b/i,       // "Advanced"
          /\b(zero|lite|plus|max|ultra)\b/i  // Model suffixes
        ];

        if (productNamePatterns.some(pattern => pattern.test(trimmed))) {
          console.log(`⚠️ Rejected (product pattern): "${trimmed}"`);
          return;
        }

        if (!categoryFrequency[norm]) {
          categoryFrequency[norm] = { count: 0, originals: {} };
        }
        categoryFrequency[norm].count++;

        categoryFrequency[norm].originals[trimmed] = (categoryFrequency[norm].originals[trimmed] || 0) + 1;
      };

      record(row.itemTypeName);
      record(row.generic_name);
      record(row.Category);

      // CRITICAL: ONLY process first part of categoryHierarchy
      if (row.categoryHierarchy) {
        const firstPart = row.categoryHierarchy.split('>')[0];
        record(firstPart);
      }
    })
    .on('end', () => {
      const CANDIDATE_MAP = {};
      Object.entries(categoryFrequency).forEach(([norm, data]) => {
        // Frequency threshold: only keep if it appears at least 2 times
        if (data.count >= 2) {
          // SINGULAR PREFERENCE: Check if any original exactly matches the normalized version (singular)
          const originalsList = Object.entries(data.originals);
          let bestOriginal = originalsList.sort((a, b) => b[1] - a[1])[0][0];

          // If the most frequent is plural (ends in 's'), but a singular version exists, prefer the singular
          if (bestOriginal.toLowerCase().endsWith('s') && bestOriginal.length > 3) {
            const singularCand = bestOriginal.slice(0, -1).toLowerCase();
            const foundSingular = Object.keys(data.originals).find(o => o.toLowerCase() === singularCand);
            if (foundSingular) {
              bestOriginal = foundSingular;
              console.log(`✨ Singularized category: "${norm}" -> prefer "${bestOriginal}" over frequent plural`);
            }
          }

          CANDIDATE_MAP[norm] = bestOriginal;
        }
      });

      console.log('📋 Category Candidates (Count >= 2):', Object.values(CANDIDATE_MAP));

      runPass2(CANDIDATE_MAP, filesBeforeDeletion, deletedFiles);
    })
    .on('error', (error) => {
      console.error('❌ Error during PASS 1:', error);
    });

  function runPass2(CANDIDATE_LIST, filesBeforeDeletion, deletedFiles) {
    console.log('🔄 PASS 2: Processing products...');

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

    fs.createReadStream(csvFilePath)
      .pipe(csv({
        mapHeaders: ({ header }) => header.trim()
      }))
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

          const finalCategory = assignCategory(data, CANDIDATE_LIST);

          processingStats.currenciesFound.add(currency);
          if (finalCategory) processingStats.categoriesFound.add(finalCategory);
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
            data.reference_media || data.referenceMedia || data['Reference Media for similar products'],
            data['Product Source Link']
          );

          const coreFields = extractCoreFields(data, pricingValidation, currency, referenceMedia, finalCategory);

          if (coreFields.season) processingStats.seasonsFound.add(coreFields.season);

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

        console.log(`🎬 Computing drop signals...`);
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

        console.log(`✅ Drop signals computed:`);
        Object.entries(dropStats).forEach(([cat, count]) => {
          console.log(`  ${DROPS_CONFIG.CATEGORIES[cat].emoji} ${DROPS_CONFIG.CATEGORIES[cat].label}: ${count} products`);
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

        // Write individual manifests (v2 Architecture)
        const categoriesResult = generateCategoriesJSON(allProducts);
        fs.writeFileSync(path.join(dataDir, 'categories.json'), JSON.stringify(categoriesResult.manifest, null, 2));
        fs.writeFileSync(path.join(dataDir, 'categories_auto-detect.json'), JSON.stringify(categoriesResult.review, null, 2));

        const seasonsResult = generateSeasonsJSON(allProducts);
        fs.writeFileSync(path.join(dataDir, 'seasons.json'), JSON.stringify(seasonsResult.manifest, null, 2));
        fs.writeFileSync(path.join(dataDir, 'seasons_auto-detect.json'), JSON.stringify(seasonsResult.review, null, 2));

        const influencerResult = generateInfluencersJSON(allProducts);
        fs.writeFileSync(path.join(dataDir, 'influencers.json'), JSON.stringify(influencerResult, null, 2));

        const collectionResult = generateCollectionsJSON(allProducts);
        fs.writeFileSync(path.join(dataDir, 'collections.json'), JSON.stringify(collectionResult, null, 2));

        const recentDropsResult = generateRecentDropsJSON(allProducts);
        fs.writeFileSync(path.join(dataDir, 'recent-drops.json'), JSON.stringify(recentDropsResult, null, 2));

        const underTheBagResult = generateUnderTheBagJSON();
        fs.writeFileSync(path.join(dataDir, 'UnderTheBag.json'), JSON.stringify(underTheBagResult, null, 2));

        const brandsData = generateBrandsJSON(allProducts);
        fs.writeFileSync(path.join(dataDir, 'brands.json'), JSON.stringify(brandsData, null, 2));

        // Refined Error Manifest
        const errorsData = {
          summary: {
            total_products: allProducts.length,
            products_with_errors: allProducts.filter(p => p['Error-Flag'] === 1).length,
            error_rate: Math.round((allProducts.filter(p => p['Error-Flag'] === 1).length / allProducts.length) * 100),
            last_updated: new Date().toISOString()
          },
          error_breakdown: errorBreakdown,
          flagged_products: allProducts.filter(p => p['Error-Fields']?.length > 0)
        };
        fs.writeFileSync(path.join(dataDir, 'errors.json'), JSON.stringify(errorsData, null, 2));

        const generatedFilesList = new Set([
          'last_updated.txt',
          'products.csv',
          ...Object.keys(currencyResults).map(c => `products-${c}.json`),
          'currencies.json',
          'categories.json',
          'categories_auto-detect.json',
          'seasons.json',
          'seasons_auto-detect.json',
          'influencers.json',
          'collections.json',
          'recent-drops.json',
          'UnderTheBag.json',
          'brands.json',
          'errors.json'
        ]);

        const finalFiles = fs.existsSync(dataDir) ? fs.readdirSync(dataDir) : [];
        const remnantFiles = finalFiles.filter(file => !generatedFilesList.has(file));

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
            .map(([type, count]) => `  • ${type}: ${count}`)
            .join('\n') : ''}

💰 CURRENCIES
- Currencies Found: ${processingStats.currenciesFound.size}
- Available: ${Array.from(processingStats.currenciesFound).join(', ')}

📦 CATEGORIES
- Categories Found: ${categoriesResult.manifest.summary.total_categories}
- Review Needed: ${categoriesResult.review.summary.total_to_review} products

👤 INFLUENCERS
- Products with influencers: ${influencerResult.summary.total_products}
- Unique influencers: ${influencerResult.summary.total_influencers}

💎 COLLECTIONS
- Unique collections: ${collectionResult.summary.total_top_level}

🌿 SEASONS
- Seasons Detected: ${processingStats.seasonsFound.size}
- Review Needed: ${seasonsResult.review.summary.total_to_review} products

⚠️ ERRORS & VALIDATION
- Products with errors: ${errorsData.summary.products_with_errors}
- Error rate: ${errorsData.summary.error_rate}%

🎬 DROPS
${Object.entries(dropStats).map(([cat, count]) =>
              `- ${DROPS_CONFIG.CATEGORIES[cat]?.emoji || '💧'} ${DROPS_CONFIG.CATEGORIES[cat]?.label || cat}: ${count} products`
            ).join('\n')}

📁 FILES BEFORE DELETION
${filesBeforeDeletion.map(file => `- ${file}`).join('\n') || '- None'}

📁 FILES DELETED
${deletedFiles.length > 0 ? deletedFiles.map(file => `- ${file}`).join('\n') : '- None'}

📁 FILES GENERATED
${Object.keys(currencyResults).map(currency => `- products-${currency}.json (${currencyResults[currency].length} products)`).join('\n')}
- categories.json & categories_auto-detect.json
- seasons.json & seasons_auto-detect.json
- influencers.json
- collections.json
- recent-drops.json
- UnderTheBag.json
- brands.json
- errors.json

📁 FINAL FILES PRESENT
${finalFiles.map(file => `- ${file}`).join('\n') || '- None'}
${remnantFiles.length > 0 ? `\n⚠️ Remnant files detected:\n${remnantFiles.map(file => `- ${file}`).join('\n')}` : ''}`;

        fs.writeFileSync(path.join(dataDir, 'last_updated.txt'), summary);

        console.log('\n✅ SUCCESS! Multi-currency data processing complete.');
      });
  }
}

console.log('🚀 VibeDrips Multi-Currency Product Processor v2.0 (Dynamic Manifests)');
console.log('=====================================================================');
convertCsvToJson();
