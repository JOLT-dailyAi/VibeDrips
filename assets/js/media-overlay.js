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
                if (e.target === this.container) this.close();
            };
        }
    }

    open(product) {
        console.log('🎬 MediaOverlay: open() called with product:', product?.asin || 'unknown');
        if (!product) return;

        // Ensure container is in the right place in the DOM
        const navContainer = document.querySelector('.modal-nav-container');
        console.log('🎬 MediaOverlay: modal-nav-container found:', !!navContainer);
        if (navContainer && !navContainer.contains(this.container)) {
            navContainer.appendChild(this.container);
            console.log('🎬 MediaOverlay: container appended to DOM');
        }

        // Prepare media items: source_link + reference_media
        this.mediaItems = [];
        if (product.source_link) this.mediaItems.push(product.source_link);
        if (product.reference_media && Array.isArray(product.reference_media)) {
            // Avoid duplicates
            product.reference_media.forEach(link => {
                if (link !== product.source_link) this.mediaItems.push(link);
            });
        }

        if (this.mediaItems.length === 0) {
            console.warn('MediaOverlay: No media to display');
            return;
        }

        this.currentIndex = 0;
        this.render();
        this.container.classList.add('active');

        // Add global state class to parent wrapper for button transformation
        const wrapper = document.querySelector('.modal-layout-wrapper');
        if (wrapper) wrapper.classList.add('view-reels-mode');

        document.body.style.overflow = 'hidden';
    }

    close() {
        this.container.classList.remove('active');

        const wrapper = document.querySelector('.modal-layout-wrapper');
        if (wrapper) wrapper.classList.remove('view-reels-mode');

        document.body.style.overflow = '';

        // Sync the reels-toggle button if it exists
        const reelsBtn = document.querySelector('.reels-toggle.active');
        if (reelsBtn) reelsBtn.classList.remove('active');
    }

    render() {
        const media = this.mediaItems;
        this.container.innerHTML = `
            <div class="media-overlay-content">
                <div class="golden-spiral-grid">
                    <div class="spiral-tile tile-large" id="main-player-slot">
                        <!-- Live Player Injected Here -->
                    </div>
                    ${media.slice(0, 5).map((item, idx) => `
                        <div class="spiral-tile tile-${idx + 1}" data-index="${idx}" onclick="window.mediaOverlay.swapMedia(${idx})">
                            <img src="${this.getThumbnail(item)}" alt="Media ${idx + 1}">
                        </div>
                    `).join('')}
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
        // Simple thumbnail extractor or placeholder
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            const id = url.match(/(?:v=|shorts\/|be\/)([^&?]+)/)?.[1];
            return `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
        }
        if (url.includes('instagram.com')) {
            return 'https://www.instagram.com/static/images/ico/favicon-192.png/b405f6e8902d.png'; // Placeholder for IG
        }
        return 'assets/images/placeholder-video.jpg'; // Needs to be an actual asset or dynamic preview
    }
}

// Global Singleton
window.mediaOverlay = new MediaOverlay();
