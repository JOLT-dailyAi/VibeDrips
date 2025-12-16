// assets/js/reels-feed.js - Instagram-Style Reels Feed with Grid Layouts

console.log('🎬 Reels feed module loading...');

// ========================================
// SWIPE DETECTION CONSTANTS
// ========================================
const EDGE_ZONE = 60;              // px from left edge (browser back zone)
const CLAIM_DISTANCE = 35;         // px to claim gesture early
const MIN_SWIPE_DISTANCE = 50;     // px minimum for navigation
const SWIPE_RATIO_HORIZONTAL = 1.5; // Horizontal intent threshold
const SWIPE_RATIO_VERTICAL = 0.67;  // Vertical intent threshold

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
        <h3>🎬 No Reels Yet</h3>
        <p>Check back soon for curated Instagram reels!</p>
      </div>
    `;
    return;
  }
  
  // Create each reel section
  reelsData.forEach((reel, index) => {
    const reelSection = createReelSection(reel, index);
    if (reelSection) {
      feedContainer.appendChild(reelSection);
    }
  });
  
  console.log(`✅ Rendered ${reelsData.length} reel sections`);
}

// Get reels data from products CSV
function getReelsDataFromProducts() {
  if (!window.VibeDrips || !window.VibeDrips.allProducts) {
    console.warn('⚠️ VibeDrips.allProducts not available');
    return [];
  }
  
  // Filter products with "Product Source Link"
  const productsWithReels = window.VibeDrips.allProducts.filter(p => {
    const sourceLink = p['Product Source Link'] || p.productSourceLink || p.source_link;
    return sourceLink && sourceLink.trim() !== '';
  });
  
  // Group products by reel URL
  const reelsMap = {};
  
  productsWithReels.forEach(product => {
    let reelUrl = product['Product Source Link'] || product.productSourceLink || product.source_link;
    
    // Handle multiple URLs (take first one)
    if (reelUrl.includes(',')) {
      reelUrl = reelUrl.split(',')[0].trim();
    }
    
    // Validate URL (accept any video platform)
    const isValidVideo = reelUrl.includes('instagram.com') || 
                        reelUrl.includes('tiktok.com') || 
                        reelUrl.includes('youtube.com') || 
                        reelUrl.includes('youtu.be') ||
                        reelUrl.includes('twitter.com') ||
                        reelUrl.includes('x.com') ||
                        reelUrl.match(/\.(mp4|webm|mov|avi)$/);
    
    if (!isValidVideo) {
      console.warn('⚠️ Unsupported video URL:', reelUrl);
      return;
    }
    
    // Group by URL
    if (!reelsMap[reelUrl]) {
      reelsMap[reelUrl] = {
        url: reelUrl,
        products: []
      };
    }
    
    reelsMap[reelUrl].products.push(product);
  });
  
  // Convert to array
  return Object.values(reelsMap);
}

// Extract video platform and create embed URL (Universal Support)
function getUniversalVideoEmbedUrl(sourceUrl) {
  try {
    const url = sourceUrl.toLowerCase();
    
    // Instagram Reels/Posts
    if (url.includes('instagram.com')) {
      const match = sourceUrl.match(/\/(p|reel)\/([^\/\?]+)/);
      if (match && match[2]) {
        return `https://www.instagram.com/p/${match[2]}/embed`;
      }
    }
    
    // TikTok Videos
    if (url.includes('tiktok.com')) {
      const match = sourceUrl.match(/\/video\/(\d+)/);
      if (match && match[1]) {
        return `https://www.tiktok.com/embed/v2/${match[1]}`;
      }
    }
    
    // YouTube Videos/Shorts
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      let videoId = null;
      if (url.includes('youtu.be/')) {
        videoId = sourceUrl.match(/youtu\.be\/([^?]+)/)?.[1];
      } else if (url.includes('youtube.com/watch')) {
        videoId = new URL(sourceUrl).searchParams.get('v');
      } else if (url.includes('youtube.com/shorts/')) {
        videoId = sourceUrl.match(/shorts\/([^?]+)/)?.[1];
      }
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }
    
    // Twitter/X Videos
    if (url.includes('twitter.com') || url.includes('x.com')) {
      return sourceUrl; // Twitter embeds require different handling
    }
    
    // Direct video files (.mp4, .webm, etc.)
    if (url.match(/\.(mp4|webm|mov|avi|mkv|m4v|ogv)$/)) {
      return sourceUrl; // Return as-is for HTML5 video
    }
    
  } catch (error) {
    console.error('Error parsing video URL:', error);
  }
  return null;
}

// Create a single reel section
function createReelSection(reelData, index) {
  const embedUrl = getUniversalVideoEmbedUrl(reelData.url);
  
  if (!embedUrl) {
    console.error('❌ Invalid Instagram URL:', reelData.url);
    return null;
  }
  
  const section = document.createElement('div');
  section.className = 'reel-section';
  section.setAttribute('data-reel-index', index);
  
  // Create content wrapper
  const content = document.createElement('div');
  content.className = 'reel-content';
  
  // Create video container
  const videoDiv = document.createElement('div');
  videoDiv.className = 'reel-video';
  
  // Check if it's a direct video file
  if (reelData.url.match(/\.(mp4|webm|mov|avi)$/i)) {
    videoDiv.innerHTML = `
      <video 
        controls 
        playsinline 
        preload="metadata"
        style="width: 100%; height: 100%; object-fit: cover;">
        <source src="${embedUrl}" type="video/mp4">
        Your browser does not support the video tag.
      </video>
    `;
  } else {
    // Use iframe for embedded content (Instagram, TikTok, YouTube, Twitter)
    videoDiv.innerHTML = `
      <iframe 
        src="${embedUrl}" 
        frameborder="0" 
        scrolling="no" 
        allowtransparency="true" 
        allowfullscreen="true"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture">
      </iframe>
    `;
  }
  
  // Create products container with carousel
  const productsDiv = document.createElement('div');
  productsDiv.className = 'reel-products';
  
  const carousel = createProductsCarousel(reelData.products, index);
  productsDiv.appendChild(carousel);
  
  // Assemble section
  content.appendChild(videoDiv);
  content.appendChild(productsDiv);
  section.appendChild(content);
  
  return section;
}

// Create products carousel with pagination
function createProductsCarousel(products, reelIndex) {
  const carousel = document.createElement('div');
  carousel.className = 'products-carousel';
  carousel.setAttribute('data-reel-index', reelIndex);
  
  // Determine products per page based on screen size AND orientation
  const isMobile = window.innerWidth < 768;
  const isTablet = window.innerWidth >= 768 && window.innerWidth < 1200;
  const isMobileLandscape = isMobile && window.matchMedia('(orientation: landscape)').matches;
  
  // Mobile landscape: 2×2 = 4, Mobile portrait: 1×2 = 2, Tablet: 2×2 = 4, Desktop: 3×2 = 6
  const productsPerPage = isMobileLandscape ? 4 : (isMobile ? 2 : (isTablet ? 4 : 6));
  
  // Calculate total pages
  const totalPages = Math.ceil(products.length / productsPerPage);
  let currentPage = 0;
  
  // Create navigation (arrows)
  const prevBtn = document.createElement('button');
  prevBtn.className = 'carousel-nav prev';
  prevBtn.innerHTML = '◄';
  prevBtn.onclick = () => navigateCarousel(carousel, -1);
  
  const nextBtn = document.createElement('button');
  nextBtn.className = 'carousel-nav next';
  nextBtn.innerHTML = '►';
  nextBtn.onclick = () => navigateCarousel(carousel, 1);
  
  // Create products grid
  const grid = document.createElement('div');
  grid.className = 'products-grid';
  
  // ✅ NEW: Add swipe support to grid
  enableSwipeNavigation(grid, carousel);
  
  // Create dots indicator
  const dotsContainer = document.createElement('div');
  dotsContainer.className = 'carousel-dots';
  
  for (let i = 0; i < totalPages; i++) {
    const dot = document.createElement('span');
    dot.className = i === 0 ? 'dot active' : 'dot';
    dot.onclick = () => goToPage(carousel, i);
    dotsContainer.appendChild(dot);
  }
  
  // Store carousel state
  carousel.dataset.currentPage = '0';
  carousel.dataset.totalPages = totalPages;
  carousel.dataset.productsPerPage = productsPerPage;
  
  // Render initial page
  renderProductsPage(grid, products, 0, productsPerPage);
  
  // Assemble carousel
  if (totalPages > 1) {
    carousel.appendChild(prevBtn);
  }
  carousel.appendChild(grid);
  if (totalPages > 1) {
    carousel.appendChild(nextBtn);
    carousel.appendChild(dotsContainer);
  }
  
  return carousel;
}

// ========================================
// SWIPE NAVIGATION WITH INTENT DETECTION
// ========================================
function enableSwipeNavigation(grid, carousel) {
  let touchStartX = 0;
  let touchStartY = 0;
  let touchStartTime = 0;
  let gestureClaimed = false;

  grid.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchStartTime = Date.now();
    gestureClaimed = false;
  }, { passive: true });

  grid.addEventListener('touchmove', (e) => {
    if (gestureClaimed) return;

    const touchCurrentX = e.touches[0].clientX;
    const touchCurrentY = e.touches[0].clientY;
    const deltaX = touchCurrentX - touchStartX;
    const deltaY = touchCurrentY - touchStartY;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // Calculate swipe intent ratio
    if (absDeltaX > 5 || absDeltaY > 5) { // Minimum movement to detect intent
      const ratio = absDeltaX / (absDeltaY || 1); // Avoid division by zero

      // Detect horizontal intent (carousel navigation)
      if (ratio > SWIPE_RATIO_HORIZONTAL) {
        // Check edge zone and claim distance
        if (touchStartX > EDGE_ZONE && absDeltaX > CLAIM_DISTANCE) {
          e.preventDefault(); // Claim gesture, block browser
          gestureClaimed = true;
        }
      }
      // Detect vertical intent (reel scrolling) - let native scroll happen
      else if (ratio < SWIPE_RATIO_VERTICAL) {
        // Don't preventDefault, allow vertical scroll
        gestureClaimed = false;
      }
    }
  }, { passive: false }); // Must be non-passive to preventDefault

  grid.addEventListener('touchend', (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);
    const ratio = absDeltaX / (absDeltaY || 1);

    // ✅ HORIZONTAL INTENT: Navigate carousel
    if (touchStartX > EDGE_ZONE && 
        absDeltaX > MIN_SWIPE_DISTANCE && 
        ratio > SWIPE_RATIO_HORIZONTAL) {
      
      if (deltaX > 0) {
        // Swipe right = previous page
        navigateCarousel(carousel, -1);
      } else {
        // Swipe left = next page
        navigateCarousel(carousel, 1);
      }
    }
    // ✅ VERTICAL INTENT: Scroll to next/previous reel
    else if (absDeltaY > MIN_SWIPE_DISTANCE && ratio < SWIPE_RATIO_VERTICAL) {
      if (deltaY > 0) {
        // Swipe down = previous reel
        if (window.scrollToPreviousReel) {
          window.scrollToPreviousReel();
        }
      } else {
        // Swipe up = next reel
        if (window.scrollToNextReel) {
          window.scrollToNextReel();
        }
      }
    }

    gestureClaimed = false;
  });
} // ✅ ADDED: Close enableSwipeNavigation function

// Render products for current page
function renderProductsPage(grid, allProducts, page, perPage) {
  grid.innerHTML = '';
  
  const startIdx = page * perPage;
  const endIdx = Math.min(startIdx + perPage, allProducts.length);
  const pageProducts = allProducts.slice(startIdx, endIdx);
  
  pageProducts.forEach(product => {
    // Use global createProductCard from products.js
    const card = window.createProductCard(product);
    grid.appendChild(card);
  });
}

// Navigate carousel (prev/next)
function navigateCarousel(carousel, direction) {
  const currentPage = parseInt(carousel.dataset.currentPage);
  const totalPages = parseInt(carousel.dataset.totalPages);
  
  let newPage = currentPage + direction;
  
  // Wrap around
  if (newPage < 0) newPage = totalPages - 1;
  if (newPage >= totalPages) newPage = 0;
  
  goToPage(carousel, newPage);
}

// Go to specific page
function goToPage(carousel, page) {
  const grid = carousel.querySelector('.products-grid');
  const dots = carousel.querySelectorAll('.dot');
  const reelIndex = carousel.dataset.reelIndex;
  const productsPerPage = parseInt(carousel.dataset.productsPerPage);
  
  // Get all products for this reel
  const reelsData = getReelsDataFromProducts();
  const products = reelsData[reelIndex].products;
  
  // Update page
  carousel.dataset.currentPage = page;
  
  // Render new page
  renderProductsPage(grid, products, page, productsPerPage);
  
  // Update dots
  dots.forEach((dot, i) => {
    dot.classList.toggle('active', i === page);
  });

  // ✅ NEW: Save position to localStorage
  if (window.saveReelPosition) {
    const reelUrl = reelsData[reelIndex].url;
    window.saveReelPosition(reelUrl, page);
  }
}


// Export to global scope
window.renderReelsFeed = renderReelsFeed;
window.getReelsDataFromProducts = getReelsDataFromProducts; // ✅ NEW: Export for localStorage
window.goToPage = goToPage;

console.log('✅ Reels feed module loaded');
