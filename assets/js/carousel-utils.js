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

        const thumbnails = container.querySelectorAll('.thumbnail');
        thumbnails.forEach((thumb, index) => {
            thumb.classList.toggle('active', index === activeIndex);
        });
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
                if (window.innerWidth > 768) {
                    // Update images without updating counter
                    const mainImg = document.getElementById(`main-image-${productId}`);
                    CarouselUtils.updateImage(mainImg, images[index]);

                    const mobileImg = document.getElementById(`main-image-mobile-${productId}`);
                    CarouselUtils.updateImage(mobileImg, images[index]);
                }
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

                // Update thumbnails (find in modal)
                const modal = document.querySelector('.dynamic-modal');
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
        let isDown = false;

        const handleStart = (e) => {
            isDown = true;
            startX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX;
        };

        const handleMove = (e) => {
            if (!isDown) return;
            // Optional: can add pull-preview logic here in future
        };

        const handleEnd = (e) => {
            if (!isDown) return;
            isDown = false;

            const endX = e.type.startsWith('touch') ? e.changedTouches[0].clientX : e.clientX;
            const deltaX = endX - startX;

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
