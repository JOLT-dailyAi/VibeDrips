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
// VALIDATION SYSTEM (Config-driven)
// ============================================

/**
 * Parse price helper - handles various formats
 */
function parsePrice(val) {
  if (!val || val === '' || val === 'Not Specified' || val === '0') return null;
  const cleaned = String(val).replace(/[^\d.]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Validate and normalize a single field based on config
 */
function validateField(fieldName, rules, data, allNormalized = {}) {
  let value = data[fieldName];
  let errorFlag = 0;
  let errorReason = '';

  // Type conversion
  if (rules.type === 'number') {
    value = parsePrice(value);
  }

  // Normalization
  if (rules.normalize) {
    value = rules.normalize(value, data);
  }

  // Computed fields
  let computedValue = null;
  if (rules.computed) {
    computedValue = rules.computed({ ...data, ...allNormalized });
    if (!value && value !== 0) {
      value = computedValue;
    }
  }

  // Validation (with computed value context)
  if (rules.validate) {
    const result = rules.validate(value, { ...data, ...allNormalized }, computedValue);
    if (!result.valid) {
      errorFlag = 1;
      errorReason = result.reason;
      value = result.corrected !== undefined ? result.corrected : value;
    }
  }

  // Fallback
  if ((value === null || value === undefined || value === '') && rules.fallback) {
    const fallbackValue = rules.fallback({ ...data, ...allNormalized });
    if (fallbackValue !== null && fallbackValue !== undefined) {
      value = fallbackValue;
      if (rules.errorMessage) {
        errorFlag = 1;
        errorReason = rules.errorMessage;
      }
    }
  }

  // Min/Max bounds
  if (rules.type === 'number' && value !== null) {
    if (rules.min !== undefined && value < rules.min) {
      value = rules.min;
      errorFlag = 1;
      errorReason = `VALUE_TOO_LOW: ${fieldName}`;
    }
    if (rules.max !== undefined && value > rules.max) {
      value = rules.max;
      errorFlag = 1;
      errorReason = `VALUE_TOO_HIGH: ${fieldName}`;
    }
  }

  return { value, errorFlag, errorReason };
}

/**
 * Apply price validation to product data
 */
function validatePricing(data) {
  const normalized = {
    price: parsePrice(data.price),
    originalPrice: parsePrice(data.originalPrice),
    discountPercentage: parsePrice(data.discountPercentage),
    availability: data.availability
  };

  let errorFlags = [];
  let errorReasons = [];

  // Validate each pricing field
  for (const [fieldName, rules] of Object.entries(validationConfig.fields)) {
    if (['price', 'originalPrice', 'discountPercentage', 'availability'].includes(fieldName)) {
      const result = validateField(fieldName, rules, data, normalized);
      normalized[fieldName] = result.value;
      
      if (result.errorFlag) {
        errorFlags.push(fieldName);
        errorReasons.push(result.errorReason);
      }
    }
  }

  // Apply cascade rules (availability → price = 0)
  if (validationConfig.fields.availability.cascade) {
    const cascadeUpdates = validationConfig.fields.availability.cascade(
      normalized.availability, 
      normalized
    );
    Object.assign(normalized, cascadeUpdates);
  }

  // Special case: both prices missing
  if ((!normalized.price || normalized.price === 0) && 
      (!normalized.originalPrice || normalized.originalPrice === 0)) {
    normalized.price = 0;
    normalized.originalPrice = 0;
    normalized.discountPercentage = 0;
    normalized.availability = 'Currently Unavailable';
    errorFlags.push('price_data');
    errorReasons.push('MISSING_DATA: Both price & originalPrice missing');
  }

  return {
    ...normalized,
    errorFlag: errorFlags.length > 0 ? 1 : 0,
    errorReason: errorReasons.join('; ')
  };
}

// ============================================
// EXISTING HELPER FUNCTIONS
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
  console.log(`🔍 Detecting currency from field: "${trimmed}"`);
  
  if (CURRENCY_MAP[trimmed.toUpperCase()]) {
    console.log(`✅ Direct code match: ${trimmed.toUpperCase()}`);
    return trimmed.toUpperCase();
  }
  
  if (CURRENCY_PATTERNS[trimmed]) {
    console.log(`✅ Symbol match: ${trimmed} → ${CURRENCY_PATTERNS[trimmed]}`);
    return CURRENCY_PATTERNS[trimmed];
  }
  
  for (const [symbol, currency] of Object.entries(CURRENCY_PATTERNS)) {
    if (trimmed.includes(symbol)) {
      console.log(`✅ Contains symbol: ${symbol} → ${currency}`);
      return currency;
    }
  }
  
  console.log(`❌ No currency detected from: "${trimmed}"`);
  return null;
}

function cleanAndValidatePrice(priceString) {
  if (!priceString) return 0;
  const cleanPrice = priceString.replace(/[₹$€£¥C$A$R$د\.إS$﷼krzł,]/g, '').trim();
  const price = parseFloat(cleanPrice);
  return isNaN(price) ? 0 : price;
}

function extractMainCategory(categoryHierarchy) {
  if (!categoryHierarchy) return '';
  const parts = categoryHierarchy.split('>').map(part => part.trim());
  return parts[0] || '';
}

function generateAsin(row) {
  return row.asin || `B0${Date.now().toString().slice(-8)}${Math.random().toString(36).substr(2, 2).toUpperCase()}`;
}

/**
 * Parse reference_media column with flexible separator support
 * Supports: pipe (|), comma (,), semicolon (;), or JSON array
 * Always includes Product Source Link as first item
 */
function parseReferenceMedia(referenceMediaValue, productSourceLink) {
    const urls = [];
    
    // If no reference_media value, return only source link
    if (!referenceMediaValue || referenceMediaValue.trim() === '') {
        return productSourceLink ? [productSourceLink] : [];
    }
    
    const trimmed = referenceMediaValue.trim();
    
    // Try parsing as JSON array first
    if (trimmed.startsWith('[')) {
        try {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed)) {
                urls.push(...parsed.map(url => url.trim()).filter(Boolean));
            }
        } catch (e) {
            console.warn(`⚠️ Invalid JSON in reference_media: ${trimmed.substring(0, 50)}...`);
        }
    } else {
        // Auto-detect separator
        let separator = '|';
        if (trimmed.includes('|')) separator = '|';
        else if (trimmed.includes(';')) separator = ';';
        else if (trimmed.includes(',')) separator = ',';
        
        // Split and clean URLs
        urls.push(...trimmed.split(separator).map(url => url.trim()).filter(Boolean));
    }
    
    // Always include Product Source Link first if not already present
    if (productSourceLink && !urls.includes(productSourceLink)) {
        urls.unshift(productSourceLink);
    }
    
    // Remove duplicates while preserving order
    return [...new Set(urls)];
}

/**
 * Detect regional variants based on shared reference media
 * Creates bidirectional links between products with same videos
 */
function detectRegionalVariants(products) {
    const regionalMap = {};
    
    // Build mapping of video URLs to products
    products.forEach(product => {
        product.referenceMedia.forEach(url => {
            if (!regionalMap[url]) regionalMap[url] = [];
            regionalMap[url].push(product);
        });
    });
    
    // Link products that share videos but have different currencies
    Object.values(regionalMap).forEach(sharedProducts => {
        if (sharedProducts.length > 1) {
            // These products share a reference video
            sharedProducts.forEach(productA => {
                sharedProducts.forEach(productB => {
                    if (productA.asin !== productB.asin && 
                        productA.currency !== productB.currency) {
                        // Link them as regional variants
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
          console.log(`Successfully deleted ${file} (attempt ${attempts + 1})`);
          break;
        } catch (error) {
          attempts++;
          if (attempts === maxAttempts) {
            console.error(`Failed to delete ${file} after ${maxAttempts} attempts: ${error.message}`);
          } else {
            console.log(`Retrying deletion of ${file} (attempt ${attempts + 1})...`);
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
    currenciesFound: new Set(),
    categoriesFound: new Set(),
    brandsFound: new Set()
  };
  
  const errorBreakdown = {};
  
  console.log('🔄 Checking files before deletion...');
  const filesBeforeDeletion = fs.existsSync(dataDir) ? fs.readdirSync(dataDir) : [];
  console.log('📋 Files present before deletion:', filesBeforeDeletion);
  
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
${deletedFiles.length > 0 ? deletedFiles.map(file => `- ${file}`).join('\n') : '- None'}

📁 FILES PRESENT AFTER DELETION
`;

  const filesAfterDeletion = fs.existsSync(dataDir) ? fs.readdirSync(dataDir) : [];
  const expectedFiles = ['last_updated.txt', 'products.csv'];
  const unexpectedFiles = filesAfterDeletion.filter(file => !expectedFiles.includes(file));
  
  lastUpdatedContent += filesAfterDeletion.map(file => `- ${file}`).join('\n') || '- None';
  
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
        console.log(`Currency field: "${data.Currency}"`);
        console.log(`Price field: "${data.price}"`);
        
        let currency = null;
        if (data.Currency && data.Currency.trim()) {
          currency = detectCurrencyFromField(data.Currency);
        }
        if (!currency && data.price) {
          currency = detectCurrencyFromPrice(data.price);
          console.log(`🔍 Currency from price: ${currency}`);
        }
        if (!currency) {
          currency = 'MISC';
          console.log(`🎁 Defaulting to MISC`);
        }
        console.log(`✅ Final currency: ${currency}`);
        
        processingStats.currenciesFound.add(currency);
        if (data.categoryHierarchy) processingStats.categoriesFound.add(extractMainCategory(data.categoryHierarchy));
        if (data.brand) processingStats.brandsFound.add(data.brand);
        
        // ✅ NEW: Validate pricing with config-driven system
        const pricingValidation = validatePricing({
          price: data.price,
          originalPrice: data.originalPrice,
          discountPercentage: data.discountPercentage,
          availability: data.availability
        });
        
        // Track validation errors
        if (pricingValidation.errorFlag === 1) {
          processingStats.validationErrors++;
          console.log(`⚠️ Validation: ${pricingValidation.errorReason}`);
          
          // Track error types
          const reasons = pricingValidation.errorReason.split('; ');
          reasons.forEach(reason => {
            const errorType = reason.split(':')[0];
            errorBreakdown[errorType] = (errorBreakdown[errorType] || 0) + 1;
          });
        }
        
        // Product object with validated pricing
        const product = {
          asin: generateAsin(data),
          name: data.productTitle || data.Title || '',
          description: data.Description || '',
          
          // ✅ UPDATED: Use validated pricing
          price: pricingValidation.price || 0,
          original_price: pricingValidation.originalPrice || 0,
          originalPrice: pricingValidation.originalPrice || 0,
          discount_percentage: pricingValidation.discountPercentage || 0,
          discountPercentage: pricingValidation.discountPercentage || 0,
          availability: pricingValidation.availability || 'In Stock',
          
          // ✅ NEW: Error tracking
          'Error-Flag': pricingValidation.errorFlag,
          'Error-Reason': pricingValidation.errorReason || '',
          
          currency: currency,
          symbol: currency === 'MISC' ? '🎁' : (CURRENCY_MAP[currency]?.symbol || currency),
          brand: data.brand || '',
          category: extractMainCategory(data.categoryHierarchy || data.Category),
          subcategory: data.itemTypeName || '',
          
          // Images
          main_image: data.MainImage || '',
          all_images: (() => {
            if (!data.AllImages) return [];
            try {
              return typeof data.AllImages === 'string' ? JSON.parse(data.AllImages) : data.AllImages;
            } catch (e) {
              return data.AllImages.split(',').map(url => url.trim());
            }
          })(),
          
          // Product details
          color: data.color || '',
          material: data.material || '',
          dimensions: data.dimensions || '',
          weight: data.weight || '',
          theme: data.theme || '',
          character: data.character || '',
          
          // Product specs
          minimum_age: data.minimumAge || '',
          number_of_pieces: data.numberOfPieces || '',
          unit_count: data.unitCount || '',
          included_components: data.includedComponents || '',
          additional_features: data.additionalFeatures || '',
          
          // Rating
          customer_rating: data.customerRating || data.Rating || '',
          review_count: parseInt(data.reviewCount || data.ReviewCount) || 0,

          // ✅ NEW: Reference Media & Regional Variants
          source_link: data['Product Source Link'] || '',
          referenceMedia: parseReferenceMedia(
              data.reference_media,
              data['Product Source Link']
          ),
          regional_availability: 0, // Will be set during regional detection
          regional_variants: {}, // Will be populated during regional detection
          
          // Links
          source_link: data['Product Source Link'] || '',
          amazon_short: data['Amazon SiteStripe (Short)'] || '',
          amazon_long: data['Amazon SiteStripe (Long)'] || '',
          affiliate_link: data['Amazon SiteStripe (Short)'] || '',
          
          timestamp: data.Timestamp ? new Date(data.Timestamp).toISOString() : new Date().toISOString(),
          
          // Manufacturer info
          manufacturer: data.manufacturer || '',
          manufacturer_contact: data.manufacturerContact || '',
          packer: data.packer || '',
          importer: data.importer || '',
          country_of_origin: data.countryOfOrigin || '',
          product_type: data.productType || '',
          
          featured: false,
          trending: false
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

      // ✅ NEW: Detect regional variants across all products
      const allProducts = Object.values(currencyResults).flat();
      console.log(`🔍 Detecting regional variants across ${allProducts.length} products...`);
      detectRegionalVariants(allProducts);
      
      // Count regional connections
      const regionalCount = allProducts.filter(p => p.regional_availability === 1).length;
      console.log(`✅ Found ${regionalCount} products with regional variants`);
      
      // Sort products by timestamp
      Object.keys(currencyResults).forEach(currency => {
        currencyResults[currency].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      });
      
      // Create currency manifest
      const currencyManifest = {
        available_currencies: [],
        last_updated: new Date().toISOString(),
        total_products: processingStats.processed,
        default_currency: 'INR'
      };
      
      // Write individual currency files
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
      
      // Final file state check
      const finalFiles = fs.existsSync(dataDir) ? fs.readdirSync(dataDir) : [];
      const generatedFiles = new Set([
        'last_updated.txt',
        'products.csv',
        ...Object.keys(currencyResults).map(c => `products-${c}.json`),
        'currencies.json'
      ]);
      const remnantFiles = finalFiles.filter(file => !generatedFiles.has(file));
      
      // Enhanced summary with validation stats
      const summary = `VibeDrips Data Processing Summary
Generated: ${new Date().toISOString()}

📊 STATISTICS
- Total Rows Processed: ${processingStats.total}
- Products Successfully Processed: ${processingStats.processed}
- Errors Encountered: ${processingStats.errors}
- Success Rate: ${((processingStats.processed / processingStats.total) * 100).toFixed(1)}%

⚠️ VALIDATION
- Records Flagged: ${processingStats.validationErrors}
- Auto-corrected: ${processingStats.validationErrors}
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

📁 FILES BEFORE DELETION
${filesBeforeDeletion.map(file => `- ${file}`).join('\n') || '- None'}

📁 FILES DELETED
${deletedFiles.length > 0 ? deletedFiles.map(file => `- ${file}`).join('\n') : '- None'}

📁 FILES PRESENT AFTER DELETION
${filesAfterDeletion.map(file => `- ${file}`).join('\n') || '- None'}
${unexpectedFiles.length > 0 ? `\n⚠️ Deletion failed for unexpected files:\n${unexpectedFiles.map(file => `- ${file}`).join('\n')}` : ''}

📁 FILES GENERATED
${Object.keys(currencyResults).map(currency => `- products-${currency}.json (${currencyResults[currency].length} products)`).join('\n')}
- currencies.json (manifest)

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
        console.log(`👉 Check products-*.json files for Error-Flag and Error-Reason fields`);
      }
      
      if (processingStats.errors > 0) {
        console.log(`⚠️ ${processingStats.errors} rows had processing errors`);
      }
      
      if (remnantFiles.length > 0) {
        console.log(`⚠️ ${remnantFiles.length} remnant files detected: ${remnantFiles.join(', ')}`);
      }
    })
    .on('error', (error) => {
      console.error('❌ Error processing CSV:', error);
      process.exit(1);
    });
}

// Run the conversion
console.log('🚀 VibeDrips Multi-Currency Product Processor v2.0');
console.log('================================================');
console.log('✨ With Config-Driven Validation System');
console.log('');
convertCsvToJson();
