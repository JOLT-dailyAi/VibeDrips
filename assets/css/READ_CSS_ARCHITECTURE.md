# READ_CSS_ARCHITECTURE.md

This document tracks critical CSS architecture decisions and lessons learned regarding the VibeDrips UI system.

## 1. Modal Layering & Glow Interference (The "Z-Index Hop")

### The Problem
The primary product modal uses heavy box-shadows to create a "Purple Glow" effect. This glow is implemented on the `.modal-nav-container` with a high `z-index` (1001). 
External controls (like the Reels and Globe toggles) were originally on the same z-plane, causing the translucent glow layers to overlap and "wash out" the buttons, making them look tinted or obstructed.

### The Solution: "The Z-Index Hop"
External modal controls must be placed on a significantly higher layer to clear all glow and shadow artifacts.
- **Product Box / Glow Layer**: `z-index: 1001`
- **External Controls**: `z-index: 6000`

> [!IMPORTANT]
> Always ensure external controls bypass the modal's decorative shadow layers by using a z-index delta of at least 500.

## 2. Global Theme Parity (Floating Controls)

To maintain a consistent "Vibe," all circular toggle buttons (Reels, Globe, Currency, Linktree) must share a unified design language across themes.

### Dark Theme Rules
- **Background**: `rgba(0, 0, 0, 0.8)` (Translucent Black).
- **Border**: `2px solid rgba(255, 255, 255, 0.35)` (Whitish Circular Border).
- **Filter**: `backdrop-filter: blur(var(--glass-blur))` (Essential for texture).

### Light Theme Rules
- **Background**: `#FFFFFF` (Solid White).
- **Border**: `2px solid #667eea` (Branding Blue).
- **Hover**: Inverts to Blue background with White content.

## 3. Load Order & Override Strategy

Theme-specific overrides are located in `assets/css/themes/`. 
- **Rule**: Theme files are imported **last** in `main.css`.
- **Practice**: Use high-specificity selectors (e.g., `body.dark-theme .selector`) combined with `!important` in these files to guarantee parity across diverse components that might have their own base styles.

## 4. The 2px "Weighted" Design Standard

To achieve a "Premium" aesthetic, VibeDrips has transitioned from thin 1px borders to a **2px weighted standard** for all primary containers and interactive elements.

### Effected Elements
- Product Cards, Modals, Stat Items, Filter Controls, Time Categories.
- Carousel Arrows, Counters, and Center Badges (Share/Install).

### Justification
The 2px weight provides a strong visual "anchor" for elements, making them feel more substantial (bolstered) and coherent with the weighted icons and bold typography used in the branding.

## 5. Component Portability (Independence)

When building UI components, we distinguish between **Integrated** and **Standalone** styling.

### Integrated Components (Theme-Dependent)
*Examples: .product-card, .stat-item, .carousel-controls*
- **Strategy**: Styles are defined in theme files (`dark-theme.css`, `light-theme.css`).
- **Benefit**: Elements change color dynamically based on the site-wide theme toggle.

### Standalone Components (Portable)
*Example: .media-lightbox*
- **Strategy**: Premium styles (translucent black, 2px border, glass blur) are **hardcoded** directly in the component's CSS (`lightbox.css`).
- **Benefit**: The component can be copy-pasted into another project without external CSS dependencies or variables, while maintaining its "signature" premium look.

> [!TIP]
> Use Standalone styling for generic utilities intended for reuse in other repositories. Use Integrated styling for elements that must react to the project's specific theme toggling logic.

## 6. Gallery & Thumbnail "Pinned Sync" Design

To achieve high-end gallery interaction, we implement **Selection-Hover Parity**.

### Visual Parity
- **The Rule**: The `.thumbnail.active` (Pinned) and `.thumbnail:hover` states must look identical.
- **Effects**: `translateY(-10px)`, `scale(1.05)`, Purple Glow, and `1.15x` internal image zoom.
- **Why**: This provides immediate visual feedback that the "pinned" image is just as interactive as a hovered one.

### Exclusive Focus (Context-Awareness)
When an user hovers over a thumbnail while another is already pinned, we use the `.is-previewing` class on the container to signal a focus shift.
- **CSS Logic**: `.is-previewing .thumbnail.active:not(:hover)` drops the pinned elevation.
- **Result**: Only **one** thumbnail is ever elevated at a time, preventing visual "clutter" in the gallery.

### Hardware Acceleration (The "Butter-Smooth" Slide)
As per the carousing stability plan:
- **GPU Hardening**: All sliding containers (`.modal-sliding-strip`) must use `backface-visibility: hidden` and `transform-style: preserve-3d`.
- **Why**: This forces the browser to treat the modal content as a single graphics layer, eliminating jitter on mobile devices.

## 7. Interactivity & Performance Parity (Click vs Drag)

To ensure "Butter-Smooth" navigation across all input methods, we handle "Cold Start" clicks surgically.

### The patterns
- **Compositor Priming**: Clicks are inherently "cold" (0% CPU/GPU state). We use `mousedown` to trigger a `0.01px` translateX. This "primes" the GPU layer ~100ms before the transition starts.
- **Layer Contention Removal**: We avoid heavy animations (like `scale()`) on the interaction levers (side zones) at the exact moment the product transition begins.
- **RAF Sync**: Complex indicator logic (Dots/Counters) is de-coupled from the transition start via `requestAnimationFrame` to prevent frame hitches.

## 8. Mobile Landscape Space Economy

Mobile landscape is a height-constrained environment. We prioritize **Vertical Scarcity**.

### The Pattern: "The Shrink-Wrap"
- **The Rule**: Never use fixed `height` (px) for gallery containers in landscape.
- **Practice**: Use `height: auto` and `max-height: 70vh`.
- **The "Ghost Space" Fix**: When elements (like the carousel counter) are hidden, the container must be allowed to shrink vertically to hug the image. This prevents "Ghost Space" from pushing product details off-screen.

## 9. External Modal Controls (Floating Toolset)

To provide secondary interaction without cluttering the product modal, we use a high-elevation floating control layer.

### The Container (`.modal-external-controls`)
- **Positioning**: `absolute`, anchored above the layout wrapper (`bottom: calc(100% + 6px)`).
- **Stacking**: `z-index: 3000` (Master Layer) to clear all modal box-shadow and glow effects.
- **Pass-Through**: `pointer-events: none` on the container ensures clicking the "gap" between buttons doesn't block the modal; `pointer-events: auto` is restored on buttons and bubbles.

### News Ticker Bubble (`.control-bubble`)
- **The Viewport**: A fixed-width window (280px Desktop / 180px Portrait) with a linear alpha mask (`mask-image`) for soft-edge fading.
- **Marquee Engine**: A seamless infinite loop achieved by twin `<span>` elements cycling at 15s via `translateX(-50%)`.
- **Auto-Hiding**: Managed by the `.hidden` class; the bubble vanishes when any toggle is active to focus the user on the secondary tool.

### Toggle Buttons (`.reels-toggle`, `.globe-toggle`)
- **Theme Parity**: Shared 42px circular footprint with brand purple (`#5A4BFF`) selection glow across all themes.
- **Landscape Economy**: Icons shrink to **32px** in mobile landscape to preserve vertical visibility.
- **Safe-Area Portrait**: Tightened `gap: 8px` and 180px ticker width in mobile portrait to prevent edge overflow.

---

## 10. Lightbox Sliding Geometry (100% Geometry)

To support the infinite-preloading strip in the Lightbox, we use a **Triple-Zero Bleed** strategy.

### The Layout
- **Container**: `overflow: hidden` with absolute black background.
- **Sliding Strip**: A `flex` container with 5 slots, each exactly `100%` width of the viewport.
- **Center Alignment**: Active media is always at `translate3d(-200%, 0, 0)`.

### Bleed Prevention (Landscape Isolation)
In landscape mode, even 1px of "Bleed" from an adjacent slide is visible.
- **Opacity Shielding**: `.lightbox-media-wrapper` has `opacity: 0` by default. Only the `.center-slot` receives `opacity: 1`. 
- **Transition**: Uses a `0.3s ease` opacity fade combined with the `0.4s` slide to hide loading/buffering artifacts from the user's peripheral vision.

### GPU-Hardened Geometry
- **Transform**: Exclusively use `translate3d` for the strip to ensure it stays on the graphics layer, essential for maintaining sensitive swipe response over high-weight media like 4K videos or TikTok embeds.

---

## 11. Smart Engagement Pill (The "Pulse" Prompt)

To encourage unmuting without annoying the user, we use a "Smart Cycling" pill.
- **Lifecycle**: A fixed 22-second loop (2s In, 3s Stay, 2s Out, 15s Wait) to prevent visual fatigue.
- **Z-Index Master**: `z-index: 11000` to ensure it clears all shields, navigation layers, and overlays.
- **Visibility**: Uses **VibeDrips Red (#E53E3E)** for the speaker icon to ensure it "stands out" as a clear call-to-action against high-motion video backgrounds.

---

## 12. Visual Context Guards (Visibility-Aware Selectors)

To prevent hidden DOM elements from interfering with active media logic, the system relies on highly specific "Activity Selectors."

### The Rule: "Not Hidden"
- **Pattern**: Never use a bare class selector (e.g., `.simple-modal`) to detect if a component is "Active."
- **Standard**: Always use visibility-aware pseudo-classes: `.simple-modal:not(.hidden)`.

### Justification: "Base Template Pollution"
The VibeDrips `index.html` contains several hidden static modal roots (`#static-modal`) used for initialization. A generic selector mistakenly identifies these as "True" even when they are hidden, causing background scripts (like the Reels Feed) to think the user is in a modal when they are actually on the home page. This leads to severe "Backgrounding" regressions where media pulses are permanently blocked.

---

## 13. Absolute Size Lock (Portrait)
To prevent horizontal overflow and "bleeding" on small devices, the External Controls bubble uses a fixed-width strategy in portrait mode.
- **Ticker Width**: Locked to `180px` (or `60vw` on ultra-narrow devices) to ensure icons remain accessible.
- **Gap Control**: A strict `8px` gap is maintained between the bubble and the modal top edge to prevent z-index "merging" on high-DPI screens.

---

## 14. PWA Install UI Standards

To maintain a premium, platform-agnostic experience, VibeDrips uses manual installation instructions instead of native browser prompts.

### The "GET APP" Logic
- **Bypassing Native Prompts**: We do not intercept `beforeinstallprompt`. Instead, the "GET APP" button directly opens the manual instructions modal.
- **Privacy First**: Never force a `window.location.href = window.location.href` reload during installation triggers.
- **Dynamic Visibility**: The install button is automatically hidden if `window.matchMedia('(display-mode: standalone)').matches` is true.

### The Instructions Modal
- **Requirement**: Must include step-by-step visuals for iOS (Safari "Add to Home Screen") and Android (Chrome "Install app").
- **Constraint**: The modal must be accessible via the `.install-instructions` selector.

---

## 15. Share Button Parity (32px Landscape Lock)

Across all modal types (Product vs. Reels), secondary controls must maintain strictly identical footprints in mobile landscape.

### The Standard
- **Dimensions**: Locked to **32px x 32px**.
- **Icon Sizing**: Reels Share emojis/icons are scaled to `22px` to match the visual weight of the Close button SVG.
- **Selection State**: No scaling expansion is permitted on select to avoid layout "jitter" in constrained height environments.
