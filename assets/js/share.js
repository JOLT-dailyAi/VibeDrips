// share.js - Native share with clipboard fallback

console.log('📤 Share functionality loading...');

// Global share handler
function handleShare(options = {}) {
    const { asin, currency, view } = options;

    // Base site URL
    let siteUrl = 'https://jolt-dailyai.github.io/VibeDrips/';

    // 🔗 PHASE_25: Construct deep-link if parameters are provided
    if (asin && currency) {
        const params = new URLSearchParams();
        params.set('asin', asin);
        params.set('currency', currency);
        if (view) params.set('view', view);
        siteUrl += `?${params.toString()}`;
    }

    const tagline = 'Curated digital finds and affiliate drops — aesthetic tools, festive picks, and everyday scroll-stoppers.';

    // Formatted text for clipboard: JUST the URL to prevent redundancy with preview card
    const formattedShareText = `${siteUrl}`;

    const shareData = {
        title: 'VibeDrips - Drops that Drip.',
        text: '', // Empty text to let metadata preview card handle the description
        url: siteUrl
    };

    // 📋 Step 1: Mandatory Pre-emptive Copy
    console.log('📋 Pre-emptive Copy: Setting clipboard data...');
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(formattedShareText)
            .then(() => {
                showToast('✓ Link copied to clipboard!');
                console.log(`✅ Formatted content copied to clipboard: ${siteUrl}`);

                // 📤 Step 2: Native Share (Delayed slightly for clipboard process to settle)
                setTimeout(() => initiateNativeShare(shareData), 100);
            })
            .catch(err => {
                console.error('❌ Pre-emptive copy failed:', err);
                initiateNativeShare(shareData); // Continue to share even if copy fails
            });
    } else {
        // Simple fallback if clipboard API is restricted
        initiateNativeShare(shareData);
    }
}

// Native share helper
function initiateNativeShare(shareData) {
    if (navigator.share) {
        navigator.share(shareData)
            .then(() => console.log('✅ Shared successfully'))
            .catch((error) => {
                if (error.name !== 'AbortError') {
                    console.log('❌ Share failed:', error);
                    // Fallback already handled by pre-emptive copy, 
                    // but we can re-trigger if needed for older browsers
                }
            });
    }
}

// Fallback: Copy URL to clipboard
function fallbackCopyToClipboard(url) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url)
            .then(() => {
                showToast('✓ Link copied to clipboard!');
                console.log('✅ URL copied to clipboard');
            })
            .catch(err => {
                console.error('❌ Clipboard copy failed:', err);
                showToast('❌ Could not copy link');
            });
    } else {
        // Older fallback method
        const textArea = document.createElement('textarea');
        textArea.value = url;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
            document.execCommand('copy');
            showToast('✓ Link copied to clipboard!');
            console.log('✅ URL copied to clipboard (fallback method)');
        } catch (err) {
            console.error('❌ Fallback copy failed:', err);
            showToast('❌ Could not copy link');
        }

        document.body.removeChild(textArea);
    }
}

// Show toast notification
function showToast(message) {
    const toast = document.getElementById('toast-notification');
    if (!toast) return;

    toast.textContent = message;
    toast.classList.remove('hidden');
    toast.classList.add('visible');

    setTimeout(() => {
        toast.classList.remove('visible');
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 300);
    }, 3000);
}

// 📱 PHASE_25: Unified Deep-Link PWA Nudge
window.showDeepLinkNudge = function () {
    // 🛡️ Safety Check: Suppress nudge if ALREADY in PWA
    if (window.VibeDrips && window.VibeDrips.isStandalone()) {
        console.log('📱 PWA Detection: Already in Standalone mode, suppressing nudge.');
        return;
    }

    const existing = document.querySelector('.deeplink-nudge');
    if (existing) return;

    // 🏷️ Label Logic: Default to INSTALL. 
    // Only show OPEN if we have high confidence it's installed (history).
    const hasHistoryOfInstall = localStorage.getItem('vibedrips_pwa_installed') === 'true';
    const btnLabel = hasHistoryOfInstall ? 'OPEN' : 'INSTALL';

    const nudge = document.createElement('div');
    nudge.className = 'deeplink-nudge';
    nudge.innerHTML = `
        <div class="nudge-content">
            <span>✨ Open in VibeDrips App for a smoother experience</span>
            <button class="nudge-btn" onclick="if(window.handleInstall) window.handleInstall(); this.closest('.deeplink-nudge').classList.remove('visible');">${btnLabel}</button>
        </div>
    `;

    document.body.appendChild(nudge);

    // Animate in
    requestAnimationFrame(() => {
        nudge.classList.add('visible');
    });

    // Auto-hide after 10 seconds
    setTimeout(() => {
        nudge.classList.remove('visible');
        setTimeout(() => nudge.remove(), 600);
    }, 10000);
};

console.log('✅ Share functionality ready');
