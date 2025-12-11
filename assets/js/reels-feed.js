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

// Create product card HTML - Professional version matching main page
function createProductCard(product) {
  const card = document.createElement('div');
  card.className = 'product-card';
  
  // Extract all required fields
  const imageUrl = product.main_image || '';
  const allImages = [product.main_image, ...(product.all_images || [])].filter(Boolean);
  const imageCount = allImages.length;
  const amazonLink = product.amazon_short || product.amazon_long || '#';
  const productName = product.name || 'Product Name';
  const productAsin = product.asin || product.id || '';
  const category = product.category || 'General';
  const brand = product.brand || 'VibeDrips';
  const description = product.description || 'No description available';
  const rating = parseFloat(product.customer_rating) || 0;
  
  // Format price
  const price = product.price || 0;
  const currency = product.symbol || '₹';
  const priceFormatted = typeof price === 'number' 
    ? `${currency}${price.toLocaleString('en-IN')}` 
    : price;
  
  // Truncate description
  const shortDescription = description.length > 100 
    ? description.substring(0, 100) + '...' 
    : description;
  
  card.innerHTML = `
    <div class="product-image">
      <img src="${imageUrl}" 
           alt="${productName}"
           onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
           loading="lazy">
      <div class="product-image-placeholder" style="display:none;">🛍️</div>
      ${imageCount > 1 ? `<div class="image-count">${imageCount} photos</div>` : ''}
    </div>
    <div class="product-info">
      <div class="product-category">${category}</div>
      <h3 class="product-title">${productName}</h3>
      <div class="product-description">${shortDescription}</div>
      <div class="product-price">${priceFormatted}</div>
      
      <div class="product-meta">
        <span class="brand">🏷️ ${brand}</span>
        <div class="rating">${rating > 0 ? `⭐ ${rating.toFixed(1)}` : '<span class="no-rating">No rating</span>'}</div>
      </div>
      
      <div class="product-actions">
        <button class="amazon-button" onclick="openAmazonLink('${amazonLink}', '${productAsin}')">
          Buy Now
        </button>
        <button class="details-button" onclick="showProductModal('${productAsin}')">
          Details
        </button>
      </div>
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
