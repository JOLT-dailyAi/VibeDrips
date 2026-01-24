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
- **Practice**: Use high-specificity selectors (e.g., `body.dark-theme .selector`) combined with `!important` in these files to guarantee parity across different components that might have their own base styles.
