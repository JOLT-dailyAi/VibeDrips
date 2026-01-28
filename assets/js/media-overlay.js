/* assets/js/media-overlay.js - Golden Spiral Media Overlay */

class MediaOverlay {
    constructor() {
        this.container = null;
        this.activeMedia = null;
        this.mediaItems = [];
        this.currentIndex = 0;
        this.init();
    }

    init() {
        // Create container if it doesn't exist in memory
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'mediaOverlay';
            this.container.className = 'media-overlay-container';

            // Close on click background
            this.container.onclick = (e) => {
                if (e.target === this.container) {
                    e.stopPropagation(); // Prevent closing underlying modal
                    this.close();
                }
            };
        }
    }

    open(product) {
        console.log('🎬 MediaOverlay: open() called. Product:', product?.asin);
        if (!product) return;

        // Ensure container is in the right place in the DOM
        const navContainer = document.querySelector('.modal-nav-container');
        if (navContainer && !navContainer.contains(this.container)) {
            navContainer.appendChild(this.container);
        }

        // Use reference_media (which already includes source_link from backend)
        this.mediaItems = Array.isArray(product.reference_media) ? product.reference_media : [];
        console.log('🎬 MediaOverlay: mediaItems count:', this.mediaItems.length);

        if (this.mediaItems.length === 0) {
            console.warn('MediaOverlay: No media found for product');
            return;
        }

        this.currentIndex = 0;
        this.render();
        this.container.classList.add('active');

        const wrapper = document.querySelector('.modal-layout-wrapper');
        if (wrapper) wrapper.classList.add('view-reels-mode');

        document.body.style.overflow = 'hidden';
    }

    close() {
        console.log('🎬 MediaOverlay: close() called');
        this.container.classList.remove('active');

        const wrapper = document.querySelector('.modal-layout-wrapper');
        if (wrapper) wrapper.classList.remove('view-reels-mode');

        document.body.style.overflow = '';

        const reelsBtn = document.querySelector('.reels-toggle.active');
        if (reelsBtn) reelsBtn.classList.remove('active');
    }

    render() {
        // We want to show the current item in the large slot, 
        // and the REMAINING items in the 4 small slots (tile-1 to tile-4).
        const currentMedia = this.mediaItems[this.currentIndex];
        const otherMedia = this.mediaItems.filter((_, idx) => idx !== this.currentIndex);

        this.container.innerHTML = `
            <div class="media-overlay-content">
                <div class="golden-spiral-grid">
                    <div class="spiral-tile tile-large" id="main-player-slot">
                        <!-- Live Player Injected Here -->
                    </div>
                    ${[0, 1, 2, 3].map(i => {
            const item = otherMedia[i];
            if (!item) return `<div class="spiral-tile tile-${i + 1} empty-slot"></div>`;

            // Need the real index in this.mediaItems
            const realIndex = this.mediaItems.indexOf(item);
            return `
                            <div class="spiral-tile tile-${i + 1}" data-index="${realIndex}" onclick="window.mediaOverlay.swapMedia(${realIndex})">
                                <img src="${this.getThumbnail(item)}" alt="Media ${realIndex + 1}">
                            </div>
                        `;
        }).join('')}
                </div>
            </div>
        `;

        this.swapMedia(0);
    }

    swapMedia(index) {
        this.currentIndex = index;
        const mainSlot = this.container.querySelector('#main-player-slot');
        if (!mainSlot) {
            console.error('🎬 MediaOverlay: main-player-slot NOT FOUND in container');
            return;
        }

        const url = this.mediaItems[index];
        const embedUrl = typeof window.getUniversalVideoEmbedUrl === 'function'
            ? window.getUniversalVideoEmbedUrl(url)
            : url;

        // Render Live Player
        if (url.match(/\.(mp4|webm|mov|avi)$/i)) {
            mainSlot.innerHTML = `
                <video controls playsinline autoplay muted>
                    <source src="${url}" type="video/mp4">
                </video>
            `;
        } else {
            mainSlot.innerHTML = `
                <iframe src="${embedUrl}" scrolling="no" allowfullscreen="true" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"></iframe>
            `;
        }

        // Add Zoom Overlay
        const hub = document.createElement('div');
        hub.className = 'live-player-hub';
        hub.innerHTML = `
            <button class="zoom-btn" onclick="event.stopPropagation(); window.mediaOverlay.openFullscreen()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
                </svg>
                Fullscreen Gallery
            </button>
        `;
        mainSlot.appendChild(hub);

        // Update active thumb
        this.container.querySelectorAll('.spiral-tile').forEach(tile => {
            tile.classList.remove('active-thumb');
            if (parseInt(tile.dataset.index) === index) {
                tile.classList.add('active-thumb');
            }
        });
    }

    openFullscreen() {
        if (typeof MediaLightbox !== 'undefined') {
            const lightbox = new MediaLightbox();
            lightbox.open(this.mediaItems, this.currentIndex);
        }
    }

    getThumbnail(url) {
        if (!url) return 'assets/images/placeholder-video.jpg';

        // YouTube
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            const id = url.match(/(?:v=|shorts\/|be\/|embed\/)([^&?]+)/)?.[1];
            return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : 'assets/images/placeholder-video.jpg';
        }

        // Instagram (Placeholder favicon or generic IG icon)
        if (url.includes('instagram.com')) {
            return 'https://www.instagram.com/static/images/ico/favicon-192.png/b405f6e8902d.png';
        }

        // Generic Video Thumbnail or Placeholder
        if (url.match(/\.(mp4|webm|mov|avi)$/i)) {
            return 'assets/images/placeholder-video.jpg'; // Ideally a generated frame, but using placeholder for now
        }

        return 'assets/images/placeholder-video.jpg';
    }
}

// Global Singleton
window.mediaOverlay = new MediaOverlay();
