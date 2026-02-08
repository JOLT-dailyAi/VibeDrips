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

            // 🔍 EXTRACTION REGEX: Now supports jolt-dailyai, vibedrips.github.io, etc.
            // Simplified: Looks for github.io/VibeDrips or localhost with an ASIN
            const urlRegex = /((?:https?:\/\/)?(?:[a-z0-9-]+\.github\.io\/VibeDrips|localhost|127\.0\.0\.1)[^\s<>"]+)/i;
            const match = sanitizedText.match(urlRegex);

            if (!match) {
                console.warn('⚠️ Warp Drive: No valid VibeDrips URL found.');
                // Only show toast if explicitly requested via button/prompt click, not on auto-scan
                if (customText) showToast('❌ No VibeDrips link found');
                return;
            }

            const foundUrl = match[0];
            console.log('🚀 Warp Drive: Found URL:', foundUrl);

            // 🧩 Parsing Logic
            let urlObj;
            try {
                let normalizedUrl = foundUrl;
                if (!normalizedUrl.match(/^https?:\/\//i)) {
                    normalizedUrl = 'https://' + normalizedUrl;
                }
                urlObj = new URL(normalizedUrl);
            } catch (e) {
                if (customText) showToast('❌ Invalid URL format');
                return;
            }

            const params = new URLSearchParams(urlObj.search);
            const asin = params.get('asin');
            const currency = params.get('currency');

            if (!asin) {
                if (customText) showToast('❌ Link missing ASIN');
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

        // 1. Monitor Focus to offer Warp
        searchInput.addEventListener('focus', async () => {
            console.log('🔍 Search focused, checking clipboard...');
            try {
                // We don't want to show a toast every time they focus, 
                // just silently check if we should show the prompt.
                const text = await navigator.clipboard.readText();
                const sanitizedText = text.trim();

                // Broad check to see if it's even worth analyzing
                if (sanitizedText.includes('.github.io') || sanitizedText.includes('localhost')) {
                    showWarpPrompt(searchInput);
                }
            } catch (e) {
                // Silent fail for focus-check to avoid annoying the user
            }
        });

        // 2. Hide prompt on blur (with slight delay for click)
        searchInput.addEventListener('blur', () => {
            setTimeout(hideWarpPrompt, 200);
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

        // Style the prompt (inline for maximum containment)
        Object.assign(warpPromptElement.style, {
            position: 'absolute',
            top: '-45px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--glass-bg, rgba(255, 255, 255, 0.9))',
            backdropFilter: 'blur(10px)',
            padding: '8px 15px',
            borderRadius: '20px',
            border: '1px solid var(--glass-border, rgba(255, 255, 255, 0.3))',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
            fontSize: '13px',
            fontWeight: '600',
            color: 'var(--color-primary, #2E1D80)',
            cursor: 'pointer',
            zIndex: '1000',
            animation: 'warpFadeIn 0.3s ease-out forwards',
            whiteSpace: 'nowrap'
        });

        wrapper.appendChild(warpPromptElement);
    }

    function hideWarpPrompt() {
        if (warpPromptElement && warpPromptElement.parentNode) {
            warpPromptElement.parentNode.removeChild(warpPromptElement);
            warpPromptElement = null;
        }
    }

    // Helper to show toasts
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
            from { opacity: 0; transform: translate(-50%, 10px); }
            to { opacity: 1; transform: translate(-50%, 0); }
        }
        .warp-prompt-content:hover { transform: scale(1.05); transition: transform 0.2s; }
    `;
    document.head.appendChild(style);

    // Initial load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSearchIntegration);
    } else {
        initSearchIntegration();
    }

    console.log('✅ Search-Integrated Warp Drive ready');
})();
