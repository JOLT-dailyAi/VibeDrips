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
}

// Close simple modal (for static modal with ID 'static-modal')
function closeSimpleModal() {
    const modal = document.getElementById('static-modal');
    if (!modal) return;

    console.log('❌ Closing simple modal');
    modal.classList.add('hidden');
}

// Close dynamic modal (for dynamically generated product modals)
function closeDynamicModal(event) {
    console.log('🖱️ Close dynamic modal triggered');

    // If called without event (programmatically), just find and remove the modal
    if (!event) {
        const modal = document.querySelector('.simple-modal.dynamic-modal');
        if (modal) {
            console.log('💥 Closing modal programmatically...');
            modal.remove();
        }
        return;
    }

    // Find the closest modal parent
    const modal = event.target.closest('.simple-modal');

    if (!modal) {
        console.error('❌ Could not find modal to close');
        return;
    }

    // Check if clicking on overlay or close button (not modal content)
    const clickedOverlay = event.target.classList.contains('modal-overlay');
    const clickedCloseButton = event.target.tagName === 'BUTTON';

    console.log('🖱️ Click details:', {
        clickedOverlay,
        clickedCloseButton,
        targetClass: event.target.className,
        targetTag: event.target.tagName
    });

    if (clickedOverlay || clickedCloseButton) {
        console.log('💥 Closing modal...');
        modal.remove(); // Remove dynamically created modal from DOM
    }
}

// Export to global scope
window.showSimpleModal = showSimpleModal;
window.closeSimpleModal = closeSimpleModal;
window.closeDynamicModal = closeDynamicModal;

console.log('✅ Product modal module loaded');
