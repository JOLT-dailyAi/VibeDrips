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
            gridWrapper.innerHTML = this.renderGridHTML(product, i === 2); // i===2 is center active
            this.strip.appendChild(gridWrapper);

            // If it's the active one, set current items
            if (i === 2) {
                this.mediaItems = Array.isArray(product.reference_media) ? [...product.reference_media] : [];
                this.initialMediaCount = this.mediaItems.length; // 🧱 Stable baseline
                this.currentIndex = 0;
            }
        });

        // Small delay to re-enable transitions after teleport
        requestAnimationFrame(() => {
            this.strip.style.transition = 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)';
        });
    }

    syncSlide(percentage) {
        if (!this.strip) return;
        this.strip.style.transform = `translateX(${percentage}%)`;
    }

    renderGridHTML(product) {
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
                    ${this.getPlayerHTML(media[0])}
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

    getPlayerHTML(url) {
        if (!url) return '';
        const embedUrl = this.getUniversalVideoEmbedUrl(url);

        let player = '';
        if (url.match(/\.(mp4|webm|mov|avi)$/i)) {
            player = `<video controls playsinline autoplay muted class="main-video-player"><source src="${url}" type="video/mp4"></video>`;
        } else {
            player = `<iframe src="${embedUrl}" class="main-iframe-player" scrolling="no" allowfullscreen="true" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"></iframe>`;
        }

        return `
            ${player}
            <div class="live-player-hub">
                <button class="zoom-btn" onclick="event.stopPropagation(); window.mediaOverlay.openFullscreen()">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
                    </svg>
                    Fullscreen Gallery
                </button>
            </div>
        `;
    }

    swapMedia(index) {
        const activeGrid = this.strip.children[2];
        if (!activeGrid) return;

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

        // Layer 3: CSS Suspension (Physical Audio Halt)
        if (playerSlot) {
            playerSlot.style.visibility = play ? 'visible' : 'hidden';
            playerSlot.style.pointerEvents = play ? 'auto' : 'none';
        }

        if (video) {
            play ? video.play().catch(() => { }) : video.pause();
        }

        if (iframe && iframe.contentWindow) {
            // Layer 1: Specialized APIs
            const cmd = play ? 'playVideo' : 'pauseVideo';
            iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: cmd, args: '' }), '*');
            iframe.contentWindow.postMessage(JSON.stringify({ method: play ? 'play' : 'pause' }), '*');

            // Layer 2: Protocol Shotgun (Universal signals)
            const shotgun = play ? 'pause' : 'play'; // Corrected order if needed, but usually 'pause' is safe
            iframe.contentWindow.postMessage(play ? 'play' : 'pause', '*');
            iframe.contentWindow.postMessage(JSON.stringify({ type: 'player:' + (play ? 'play' : 'pause') }), '*');
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
    getUniversalVideoEmbedUrl(sourceUrl) {
        if (!sourceUrl) return '';
        try {
            const url = sourceUrl.toLowerCase();

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
                if (videoId) return `https://www.youtube.com/embed/${videoId}?enablejsapi=1&autoplay=1&mute=1`;
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
