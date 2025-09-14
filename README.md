# VibeDrips
Curated digital finds and affiliate drops – aesthetic tools, festive picks, and everyday scroll-stoppers.


# VibeDrips 🛍️

A modern, static e-commerce store built with vanilla HTML, CSS, and JavaScript that automatically displays products from your data sources (CSV/JSON) with a sleek Shopify-inspired design.

## ✨ Features

- **Responsive Shopify-themed design** - Mobile-first, modern UI
- **Automatic data loading** - Supports both JSON and CSV formats
- **Dynamic product rendering** - Images loaded directly from URLs
- **Smart filtering & search** - Real-time product filtering by category and search
- **Price sorting** - Sort products by price (low to high, high to low)
- **GitHub Actions integration** - Automated daily updates from Google Sheets
- **No backend required** - Pure static site, works on any hosting platform
- **SEO friendly** - Semantic HTML structure

# VibeDrips - Drops that Drip. Curated Finds, Digitally Yours.

A modern, multi-currency affiliate e-commerce platform showcasing curated digital finds and trending products across global markets.

## 🌍 Multi-Currency Support

VibeDrips automatically detects and separates products by currency, creating dedicated shopping experiences for different regions:

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

## 🏗️ Project Structure

```
VibeDrips/
├── .github/workflows/          # GitHub Actions
│   └── process-csv.yml
├── convert-csv.js              # ← Backend automation (ROOT)
├── cleanup-old-files.js        # ← Backend automation (ROOT)  
├── data/                       # Data files
│   ├── products.csv
│   └── products-INR.json
├── vibedrips/                  # Your main project
│   ├── assets/
│   │   ├── js/                 # ← Frontend JavaScript
│   │   │   ├── main.js         # Website functionality
│   │   │   ├── cart.js         # Shopping cart
│   │   │   └── products.js     # Product display
│   │   ├── css/
│   │   └── images/
│   ├── index.html
│   └── products.html
└── README.md
```

## 🔄 Data Processing Pipeline

### Automated Workflow
- **Trigger**: Daily at midnight UTC or when `products.csv` is updated
- **Process**: Converts CSV to currency-specific JSON files
- **Output**: Separate product files for each detected currency

### Currency Detection Logic
1. **Primary**: Check `Currency` column in CSV
2. **Fallback**: Parse currency symbols from price field (₹, $, €, etc.)
3. **Default**: Products without clear currency go to "Random Drops" category

### Data Transformation
- Cleans and structures product data
- Extracts categories and subcategories
- Processes affiliate links (Amazon SiteStripe)
- Handles product images and metadata
- Sorts by timestamp (newest first)

## 🚀 Features

### Smart Currency Loading
- Detects user's region via IP geolocation
- Shows only currencies with available products
- Falls back to INR (Indian market) as default
- No currency conversion - direct regional pricing

### Responsive Design
- Device-type detection (mobile/tablet/desktop)
- Adaptive layouts based on screen size
- Network-aware loading for slower connections
- Modern purple/cyan color scheme

### Product Categories
- **Featured Products** - Curated highlights
- **New Arrivals** - Recent additions
- **Trending Now** - Popular items
- **Random Drops** - Miscellaneous finds
- **All Products** - Complete catalog

### Search & Filter
- Real-time search across all product fields
- Category filtering
- Price sorting (low-to-high, high-to-low)
- Rating-based sorting
- Brand filtering

## 🛠️ Development

### Prerequisites
- Node.js 18+
- npm or yarn
- GitHub repository with Actions enabled

### Setup
```bash
# Clone repository
git clone https://github.com/JOLT-dailyAi/VibeDrips.git
cd VibeDrips

# Install dependencies
npm init -y
npm install csv-parser

# Convert CSV to JSON (manual)
node convert-csv.js
```

### Adding New Products
1. Add products to `data/products.csv`
2. Ensure `Currency` column is populated
3. Push to main branch
4. GitHub Actions will automatically process the data

### File Structure Benefits
- **Modular**: Separate HTML, CSS, and JS files
- **Maintainable**: Easy to update individual components
- **Scalable**: Add new currencies without breaking existing functionality
- **SEO-Friendly**: Clean HTML structure

## 📊 Data Format

### CSV Columns (Key Fields)
- `Timestamp` - When product was added
- `productTitle` - Product name
- `Description` - Product description
- `price` - Price with currency symbol
- `Currency` - ISO currency code (INR, USD, etc.)
- `brand` - Product brand
- `categoryHierarchy` - Product category
- `MainImage` - Primary product image
- `AllImages` - Additional product images
- `Amazon SiteStripe (Short)` - Affiliate link
- `customerRating` - Product rating
- `reviewCount` - Number of reviews

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
  "affiliate_link": "https://amzn.to/...",
  "customer_rating": 4.8,
  "review_count": 128,
  "timestamp": "2025-01-15T10:30:00Z"
}
```

## 🎨 Design System

### Color Palette
- **Primary Background**: `#2E1D80` (Deep Purple)
- **Text Color**: `#80DFFF` (Cyan Blue)
- **Accent Gradients**: Purple to Cyan
- **Cards**: Semi-transparent overlays with blur effects
- **Buttons**: Gradient backgrounds with hover effects

### Typography
- **Font Stack**: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- **Headings**: Bold weights with gradient text effects
- **Body**: Clean, readable sans-serif

## 🔗 Affiliate Integration

- **Amazon Associates**: Full SiteStripe link support
- **Link Tracking**: Product ID-based analytics
- **External Links**: Opens in new tabs with proper attribution
- **Fallback Handling**: Graceful degradation for missing links

## 📱 Mobile Optimization

- **Responsive Grid**: Auto-fit product cards
- **Touch Friendly**: Large tap targets
- **Performance**: Lazy loading for images
- **PWA Ready**: Service worker and manifest support

## 🚦 Status & Monitoring

- **Build Status**: Automated via GitHub Actions
- **Data Freshness**: Timestamp tracking
- **Error Handling**: Graceful fallbacks for missing data
- **Performance**: Optimized loading strategies

## 📄 License

This project is proprietary and confidential. All rights reserved.

---

**VibeDrips** - Where digital curation meets global commerce. 🛍️✨
