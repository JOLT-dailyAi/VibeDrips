// share.js - Native share with clipboard fallback

console.log('📤 Share functionality loading...');

// Global share handler
function handleShare() {
    const shareData = {
        title: 'VibeDrips - Drops that Drip.',
        text: 'Curated digital finds and affiliate drops — aesthetic tools, festive picks, and everyday scroll-stoppers.',
        url: 'https://jolt-dailyai.github.io/VibeDrips/'
    };
    
    // Check if Web Share API is supported
    if (navigator.share) {
        navigator.share(shareData)
            .then(() => console.log('✅ Shared successfully'))
            .catch((error) => {
                if (error.name !== 'AbortError') {
                    console.log('❌ Share failed:', error);
                    fallbackCopyToClipboard(shareData.url);
                }
            });
    } else {
        // Fallback: copy to clipboard
        fallbackCopyToClipboard(shareData.url);
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

console.log('✅ Share functionality ready');
