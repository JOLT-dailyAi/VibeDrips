# READ_MEDIA_REGISTRY_BLUEPRINT.md

This document serves as the technical master plan for the **Unified Media Registry**. While the initial implementation was rolled back to prioritize immediate stability, this remains the definitive architectural solution for global volume synchronization.

## 1. The Problem: Event-Driven Isolation
The current system (Commit `0528369`) relies on global `vibedrips-media-volume` events. This model is fundamentally flawed for a high-intensity media platform because:
- **The "Born Deaf" Bug**: Media injected after a volume event never receives the update.
- **Race Conditions**: Components often "miss" the signal if they are in the middle of a transition.
- **Silent Resets**: Browsers reset audio to 20% on birth; if the media isn't actively "policed" by a master controller, it stays at that lower level.

## 2. The Solution: Unified Media Registry (The "State Master")
Switch from a **Push** (Events) model to a **Control** (Registry) model.

### 🏗️ Registry Architecture
```mermaid
graph TD
    A[MediaState.js Master] --> B{Registry (Set)}
    B --> C[Reel Video]
    B --> D[Lightbox Iframe]
    B --> E[Live Slot Media]
    F[User moves slider] --> A
    A -->|Direct Force-Overwrite| B
```

### 🗝️ Core API (`MediaState.js`)
1.  **`_registeredMedia = new Set()`**: A private collection of all active DOM elements (`<video>`, `<iframe>`).
2.  **`register(media)`**:
    - Adds element to the Set.
    - Immediately applies `lockVolume(media)` to sync it with the global cached value.
3.  **`unregister(media)`**:
    - Removes element from the Set.
    - Important for memory safety and preventing "ghost volume" commands.
4.  **`forceGlobalSync()`**:
    - The master loop. Iterates through the Set and calls `lockVolume()` on every element to ensure absolute compliance.

## 3. Implementation Requirements

### 🎬 Reels Feed (`reels-feed.js`)
- **Activation**: Inside `activateMedia()`, call `MediaState.register(media)`.
- **Termination**: Inside `killMedia()`, call `MediaState.unregister(media)`.

### 🪟 Media Overlay (`media-overlay.js`)
- **Live Slot**: Any media injected into the `active-player` slot must be registered on play and unregistered on stop/close.

### 💡 Lightbox (`lightbox.js`)
- **Sliding Window**: Media elements in the 5-item sliding strip must register as they enter the preload window and unregister as they are purged from the DOM.

## 4. Lessons from the "Broken" Attempt
The first attempt failed due to implementation complexity. The next attempt MUST ensure:
1.  **Syntax Integrity**: Strictly verify brace balancing in `media-overlay.js` (a known pain point).
2.  **Explicit Binding**: Every component must be double-checked to ensure they don't have legacy `volumechange` listeners that conflict with the Registry.
3.  **Master Authority**: The Registry must be the **only** thing allowed to touch `audio.volume` or `postMessage` volume commands. Avoid "Hybrid" models where components try to manage their own volume alongside the Registry.

## 5. Success Metric
- **The "Perfect Sync"**: A volume adjustment in the header slider must physically move the volume of a Reel, a Modal video, and a Lightbox iframe **simultaneously** with zero lag and zero resets to 20%.
