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
                this.mediaItems = Array.isArray(product.reference_media) ? product.reference_media : [];
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

    renderGridHTML(product, isActive) {
        const media = Array.isArray(product.reference_media) ? product.reference_media : [];
        if (media.length === 0) return `<div class="golden-spiral-grid empty-grid">No Media Available</div>`;

        const itemCount = media.length;
        // Tiers: 1-4 (standard), 5-6 (subtile-1), 7-8 (subtile-2)
        let tierClass = 'tier-1';
        if (itemCount >= 5 && itemCount <= 6) tierClass = 'tier-2';
        else if (itemCount >= 7) tierClass = 'tier-3';

        return `
            <div class="golden-spiral-grid ${tierClass}">
                <div class="spiral-tile tile-large active-player">
                    ${isActive ? this.getPlayerHTML(media[0]) : ''}
                </div>
                ${this.renderTiles(media, isActive)}
            </div>
        `;
    }

    renderTiles(media, isActive) {
        let html = '';
        const itemCount = media.length;

        // Tile 1 (3x3 area)
        if (itemCount >= 5) {
            html += `<div class="spiral-tile tile-1 sub-grid">
                ${[1, 2, 3, 4].map(idx => media[idx] ? `
                    <div class="sub-tile" onclick="window.mediaOverlay.swapMedia(${idx}, this)">
                        <img src="${this.getThumbnail(media[idx])}">
                    </div>
                ` : '').join('')}
            </div>`;
        } else if (media[1]) {
            html += `<div class="spiral-tile tile-1" onclick="window.mediaOverlay.swapMedia(1, this)">
                <img src="${this.getThumbnail(media[1])}">
            </div>`;
        } else {
            html += `<div class="spiral-tile tile-1 empty-slot"></div>`;
        }

        // Tile 2 (2x2 area)
        if (itemCount >= 7) {
            html += `<div class="spiral-tile tile-2 sub-grid">
                ${[5, 6, 7, 8].map(idx => media[idx] ? `
                    <div class="sub-tile" onclick="window.mediaOverlay.swapMedia(${idx}, this)">
                        <img src="${this.getThumbnail(media[idx])}">
                    </div>
                ` : '').join('')}
            </div>`;
        } else if (media[2]) {
            html += `<div class="spiral-tile tile-2" onclick="window.mediaOverlay.swapMedia(2, this)">
                <img src="${this.getThumbnail(media[2])}">
            </div>`;
        } else {
            html += `<div class="spiral-tile tile-2 empty-slot"></div>`;
        }

        // Tile 3 (1x1 area)
        html += media[3] ? `
            <div class="spiral-tile tile-3" onclick="window.mediaOverlay.swapMedia(3, this)">
                <img src="${this.getThumbnail(media[3])}">
            </div>
        ` : `<div class="spiral-tile tile-3 empty-slot"></div>`;

        // Tile 4 (1x1 area)
        html += media[4] && itemCount < 5 ? `
            <div class="spiral-tile tile-4" onclick="window.mediaOverlay.swapMedia(4, this)">
                <img src="${this.getThumbnail(media[4])}">
            </div>
        ` : `<div class="spiral-tile tile-4 empty-slot"></div>`;

        return html;
    }

    getPlayerHTML(url) {
        if (!url) return '';
        const embedUrl = typeof window.getUniversalVideoEmbedUrl === 'function' ? window.getUniversalVideoEmbedUrl(url) : url;

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

    swapMedia(index, element) {
        const activeGrid = this.strip.children[2]; // Index 2 is always center/active in 5-cache
        if (!activeGrid) return;

        const playerSlot = activeGrid.querySelector('.active-player');
        const url = this.mediaItems[index];
        if (!playerSlot || !url) return;

        this.currentIndex = index;
        playerSlot.innerHTML = this.getPlayerHTML(url);

        // UI Highlights
        activeGrid.querySelectorAll('.spiral-tile, .sub-tile').forEach(el => el.classList.remove('active-thumb'));
        if (element) element.classList.add('active-thumb');
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
}

window.mediaOverlay = new MediaOverlay();
