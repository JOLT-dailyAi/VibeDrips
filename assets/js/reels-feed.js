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

  // ✅ FIX: Check if products exist first
  if (!window.allProducts || !Array.isArray(window.allProducts)) {
    console.warn('⚠️ Products not loaded yet');
    feedContainer.innerHTML = `
      <div class="empty-state">
        <h3>⏳ Loading Products...</h3>
        <p>Please wait while we load your curated drops.</p>
      </div>
    `;
    
    // ✅ Try again after products load
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

// Create products carousel with pagination
function createProductsCarousel(products) {
  const carouselContainer = document.createElement('div');
  carouselContainer.className = 'products-carousel';

  // Products grid
  const grid = document.createElement('div');
  grid.className = 'products-grid';

  // ✅ Enable horizontal scroll with proper touch handling
  enableHorizontalScroll(grid);

  // Render product cards
  products.forEach(product => {
    const card = createProductCard(product);
    grid.appendChild(card);
  });

  carouselContainer.appendChild(grid);
  return carouselContainer;
}

// ✅ Enable horizontal scroll with touch support
function enableHorizontalScroll(gridElement) {
  // For desktop: Enable click+drag scrolling
  let isDown = false;
  let startX;
  let scrollLeft;
  let hasMoved = false;

  gridElement.addEventListener('mousedown', (e) => {
    // Only handle if not clicking on a button or link
    if (e.target.closest('button') || e.target.closest('a')) return;
    
    isDown = true;
    hasMoved = false;
    startX = e.pageX - gridElement.offsetLeft;
    scrollLeft = gridElement.scrollLeft;
    gridElement.style.cursor = 'grabbing';
    gridElement.style.userSelect = 'none';
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
  });

  gridElement.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    hasMoved = true;
    const x = e.pageX - gridElement.offsetLeft;
    const walk = (x - startX) * 2; // Scroll speed multiplier
    gridElement.scrollLeft = scrollLeft - walk;
  });

  // Store hasMoved state for click detection
  gridElement.dataset.hasMoved = 'false';
  gridElement.addEventListener('mousedown', () => {
    gridElement.dataset.hasMoved = 'false';
  });
  gridElement.addEventListener('mousemove', () => {
    if (isDown) gridElement.dataset.hasMoved = 'true';
  });
}

// Create a product card
function createProductCard(product) {
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
    
    // Only open modal if it's a tap (not a swipe):
    // 1. Duration < 300ms (quick tap)
    // 2. Movement < 10px horizontally (not swiping)
    if (touchDuration < 300 && deltaX < 10 && deltaY < 10) {
      e.preventDefault(); // Prevent any default behavior
      if (typeof openSimpleModal === 'function') {
        openSimpleModal(product);
      } else {
        console.error('❌ openSimpleModal function not found');
      }
    }
  });

  // ✅ Desktop click handler (only if not dragging)
  card.addEventListener('click', (e) => {
    // Check if user was dragging
    const grid = card.closest('.products-grid');
    if (grid && grid.dataset.hasMoved === 'true') {
      return; // Don't open modal if user was scrolling
    }

    // Only trigger on mouse click, not touch
    if (e.pointerType === 'mouse' || !e.pointerType) {
      if (typeof openSimpleModal === 'function') {
        openSimpleModal(product);
      } else {
        console.error('❌ openSimpleModal function not found');
      }
    }
  });

  // Image wrapper
  const imageWrapper = document.createElement('div');
  imageWrapper.className = 'product-image-wrapper';

  const img = document.createElement('img');
  img.src = product.images[0];
  img.alt = product.name;
  img.loading = 'lazy';

  // Brand tag (if exists)
  if (product.brand) {
    const brandTag = document.createElement('div');
    brandTag.className = 'brand-tag';
    brandTag.textContent = product.brand;
    imageWrapper.appendChild(brandTag);
  }

  // Image count badge
  if (product.images.length > 1) {
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
  category.textContent = product.category;
  card.appendChild(category);

  // Product name
  const name = document.createElement('h3');
  name.className = 'product-name';
  name.textContent = product.name;
  card.appendChild(name);

  // Price row
  const priceRow = document.createElement('div');
  priceRow.className = 'product-price-row';

  const price = document.createElement('div');
  price.className = 'product-price';
  price.textContent = product.price;
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
  button.href = product.amazon_url;
  button.target = '_blank';
  button.rel = 'noopener noreferrer';
  button.className = 'amazon-button';
  button.textContent = '🛒 Buy on Amazon';
  
  // Prevent button click from opening modal
  button.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  card.appendChild(button);

  return card;
}

console.log('✅ Reels feed module loaded');
