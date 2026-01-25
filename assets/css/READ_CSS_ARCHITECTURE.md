# READ_CSS_ARCHITECTURE.md

This document tracks critical CSS architecture decisions and lessons learned regarding the VibeDrips UI system.

## 1. Modal Layering & Glow Interference (The "Z-Index Hop")

### The Problem
The primary product modal uses heavy box-shadows to create a "Purple Glow" effect. This glow is implemented on the `.modal-nav-container` with a high `z-index` (1001). 
External controls (like the Reels and Globe toggles) were originally on the same z-plane, causing the translucent glow layers to overlap and "wash out" the buttons, making them look tinted or obstructed.

### The Solution: "The Z-Index Hop"
External modal controls must be placed on a significantly higher layer to clear all glow and shadow artifacts.
- **Product Box / Glow Layer**: `z-index: 1001`
- **External Controls**: `z-index: 2000`

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
