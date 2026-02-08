// clipboard-voyager.js - The "Warp Drive" logic for VibeDrips
// Handles reading clipboard content and triggering high-fidelity warps.

(function () {
    /**
     * Extracts parameters from a VibeDrips URL and triggers a warp.
     */
    window.handleClipboardPaste = async function () {
        console.log('📋 Warp Drive: Assessing clipboard content...');
        showToast('🔍 Reading Clipboard...');

        try {
            // Artificial delay to ensure OS clipboard buffer is ready
            await new Promise(resolve => setTimeout(resolve, 300));

            const text = await navigator.clipboard.readText();
            const sanitizedText = text.trim();

            console.log('📋 Warp Drive: Raw text length:', sanitizedText.length);

            if (!sanitizedText) {
                showToast('📋 Clipboard is empty');
                return;
            }

            // 🔍 Extraction Logic: More forgiving regex (protocol optional)
            // Finds vibedrips.github.io, localhost, or web+vibedrips protocol
            const urlRegex = /((?:https?:\/\/)?(?:vibedrips\.github\.io|localhost|127\.0\.0\.1)[^\s<>"]+)|(web\+vibedrips:\/\/[^\s<>"]+)/i;
            const match = sanitizedText.match(urlRegex);

            if (!match) {
                console.warn('⚠️ Warp Drive: No valid VibeDrips URL found.');
                const snippet = sanitizedText.substring(0, 15);
                showToast(`❌ No VibeDrips link found in: "${snippet}..."`);
                return;
            }

            let foundUrl = match[0];
            console.log('🚀 Warp Drive: Found URL Candidate:', foundUrl);

            // 🧩 Parsing Logic
            let urlObj;
            try {
                // Ensure a protocol exists for URL constructor
                let normalizedUrl = foundUrl;
                if (normalizedUrl.toLowerCase().startsWith('web+vibedrips://')) {
                    normalizedUrl = normalizedUrl.replace(/web\+vibedrips:\/\//i, 'https://');
                } else if (!normalizedUrl.match(/^https?:\/\//i)) {
                    normalizedUrl = 'https://' + normalizedUrl;
                }

                urlObj = new URL(normalizedUrl);
            } catch (e) {
                console.error('❌ Warp Drive: URL parsing failed for:', foundUrl);
                showToast('❌ Invalid URL format');
                return;
            }

            const params = new URLSearchParams(urlObj.search);
            const asin = params.get('asin');
            const currency = params.get('currency');

            if (!asin) {
                console.warn('⚠️ Warp Drive: ASIN missing.');
                showToast('❌ Link is missing ASIN parameter');
                return;
            }

            console.log(`🚀 Warp Drive: Success! Warping to ${asin}...`);
            showToast('🚀 Launching Warp Drive...');

            // 🎇 Trigger the High-Fidelity Sequence
            if (window.triggerHighFidelityWarp) {
                window.triggerHighFidelityWarp(currency, asin, false);
            } else if (window.ProductLoader && window.ProductLoader.openProductModal) {
                window.ProductLoader.openProductModal(asin);
            } else {
                console.error('❌ Warp Drive: No warp trigger function found.');
                showToast('❌ System not ready for warp');
            }

        } catch (err) {
            console.error('❌ Warp Drive: Clipboard access failed:', err);
            // Handle specific browser error cases
            if (err.name === 'NotAllowedError') {
                showToast('⚠️ Please allow paste permission');
            } else {
                showToast('❌ Clipboard access denied');
            }
        }
    };

    // Helper to show toasts (synchronized with site style)
    function showToast(message) {
        const toast = document.getElementById('toast-notification');
        if (!toast) {
            console.log('Toast:', message);
            return;
        }

        toast.textContent = message;
        toast.classList.remove('hidden');
        toast.classList.add('visible');

        setTimeout(() => {
            toast.classList.remove('visible');
            setTimeout(() => toast.classList.add('hidden'), 300);
        }, 3000);
    }

    console.log('✅ Clipboard Voyager (Warp Drive) ready');
})();
