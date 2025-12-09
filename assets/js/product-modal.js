// product-modal.js - Product details modal management

// Show simple modal (product modal)
function showSimpleModal() {
    const modal = document.getElementById('static-modal');
    if (!modal) {
        console.error('❌ Product modal not found!');
        return;
    }
    
    console.log('✅ Opening product modal');
    modal.classList.remove('hidden');
    
    // Add click-outside listener after a delay
    setTimeout(() => {
        console.log('👂 Adding product modal outside click listener');
        document.addEventListener('click', handleProductModalOutsideClick);
    }, 150);
}

// Close simple modal
function closeSimpleModal(event) {
    const modal = document.getElementById('static-modal');
    if (!modal) return;
    
    // If event exists, check if we should close
    if (event) {
        // Only close if clicking directly on the overlay (not on content)
        if (!event.target.classList.contains('simple-modal')) {
            return; // Don't close if not clicking overlay
        }
    }
    
    console.log('❌ Closing product modal');
    modal.classList.add('hidden');
    
    // Remove click-outside listener
    console.log('🔇 Removing product modal outside click listener');
    document.removeEventListener('click', handleProductModalOutsideClick);
}

// Handle clicks outside the product modal content
function handleProductModalOutsideClick(event) {
    const modal = document.getElementById('static-modal');
    const modalContent = document.querySelector('.simple-modal-content');
    
    if (!modal) return;
    
    // Check if modal is visible
    const isHidden = modal.classList.contains('hidden');
    if (isHidden) return;
    
    // Don't close if clicking inside the content box
    const clickedInside = modalContent && modalContent.contains(event.target);
    
    console.log('🖱️ Product modal click detected:', {
        clickedInside,
        targetClass: event.target.className
    });
    
    if (!clickedInside) {
        console.log('💥 Clicked outside product modal content! Closing...');
        closeSimpleModal();
    }
}

// Export to global scope
window.showSimpleModal = showSimpleModal;
window.closeSimpleModal = closeSimpleModal;

console.log('✅ Product modal module loaded');
