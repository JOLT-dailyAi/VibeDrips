/**
 * assets/js/external-controls.js
 * 
 * Manages the logic for Product Modal External Controls:
 * - Mutual Exclusivity between Reels and Globe toggles.
 * - Dynamic Visibility for the News Ticker Bubble.
 */

window.VibeDrips = window.VibeDrips || {};

VibeDrips.ExternalControls = (function () {

    /**
     * Initialize the external controls logic
     * Called after the modal structure is injected into the DOM
     */
    function init() {
        const reelsBtn = document.querySelector('.reels-toggle');
        const globeBtn = document.querySelector('.globe-toggle');
        const bubble = document.querySelector('.control-bubble');

        if (!reelsBtn || !globeBtn || !bubble) return;

        // Force initial state: Both OFF
        reelsBtn.classList.remove('active');
        globeBtn.classList.remove('active');
        bubble.classList.remove('hidden');

        // REELS TOGGLE CLICK
        reelsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isActive = reelsBtn.classList.toggle('active');

            if (isActive) {
                // Mutual Exclusion: Turn Globe OFF
                globeBtn.classList.remove('active');
            }

            syncBubbleState(reelsBtn, globeBtn, bubble);
        });

        // GLOBE TOGGLE CLICK
        globeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isActive = globeBtn.classList.toggle('active');

            if (isActive) {
                // Mutual Exclusion: Turn Reels OFF
                reelsBtn.classList.remove('active');
            }

            syncBubbleState(reelsBtn, globeBtn, bubble);
        });
    }

    /**
     * Update bubble visibility based on toggle states
     * Bubble only appears when BOTH are off
     */
    function syncBubbleState(reelsBtn, globeBtn, bubble) {
        const isReelsOn = reelsBtn.classList.contains('active');
        const isGlobeOn = globeBtn.classList.contains('active');

        if (isReelsOn || isGlobeOn) {
            bubble.classList.add('hidden');
        } else {
            bubble.classList.remove('hidden');
        }
    }

    /**
     * Generate the HTML markup for the informational bubble
     */
    function createBubbleHTML() {
        return `
            <div class="control-bubble">
                <div class="ticker-viewport">
                    <div class="ticker-content">
                        🎬 Reference Media Content for this Product | 🌍 Available in Multiple Regions | &nbsp; &nbsp; &nbsp;
                        🎬 Reference Media Content for this Product | 🌍 Available in Multiple Regions
                    </div>
                </div>
            </div>
        `;
    }

    return {
        init: init,
        createBubbleHTML: createBubbleHTML
    };

})();
