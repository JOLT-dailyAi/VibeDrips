/* assets/js/media-overlay.js - Golden Spiral Media Overlay with Mirrored Strip */

class MediaOverlay {
    constructor() {
        this.container = null;
        this.strip = null;
        this.activeMedia = null;
        this.mediaItems = []; // For the active product
        this.currentIndex = 0; // For the active product
        this.init();
    }

    init() {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'mediaOverlay';
            this.container.className = 'media-overlay-container';

            // 🔊 LISTEN FOR GLOBAL UNMUTE
            window.addEventListener('vibedrips-media-unmute', () => {
                if (this.container.classList.contains('active')) {
                    this.togglePlayback(true);
                }
            });

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
            // ONLY the center product (i=2) gets autoplay
            gridWrapper.innerHTML = this.renderGridHTML(product, i === 2);
            this.strip.appendChild(gridWrapper);

            // If it's the active one, set current items
            if (i === 2) {
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
        const allVideos = this.strip.querySelectorAll('video');
        const allIframes = this.strip.querySelectorAll('iframe');

        allVideos.forEach(v => v.pause());
        allIframes.forEach(iframe => {
            if (iframe.contentWindow) {
                // Universal Pause Pulse
                iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'pauseVideo', args: '' }), '*');
                iframe.contentWindow.postMessage(JSON.stringify({ method: 'pause' }), '*');
                iframe.contentWindow.postMessage('pause', '*');
                iframe.contentWindow.postMessage(JSON.stringify({ type: 'player:pause' }), '*');
            }
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
            // 🛡️ MOBILE PROTOCOL: Always start MUTED in HTML to guarantee autoplay permission.
            // Shotgun pulse handles the unmuting session-wide.
            const autoplayAttr = isAutoplay ? 'autoplay' : '';
            player = `<video controls playsinline muted ${autoplayAttr} class="main-video-player"><source src="${url}" type="video/mp4"></video>`;
        } else {
            player = `<iframe src="${embedUrl}" class="main-iframe-player" scrolling="no" allowfullscreen="true" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"></iframe>`;
        }

        // 🛡️ GESTURE SHIELD: Catch the first tap for unmuting intent
        const shield = `<div class="media-shield" 
                             style="position:absolute;top:0;left:0;width:100%;height:100%;z-index:10;background:transparent;cursor:pointer;" 
                             ontouchstart="event.stopPropagation(); if(window.MediaState) window.MediaState.setUnmuted(); window.mediaOverlay.togglePlayback(true); this.style.pointerEvents='none'; this.style.display='none';"
                             onclick="event.stopPropagation(); if(window.MediaState) window.MediaState.setUnmuted(); window.mediaOverlay.togglePlayback(true); this.style.pointerEvents='none'; this.style.display='none';">
                        </div>`;

        return `
            <div class="active-player-wrapper" style="position:relative;width:100%;height:100%;">
                ${player}
                ${shield}
                <div class="live-player-hub">
                    <button class="zoom-btn" onclick="event.stopPropagation(); window.mediaOverlay.openFullscreen()">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
                        </svg>
                        Fullscreen Gallery
                    </button>
                </div>
            </div>
        `;
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
                video.muted = false; // 🔊 Unmute for Active
                video.volume = 0.2;
                video.play().catch(() => {
                    // 🛡️ Fallback: Browser blocked unmuted autoplay (Mobile)
                    if (!window.MediaState?.isUnmuted()) {
                        video.muted = true;
                    }
                    video.play();
                });

                // PERSISTENCE: Pulse native video too (some browsers re-mute on transition)
                let nativePulses = 0;
                const vInterval = setInterval(() => {
                    if (video.paused) video.play().catch(() => { });

                    // 🛡️ THE PULSE GUARD: Only unmute if session has been unlocked by user
                    if (window.MediaState?.isUnmuted()) {
                        video.muted = false;
                        video.volume = 0.2;
                    } else {
                        video.muted = true;
                    }

                    if (++nativePulses >= 8) clearInterval(vInterval);
                }, 500);
            } else {
                video.pause();
            }
        }

        if (iframe && iframe.contentWindow) {
            const sendAudioCommands = () => {
                if (!play || !this.container.classList.contains('active')) return;

                // 🛡️ THE PULSE GUARD: Only attempt to unmute if the session is already active.
                // This prevents "Illegal Unmuting" which causes mobile browsers to abort autoplay.
                const isUnmutedSession = window.MediaState && window.MediaState.isUnmuted();

                if (isUnmutedSession) {
                    // 1. YouTube specialized (API mode)
                    iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'unMute', args: '' }), '*');
                    iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'setVolume', args: [20] }), '*');

                    // 2. Vimeo specialized
                    iframe.contentWindow.postMessage(JSON.stringify({ method: 'setVolume', value: 0.2 }), '*');

                    // 3. Protocol Shotgun Fallbacks
                    iframe.contentWindow.postMessage('unmute', '*');
                    iframe.contentWindow.postMessage(JSON.stringify({ event: 'unmute' }), '*');
                    iframe.contentWindow.postMessage(JSON.stringify({ event: 'volume', value: 0.2 }), '*');
                }

                iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'playVideo', args: '' }), '*');
                iframe.contentWindow.postMessage(JSON.stringify({ method: 'play' }), '*');
                iframe.contentWindow.postMessage('play', '*');
            };

            if (play) {
                // Initial burst
                sendAudioCommands();

                // 🔊 SUCCESSIVE PULSE: Pulse every 400ms for 4 seconds (Pulse Overdrive)
                let pulses = 0;
                const interval = setInterval(() => {
                    sendAudioCommands();
                    if (++pulses >= 10 || !this.container.classList.contains('active')) {
                        clearInterval(interval);
                    }
                }, 400);
            } else {
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
                // 🛡️ MOBILE PROTOCOL: Always start MUTED (mute=1) to guarantee autoplay permission.
                // UNLESS: The session is already unmuted globally.
                const initialMute = (window.MediaState && window.MediaState.isUnmuted()) ? '0' : '1';

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
