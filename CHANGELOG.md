# Changelog

All notable changes to VibeDrips will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project uses single decimal versioning: v1.0, v1.1, v1.2... v1.9, v2.0

## [Unreleased]

### Planned
- Build system for CSS/JS concatenation
- Performance optimizations
- Additional theme variants
- Component documentation

---

## [1.2] - 2025-12-07

### 🏗️ Architecture Overhaul - Modular Refactor

**Major internal restructuring with zero breaking changes. All functionality remains identical to v1.1.**

### Added
- **JavaScript Modules (9 new files):**
  - `assets/js/dom-cache.js` - Centralized DOM element caching
  - `assets/js/theme-toggle.js` - Theme switching logic
  - `assets/js/event-handlers.js` - Event listener management
  - `assets/js/ui-states.js` - Loading, error, and empty state displays
  - `assets/js/modal-manager.js` - Modal control functions
  - `assets/js/currency-loader.js` - Currency detection and loading
  - `assets/js/product-loader.js` - Product data fetching and processing
  - `assets/js/filter-manager.js` - Product filtering and sorting logic
  - `assets/js/main.js` - Refactored as lightweight orchestrator

- **CSS Modules (17 new files organized in layers):**
  
  **Base Layer:**
  - `assets/css/base/reset.css` - Global CSS resets and utilities
  - `assets/css/base/variables.css` - CSS custom properties and design tokens
  
  **Layout Layer:**
  - `assets/css/layout/header.css` - Header and logo styles
  - `assets/css/layout/footer.css` - Footer component styles
  - `assets/css/layout/grid.css` - Product grid and stats bar layouts
  
  **Components Layer:**
  - `assets/css/components/filters.css` - Time categories and filter controls
  - `assets/css/components/buttons.css` - All button styles (Amazon, details, retry)
  - `assets/css/components/product-card.css` - Product card component
  - `assets/css/components/modals.css` - Currency and product modals
  - `assets/css/components/badges.css` - Product badges (hot, featured, trending)
  - `assets/css/components/stats.css` - Statistics display component
  
  **States Layer:**
  - `assets/css/states/loading.css` - Loading spinner and state
  - `assets/css/states/error.css` - Error and coming soon states
  - `assets/css/states/empty.css` - No products found state
  
  **Themes Layer:**
  - `assets/css/themes/light-theme.css` - Light theme variables
  - `assets/css/themes/dark-theme.css` - Dark theme overrides
  
  **Utils Layer:**
  - `assets/css/utils/floating.css` - Floating social links and currency display
  - `assets/css/utils/responsive.css` - Responsive utilities and helpers

- `assets/css/main.css` - New CSS orchestrator using `@import` statements

### Changed
- **Refactored `assets/js/main.js`:** Reduced from 580 lines to 80 lines (orchestrator only)
- **Refactored `assets/js/products.js`:** Cleaned up to focus only on product rendering (390 lines)
- **Updated `index.html`:** Modified script loading order for modular architecture
- **Improved product grid responsive breakpoints:**
  - Mobile (<600px): 1 column
  - Tablet (600-900px): 2 columns
  - Desktop (>900px): 3-4 columns auto-fill
  - Large Desktop (>1200px): 4+ columns

### Fixed
- **Product grid layout:** Resolved nested `.products-grid` div causing single-column display on desktop
- **Grid rendering:** Cards now append directly to container without wrapper div
- **Responsive behavior:** Better breakpoint handling for tablet and desktop views

### Removed
- `assets/css/products.css` - Replaced by modular component files
- Duplicate CSS rules across files
- Redundant grid wrapper in JavaScript rendering

### Technical Details

#### Code Statistics
**Before v1.2:**
- JavaScript: 2 files, 970 total lines
- CSS: 2 files, 27KB total
- Average file size: ~500 lines

**After v1.2:**
- JavaScript: 10 files, ~100 lines average
- CSS: 17 files, ~50-200 lines average
- Total: 27 focused modules

#### Benefits
- ✅ **Maintainability:** Smaller files, single responsibility
- ✅ **Searchability:** Features grouped by concern
- ✅ **Collaboration:** Multiple developers can work simultaneously
- ✅ **Reusability:** Components easily extractable
- ✅ **Theme Management:** Isolated theme files
- ✅ **Debugging:** Know exactly which file to edit

#### Migration
**No migration required.** This is a refactoring release with 100% backwards compatibility.

#### Files Changed

**Modified:**
- `index.html`
- `assets/js/main.js` (major refactor)
- `assets/js/products.js` (cleanup)

**Added:**
- 8 new JavaScript modules
- 17 new CSS modules
- `CHANGELOG.md` (this file)

**Removed:**
- `assets/css/products.css`

---

## [1.1] - 2025-12-06

### Added
- Multi-currency support with automatic region detection
- Hybrid currency loading approach (check availability before loading)
- Currency selector modal
- Dynamic product filtering by time (Hot/Featured/New/Trending/All)
- Search functionality across product fields
- Category filtering
- Price sorting (low-to-high, high-to-low)
- Product card component with:
  - Image carousel support
  - Amazon affiliate link integration
  - Product details modal
  - Ratings display
  - Brand information
- Loading states and error handling
- "Coming Soon" state for unavailable currencies
- Responsive design for mobile, tablet, and desktop
- Dark/Light theme toggle
- Font Awesome icon integration
- Ko-fi widget for support

### Technical
- IP-based region detection via ipapi.co
- LocalStorage for theme persistence
- JSON-based product data structure
- Currency-specific product files (products-{CURRENCY}.json)
- Modular product rendering system

---

## [1.0] - 2025-12-05

### Added
- Initial release of VibeDrips
- Basic product display functionality
- Single currency support (INR)
- Static product grid layout
- Basic styling and branding
- GitHub Pages deployment

---

## Versioning Scheme

VibeDrips uses **single decimal versioning**:
- Format: `vMAJOR.MINOR` (e.g., v1.0, v1.1, v1.2... v1.9, v2.0)
- **MAJOR** (v1 → v2): Breaking changes, major architectural changes
- **MINOR** (v1.1 → v1.2): New features, refactors, improvements

---

## Contributing

When contributing, please:
1. Update this CHANGELOG.md with your changes under `[Unreleased]`
2. Follow [Conventional Commits](https://www.conventionalcommits.org/)
3. Group changes by type: Added, Changed, Deprecated, Removed, Fixed, Security
4. Reference issue numbers where applicable
