# VibeDrips
**Drops that Drip. Curated Finds, Digitally Yours.**

A modern, static affiliate e-commerce platform showcasing curated digital finds and trending products across global markets. Built with vanilla HTML, CSS, and JavaScript for maximum performance and compatibility.

![VibeDrips Banner](https://raw.githubusercontent.com/JOLT-dailyAi/VibeDrips/main/assets/images/VibeDrips_DP.png)

## 🌍 Multi-Currency Support

VibeDrips automatically detects and separates products by currency, creating dedicated shopping experiences for different regions with **no currency conversion** - each region shows products in their native currency.

### Supported Currencies & Regions
- **INR** (₹) - India (Default)
- **USD** ($) - United States
- **EUR** (€) - Germany, France, Italy, Spain, Netherlands, Belgium, Ireland
- **GBP** (£) - United Kingdom
- **JPY** (¥) - Japan
- **CAD** (C$) - Canada
- **AUD** (A$) - Australia
- **BRL** (R$) - Brazil
- **MXN** ($) - Mexico
- **AED** (د.إ) - United Arab Emirates
- **SGD** (S$) - Singapore
- **SAR** (﷼) - Saudi Arabia
- **SEK** (kr) - Sweden
- **PLN** (zł) - Poland
- **MISC** (🎁) - Random Drops (Global)

## 🏗️ Project Structure

```
VibeDrips/
├── .github/workflows/          # GitHub Actions automation
│   └── process-csv.yml         # Daily CSV to JSON conversion
├── convert-csv.js              # Backend automation (ROOT)
├── cleanup-old-files.js        # Backend automation (ROOT)  
├── data/                       # Generated data files
│   ├── products.csv            # Source CSV data
│   ├── currencies.json         # Available currencies manifest
│   ├── products-INR.json       # Indian products
│   ├── products-USD.json       # US products
│   ├── products-EUR.json       # European products
│   ├── products-MISC.json      # Random drops
│   └── last_updated.txt        # Processing log
├── assets/
│   ├── js/                     # Frontend JavaScript modules
│   │   ├── main.js             # Core app logic & initialization
│   │   ├── currency.js         # Currency detection & formatting
│   │   └── products.js         # Product display & filtering
│   ├── css/
│   │   ├── main.css            # Core styles & layout
│   │   ├── products.css        # Product-specific styles
│   │   └── mobile.css          # Mobile responsive styles
│   └── images/
│       ├── VibeDrips.png       # Header logo (300px)
│       └── VibeDrips_DP.png    # Footer logo (550px) & favicon
├── index.html                  # Main application page
└── README.md
```

## 🔄 Data Processing Pipeline

### Automated Workflow
- **Trigger**: Daily at midnight UTC or when `products.csv` is updated
- **Process**: `convert-csv.js` converts CSV to currency-specific JSON files
- **Output**: Separate product files for each detected currency (no conversion)

### Currency Detection Logic
1. **Primary**: Check `Currency` column in CSV
2. **Fallback**: Parse currency symbols from price field (₹, $, €, etc.)
3. **Default**: Products without clear currency go to `products-MISC.json`

### Data Transformation
- Cleans and structures product data from CSV
- Extracts categories, subcategories, and brands
- Processes affiliate links (Amazon SiteStripe Short/Long)
- Handles product images (MainImage + AllImages array)
- Sorts by `dateFirstAvailable` then `timestamp`

## 🚀 Key Features

### Smart Regional Loading
- **IP Geolocation**: Detects user's region automatically
- **Currency Auto-Selection**: Shows only currencies with available products  
- **Fallback to INR**: Default market when detection fails
- **Direct JSON Loading**: No client-side currency conversion

### Enhanced Product Display
- **New Card Layout**: Source embed on left, image carousel on right
- **Amazon Integration**: Direct redirect via SiteStripe Short/Long links
- **Hot Products**: Based on `dateFirstAvailable` (Sep/Oct 2025), fallback to `timestamp`
- **Image Carousel**: MainImage + AllImages with navigation dots

### Advanced Filtering System
- **🔥 Hot This Month**: Products from current month based on `dateFirstAvailable`
- **⭐ Featured Products**: Curated highlights
- **🆕 New Arrivals**: Recent additions (last 30 days)
- **📈 Trending Now**: Popular items
- **🛍️ All Products**: Complete catalog
- **Real-time Search**: Across all product fields
- **Category Filtering**: Dynamic category extraction
- **Multi-Sort Options**: Price, name, rating, date

### Responsive Design
- **Device Detection**: Adaptive layouts for mobile/tablet/desktop
- **Modern UI**: Purple/cyan theme with glassmorphism effects
- **Performance Optimized**: Lazy loading, efficient rendering
- **Static Site**: No backend dependencies

## 🛠️ Technical Implementation

### Core JavaScript Modules

#### `main.js` - Application Core
- App initialization and state management
- IP-based region detection
- Currency auto-selection logic
- Event handling and DOM caching
- Error handling with graceful fallbacks

#### `currency.js` - Currency Management  
- **No Conversion**: Direct price formatting only
- Currency symbol mapping and formatting
- Price cleaning and validation utilities
- Support for 14+ currencies plus MISC

#### `products.js` - Product Operations
- Hot products detection (dateFirstAvailable priority)
- Enhanced product card rendering
- Modal with source embed + image carousel
- Advanced filtering and sorting
- Amazon redirect handling

### Data Flow
```
CSV Source → convert-csv.js → Currency-Specific JSONs → Frontend Loading
     ↓
GitHub Actions (Daily) → Update JSON files → Live site refresh
```

## 📊 Enhanced Product Data Structure

### CSV Input Columns (Key Fields)
```
Timestamp                    - When added to system
Product Source Link          - Instagram/social source
Amazon SiteStripe (Short)    - Primary affiliate link  
Amazon SiteStripe (Long)     - Secondary affiliate link
MainImage                    - Primary product image
AllImages                    - Additional images array
dateFirstAvailable          - Amazon availability date (for "Hot" filter)
Currency                     - Product currency (INR, USD, etc.)
productTitle                 - Product name
Description                  - Product description
price                        - Price in native currency
brand                        - Product brand
categoryHierarchy            - Product category
customerRating               - Product rating (0-5)
reviewCount                  - Number of reviews
```

### JSON Output Structure
```json
{
  "asin": "B09153RZST",
  "name": "Banpresto Demon Slayer Figure",
  "description": "Officially Licensed Anime Figurine...",
  "price": 1999,
  "currency": "INR",
  "brand": "Banpresto",
  "category": "Toys & Games",
  "main_image": "https://m.media-amazon.com/images/...",
  "all_images": ["url1", "url2", "url3"],
  "amazon_short": "https://amzn.to/...",
  "amazon_long": "https://www.amazon.in/...",
  "source_link": "https://www.instagram.com/...",
  "date_first_available": "2021-03-30",
  "customer_rating": 4.8,
  "review_count": 128,
  "timestamp": "2025-09-10T14:55:44Z"
}
```

## 🎨 UI/UX Enhancements

### Product Modal Layout
- **Left Panel**: Source link embed (Instagram/social content)
- **Right Panel**: Image carousel with navigation
- **Bottom Section**: Product details grid + Amazon buy button
- **Responsive**: Stacks vertically on mobile

### Hot Products Algorithm
```javascript
// Priority: dateFirstAvailable > timestamp
const hotProducts = products.filter(product => {
    const date = product.date_first_available || product.timestamp;
    return isCurrentMonth(date) || isLastMonth(date);
}).sort(byDateDescending);
```

### Amazon Redirect Priority
```javascript
const redirectUrl = product.amazon_short || 
                   product.amazon_long || 
                   product.source_link || '#';
```

## 🌐 Social & Support Integration

### Footer Links
- **Instagram**: [@vibedrips.dailyai](https://www.instagram.com/vibedrips.dailyai/)
- **Ko-fi Support**: [Daily AI Tiers](https://ko-fi.com/dailyai/tiers)
- **Branding**: VibeDrips_DP.png (550px) with tagline

### Assets & Branding
- **Header Logo**: VibeDrips.png (300px width)
- **Footer Logo**: VibeDrips_DP.png (550px width) 
- **Favicon**: VibeDrips_DP.png (32x32px for browser tab)

## 📱 Future Enhancements (Phase 4)

### Planned Features
- **Desktop Media**: Background video/music with volume controls
- **Theme System**: Light/dark mode toggle
- **Enhanced Mobile**: Theme switching for mobile optimization
- **Performance**: Further optimizations for loading speeds

### Volume & Theme Controls (Upcoming)
- Speaker icon with hover volume slider
- Desktop/mobile theme toggle button  
- Background media controls for premium experience

## 🔧 Development Setup

### Prerequisites
- Node.js 18+ (for CSV processing)
- GitHub repository with Actions enabled
- Static hosting (GitHub Pages, Netlify, Vercel)

### Local Development
```bash
# Clone repository
git clone https://github.com/JOLT-dailyAi/VibeDrips.git
cd VibeDrips

# Install dependencies for CSV processing
npm init -y
npm install csv-parser

# Process CSV manually (optional)
cat data/products.csv | node convert-csv.js

# Serve locally (any static server)
python -m http.server 8000
# or
npx serve .
```

### Adding New Products
1. Add products to `data/products.csv` with proper `Currency` column
2. Ensure `dateFirstAvailable` is populated for "Hot" filtering
3. Include `Amazon SiteStripe (Short)` for primary affiliate links
4. Push to main branch - GitHub Actions will auto-process

### Currency File Generation
The `convert-csv.js` script automatically:
- Reads CSV from STDIN
- Detects currency from `Currency` column or price symbols
- Creates separate JSON files per currency
- Generates `currencies.json` manifest with metadata
- Updates `last_updated.txt` with processing stats

## 🎯 Performance Features

- **Static Site**: Zero server dependencies, runs anywhere
- **Lazy Loading**: Images load only when needed
- **Efficient Rendering**: Smart DOM updates and caching
- **Mobile Optimized**: Touch-friendly interface with responsive design
- **SEO Ready**: Semantic HTML structure with proper meta tags

## 📈 Analytics Integration Ready

The platform is prepared for:
- Product click tracking (Amazon redirects)
- Search analytics (filter usage patterns)
- Regional performance metrics (currency-based insights)
- Conversion tracking (affiliate link effectiveness)

## 📄 License & Usage

This project is proprietary and confidential. All rights reserved to VibeDrips and Daily AI.

**For support or inquiries:**
- Instagram: [@vibedrips.dailyai](https://www.instagram.com/vibedrips.dailyai/)
- Ko-fi: [Support Daily AI](https://ko-fi.com/dailyai/tiers)

---

*VibeDrips - Where digital curation meets global commerce. 🛍️✨*

**Built with ❤️ by [Daily AI](https://ko-fi.com/dailyai)**
