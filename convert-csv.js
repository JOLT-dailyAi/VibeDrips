// convert-csv.js
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

const csvFilePath = path.join(__dirname, 'data', 'products.csv');
const jsonFilePath = path.join(__dirname, 'data', 'products.json');

function convertCsvToJson() {
    const results = [];
    
    if (!fs.existsSync(csvFilePath)) {
        console.error('CSV file not found:', csvFilePath);
        process.exit(1);
    }
    
    fs.createReadStream(csvFilePath)
        .pipe(csv())
        .on('data', (data) => {
            // Clean and transform the data for website use
            const product = {
                id: data.asin || generateId(),
                name: data.productTitle || 'Untitled Product',
                description: data.Description || '',
                price: parseFloat(data.price) || 0,
                currency: data.Currency || 'USD',
                brand: data.brand || '',
                category: data.category || extractMainCategory(data.categoryHierarchy),
                subcategory: data.productType || data.itemTypeName || '',
                
                // Images
                main_image: data.MainImage || '',
                all_images: data.AllImages ? data.AllImages.split(',').map(img => img.trim()) : [],
                
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
                batteries_required: data.batteriesRequired === 'true' || data.batteriesRequired === '1',
                batteries_included: data.batteriesIncluded === 'true' || data.batteriesIncluded === '1',
                number_of_batteries: parseInt(data.numberOfBatteries) || 0,
                assembly_required: data.assemblyRequired === 'true' || data.assemblyRequired === '1',
                
                // Age and features
                minimum_age: parseInt(data.minimumAge) || 0,
                number_of_pieces: parseInt(data.numberOfPieces) || 0,
                included_components: data.includedComponents || '',
                additional_features: data.additionalFeatures || '',
                
                // Ratings and availability
                customer_rating: parseFloat(data.customerRating) || 0,
                review_count: parseInt(data.reviewCount) || 0,
                availability: data.availability || '',
                date_first_available: data.dateFirstAvailable || '',
                
                // Links
                source_link: data['Product Source Link'] || '',
                amazon_short: data['Amazon SiteStripe (Short)'] || '',
                amazon_long: data['Amazon SiteStripe (Long)'] || '',
                affiliate_link: data['Amazon SiteStripe (Short)'] || data['Amazon SiteStripe (Long)'] || data['Product Source Link'] || '',
                
                // Metadata
                timestamp: data.Timestamp || new Date().toISOString(),
                manufacturer: data.manufacturer || '',
                country_of_origin: data.countryOfOrigin || ''
            };
            
            results.push(product);
        })
        .on('end', () => {
            // Sort products by timestamp (newest first)
            results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            
            // Ensure data directory exists
            const dataDir = path.dirname(jsonFilePath);
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }
            
            // Write JSON file
            fs.writeFileSync(jsonFilePath, JSON.stringify(results, null, 2));
            
            console.log(`Successfully converted ${results.length} products from CSV to JSON`);
            console.log(`JSON file saved to: ${jsonFilePath}`);
            
            // Log some stats
            const categories = [...new Set(results.map(p => p.category).filter(Boolean))];
            const brands = [...new Set(results.map(p => p.brand).filter(Boolean))];
            
            console.log(`Categories found: ${categories.length}`);
            console.log(`Brands found: ${brands.length}`);
            console.log(`Average price: $${(results.reduce((sum, p) => sum + p.price, 0) / results.length).toFixed(2)}`);
        })
        .on('error', (error) => {
            console.error('Error processing CSV:', error);
            process.exit(1);
        });
}

// Helper functions
function extractMainCategory(categoryHierarchy) {
    if (!categoryHierarchy) return '';
    const parts = categoryHierarchy.split('>').map(part => part.trim());
    return parts[0] || '';
}

function generateId() {
    return 'prod_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

convertCsvToJson();
