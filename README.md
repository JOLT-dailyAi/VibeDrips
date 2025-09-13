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

## 🏗️ Project Structure

```
VibeDrips/
├── .github/
│   └── workflows/
│       └── process-csv.yml        # GitHub Action for daily updates
├── data/
│   ├── products.json             # Auto-generated from Google Sheets
│   ├── products.csv              # CSV data source (created by n8n)
│   ├── last_updated.txt          # Timestamp of last update
│   └── categories.json           # Product categories (optional)
├── assets/
│   ├── css/
│   │   └── style.css            # Additional custom styles
│   ├── js/
│   │   └── main.js              # Additional JavaScript functionality
│   └── images/                  # Static assets (logos, etc.)
├── index.html                   # Main store page
├── product.html                 # Product detail template
├── convert-csv.js               # CSV to JSON conversion script
└── README.md                    # This file
```

## 🚀 Quick Start

### 1. Clone or Download

```bash
git clone https://github.com/JOLT-dailyAi/VibeDrips.git
cd VibeDrips
```

### 2. Prepare Your Data

Create your product data in one of these formats:

#### Option A: JSON Format (`data/products.json`)
```json
[
  {
    "id": "1",
    "name": "Stylish T-Shirt",
    "title": "Premium Cotton T-Shirt",
    "description": "Comfortable and stylish cotton t-shirt perfect for everyday wear.",
    "price": 29.99,
    "category": "clothing",
    "image": "https://example.com/image1.jpg",
    "brand": "VibeDrips"
  }
]
```

#### Option B: CSV Format (`data/products.csv`)
```csv
id,name,title,description,price,category,image,brand
1,"Stylish T-Shirt","Premium Cotton T-Shirt","Comfortable and stylish cotton t-shirt",29.99,clothing,https://example.com/image1.jpg,VibeDrips
2,"Cool Sneakers","Urban Street Sneakers","Modern sneakers for the urban lifestyle",89.99,shoes,https://example.com/image2.jpg,VibeDrips
```

### 3. Launch the Store

#### Local Development
```bash
# Using Python (Python 3)
python -m http.server 8000

# Using Node.js (if you have http-server installed)
npx http-server

# Using PHP
php -S localhost:8000
```

Then open `http://localhost:8000` in your browser.

#### Deploy to GitHub Pages
1. Push your code to GitHub
2. Go to Settings > Pages
3. Select source branch (usually `main`)
4. Your store will be live at `https://yourusername.github.io/VibeDrips`

## 📊 Data Source Integration

### Supported Data Fields

The store automatically detects and uses these fields from your data:

| Field | Aliases | Description |
|-------|---------|-------------|
| `id` | - | Unique identifier |
| `name` | `title` | Product name |
| `description` | - | Product description |
| `price` | - | Price (number or string like "$29.99") |
| `category` | - | Product category |
| `image` | `image_url`, `imageurl` | Image URL |
| `brand` | - | Brand name |

### Google Sheets Integration

1. **Set up your Google Sheet** with the columns above
2. **Configure n8n workflow** to export CSV to `/data/products.csv`
3. **GitHub Action** will automatically convert CSV to JSON daily

### Manual Data Updates

To update products manually:

```bash
# If you have Node.js
node convert-csv.js

# This converts data/products.csv to data/products.json
```

## 🎨 Customization

### Styling
- Edit the CSS in `index.html` or create separate files in `assets/css/`
- Color scheme uses CSS custom properties for easy theming
- Responsive design uses CSS Grid and Flexbox

### Adding Features
- Custom JavaScript can be added to `assets/js/main.js`
- Product detail page can be customized in `product.html`
- Add new filter options by modifying the filter functions

### Branding
- Replace the logo text in the header
- Update the hero section content
- Modify the color gradients and brand colors

## 🔄 Automated Updates

### GitHub Actions Workflow

The included workflow (`/.github/workflows/process-csv.yml`) automatically:

1. Runs daily at 6 AM UTC
2. Converts CSV to JSON format
3. Updates the `last_updated.txt` timestamp
4. Commits changes back to the repository

### Manual Trigger

You can manually trigger updates via:
- GitHub Actions tab > "Process CSV Data" > "Run workflow"
- Or push changes to the `main` branch

## 🌐 Deployment Options

### GitHub Pages (Free)
- Automatic deployment from your repository
- Custom domain support
- HTTPS enabled by default

### Netlify (Free tier available)
- Drag and drop deployment
- Form handling and serverless functions
- Branch previews

### Vercel (Free tier available)
- Git integration
- Automatic deployments
- Edge network

### Traditional Web Hosting
- Upload files via FTP
- Works on any static hosting service
- No server requirements

## 🛠️ Development

### Adding New Product Fields

1. Update your data source to include the new field
2. Modify the `createProductCard()` function in `index.html`
3. Update the product detail template if needed

### Custom Filters

Add new filter options by:
1. Adding HTML elements in the filters section
2. Extending the `filterProducts()` function
3. Adding corresponding filter logic

### SEO Optimization

- Update meta tags in the HTML head
- Add structured data for products
- Optimize image alt texts
- Use semantic HTML elements

## 📱 Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🐛 Troubleshooting

### Products Not Loading
- Check if `data/products.json` or `data/products.csv` exists
- Verify the data format matches the expected structure
- Check browser console for errors

### Images Not Displaying
- Ensure image URLs are publicly accessible
- Check for CORS issues with external image hosts
- Verify image URLs are valid

### GitHub Pages Not Updating
- Check GitHub Actions tab for workflow status
- Ensure the workflow has proper permissions
- Verify the data files are in the correct location

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/JOLT-dailyAi/VibeDrips/issues)
- **Discussions**: [GitHub Discussions](https://github.com/JOLT-dailyAi/VibeDrips/discussions)
- **Documentation**: This README and inline code comments

## 🎯 Roadmap

- [ ] Shopping cart functionality
- [ ] Product wishlist
- [ ] Advanced filtering (price range, ratings)
- [ ] Product reviews and ratings
- [ ] Inventory management
- [ ] Multi-language support
- [ ] Dark mode theme
- [ ] Progressive Web App (PWA) features

---

Made with ❤️ for modern e-commerce experiences
