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

function deleteOldFiles() {
    if (!fs.existsSync(dataDir)) return;
    const files = fs.readdirSync(dataDir);
    files.forEach(file => {
        const filePath = path.join(dataDir, file);
        if (file !== 'products.csv' && file !== 'last_updated.txt') {
            fs.unlinkSync(filePath);
            console.log(`Deleted ${file}`);
        }
    });
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

    // Delete old files before processing
    deleteOldFiles();

    console.log('🔄 Processing CSV from input...');

    process.stdin
        .pipe(csv())
        .on('data', (data) => {
            processingStats.total++;

            try {
                if (processingStats.total <= 3) {
                    console.log(`Row ${processingStats.total} columns:`, Object.keys(data));
                    console.log(`Sample data:`, data);
                }

                let currency = null;
                if (data.Currency && data.Currency.trim()) {
                    const currencyValue = data.Currency.trim();
                    if (CURRENCY_PATTERNS[currencyValue]) {
                        currency = CURRENCY_PATTERNS[currencyValue];
                    } else if (CURRENCY_MAP[currencyValue.toUpperCase()]) {
                        currency = currencyValue.toUpperCase();
                    }
                }
                if (!currency && data.price) {
                    currency = detectCurrencyFromPrice(data.price);
                }
                if (!currency || !CURRENCY_MAP[currency]) {
                    currency = 'MISC';
                }

                processingStats.currenciesFound.add(currency);
                if (data.categoryHierarchy) processingStats.categoriesFound.add(extractMainCategory(data.categoryHierarchy));
                if (data.brand) processingStats.brandsFound.add(data.brand);

                const product = {
                    asin: generateAsin(data),
                    name: data.productTitle || '',
                    description: data.Description || '',
                    price: cleanAndValidatePrice(data.price),
                    currency: currency,
                    brand: data.brand || '',
                    category: extractMainCategory(data.categoryHierarchy),
                    subcategory: data.itemTypeName || '',
                    main_image: data.MainImage || '',
                    all_images: data.AllImages ? data.AllImages.split(',') : [],
                    model_number: data.model_number || '',
                    model_name: data.modelName || '',
                    color: data.color || '',
                    material: data.material || '',
                    size: data.size || '',
                    dimensions: data.dimensions || '',
                    weight: data.weight || '',
                    theme: data.theme || '',
                    collection: data.collectionName || '',
                    character: data.character || '',
                    animal_theme: data.animalTheme || '',
                    team_name: data.teamName || '',
                    batteries_required: data.batteriesRequired === 'Yes' || data.batteriesRequired === 'true',
                    batteries_included: data.batteriesIncluded === 'Yes' || data.batteriesIncluded === 'true',
                    number_of_batteries: parseInt(data.numberOfBatteries) || 0,
                    assembly_required: data.assemblyRequired === 'Yes' || data.assemblyRequired === 'true',
                    minimum_age: parseInt(data.minimumAge) || 0,
                    number_of_pieces: parseInt(data.numberOfPieces) || 0,
                    included_components: data.includedComponents || '',
                    additional_features: data.additionalFeatures || '',
                    customer_rating: parseFloat(data.customerRating) || 0,
                    review_count: parseInt(data.reviewCount) || 0,
                    availability: data.availability || '',
                    date_first_available: data.dateFirstAvailable || '',
                    source_link: data['Product Source Link'] || '',
                    amazon_short: data['Amazon SiteStripe (Short)'] || '',
                    amazon_long: data['Amazon SiteStripe (Long)'] || '',
                    affiliate_link: data['Amazon SiteStripe (Short)'] || '',
                    timestamp: data.Timestamp ? new Date(data.Timestamp).toISOString() : new Date('2025-09-14T13:25:00+05:30').toISOString(), // 02:25 PM IST
                    manufacturer: data.manufacturer || '',
                    country_of_origin: data.countryOfOrigin || '',
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
            Object.keys(currencyResults).forEach(currency => {
                currencyResults[currency].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            });

            const currencyManifest = {
                available_currencies: [],
                last_updated: new Date('2025-09-14T13:25:00+05:30').toISOString(), // 02:25 PM IST
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
                    name: currency === 'MISC' ? 'Random Drops' : (CURRENCY_MAP[currency]?.name || currency),
                    symbol: currency === 'MISC' ? '🎁' : (CURRENCY_MAP[currency]?.symbol || currency),
                    countries: currency === 'MISC' ? ['Global'] : (CURRENCY_MAP[currency]?.countries || []),
                    product_count: products.length,
                    filename: filename,
                    categories: [...new Set(products.map(p => p.category))].filter(Boolean),
                    brands: [...new Set(products.map(p => p.brand))].filter(Boolean),
                    price_range: products.length > 0 ? { min: Math.min(...products.map(p => p.price).filter(p => p > 0)), max: Math.max(...products.map(p => p.price)) } : { min: 0, max: 0 }
                };
                currencyManifest.available_currencies.push(currencyInfo);
                console.log(`💰 ${currency}: ${products.length} products → ${filename}`);
            });

            currencyManifest.available_currencies.sort((a, b) => b.product_count - a.product_count);
            fs.writeFileSync(path.join(dataDir, 'currencies.json'), JSON.stringify(currencyManifest, null, 2));

            const summary = `VibeDrips Data Processing Summary
Generated: ${new Date('2025-09-14T13:25:00+05:30').toISOString()} // 02:25 PM IST

📊 STATISTICS
- Total Rows Processed: ${processingStats.total}
- Products Successfully Processed: ${processingStats.processed}
- Errors Encountered: ${processingStats.errors}
- Success Rate: ${((processingStats.processed / processingStats.total) * 100).toFixed(1)}%

💰 CURRENCIES
- Currencies Found: ${processingStats.currenciesFound.size}
- Available: ${Array.from(processingStats.currenciesFound).join(', ')}

📦 CATEGORIES
- Categories Found: ${processingStats.categoriesFound.size}
- Top Categories: ${Array.from(processingStats.categoriesFound).slice(0, 5).join(', ')}

🏷️ BRANDS
- Brands Found: ${processingStats.brandsFound.size}
- Top Brands: ${Array.from(processingStats.brandsFound).slice(0, 5).join(', ')}

📁 FILES GENERATED
${Object.keys(currencyResults).map(currency => `- products-${currency}.json (${currencyResults[currency].length} products)`).join('\n')}
- currencies.json (manifest)`;
            fs.writeFileSync(path.join(dataDir, 'last_updated.txt'), summary);

            console.log('\n✅ SUCCESS! Multi-currency data processing complete.');
            console.log(`📁 Generated ${Object.keys(currencyResults).length} currency files`);
            console.log(`📊 Processed ${processingStats.processed} products from ${processingStats.total} rows`);
            console.log(`💰 Currencies: ${Array.from(processingStats.currenciesFound).join(', ')}`);
            if (processingStats.errors > 0) console.log(`⚠️ ${processingStats.errors} rows had processing errors`);
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
