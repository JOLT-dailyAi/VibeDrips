// clipboard-voyager.js - The "Warp Drive" logic for VibeDrips
// Handles reading clipboard content and triggering high-fidelity warps.

(function () {
    /**
     * Extracts parameters from a VibeDrips URL and triggers a warp.
     * @param {string} text - The clipboard text to process.
     */
    window.handleClipboardPaste = async function () {
        console.log('📋 Warp Drive: Assessing clipboard content...');

        try {
            // Force focus check (some browsers require the window to be focused)
            if (document.hasFocus && !document.hasFocus()) {
                console.warn('⚠️ Warp Drive: Window not focused, focusing now...');
                window.focus();
            }

            const text = await navigator.clipboard.readText();
            const sanitizedText = text.trim();

            console.log('📋 Warp Drive: Read text length:', sanitizedText.length);

            if (!sanitizedText) {
                showToast('📋 Clipboard is empty');
                return;
            }

            // 🔍 Extraction Logic: Use regex to find a VibeDrips URL inside the text
            const urlRegex = /(https?:\/\/(vibedrips\.github\.io|localhost|127\.0\.0\.1)[^\s<>"]+)|(web\+vibedrips:\/\/[^\s<>"]+)/i;
            const match = sanitizedText.match(urlRegex);

            if (!match) {
                console.warn('⚠️ Warp Drive: No valid VibeDrips URL found in text:', sanitizedText.substring(0, 50) + '...');
                showToast('❌ No VibeDrips link found');
                return;
            }

            const foundUrl = match[0];
            console.log('🚀 Warp Drive: Found VibeDrips URL:', foundUrl);

            // 🧩 Parsing Logic
            let urlObj;
            try {
                // Handle custom protocol if present
                const normalizedUrl = foundUrl.toLowerCase().startsWith('web+vibedrips://')
                    ? foundUrl.replace(/web\+vibedrips:\/\//i, 'https://')
                    : foundUrl;

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
                console.warn('⚠️ Warp Drive: ASIN missing in URL parameters.');
                showToast('❌ No Product ASIN found in link');
                return;
            }

            console.log(`🚀 Warp Drive: Success! Warping to ${asin} (${currency || 'default'})...`);

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
