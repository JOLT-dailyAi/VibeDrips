// glass-settings.js - Glass morphism settings panel

console.log('🪟 Glass settings module loading...');

// Glass settings state
const GlassSettings = {
    panel: null,
    sliders: {},
    autoCloseTimer: null,
    isOpen: false,
    
    // Default preset values
    preset: {
        blur: 5,
        refraction: 0.15,
        depth: 0
    },
    
    // Current values
    current: {
        blur: 5,
        refraction: 0.15,
        depth: 0
    }
};

// Initialize glass settings
function initGlassSettings() {
    console.log('🪟 Initializing glass settings...');
    
    // Get panel element
    GlassSettings.panel = document.getElementById('glass-settings-panel');
    
    if (!GlassSettings.panel) {
        console.error('❌ Glass settings panel not found!');
        return;
    }
    
    // Get slider elements
    GlassSettings.sliders = {
        blur: document.getElementById('glass-blur-slider'),
        refraction: document.getElementById('glass-refraction-slider'),
        depth: document.getElementById('glass-depth-slider')
    };
    
    // Load saved settings or use defaults
    loadGlassSettings();
    
    // Setup event listeners
    setupGlassEventListeners();
    
    console.log('✅ Glass settings initialized');
}

// Setup event listeners
function setupGlassEventListeners() {
    // Close button
    const closeBtn = document.getElementById('glass-panel-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeGlassPanel);
    }
    
    // Reset button (panel title)
    const titleBtn = document.getElementById('glass-panel-title');
    if (titleBtn) {
        titleBtn.addEventListener('click', resetGlassToPreset);
    }
    
    // Slider inputs
    if (GlassSettings.sliders.blur) {
        GlassSettings.sliders.blur.addEventListener('input', (e) => {
            updateGlassValue('blur', parseFloat(e.target.value));
        });
    }
    
    if (GlassSettings.sliders.refraction) {
        GlassSettings.sliders.refraction.addEventListener('input', (e) => {
            updateGlassValue('refraction', parseFloat(e.target.value));
        });
    }
    
    if (GlassSettings.sliders.depth) {
        GlassSettings.sliders.depth.addEventListener('input', (e) => {
            updateGlassValue('depth', parseFloat(e.target.value));
        });
    }
    
    // ESC key to close
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && GlassSettings.isOpen) {
            closeGlassPanel();
        }
    });
}

// Open glass settings panel
function openGlassPanel() {
    if (!GlassSettings.panel) return;
    
    console.log('🪟 Opening glass panel');
    
    GlassSettings.panel.classList.add('visible');
    GlassSettings.isOpen = true;
    
    // Start auto-close timer
    startAutoCloseTimer();
}

// Close glass settings panel
function closeGlassPanel() {
    if (!GlassSettings.panel) return;
    
    console.log('🪟 Closing glass panel');
    
    GlassSettings.panel.classList.remove('visible');
    GlassSettings.isOpen = false;
    
    // Clear auto-close timer
    clearAutoCloseTimer();
    
    // Save settings
    saveGlassSettings();
}

// Update glass value
function updateGlassValue(property, value) {
    GlassSettings.current[property] = value;
    
    // Update display
    const displayElement = document.getElementById(`glass-${property}-value`);
    if (displayElement) {
        displayElement.textContent = value;
    }
    
    // Update CSS variable
    applyGlassSettings();
    
    // Reset auto-close timer (keeps panel open while adjusting)
    startAutoCloseTimer();
    
    console.log(`🪟 ${property}: ${value}`);
}

// Apply glass settings to CSS variables
function applyGlassSettings() {
    const root = document.documentElement;
    
    root.style.setProperty('--glass-blur', `${GlassSettings.current.blur}px`);
    root.style.setProperty('--glass-refraction', GlassSettings.current.refraction);
    root.style.setProperty('--glass-depth', `${GlassSettings.current.depth}px`);
}

// Reset to preset values
function resetGlassToPreset() {
    console.log('🪟 Resetting to preset');
    
    GlassSettings.current = { ...GlassSettings.preset };
    
    // Update sliders
    if (GlassSettings.sliders.blur) {
        GlassSettings.sliders.blur.value = GlassSettings.preset.blur;
    }
    if (GlassSettings.sliders.refraction) {
        GlassSettings.sliders.refraction.value = GlassSettings.preset.refraction;
    }
    if (GlassSettings.sliders.depth) {
        GlassSettings.sliders.depth.value = GlassSettings.preset.depth;
    }
    
    // Update displays
    document.getElementById('glass-blur-value').textContent = GlassSettings.preset.blur;
    document.getElementById('glass-refraction-value').textContent = GlassSettings.preset.refraction;
    document.getElementById('glass-depth-value').textContent = GlassSettings.preset.depth;
    
    // Apply changes
    applyGlassSettings();
    
    // Save
    saveGlassSettings();
}

// Save settings to localStorage
function saveGlassSettings() {
    try {
        localStorage.setItem('glassSettings', JSON.stringify(GlassSettings.current));
        console.log('💾 Glass settings saved');
    } catch (error) {
        console.error('❌ Failed to save glass settings:', error);
    }
}

// Load settings from localStorage
function loadGlassSettings() {
    try {
        const saved = localStorage.getItem('glassSettings');
        
        if (saved) {
            GlassSettings.current = JSON.parse(saved);
            console.log('💾 Glass settings loaded:', GlassSettings.current);
        } else {
            GlassSettings.current = { ...GlassSettings.preset };
            console.log('💾 Using default glass settings');
        }
        
        // Update sliders
        if (GlassSettings.sliders.blur) {
            GlassSettings.sliders.blur.value = GlassSettings.current.blur;
        }
        if (GlassSettings.sliders.refraction) {
            GlassSettings.sliders.refraction.value = GlassSettings.current.refraction;
        }
        if (GlassSettings.sliders.depth) {
            GlassSettings.sliders.depth.value = GlassSettings.current.depth;
        }
        
        // Update displays
        const blurDisplay = document.getElementById('glass-blur-value');
        const refractionDisplay = document.getElementById('glass-refraction-value');
        const depthDisplay = document.getElementById('glass-depth-value');
        
        if (blurDisplay) blurDisplay.textContent = GlassSettings.current.blur;
        if (refractionDisplay) refractionDisplay.textContent = GlassSettings.current.refraction;
        if (depthDisplay) depthDisplay.textContent = GlassSettings.current.depth;
        
        // Apply settings
        applyGlassSettings();
        
    } catch (error) {
        console.error('❌ Failed to load glass settings:', error);
        GlassSettings.current = { ...GlassSettings.preset };
    }
}

// Start auto-close timer
function startAutoCloseTimer() {
    clearAutoCloseTimer();
    
    GlassSettings.autoCloseTimer = setTimeout(() => {
        console.log('⏰ Auto-closing glass panel');
        closeGlassPanel();
    }, 7000); // 7 seconds
}

// Clear auto-close timer
function clearAutoCloseTimer() {
    if (GlassSettings.autoCloseTimer) {
        clearTimeout(GlassSettings.autoCloseTimer);
        GlassSettings.autoCloseTimer = null;
    }
}

// Export functions to global scope
window.initGlassSettings = initGlassSettings;
window.openGlassPanel = openGlassPanel;
window.closeGlassPanel = closeGlassPanel;
window.GlassSettings = GlassSettings;

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    initGlassSettings();
});

console.log('✅ Glass settings module loaded');
