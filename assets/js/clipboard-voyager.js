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
            const text = await navigator.clipboard.readText();
            const sanitizedText = text.trim();

            if (!sanitizedText) {
                showToast('📋 Clipboard is empty');
                return;
            }

            // 🔍 Validation: Check if it's a valid VibeDrips link
            // Supports: vibedrips.github.io, localhost, or custom deep-link formats
            const isVibeDrips = sanitizedText.includes('vibedrips.github.io') ||
                sanitizedText.includes('localhost') ||
                sanitizedText.startsWith('web+vibedrips://');

            if (!isVibeDrips) {
                console.warn('⚠️ Warp Drive: Invalid URL detected on clipboard.');
                showToast('❌ No VibeDrips link found');
                return;
            }

            // 🧩 Extraction Logic
            let urlObj;
            try {
                // Handle custom protocol if present
                const normalizedUrl = sanitizedText.startsWith('web+vibedrips://')
                    ? sanitizedText.replace('web+vibedrips://', 'https://')
                    : sanitizedText;

                urlObj = new URL(normalizedUrl);
            } catch (e) {
                showToast('❌ Invalid URL format');
                return;
            }

            const params = new URLSearchParams(urlObj.search);
            const asin = params.get('asin');
            const currency = params.get('currency');

            if (!asin) {
                showToast('❌ No Product ASIN found in link');
                return;
            }

            console.log(`🚀 Warp Drive: Valid link found! Warping to ${asin} (${currency || 'default'})...`);

            // 🎇 Trigger the High-Fidelity Sequence
            if (window.triggerHighFidelityWarp) {
                window.triggerHighFidelityWarp(currency, asin, false);
            } else if (window.ProductLoader && window.ProductLoader.openProductModal) {
                // Fallback for older context
                window.ProductLoader.openProductModal(asin);
            }

        } catch (err) {
            console.error('❌ Warp Drive: Clipboard access failed:', err);
            showToast('⚠️ Please allow paste permission');
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
