// assets/js/reels-feed.js - Instagram-Style Reels Feed with Grid Layouts

console.log('🎬 Reels feed module loading...');

// Render the reels feed (called from modal)
function renderReelsFeed() {
  console.log('🎬 Rendering reels feed...');
  
  const feedContainer = document.getElementById('reels-feed-container');
  
  if (!feedContainer) {
    console.error('❌ Reels feed container not found');
    return;
  }
  
  // Clear loading state
  feedContainer.innerHTML = '';
  
  // Get products with reel URLs
  const reelsData = getReelsDataFromProducts();
  
  // Check if we have reels
  if (reelsData.length === 0) {
    feedContainer.innerHTML = `
      <div class="empty-state">
        <h3>🎬 No Reels Yet</h3>
        <p>Check back soon for curated Instagram reels!</p>
      </div>
    `;
    return;
  }
  
  // Create each reel section
  reelsData.forEach((reel, index) => {
    const reelSection = createReelSection(reel, index);
    if (reelSection) {
      feedContainer.appendChild(reelSection);
    }
  });
  
  console.log(`✅ Rendered ${reelsData.length} reel sections`);
}

// Get reels data from products CSV
function getReelsDataFromProducts() {
  if (!window.VibeDrips || !window.VibeDrips.allProducts) {
    console.warn('⚠️ VibeDrips.allProducts not available');
    return [];
  }
  
  // Filter products with "Product Source Link"
  const productsWithReels = window.VibeDrips.allProducts.filter(p => {
    const sourceLink = p['Product Source Link'] || p.productSourceLink || p.source_link;
    return sourceLink && sourceLink.trim() !== '';
  });
  
  // Group products by reel URL
  const reelsMap = {};
  
  productsWithReels.forEach(product => {
    let reelUrl = product['Product Source Link'] || product.productSourceLink || product.source_link;
    
    // Handle multiple URLs (take first one)
    if (reelUrl.includes(',')) {
      reelUrl = reelUrl.split(',')[0].trim();
    }
    
    // Validate URL
    if (!reelUrl.includes('instagram.com')) {
      console.warn('⚠️ Invalid Instagram URL:', reelUrl);
      return;
    }
    
    // Group by URL
    if (!reelsMap[reelUrl]) {
      reelsMap[reelUrl] = {
        url: reelUrl,
        products: []
      };
    }
    
    reelsMap[reelUrl].products.push(product);
  });
  
  // Convert to array
  return Object.values(reelsMap);
}

// Extract Instagram post ID and create embed URL
function getInstagramEmbedUrl(instagramUrl) {
  try {
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

// Create a single reel section
function createReelSection(reelData, index) {
  const embedUrl = getInstagramEmbedUrl(reelData.url);
  
  if (!embedUrl) {
    console.error('❌ Invalid Instagram URL:', reelData.url);
    return null;
  }
  
  const section = document.createElement('div');
  section.className = 'reel-section';
  section.setAttribute('data-reel-index', index);
  
  // Create content wrapper
  const content = document.createElement('div');
  content.className = 'reel-content';
  
  // Create video container
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
  
  // Create products container with carousel
  const productsDiv = document.createElement('div');
  productsDiv.className = 'reel-products';
  
  const carousel = createProductsCarousel(reelData.products, index);
  productsDiv.appendChild(carousel);
  
  // Assemble section
  content.appendChild(videoDiv);
  content.appendChild(productsDiv);
  section.appendChild(content);
  
  return section;
}

// Create products carousel with pagination
function createProductsCarousel(products, reelIndex) {
  const carousel = document.createElement('div');
  carousel.className = 'products-carousel';
  carousel.setAttribute('data-reel-index', reelIndex);
  
  // Determine products per page based on screen size
  const isMobile = window.innerWidth < 768;
  const isTablet = window.innerWidth >= 768 && window.innerWidth < 1200;
  const productsPerPage = isMobile ? 2 : (isTablet ? 4 : 6);
  
  // Calculate total pages
  const totalPages = Math.ceil(products.length / productsPerPage);
  let currentPage = 0;
  
  // Create navigation (arrows)
  const prevBtn = document.createElement('button');
  prevBtn.className = 'carousel-nav prev';
  prevBtn.innerHTML = '◄';
  prevBtn.onclick = () => navigateCarousel(carousel, -1);
  
  const nextBtn = document.createElement('button');
  nextBtn.className = 'carousel-nav next';
  nextBtn.innerHTML = '►';
  nextBtn.onclick = () => navigateCarousel(carousel, 1);
  
  // Create products grid
  const grid = document.createElement('div');
  grid.className = 'products-grid';
  
  // Create dots indicator
  const dotsContainer = document.createElement('div');
  dotsContainer.className = 'carousel-dots';
  
  for (let i = 0; i < totalPages; i++) {
    const dot = document.createElement('span');
    dot.className = i === 0 ? 'dot active' : 'dot';
    dot.onclick = () => goToPage(carousel, i);
    dotsContainer.appendChild(dot);
  }
  
  // Store carousel state
  carousel.dataset.currentPage = '0';
  carousel.dataset.totalPages = totalPages;
  carousel.dataset.productsPerPage = productsPerPage;
  
  // Render initial page
  renderProductsPage(grid, products, 0, productsPerPage);
  
  // Assemble carousel
  if (totalPages > 1) {
    carousel.appendChild(prevBtn);
  }
  carousel.appendChild(grid);
  if (totalPages > 1) {
    carousel.appendChild(nextBtn);
    carousel.appendChild(dotsContainer);
  }
  
  return carousel;
}

// Render products for current page
function renderProductsPage(grid, allProducts, page, perPage) {
  grid.innerHTML = '';
  
  const startIdx = page * perPage;
  const endIdx = Math.min(startIdx + perPage, allProducts.length);
  const pageProducts = allProducts.slice(startIdx, endIdx);
  
  pageProducts.forEach(product => {
    const card = createProductCard(product);
    grid.appendChild(card);
  });
}

// Create product card HTML
function createProductCard(product) {
  const card = document.createElement('div');
  card.className = 'product-card';
  
  // Use correct field names from your data
  const imageUrl = product.main_image || '';
  const amazonLink = product.amazon_short || product.amazon_long || product.source_link || '#';
  
  // Format price
  const price = product.price;
  const currency = product.symbol || '₹';
  const priceFormatted = typeof price === 'number' 
    ? `${currency}${price.toLocaleString('en-IN')}` 
    : price;
  
  // SVG fallback with product name
  const svgFallback = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill='%23333' width='200' height='200'/%3E%3Ctext fill='%23fff' font-size='14' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3E${encodeURIComponent(product.name?.substring(0, 20) || 'No Image')}%3C/text%3E%3C/svg%3E`;
  
  card.innerHTML = `
    <img src="${imageUrl || svgFallback}" 
         alt="${product.name || 'Product'}"
         loading="lazy"
         onerror="this.src='${svgFallback}'">
    
    ${product.brand ? `<div class="brand-tag">🏷️ ${product.brand}</div>` : ''}
    
    <h3 class="product-name">${product.name || 'Product Name'}</h3>
    
    <div class="product-footer">
      <span class="price">${priceFormatted}</span>
      <a href="${amazonLink}" 
         target="_blank" 
         rel="noopener noreferrer"
         class="amazon-btn"
         onclick="event.stopPropagation()">
        Buy Now →
      </a>
    </div>
  `;
  
  return card;
}

// Navigate carousel (prev/next)
function navigateCarousel(carousel, direction) {
  const currentPage = parseInt(carousel.dataset.currentPage);
  const totalPages = parseInt(carousel.dataset.totalPages);
  
  let newPage = currentPage + direction;
  
  // Wrap around
  if (newPage < 0) newPage = totalPages - 1;
  if (newPage >= totalPages) newPage = 0;
  
  goToPage(carousel, newPage);
}

// Go to specific page
function goToPage(carousel, page) {
  const grid = carousel.querySelector('.products-grid');
  const dots = carousel.querySelectorAll('.dot');
  const reelIndex = carousel.dataset.reelIndex;
  const productsPerPage = parseInt(carousel.dataset.productsPerPage);
  
  // Get all products for this reel
  const reelsData = getReelsDataFromProducts();
  const products = reelsData[reelIndex].products;
  
  // Update page
  carousel.dataset.currentPage = page;
  
  // Render new page
  renderProductsPage(grid, products, page, productsPerPage);
  
  // Update dots
  dots.forEach((dot, i) => {
    dot.classList.toggle('active', i === page);
  });
}

// Open product modal
function openProductModal(product) {
  if (window.showProductModal) {
    window.showProductModal(product.id || product.asin);
  }
}

// Export to global scope
window.renderReelsFeed = renderReelsFeed;

console.log('✅ Reels feed module loaded');
