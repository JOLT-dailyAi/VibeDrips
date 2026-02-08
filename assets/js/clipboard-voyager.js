// clipboard-voyager.js - Controlled Search-Warp & Paste for VibeDrips
// Offers a dynamic "Warp" or "Paste" experience directly within the search bar.

(function () {
    let activePromptElement = null;

    /**
     * Extracts parameters from a VibeDrips URL and triggers a high-fidelity warp.
     */
    async function triggerWarpAction() {
        console.log('🚀 Warp Drive: Initiating launch sequence...');
        try {
            const text = await navigator.clipboard.readText();
            const sanitizedText = text.trim();

            // 🔍 Re-validate before warp to ensure no race conditions
            const urlRegex = /((?:https?:\/\/)?(?:[a-z0-9-]+\.github\.io|localhost|127\.0\.0\.1|vibedrips\.com)[^\s<>"]+(?:\?|&)asin=[A-Z0-9]{10}[^\s<>"]*)/i;
            const match = sanitizedText.match(urlRegex);

            if (!match) {
                showToast('❌ No VibeDrips link found on clipboard');
                return;
            }

            const foundUrl = match[0];
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

            if (!asin) return;

            console.log(`🚀 Warp Drive: Warping to ${asin}...`);
            hidePrompt();
            showToast('🚀 Launching Warp Drive...');

            if (window.triggerHighFidelityWarp) {
                window.triggerHighFidelityWarp(currency, asin, false);
            } else if (window.ProductLoader && window.ProductLoader.openProductModal) {
                window.ProductLoader.openProductModal(asin);
            }
        } catch (err) {
            console.error('❌ Warp Drive Error:', err);
        }
    }

    /**
     * Pastes general clipboard content into the search bar and triggers filtering.
     */
    async function triggerPasteAction() {
        console.log('📋 Search: Pasting from clipboard...');
        try {
            const text = await navigator.clipboard.readText();
            const searchInput = document.getElementById('search');

            if (searchInput && text) {
                searchInput.value = text.trim();
                hidePrompt();

                // Trigger the search logic
                if (typeof window.filterProducts === 'function') {
                    window.filterProducts();
                } else if (searchInput.oninput) {
                    searchInput.oninput();
                }

                showToast('📋 Pasted & Filtered');
            }
        } catch (err) {
            console.error('❌ Paste Error:', err);
            showToast('⚠️ Please allow paste permission');
        }
    }

    /**
     * Initializes the search bar integration.
     */
    function initSearchIntegration() {
        const searchInput = document.getElementById('search');
        if (!searchInput) return;

        console.log('🔍 Warp Drive: Integrating with Search Bar...');

        const checkAndPrompt = async () => {
            console.log('🔍 Search Focused: Checking clipboard...');
            try {
                const text = await navigator.clipboard.readText();
                const sanitizedText = text.trim();

                if (!sanitizedText) return;

                // 🔍 Detect if it's a VibeDrips link
                const isWarpLink = /((?:https?:\/\/)?(?:[a-z0-9-]+\.github\.io|localhost|127\.0\.0\.1|vibedrips\.com)[^\s<>"]+(?:\?|&)asin=[A-Z0-9]{10}[^\s<>"]*)/i.test(sanitizedText);

                showControlledPrompt(searchInput, isWarpLink);

            } catch (e) {
                console.warn('⚠️ Clipboard access restricted:', e.message);
            }
        };

        searchInput.addEventListener('focus', checkAndPrompt);
        searchInput.addEventListener('click', checkAndPrompt);

        // Hide on blur with enough delay for click
        searchInput.addEventListener('blur', () => {
            setTimeout(hidePrompt, 400);
        });
    }

    /**
     * Displays the contextual prompt.
     */
    function showControlledPrompt(anchor, isWarp) {
        if (activePromptElement) hidePrompt();

        const wrapper = anchor.closest('.search-wrapper');
        if (!wrapper) return;

        activePromptElement = document.createElement('div');
        activePromptElement.className = 'search-clipboard-prompt';

        const label = isWarp ? '🚀 Warp to copied link?' : '📋 Paste from clipboard?';
        const action = isWarp ? triggerWarpAction : triggerPasteAction;

        activePromptElement.innerHTML = `<span>${label}</span>`;
        activePromptElement.onclick = action;

        // Visual Styling
        Object.assign(activePromptElement.style, {
            position: 'absolute',
            top: '-50px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: isWarp
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                : 'linear-gradient(135deg, #2E1D80 0%, #4a34c2 100%)',
            color: 'white',
            padding: '10px 18px',
            borderRadius: '25px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            fontSize: '13px',
            fontWeight: 'bold',
            cursor: 'pointer',
            zIndex: '999999',
            animation: 'promptSlideIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
            whiteSpace: 'nowrap',
            border: 'none'
        });

        wrapper.appendChild(activePromptElement);
    }

    function hidePrompt() {
        if (activePromptElement && activePromptElement.parentNode) {
            activePromptElement.parentNode.removeChild(activePromptElement);
            activePromptElement = null;
        }
    }

    // Helper: Toast
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

    // Styles
    const style = document.createElement('style');
    style.textContent = `
        @keyframes promptSlideIn {
            from { opacity: 0; transform: translate(-50%, 15px) scale(0.95); }
            to { opacity: 1; transform: translate(-50%, 0) scale(1); }
        }
        .search-clipboard-prompt:hover {
            transform: translate(-50%, -2px) scale(1.05) !important;
            box-shadow: 0 12px 30px rgba(0,0,0,0.3) !important;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
    `;
    document.head.appendChild(style);

    // Initial Load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSearchIntegration);
    } else {
        initSearchIntegration();
    }

    console.log('✅ Controlled Search-Warp & Paste ready');
})();
