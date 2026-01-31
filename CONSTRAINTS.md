# Project Philosophy: Feature Preservation & Architectural Constraints

This document defines the core technical rules and the philosophy of "Feature Preservation" for this project. Adherence to these rules is mandatory to prevent regressions and loss of implementation time.

## 🛡️ Feature Preservation Philosophy

> [!IMPORTANT]
> **Every line of code is a feature.**
- **Strict Scope Adheresence**: You must only modify code that is directly within the current task's scope.
- **CRUD Operations Risk**: Any Create, Update, or Delete operation on existing code can lead to severe regressions, breaking established features and causing massive project delays.
- **Impact Notification Rule**: If a proposed change, update, or deletion might impact a feature or component outside the immediate scope, you **MUST** provide a detailed impact list separately and wait for **Accept/Reject approval** before proceeding.

---

## 🏗️ Architectural Constraints (Product Modal)

### 1. The "No-Touch" Rule
The internal HTML logic of `.simple-modal-content` is a **No-Touch Zone**. Modifications must only happen via wrappers, siblings, or non-propagating event handlers.

### 2. Sliding Strip & Caching
- **Windowed Caching**: Maintain exactly 5 products `[P-2, P-1, Active, N+1, N+2]` in the DOM.
- **Hardware Acceleration**: Only use `translateX` for navigation. Position re-centering must happen instantly (`transition: none`) on `transitionend`.

### 3. Elasticity & Feedback
- **Dampening**: Apply a **0.25x multiplier** to drag distance at boundaries.
- **Visual Feedback**: The Red Edge Glow and the Premium Blue Content Glow must be preserved and scaled via CSS variables.

### 4. Theme & Variable Unity
Design changes must always respect the 3-theme parity (**Classic**, **Glass**, **Dark/Light**). Root variables (e.g., `--glass-refraction`, `--glass-blur`) must be used for all styling to ensure global propagation.

### 5. Event Isolation
The `.modal-image-gallery` and other interactive elements must strictly use `event.stopPropagation()` to prevent unintended modal navigation.

### 6. Button Standardization
All buttons in the project **must** be sourced from `buttons.css`. If a required button style does not exist, it must be added to `buttons.css` first, then called from there. This ensures consistency, reusability, and maintainability across the entire project.

---

## 🏗️ Responsive & Safe-Area Constraints

### 1. Global Safety Strategy
The project uses a centralized Safe-Area strategy in `responsive.css`. All primary content wrappers must use the `.container` class to automatically inherit `env(safe-area-inset)` protection.

### 2. Floating Element Positioning
New floating or absolute-positioned elements (Close buttons, Floating Menus, Navigation bars) must utilize `env(safe-area-inset-...)` to prevent clipping by the **Notch** or **Dynamic Island**:
- **Right Alignment**: `calc(OFFSET + env(safe-area-inset-right, 0px))`
- **Top Alignment**: `calc(OFFSET + env(safe-area-inset-top, 0px))`

### 3. Landscape Density Polish
Mobile landscape is height-constrained. New components should include scaling overrides in `responsive.css` to reduce font sizes, padding, and gaps when `(orientation: landscape)` is active. This ensures the UI feels proportional and maintains a high information density without feeling "oversized."

---


### 7. Global Gesture & Intercept Logic
- **The Sensitive Shield**: On mobile/iPad, the `.lightbox-iframe-shield` MUST be `pointer-events: auto` to prevent cross-domain iframes (YouTube, TikTok) from stealing swipe gestures.
- **Tap Proxying**: Clicks on the shield must be handled via a "Tap Proxy" that forwards unmuting/playback commands to the underlying media, ensuring high sensitivity for both swiping and interaction.

---

## 🏗️ Mobile-First Media & Performance Constraints

### 1. The "Fresh Injection" Rule (Autoplay)
To preserve the "User Activation" privilege on mobile (iOS/Android), media elements (iframes/videos) should be injected via `innerHTML` or fresh node creation rather than updating `.src`. This ensures the browser treats the media as part of the initial gesture window.

### 2. 5-Media Sliding Strip (Buffer Architecture)
The Product Modal and Lightbox MUST utilize a 5-product sliding window `[P-2, P-1, Active, N+1, N+2]` for performance. 
- **Active-Only Playback**: **CRITICAL.** Only the center (`Active`) element is permitted to play. All adjacent buffered items MUST be paused and muted.
- **Preloading**: Synchronously load/buffer the 1-2 neighbors to provide instant swiping.
- **Media Discipline (Unload)**: Any media beyond the 5-item buffer must be explicitly unloaded (`src = ""`) and paused to minimize memory pressure.

### 3. User Intent Sovereignty (Sound)
- **Manual Mute Rule**: If a user explicitly mutes a video via native controls, the global unmuting script MUST cease all unmuting attempts for the remainder of that specific media's lifecycle.
- **Persistence vs. Intent**: Global `MediaState.isUnmuted()` indicates permission to *attempt* unmuting, but it must never override an active `userMuted` state on a specific element.

### 3. Absolute 32px Lock (Landscape Toggles)
Mobile landscape toggles (`.reels-toggle`, `.globe-toggle`) must maintain an **absolute** 32px width and height. 
- **No Expansion**: Forbid `scale()` or `border-width` growth on selection to prevent overlapping nearby icons or causing layout "bloat."
- **Specificity**: Use body-theme scoped selectors to override all global styles and enforce this lock.

### 4. Hard State Policing (The "Anti-Revert" Rule)
- **Problem**: Browsers occasionally reset unmuted video volume to `0.2` (20%) upon birth/activation.
- **Constraint**: `MediaState.js` acts as the "State Police". It MUST intercept volume changes and, if the change matches the suspicious `0.2` revert and is NOT marked as a `manual` user interaction, it MUST forcibly restore the user's cached volume preference.
- **Manual Sovereignty**: User-initiated volume changes (passed with `isManual: true`) are the ONLY changes permitted to update the global cached volume.

### 6. Known Architectural Gaps (Volume Sync)
- **Problem: Reels Isolation**: Because Reels are pre-injected into the DOM, they often "miss" volume changes that occur after they are created. This results in inconsistent volume levels between adjacent Reels.
- **Problem: Inter-Modal Reset**: Switching between `MediaLightbox` and `MediaOverlay` often triggers a browser-default `0.2` reset on the new element. The current event-based policing fails to catch this "silent" reset because the new media hasn't started "talking" to the global state yet.
- **Problem: One-Way Slider Binding**: The header volume slider (Music Control) propagates its value to media, but media changes (e.g., native volume adjustments) do not reflect back to the slider because local property updates do not dispatch global sync events.
