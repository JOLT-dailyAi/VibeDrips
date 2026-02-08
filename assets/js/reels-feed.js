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
let REELS_OBSERVER = null; // 🛡️ SINGLETON: Prevent observer leaks

// 🛡️ REVEAL GUARD: Delay observer start until modal is fully open
function initReelsObserver() {
  setTimeout(_initReelsObserverInternal, 500);
}

function _initReelsObserverInternal() {
  const container = document.querySelector('.reels-scroll-container');
  if (!container) return;

  // 🛡️ CLEANUP: Stop any previous observer from fighting this one
  if (REELS_OBSERVER) {
    console.log('💀 Killing old Reels Observer ghosts...');
    REELS_OBSERVER.disconnect();
    REELS_OBSERVER = null;
  }

  // Cache sections once
  REELS_SECTIONS_CACHE.length = 0;
  document.querySelectorAll('.reel-section').forEach(s => REELS_SECTIONS_CACHE.push(s));

  // 🛡️ RESET SHIELDS ON SCROLL: Only if we've moved significantly
  let lastScrollPos = container.scrollTop;
  container.addEventListener('scroll', () => {
    const currentScroll = container.scrollTop;
    const scrollDelta = Math.abs(currentScroll - lastScrollPos);

    // Only reset if we've scrolled significantly (prevent flicker on micro-swipes)
    if (scrollDelta > 100) {
      REELS_SECTIONS_CACHE.forEach((section, idx) => {
        // ONLY reset shields for items that ARE NOT the current active one
        if (idx !== lastActiveIdx) {
          const shield = section.querySelector('.reel-video-shield');
          if (shield) {
            shield.style.pointerEvents = 'auto';
            shield.classList.remove('released');
          }
        }
      });
      lastScrollPos = currentScroll;
    }
  }, { passive: true });

  // 🔊 GLOBAL UNMUTE LISTENER: React when another component triggers sound
  // 🔇 HANDOVER STOP: Pause if another foreground media starts
  window.addEventListener('vibedrips-media-play', (e) => {
    const senderId = e.detail?.senderId;
    if (senderId && senderId !== 'reels-feed') {
      const activeSection = REELS_SECTIONS_CACHE[lastActiveIdx];
      if (activeSection) {
        const media = activeSection.querySelector('video, iframe');
        if (media) {
          console.log('🔇 Reels Feed: Pausing for handover to', senderId);
          if (media.tagName === 'VIDEO') {
            media.pause();
          } else if (media.contentWindow) {
            media.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'pauseVideo', args: '' }), '*');
            media.contentWindow.postMessage(JSON.stringify({ method: 'pause' }), '*');
          }
        }
      }
    }
  });

  window.addEventListener('vibedrips-media-unmute', () => {
    // 🛡️ FOCUS GUARD: Only wake up if Lightbox or Product Modal isn't covering us (Mobile Only)
    if (window.Device && !window.Device.isMobile()) return;

    const isLightboxActive = window.MediaLightbox && window.MediaLightbox.activeInstance && window.MediaLightbox.activeInstance.isOpen;
    const isProductModalActive = document.querySelector('.simple-modal:not(.hidden)');
    const isMediaOverlayActive = window.mediaOverlay && window.mediaOverlay.container && window.mediaOverlay.container.classList.contains('active');

    if (isLightboxActive || isProductModalActive || isMediaOverlayActive) return;

    const activeSection = REELS_SECTIONS_CACHE[lastActiveIdx];
    if (activeSection) {
      const media = activeSection.querySelector('video, iframe');
      const pill = activeSection.querySelector('.engagement-pill');

      // ✅ NAVIGATION RESET: When unmuting globally, we want to play the current active reel
      // even if it was previously paused.
      if (media) {
        media.dataset.userPaused = 'false';
        triggerShotgunPulse(media);
      }
      if (pill) {
        pill.classList.add('instantly-hidden');
        pill.classList.remove('smart-cycling');
      }
    }
  });

  const options = {
    root: container,
    threshold: [0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0] // 🎯 GRANULAR: Detect every 10% movement
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
        } else if (e.intersectionRatio > 0.3) {
          // 🎯 APPROACHING CENTER: Activate much earlier for instant movement
          activateMedia(videoContainer, e.intersectionRatio > 0.6);
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

  REELS_OBSERVER = observer; // Save to singleton
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
      // 💀 ABSOLUTE LOCKDOWN: Forcibly kill everything else
      // This eliminates "Zombie Audio" and duplicate playback immediately
      killMedia(videoContainer);
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

      const birthVol = container.dataset.birthVolume || (window.MediaState ? window.MediaState.getVolume() : 0.2);

      if (window.MediaState) {
        // Sync the newly born media with its container's current target
        media.dataset.birthVolume = birthVol;
        window.MediaState.lockVolume(media);
      }

      // 🛡️ SMART SHIELD HANDOVER (Touch-First)
      const shield = document.createElement('div');
      shield.className = 'reel-video-shield';

      // 🛡️ ASYMMETRIC SHIELD: iOS always shows shield; Android/Desktop only if muted
      const isIOS = window.Device?.isIOS();
      const shouldMute = window.MediaState?.shouldStartMuted();

      if (isIOS || shouldMute) {
        shield.style.pointerEvents = 'auto';
        shield.style.display = 'block';
      } else {
        shield.style.pointerEvents = 'none';
        shield.classList.add('released');
        shield.style.display = 'none';
      }

      // Phase 1: Engagement Pill
      const pill = document.createElement('div');
      pill.className = 'engagement-pill';
      pill.innerHTML = `Tap <span class="pill-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg></span> for sound`;

      const isUnmuted = window.MediaState?.isUnmuted();
      if (!isUnmuted) pill.classList.add('smart-cycling');
      container.appendChild(pill);

      const handleHandover = (e) => {
        e.stopPropagation();

        // 🔊 SET GLOBAL STATE: First tap unlocks sound forever
        if (window.MediaState) window.MediaState.setUnmuted();

        triggerShotgunPulse(media);

        // Native Toggle (Play/Pause)
        if (media.tagName === 'VIDEO') {
          if (media.paused) {
            media.muted = false; // Force unmute on manual play tap
            media.play().catch(() => { });
          } else {
            media.pause();
          }
        } else if (media.tagName === 'IFRAME') {
          // Force play command for iframes on manual tap
          media.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: 'playVideo', args: '' }), '*');
        }

        // UNLOCK PLAYER: Disable shield permanently for this reel until scroll
        shield.style.pointerEvents = 'none';
        shield.classList.add('released');
      };

      shield.addEventListener('touchstart', handleHandover, { passive: true });
      shield.addEventListener('click', handleHandover);

      // ✅ USER INTENT SOVEREIGNTY: Detect if user manually mutes/pauses
      media.addEventListener('volumechange', () => {
        // 🛡️ SYNC GUARD: Ignore volume changes triggered by our own script
        if (media.dataset.scriptTriggeredVolume === 'true') return;

        // 🔊 GLOBAL SYNC: If the user adjusts volume, save it site-wide
        if (!media.muted && media.volume > 0) {
          if (window.MediaState) window.MediaState.setVolume(media.volume);
          media.dataset.userMuted = 'false';
        }

        if (media.muted) {
          media.dataset.userMuted = 'true';
          // Stop heartbeat if user explicitly mutes
          if (activeShotgunPulses.has(media)) {
            clearInterval(activeShotgunPulses.get(media));
            activeShotgunPulses.delete(media);
          }
        }
      });

      media.addEventListener('pause', () => {
        // Only register manual pause if the video was actually playing
        // (Prevents browser autoplay blocks from setting userPaused=true)
        if (media.currentTime > 0.1) {
          media.dataset.userPaused = 'true';
        }
      });

      container.appendChild(shield);
    }
  }

  // 2. Immediate Autoplay pulse (Unified Shotgun Activation)
  if (shouldPlay && media) {
    if (media.dataset.pulsing !== 'true') {
      media.dataset.pulsing = 'true';

      // 🛡️ SETTLING DELAY: Give mobile browser 250ms to finish layout
      setTimeout(() => {
        // 🎯 ABSOLUTE STABILIZATION: Trigger shotgun directly
        // The shotgun handles the "Muted-First" bridge for native videos
        triggerShotgunPulse(media);
        media.dataset.pulsing = 'false';
      }, 250);
    }
  }
}

function killMedia(container) {
  if (!container || container.dataset.isKilling === 'true') return;
  container.dataset.isKilling = 'true';

  try {
    const media = container.querySelector('video, iframe');
    if (media) {
      // Clear any active pulses
      if (activeShotgunPulses.has(media)) {
        clearInterval(activeShotgunPulses.get(media));
        activeShotgunPulses.delete(media);
      }

      if (media.tagName === 'VIDEO') {
        media.pause();
        media.removeAttribute('src'); // Release resource
        media.load();
      } else if (media.contentWindow) {
        try {
          media.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'pauseVideo', args: '' }), '*');
          media.contentWindow.postMessage(JSON.stringify({ method: 'pause' }), '*');
        } catch (e) { }
      }

      // 💀 NUCLEAR PURGE: Direct DOM removal is the only way to be 100% sure on Mobile Safari
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }

      container.dataset.loaded = 'false';
    }
  } finally {
    delete container.dataset.isKilling;
  }
}

function triggerShotgunPulse(media) {
  if (!media) return;

  // 🛡️ CONTEXT GUARD: Never pulse if backgrounded by a higher-priority modal or overlay
  const isProductModalActive = document.querySelector('.simple-modal:not(.hidden)');
  const isMediaOverlayActive = window.mediaOverlay && window.mediaOverlay.container && window.mediaOverlay.container.classList.contains('active');

  if (window.Device && window.Device.isMobile()) {
    if (isProductModalActive || isMediaOverlayActive) {
      console.log('🛡️ Reels Feed: Shotgun Pulse blocked - backgrounded by Modal/Overlay');
      return;
    }
  }

  // Clear previous pulses for THIS media
  if (activeShotgunPulses.has(media)) {
    clearInterval(activeShotgunPulses.get(media));
  }

  const isIOS = window.Device?.isIOS();
  const shouldMute = window.MediaState?.shouldStartMuted();
  const preferredVolume = window.MediaState?.getVolume();

  // Phase 1: Pill control (iOS always shows it on EVERY reel; Android only if muted)
  const pill = media.parentElement?.querySelector('.engagement-pill');
  if (pill) {
    if (isIOS || shouldMute) {
      pill.classList.remove('instantly-hidden');
      pill.classList.add('smart-cycling');
    } else {
      pill.classList.add('instantly-hidden');
      pill.classList.remove('smart-cycling');
    }
  }

  // 🔊 SILENT PRIMING: Set volume once, separate from play pulse logic
  if (media.tagName === 'VIDEO') {
    if (window.MediaState) window.MediaState.lockVolume(media);
    media.muted = shouldMute;
  }

  const sendPulse = () => {
    // 🛡️ USER INTENT SOVEREIGNTY: Back off if user manually interacted
    if (media.dataset.userMuted === 'true' || media.dataset.userPaused === 'true') {
      if (activeShotgunPulses.has(media)) {
        clearInterval(activeShotgunPulses.get(media));
        activeShotgunPulses.delete(media);
      }
      return;
    }

    if (media.tagName === 'VIDEO') {
      media.play().then(() => {
        if (window.MediaState) window.MediaState.reportMediaPlay('reels-feed');
      }).catch(() => {
        // 💊 PILL RESCUE: If unmuted play fails, restore the pill so user can fix it
        if (pill) pill.classList.add('active');
        media.muted = true;
        media.play().catch(() => { });
      });
    } else if (media.contentWindow) {
      if (window.MediaState) window.MediaState.reportMediaPlay('reels-feed');
      media.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'playVideo', args: '' }), '*');
      media.contentWindow.postMessage(JSON.stringify({ method: 'play' }), '*');
      media.contentWindow.postMessage('play', '*');
    }
  };

  // 🔊 ONE-SHOT INITIALIZATION: Set volume and unmute bridge BEFORE pulses start
  if (window.MediaState) {
    window.MediaState.lockVolume(media);
  }

  // Initial burst
  sendPulse();

  // 🔊 SUCCESSIVE PULSE: Pulse every 400ms for 1.6 seconds (One-Shot Safe)
  let pulses = 0;
  const interval = setInterval(() => {
    sendPulse();
    // 🛡️ Check if we are still the active reel
    const activeSection = REELS_SECTIONS_CACHE[lastActiveIdx];
    const isActive = activeSection && activeSection.contains(media);

    if (++pulses >= 4 || !isActive) {
      clearInterval(interval);
      activeShotgunPulses.delete(media);
    }
  }, 400);

  activeShotgunPulses.set(media, interval);
}

// 🔊 GLOBAL VOLUME SYNC: Update all containers and active media
window.addEventListener('vibedrips-media-volume', (e) => {
  if (!window.MediaState) return;
  const vol = e.detail.volume;

  // 🚪 BROADCAST TO ALL APARTMENT DOORS (Containers)
  // This ensures that "Killed" reels hear the change and apply it when they are reborn.
  REELS_SECTIONS_CACHE.forEach(section => {
    section.dataset.birthVolume = vol;
    const media = section.querySelector('video, iframe');
    if (media && media.dataset.userMuted !== 'true') {
      window.MediaState.lockVolume(media);
    }
  });
});

function getMediaHTML(type, url, isActive) {
  const embedUrl = getUniversalVideoEmbedUrlForReels(url, isActive);

  if (type === 'video') {
    // 🛡️ ASYMMETRIC MUTE: Use platform-aware state
    const shouldStartMuted = window.MediaState?.shouldStartMuted();
    const autoplayAttr = isActive ? `autoplay ${shouldStartMuted ? 'muted' : ''}` : '';
    const currentVol = window.MediaState?.getVolume() || 0.2;

    // ✅ NATIVE RESET: Ensure new elements start with clean intent
    return `<video controls playsinline ${autoplayAttr} preload="auto" src="${url}" 
              data-user-paused="false" data-user-muted="false"
              data-birth-volume="${currentVol}"
              style="width:100%;height:100%;object-fit:cover;"></video>`;
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

    // 🛡️ ASYMMETRIC MUTE: Initial attribute based on platform trust
    const initialMute = window.MediaState?.shouldStartMuted() ? '1' : '0';

    // 🔥 FORCE ACTIVE: If we are active, we MUST have autoplay=1
    const forcedAutoplay = isActive ? '1' : '0';

    if (videoId) return `https://www.youtube.com/embed/${videoId}?enablejsapi=1&autoplay=${forcedAutoplay}&mute=${initialMute}&rel=0`;
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
        return `https://www.youtube.com/embed/${videoId}?enablejsapi=1&autoplay=1&mute=1&rel=0`;
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

  // 🔗 PHASE_25: Store ASIN for deep-linking (use first product associated with reel)
  if (reelData.products && reelData.products.length > 0) {
    videoDiv.dataset.asin = reelData.products[0].asin;
  }

  // Initial placeholder (Lazy Injection)
  videoDiv.innerHTML = '<div class="reel-video-placeholder">🎬</div>';

  // Setup Share Button Logic
  setTimeout(() => {
    const shareBtn = videoDiv.querySelector('.share-button-reel');
    if (shareBtn) {
      shareBtn.onclick = (e) => {
        e.stopPropagation();
        const reelUrl = reelData.url;
        navigator.clipboard.writeText(reelUrl).then(() => {
          shareBtn.classList.add('success');
          setTimeout(() => shareBtn.classList.remove('success'), 2000);
        });
      };
    }
  }, 0);

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
