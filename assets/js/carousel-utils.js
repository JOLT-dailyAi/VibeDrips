/**
 * Carousel Utilities
 * Reusable functions for image carousel navigation
 * Version: 1.0.0
 */

const CarouselUtils = {
    /**
     * Navigate to next/prev image with wrapping
     * @param {number} currentIndex - Current image index
     * @param {number} totalImages - Total number of images
     * @param {string} direction - 'next' or 'prev'
     * @returns {number} New index
     */
    navigate(currentIndex, totalImages, direction) {
        if (direction === 'next') {
            return (currentIndex + 1) % totalImages;
        } else if (direction === 'prev') {
            return (currentIndex - 1 + totalImages) % totalImages;
        }
        return currentIndex;
    },

    /**
     * Update image element with fade transition
     * @param {HTMLImageElement} imgElement - Image element to update
     * @param {string} imageUrl - New image URL
     * @param {boolean} withTransition - Apply fade transition
     */
    updateImage(imgElement, imageUrl, withTransition = true) {
        if (!imgElement) return;

        if (withTransition) {
            imgElement.classList.add('changing');
            setTimeout(() => {
                imgElement.src = imageUrl;
                imgElement.classList.remove('changing');
            }, 150);
        } else {
            imgElement.src = imageUrl;
        }
    },

    /**
     * Update counter display
     * @param {HTMLElement} counterElement - Counter element
     * @param {number} currentIndex - Current index (0-based)
     * @param {number} totalImages - Total number of images
     */
    updateCounter(counterElement, currentIndex, totalImages) {
        if (counterElement) {
            counterElement.textContent = `${currentIndex + 1} / ${totalImages}`;
        }
    },

    /**
     * Update thumbnail active states
     * @param {HTMLElement} container - Thumbnails container or modal
     * @param {number} activeIndex - Index of active thumbnail
     */
    updateThumbnails(container, activeIndex) {
        if (!container) return;

        // Find all thumbnail containers within THIS specific modal/product context
        const thumbnails = container.querySelectorAll('.thumbnail');
        thumbnails.forEach((thumb, index) => {
            const isActive = index === activeIndex;
            thumb.classList.toggle('active', isActive);
        });
    },

    /**
     * Enable and update dot indicators
     * @param {HTMLElement} container - Dots container element
     * @param {number} totalItems - Total number of items
     * @param {number} activeIndex - Index of active item
     */
    enableDots(container, totalItems, activeIndex) {
        if (!container) return;

        // Hide entirely if only 1 item (matches Lightbox behavior)
        if (totalItems <= 1) {
            container.style.display = 'none';
            return;
        }

        container.style.display = 'flex';

        // Generate dots if container is empty or item count changed
        if (container.children.length !== totalItems) {
            container.innerHTML = '';
            for (let i = 0; i < totalItems; i++) {
                const dot = document.createElement('span');
                dot.className = i === activeIndex ? 'dot active' : 'dot';
                dot.setAttribute('data-index', i);
                container.appendChild(dot);
            }
        } else {
            // Update existing dots
            const dots = container.querySelectorAll('.dot');
            dots.forEach((dot, index) => {
                dot.classList.toggle('active', index === activeIndex);
            });
        }
    },

    /**
     * Create a carousel controller for a product
     * @param {string} productId - Product ID
     * @param {Array<string>} images - Array of image URLs
     * @returns {Object} Carousel controller with navigation methods
     */
    createCarousel(productId, images) {
        let currentIndex = 0;

        const controller = {
            /**
             * Get current image index
             * @returns {number}
             */
            getCurrentIndex() {
                return currentIndex;
            },

            /**
             * Select specific image by index
             * @param {number} index - Image index to select
             */
            selectImage(index) {
                currentIndex = index;
                this.updateAll();
            },

            /**
             * Navigate to previous image
             */
            prev() {
                currentIndex = CarouselUtils.navigate(currentIndex, images.length, 'prev');
                this.updateAll();
            },

            /**
             * Navigate to next image
             */
            next() {
                currentIndex = CarouselUtils.navigate(currentIndex, images.length, 'next');
                this.updateAll();
            },

            /**
             * Preview image on hover (desktop only)
             * @param {number} index - Image index to preview
             */
            previewImage(index) {
                // Find main image with ID (guaranteed scoped)
                const mainImg = document.getElementById(`main-image-${productId}`);
                CarouselUtils.updateImage(mainImg, images[index]);

                const mobileImg = document.getElementById(`main-image-mobile-${productId}`);
                CarouselUtils.updateImage(mobileImg, images[index]);

                // Signal CSS to shift focus: Target ALL thumbnail containers ONLY in this modal
                const modal = mainImg?.closest('.dynamic-modal');
                const containers = modal?.querySelectorAll('.gallery-thumbnails, .mobile-thumbnails');
                containers?.forEach(c => c.classList.add('is-previewing'));
            },

            /**
             * Update all carousel elements (images, counters, thumbnails)
             */
            updateAll() {
                // Update desktop main image
                const mainImg = document.getElementById(`main-image-${productId}`);
                CarouselUtils.updateImage(mainImg, images[currentIndex]);

                // Update mobile main image
                const mobileImg = document.getElementById(`main-image-mobile-${productId}`);
                CarouselUtils.updateImage(mobileImg, images[currentIndex]);

                // Update desktop counter
                const counter = document.getElementById(`counter-${productId}`);
                CarouselUtils.updateCounter(counter, currentIndex, images.length);

                // Update mobile counter
                const mobileCounter = document.getElementById(`counter-mobile-${productId}`);
                CarouselUtils.updateCounter(mobileCounter, currentIndex, images.length);

                // Update thumbnails (find in OWN modal only)
                // (Reusing mainImg declared on line 173)
                const modal = mainImg?.closest('.dynamic-modal');

                // Clear preview state from containers in THIS modal
                const containers = modal?.querySelectorAll('.gallery-thumbnails, .mobile-thumbnails');
                containers?.forEach(c => c.classList.remove('is-previewing'));

                CarouselUtils.updateThumbnails(modal, currentIndex);
            }
        };

        return controller;
    },

    /**
     * Add horizontal swipe/drag detection to an element
     * @param {HTMLElement} element - Element to watch
     * @param {Object} callbacks - { onNext: fn, onPrev: fn }
     * @param {number} threshold - Minimum pixels to trigger swipe (default 50)
     */
    addSwipeHandle(element, callbacks, threshold = 50) {
        if (!element) return;

        let startX = 0;
        let startY = 0;
        let isDown = false;

        const handleStart = (e) => {
            isDown = true;
            const touch = e.type.startsWith('touch') ? e.touches[0] : e;
            startX = touch.clientX;
            startY = touch.clientY;
        };

        const handleMove = (e) => {
            if (!isDown) return;
            // Native scroll is preserved because we use { passive: true } or no preventDefault
        };

        const handleEnd = (e) => {
            if (!isDown) return;
            isDown = false;

            const touch = e.type.startsWith('touch') ? e.changedTouches[0] : e;
            const endX = touch.clientX;
            const endY = touch.clientY;

            const deltaX = endX - startX;
            const deltaY = endY - startY;

            // Intent detection: ignore if it was primarily a vertical movement
            if (Math.abs(deltaY) > Math.abs(deltaX)) return;

            if (Math.abs(deltaX) > threshold) {
                if (deltaX < 0 && callbacks.onNext) {
                    callbacks.onNext();
                } else if (deltaX > 0 && callbacks.onPrev) {
                    callbacks.onPrev();
                }
            }
        };

        element.addEventListener('touchstart', handleStart, { passive: true });
        element.addEventListener('touchend', handleEnd, { passive: true });
        element.addEventListener('touchcancel', () => isDown = false, { passive: true });

        // Mouse support for desktop drag
        element.addEventListener('mousedown', handleStart);
        element.addEventListener('mouseup', handleEnd);
    }
};

// Export for browser use
if (typeof window !== 'undefined') {
    window.CarouselUtils = CarouselUtils;
}

// Export for Node.js (if needed for testing)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CarouselUtils;
}
