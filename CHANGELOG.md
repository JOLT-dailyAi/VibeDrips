# Changelog

All notable changes to VibeDrips will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.6.0] - 2025-12-12

### 🎬 Major Features - Instagram Reels Integration

#### Fullscreen Reels Experience
- **Immersive fullscreen modal** with dark overlay (95% black background)
- **Smooth vertical scrolling** between reels with gentle snap behavior
- **Floating close button** with glassmorphism effects
- **Responsive layouts** for desktop, tablet, and mobile

#### Instagram Iframe Integration
- Direct Instagram reel embeds using native iframe
- **URL Parsing:** Automatically extracts post ID from Instagram URLs
  - Supports `/p/{postId}` format (posts)
  - Supports `/reel/{postId}` format (reels)
  - Converts to embed URL: `https://www.instagram.com/p/{postId}/embed`
- **Responsive sizing:** Desktop (500×700px), Tablet (400×600px), Mobile (100% width)
- **Native Instagram controls:** Play/pause, sound, like, share
- **Lazy loading:** Iframes load only when modal opens for performance
- **Rounded corners and shadows** for polished appearance

#### Horizontal Product Carousel
- **Desktop (>1200px):** 3×2 grid showing 6 products per page
- **Tablet (768-1199px):** 2×2 grid showing 4 products per page
- **Mobile Portrait (<768px):** Horizontal 1×2 layout showing 2 products side-by-side
- **Mobile Landscape (<768px):** 2×2 grid showing 4 products per page
- **Navigation controls:**
  - Left/right arrow buttons with glassmorphism styling
  - Touch swipe gestures for mobile pagination
  - Pagination dots with active state highlighting
  - Smooth opacity transitions during page changes
- **Smart pagination:** Automatically calculates total pages based on product count
- **Touch-friendly:** Mobile arrows positioned inside container for easy access

#### Swipe Navigation
- **Horizontal swipe gestures** on mobile/tablet for carousel pagination
- **Intelligent detection:**
  - Horizontal movement > 50px triggers page change
  - Vertical movement < 30px ensures no conflict with scroll
  - Duration < 500ms for responsive feel
- **Direction-aware:**
  - Swipe right = Previous page
  - Swipe left = Next page
- **Non-intrusive:** Doesn't interfere with vertical reel scrolling

### Added
- **New Files:**
  - `assets/css/components/reels-modal.css` - Fullscreen modal structure and layouts
  - `assets/css/components/reels-feed.css` - Product carousel and navigation styles
  - `assets/js/reels-modal.js` - Modal open/close functionality
  - `assets/js/reels-feed.js` - Instagram URL parsing, carousel pagination, and swipe logic
  
- **Modal Components:**
  - Fullscreen overlay with z-index 1000
  - Scroll container with smooth scrolling and snap points
  - Reel sections with Instagram iframe + products layout
  - Floating close button (top-right corner)
  - Navigation arrows with hover effects
  - Pagination dots with visual feedback
  - Touch gesture detection system
  
- **Instagram Integration:**
  - `getInstagramEmbedUrl()` - Parses Instagram URLs and extracts post ID
  - `createReelSection()` - Generates reel section with iframe
  - `getReelsDataFromProducts()` - Filters products with Instagram source links
  - Support for both `/p/` and `/reel/` URL formats
  - Validation for Instagram URLs only
  
- **Product Card Contexts:**
  - Context-aware sizing (compact for reels, full-size for homepage)
  - Maintained hover effects across all contexts
  - Preserved click-to-open-details functionality in reels
  
- **Responsive Features:**
  - Desktop: Side-by-side Instagram reel and products layout
  - Tablet: Compact side-by-side layout with swipe support
  - Mobile Portrait: Stacked vertical (70% reel, 30% products) with horizontal swipe
  - Mobile Landscape: Adaptive layouts with 2×2 product grid

### Changed
- **Product Data Source:**
  - Reads `Product Source Link` field from CSV
  - Groups products by Instagram URL
  - Handles multiple URLs (takes first one)
  
- **Product Card Styling:**
  - Added `.reels-modal .product-card` specific styles for compact display
  - Reduced font sizes and padding for carousel context
  - Maintained full styling for homepage cards
  
- **Grid System:**
  - Protected homepage grid with scoped CSS specificity
  - Added `.reels-modal` namespace to all modal-specific grid rules
  - Emergency fallback rules for mobile 2-column layout
  - Orientation-aware breakpoints (portrait vs landscape)
  
- **Service Worker:**
  - Updated cache version to `v1.6`
  - Added new reels CSS and JS files to cache list

### Fixed
- **Critical Mobile Bug:** Homepage now correctly displays 2 columns on mobile portrait (was showing 1 column)
- **CSS Cascade Issue:** Resolved unscoped `.products-grid` rules affecting homepage
- **Grid Specificity:** Added `.reels-modal` parent selector to isolate modal styles
- **Card Height Conflicts:** Fixed auto-height issues in different rendering contexts
- **Navigation Positioning:** Carousel arrows now positioned correctly on mobile devices
- **Pagination Sizing:** Dots scale appropriately for different screen sizes
- **Scroll Behavior:** Smooth scrolling works consistently across all browsers
- **Touch Conflicts:** Swipe gestures don't interfere with vertical scroll
- **Orientation Detection:** Mobile landscape properly detected for 2×2 grid

### Technical Details

#### Instagram URL Parsing
// Regex pattern: //(p|reel)/([^/?]+)/
// Example input: https://www.instagram.com/reel/ABC123xyz/
// Extracted ID: ABC123xyz
// Embed URL: https://www.instagram.com/p/ABC123xyz/embed


#### Touch Gesture Detection
// Swipe thresholds:
deltaX > 50px // Minimum horizontal movement
deltaY < 30px // Maximum vertical movement
duration < 500ms // Maximum swipe duration

#### CSS Architecture
- **Scoped Selectors:** All reels CSS uses `.reels-modal` parent selector
- **Specificity Hierarchy:**
  1. `.reels-modal .products-grid` (highest - modal context)
  2. `.container .products-grid` (medium - homepage protection)
  3. `.products-grid` (lowest - base styles)
- **Media Query Strategy:** Separate breakpoints for modal vs homepage

#### JavaScript Modules
- **reels-modal.js:** 
  - `openReelsModal()` - Opens fullscreen modal
  - `closeReelsModal()` - Closes modal and cleans up
  - Event listeners for close button and ESC key
  
- **reels-feed.js:**
  - `renderReelsFeed()` - Main rendering function
  - `getReelsDataFromProducts()` - Filters and groups products by Instagram URL
  - `getInstagramEmbedUrl()` - URL parsing and embed URL generation
  - `createReelSection()` - Generates reel section with iframe
  - `createProductsCarousel()` - Builds carousel with pagination
  - `enableSwipeNavigation()` - Touch gesture handling
  - `navigateCarousel()` - Page navigation logic
  - `goToPage()` - Direct page jump with dot updates

#### Responsive Breakpoints
/* Desktop: >1200px */
.products-grid { grid-template-columns: repeat(3, 1fr); grid-template-rows: repeat(2, 1fr); }

/* Tablet: 768px-1199px */
.products-grid { grid-template-columns: repeat(2, 1fr); grid-template-rows: repeat(2, 1fr); }

/* Mobile Portrait: <768px */
.products-grid { grid-template-columns: repeat(2, 1fr); grid-template-rows: 1fr; }

/* Mobile Landscape: <768px + landscape */
.products-grid { grid-template-columns: repeat(2, 1fr); grid-template-rows: repeat(2, 1fr); }


### Performance
- **Lazy Rendering:** Products and iframes load only when modal opens
- **Smooth Transitions:** CSS transitions for all state changes
- **Efficient DOM:** Minimal reflows during carousel navigation
- **Scroll Optimization:** Native smooth scrolling with snap points
- **Touch Optimization:** Passive event listeners for better scroll performance

### Browser Compatibility
- ✅ Chrome/Edge: Full support with smooth scrolling and touch gestures
- ✅ Safari: Full support with webkit prefixes
- ✅ Firefox: Full support
- ✅ Mobile Safari: Touch gestures + vertical scrolling + Instagram embeds
- ✅ Android Chrome: Full touch support + Instagram embeds
- ✅ Instagram In-App Browser: Full support

### User Experience Improvements
- **Immersive Design:** Fullscreen modal eliminates distractions
- **Native Instagram:** Users get familiar Instagram interface
- **Intuitive Navigation:** Familiar reels-style vertical scroll + horizontal carousel
- **Visual Feedback:** Active states for all interactive elements
- **Responsive Touch:** Optimized for mobile touch interactions with swipe gestures
- **Keyboard Support:** ESC key closes modal
- **Smooth Animations:** All transitions feel natural and polished

---

## [1.5.0] - 2025-12-10

### Added
- Separate CSS files for currency and product modals for better maintainability
- Separate JavaScript modules for currency modal, product modal, and shared utilities
- Dark overlay (0.7 opacity) on all modals for improved text readability
- Click-outside-to-close functionality for product modals
- Glass theme set as default on page load
- Modal overlay CSS styling for clickable background areas

### Changed
- Refactored modal system from single file to modular architecture
- Updated service worker cache to v1.5 with new file structure
- Improved modal closing behavior with proper event handling
- Enhanced glass theme consistency across all modal types

### Fixed
- Product modal now closes when clicking outside modal content
- Glass theme now loads correctly on initial page visit
- Service worker cache errors resolved with updated file paths
- Modal overlay click detection improved

### Removed
- `modal-manager.js` (replaced by separate modal modules)
- `modals.css` (replaced by currency-modal.css and product-modal.css)

---

## [1.4.0] - 2025-12-09

### Added
- **Glass Theme**: New glassmorphism theme with real-time adjustable controls
  - Blur slider (5-50px)
  - Opacity slider (0.05-0.4)
  - Depth slider (0-30px inner glow)
  - Auto-close timer (30 seconds)
- Glass effects applied to all UI components:
  - Product cards
  - Filter controls
  - Stats bar
  - Modals (currency, product details)
  - Floating controls (theme toggle, currency, music, linktree)
  - Center badges and tooltips
- Glass settings panel with interactive controls
- Theme cycling: Light → Dark → Glass → Light

### Changed
- Theme icon changed from 🪟 (window) to 💎 (diamond) for better cross-platform consistency
- Glass theme set as default theme on first load
- Glass panel auto-close timer extended from 7 to 30 seconds
- Glass panel title styled as centered button (matches UI patterns)

### Fixed
- Mobile portrait credits pill displaying as circular icon instead of pill shape
- Theme toggle button showing double emojis (removed CSS ::before conflicts)
- Glass panel close button positioning (moved to top-right corner)
- Mobile responsive layout for center badges

### Technical
- New files: `assets/css/utils/glass.css`, `assets/js/glass-settings.js`
- Updated: `theme-toggle.js`, `floating.css`, `modals.css`, `filters.css`, `grid.css`, `product-card.css`
- CSS variables for dynamic glass theming: `--glass-blur`, `--glass-refraction`, `--glass-depth`

---

## [1.3.0] - 2025-12-08

### 🎵 Major Features

#### Background Music Control
- Added play/pause music button in left footer
- Implemented auto-hide volume slider (5-second timeout on desktop)
- Volume controls hidden on mobile due to browser limitations
- Music file: "Losstime" by Creepy Nuts

#### Song Credits Display
- Dynamic credits badge appears when music plays
- Displays: "♪ Losstime • Creepy Nuts 🎵"
- Clickable YouTube link: https://youtu.be/O6WjVGEVbNc
- Tooltip shows full song info on hover (desktop) or first tap (mobile)
- Smart text truncation on mobile devices
- Auto-hide tooltip after 5 seconds

#### Share & Install Buttons
- Native Web Share API integration for sharing VibeDrips
- PWA install button with browser-specific handling
- Both buttons appear in center footer when music is paused
- Share content: "VibeDrips - Drops that Drip" with tagline
- Clipboard fallback for browsers without Web Share API
- Toast notifications for copy confirmations

#### PWA Installation
- Native install prompt on Chrome/Edge browsers
- Custom instruction modals for Safari/iOS/Opera
- Browser and device-specific installation guides
- Install button auto-hides after app is installed
- Detects standalone mode to prevent duplicate installs

### Added
- **New Files:**
  - `assets/js/share.js` - Share functionality with native API
  - `assets/music/Losstime.mp3` - Background music file
  
- **UI Components:**
  - Music control button with play/pause toggle
  - Volume panel with slider and mute button
  - Credits badge with tooltip system
  - Share button with native integration
  - Install button with smart detection
  - Toast notification system
  - Install instruction modal
  - Center badge container for dynamic content

- **Features:**
  - Auto-hide mechanisms (5-second timers for volume & tooltips)
  - Device/browser detection for install instructions
  - Dynamic text truncation algorithm for mobile
  - Tooltip system with click-outside-to-close
  - Modal system with backdrop blur
  - Web Share API with clipboard fallback

### Changed
- **Footer Redesign:**
  - Left side: Linktree + Music control
  - Center: Dynamic badge (Credits or Share/Install)
  - Right side: Theme toggle + Currency selector
  - Replaced Instagram icon with Linktree button
  
- **Button Styling:**
  - Linktree button now matches currency button style (white bg, colored border)
  - Currency text made bold (font-weight: bold)
  - All footer icons standardized to 50px desktop, 45px mobile
  
- **Mobile Optimization:**
  - Center badge font size reduced to 11px
  - Tighter padding: 8px 14px (was 8px 16px)
  - Max-width increased to calc(100vw - 160px) to prevent overlap
  - Gap reduced to 6px between icon and text
  - All footer elements aligned to same 45px height

- **Dark Theme:**
  - Currency button background: rgba(0, 0, 0, 0.8) instead of transparent
  - Linktree button background: rgba(0, 0, 0, 0.8) in dark mode
  - All tooltips and modals adapt to dark theme
  - Consistent opacity and border styling

### Removed
- Instagram icon from right footer (replaced by Linktree on left)

### Fixed
- Currency display button transparency issue in dark theme
- Center badge vertical alignment on mobile (was elevated)
- Footer icon horizontal alignment across all screen sizes
- Volume controls incorrectly showing on mobile browsers
- Tooltip text wrapping on mobile (now single line with proper width)
- Linktree icon background color mismatch

### Technical
- **JavaScript:**
  - Rewrote `music-control.js` with modular functions
  - Added global `handleShare()` and `handleInstall()` functions
  - Implemented `beforeinstallprompt` event handling
  - Browser/device detection using navigator.userAgent
  - Display mode detection for PWA standalone check
  
- **CSS:**
  - Added `.center-badge-container` with fixed positioning
  - Implemented `.credits-tooltip` with arrow pointer
  - Created `.install-modal` with backdrop and content styling
  - Added `.toast-notification` for clipboard feedback
  - Mobile-first responsive design with @media queries
  
- **PWA:**
  - Updated `install-prompt.js` to store `deferredPrompt` globally
  - Web Share API feature detection
  - Clipboard API with document.execCommand fallback

### Browser Support
- Chrome: ✅ Full support (native install)
- Edge: ✅ Full support (native install)
- Safari: ✅ Functional (manual install instructions)
- Opera: ✅ Functional (manual install instructions)
- Firefox: ✅ Functional (manual install instructions)
- iOS Safari/Chrome: ✅ Share & manual install
- Android Chrome/Opera: ✅ Share & install support

### Performance
- Tooltips render only when needed (not in DOM by default)
- Lazy initialization of music controls
- Efficient event delegation for dynamic elements
- Minimal DOM manipulations with innerHTML updates

### User Experience
- **Desktop:**
  - Hover to preview volume slider
  - Hover credits for full song information
  - One-click share and install
  - Native browser install prompt
  
- **Mobile:**
  - Tap music to play, credits appear automatically
  - Tap credits once to see full tooltip
  - Tap YouTube link in tooltip to open song
  - Native share sheet integration
  - Browser-specific install instructions

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
