/**
 * assets/js/external-controls.js
 * 
 * Manages the logic for Product Modal External Controls:
 * - Mutual Exclusivity between Reels and Globe toggles.
 * - Dynamic Visibility for the News Ticker Bubble.
 */

window.VibeDrips = window.VibeDrips || {};

window.VibeDrips.ExternalControls = (function () {

    /**
     * Initialize the external controls logic
     * Called after the modal structure is injected into the DOM
     */
    function init() {
        console.log('🎬 ExternalControls: Initializing logic...');
        const modal = document.querySelector('.dynamic-modal');
        if (!modal) {
            console.warn('🎬 ExternalControls: Modal not found!');
            return;
        }

        const reelsBtn = modal.querySelector('.reels-toggle');
        const globeBtn = modal.querySelector('.globe-toggle');
        const bubble = modal.querySelector('.control-bubble');

        if (!reelsBtn || !globeBtn || !bubble) {
            console.warn('🎬 ExternalControls: Essential elements missing!', { reelsBtn, globeBtn, bubble });
            return;
        }

        console.log('🎬 ExternalControls: Connected to DOM elements.');

        // Force initial state: Both OFF
        reelsBtn.classList.remove('active');
        globeBtn.classList.remove('active');
        bubble.classList.remove('hidden');

        // REELS TOGGLE CLICK
        reelsBtn.onclick = (e) => {
            e.stopPropagation();
            const isActive = reelsBtn.classList.toggle('active');
            console.log('🎬 ExternalControls: Reels toggled:', isActive);

            if (isActive) {
                // Mutual Exclusion: Turn Globe OFF
                globeBtn.classList.remove('active');
            }

            syncBubbleState(reelsBtn, globeBtn, bubble);
        };

        // GLOBE TOGGLE CLICK
        globeBtn.onclick = (e) => {
            e.stopPropagation();
            const isActive = globeBtn.classList.toggle('active');
            console.log('🌍 ExternalControls: Globe toggled:', isActive);

            if (isActive) {
                // Mutual Exclusion: Turn Reels OFF
                reelsBtn.classList.remove('active');
            }

            syncBubbleState(reelsBtn, globeBtn, bubble);
        };
    }

    /**
     * Update bubble visibility based on toggle states
     * Bubble only appears when BOTH are off
     */
    function syncBubbleState(reelsBtn, globeBtn, bubble) {
        const isReelsOn = reelsBtn.classList.contains('active');
        const isGlobeOn = globeBtn.classList.contains('active');

        if (isReelsOn || isGlobeOn) {
            console.log('🎬 ExternalControls: Hiding bubble (Controls active)');
            bubble.classList.add('hidden');
        } else {
            console.log('🎬 ExternalControls: Showing bubble (All clear)');
            bubble.classList.remove('hidden');
        }
    }

    return {
        init: init
    };

})();
