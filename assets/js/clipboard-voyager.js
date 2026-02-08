// clipboard-voyager.js - Integrated Search-Warp Drive for VibeDrips
// Offers a "Paste & Warp" experience directly within the search interface.

(function () {
    let warpPromptElement = null;

    /**
     * Extracts parameters from a VibeDrips URL and triggers a warp.
     * @param {string} customText - Optional text to bypass clipboard read (for debugging).
     */
    window.handleClipboardPaste = async function (customText = null) {
        console.log('📋 Warp Drive: Assessing content...');

        try {
            const text = customText || await navigator.clipboard.readText();
            const sanitizedText = text.trim();

            if (!sanitizedText) return;

            // 🔍 EXTRACTION REGEX: Robust detection across all known domains
            const urlRegex = /((?:https?:\/\/)?(?:[a-z0-9-]+\.github\.io|localhost|127\.0\.0\.1|vibedrips\.com)[^\s<>"]+(?:\?|&)asin=[A-Z0-9]{10}[^\s<>"]*)/i;
            const match = sanitizedText.match(urlRegex);

            if (!match) {
                console.warn('⚠️ Warp Drive: No valid VibeDrips link found on clipboard.');
                if (customText || document.activeElement === document.getElementById('search')) {
                    showToast('❌ No VibeDrips link found on clipboard');
                }
                return;
            }

            const foundUrl = match[0];
            console.log('🚀 Warp Drive: Detected URL:', foundUrl);

            // 🧩 Parsing Logic
            let urlObj;
            try {
                let normalizedUrl = foundUrl;
                if (!normalizedUrl.match(/^https?:\/\//i)) {
                    normalizedUrl = 'https://' + normalizedUrl;
                }
                urlObj = new URL(normalizedUrl);
            } catch (e) {
                console.error('❌ Warp Drive: Parsing failed:', e);
                return;
            }

            const params = new URLSearchParams(urlObj.search);
            const asin = params.get('asin');
            const currency = params.get('currency');

            if (!asin) {
                console.warn('⚠️ Warp Drive: No ASIN detected in URL.');
                return;
            }

            console.log(`🚀 Warp Drive: Success! Warping to ${asin}...`);
            hideWarpPrompt();
            showToast('🚀 Launching Warp Drive...');

            if (window.triggerHighFidelityWarp) {
                window.triggerHighFidelityWarp(currency, asin, false);
            } else if (window.ProductLoader && window.ProductLoader.openProductModal) {
                window.ProductLoader.openProductModal(asin);
            }
        } catch (err) {
            console.error('❌ Warp Drive Error:', err);
        }
    };

    /**
     * Initializes the search bar integration.
     */
    function initSearchIntegration() {
        const searchInput = document.getElementById('search');
        if (!searchInput) return;

        console.log('🔍 Warp Drive: Integrating with Search Bar...');

        const checkAndPrompt = async () => {
            console.log('🔍 Warp Drive: Scanning clipboard...');
            try {
                // Check if browser allows clipboard access
                const text = await navigator.clipboard.readText();
                const sanitizedText = text.trim();

                // Broad check for VibeDrips-related domains
                const isRelevant = sanitizedText.includes('.github.io') ||
                    sanitizedText.includes('localhost') ||
                    sanitizedText.includes('jolt-dailyai');

                if (isRelevant) {
                    showWarpPrompt(searchInput);
                }
            } catch (e) {
                console.warn('⚠️ Warp Drive: Clipboard access restricted:', e.message);
                // On Safari/iOS, we often can only read on CLICK, so we rely on that fallback.
            }
        };

        // Trigger on both focus and click for maximum compatibility
        searchInput.addEventListener('focus', checkAndPrompt);
        searchInput.addEventListener('click', checkAndPrompt);

        // Hide on blur
        searchInput.addEventListener('blur', () => {
            setTimeout(hideWarpPrompt, 400); // Slightly longer delay to allow click to register
        });
    }

    /**
     * Displays the floating Warp prompt above the search bar.
     */
    function showWarpPrompt(anchor) {
        if (warpPromptElement) return;

        const wrapper = anchor.closest('.search-wrapper');
        if (!wrapper) return;

        warpPromptElement = document.createElement('div');
        warpPromptElement.className = 'warp-drive-prompt';
        warpPromptElement.innerHTML = `
            <div class="warp-prompt-content" onclick="window.handleClipboardPaste()">
                <span>🚀 Warp to copied link?</span>
            </div>
        `;

        // Style the prompt (inline to avoid CSS dependencies)
        Object.assign(warpPromptElement.style, {
            position: 'absolute',
            top: '-50px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '10px 18px',
            borderRadius: '25px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: 'pointer',
            zIndex: '999999', // Ensure it stays on top of everything
            animation: 'warpFadeIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
            whiteSpace: 'nowrap',
            border: 'none'
        });

        wrapper.appendChild(warpPromptElement);
    }

    function hideWarpPrompt() {
        if (warpPromptElement && warpPromptElement.parentNode) {
            warpPromptElement.parentNode.removeChild(warpPromptElement);
            warpPromptElement = null;
        }
    }

    // Site-wide Toast Helper
    function showToast(message) {
        const toast = document.getElementById('toast-notification');
        if (!toast) return;
        toast.textContent = message;
        toast.classList.remove('hidden');
        toast.classList.add('visible');
        setTimeout(() => {
            toast.classList.remove('visible');
            setTimeout(() => toast.classList.add('hidden'), 300);
        }, 3000);
    }

    // Add necessary animation to document
    const style = document.createElement('style');
    style.textContent = `
        @keyframes warpFadeIn {
            from { opacity: 0; transform: translate(-50%, 15px) scale(0.9); }
            to { opacity: 1; transform: translate(-50%, 0) scale(1); }
        }
    `;
    document.head.appendChild(style);

    // Initial load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSearchIntegration);
    } else {
        initSearchIntegration();
    }

    console.log('✅ Search-Warp Drive ready (v2)');
})();
