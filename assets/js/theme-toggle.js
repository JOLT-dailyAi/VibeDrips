// theme-toggle.js - 3-way theme cycling with glass settings

console.log('🎨 Theme toggle module loading...');

// Theme state
const ThemeState = {
    current: 'glass', // 'light', 'dark', or 'glass'
    button: null
};

// Theme configurations
const themes = {
    light: {
        name: 'Light',
        icon: '☀️',
        next: 'dark'
    },
    dark: {
        name: 'Dark',
        icon: '🌙',
        next: 'glass'
    },
    glass: {
        name: 'Glass',
        icon: '💎',  // Diamond
        next: 'light',
        openPanel: true // Only glass opens panel
    }
};

// Initialize theme toggle
function setupThemeToggle() {
    console.log('🎨 Setting up theme toggle...');
    
    ThemeState.button = document.getElementById('theme-toggle');
    
    if (!ThemeState.button) {
        console.error('❌ Theme toggle button not found!');
        return;
    }
    
    // Load saved theme
    loadTheme();
    
    // Add click listener
    ThemeState.button.addEventListener('click', cycleTheme);
    
    console.log('✅ Theme toggle ready');
}

// Cycle through themes
function cycleTheme() {
    const currentTheme = ThemeState.current;
    const nextTheme = themes[currentTheme].next;
    
    console.log(`🎨 Cycling: ${currentTheme} → ${nextTheme}`);
    
    // If glass panel is open, close it
    if (window.GlassSettings && window.GlassSettings.isOpen) {
        window.closeGlassPanel();
    }
    
    // Apply next theme
    applyTheme(nextTheme);
}

// Apply theme
function applyTheme(themeName) {
    ThemeState.current = themeName;
    const theme = themes[themeName];
    
    console.log(`🎨 Applying theme: ${themeName}`);
    
    // Update body class
    document.body.className = ''; // Clear all theme classes
    if (themeName !== 'light') {
        document.body.classList.add(`${themeName}-theme`);
    }
    
    // Update button icon
    if (ThemeState.button) {
        ThemeState.button.textContent = theme.icon;
        ThemeState.button.setAttribute('aria-label', `Switch to ${themes[theme.next].name} theme`);
    }
    
    // Open glass panel if switching to glass
    if (theme.openPanel && window.openGlassPanel) {
        setTimeout(() => {
            window.openGlassPanel();
        }, 100); // Small delay for smooth transition
    }
    
    // Save theme preference
    saveTheme();
}

// Save theme to localStorage
function saveTheme() {
    try {
        localStorage.setItem('theme', ThemeState.current);
        console.log(`💾 Theme saved: ${ThemeState.current}`);
    } catch (error) {
        console.error('❌ Failed to save theme:', error);
    }
}

// Load theme from localStorage
function loadTheme() {
    try {
        const saved = localStorage.getItem('theme');
        
        if (saved && themes[saved]) {
            ThemeState.current = saved;
            console.log(`💾 Theme loaded: ${saved}`);
        } else {
            ThemeState.current = 'glass';
            console.log('💾 Using default theme: glass');
        }
        
        // Apply loaded theme (without opening panel)
        const theme = themes[ThemeState.current];
        
        // Update body class
        document.body.className = '';
        if (ThemeState.current !== 'light') {
            document.body.classList.add(`${ThemeState.current}-theme`);
        }
        
        // Update button icon
        if (ThemeState.button) {
            ThemeState.button.textContent = theme.icon;
        }
        
        // Don't open panel on page load, even if glass theme is saved
        
    } catch (error) {
        console.error('❌ Failed to load theme:', error);
        ThemeState.current = 'light';
    }
}

// Export functions
window.setupThemeToggle = setupThemeToggle;
window.applyTheme = applyTheme;
window.ThemeState = ThemeState;

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    setupThemeToggle();
});

console.log('✅ Theme toggle module loaded');
