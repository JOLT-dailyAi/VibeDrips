// assets/js/reels-modal.js - Reels Modal Wrapper

console.log('🎬 Reels modal wrapper loading...');

// Open reels modal (called from time-category click)
function openReelsModal() {
  console.log('🎬 Opening reels modal...');
  
  const modal = document.getElementById('reels-modal');
  if (!modal) {
    console.error('❌ Reels modal element not found');
    return;
  }
  
  // Show modal
  modal.classList.remove('hidden');
  
  // Disable body scroll
  document.body.style.overflow = 'hidden';
  
  // Render reels feed inside modal
  if (window.renderReelsFeed) {
    window.renderReelsFeed();
  } else {
    console.error('❌ renderReelsFeed function not found');
  }
  
  // Setup close handlers
  setupModalCloseHandlers();
  
  console.log('✅ Reels modal opened');
}

// Close reels modal
function closeReelsModal() {
  console.log('🎬 Closing reels modal...');
  
  const modal = document.getElementById('reels-modal');
  if (!modal) return;
  
  // Hide modal
  modal.classList.add('hidden');
  
  // Re-enable body scroll
  document.body.style.overflow = '';
  
  // Clean up
  removeModalCloseHandlers();
  
  console.log('✅ Reels modal closed');
}

// Setup close event handlers
function setupModalCloseHandlers() {
  // ESC key
  document.addEventListener('keydown', handleEscKey);
  
  // Swipe gesture (mobile)
  const modal = document.getElementById('reels-modal');
  if (modal) {
    modal.addEventListener('touchstart', handleTouchStart, { passive: true });
    modal.addEventListener('touchend', handleTouchEnd, { passive: true });
  }
}

// Remove close event handlers
function removeModalCloseHandlers() {
  document.removeEventListener('keydown', handleEscKey);
  
  const modal = document.getElementById('reels-modal');
  if (modal) {
    modal.removeEventListener('touchstart', handleTouchStart);
    modal.removeEventListener('touchend', handleTouchEnd);
  }
}

// Handle ESC key
function handleEscKey(e) {
  if (e.key === 'Escape') {
    closeReelsModal();
  }
}

// Touch gesture tracking
let touchStartX = 0;
let touchStartY = 0;

function handleTouchStart(e) {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
}

function handleTouchEnd(e) {
  const touchEndX = e.changedTouches[0].clientX;
  const touchEndY = e.changedTouches[0].clientY;
  
  const deltaX = touchEndX - touchStartX;
  const deltaY = Math.abs(touchEndY - touchStartY);
  
  // Swipe right to close (must be >100px horizontal, <50px vertical)
  if (deltaX > 100 && deltaY < 50) {
    closeReelsModal();
  }
}

// Export to global scope
window.openReelsModal = openReelsModal;
window.closeReelsModal = closeReelsModal;

console.log('✅ Reels modal wrapper loaded');
