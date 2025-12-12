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

  // ✅ Check if products exist first
  if (!window.allProducts || !Array.isArray(window.allProducts)) {
    console.warn('⚠️ Products not loaded yet');
    feedContainer.innerHTML = `
      <div class="empty-state">
        <h3>⏳ Loading Products...</h3>
        <p>Please wait while we load your curated drops.</p>
      </div>
    `;
    
    // Try again after products load
    setTimeout(() => {
      if (window.allProducts && window.allProducts.length > 0) {
        renderReelsFeed();
      }
    }, 1000);
    return;
  }

  console.log(`📦 Found ${window.allProducts.length} total products`);

  // Get products with reel URLs
  const reelsData = getReelsDataFromProducts();

  // Check if we have reels
  if (reelsData.length === 0) {
    console.log('ℹ️ No products with reel URLs found');
    feedContainer.innerHTML = `
      <div class="empty-state">
        <h3>🎬 No Reels Yet</h3>
        <p>Check back soon for curated Instagram reels!</p>
      </div>
    `;
    return;
  }

  // Render each reel section
  reelsData.forEach((reelData, index) => {
    const reelSection = createReelSection(reelData, index);
    feedContainer.appendChild(reelSection);
  });

  console.log(`✅ Rendered ${reelsData.length} reels`);
}

// Get reels data from products
function getReelsDataFromProducts() {
  if (!window.allProducts || !Array.isArray(window.allProducts)) {
    console.warn('⚠️ No products available');
    return [];
  }

  const productsWithReels = window.allProducts.filter(product => product.reel_url);
  console.log(`🎬 Found ${productsWithReels.length} products with reel URLs`);

  if (productsWithReels.length === 0) {
    return [];
  }

  const reelsMap = {};
  productsWithReels.forEach(product => {
    if (!reelsMap[product.reel_url]) {
      reelsMap[product.reel_url] = {
        reel_url: product.reel_url,
        products: []
      };
    }
    reelsMap[product.reel_url].products.push(product);
  });

  return Object.values(reelsMap);
}

// Create a reel section
function createReelSection(reelData, index) {
  const section = document.createElement('div');
  section.className = 'reel-section';
  section.dataset.reelIndex = index;

  // Create content wrapper
  const content = document.createElement('div');
  content.className = 'reel-content';

  // Create video container
  const videoContainer = document.createElement('div');
  videoContainer.className = 'reel-video';
  
  const iframe = document.createElement('iframe');
  iframe.src = reelData.reel_url;
  iframe.frameBorder = '0';
  iframe.allowFullscreen = true;
  iframe.allow = 'autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share';
  
  videoContainer.appendChild(iframe);

  // Create products container
  const productsContainer = document.createElement('div');
  productsContainer.className = 'reel-products';

  // Create products carousel
  const carousel = createProductsCarousel(reelData.products);
  productsContainer.appendChild(carousel);

  // Append to content
  content.appendChild(videoContainer);
  content.appendChild(productsContainer);
  section.appendChild(content);

  return section;
}

// Create products carousel
function createProductsCarousel(products) {
  const carouselContainer = document.createElement('div');
  carouselContainer.className = 'products-carousel';

  // Products grid
  const grid = document.createElement('div');
  grid.className = 'products-grid';

  // ✅ Enable horizontal scroll with touch/drag support
  enableHorizontalScroll(grid);

  // Render product cards using REELS-SPECIFIC function
  products.forEach(product => {
    const card = createReelsProductCard(product);
    grid.appendChild(card);
  });

  carouselContainer.appendChild(grid);
  return carouselContainer;
}

// ✅ Enable horizontal scroll with touch support
function enableHorizontalScroll(gridElement) {
  // Desktop: Enable click+drag scrolling
  let isDown = false;
  let startX;
  let scrollLeft;

  gridElement.addEventListener('mousedown', (e) => {
    if (e.target.closest('button') || e.target.closest('a')) return;
    
    isDown = true;
    startX = e.pageX - gridElement.offsetLeft;
    scrollLeft = gridElement.scrollLeft;
    gridElement.style.cursor = 'grabbing';
    gridElement.style.userSelect = 'none';
    gridElement.dataset.dragging = 'false';
  });

  gridElement.addEventListener('mouseleave', () => {
    isDown = false;
    gridElement.style.cursor = 'grab';
    gridElement.style.userSelect = 'auto';
  });

  gridElement.addEventListener('mouseup', () => {
    isDown = false;
    gridElement.style.cursor = 'grab';
    gridElement.style.userSelect = 'auto';
    // Reset dragging flag after a small delay
    setTimeout(() => {
      gridElement.dataset.dragging = 'false';
    }, 10);
  });

  gridElement.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    gridElement.dataset.dragging = 'true';
    const x = e.pageX - gridElement.offsetLeft;
    const walk = (x - startX) * 2;
    gridElement.scrollLeft = scrollLeft - walk;
  });
}

// ✅ REELS-SPECIFIC product card (separate from homepage)
function createReelsProductCard(product) {
  const card = document.createElement('div');
  card.className = 'product-card';
  card.style.cursor = 'pointer';

  // ✅ Touch event handling for mobile (distinguish tap from swipe)
  let touchStartX = 0;
  let touchStartY = 0;
  let touchStartTime = 0;

  card.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchStartTime = Date.now();
  }, { passive: true });

  card.addEventListener('touchend', (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const touchDuration = Date.now() - touchStartTime;
    
    const deltaX = Math.abs(touchEndX - touchStartX);
    const deltaY = Math.abs(touchEndY - touchStartY);
    
    // Only open modal if it's a tap (not a swipe)
    if (touchDuration < 300 && deltaX < 10 && deltaY < 10) {
      e.preventDefault();
      if (typeof openSimpleModal === 'function') {
        openSimpleModal(product);
      }
    }
  });

  // ✅ Desktop click handler (only if not dragging)
  card.addEventListener('click', (e) => {
    const grid = card.closest('.products-grid');
    if (grid && grid.dataset.dragging === 'true') {
      return; // Don't open modal if user was scrolling
    }

    if (e.pointerType === 'mouse' || !e.pointerType) {
      if (typeof openSimpleModal === 'function') {
        openSimpleModal(product);
      }
    }
  });

  // Image wrapper
  const imageWrapper = document.createElement('div');
  imageWrapper.className = 'product-image-wrapper';

  const img = document.createElement('img');
  // ✅ Handle both images array and single image
  if (Array.isArray(product.images) && product.images.length > 0) {
    img.src = product.images[0];
  } else if (product.image) {
    img.src = product.image;
  } else {
    img.src = 'assets/images/placeholder.png';
  }
  img.alt = product.name || 'Product';
  img.loading = 'lazy';

  // Brand tag
  if (product.brand) {
    const brandTag = document.createElement('div');
    brandTag.className = 'brand-tag';
    brandTag.textContent = product.brand;
    imageWrapper.appendChild(brandTag);
  }

  // Image count badge
  if (Array.isArray(product.images) && product.images.length > 1) {
    const imageCount = document.createElement('div');
    imageCount.className = 'image-count';
    imageCount.textContent = `📸 ${product.images.length}`;
    imageWrapper.appendChild(imageCount);
  }

  imageWrapper.appendChild(img);
  card.appendChild(imageWrapper);

  // Category
  const category = document.createElement('div');
  category.className = 'product-category';
  category.textContent = product.category || 'Product';
  card.appendChild(category);

  // Product name
  const name = document.createElement('h3');
  name.className = 'product-name';
  name.textContent = product.name || 'Unnamed Product';
  card.appendChild(name);

  // Price row
  const priceRow = document.createElement('div');
  priceRow.className = 'product-price-row';

  const price = document.createElement('div');
  price.className = 'product-price';
  price.textContent = product.price || 'N/A';
  priceRow.appendChild(price);

  if (product.rating) {
    const rating = document.createElement('div');
    rating.className = 'rating';
    rating.textContent = `⭐ ${product.rating}`;
    priceRow.appendChild(rating);
  }

  card.appendChild(priceRow);

  // Amazon button
  const button = document.createElement('a');
  button.href = product.amazon_url || '#';
  button.target = '_blank';
  button.rel = 'noopener noreferrer';
  button.className = 'amazon-button';
  button.textContent = '🛒 Buy on Amazon';
  
  button.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  card.appendChild(button);

  return card;
}

console.log('✅ Reels feed module loaded');
