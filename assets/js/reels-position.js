// assets/js/reels-position.js - LocalStorage Position Management

console.log('💾 Reels position manager loading...');

// ========================================
// LOCALSTORAGE CONSTANTS
// ========================================
const STORAGE_KEY_REEL_URL = 'vibedrips-last-reel-url';
const STORAGE_KEY_PAGE = 'vibedrips-last-page';

/**
 * Save current reel position to localStorage
 * @param {string} reelUrl - Product Source Link (Instagram URL)
 * @param {number} pageIndex - Current carousel page
 */
function saveReelPosition(reelUrl, pageIndex) {
  try {
    localStorage.setItem(STORAGE_KEY_REEL_URL, reelUrl);
    localStorage.setItem(STORAGE_KEY_PAGE, pageIndex.toString());
    console.log(`💾 Saved position: ${reelUrl}, page ${pageIndex}`);
  } catch (error) {
    console.warn('⚠️ Failed to save reel position:', error);
  }
}

/**
 * Restore last viewed reel position from localStorage
 */
function restoreReelPosition() {
  try {
    // PHASE_3: Check for Warp Target (priority) or Saved URL
    const warpAsin = localStorage.getItem('vibedrips-warp-target');
    const savedUrl = localStorage.getItem(STORAGE_KEY_REEL_URL);
    const savedPage = parseInt(localStorage.getItem(STORAGE_KEY_PAGE) || '0');

    if (!warpAsin && !savedUrl) {
      console.log('💾 No saved position or warp target found');
      return;
    }

    // Get all reels data
    const reelsData = window.getReelsDataFromProducts ? window.getReelsDataFromProducts() : [];
    if (reelsData.length === 0) {
      console.warn('⚠️ No reels data available');
      return;
    }

    let targetIndex = -1;
    let targetPage = 0;

    if (warpAsin) {
      // 🚀 WARP LOGIC: Find reel containing the target ASIN
      reelsData.forEach((reel, rIdx) => {
        const pIdx = reel.products.findIndex(p => p.asin === warpAsin);
        if (pIdx !== -1) {
          targetIndex = rIdx;
          targetPage = pIdx;
        }
      });
      console.log(`🚀 Warp target found: ASIN ${warpAsin} -> Reel ${targetIndex}, Page ${targetPage}`);
      // Clear warp state immediately to prevent infinite "Warp" on refresh
      localStorage.removeItem('vibedrips-warp-target');
      localStorage.removeItem('vibedrips-warp-currency');
    } else {
      // Find reel index by URL
      targetIndex = reelsData.findIndex(reel => reel.url === savedUrl);
      targetPage = savedPage;
    }

    if (targetIndex === -1) {
      console.warn('⚠️ Target not found');
      if (!warpAsin) {
        localStorage.removeItem(STORAGE_KEY_REEL_URL);
        localStorage.removeItem(STORAGE_KEY_PAGE);
      }
      return;
    }

    // Scroll and Highlight
    const container = document.querySelector('.reels-scroll-container');
    const reelSection = document.querySelector(`[data-reel-index="${targetIndex}"]`);

    if (reelSection) {
      console.log(`🎬 Scrolling to target section: ${targetIndex}`);
      reelSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

      // 🏙️ Phase 8: Simplified Landing - Highlight the entire grid
      setTimeout(() => {
        const grid = reelSection.querySelector('.products-grid');
        if (grid) {
          console.log('✨ Applying Persistent Grid Highlight');
          grid.classList.add('persistent-warp-highlight');
        }

        // 🛑 Step 10: Stop Inward Pulsating Glow
        const overlay = document.querySelector('.warp-overlay');
        if (overlay) {
          overlay.style.opacity = '0';
          setTimeout(() => overlay.remove(), 800);
        }
      }, 1500); // Wait for reel scroll to settle
    }
  } catch (error) {
    console.error('❌ Error in restoreReelPosition:', error);
  }
}

/**
 * Clear saved position (optional - for reset functionality)
 */
function clearReelPosition() {
  try {
    localStorage.removeItem(STORAGE_KEY_REEL_URL);
    localStorage.removeItem(STORAGE_KEY_PAGE);
    console.log('💾 Cleared saved position');
  } catch (error) {
    console.warn('⚠️ Failed to clear position:', error);
  }
}

// Export to global scope
window.saveReelPosition = saveReelPosition;
window.restoreReelPosition = restoreReelPosition;
window.clearReelPosition = clearReelPosition;

console.log('✅ Reels position manager loaded');
