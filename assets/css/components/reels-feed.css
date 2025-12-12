/* Reels Feed - Instagram-Style Grid Layouts */

/* ALL RULES SCOPED TO REELS MODAL ONLY */

/* Feed Container (inside reels modal) */
.reels-modal .reels-feed {
  width: 100%;
  height: 100%;
  overflow-y: auto;
}

.reels-modal .reels-feed.hidden {
  display: none;
}

/* Empty State */
.reels-modal .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 80vh;
  color: rgba(255, 255, 255, 0.7);
  text-align: center;
  padding: 40px;
}

.reels-modal .empty-state h3 {
  font-size: 2rem;
  margin-bottom: 10px;
}

.reels-modal .empty-state p {
  font-size: 1.1rem;
  opacity: 0.8;
}

/* Reel Section (each reel + products) - STRICT INSTAGRAM MODE */
.reels-modal .reel-section {
  scroll-snap-align: start;
  scroll-snap-stop: always;
  height: 100vh;
  min-height: 100vh;
  max-height: 100vh;
  width: 100%;
  padding: 0;
  box-sizing: border-box;
  overflow: hidden;
  position: relative;
}

/* Reel Content Wrapper */
.reels-modal .reel-content {
  display: flex;
  gap: 30px;
  max-width: 1400px;
  margin: 0 auto;
  height: 100%;
  max-height: 100%;
  overflow: hidden;
  padding: 20px;
  box-sizing: border-box;
}

/* Reel Video Container */
.reels-modal .reel-video {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  max-height: 100%;
  height: 100%;
}

.reels-modal .reel-video iframe {
  width: 100%;
  max-width: 500px;
  height: 100%;
  max-height: 100%;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  object-fit: contain;
}

/* Reel Products Container */
.reels-modal .reel-products {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 20px;
  overflow: hidden;
  max-height: 100%;
  height: 100%;
}

/* Products Carousel */
.reels-modal .products-carousel {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* Products Grid - DYNAMIC SCALING */
.reels-modal .products-grid {
  display: grid;
  gap: 15px;
  width: 100%;
  height: 100%;
  max-height: 100%;
  transition: opacity 0.3s ease;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: thin;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
  cursor: grab;
  padding-bottom: 10px;
}

.reels-modal .products-grid:active {
  cursor: grabbing;
}

/* Hide horizontal scrollbar but keep functionality */
.reels-modal .products-grid::-webkit-scrollbar {
  height: 6px;
}

.reels-modal .products-grid::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 3px;
}

.reels-modal .products-grid::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

.reels-modal .products-grid::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

.reels-modal .products-carousel[data-transitioning="true"] .products-grid {
  opacity: 0.5;
}

/* DYNAMIC CARD DIMENSIONS - SCALE TO CONTAINER */
.reels-modal .product-card {
  width: 100%;
  height: 100%;
  max-height: 280px;
  min-height: 180px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.reels-modal .product-card img {
  flex: 0 0 55%;
  width: 100%;
  object-fit: cover;
}

.reels-modal .product-card .product-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: clamp(8px, 2vw, 12px);
  min-height: 0;
}

.reels-modal .product-card .product-name {
  font-size: clamp(0.75rem, 2vw, 0.95rem);
  line-height: 1.3;
}

.reels-modal .product-card .product-price {
  font-size: clamp(0.85rem, 2.5vw, 1.05rem);
  font-weight: bold;
}

/* Desktop: 3x2 Grid (6 products) - FILL ROWS FIRST */
@media (min-width: 1200px) {
  .reels-modal .products-grid {
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(2, 1fr);
    grid-auto-flow: row; /* ✅ FIXED: Fill horizontally first */
  }
}

/* Tablet: 2x2 Grid (4 products) - FILL ROWS FIRST */
@media (min-width: 768px) and (max-width: 1199px) {
  .reels-modal .products-grid {
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: repeat(2, 1fr);
    grid-auto-flow: row; /* ✅ FIXED: Fill horizontally first */
  }

  .reels-modal .reel-video iframe {
    max-width: 400px;
  }
}

/* Mobile Portrait: KEEP 35% CONTAINER, SCROLLABLE CARDS */
@media (max-width: 767px) and (orientation: portrait) {
  .reels-modal .reel-section {
    padding: 0;
    height: 100vh;
    min-height: 100vh;
    max-height: 100vh;
    width: 100vw;
  }

  .reels-modal .reel-content {
    flex-direction: column;
    gap: 10px;
    width: 100%;
    max-width: 100vw;
    height: 100%;
    max-height: 100vh;
    padding: 10px;
    box-sizing: border-box;
  }

  .reels-modal .reel-video {
    flex: 0 0 65%;
    max-height: 65%;
    width: 100%;
    height: 65%;
  }

  .reels-modal .reel-video iframe {
    max-width: 100%;
    width: 100%;
    height: 100%;
    max-height: 100%;
  }

  .reels-modal .reel-products {
    flex: 0 0 35%; /* ✅ KEEP 35% */
    justify-content: flex-start;
    width: 100%;
    max-height: 35%;
    height: 35%;
    gap: 10px;
    overflow: visible; /* ✅ Allow overflow for scrolling */
  }

  .reels-modal .products-carousel {
    height: 100%;
    max-height: 100%;
    overflow: visible; /* ✅ Allow overflow */
  }

  .reels-modal .products-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    grid-template-rows: 1fr; /* ✅ FLEXIBLE HEIGHT */
    gap: 8px;
    overflow-x: auto;
    overflow-y: hidden;
    width: 100%;
    height: 100%; /* ✅ Fill container */
    max-height: 100%;
    padding-bottom: 5px;
    align-content: start;
  }

  .reels-modal .product-card {
    height: 100%; /* ✅ Fill grid cell */
    max-height: 220px; /* ✅ Cap at 220px */
    min-height: 160px; /* ✅ Don't go below 160px */
  }

  .reels-modal .product-card img {
    flex: 0 0 60%; /* ✅ 60% of card height */
  }

  .reels-modal .product-card .product-info {
    flex: 1; /* ✅ Take remaining 40% */
    padding: 8px;
  }
}

/* Mobile Landscape: SIDE-BY-SIDE LAYOUT */
@media (max-width: 767px) and (orientation: landscape) {
  .reels-modal .reel-section {
    padding: 0;
    height: 100vh;
    width: 100vw;
  }

  .reels-modal .reel-content {
    flex-direction: row; /* ✅ Side-by-side */
    gap: 10px;
    width: 100vw;
    max-width: 100vw;
    height: 100vh;
    padding: 10px;
    box-sizing: border-box;
  }

  .reels-modal .reel-video {
    flex: 0 0 50%; /* ✅ 50% width for video */
    height: 100%;
    width: 50%;
  }

  .reels-modal .reel-video iframe {
    width: 100%;
    height: 100%;
    max-width: 100%;
    max-height: 100%;
  }

  .reels-modal .reel-products {
    flex: 0 0 50%; /* ✅ 50% width for products */
    height: 100%;
    width: 50%;
    justify-content: flex-start;
    gap: 10px;
    overflow: visible;
  }

  .reels-modal .products-carousel {
    height: 100%;
    max-height: 100%;
  }

  .reels-modal .products-grid {
    grid-template-columns: repeat(2, 1fr); /* ✅ 2 columns */
    grid-template-rows: repeat(2, 1fr); /* ✅ 2 rows, flexible */
    grid-auto-flow: row; /* ✅ Fill rows first */
    gap: 8px;
    overflow-x: auto;
    overflow-y: hidden;
    height: 100%;
    max-height: 100%;
    padding-bottom: 5px;
  }

  .reels-modal .product-card {
    height: 100%;
    max-height: 180px; /* ✅ Smaller for landscape */
    min-height: 140px;
  }

  .reels-modal .product-card img {
    flex: 0 0 55%;
  }

  .reels-modal .product-card .product-info {
    flex: 1;
    padding: 6px;
  }

  .reels-modal .product-card .product-name {
    font-size: clamp(0.7rem, 1.8vw, 0.85rem);
  }

  .reels-modal .product-card .product-price {
    font-size: clamp(0.8rem, 2vw, 0.95rem);
  }
}

/* Carousel Navigation Arrows */
.reels-modal .carousel-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px) saturate(1);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  color: white;
  font-size: 18px;
  cursor: pointer;
  z-index: 10;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.reels-modal .carousel-nav:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-50%) scale(1.1);
}

.reels-modal .carousel-nav.prev {
  left: -20px;
}

.reels-modal .carousel-nav.next {
  right: -20px;
}

/* Mobile: Smaller arrows inside container */
@media (max-width: 767px) {
  .reels-modal .carousel-nav {
    width: 32px;
    height: 32px;
    font-size: 14px;
  }

  .reels-modal .carousel-nav.prev {
    left: 5px;
  }

  .reels-modal .carousel-nav.next {
    right: 5px;
  }
}

/* Carousel Dots */
.reels-modal .carousel-dots {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 10px;
  flex-shrink: 0;
}

.reels-modal .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  cursor: pointer;
  transition: all 0.3s ease;
}

.reels-modal .dot:hover {
  background: rgba(255, 255, 255, 0.5);
  transform: scale(1.2);
}

.reels-modal .dot.active {
  background: white;
  width: 24px;
  border-radius: 4px;
}

/* Mobile: Smaller dots */
@media (max-width: 767px) {
  .reels-modal .carousel-dots {
    margin-top: 5px;
    gap: 6px;
  }

  .reels-modal .dot {
    width: 6px;
    height: 6px;
  }

  .reels-modal .dot.active {
    width: 18px;
  }
}

/* Loading State */
.reels-modal .loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 80vh;
  color: rgba(255, 255, 255, 0.7);
  gap: 20px;
}

.reels-modal .loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
