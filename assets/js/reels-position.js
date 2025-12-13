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
    const savedUrl = localStorage.getItem(STORAGE_KEY_REEL_URL);
    const savedPage = parseInt(localStorage.getItem(STORAGE_KEY_PAGE) || '0');

    if (!savedUrl) {
      console.log('💾 No saved position found');
      return;
    }

    console.log(`💾 Restoring position: ${savedUrl}, page ${savedPage}`);

    // Get all reels data
    const reelsData = window.getReelsDataFromProducts ? window.getReelsDataFromProducts() : [];
    if (reelsData.length === 0) {
      console.warn('⚠️ No reels data available');
      return;
    }

    // Find reel index by URL
    const reelIndex = reelsData.findIndex(reel => reel.url === savedUrl);

    if (reelIndex === -1) {
      console.warn('⚠️ Saved reel URL not found, clearing localStorage');
      localStorage.removeItem(STORAGE_KEY_REEL_URL);
      localStorage.removeItem(STORAGE_KEY_PAGE);
      return;
    }

    console.log(`✅ Found reel at index ${reelIndex}, navigating...`);

    // Scroll to saved reel section
    const reelSection = document.querySelector(`[data-reel-index="${reelIndex}"]`);
    if (reelSection) {
      reelSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      
      // Restore carousel page after scrolling
      setTimeout(() => {
        const carousel = reelSection.querySelector('.products-carousel');
        if (carousel && window.goToPage) {
          window.goToPage(carousel, savedPage);
          console.log(`✅ Restored to page ${savedPage}`);
        }
      }, 500); // Wait for scroll animation
    }

  } catch (error) {
    console.error('❌ Error restoring position:', error);
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
