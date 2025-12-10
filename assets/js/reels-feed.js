// assets/js/reels-feed.js - Clean iframe Implementation

console.log('🎬 Reels feed module loading...');

// Reels data - Just store Instagram URLs!
const REELS_FEED_DATA = [
  {
    id: 'reel1',
    instagramUrl: 'https://www.instagram.com/reel/DNgI781ReJo/',
    productIds: ['B0BQHTML8D'] // Add more product ASINs here
  }
  // Add more reels here:
  // {
  //   id: 'reel2',
  //   instagramUrl: 'https://www.instagram.com/reel/ANOTHER_ID/',
  //   productIds: ['ASIN1', 'ASIN2', 'ASIN3']
  // }
];

// Extract post ID from Instagram URL and create embed URL
function getInstagramEmbedUrl(instagramUrl) {
  try {
    // Match both /p/ and /reel/ formats
    const match = instagramUrl.match(/\/(p|reel)\/([^\/\?]+)/);
    if (match && match[2]) {
      const postId = match[2];
      return `https://www.instagram.com/p/${postId}/embed`;
    }
  } catch (error) {
    console.error('Error parsing Instagram URL:', error);
  }
  return null;
}

// Show reels feed
function showReelsFeed() {
  console.log('🎬 Showing reels feed...');
  
  const feedContainer = document.getElementById('reels-feed-container');
  const productsContainer = document.getElementById('products-container');
  const sectionTitle = document.getElementById('section-title');
  const sectionSubtitle = document.getElementById('section-subtitle');
  
  if (!feedContainer || !productsContainer) {
    console.error('❌ Containers not found');
    return;
  }
  
  // Update section title (optional - can remove if you want no header)
  if (sectionTitle) sectionTitle.textContent = '';
  if (sectionSubtitle) sectionSubtitle.textContent = '';
  
  // Hide products, show feed
  productsContainer.classList.add('hidden');
  productsContainer.style.display = 'none';
  feedContainer.classList.remove('hidden');
  feedContainer.style.display = 'block';
  
  // Render feed
  renderReelsFeed();
  
  console.log('✅ Reels feed displayed');
}

// Render the complete reels feed
function renderReelsFeed() {
  const feedContainer = document.getElementById('reels-feed-container');
  
  if (!feedContainer) return;
  
  // Clear loading state
  feedContainer.innerHTML = '';
  
  // Check if we have reels
  if (REELS_FEED_DATA.length === 0) {
    feedContainer.innerHTML = `
      <div class="empty-state">
        <h3>🎬 No Reels Yet</h3>
        <p>Check back soon for curated Instagram reels!</p>
      </div>
    `;
    return;
  }
  
  // Create each reel section
  REELS_FEED_DATA.forEach((reel, index) => {
    const reelSection = createReelSection(reel, index);
    if (reelSection) {
      feedContainer.appendChild(reelSection);
    }
  });
}

// Create a single reel section (reel + products side by side)
function createReelSection(reelData, index) {
  const embedUrl = getInstagramEmbedUrl(reelData.instagramUrl);
  
  if (!embedUrl) {
    console.error('❌ Invalid Instagram URL:', reelData.instagramUrl);
    return null;
  }
  
  const section = document.createElement('div');
  section.className = 'reel-section';
  section.setAttribute('data-reel-id', reelData.id);
  
  // Create video container (left side on desktop)
  const videoDiv = document.createElement('div');
  videoDiv.className = 'reel-video';
  videoDiv.innerHTML = `
    <iframe 
      src="${embedUrl}" 
      frameborder="0" 
      scrolling="no" 
      allowtransparency="true" 
      allowfullscreen="true"
      loading="lazy">
    </iframe>
  `;
  
  // Create products container (right side on desktop)
  const productsDiv = document.createElement('div');
  productsDiv.className = 'reel-products';
  
  const productsGrid = document.createElement('div');
  productsGrid.className = 'reel-products-grid';
  
  // Find and add product cards
  reelData.productIds.forEach(productId => {
    const product = findProductById(productId);
    if (product) {
      const card = createReelProductCard(product);
      productsGrid.appendChild(card);
    }
  });
  
  // Handle empty products
  if (productsGrid.children.length === 0) {
    productsGrid.innerHTML = '<p style="color: #999; padding: 20px;">No products found for this reel</p>';
  }
  
  productsDiv.appendChild(productsGrid);
  
  // Assemble section (side by side on desktop, stacked on mobile)
  section.appendChild(videoDiv);
  section.appendChild(productsDiv);
  
  return section;
}

// Create product card
function createReelProductCard(product) {
  const card = document.createElement('div');
  card.className = 'reel-product-card';
  card.onclick = () => {
    if (window.showProductModal) {
      window.showProductModal(product.id);
    }
  };
  
  const img = document.createElement('img');
  img.src = product.mainimage || 'https://via.placeholder.com/200';
  img.alt = product.name || 'Product';
  img.onerror = () => { img.src = 'https://via.placeholder.com/200'; };
  
  const title = document.createElement('h4');
  title.textContent = product.name || 'Product';
  
  const price = document.createElement('div');
  price.className = 'price';
  price.textContent = product.price ? `₹${product.price}` : 'Price not available';
  
  card.appendChild(img);
  card.appendChild(title);
  card.appendChild(price);
  
  return card;
}

// Find product by ID (ASIN)
function findProductById(productId) {
  if (!window.VibeDrips || !window.VibeDrips.allProducts) {
    console.warn('⚠️ VibeDrips.allProducts not available');
    return null;
  }
  
  return window.VibeDrips.allProducts.find(p => 
    p.asin === productId || p.id === productId
  );
}

// Export to global scope
window.showReelsFeed = showReelsFeed;

console.log('✅ Reels feed module loaded');
