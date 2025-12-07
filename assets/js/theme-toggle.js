// theme-toggle.js - EXACT COPY from main.js lines 86-104
function setupThemeToggle() {
    const body = document.body;
    const savedTheme = localStorage.getItem('theme') || 'light-theme';
    body.className = savedTheme;

    VibeDrips.elements.themeToggle.addEventListener('click', () => {
        if (body.classList.contains('light-theme')) {
            body.classList.remove('light-theme');
            body.classList.add('dark-theme');
        } else {
            body.classList.remove('dark-theme');
            body.classList.add('light-theme');
        }
        localStorage.setItem('theme', body.className);
        // Re-render products to apply new theme
        if (typeof filterProducts === 'function') {
            filterProducts();
        }
    });
}

// Export to global scope
window.setupThemeToggle = setupThemeToggle;
