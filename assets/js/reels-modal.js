// assets/js/reels-modal.js - Reels Modal (TEST)

console.log('🎬 Reels modal module loading...');

// TEST DATA - Replace with actual CSV data later
const REELS_DATA = {
  reels: [
    {
      id: 'reel1',
      instagramUrl: 'https://www.instagram.com/reel/DNgI781ReJo/',
      embedCode: `<blockquote class="instagram-media" data-instgrm-captioned data-instgrm-permalink="https://www.instagram.com/reel/DNgI781ReJo/?utm_source=ig_embed&amp;utm_campaign=loading" data-instgrm-version="14" style=" background:#FFF; border:0; border-radius:3px; box-shadow:0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15); margin: 1px; max-width:540px; min-width:326px; padding:0; width:99.375%; width:-webkit-calc(100% - 2px); width:calc(100% - 2px);"></blockquote>`,
      productIds: ['B0BQHTML8D'] // Test with your actual product ID
    }
  ]
};

// Open reels modal
function openReelsModal() {
  console.log('🎬 Opening reels modal...');
  
  const modal = document.getElementById('reels-modal');
  if (!modal) {
    console.error('❌ Reels modal not found');
    return;
  }
  
  // Show modal
  modal.classList.remove('hidden');
  
  // Load first reel (test)
  loadReel(REELS_DATA.reels[0]);
  
  console.log('✅ Reels modal opened');
}

// Close reels modal
function closeReelsModal() {
  console.log('🎬 Closing reels modal...');
  
  const modal = document.getElementById('reels-modal');
  if (modal) {
    modal.classList.add('hidden');
  }
}

// Load a reel with products
function loadReel(reelData) {
  console.log('📺 Loading reel:', reelData.id);
  
  // Load Instagram embed
  const embedContainer = document.getElementById('instagram-embed-container');
  if (embedContainer) {
    embedContainer.innerHTML = reelData.embedCode;
    
    // Load Instagram embed script
    if (window.instgrm) {
      window.instgrm.Embeds.process();
    } else {
      const script = document.createElement('script');
      script.async = true;
      script.src = '//www.instagram.com/embed.js';
      document.body.appendChild(script);
    }
  }
  
  // Load products
  const productsContainer = document.getElementById('reel-products');
  if (productsContainer) {
    productsContainer.innerHTML = '';
    
    // Find products by IDs
    reelData.productIds.forEach(productId => {
      const product = findProductById(productId);
      if (product) {
        const productCard = createReelProductCard(product);
        productsContainer.appendChild(productCard);
      }
    });
  }
}

// Find product by ID (uses global VibeDrips.allProducts)
function findProductById(productId) {
  if (!window.VibeDrips || !window.VibeDrips.allProducts) {
    console.warn('⚠️ VibeDrips.allProducts not available yet');
    return null;
  }
  
  // Try to find by ASIN first, then by id
  return window.VibeDrips.allProducts.find(p => 
    p.asin === productId || p.id === productId
  );
}

// Create mini product card for reels
function createReelProductCard(product) {
  const card = document.createElement('div');
  card.className = 'reel-product-card';
  card.onclick = () => {
    // Close reels modal
    closeReelsModal();
    // Open product modal
    if (window.showProductModal) {
      window.showProductModal(product.id);
    }
  };
  
  const formattedPrice = product.price ? `₹${product.price}` : 'Price not available';
  
  card.innerHTML = `
    <img src="${product.mainimage || 'placeholder.jpg'}" 
         alt="${escapeHtml(product.name)}"
         onerror="this.src='https://via.placeholder.com/150'">
    <h4>${escapeHtml(product.name)}</h4>
    <div class="price">${formattedPrice}</div>
  `;
  
  return card;
}

// Utility: Escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Export to global scope
window.openReelsModal = openReelsModal;
window.closeReelsModal = closeReelsModal;

console.log('✅ Reels modal module loaded');
