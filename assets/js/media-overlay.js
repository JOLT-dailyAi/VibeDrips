/* assets/js/media-overlay.js - Golden Spiral Media Overlay with Mirrored Strip */

class MediaOverlay {
    constructor() {
        this.container = null;
        this.strip = null;
        this.activeMedia = null;
        this.mediaItems = []; // For the active product
        this.currentIndex = 0; // For the active product
        this.pulseInterval = null; // 🔊 Tracking pulses to prevent leaks
        this.init();
    }

    init() {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'mediaOverlay';
            this.container.className = 'media-overlay-container';

            // 🔊 LISTEN FOR GLOBAL UNMUTE
            window.addEventListener('vibedrips-media-unmute', () => {
                // 🛡️ FOCUS GUARD: Only wake up if Lightbox isn't covering us
                const isLightboxOpen = window.MediaLightbox && window.MediaLightbox.activeInstance && window.MediaLightbox.activeInstance.isOpen;

                if (this.container.classList.contains('active') && !isLightboxOpen) {
                    // ✅ NAVIGATION RESET: When unmuting globally, we want to play the current video
                    const video = this.container.querySelector('.main-video-player');
                    if (video) video.dataset.userPaused = 'false';

                    this.togglePlayback(true);
                }
                if (this.engagementPill) {
                    this.engagementPill.classList.remove('active');
                }
            });

            // Phase 1: Engagement Pill (Tap for Sound)
            this.engagementPill = document.createElement('div');
            this.engagementPill.className = 'engagement-pill';
            this.engagementPill.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                </svg>
                Tap for sound
            `;
            this.container.appendChild(this.engagementPill);

            // Sliding Strip for 5-product mirror
            this.strip = document.createElement('div');
            this.strip.className = 'media-sliding-strip';
            this.container.appendChild(this.strip);

            // Close on click background (only if clicking the container itself)
            this.container.onclick = (e) => {
                if (e.target === this.container) {
                    e.stopPropagation();
                    this.close();
                }
            };
        }
    }

    open(product) {
        if (!product) return;

        const navContainer = document.querySelector('.modal-nav-container');
        if (navContainer && !navContainer.contains(this.container)) {
            navContainer.appendChild(this.container);
        }

        this.container.classList.add('active');
        document.body.classList.add('view-reels-mode');
        document.body.style.overflow = 'hidden';

        // Initialize the 5-Grid Cache
        this.refreshCache();

        // 🎯 ABSOLUTE STABILIZATION: Trigger explicit play AFTER modal transition finishes
        setTimeout(() => {
            this.togglePlayback(true);
        }, 500);
    }

    close() {
        this.togglePlayback(false);
        this.container.classList.remove('active');
        document.body.classList.remove('view-reels-mode');
        document.body.style.overflow = '';

        const reelsBtn = document.querySelector('.reels-toggle.active');
        if (reelsBtn) reelsBtn.classList.remove('active');
    }

    /**
     * Rebuilds the 5-product media strip to mirror products.js
     */
    refreshCache() {
        if (!VibeDrips.modalState || !VibeDrips.modalState.currentProductList) return;

        const centerIndex = VibeDrips.modalState.currentIndex;
        const list = VibeDrips.modalState.currentProductList;
        const total = list.length;

        // Simplified 5-product window logic (mirrors products.js)
        const cacheIndices = [
            (centerIndex - 2 + total) % total,
            (centerIndex - 1 + total) % total,
            centerIndex,
            (centerIndex + 1) % total,
            (centerIndex + 2) % total
        ];

        this.strip.style.transition = 'none';
        this.strip.style.transform = 'translateX(-40%)';
        this.strip.innerHTML = '';

        cacheIndices.forEach((idx, i) => {
            const product = list[idx];
            const gridWrapper = document.createElement('div');
            gridWrapper.className = 'media-grid-wrapper';

            // 🛡️ ACTIVE-ONLY PLAYBACK: Neighbors (i != 2) are buffered but MUST be paused/muted
            const isCenterSlot = (i === 2);
            gridWrapper.innerHTML = this.renderGridHTML(product, isCenterSlot);
            this.strip.appendChild(gridWrapper);

            // If it's a neighbor, force immediate silence/pause
            if (!isCenterSlot) {
                const neighborMedia = gridWrapper.querySelectorAll('video, iframe');
                neighborMedia.forEach(m => {
                    if (m.tagName === 'VIDEO') {
                        m.pause();
                        m.muted = true;
                    } else if (m.contentWindow) {
                        m.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'pauseVideo', args: '' }), '*');
                    }
                });
            }

            // If it's the active one, set current items
            if (isCenterSlot) {
                this.mediaItems = Array.isArray(product.reference_media) ? [...product.reference_media] : [];
                this.initialMediaCount = this.mediaItems.length;
                this.currentIndex = 0;
            }

            // 🏎️ EFFICIENCY: Pre-connect & Preload Adjacent (i=1, 2, 3)
            if (i >= 1 && i <= 3) {
                this.optimizePerformance(product);
            }
        });

        // Small delay to re-enable transitions after teleport
        requestAnimationFrame(() => {
            this.strip.style.transition = 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)';
        });
    }

    /**
     * Selective Pre-connect & Preload logic
     */
    optimizePerformance(product) {
        if (!product || !product.reference_media) return;
        const media = Array.isArray(product.reference_media) ? product.reference_media : [];

        media.forEach(url => {
            if (!url) return;

            // 1. Domain Pre-connect (Fast Handshake)
            if (url.includes('youtube.com') || url.includes('youtu.be')) this.preconnect('https://www.youtube.com');
            if (url.includes('instagram.com')) this.preconnect('https://www.instagram.com');
            if (url.includes('tiktok.com')) this.preconnect('https://v.tiktok.com');

            // 2. Buffered Adjacent (Native .mp4 preloading)
            if (url.match(/\.(mp4|webm|mov|avi)$/i)) {
                // Check if already preloaded
                if (document.querySelector(`link[href="${url}"]`)) return;

                const link = document.createElement('link');
                link.rel = 'preload';
                link.as = 'video';
                link.href = url;
                document.head.appendChild(link);
            }
        });
    }

    preconnect(url) {
        if (window._preconnectedDomains?.has(url)) return;
        if (!window._preconnectedDomains) window._preconnectedDomains = new Set();

        const link = document.createElement('link');
        link.rel = 'preconnect';
        link.href = url;
        document.head.appendChild(link);
        window._preconnectedDomains.add(url);
    }

    /**
     * Total Strip Silence
     * Pauses every video and iframe in the 5-product strip
     */
    stopAllMedia() {
        if (!this.strip) return;

        // 💀 NUCLEAR PURGE: Find all media wrappers except the active center (if applicable)
        // or just kill everything if we're doing a total silence
        const wrappers = this.strip.querySelectorAll('.media-grid-wrapper');
        wrappers.forEach(wrapper => {
            const video = wrapper.querySelector('video');
            const iframe = wrapper.querySelector('iframe');

            if (video) {
                video.pause();
                video.removeAttribute('src');
                video.load();
            }

            if (iframe && iframe.contentWindow) {
                try {
                    iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'pauseVideo', args: '' }), '*');
                } catch (e) { }
            }

            // Absolute destruction of secondary media containers
            const secondaryPlayers = wrapper.querySelectorAll('.active-player-wrapper');
            secondaryPlayers.forEach(p => {
                while (p.firstChild) p.removeChild(p.firstChild);
            });
        });
    }

    syncSlide(percentage) {
        if (!this.strip) return;
        // Silence everything before a major move
        this.stopAllMedia();
        this.strip.style.transform = `translateX(${percentage}%)`;
    }

    renderGridHTML(product, isActive = false) {
        const media = Array.isArray(product.reference_media) ? [...product.reference_media] : [];
        if (media.length === 0) return `<div class="golden-spiral-grid empty-grid">No Media Available</div>`;

        // 🧱 MASTER GRID: Use a baseline density logic but fixed architecture
        const itemCount = media.length;
        let tierClass = 'tier-1';
        if (itemCount >= 5 && itemCount <= 6) tierClass = 'tier-2';
        else if (itemCount >= 7) tierClass = 'tier-3';

        return `
            <div class="golden-spiral-grid ${tierClass}">
                <div class="spiral-tile tile-large active-player">
                    ${this.getPlayerHTML(media[0], isActive)}
                </div>
                ${this.renderTiles(media)}
            </div>
        `;
    }

    renderTiles(media) {
        let html = '';
        // MASTER GRID: Always render 8 thumbnail slots (thumb-1 to thumb-8)
        // This ensures the structural layout (Golden Spiral) is FIXED
        for (let i = 1; i <= 8; i++) {
            const item = media[i];
            const isEmpty = !item;

            // Tier-based visibility logic (Master classes)
            let tierClass = '';
            if (i >= 5) tierClass = 'tier-3-only'; // Hide if not in tier 3 density

            html += `
                <div class="spiral-tile thumb-${i} ${isEmpty ? 'empty-slot' : ''}" 
                     data-index="${i}"
                     onclick="window.mediaOverlay.swapMedia(${i}, this)">
                    ${!isEmpty ? `<img src="${this.getThumbnail(item)}">` : ''}
                </div>
            `;
        }
        return html;
    }

    getPlayerHTML(url, isAutoplay = true) {
        if (!url) return '';
        const embedUrl = this.getUniversalVideoEmbedUrl(url, isAutoplay);

        let player = '';
        if (url.match(/\.(mp4|webm|mov|avi)$/i)) {
            // 🛡️ ASYMMETRIC MUTE: Use platform-aware state
            const shouldStartMuted = window.MediaState?.shouldStartMuted();
            const autoplayAttr = isAutoplay ? `autoplay ${shouldStartMuted ? 'muted' : ''}` : '';
            player = `<video controls playsinline ${autoplayAttr} class="main-video-player" 
                             data-user-paused="false" data-user-muted="false">
                        <source src="${url}" type="video/mp4">
                      </video>`;
        } else {
            player = `<iframe src="${embedUrl}" class="main-iframe-player" scrolling="no" allowfullscreen="true" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"></iframe>`;
        }

        // 🛡️ ASYMMETRIC SHIELD: iOS always shows shield; Android/Desktop only if muted
        const isIOS = window.Device?.isIOS();
        const shouldStartMuted = window.MediaState?.shouldStartMuted();

        const shieldStyle = (isIOS || shouldStartMuted)
            ? 'pointer-events:auto; display:block;'
            : 'pointer-events:none; display:none;';

        const shield = `<div class="media-shield" 
                             style="position:absolute;top:0;left:0;width:100%;height:100%;z-index:10;background:transparent;cursor:pointer; ${shieldStyle}" 
                             ontouchstart="event.stopPropagation(); if(window.MediaState) window.MediaState.setUnmuted(); this.style.pointerEvents='none'; this.style.display='none';"
                             onclick="event.stopPropagation(); if(window.MediaState) window.MediaState.setUnmuted(); this.style.pointerEvents='none'; this.style.display='none';">
                        </div>`;

        const activeWrapper = document.createElement('div');
        activeWrapper.className = 'active-player-wrapper';
        activeWrapper.style.position = 'relative';
        activeWrapper.style.width = '100%';
        activeWrapper.style.height = '100%';
        activeWrapper.innerHTML = `${player}${shield}
                <div class="live-player-hub">
                    <button class="zoom-btn" onclick="event.stopPropagation(); window.mediaOverlay.openFullscreen()">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
                        </svg>
                        Fullscreen Gallery
                    </button>
                </div>
            `;

        // ✅ USER INTENT SOVEREIGNTY: Track manual mutes/pauses
        const mediaElem = activeWrapper.querySelector('video');
        if (mediaElem) {
            mediaElem.addEventListener('volumechange', () => {
                if (mediaElem.muted) mediaElem.dataset.userMuted = 'true';
                else mediaElem.dataset.userMuted = 'false';
            });
            mediaElem.addEventListener('pause', () => {
                // Only register manual pause if the video was actually playing
                // (Prevents browser autoplay blocks from setting userPaused=true)
                if (mediaElem.currentTime > 0.1) {
                    mediaElem.dataset.userPaused = 'true';
                }
            });
        }

        return activeWrapper.outerHTML;
    }

    swapMedia(index) {
        const activeGrid = this.strip.children[2];
        if (!activeGrid) return;

        // Silence everything before content shift
        this.stopAllMedia();

        // 1. Capture State
        const clickedItem = this.mediaItems[index];
        const oldLive = this.mediaItems[0];
        if (!clickedItem || !oldLive) return;

        // 🎬 SNAIL-SHIFT Stage 1: Trigger Exit Animation on thumbnails
        const gridTiles = activeGrid.querySelector('.golden-spiral-grid');
        if (gridTiles) {
            gridTiles.classList.add('snail-moving');
        }

        // 2. Perform Any-OUT-Last-IN Array Rotation
        // [Clicked] -> [Rest of Original Queue excl. Clicked & Live] -> [Old Live]
        const rest = this.mediaItems.filter((_, i) => i !== 0 && i !== index);
        this.mediaItems = [clickedItem, ...rest, oldLive];

        // 🎬 Stage 2: CONTENT FLOW (Update Stable Nodes)
        setTimeout(() => {
            // A. Update Live Player
            const playerSlot = activeGrid.querySelector('.active-player');
            if (playerSlot) {
                playerSlot.innerHTML = this.getPlayerHTML(clickedItem);
                playerSlot.style.visibility = 'visible';
                playerSlot.style.pointerEvents = 'auto';
            }

            // B. Update Thumbnails (Stable Node Flow)
            for (let i = 1; i <= 8; i++) {
                const thumbSlot = activeGrid.querySelector(`.thumb-${i}`);
                const newItem = this.mediaItems[i];

                if (thumbSlot) {
                    if (newItem) {
                        thumbSlot.classList.remove('empty-slot', 'stagger-in');
                        thumbSlot.innerHTML = `<img src="${this.getThumbnail(newItem)}">`;
                        // Force a reflow for stagger animation
                        void thumbSlot.offsetWidth;
                        thumbSlot.classList.add('stagger-in');
                    } else {
                        thumbSlot.classList.add('empty-slot');
                        thumbSlot.innerHTML = '';
                    }
                }
            }

            if (gridTiles) {
                gridTiles.classList.remove('snail-moving');
            }

            // 🎯 ABSOLUTE STABILIZATION: Trigger explicit play AFTER media swap settles
            setTimeout(() => {
                this.togglePlayback(true);
            }, 300);
        }, 150);
    }

    openFullscreen() {
        this.togglePlayback(false);
        if (typeof MediaLightbox !== 'undefined') {
            const lightbox = new MediaLightbox();
            lightbox.open(this.mediaItems, this.currentIndex);

            const check = setInterval(() => {
                const lb = document.getElementById('mediaLightbox');
                if (!lb || !lb.classList.contains('active')) {
                    clearInterval(check);
                    this.togglePlayback(true);
                }
            }, 500);
        }
    }

    togglePlayback(play = true) {
        const activeGrid = this.strip?.children[2];
        if (!activeGrid) return;

        const playerSlot = activeGrid.querySelector('.active-player');
        const video = activeGrid.querySelector('.main-video-player');
        const iframe = activeGrid.querySelector('.main-iframe-player');

        // Layer 3: Visibility & Pointer State
        if (playerSlot) {
            playerSlot.style.visibility = play ? 'visible' : 'hidden';
            playerSlot.style.pointerEvents = play ? 'auto' : 'none';
        }

        if (video) {
            if (play) {
                // 🛡️ ASYMMETRIC MUTE: Use platform-aware state
                const shouldMute = window.MediaState?.shouldStartMuted();
                const preferredVolume = window.MediaState?.getVolume();
                // 🔊 ONE-SHOT SETUP: Set volume once, separate from play pulse logic
                video.dataset.scriptTriggeredVolume = 'true';
                video.muted = shouldMute;
                video.volume = preferredVolume;
                setTimeout(() => video.dataset.scriptTriggeredVolume = 'false', 100);

                // ✅ NATIVE BRIDGE: Flip sound as soon as the video actually starts moving
                if (!video.dataset.bridgeSet) {
                    video.dataset.bridgeSet = 'true';

                    const tryUnmute = () => {
                        if (window.MediaState && window.MediaState.isUnmuted()) {
                            if (video.dataset.userMuted !== 'true') {
                                video.dataset.scriptTriggeredVolume = 'true';
                                video.muted = false;
                                video.volume = window.MediaState?.getVolume();
                                setTimeout(() => video.dataset.scriptTriggeredVolume = 'false', 100);
                            }
                        }
                    };

                    video.addEventListener('playing', tryUnmute, { once: true });

                    // 🔊 GLOBAL SYNC: If the user adjusts volume, save it site-wide
                    video.addEventListener('volumechange', () => {
                        // 🛡️ SYNC GUARD: Ignore volume changes triggered by our own script
                        if (video.dataset.scriptTriggeredVolume === 'true') return;

                        if (!video.muted && video.volume > 0) {
                            if (window.MediaState) window.MediaState.setVolume(video.volume);
                            video.dataset.userMuted = 'false';
                        }
                        if (video.muted) video.dataset.userMuted = 'true';
                    });

                    // 🔄 RACE CONDITION: If already playing, trigger now
                    if (!video.paused && video.currentTime > 0) tryUnmute();
                }

                video.play().catch(err => {
                    console.warn('🎬 Modal: Transition play blocked:', err);
                    video.muted = true;
                    video.play().catch(() => { });
                });
            } else {
                video.pause();
            }
        }

        if (iframe && iframe.contentWindow) {
            const sendPulse = () => {
                if (!play || !this.container.classList.contains('active')) return;

                // Initial Play Pulse (Hammering Technique)
                // 1. YouTube specialized (API mode)
                iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'playVideo', args: '' }), '*');

                // 2. Vimeo specialized
                iframe.contentWindow.postMessage(JSON.stringify({ method: 'play' }), '*');

                // 3. Protocol Shotgun Fallbacks
                iframe.contentWindow.postMessage('play', '*');
                iframe.contentWindow.postMessage(JSON.stringify({ event: 'play' }), '*');
            };

            // ⚠️ PILL CONTROL: Move to One-Shot logic
            const isIOS = window.Device?.isIOS();
            const shouldMute = window.MediaState?.shouldStartMuted();
            if (play && (isIOS || shouldMute) && this.engagementPill) {
                this.engagementPill.classList.add('active');
            } else if (this.engagementPill) {
                this.engagementPill.classList.remove('active');
            }

            // 🔊 ONE-SHOT INITIALIZATION: Set volume and unmute bridge BEFORE pulses start
            if (play && !shouldMute) {
                const preferredVolume = window.MediaState?.getVolume();
                const youtubeVol = Math.round(preferredVolume * 100);

                setTimeout(() => {
                    if (!iframe.contentWindow) return;
                    // 1. YouTube specialized (API mode)
                    iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'unMute', args: '' }), '*');
                    iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'setVolume', args: [youtubeVol] }), '*');

                    // 2. Vimeo specialized
                    iframe.contentWindow.postMessage(JSON.stringify({ method: 'setVolume', value: preferredVolume }), '*');

                    // 3. Protocol Shotgun Fallbacks
                    iframe.contentWindow.postMessage('unmute', '*');
                    iframe.contentWindow.postMessage(JSON.stringify({ event: 'unmute' }), '*');
                }, 300);
            }

            if (play) {
                // 🛡️ USER INTENT SOVEREIGNTY: Back off if user manually interacted
                if (video?.dataset.userMuted === 'true' || video?.dataset.userPaused === 'true') {
                    return;
                }
                if (iframe?.dataset.userMuted === 'true' || iframe?.dataset.userPaused === 'true') {
                    return;
                }

                // 🛡️ CLEANUP: Stop any existing pulse loop
                if (this.pulseInterval) {
                    clearInterval(this.pulseInterval);
                    this.pulseInterval = null;
                }

                // Initial burst
                sendPulse();

                // 🔊 SUCCESSIVE PULSE: Pulse every 400ms for 1.6 seconds (One-Shot Safe)
                let pulses = 0;
                this.pulseInterval = setInterval(() => {
                    // Re-check intent inside interval
                    if (video?.dataset.userMuted === 'true' || video?.dataset.userPaused === 'true' ||
                        iframe?.dataset.userMuted === 'true' || iframe?.dataset.userPaused === 'true' ||
                        !this.container.classList.contains('active')) {
                        clearInterval(this.pulseInterval);
                        this.pulseInterval = null;
                        return;
                    }

                    sendPulse();
                    if (++pulses >= 4) {
                        clearInterval(this.pulseInterval);
                        this.pulseInterval = null;
                    }
                }, 400);
            } else {
                // 🛡️ CLEANUP: Kill the pulse loop instantly
                if (this.pulseInterval) {
                    clearInterval(this.pulseInterval);
                    this.pulseInterval = null;
                }

                // Global Stop Signal
                iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'pauseVideo', args: '' }), '*');
                iframe.contentWindow.postMessage(JSON.stringify({ method: 'pause' }), '*');
                iframe.contentWindow.postMessage('pause', '*');
                iframe.contentWindow.postMessage(JSON.stringify({ type: 'player:pause' }), '*');
            }
        }
    }

    getThumbnail(url) {
        if (!url) return 'assets/images/placeholder-video.jpg';
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            const id = url.match(/(?:v=|shorts\/|be\/|embed\/)([^&?]+)/)?.[1];
            return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : 'assets/images/placeholder-video.jpg';
        }
        if (url.includes('instagram.com')) return 'https://www.instagram.com/static/images/ico/favicon-192.png/b405f6e8902d.png';
        return 'assets/images/placeholder-video.jpg';
    }

    /**
     * Universal Video Embed URL Generator
     * Converts standard platform links to embeddable ones
     */
    getUniversalVideoEmbedUrl(sourceUrl, isAutoplay = true) {
        if (!sourceUrl) return '';
        try {
            const url = sourceUrl.toLowerCase();
            const autoplayVal = isAutoplay ? '1' : '0';

            // Instagram
            if (url.includes('instagram.com')) {
                const match = sourceUrl.match(/\/(p|reel)\/([^\/\?]+)/);
                if (match && match[2]) return `https://www.instagram.com/p/${match[2]}/embed`;
            }

            // TikTok
            if (url.includes('tiktok.com')) {
                const match = sourceUrl.match(/\/video\/(\d+)/);
                if (match && match[1]) return `https://www.tiktok.com/embed/v2/${match[1]}`;
            }

            // YouTube (Long, Short, Shorts)
            if (url.includes('youtube.com') || url.includes('youtu.be')) {
                let videoId = null;
                if (url.includes('youtu.be/')) {
                    videoId = sourceUrl.match(/youtu\.be\/([^?]+)/)?.[1];
                } else if (url.includes('youtube.com/watch')) {
                    videoId = new URL(sourceUrl).searchParams.get('v');
                } else if (url.includes('youtube.com/shorts/')) {
                    videoId = sourceUrl.match(/shorts\/([^?]+)/)?.[1];
                }
                // 🛡️ MOBILE PROTOCOL: Always start MUTED on initial load.
                const initialMute = window.MediaState?.shouldStartMuted() ? '1' : '0';

                if (videoId) return `https://www.youtube.com/embed/${videoId}?enablejsapi=1&autoplay=${autoplayVal}&mute=${initialMute}&rel=0`;
            }

            // Direct Video
            if (url.match(/\.(mp4|webm|mov|avi)$/)) return sourceUrl;

        } catch (error) {
            console.error('🎬 Embed Parser Error:', error);
        }
        return sourceUrl;
    }
}

window.mediaOverlay = new MediaOverlay();

// 🔊 GLOBAL VOLUME SYNC: Update active overlay media if volume changes elsewhere
window.addEventListener('vibedrips-media-volume', (e) => {
    const vol = e.detail.volume;
    if (!window.mediaOverlay?.container?.classList.contains('active')) return;

    const video = window.mediaOverlay.container.querySelector('video');
    const iframe = window.mediaOverlay.container.querySelector('iframe');

    if (video && video.dataset.userMuted !== 'true') {
        video.dataset.scriptTriggeredVolume = 'true';
        video.volume = vol;
        setTimeout(() => video.dataset.scriptTriggeredVolume = 'false', 100);
    }

    if (iframe && iframe.contentWindow && iframe.dataset.userMuted !== 'true') {
        const youtubeVol = Math.round(vol * 100);
        iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'setVolume', args: [youtubeVol] }), '*');
        iframe.contentWindow.postMessage(JSON.stringify({ method: 'setVolume', value: vol }), '*');
    }
});
