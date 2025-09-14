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

    // Log files present before deletion
    console.log('🔄 Checking files before deletion...');
    const filesBeforeDeletion = fs.existsSync(dataDir) ? fs.readdirSync(dataDir) : [];
    console.log('📋 Files present before deletion:', filesBeforeDeletion);

    // Delete old files and log to last_updated.txt
    console.log('🔄 Deleting old files...');
    const deletedFiles = deleteOldFiles();
    console.log('✅ Old files deletion complete.');
    let lastUpdatedContent = `VibeDrips Data Processing Summary\nGenerated: ${new Date('2025-09-14T14:34:00+05:30').toISOString()} // 03:34 PM IST\n\n📊 STATISTICS\n- Total Rows Processed: 0\n- Products Successfully Processed: 0\n- Errors Encountered: 0\n- Success Rate: 0.0%\n\n💰 CURRENCIES\n- Currencies Found: 0\n- Available: \n\n📦 CATEGORIES\n- Categories Found: 0\n- Top Categories: \n\n🏷️ BRANDS\n- Brands Found: 0\n- Top Brands: \n\n📁 FILES BEFORE DELETION\n${filesBeforeDeletion.map(file => `- ${file}`).join('\n') || '- None'}\n\n📁 FILES DELETED\n${deletedFiles.length > 0 ? deletedFiles.map(file => `- ${file}`).join('\n') : '- None'}\n\n📁 FILES PRESENT AFTER DELETION\n`;
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
                console.log(`Row ${processingStats.total} - Currency: "${data.Currency}", Price: "${data.price}"`);

                let currency = null;
                if (data.Currency && data.Currency.trim()) {
                    const currencyValue = data.Currency.trim();
                    console.log(`Detected Currency Value: "${currencyValue}"`);
                    currency = CURRENCY_PATTERNS[currencyValue] || currencyValue.toUpperCase();
                    if (!CURRENCY_MAP[currency] && currency !== 'MISC') currency = 'MISC';
                }
                if (!currency && data.price) {
                    currency = detectCurrencyFromPrice(data.price) || 'MISC';
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
                    symbol: currency === 'MISC' ? '🎁' : (CURRENCY_MAP[currency]?.symbol || currency),
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
                    timestamp: data.Timestamp ? new Date(data.Timestamp).toISOString() : new Date('2025-09-14T14:34:00+05:30').toISOString(), // 03:34 PM IST
                    manufacturer: data.manufacturer || '',
                    country_of_origin: data.country_of_origin || '',
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
                last_updated: new Date('2025-09-14T14:34:00+05:30').toISOString(), // 03:34 PM IST
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

            // Handle MISC file if no products and not deleted
            if ((!currencyResults['MISC'] || currencyResults['MISC'].length === 0) && fs.existsSync(path.join(dataDir, 'products-MISC.json'))) {
                const miscFilepath = path.join(dataDir, 'products-MISC.json');
                fs.writeFileSync(miscFilepath, JSON.stringify({ note: "No products to display at the moment." }, null, 2));
                console.log(`💰 MISC: 0 products → products-MISC.json (note added)`);
                const miscInfo = {
                    code: 'MISC',
                    name: 'Random Drops',
                    symbol: '🎁',
                    countries: ['Global'],
                    product_count: 0,
                    filename: 'products-MISC.json',
                    categories: [],
                    brands: [],
                    price_range: { min: 0, max: 0 }
                };
                currencyManifest.available_currencies.push(miscInfo);
            }

            // Final file state check
            const finalFiles = fs.existsSync(dataDir) ? fs.readdirSync(dataDir) : [];
            const generatedFiles = new Set(['last_updated.txt', 'products.csv', ...Object.keys(currencyResults).map(c => `products-${c}.json`), 'currencies.json']);
            const remnantFiles = finalFiles.filter(file => !generatedFiles.has(file) && file !== 'products-MISC.json');

            const summary = `VibeDrips Data Processing Summary\nGenerated: ${new Date('2025-09-14T14:34:00+05:30').toISOString()} // 03:34 PM IST\n\n📊 STATISTICS\n- Total Rows Processed: ${processingStats.total}\n- Products Successfully Processed: ${processingStats.processed}\n- Errors Encountered: ${processingStats.errors}\n- Success Rate: ${((processingStats.processed / processingStats.total) * 100).toFixed(1)}%\n\n💰 CURRENCIES\n- Currencies Found: ${processingStats.currenciesFound.size}\n- Available: ${Array.from(processingStats.currenciesFound).join(', ')}\n\n📦 CATEGORIES\n- Categories Found: ${processingStats.categoriesFound.size}\n- Top Categories: ${Array.from(processingStats.categoriesFound).slice(0, 5).join(', ') || 'None'}\n\n🏷️ BRANDS\n- Brands Found: ${processingStats.brandsFound.size}\n- Top Brands: ${Array.from(processingStats.brandsFound).slice(0, 5).join(', ') || 'None'}\n\n📁 FILES BEFORE DELETION\n${filesBeforeDeletion.map(file => `- ${file}`).join('\n') || '- None'}\n\n📁 FILES DELETED\n${deletedFiles.length > 0 ? deletedFiles.map(file => `- ${file}`).join('\n') : '- None'}\n\n📁 FILES PRESENT AFTER DELETION\n${filesAfterDeletion.map(file => `- ${file}`).join('\n') || '- None'}\n${unexpectedFiles.length > 0 ? `\n⚠️ Deletion failed for unexpected files:\n${unexpectedFiles.map(file => `- ${file}`).join('\n')}` : ''}\n\n📁 FILES GENERATED\n${Object.keys(currencyResults).map(currency => `- products-${currency}.json (${currencyResults[currency].length} products)`).join('\n')}\n${(!currencyResults['MISC'] || currencyResults['MISC'].length === 0) && fs.existsSync(path.join(dataDir, 'products-MISC.json')) ? '- products-MISC.json (note)' : ''}\n- currencies.json (manifest)\n\n📁 FINAL FILES PRESENT\n${finalFiles.map(file => `- ${file}`).join('\n') || '- None'}\n${remnantFiles.length > 0 ? `\n⚠️ Remnant files detected:\n${remnantFiles.map(file => `- ${file}`).join('\n')}` : ''}`;
            fs.writeFileSync(path.join(dataDir, 'last_updated.txt'), summary);

            console.log('\n✅ SUCCESS! Multi-currency data processing complete.');
            console.log(`📁 Generated ${Object.keys(currencyResults).length + ((!currencyResults['MISC'] || currencyResults['MISC'].length === 0) && fs.existsSync(path.join(dataDir, 'products-MISC.json')) ? 1 : 0)} currency files`);
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
