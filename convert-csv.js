const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

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
  
  // Direct currency code match (INR, USD, etc.)
  if (CURRENCY_MAP[trimmed.toUpperCase()]) {
    console.log(`✅ Direct code match: ${trimmed.toUpperCase()}`);
    return trimmed.toUpperCase();
  }
  
  // Symbol match (₹, $, €, etc.)
  if (CURRENCY_PATTERNS[trimmed]) {
    console.log(`✅ Symbol match: ${trimmed} → ${CURRENCY_PATTERNS[trimmed]}`);
    return CURRENCY_PATTERNS[trimmed];
  }
  
  // Check if it contains a known symbol
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
  
  // Remove currency symbols and commas
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

function convertCsvToJson() {
  const currencyResults = {};
  const processingStats = {
    total: 0,
    processed: 0,
    errors: 0,
    currenciesFound: new Set(),
    categoriesFound: new Set(),
    brandsFound: new Set()
  };

  console.log('🔄 Checking files before deletion...');
  const filesBeforeDeletion = fs.existsSync(dataDir) ? fs.readdirSync(dataDir) : [];
  console.log('📋 Files present before deletion:', filesBeforeDeletion);

  console.log('🔄 Deleting old files...');
  const deletedFiles = deleteOldFiles();
  console.log('✅ Old files deletion complete.');

  let lastUpdatedContent = `VibeDrips Data Processing Summary\nGenerated: ${new Date().toISOString()}\n\n📊 STATISTICS\n- Total Rows Processed: 0\n- Products Successfully Processed: 0\n- Errors Encountered: 0\n- Success Rate: 0.0%\n\n💰 CURRENCIES\n- Currencies Found: 0\n- Available: \n\n📦 CATEGORIES\n- Categories Found: 0\n- Top Categories: \n\n🏷️ BRANDS\n- Brands Found: 0\n- Top Brands: \n\n📁 FILES BEFORE DELETION\n${filesBeforeDeletion.map(file => `- ${file}`).join('\n') || '- None'}\n\n📁 FILES DELETED\n${deletedFiles.length > 0 ? deletedFiles.map(file => `- ${file}`).join('\n') : '- None'}\n\n📁 FILES PRESENT AFTER DELETION\n`;

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

        // Use improved currency detection
        if (data.Currency && data.Currency.trim()) {
          currency = detectCurrencyFromField(data.Currency);
        }

        // Fallback to price detection
        if (!currency && data.price) {
          currency = detectCurrencyFromPrice(data.price);
          console.log(`🔍 Currency from price: ${currency}`);
        }

        // Default to MISC if no currency detected
        if (!currency) {
          currency = 'MISC';
          console.log(`🎁 Defaulting to MISC`);
        }

        console.log(`✅ Final currency: ${currency}`);
        processingStats.currenciesFound.add(currency);
        
        if (data.categoryHierarchy) processingStats.categoriesFound.add(extractMainCategory(data.categoryHierarchy));
        if (data.brand) processingStats.brandsFound.add(data.brand);

        // UPDATED: Product object mapping for new CSV structure
        const product = {
          asin: generateAsin(data),
          name: data.productTitle || data.Title || '',
          description: data.Description || '',
          price: cleanAndValidatePrice(data.price),
          currency: currency,
          symbol: currency === 'MISC' ? '🎁' : (CURRENCY_MAP[currency]?.symbol || currency),
          brand: data.brand || '',
          
          // Updated category mapping
          category: extractMainCategory(data.categoryHierarchy || data.Category),
          subcategory: data.itemTypeName || '',
          
          // Images - Handle JSON string format
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
          
          // Rating - Support both field names
          customer_rating: data.customerRating || data.Rating || '',
          review_count: parseInt(data.reviewCount || data.ReviewCount) || 0,
          
          availability: data.availability || '',
          
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
          
          // Pricing
          original_price: data.originalPrice || '',
          discount_percentage: data.discountPercentage || '',
          
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

      const summary = `VibeDrips Data Processing Summary\nGenerated: ${new Date().toISOString()}\n\n📊 STATISTICS\n- Total Rows Processed: ${processingStats.total}\n- Products Successfully Processed: ${processingStats.processed}\n- Errors Encountered: ${processingStats.errors}\n- Success Rate: ${((processingStats.processed / processingStats.total) * 100).toFixed(1)}%\n\n💰 CURRENCIES\n- Currencies Found: ${processingStats.currenciesFound.size}\n- Available: ${Array.from(processingStats.currenciesFound).join(', ')}\n\n📦 CATEGORIES\n- Categories Found: ${processingStats.categoriesFound.size}\n- Top Categories: ${Array.from(processingStats.categoriesFound).slice(0, 5).join(', ') || 'None'}\n\n🏷️ BRANDS\n- Brands Found: ${processingStats.brandsFound.size}\n- Top Brands: ${Array.from(processingStats.brandsFound).slice(0, 5).join(', ') || 'None'}\n\n📁 FILES BEFORE DELETION\n${filesBeforeDeletion.map(file => `- ${file}`).join('\n') || '- None'}\n\n📁 FILES DELETED\n${deletedFiles.length > 0 ? deletedFiles.map(file => `- ${file}`).join('\n') : '- None'}\n\n📁 FILES PRESENT AFTER DELETION\n${filesAfterDeletion.map(file => `- ${file}`).join('\n') || '- None'}\n${unexpectedFiles.length > 0 ? `\n⚠️ Deletion failed for unexpected files:\n${unexpectedFiles.map(file => `- ${file}`).join('\n')}` : ''}\n\n📁 FILES GENERATED\n${Object.keys(currencyResults).map(currency => `- products-${currency}.json (${currencyResults[currency].length} products)`).join('\n')}\n- currencies.json (manifest)\n\n📁 FINAL FILES PRESENT\n${finalFiles.map(file => `- ${file}`).join('\n') || '- None'}\n${remnantFiles.length > 0 ? `\n⚠️ Remnant files detected:\n${remnantFiles.map(file => `- ${file}`).join('\n')}` : ''}`;

      fs.writeFileSync(path.join(dataDir, 'last_updated.txt'), summary);

      console.log('\n✅ SUCCESS! Multi-currency data processing complete.');
      console.log(`📁 Generated ${Object.keys(currencyResults).length} currency files`);
      console.log(`📊 Processed ${processingStats.processed} products from ${processingStats.total} rows`);
      console.log(`💰 Currencies: ${Array.from(processingStats.currenciesFound).join(', ')}`);
      if (processingStats.errors > 0) console.log(`⚠️ ${processingStats.errors} rows had processing errors`);
      if (remnantFiles.length > 0) console.log(`⚠️ ${remnantFiles.length} remnant files detected: ${remnantFiles.join(', ')}`);
    })
    .on('error', (error) => {
      console.error('❌ Error processing CSV:', error);
      process.exit(1);
    });
}

// Run the conversion
console.log('🚀 VibeDrips Multi-Currency Product Processor');
console.log('===========================================');
convertCsvToJson();
