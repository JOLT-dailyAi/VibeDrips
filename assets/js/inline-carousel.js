/**
 * InlineCarousel - Reusable carousel component
 * Version: 1.0.0
 * 
 * A flexible, drop-in carousel component that can be used anywhere:
 * - Product modals
 * - Other modals
 * - Pages
 * - Overlays
 * 
 * Built on top of CarouselUtils for logic reuse.
 */

class InlineCarousel {
    /**
     * Create a new inline carousel
     * @param {HTMLElement} container - Container element to render carousel in
     * @param {Array<string>} images - Array of image URLs
     * @param {Object} options - Configuration options
     */
    constructor(container, images, options = {}) {
        if (!container) {
            throw new Error('InlineCarousel: container element is required');
        }

        if (!images || images.length === 0) {
            throw new Error('InlineCarousel: images array is required and must not be empty');
        }

        this.container = container;
        this.images = images;
        this.options = {
            // Display options
            showThumbnails: true,
            showCounter: true,
            showArrows: true,

            // Behavior options
            enableHoverPreview: true,
            enableFullscreen: true,
            enableKeyboard: false,

            // Style options
            thumbnailSize: 'medium',  // 'small' | 'medium' | 'large'
            arrowPosition: 'overlay',  // 'overlay' | 'bottom' (future)
            aspectRatio: '1/1',  // CSS aspect-ratio value

            // Callbacks
            onImageChange: null,  // (index) => {}
            onFullscreen: null,   // (index) => {}

            ...options
        };

        this.carousel = null;
        this.id = null;
        this.init();
    }

    /**
     * Initialize the carousel
     */
    init() {
        this.render();
        this.setupCarousel();
        this.attachEvents();
    }

    /**
     * Render the carousel HTML
     */
    render() {
        // Generate unique ID
        this.id = `carousel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const html = `
            <div class="inline-carousel" id="${this.id}" data-carousel>
                <div class="carousel-main" style="aspect-ratio: ${this.options.aspectRatio}">
                    <img src="${this.images[0]}" 
                         class="carousel-image" 
                         id="${this.id}-image"
                         alt="Image 1"
                         ${this.options.enableFullscreen ? 'style="cursor: zoom-in"' : ''}>
                    
                    ${this.options.showArrows ? `
                        <button class="arrow-button lightbox-arrow lightbox-prev carousel-prev" 
                                aria-label="Previous image"
                                type="button">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="15 18 9 12 15 6"></polyline>
                            </svg>
                        </button>
                        <button class="arrow-button lightbox-arrow lightbox-next carousel-next" 
                                aria-label="Next image"
                                type="button">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="9 18 15 12 9 6"></polyline>
                            </svg>
                        </button>
                    ` : ''}
                    
                    ${this.options.showCounter ? `
                        <div class="carousel-counter" id="${this.id}-counter">1 / ${this.images.length}</div>
                    ` : ''}
                    
                    ${this.options.enableFullscreen ? `
                        <div class="zoom-hint">🔍 Double-click to view full screen</div>
                    ` : ''}
                </div>
                
                ${this.options.showThumbnails ? `
                    <div class="carousel-thumbnails ${this.options.thumbnailSize}">
                        ${this.images.map((img, idx) => `
                            <div class="thumbnail ${idx === 0 ? 'active' : ''}" 
                                 data-index="${idx}"
                                 role="button"
                                 tabindex="0"
                                 aria-label="View image ${idx + 1}">
                                <img src="${img}" alt="Thumbnail ${idx + 1}">
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;

        this.container.innerHTML = html;
    }

    /**
     * Setup carousel using CarouselUtils
     */
    setupCarousel() {
        // Use CarouselUtils for logic
        this.carousel = CarouselUtils.createCarousel(this.id, this.images);

        // Override updateAll to include callbacks
        const originalUpdateAll = this.carousel.updateAll.bind(this.carousel);
        this.carousel.updateAll = () => {
            originalUpdateAll();

            // Trigger callback
            if (this.options.onImageChange) {
                this.options.onImageChange(this.carousel.getCurrentIndex());
            }
        };
    }

    /**
     * Attach event listeners
     */
    attachEvents() {
        const element = document.getElementById(this.id);
        if (!element) return;

        // Arrow buttons
        if (this.options.showArrows) {
            const prevBtn = element.querySelector('.carousel-prev');
            const nextBtn = element.querySelector('.carousel-next');

            prevBtn?.addEventListener('click', () => this.prev());
            nextBtn?.addEventListener('click', () => this.next());
        }

        // Thumbnails
        if (this.options.showThumbnails) {
            element.querySelectorAll('.thumbnail').forEach((thumb, index) => {
                // Click
                thumb.addEventListener('click', () => this.selectImage(index));

                // Keyboard
                thumb.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        this.selectImage(index);
                    }
                });

                // Hover preview (desktop only)
                if (this.options.enableHoverPreview) {
                    thumb.addEventListener('mouseenter', () => {
                        this.carousel.previewImage(index);
                    });

                    thumb.addEventListener('mouseleave', () => {
                        // Restore current image
                        this.carousel.updateAll();
                    });
                }
            });
        }

        // Fullscreen on double-click
        if (this.options.enableFullscreen) {
            const img = element.querySelector('.carousel-image');
            img?.addEventListener('dblclick', () => this.openFullscreen());
        }

        // Keyboard navigation
        if (this.options.enableKeyboard) {
            document.addEventListener('keydown', this.handleKeyboard.bind(this));
        }
    }

    /**
     * Handle keyboard navigation
     */
    handleKeyboard(e) {
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            this.prev();
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            this.next();
        }
    }

    /**
     * Navigate to previous image
     */
    prev() {
        this.carousel.prev();
    }

    /**
     * Navigate to next image
     */
    next() {
        this.carousel.next();
    }

    /**
     * Select specific image
     * @param {number} index - Image index
     */
    selectImage(index) {
        this.carousel.selectImage(index);
    }

    /**
     * Get current image index
     * @returns {number}
     */
    getCurrentIndex() {
        return this.carousel.getCurrentIndex();
    }

    /**
     * Open fullscreen lightbox
     */
    openFullscreen() {
        if (typeof MediaLightbox === 'undefined') {
            console.warn('InlineCarousel: MediaLightbox not found, fullscreen disabled');
            return;
        }

        const lightbox = new MediaLightbox();
        lightbox.open(this.images, this.carousel.getCurrentIndex());

        // Trigger callback
        if (this.options.onFullscreen) {
            this.options.onFullscreen(this.carousel.getCurrentIndex());
        }
    }

    /**
     * Update carousel images
     * @param {Array<string>} newImages - New array of image URLs
     */
    updateImages(newImages) {
        if (!newImages || newImages.length === 0) {
            console.warn('InlineCarousel: updateImages requires non-empty array');
            return;
        }

        this.images = newImages;
        this.render();
        this.setupCarousel();
        this.attachEvents();
    }

    /**
     * Destroy the carousel and clean up
     */
    destroy() {
        // Remove keyboard listener if enabled
        if (this.options.enableKeyboard) {
            document.removeEventListener('keydown', this.handleKeyboard);
        }

        // Clear container
        this.container.innerHTML = '';

        // Clear references
        this.carousel = null;
        this.id = null;
    }
}

// Export for browser use
if (typeof window !== 'undefined') {
    window.InlineCarousel = InlineCarousel;
}

// Export for Node.js (if needed for testing)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = InlineCarousel;
}
