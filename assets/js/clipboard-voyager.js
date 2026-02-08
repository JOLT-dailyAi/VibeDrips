// clipboard-voyager.js - Future-Proof Intelligent Warp for VibeDrips
// Handles domain-agnostic ASIN detection, Amazon support, and raw code matching.

(function () {
    let activePromptElement = null;
    let lastMatchedData = null; // Stores { asin, currency, view } for the current prompt session

    /**
     * Extracts parameters and triggers a high-fidelity warp.
     */
    async function triggerWarpAction() {
        if (!lastMatchedData || !lastMatchedData.asin) return;

        const { asin, currency, view } = lastMatchedData;
        const finalCurrency = currency || (window.VibeDrips && window.VibeDrips.currentCurrency) || 'INR';
        const finalView = view || 'reel';

        console.log(`🚀 Warp Drive: Launching to ${asin} (${finalCurrency})...`);
        hidePrompt();
        showToast('🚀 Launching Warp Drive...');

        if (window.triggerHighFidelityWarp) {
            window.triggerHighFidelityWarp(finalCurrency, asin, false);
        } else if (window.ProductLoader && window.ProductLoader.openProductModal) {
            window.ProductLoader.openProductModal(asin);
        }
    }

    /**
     * Pastes general clipboard content into the search bar.
     */
    async function triggerPasteAction() {
        try {
            const text = await navigator.clipboard.readText();
            const searchInput = document.getElementById('search');

            if (searchInput && text) {
                searchInput.value = text.trim();
                hidePrompt();
                if (typeof window.filterProducts === 'function') window.filterProducts();
                showToast('📋 Pasted & Filtered');
            }
        } catch (err) {
            console.error('❌ Paste Error:', err);
        }
    }

    /**
     * Core detection logic: Finds ASINs in URLs or raw text.
     */
    async function checkClipboard() {
        try {
            const text = await navigator.clipboard.readText();
            const sanitizedText = text.trim();
            if (!sanitizedText) return null;

            // 1. URL-based ASIN extraction (Domain agnostic)
            // Matches any domain, localhost, or relative path with ?asin= or /dp/ pattern
            const urlPatterns = [
                /[?&]asin=([A-Z0-9]{10})/i,
                /\/dp\/([A-Z0-9]{10})/i,
                /\/product\/([A-Z0-9]{10})/i
            ];

            for (const pattern of urlPatterns) {
                const match = sanitizedText.match(pattern);
                if (match) {
                    const asin = match[1].toUpperCase();
                    // Try to extract currency and view if it's a VibeDrips-style link
                    const urlObj = sanitizedText.startsWith('/') ? new URL(sanitizedText, window.location.origin) : (sanitizedText.match(/^https?:\/\//i) ? new URL(sanitizedText) : null);
                    let currency = null;
                    let view = 'reel';

                    if (urlObj) {
                        const params = urlObj.searchParams;
                        currency = params.get('currency');
                        view = params.get('view') || 'reel';
                    }

                    // Verification: Does this ASIN actually exist in our DB?
                    const product = findProductInDb(asin);
                    if (product) {
                        return { asin, currency: currency || product.currency, view, type: 'warp' };
                    }
                    // If it's an amazon/external link with a valid ASIN, we still warp if we have it
                    if (product) return { asin, currency: product.currency, view: 'reel', type: 'warp' };
                }
            }

            // 2. Raw ASIN Detection (exactly 10 chars, alphanumeric)
            const rawAsinMatch = sanitizedText.match(/^[A-Z0-9]{10}$/i);
            if (rawAsinMatch) {
                const asin = rawAsinMatch[0].toUpperCase();
                const product = findProductInDb(asin);
                if (product) {
                    return { asin, currency: product.currency, view: 'reel', type: 'warp' };
                }
            }

            // 3. Fallback to General Paste
            return { type: 'paste' };

        } catch (e) {
            console.warn('⚠️ Clipboard check failed:', e);
            return null;
        }
    }

    function findProductInDb(asin) {
        if (!window.VibeDrips || !window.VibeDrips.allProducts) return null;
        return window.VibeDrips.allProducts.find(p => p.asin === asin);
    }

    /**
     * UI Integration
     */
    function initSearchIntegration() {
        const searchInput = document.getElementById('search');
        if (!searchInput) return;

        const handleFocus = async () => {
            const result = await checkClipboard();
            if (result) {
                lastMatchedData = result;
                showControlledPrompt(searchInput, result.type === 'warp');
            }
        };

        searchInput.addEventListener('focus', handleFocus);
        searchInput.addEventListener('click', handleFocus);
        searchInput.addEventListener('blur', () => setTimeout(hidePrompt, 400));
    }

    function showControlledPrompt(anchor, isWarp) {
        if (activePromptElement) hidePrompt();
        const wrapper = anchor.closest('.search-wrapper');
        if (!wrapper) return;

        activePromptElement = document.createElement('div');
        activePromptElement.className = 'search-clipboard-prompt';
        activePromptElement.innerHTML = `<span>${isWarp ? '🚀 Warp to copied product?' : '📋 Paste from clipboard?'}</span>`;
        activePromptElement.onclick = isWarp ? triggerWarpAction : triggerPasteAction;

        Object.assign(activePromptElement.style, {
            position: 'absolute', top: '-50px', left: '50%', transform: 'translateX(-50%)',
            background: isWarp ? 'linear-gradient(135deg, #FF3366 0%, #BA2649 100%)' : 'linear-gradient(135deg, #2E1D80 0%, #4a34c2 100%)',
            color: 'white', padding: '10px 18px', borderRadius: '25px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', zIndex: '999999',
            animation: 'promptSlideIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards', whiteSpace: 'nowrap'
        });

        wrapper.appendChild(activePromptElement);
    }

    function hidePrompt() {
        if (activePromptElement && activePromptElement.parentNode) {
            activePromptElement.parentNode.removeChild(activePromptElement);
            activePromptElement = null;
        }
    }

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

    const style = document.createElement('style');
    style.textContent = `@keyframes promptSlideIn { from { opacity:0; transform:translate(-50%,15px) scale(0.95); } to { opacity:1; transform:translate(-50%,0) scale(1); } }`;
    document.head.appendChild(style);

    if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', initSearchIntegration); } else { initSearchIntegration(); }
    console.log('✅ Future-Proof Intelligent Warp ready');
})();
