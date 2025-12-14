// assets/js/reels-feed.js - Instagram-Style Reels Feed
console.log('🎬 Reels feed module loading...');

// ========================================
// SWIPE DETECTION CONSTANTS
// ========================================
const EDGE_ZONE = 60;
const CLAIM_DISTANCE = 35;
const MIN_SWIPE_DISTANCE = 50;
const SWIPE_RATIO_HORIZONTAL = 1.5;
const SWIPE_RATIO_VERTICAL = 0.67;

// Render the reels feed (called from modal)
function renderReelsFeed() {
    console.log('🎬 Rendering reels feed...');
    
    const feedContainer = document.getElementById('reels-feed-container');
    if (!feedContainer) {
        console.error('❌ Reels feed container not found');
        return;
    }

    // Clear loading state
    feedContainer.innerHTML = '';

    // Get products with reel URLs
    const reelsData = getReelsDataFromProducts();

    // Check if we have reels
    if (reelsData.length === 0) {
        feedContainer.innerHTML = `
            <div class="empty-state">
                <h3>No Reels Yet</h3>
                <p>Check back soon for curated Instagram reels!</p>
            </div>`;
        return;
    }

    console.log(`📊 Found ${reelsData.length} reels to display`);

    // Render each reel as a section
    reelsData.forEach(reel => {
        const reelSection = createReelSection(reel);
        feedContainer.appendChild(reelSection);
    });

    // Initialize swipe detection after DOM is ready
    requestAnimationFrame(() => {
        initializeSwipeDetection();
        console.log('✅ Reels feed rendered with swipe detection');
    });
}

// Create a reel section - MATCHES CSS STRUCTURE EXACTLY
function createReelSection(reel) {
    // Main section wrapper
    const section = document.createElement('section');
    section.className = 'reel-section';
    section.dataset.reelId = reel.id;
    
    // Content wrapper (flex container for video + products)
    const content = document.createElement('div');
    content.className = 'reel-content';
    
    // === VIDEO SIDE ===
    const videoContainer = document.createElement('div');
    videoContainer.className = 'reel-video';
    videoContainer.innerHTML = `
        <iframe 
            src="${reel.embedUrl}" 
            frameborder="0" 
            scrolling="no"
            allowtransparency="true"
            allowfullscreen="true">
        </iframe>
    `;
    
    // === PRODUCTS SIDE ===
    const productsContainer = document.createElement('div');
    productsContainer.className = 'reel-products';
    
    // Carousel wrapper
    const carousel = document.createElement('div');
    carousel.className = 'products-carousel';
    
    // Products grid
    const grid = document.createElement('div');
    grid.className = 'products-grid';
    
    // Add product cards
    reel.products.forEach(product => {
        const card = createProductCard(product); // From products.js
        grid.appendChild(card);
    });
    
    // Assemble structure
    carousel.appendChild(grid);
    productsContainer.appendChild(carousel);
    
    content.appendChild(videoContainer);
    content.appendChild(productsContainer);
    
    section.appendChild(content);
    
    return section;
}

// Get reels data from products (source_link field)
function getReelsDataFromProducts() {
    if (!window.VibeDrips || !window.VibeDrips.allProducts) {
        console.warn('⚠️ VibeDrips products not loaded yet');
        return [];
    }

    // Filter products with Instagram reel URLs in source_link
    const productsWithReels = window.VibeDrips.allProducts.filter(product => {
        const sourceLink = product.source_link || '';
        return sourceLink.includes('instagram.com/reel/') || 
               sourceLink.includes('instagram.com/p/') ||
               sourceLink.includes('instagr.am/');
    });

    if (productsWithReels.length === 0) {
        console.log('ℹ️ No products with Instagram reel URLs found');
        return [];
    }

    console.log(`📱 Found ${productsWithReels.length} products with Instagram reels`);

    // Group products by Instagram URL
    const reelGroups = {};
    productsWithReels.forEach(product => {
        const reelUrl = product.source_link;
        if (!reelGroups[reelUrl]) {
            reelGroups[reelUrl] = [];
        }
        reelGroups[reelUrl].push(product);
    });

    // Convert to array format with Instagram embed URLs
    return Object.entries(reelGroups).map(([url, products], index) => ({
        id: `reel-${index}`,
        originalUrl: url,
        embedUrl: convertToInstagramEmbed(url),
        products: products
    }));
}

// Convert Instagram URL to embed format
function convertToInstagramEmbed(url) {
    if (!url) return '';
    
    try {
        // Extract reel/post ID from URL
        const reelMatch = url.match(/\/reel\/([A-Za-z0-9_-]+)/);
        const postMatch = url.match(/\/p\/([A-Za-z0-9_-]+)/);
        
        let postId = null;
        if (reelMatch && reelMatch[1]) {
            postId = reelMatch[1];
        } else if (postMatch && postMatch[1]) {
            postId = postMatch[1];
        }
        
        if (postId) {
            return `https://www.instagram.com/p/${postId}/embed/`;
        } else {
            console.warn('⚠️ Could not extract Instagram post ID from:', url);
            return url;
        }
    } catch (error) {
        console.error('❌ Error converting Instagram URL:', error);
        return url;
    }
}

// ========================================
// SWIPE DETECTION
// ========================================

let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;
let swipeStartTime = 0;
let gestureClaimed = false;
let isEdgeGesture = false;

function initializeSwipeDetection() {
    const feedContainer = document.getElementById('reels-feed-container');
    if (!feedContainer) return;

    feedContainer.addEventListener('touchstart', handleTouchStart, { passive: false });
    feedContainer.addEventListener('touchmove', handleTouchMove, { passive: false });
    feedContainer.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    console.log('👆 Swipe detection initialized');
}

function handleTouchStart(e) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    swipeStartTime = Date.now();
    gestureClaimed = false;
    isEdgeGesture = touchStartX <= EDGE_ZONE;
}

function handleTouchMove(e) {
    if (gestureClaimed) {
        e.preventDefault();
        return;
    }

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = currentX - touchStartX;
    const deltaY = currentY - touchStartY;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // Claim gesture early if horizontal movement detected
    if (absDeltaX > CLAIM_DISTANCE && absDeltaX > absDeltaY * SWIPE_RATIO_HORIZONTAL) {
        gestureClaimed = true;
        e.preventDefault();
    }

    // Block browser back gesture for edge swipes
    if (isEdgeGesture && deltaX > 10) {
        e.preventDefault();
    }
}

function handleTouchEnd(e) {
    touchEndX = e.changedTouches[0].clientX;
    touchEndY = e.changedTouches[0].clientY;
    
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);
    const swipeDuration = Date.now() - swipeStartTime;

    // Check if it's a valid horizontal swipe
    if (absDeltaX > MIN_SWIPE_DISTANCE && 
        absDeltaX > absDeltaY * SWIPE_RATIO_HORIZONTAL &&
        swipeDuration < 500) {
        
        if (deltaX > 0) {
            navigateReels('prev');
        } else {
            navigateReels('next');
        }
    }

    // Reset
    gestureClaimed = false;
    isEdgeGesture = false;
}

// Navigate between reels
function navigateReels(direction) {
    const feedContainer = document.getElementById('reels-feed-container');
    if (!feedContainer) return;

    const sections = Array.from(feedContainer.querySelectorAll('.reel-section'));
    if (sections.length === 0) return;

    // Find current section
    let currentIndex = 0;
    
    for (let i = 0; i < sections.length; i++) {
        const rect = sections[i].getBoundingClientRect();
        if (rect.top >= -50 && rect.top <= 50) {
            currentIndex = i;
            break;
        }
    }

    // Calculate next index
    let nextIndex = currentIndex;
    if (direction === 'next' && currentIndex < sections.length - 1) {
        nextIndex = currentIndex + 1;
    } else if (direction === 'prev' && currentIndex > 0) {
        nextIndex = currentIndex - 1;
    }

    // Scroll to next section
    if (nextIndex !== currentIndex) {
        sections[nextIndex].scrollIntoView({ behavior: 'smooth', block: 'start' });
        console.log(`🎬 Navigated to reel ${nextIndex + 1}/${sections.length}`);
    }
}

// Export functions
window.renderReelsFeed = renderReelsFeed;

console.log('✅ Reels feed module loaded');
