// convert-csv.js - Enhanced Multi-Currency Product Processor (STDIN Version)
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
    
    // Check for specific patterns first (more specific ones)
    if (priceString.includes('C$')) return 'CAD';
    if (priceString.includes('A$')) return 'AUD';
    if (priceString.includes('R$')) return 'BRL';
    if (priceString.includes('S$')) return 'SGD';
    
    // Check for other currency symbols
    for (const [symbol, currency] of Object.entries(CURRENCY_PATTERNS)) {
        if (priceString.includes(symbol)) {
            return currency;
        }
    }
    
    return null;
}

function cleanAndValidatePrice(priceString) {
    if (!priceString) return 0;
    
    // Remove currency symbols and clean the string
    const cleanPrice = priceString.replace(/[₹$€£¥C$A$R$د\.إS$﷼krzł,]/g, '').trim();
    const price = parseFloat(cleanPrice);
    
    return isNaN(price) ? 0 : price;
}

function extractMainCategory(categoryHierarchy) {
    if (!categoryHierarchy) return '';
    const parts = categoryHierarchy.split('>').map(part => part.trim());
    return parts[0] || '';
}

function generateAsin() {
    return 'B0' + Date.now().toString().slice(-8) + Math.random().toString(36).substr(2, 2).toUpperCase();
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
    
    // Ensure data directory exists
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    
    console.log('🔄 Processing CSV from input...');
    
    // Read from standard input instead of file
    process.stdin
        .pipe(csv())
        .on('data', (data) => {
            processingStats.total++;
            
            try {
                // Debug: Log first few rows to see what columns we're getting
                if (processingStats.total <= 3) {
                    console.log(`Row ${processingStats.total} columns:`, Object.keys(data));
                    console.log(`Sample data:`, data);
                }
                
                // Detect currency - primary from Currency column, fallback to price parsing
                let currency = null;
                
                if (data.Currency && data.Currency.trim()) {
                    currency = data.Currency.trim().toUpperCase();
                } else if (data.price) {
                    currency = detectCurrencyFromPrice(data.price);
                }
                
                // Default to MISC if no currency detected
                if (!currency || !CURRENCY_MAP[currency]) {
                    currency = 'MISC';
                }
                
                processingStats.currenciesFound.add(currency);
                
                // Parse images array
                let allImages = [];
                if (data.AllImages) {
                    try {
                        // Handle both JSON array string and comma-separated values
                        if (data.AllImages.startsWith('[') && data.AllImages.endsWith(']')) {
                            allImages = JSON.parse(data.AllImages);
                        } else {
                            allImages = data.AllImages.split(',').map(img => img.trim().replace(/"/g, ''));
                        }
                    } catch (e) {
                        allImages = data.AllImages.split(',').map(img => img.trim());
                    }
                }
                
                // Clean and transform the data
                const product = {
                    asin: data.asin || generateAsin(),
                    name: (data.productTitle || data.title || data.name || 'Untitled Product').trim(),
                    description: (data.Description || data.description || '').trim(),
                    price: cleanAndValidatePrice(data.price),
                    currency: currency,
                    brand: (data.brand || 'VibeDrips').trim(),
                    category: data.category || extractMainCategory(data.categoryHierarchy) || 'General',
                    subcategory: data.productType || data.itemTypeName || '',
                    
                    // Images
                    main_image: data.MainImage || data.image || '',
                    all_images: allImages.filter(img => img && img.length > 0),
                    
                    // Product details
                    model_number: data.model_number || '',
                    model_name: data.modelName || '',
                    color: data.color || '',
                    material: data.material || '',
                    size: data.size || '',
                    dimensions: data.dimensions || '',
                    weight: data.weight || '',
                    
                    // Theme/Collection
                    theme: data.theme || '',
                    collection: data.collectionName || '',
                    character: data.character || '',
                    animal_theme: data.animalTheme || '',
                    team_name: data.teamName || '',
                    
                    // Technical specs
                    batteries_required: data.batteriesRequired === 'true' || data.batteriesRequired === '1' || data.batteriesRequired === 'Yes',
                    batteries_included: data.batteriesIncluded === 'true' || data.batteriesIncluded === '1' || data.batteriesIncluded === 'Yes',
                    number_of_batteries: parseInt(data.numberOfBatteries) || 0,
                    assembly_required: data.assemblyRequired === 'true' || data.assemblyRequired === '1' || data.assemblyRequired === 'Yes',
                    
                    // Age and features
                    minimum_age: parseInt(data.minimumAge) || 0,
                    number_of_pieces: parseInt(data.numberOfPieces) || 0,
                    included_components: data.includedComponents || '',
                    additional_features: data.additionalFeatures || '',
                    
                    // Ratings and availability
                    customer_rating: parseFloat(data.customerRating) || 0,
                    review_count: parseInt(data.reviewCount) || 0,
                    availability: data.availability || 'Unknown',
                    date_first_available: data.dateFirstAvailable || '',
                    
                    // Links
                    source_link: data['Product Source Link'] || '',
                    amazon_short: data['Amazon SiteStripe (Short)'] || '',
                    amazon_long: data['Amazon SiteStripe (Long)'] || '',
                    affiliate_link: data['Amazon SiteStripe (Short)'] || data['Amazon SiteStripe (Long)'] || data['Product Source Link'] || '',
                    
                    // Metadata
                    timestamp: data.Timestamp || new Date().toISOString(),
                    manufacturer: data.manufacturer || '',
                    country_of_origin: data.countryOfOrigin || '',
                    
                    // Additional categorization
                    featured: Math.random() < 0.2, // 20% chance of being featured
                    trending: Math.random() < 0.3   // 30% chance of being trending
                };
                
                // Track stats
                if (product.category) processingStats.categoriesFound.add(product.category);
                if (product.brand) processingStats.brandsFound.add(product.brand);
                
                // Group by currency
                if (!currencyResults[currency]) {
                    currencyResults[currency] = [];
                }
                currencyResults[currency].push(product);
                
                processingStats.processed++;
                
            } catch (error) {
                processingStats.errors++;
                console.error(`Error processing row ${processingStats.total}:`, error.message);
            }
        })
        .on('end', () => {
            console.log('📊 Processing Complete! Generating files...');
            
            // Sort products in each currency by timestamp (newest first)
            Object.keys(currencyResults).forEach(currency => {
                currencyResults[currency].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            });
            
            // Generate individual currency files
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
                
                // Write currency-specific file
                fs.writeFileSync(filepath, JSON.stringify(products, null, 2));
                
                // Add to manifest
                const currencyInfo = {
                    code: currency,
                    name: currency === 'MISC' ? 'Random Drops' : (CURRENCY_MAP[currency]?.name || currency),
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
            
            // Sort currencies by product count (descending)
            currencyManifest.available_currencies.sort((a, b) => b.product_count - a.product_count);
            
            // Write currencies manifest
            const manifestPath = path.join(dataDir, 'currencies.json');
            fs.writeFileSync(manifestPath, JSON.stringify(currencyManifest, null, 2));
            
            // Write processing summary
            const summaryPath = path.join(dataDir, 'last_updated.txt');
            const summary = `VibeDrips Data Processing Summary
Generated: ${new Date().toISOString()}

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
            
            fs.writeFileSync(summaryPath, summary);
            
            console.log('\n✅ SUCCESS! Multi-currency data processing complete.');
            console.log(`📁 Generated ${Object.keys(currencyResults).length} currency files`);
            console.log(`📊 Processed ${processingStats.processed} products from ${processingStats.total} rows`);
            console.log(`💰 Currencies: ${Array.from(processingStats.currenciesFound).join(', ')}`);
            
            if (processingStats.errors > 0) {
                console.log(`⚠️  ${processingStats.errors} rows had processing errors`);
            }
        })
        .on('error', (error) => {
            console.error('❌ Error processing CSV:', error);
            process.exit(1);
        });
}

// Run the conversion
console.log('🚀 VibeDrips Multi-Currency Product Processor (STDIN)');
console.log('====================================================');
convertCsvToJson();
