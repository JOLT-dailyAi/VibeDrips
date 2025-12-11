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
  
  // Setup navigation handlers (NEW)
  setupNavigationHandlers();
  
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
  removeNavigationHandlers();
  
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

// Setup navigation handlers (NEW)
function setupNavigationHandlers() {
  // Keyboard arrow keys
  document.addEventListener('keydown', handleArrowKeys);
  
  // Navigation buttons
  const upBtn = document.querySelector('.reels-nav-btn.up');
  const downBtn = document.querySelector('.reels-nav-btn.down');
  
  if (upBtn) upBtn.addEventListener('click', scrollToPreviousReel);
  if (downBtn) downBtn.addEventListener('click', scrollToNextReel);
}

// Remove navigation handlers (NEW)
function removeNavigationHandlers() {
  document.removeEventListener('keydown', handleArrowKeys);
  
  const upBtn = document.querySelector('.reels-nav-btn.up');
  const downBtn = document.querySelector('.reels-nav-btn.down');
  
  if (upBtn) upBtn.removeEventListener('click', scrollToPreviousReel);
  if (downBtn) downBtn.removeEventListener('click', scrollToNextReel);
}

// Handle arrow key presses (NEW)
function handleArrowKeys(e) {
  if (e.key === 'ArrowUp') {
    e.preventDefault();
    scrollToPreviousReel();
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    scrollToNextReel();
  }
}

// Scroll to previous reel (NEW)
function scrollToPreviousReel() {
  const container = document.querySelector('.reels-scroll-container');
  if (!container) return;
  
  const sections = document.querySelectorAll('.reel-section');
  if (sections.length === 0) return;
  
  // Find currently visible section
  const currentIndex = getCurrentReelIndex(container, sections);
  
  if (currentIndex > 0) {
    // Scroll to previous section
    sections[currentIndex - 1].scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }
}

// Scroll to next reel (NEW)
function scrollToNextReel() {
  const container = document.querySelector('.reels-scroll-container');
  if (!container) return;
  
  const sections = document.querySelectorAll('.reel-section');
  if (sections.length === 0) return;
  
  // Find currently visible section
  const currentIndex = getCurrentReelIndex(container, sections);
  
  if (currentIndex < sections.length - 1) {
    // Scroll to next section
    sections[currentIndex + 1].scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }
}

// Get index of currently visible reel (NEW)
function getCurrentReelIndex(container, sections) {
  const scrollTop = container.scrollTop;
  const containerHeight = container.clientHeight;
  const centerPoint = scrollTop + (containerHeight / 2);
  
  let currentIndex = 0;
  let minDistance = Infinity;
  
  sections.forEach((section, index) => {
    const sectionTop = section.offsetTop;
    const sectionCenter = sectionTop + (section.clientHeight / 2);
    const distance = Math.abs(centerPoint - sectionCenter);
    
    if (distance < minDistance) {
      minDistance = distance;
      currentIndex = index;
    }
  });
  
  return currentIndex;
}

// Export to global scope
window.openReelsModal = openReelsModal;
window.closeReelsModal = closeReelsModal;

console.log('✅ Reels modal wrapper loaded');
