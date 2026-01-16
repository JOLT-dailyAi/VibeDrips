/**
 * Product Modal Carousel
 * Version: 1.0.0
 * 
 * Stacked card carousel for product modal navigation
 * Features:
 * - Lazy loading (renders only 3 modals at a time)
 * - Unified swipe navigation (touch/mouse/scroll/keyboard)
 * - Red edge glow indicators for boundaries
 * - Theme-aware (uses glass CSS variables)
 * - Responsive (desktop stacked, mobile single)
 */

// Global state
let modalCarouselState = {
    products: [],           // Full product list
    currentIndex: -1,       // Current product index
    wrapper: null,          // Wrapper element
    renderedModals: new Map(), // Cache: index → modal element
    keyHandler: null,       // Keyboard event handler reference
    isNavigating: false     // Prevent rapid navigation
};

/**
 * Open product modal carousel
 * @param {number} productIndex - Index of product to open
 */
function openProductModalCarousel(productIndex) {
    // Get current displayed products
    const products = window.currentDisplayedProducts || [];

    if (!products || products.length === 0) {
        console.warn('ProductModalCarousel: No products available');
        return;
    }

    if (productIndex < 0 || productIndex >= products.length) {
        console.warn('ProductModalCarousel: Invalid product index');
        return;
    }

    // Initialize state
    modalCarouselState.products = products;
    modalCarouselState.currentIndex = productIndex;
    modalCarouselState.renderedModals.clear();

    // Create wrapper
    createWrapper();

    // Render initial stack
    renderModalStack();

    // Update edge glow
    updateEdgeGlow();

    // Attach navigation events
    attachNavigationEvents();

    // Add counter if multiple products
    if (products.length > 1) {
        addProductCounter();
    }
}

/**
 * Create wrapper container
 */
function createWrapper() {
    const wrapper = document.createElement('div');
    wrapper.className = 'modal-carousel-wrapper';
    wrapper.id = 'modal-carousel-wrapper';
    wrapper.setAttribute('role', 'dialog');
    wrapper.setAttribute('aria-modal', 'true');
    wrapper.setAttribute('aria-label', 'Product carousel');

    document.body.appendChild(wrapper);
    modalCarouselState.wrapper = wrapper;
}

/**
 * Render modal stack (prev, current, next)
 * Lazy loading - only renders 3 modals at a time
 */
function renderModalStack() {
    const { currentIndex, products, wrapper } = modalCarouselState;

    if (!wrapper) return;

    // Indices to render
    const indices = [
        currentIndex - 1,  // Prev
        currentIndex,      // Current
        currentIndex + 1   // Next
    ];

    // Remove modals not in current view
    cleanupUnusedModals(indices);

    // Render needed modals
    indices.forEach((index, position) => {
        if (index >= 0 && index < products.length) {
            renderModal(index, position);
        }
    });
}

/**
 * Render a single modal
 * @param {number} index - Product index
 * @param {number} position - Position (0=prev, 1=current, 2=next)
 */
function renderModal(index, position) {
    const { products, wrapper, renderedModals } = modalCarouselState;

    // Check if already rendered
    if (renderedModals.has(index)) {
        const modal = renderedModals.get(index);
        positionModal(modal, position);
        wrapper.appendChild(modal);
        return;
    }

    // Render new modal using existing function
    const product = products[index];

    // Call existing showProductModal function
    if (typeof window.showProductModal === 'function') {
        window.showProductModal(product.id);

        // Get the newly created modal
        const modals = document.querySelectorAll('.dynamic-modal');
        const modal = modals[modals.length - 1];

        if (modal) {
            // Move to carousel wrapper
            wrapper.appendChild(modal);
            renderedModals.set(index, modal);
            positionModal(modal, position);
        }
    } else {
        console.error('ProductModalCarousel: showProductModal function not found');
    }
}

/**
 * Position modal based on its role
 * @param {HTMLElement} modal - Modal element
 * @param {number} position - Position (0=prev, 1=current, 2=next)
 */
function positionModal(modal, position) {
    const classes = ['modal-prev', 'modal-current', 'modal-next'];

    // Remove all position classes
    modal.classList.remove('modal-prev', 'modal-current', 'modal-next');

    // Add appropriate class
    if (position >= 0 && position < classes.length) {
        modal.classList.add(classes[position]);
    }
}

/**
 * Cleanup modals not in active view
 * @param {Array<number>} activeIndices - Indices to keep
 */
function cleanupUnusedModals(activeIndices) {
    const { renderedModals } = modalCarouselState;

    renderedModals.forEach((modal, index) => {
        if (!activeIndices.includes(index)) {
            modal.remove();
            renderedModals.delete(index);
        }
    });
}

/**
 * Navigate to adjacent product
 * @param {number} direction - Direction (-1 = prev, 1 = next)
 */
function navigateModalCarousel(direction) {
    const { products, currentIndex, isNavigating } = modalCarouselState;

    // Prevent rapid navigation
    if (isNavigating) return;

    const newIndex = currentIndex + direction;

    // Check bounds
    if (newIndex < 0 || newIndex >= products.length) {
        // Flash red glow to indicate boundary
        flashBoundaryGlow(direction);
        return;
    }

    // Set navigating flag
    modalCarouselState.isNavigating = true;

    // Update index
    modalCarouselState.currentIndex = newIndex;

    // Re-render stack
    renderModalStack();

    // Update edge glow
    updateEdgeGlow();

    // Update counter
    updateProductCounter();

    // Reset navigating flag after transition
    setTimeout(() => {
        modalCarouselState.isNavigating = false;
    }, 400);
}

/**
 * Update red edge glow indicators
 */
function updateEdgeGlow() {
    const { currentIndex, products, wrapper } = modalCarouselState;

    if (!wrapper) return;

    // Remove existing classes
    wrapper.classList.remove('at-first', 'at-last');

    // Add appropriate class
    if (currentIndex === 0) {
        wrapper.classList.add('at-first');
    }

    if (currentIndex === products.length - 1) {
        wrapper.classList.add('at-last');
    }
}

/**
 * Flash boundary glow when trying to navigate beyond bounds
 * @param {number} direction - Direction (-1 = left, 1 = right)
 */
function flashBoundaryGlow(direction) {
    const { wrapper } = modalCarouselState;

    if (!wrapper) return;

    const className = direction < 0 ? 'flash-left' : 'flash-right';

    wrapper.classList.add(className);
    setTimeout(() => wrapper.classList.remove(className), 300);
}

/**
 * Add product counter display
 */
function addProductCounter() {
    const { currentIndex, products, wrapper } = modalCarouselState;

    if (!wrapper) return;

    const counter = document.createElement('div');
    counter.className = 'modal-carousel-counter';
    counter.id = 'modal-carousel-counter';
    counter.textContent = `${currentIndex + 1} / ${products.length}`;
    counter.setAttribute('aria-live', 'polite');
    counter.setAttribute('aria-atomic', 'true');

    wrapper.appendChild(counter);
}

/**
 * Update product counter
 */
function updateProductCounter() {
    const { currentIndex, products } = modalCarouselState;
    const counter = document.getElementById('modal-carousel-counter');

    if (counter) {
        counter.textContent = `${currentIndex + 1} / ${products.length}`;
    }
}

/**
 * Attach all navigation event handlers
 */
function attachNavigationEvents() {
    const { wrapper } = modalCarouselState;

    if (!wrapper) return;

    // Touch swipe
    attachTouchSwipe(wrapper);

    // Mouse drag
    attachMouseDrag(wrapper);

    // Scroll wheel
    attachScrollWheel(wrapper);

    // Keyboard
    attachKeyboard();

    // Close on background click
    wrapper.addEventListener('click', (e) => {
        if (e.target === wrapper) {
            closeModalCarousel();
        }
    });
}

/**
 * Attach touch swipe navigation
 * @param {HTMLElement} wrapper - Wrapper element
 */
function attachTouchSwipe(wrapper) {
    let startX = 0;
    let startY = 0;
    let isDragging = false;

    wrapper.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        isDragging = true;
    }, { passive: true });

    wrapper.addEventListener('touchmove', (e) => {
        if (!isDragging) return;

        const currentX = e.touches[0].clientX;
        const currentY = e.touches[0].clientY;
        const diffX = currentX - startX;
        const diffY = currentY - startY;

        // Only if horizontal swipe is dominant
        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 10) {
            e.preventDefault();

            // Visual feedback
            const currentModal = wrapper.querySelector('.modal-current');
            if (currentModal) {
                currentModal.style.transform = `translate(-50%, -50%) translateX(${diffX * 0.3}px)`;
            }
        }
    }, { passive: false });

    wrapper.addEventListener('touchend', (e) => {
        if (!isDragging) return;
        isDragging = false;

        const endX = e.changedTouches[0].clientX;
        const diffX = startX - endX;

        // Reset visual feedback
        const currentModal = wrapper.querySelector('.modal-current');
        if (currentModal) {
            currentModal.style.transform = '';
        }

        // Navigate if swipe > 50px
        if (Math.abs(diffX) > 50) {
            navigateModalCarousel(diffX > 0 ? 1 : -1);
        }
    }, { passive: true });
}

/**
 * Attach mouse drag navigation
 * @param {HTMLElement} wrapper - Wrapper element
 */
function attachMouseDrag(wrapper) {
    let mouseDown = false;
    let mouseStartX = 0;

    wrapper.addEventListener('mousedown', (e) => {
        // Only on wrapper background, not modal content
        if (e.target === wrapper) {
            mouseDown = true;
            mouseStartX = e.clientX;
            wrapper.classList.add('dragging');
        }
    });

    wrapper.addEventListener('mousemove', (e) => {
        if (!mouseDown) return;

        const diffX = e.clientX - mouseStartX;

        // Visual feedback
        const currentModal = wrapper.querySelector('.modal-current');
        if (currentModal) {
            currentModal.style.transform = `translate(-50%, -50%) translateX(${diffX * 0.3}px)`;
        }
    });

    wrapper.addEventListener('mouseup', (e) => {
        if (!mouseDown) return;
        mouseDown = false;
        wrapper.classList.remove('dragging');

        const endX = e.clientX;
        const diffX = mouseStartX - endX;

        // Reset visual feedback
        const currentModal = wrapper.querySelector('.modal-current');
        if (currentModal) {
            currentModal.style.transform = '';
        }

        // Navigate if drag > 100px
        if (Math.abs(diffX) > 100) {
            navigateModalCarousel(diffX > 0 ? 1 : -1);
        }
    });

    // Handle mouse leave
    wrapper.addEventListener('mouseleave', () => {
        if (mouseDown) {
            mouseDown = false;
            wrapper.classList.remove('dragging');

            const currentModal = wrapper.querySelector('.modal-current');
            if (currentModal) {
                currentModal.style.transform = '';
            }
        }
    });
}

/**
 * Attach scroll wheel navigation
 * @param {HTMLElement} wrapper - Wrapper element
 */
function attachScrollWheel(wrapper) {
    let scrollTimeout;

    wrapper.addEventListener('wheel', (e) => {
        e.preventDefault();

        // Debounce scroll events
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            const delta = e.deltaX || e.deltaY;

            if (Math.abs(delta) > 10) {
                navigateModalCarousel(delta > 0 ? 1 : -1);
            }
        }, 50);
    }, { passive: false });
}

/**
 * Attach keyboard navigation
 */
function attachKeyboard() {
    const keyHandler = (e) => {
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            navigateModalCarousel(-1);
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            navigateModalCarousel(1);
        } else if (e.key === 'Escape') {
            e.preventDefault();
            closeModalCarousel();
        }
    };

    document.addEventListener('keydown', keyHandler);
    modalCarouselState.keyHandler = keyHandler;
}

/**
 * Close modal carousel
 */
function closeModalCarousel() {
    const { wrapper, keyHandler } = modalCarouselState;

    // Remove keyboard listener
    if (keyHandler) {
        document.removeEventListener('keydown', keyHandler);
    }

    // Remove wrapper (and all modals inside)
    if (wrapper) {
        wrapper.remove();
    }

    // Reset state
    modalCarouselState = {
        products: [],
        currentIndex: -1,
        wrapper: null,
        renderedModals: new Map(),
        keyHandler: null,
        isNavigating: false
    };
}

// Export to global scope
window.openProductModalCarousel = openProductModalCarousel;
window.closeModalCarousel = closeModalCarousel;
window.navigateModalCarousel = navigateModalCarousel;

console.log('✅ Product Modal Carousel loaded successfully');
