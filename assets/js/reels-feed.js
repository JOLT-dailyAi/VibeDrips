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

  // Initialize Media Lifecycle (Intersection Observer)
  initReelsObserver();
}

/**
 * PHASE 14: Reels Media Observer
 * Manages Preloading, Autoplay (Shotgun), and Memory Cleanup
 */
const REELS_SECTIONS_CACHE = [];
let activeShotgunPulses = new Map();

let lastActiveIdx = -1;
let lifecycleDebounceTimer = null;

function initReelsObserver() {
  const container = document.querySelector('.reels-scroll-container');
  if (!container) return;

  // Cache sections once
  REELS_SECTIONS_CACHE.length = 0;
  document.querySelectorAll('.reel-section').forEach(s => REELS_SECTIONS_CACHE.push(s));

  // 🛡️ RESET SHIELDS ON SCROLL: Re-protect vertical swipe intent
  container.addEventListener('scroll', () => {
    document.querySelectorAll('.reel-video-shield').forEach(s => s.style.pointerEvents = 'auto');
  }, { passive: true });

  const options = {
    root: container,
    threshold: [0.05, 0.5, 0.95] // Soft detection for handover
  };

  const observer = new IntersectionObserver((entries) => {
    // Collect all intersecting entries to find the "Center-most"
    let bestEntry = null;
    let maxRatio = -1;

    entries.forEach(e => {
      // Manage individual visibility (Soft Handover)
      const idx = parseInt(e.target.dataset.reelIndex);
      const videoContainer = e.target.querySelector('.reel-video');

      if (videoContainer) {
        if (e.intersectionRatio < 0.05) {
          // 💀 GONE: Kill when fully off-screen
          killMedia(videoContainer);
        } else if (e.intersectionRatio > 0.4) {
          // 🎯 APPROACHING CENTER: Activate early
          activateMedia(videoContainer, e.intersectionRatio > 0.7);
        }
      }

      if (e.isIntersecting && e.intersectionRatio > maxRatio) {
        maxRatio = e.intersectionRatio;
        bestEntry = e;
      }
    });

    if (bestEntry && maxRatio > 0.7) {
      const activeIdx = parseInt(bestEntry.target.dataset.reelIndex);
      if (activeIdx !== lastActiveIdx) {
        lastActiveIdx = activeIdx;
        // ⚡️ IMMEDIATE: No debounce, no buffering
        manageMediaLifecycle(activeIdx, REELS_SECTIONS_CACHE);
      }
    }
  }, options);

  REELS_SECTIONS_CACHE.forEach(section => observer.observe(section));
}

function manageMediaLifecycle(activeIdx, sections) {
  sections.forEach((section, idx) => {
    const videoContainer = section.querySelector('.reel-video');
    if (!videoContainer) return;

    if (idx === activeIdx) {
      // 🎯 ACTIVE: Landed!
      activateMedia(videoContainer, true);
    } else {
      // 💀 Aggressive kill is now handled per-entry in the observer 
      // to allow "Soft Handover" during active transition.
    }
  });
}

function activateMedia(container, shouldPlay) {
  const url = container.dataset.url;
  const type = container.dataset.type;
  let media = container.querySelector('video, iframe');

  // 1. Fresh Injection
  if (!media || media.dataset.loaded !== 'true') {
    container.innerHTML = getMediaHTML(type, url, shouldPlay);
    media = container.querySelector('video, iframe');
    if (media) {
      media.dataset.loaded = 'true';

      // 🛡️ SMART SHIELD HANDOVER
      const shield = document.createElement('div');
      shield.className = 'reel-video-shield';
      shield.onclick = (e) => {
        e.stopPropagation();
        triggerShotgunPulse(media);

        // Native Toggle (Play/Pause)
        if (media.tagName === 'VIDEO') {
          if (media.paused) media.play().catch(() => { });
          else media.pause();
        }

        // UNLOCK IFRAME: Disable shield until next scroll
        shield.style.pointerEvents = 'none';
      };
      container.appendChild(shield);
    }
  }

  // 2. Immediate Autoplay pulse (with Readiness Delay)
  if (shouldPlay && media) {
    if (media.dataset.pulsing !== 'true') {
      media.dataset.pulsing = 'true';
      // Golden Spiral Style Handover Delay (Settling)
      setTimeout(() => {
        triggerShotgunPulse(media);
        media.dataset.pulsing = 'false';
      }, 300);
    }
  }
}

function killMedia(container) {
  const media = container.querySelector('video, iframe');
  if (media) {
    // Clear any active pulses
    if (activeShotgunPulses.has(media)) {
      clearInterval(activeShotgunPulses.get(media));
      activeShotgunPulses.delete(media);
    }

    media.src = '';
    media.removeAttribute('src'); // Force deeper cleanup
    media.load?.(); // Stop video buffer
    media.dataset.loaded = 'false';
    container.innerHTML = '<div class="reel-video-placeholder">🎬</div>';
  }
}

function triggerShotgunPulse(media) {
  if (!media) return;

  // Clear previous pulses for THIS media
  if (activeShotgunPulses.has(media)) {
    clearInterval(activeShotgunPulses.get(media));
  }

  const sendPulse = () => {
    if (media.tagName === 'VIDEO') {
      media.muted = false;
      media.volume = 0.2;
      media.play().catch(() => {
        media.muted = true;
        media.play();
      });
    } else if (media.contentWindow) {
      // 1. YouTube specialized (API mode)
      media.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'unMute', args: '' }), '*');
      media.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'setVolume', args: [20] }), '*');
      media.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'playVideo', args: '' }), '*');

      // 2. Vimeo specialized
      media.contentWindow.postMessage(JSON.stringify({ method: 'setVolume', value: 0.2 }), '*');
      media.contentWindow.postMessage(JSON.stringify({ method: 'play' }), '*');

      // 3. Protocol Shotgun (Universal fallback for ANY platform)
      media.contentWindow.postMessage('unmute', '*');
      media.contentWindow.postMessage(JSON.stringify({ event: 'unmute' }), '*');
      media.contentWindow.postMessage(JSON.stringify({ event: 'volume', value: 0.2 }), '*');
      media.contentWindow.postMessage('play', '*');
    }
  };

  // Initial burst
  sendPulse();

  // 🔊 SUCCESSIVE PULSE: Pulse every 500ms for 2 seconds (Golden Spiral Precision)
  let pulses = 0;
  const interval = setInterval(() => {
    sendPulse();
    if (++pulses >= 4) {
      clearInterval(interval);
      activeShotgunPulses.delete(media);
    }
  }, 500);

  activeShotgunPulses.set(media, interval);
}

function getMediaHTML(type, url, isActive) {
  const embedUrl = getUniversalVideoEmbedUrlForReels(url, isActive);

  if (type === 'video') {
    // Buffered items should be muted and NOT autoplaying to be safe
    const autoplay = isActive ? 'autoplay' : '';
    const muted = isActive ? '' : 'muted';
    return `<video controls playsinline ${autoplay} ${muted} preload="auto" src="${url}" style="width:100%;height:100%;object-fit:cover;"></video>`;
  } else {
    return `<iframe src="${embedUrl}" frameborder="0" scrolling="no" allowtransparency="true" allowfullscreen="true" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe>`;
  }
}

// Optimized URL generator for Reels lifecycle
function getUniversalVideoEmbedUrlForReels(sourceUrl, isActive) {
  const url = sourceUrl.toLowerCase();
  const autoplay = isActive ? '1' : '0';

  if (url.includes('instagram.com')) {
    const match = sourceUrl.match(/\/(p|reel)\/([^\/\?]+)/);
    return match ? `https://www.instagram.com/p/${match[2]}/embed` : sourceUrl;
  }
  if (url.includes('tiktok.com')) {
    const match = sourceUrl.match(/\/video\/(\d+)/);
    return match ? `https://www.tiktok.com/embed/v2/${match[1]}` : sourceUrl;
  }
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    let videoId = null;
    if (url.includes('youtu.be/')) videoId = sourceUrl.match(/youtu\.be\/([^?]+)/)?.[1];
    else if (url.includes('youtube.com/watch')) videoId = new URL(sourceUrl).searchParams.get('v');
    else if (url.includes('youtube.com/shorts/')) videoId = sourceUrl.match(/shorts\/([^?]+)/)?.[1];

    if (videoId) return `https://www.youtube.com/embed/${videoId}?enablejsapi=1&autoplay=${autoplay}&mute=1`;
  }
  return sourceUrl;
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
  videoDiv.dataset.url = reelData.url;
  videoDiv.dataset.type = reelData.url.match(/\.(mp4|webm|mov|avi)$/i) ? 'video' : 'iframe';

  // Initial placeholder (Lazy Injection)
  videoDiv.innerHTML = '<div class="reel-video-placeholder">🎬</div>';

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
  prevBtn.className = 'carousel-nav prev floating-glass-nav';
  prevBtn.innerHTML = `
    <svg viewBox="0 0 24 24">
      <polyline points="15 18 9 12 15 6"></polyline>
    </svg>
  `;
  prevBtn.onclick = () => navigateCarousel(carousel, -1);

  const nextBtn = document.createElement('button');
  nextBtn.className = 'carousel-nav next floating-glass-nav';
  nextBtn.innerHTML = `
    <svg viewBox="0 0 24 24">
      <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
  `;
  nextBtn.onclick = () => navigateCarousel(carousel, 1);

  // Create products grid
  const grid = document.createElement('div');
  grid.className = 'products-grid';

  // ✅ NEW: Add swipe support to grid
  enableSwipeNavigation(grid, carousel);

  // Create dots indicator
  const dotsContainer = document.createElement('div');
  dotsContainer.className = 'carousel-dots glass-pill';

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
