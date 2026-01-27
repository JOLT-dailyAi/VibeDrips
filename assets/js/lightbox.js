/**
 * MediaLightbox - Universal Media Viewer
 * Version: 2.0.0
 * Author: VibeDrips
 * 
 *
 * Supports:
 * - Images (jpg, png, gif, webp, etc.)
 * - Video files (mp4, mov, webm, etc.)
 * - Instagram (Reels & Posts)
 * - TikTok (Videos)
 * - YouTube (Videos & Shorts)
 * - Twitter/X (Videos & Posts)
 * - Any embeddable content
 */

class MediaLightbox {
    static activeInstance = null;

    constructor(options = {}) {
        this.options = {
            enableSwipe: true,
            enableKeyboard: true,
            autoPlayVideo: true,
            showCounter: true,
            showDots: true,
            maxDots: 8,
            ...options
        };

        this.mediaArray = [];
        this.currentIndex = 0;
        this.isOpen = false;
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchMoveX = 0;
        this.touchMoveY = 0;
        this.isDragging = false;
        this.dragDirection = null; // 'h' or 'v'

        this.init();
    }

    init() {
        if (!document.getElementById('mediaLightbox')) {
            this.createLightboxDOM();
            this.attachEventListeners();
        }
    }

    createLightboxDOM() {
        const lightboxHTML = `
            <div id="mediaLightbox" class="lightbox-overlay">
                <button class="lightbox-close" aria-label="Close">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
                <div class="lightbox-counter"></div>
                
                <button class="lightbox-arrow lightbox-prev" aria-label="Previous">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                </button>
                
                <div class="lightbox-content">
                    <div class="lightbox-media-container">
                        <img class="lightbox-image" alt="" style="display:none">
                        <video class="lightbox-video" controls style="display:none"></video>
                        <iframe class="lightbox-iframe" frameborder="0" allowfullscreen allow="autoplay; encrypted-media" style="display:none"></iframe>
                        <div class="lightbox-video-placeholder" style="display:none">
                            <div class="video-placeholder-icon">🎬</div>
                            <div class="video-placeholder-text">Video</div>
                        </div>
                        <div class="lightbox-social-placeholder" style="display:none">
                            <div class="social-placeholder-icon">📱</div>
                            <div class="social-placeholder-text">Social Media Content</div>
                        </div>
                        <div class="lightbox-loader">Loading...</div>
                    </div>
                    <div class="lightbox-caption"></div>
                </div>
                
                <button class="lightbox-arrow lightbox-next" aria-label="Next">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                </button>
                
                <div class="lightbox-dots"></div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', lightboxHTML);
    }

    attachEventListeners() {
        const overlay = document.getElementById('mediaLightbox');
        const closeBtn = overlay.querySelector('.lightbox-close');
        const prevBtn = overlay.querySelector('.lightbox-prev');
        const nextBtn = overlay.querySelector('.lightbox-next');

        closeBtn.addEventListener('click', () => {
            const active = MediaLightbox.activeInstance;
            if (!active) return;
            closeBtn.classList.add('closing-animation');
            setTimeout(() => {
                active.close();
                closeBtn.classList.remove('closing-animation');
            }, 300);
        });

        overlay.addEventListener('click', (e) => {
            const active = MediaLightbox.activeInstance;
            if (active && e.target === overlay) active.close();
        });

        prevBtn.addEventListener('click', () => {
            const active = MediaLightbox.activeInstance;
            if (active) active.prev();
        });
        nextBtn.addEventListener('click', () => {
            const active = MediaLightbox.activeInstance;
            if (active) active.next();
        });

        if (this.options.enableKeyboard) {
            document.addEventListener('keydown', (e) => {
                const active = MediaLightbox.activeInstance;
                if (!active || !active.isOpen) return;
                if (e.key === 'Escape') active.close();
                if (e.key === 'ArrowLeft') active.prev();
                if (e.key === 'ArrowRight') active.next();
            });
        }

        if (this.options.enableSwipe) {
            const content = overlay.querySelector('.lightbox-content');
            const mediaContainer = overlay.querySelector('.lightbox-media-container');

            const handleStart = (e) => {
                const active = MediaLightbox.activeInstance;
                if (!active) return;

                const touch = e.type.startsWith('touch') ? e.touches[0] : e;
                active.touchStartX = touch.clientX;
                active.touchStartY = touch.clientY;
                active.isDragging = true;
                active.dragDirection = null;

                // Reset container transition for 1:1 tracking
                mediaContainer.style.transition = 'none';
            };

            const handleMove = (e) => {
                const active = MediaLightbox.activeInstance;
                if (!active || !active.isDragging) return;

                const touch = e.type.startsWith('touch') ? e.touches[0] : e;
                active.touchMoveX = touch.clientX;
                active.touchMoveY = touch.clientY;

                const deltaX = active.touchMoveX - active.touchStartX;
                const deltaY = active.touchMoveY - active.touchStartY;
                const absX = Math.abs(deltaX);
                const absY = Math.abs(deltaY);

                // Detect Intent after 10px
                if (!active.dragDirection && Math.max(absX, absY) > 10) {
                    active.dragDirection = absY > absX ? 'v' : 'h';
                }

                if (active.dragDirection === 'v' && deltaY > 0) {
                    // Gravity Pull Feedback
                    const progress = Math.min(deltaY / 400, 1); // Max fade at 400px
                    mediaContainer.style.transform = `translate3d(0, ${deltaY}px, 0)`;
                    mediaContainer.style.opacity = 1 - (progress * 0.7);

                    // Stop browser scroll/pull-to-refresh if we own the gesture
                    if (e.cancelable) e.preventDefault();
                }
            };

            const handleEnd = (e) => {
                const active = MediaLightbox.activeInstance;
                if (!active || !active.isDragging) return;
                active.isDragging = false;

                const touch = e.type.startsWith('touch') ? e.changedTouches[0] : e;
                const finalX = touch.clientX;
                const finalY = touch.clientY;
                const deltaX = finalX - active.touchStartX;
                const deltaY = finalY - active.touchStartY;

                // Restore transitions
                mediaContainer.style.transition = 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.4s ease';

                if (active.dragDirection === 'v') {
                    if (deltaY > 100) {
                        active.close();
                    } else {
                        // Snap back
                        mediaContainer.style.transform = 'translate3d(0, 0, 0)';
                        mediaContainer.style.opacity = '1';
                    }
                } else if (active.dragDirection === 'h') {
                    if (Math.abs(deltaX) > 50) {
                        if (deltaX < 0) active.next();
                        else active.prev();
                    }
                }

                active.dragDirection = null;
            };

            content.addEventListener('touchstart', handleStart, { passive: true });
            content.addEventListener('touchmove', handleMove, { passive: false });
            content.addEventListener('touchend', handleEnd, { passive: true });
            content.addEventListener('touchcancel', handleEnd, { passive: true });

            // Mouse support for completeness
            content.addEventListener('mousedown', handleStart);
            window.addEventListener('mousemove', handleMove);
            window.addEventListener('mouseup', handleEnd);
        }
    }

    open(mediaArray, startIndex = 0) {
        if (!mediaArray || mediaArray.length === 0) {
            console.warn('MediaLightbox: No media provided');
            return;
        }

        // Set this instance as the active one
        MediaLightbox.activeInstance = this;
        const mediaContainer = overlay.querySelector('.lightbox-media-container');

        // Reset container state for new open
        mediaContainer.style.transform = 'translate3d(0, 0, 0)';
        mediaContainer.style.opacity = '1';
        mediaContainer.style.transition = 'none';

        this.mediaArray = mediaArray;
        this.currentIndex = startIndex;
        this.isOpen = true;

        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';

        this.renderDots();
        this.showMedia(this.currentIndex);
    }

    close() {
        const overlay = document.getElementById('mediaLightbox');
        overlay.classList.remove('active');
        document.body.style.overflow = '';

        this.isOpen = false;
        MediaLightbox.activeInstance = null;

        const video = overlay.querySelector('.lightbox-video');
        if (video) {
            video.pause();
            video.src = '';
        }

        const img = overlay.querySelector('.lightbox-image');
        if (img) {
            img.src = '';
        }

        const iframe = overlay.querySelector('.lightbox-iframe');
        if (iframe) {
            iframe.src = '';
        }
    }

    next() {
        if (this.currentIndex < this.mediaArray.length - 1) {
            this.currentIndex++;
            this.showMedia(this.currentIndex);
        }
    }

    prev() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.showMedia(this.currentIndex);
        }
    }

    showMedia(index) {
        const overlay = document.getElementById('mediaLightbox');
        const img = overlay.querySelector('.lightbox-image');
        const video = overlay.querySelector('.lightbox-video');
        const iframe = overlay.querySelector('.lightbox-iframe');
        const videoPlaceholder = overlay.querySelector('.lightbox-video-placeholder');
        const socialPlaceholder = overlay.querySelector('.lightbox-social-placeholder');
        const loader = overlay.querySelector('.lightbox-loader');
        const caption = overlay.querySelector('.lightbox-caption');
        const prevBtn = overlay.querySelector('.lightbox-prev');
        const nextBtn = overlay.querySelector('.lightbox-next');

        // Hide all media types
        loader.style.display = 'block';
        img.style.display = 'none';
        video.style.display = 'none';
        iframe.style.display = 'none';
        videoPlaceholder.style.display = 'none';
        socialPlaceholder.style.display = 'none';

        const url = this.mediaArray[index];
        const mediaType = this.detectMediaType(url);
        const filename = this.getFilenameFromUrl(url);

        // Update counter
        if (this.options.showCounter) {
            const counter = overlay.querySelector('.lightbox-counter');
            counter.textContent = `${index + 1} / ${this.mediaArray.length}`;
        }

        // Update caption
        caption.textContent = filename;

        // Update dots
        this.updateDots(index);

        // Show/hide navigation arrows
        prevBtn.style.display = (index === 0) ? 'none' : 'flex';
        nextBtn.style.display = (index === this.mediaArray.length - 1) ? 'none' : 'flex';

        // Load media based on type
        this.loadMedia(mediaType, url, {
            img, video, iframe, videoPlaceholder, socialPlaceholder, loader, caption, filename
        });
    }

    detectMediaType(url) {
        const lowerUrl = url.toLowerCase();

        // Instagram
        if (url.includes('instagram.com/reel/') || url.includes('instagram.com/p/')) {
            return 'instagram';
        }

        // TikTok
        if (url.includes('tiktok.com')) {
            return 'tiktok';
        }

        // YouTube
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            return 'youtube';
        }

        // Twitter/X
        if (url.includes('twitter.com') || url.includes('x.com')) {
            return 'twitter';
        }

        // Video files
        if (lowerUrl.match(/\.(mp4|mov|avi|webm|mkv|m4v|ogv)$/)) {
            return 'video';
        }

        // Default to image
        return 'image';
    }

    loadMedia(mediaType, url, elements) {
        const { img, video, iframe, videoPlaceholder, socialPlaceholder, loader, caption, filename } = elements;

        switch (mediaType) {
            case 'instagram':
                this.loadInstagram(url, iframe, socialPlaceholder, loader, caption, filename);
                break;

            case 'tiktok':
                this.loadTikTok(url, iframe, socialPlaceholder, loader, caption, filename);
                break;

            case 'youtube':
                this.loadYouTube(url, iframe, socialPlaceholder, loader, caption, filename);
                break;

            case 'twitter':
                this.loadTwitter(url, iframe, socialPlaceholder, loader, caption, filename);
                break;

            case 'video':
                this.loadVideo(url, video, videoPlaceholder, loader, caption, filename);
                break;

            default:
                this.loadImage(url, img, loader, caption);
                break;
        }
    }

    loadInstagram(url, iframe, placeholder, loader, caption, filename) {
        const embedUrl = this.getInstagramEmbedUrl(url);

        if (embedUrl) {
            iframe.src = embedUrl;
            iframe.onload = () => {
                loader.style.display = 'none';
                iframe.style.display = 'block';
            };
            iframe.onerror = () => {
                loader.style.display = 'none';
                placeholder.style.display = 'flex';
                caption.textContent = filename + ' (Instagram)';
            };

            // Timeout fallback
            setTimeout(() => {
                if (loader.style.display === 'block') {
                    loader.style.display = 'none';
                    iframe.style.display = 'block';
                }
            }, 3000);
        } else {
            loader.style.display = 'none';
            placeholder.style.display = 'flex';
            caption.textContent = 'Instagram content';
        }
    }

    loadTikTok(url, iframe, placeholder, loader, caption, filename) {
        const embedUrl = this.getTikTokEmbedUrl(url);

        if (embedUrl) {
            iframe.src = embedUrl;
            iframe.onload = () => {
                loader.style.display = 'none';
                iframe.style.display = 'block';
            };
            iframe.onerror = () => {
                loader.style.display = 'none';
                placeholder.style.display = 'flex';
                caption.textContent = filename + ' (TikTok)';
            };

            setTimeout(() => {
                if (loader.style.display === 'block') {
                    loader.style.display = 'none';
                    iframe.style.display = 'block';
                }
            }, 3000);
        } else {
            loader.style.display = 'none';
            placeholder.style.display = 'flex';
            caption.textContent = 'TikTok content';
        }
    }

    loadYouTube(url, iframe, placeholder, loader, caption, filename) {
        const embedUrl = this.getYouTubeEmbedUrl(url);

        if (embedUrl) {
            iframe.src = embedUrl;
            iframe.onload = () => {
                loader.style.display = 'none';
                iframe.style.display = 'block';
            };
            iframe.onerror = () => {
                loader.style.display = 'none';
                placeholder.style.display = 'flex';
                caption.textContent = filename + ' (YouTube)';
            };

            setTimeout(() => {
                if (loader.style.display === 'block') {
                    loader.style.display = 'none';
                    iframe.style.display = 'block';
                }
            }, 3000);
        } else {
            loader.style.display = 'none';
            placeholder.style.display = 'flex';
            caption.textContent = 'YouTube content';
        }
    }

    loadTwitter(url, iframe, placeholder, loader, caption, filename) {
        // Twitter embeds are more complex, showing placeholder
        loader.style.display = 'none';
        placeholder.style.display = 'flex';
        caption.textContent = filename + ' (Twitter/X)';
    }

    loadVideo(url, video, placeholder, loader, caption, filename) {
        video.src = url;

        video.onloadeddata = () => {
            loader.style.display = 'none';
            video.style.display = 'block';

            if (this.options.autoPlayVideo) {
                video.play().catch(e => console.warn('Autoplay failed:', e));
            }
        };

        video.onerror = () => {
            loader.style.display = 'none';
            video.style.display = 'none';
            placeholder.style.display = 'flex';
            caption.textContent = filename + ' (Video)';
        };

        setTimeout(() => {
            if (loader.style.display === 'block') {
                loader.style.display = 'none';
                if (video.style.display === 'none' && placeholder.style.display === 'none') {
                    placeholder.style.display = 'flex';
                }
            }
        }, 10000);
    }

    loadImage(url, img, loader, caption) {
        img.src = url;
        img.onload = () => {
            loader.style.display = 'none';
            img.style.display = 'block';
        };
        img.onerror = () => {
            loader.style.display = 'none';
            caption.textContent = '❌ Failed to load image';
        };
    }

    getInstagramEmbedUrl(url) {
        const match = url.match(/instagram\.com\/(reel|p)\/([^/?]+)/);
        if (match) {
            return `https://www.instagram.com/${match[1]}/${match[2]}/embed`;
        }
        return null;
    }

    getTikTokEmbedUrl(url) {
        const match = url.match(/tiktok\.com\/.*\/video\/(\d+)/);
        if (match) {
            return `https://www.tiktok.com/embed/${match[1]}`;
        }
        return null;
    }

    getYouTubeEmbedUrl(url) {
        let videoId = null;

        // Standard watch URL
        const watchMatch = url.match(/youtube\.com\/watch\?v=([^&]+)/);
        if (watchMatch) {
            videoId = watchMatch[1];
        }

        // Short URL
        const shortMatch = url.match(/youtu\.be\/([^?]+)/);
        if (shortMatch) {
            videoId = shortMatch[1];
        }

        // Shorts
        const shortsMatch = url.match(/youtube\.com\/shorts\/([^?]+)/);
        if (shortsMatch) {
            videoId = shortsMatch[1];
        }

        if (videoId) {
            return `https://www.youtube.com/embed/${videoId}`;
        }

        return null;
    }

    renderDots() {
        if (!this.options.showDots) return;

        const dotsContainer = document.querySelector('.lightbox-dots');
        const totalMedia = this.mediaArray.length;

        if (totalMedia <= 1) {
            dotsContainer.style.display = 'none';
            return;
        }

        dotsContainer.style.display = 'flex';
        dotsContainer.innerHTML = '';

        const maxDots = this.options.maxDots;
        const showDots = totalMedia > maxDots;

        if (showDots) {
            const dots = Math.min(totalMedia, maxDots);
            for (let i = 0; i < dots; i++) {
                const dot = document.createElement('span');
                dot.className = 'lightbox-dot';
                dotsContainer.appendChild(dot);
            }
        } else {
            for (let i = 0; i < totalMedia; i++) {
                const dot = document.createElement('span');
                dot.className = 'lightbox-dot';
                dot.addEventListener('click', () => {
                    this.currentIndex = i;
                    this.showMedia(i);
                });
                dotsContainer.appendChild(dot);
            }
        }

        this.updateDots(this.currentIndex);
    }

    updateDots(index) {
        if (!this.options.showDots) return;

        const dots = document.querySelectorAll('.lightbox-dot');
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
        });
    }

    getFilenameFromUrl(url) {
        // Instagram
        if (url.includes('instagram.com')) {
            return 'Instagram Content';
        }

        // TikTok
        if (url.includes('tiktok.com')) {
            return 'TikTok Video';
        }

        // YouTube
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            return 'YouTube Video';
        }

        // Twitter
        if (url.includes('twitter.com') || url.includes('x.com')) {
            return 'Twitter/X Content';
        }

        // Regular files
        try {
            const urlObj = new URL(url);
            const pathname = urlObj.pathname;
            const filename = pathname.substring(pathname.lastIndexOf('/') + 1);
            return decodeURIComponent(filename) || 'media';
        } catch {
            return 'media';
        }
    }
}

if (typeof window !== 'undefined') {
    window.MediaLightbox = MediaLightbox;
}
