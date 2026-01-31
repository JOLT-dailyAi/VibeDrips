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
    static _instance = null;

    constructor(options = {}) {
        // 🛡️ TRUE SINGLETON: Ensure only one instance ever exists
        if (MediaLightbox._instance) {
            return MediaLightbox._instance;
        }
        MediaLightbox._instance = this;
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
        this._pulseInterval = null; // Track pulses for cleanup
    }

    isMobileOrTablet() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
            (window.innerWidth < 1024 && 'ontouchstart' in window);
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
                <!-- Grouped Nav Hub (Right Side Stack) -->
                <div class="lightbox-nav-hub">
                    <button class="lightbox-close" aria-label="Close">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                    
                    <button class="lightbox-arrow lightbox-prev" aria-label="Previous">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="15 18 9 12 15 6"></polyline>
                        </svg>
                    </button>
                    
                    <button class="lightbox-arrow lightbox-next" aria-label="Next">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                    </button>
                </div>

                <div class="lightbox-counter"></div>
                
                <div class="lightbox-content">
                    <div class="lightbox-media-container">
                        <div class="lightbox-sliding-strip"></div>
                        
                        <!-- Iframe Shield: Invisible layer to capture "Wake" movements & Swipes -->
                        <div class="lightbox-iframe-shield"></div>

                        <div class="lightbox-loader"></div>
                    </div>

                    <!-- Phase 1: Engagement Pill -->
                    <div class="engagement-pill">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                            <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                            <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                        </svg>
                        Tap for sound
                    </div>
                </div>
                
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

            // 🔇 SILENCE FIRST: Stop all media before the animation starts
            active.stopMedia();

            closeBtn.classList.add('closing-animation');
            setTimeout(() => {
                active.close();
                closeBtn.classList.remove('closing-animation');
            }, 300);
        });

        const shield = overlay.querySelector('.lightbox-iframe-shield');

        overlay.addEventListener('click', (e) => {
            const active = MediaLightbox.activeInstance;
            if (active && e.target === overlay) active.close();
            // User click counts as activity
            if (active) active.resetIdleTimer();
        });

        // Shield catches activity when iframe is covered (UI hidden state)
        if (shield) {
            // ⚡️ TOUCH-FIRST: Catch the gesture instantly for unmuting intent
            const handleUnmuteGesture = (e) => {
                const active = MediaLightbox.activeInstance;
                if (!active) return;

                // 🛡️ SWIPE GUARD: If user is swiping, don't trigger the tap-unmute
                if (Math.abs(active.touchMoveX - active.touchStartX) > 20) return;

                // 🔊 Unlock Session
                if (window.MediaState) window.MediaState.setUnmuted();

                // 🎯 Trigger Pulses for the active center slot
                active.triggerPulsesForCenterSlot();

                // 🛡️ RELEASE: First tap gives control to underlying player
                shield.style.pointerEvents = 'none';
                active.resetIdleTimer();
            };

            shield.addEventListener('touchstart', (e) => {
                e.stopImmediatePropagation(); // 🛡️ CAPTURE DOMINANCE
                handleUnmuteGesture(e);
            }, { capture: true, passive: true });
            shield.addEventListener('click', (e) => {
                e.stopImmediatePropagation(); // 🛡️ CAPTURE DOMINANCE
                handleUnmuteGesture(e);
            }, { capture: true });

            shield.addEventListener('mousemove', (e) => {
                e.stopImmediatePropagation();
                const active = MediaLightbox.activeInstance;
                if (active) active.resetIdleTimer();
            }, { capture: true });
        }

        // Wake UI on any window-level movement (Desktop Fix for Iframes)
        window.addEventListener('mousemove', (e) => {
            const active = MediaLightbox.activeInstance;
            if (active && active.isOpen) active.resetIdleTimer();
        }, { capture: true });

        overlay.addEventListener('pointermove', (e) => {
            e.stopImmediatePropagation();
            const active = MediaLightbox.activeInstance;
            if (active) active.resetIdleTimer();
        }, { capture: true });

        overlay.addEventListener('touchstart', (e) => {
            const active = MediaLightbox.activeInstance;
            if (active && active.isOpen) {
                // e.stopImmediatePropagation(); // ❌ REMOVED: This was killing internal gestures (Shield/Swipe)
                active.resetIdleTimer();
            }
        }, { capture: true, passive: true });

        // 🛡️ BUBBLE PROTECTION: Prevent site background from seeing the touch
        overlay.addEventListener('touchstart', (e) => {
            e.stopPropagation();
        });

        prevBtn.addEventListener('click', (e) => {
            e.stopImmediatePropagation();
            const active = MediaLightbox.activeInstance;
            if (active) {
                if (window.MediaState) window.MediaState.setUnmuted();
                active.prev();
            }
        }, { capture: true });
        nextBtn.addEventListener('click', (e) => {
            e.stopImmediatePropagation();
            const active = MediaLightbox.activeInstance;
            if (active) {
                if (window.MediaState) window.MediaState.setUnmuted();
                active.next();
            }
        }, { capture: true });

        // Navigation dots should also participate in unmuting
        const dotsContainer = overlay.querySelector('.lightbox-dots');
        if (dotsContainer) {
            dotsContainer.addEventListener('click', (e) => {
                e.stopImmediatePropagation();
                if (window.MediaState) window.MediaState.setUnmuted();

                // ✅ NAVIGATION RESET: When clicking dots, we assume intent to play
                const centerVideo = overlay.querySelector('.center-slot video');
                if (centerVideo) centerVideo.dataset.userPaused = 'false';
            }, { capture: true });
        }

        if (this.options.enableKeyboard) {
            window.addEventListener('keydown', (e) => {
                const active = MediaLightbox.activeInstance;
                if (!active || !active.isOpen) return;

                active.resetIdleTimer();

                if (e.key === 'Escape') {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    closeBtn.click();
                }
                if (e.key === 'ArrowLeft') active.prev();
                if (e.key === 'ArrowRight') active.next();
            }, { capture: true });
        }

        if (this.options.enableSwipe) {
            const mediaContainer = overlay.querySelector('.lightbox-media-container');

            const handleStart = (e) => {
                // e.stopImmediatePropagation(); // ❌ REMOVED: Allow child (Shield) to receive capture-phase events
                const active = MediaLightbox.activeInstance;
                if (!active) return;
                active.resetIdleTimer();

                const touch = e.type.startsWith('touch') ? e.touches[0] : e;
                active.touchStartX = touch.clientX;
                active.touchStartY = touch.clientY;
                active.touchMoveX = touch.clientX; // 🎯 Initialize to pass swipe guard in handleUnmuteGesture
                active.touchMoveY = touch.clientY;
                active.isDragging = true;
                active.dragDirection = null;

                // Reset container transition for 1:1 tracking
                mediaContainer.style.transition = 'none';
            };

            const handleMove = (e) => {
                const active = MediaLightbox.activeInstance;
                if (!active || !active.isDragging) return;

                e.stopPropagation(); // 🛡️ TOUCH ISOLATION - Only stop if we are actually dragging
                active.resetIdleTimer();

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
                } else if (active.dragDirection === 'h') {
                    // 📏 1:1 Strip Tracking (Horizontal)
                    const strip = overlay.querySelector('.lightbox-sliding-strip');
                    if (strip) {
                        strip.style.transition = 'none'; // Instant tracking
                        strip.style.transform = `translate3d(calc(-200% + ${deltaX}px), 0, 0)`;
                    }
                    if (e.cancelable) e.preventDefault();
                }
            };

            const handleEnd = (e) => {
                const active = MediaLightbox.activeInstance;
                if (!active || !active.isDragging) return;

                e.stopImmediatePropagation(); // 🛡️ CAPTURE DOMINANCE - Only stop if we were dragging
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

            // Expanded swipe area: Attach to overlay for universal screen responsiveness
            overlay.addEventListener('touchstart', (e) => {
                if (e.target.closest('button')) return;
                handleStart(e);
            }, { capture: true, passive: true });

            overlay.addEventListener('mousedown', (e) => {
                if (e.target.closest('button')) return;
                handleStart(e);
            }, { capture: true });

            window.addEventListener('touchmove', handleMove, { capture: true, passive: false });
            window.addEventListener('mousemove', handleMove, { capture: true });
            window.addEventListener('touchend', handleEnd, { capture: true });
            window.addEventListener('mouseup', handleEnd, { capture: true });
        }
    }

    open(mediaArray, startIndex = 0) {
        if (!mediaArray || mediaArray.length === 0) {
            console.warn('MediaLightbox: No media provided');
            return;
        }

        // Set this instance as the active one
        MediaLightbox.activeInstance = this;

        const overlay = document.getElementById('mediaLightbox');
        if (!overlay) return;

        const mediaContainer = overlay.querySelector('.lightbox-media-container');

        // Reset container state for new open
        mediaContainer.style.transform = 'translate3d(0, 0, 0)';
        mediaContainer.style.opacity = '1';
        mediaContainer.style.transition = 'none';

        this.mediaArray = mediaArray;
        this.currentIndex = startIndex;
        this.isOpen = true;

        this.isOpen = true;

        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';

        this.initIdleTimer();
        this.renderDots();
        this.refreshStrip();
    }

    refreshStrip() {
        if (!this.isOpen) return;
        const overlay = document.getElementById('mediaLightbox');
        const strip = overlay.querySelector('.lightbox-sliding-strip');
        if (!strip) return;

        const total = this.mediaArray.length;
        const idx = this.currentIndex;

        // Calculate 5-item window (Preload Center + 2 each side)
        const windowIndices = [
            idx - 2,
            idx - 1,
            idx,
            idx + 1,
            idx + 2
        ];

        strip.style.transition = 'none';
        strip.style.transform = 'translate3d(-200%, 0, 0)'; // GPU Accelerated
        strip.innerHTML = '';

        windowIndices.forEach((wIdx, i) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'lightbox-media-wrapper';
            if (i === 2) wrapper.classList.add('center-slot');

            if (wIdx >= 0 && wIdx < total) {
                const url = this.mediaArray[wIdx];
                const type = this.detectMediaType(url);
                wrapper.innerHTML = this.getMediaHTML(type, url, i === 2);
            } else {
                wrapper.innerHTML = ''; // Empty slot
            }
            strip.appendChild(wrapper);

            // ✅ USER INTENT SOVEREIGNTY: Track manual pauses for the active center slot
            if (i === 2) {
                const video = wrapper.querySelector('video');
                if (video) {
                    video.addEventListener('pause', () => {
                        // Only register manual pause if the video was actually playing
                        // (Prevents browser autoplay blocks from setting userPaused=true)
                        if (video.currentTime > 0.1) {
                            video.dataset.userPaused = 'true';
                        }
                    });
                }
            }
        });

        // Force reflow
        void strip.offsetWidth;
        strip.style.transition = 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)';

        this.updateCounter();
        this.updateDots(idx);
        this.updateNavButtons();

        // 🛡️ SHIELD & PILLING CONTROL: Asymmetric OS Logic
        const isIOS = window.Device?.isIOS();
        const shouldMute = window.MediaState?.shouldStartMuted();

        const shield = overlay.querySelector('.lightbox-iframe-shield');
        const pill = overlay.querySelector('.engagement-pill');

        // 🍎 iOS: Every swipe resets the pill and muted state
        if (isIOS) {
            if (shield) {
                shield.style.pointerEvents = 'auto';
                shield.style.display = 'block';
            }
            if (pill) pill.classList.add('active');
        }
        // 🤖 ANDROID / DESKTOP: Only show pill if intent hasn't been established
        else {
            if (shouldMute) {
                if (shield) {
                    shield.style.pointerEvents = 'auto';
                    shield.style.display = 'block';
                }
                if (pill) pill.classList.add('active');
            } else {
                if (shield) {
                    shield.style.pointerEvents = 'none';
                    shield.style.display = 'none';
                }
                if (pill) pill.classList.remove('active');

                // 🔊 AUTO-PULSE: Intent already established, trigger sound immediately
                this.triggerPulsesForCenterSlot();
            }
        }
    }

    getMediaHTML(type, url, isActive = false) {
        if (type === 'video') {
            // 🛡️ ASYMMETRIC MUTE: Initial attribute based on platform trust
            const shouldStartMuted = window.MediaState?.shouldStartMuted();
            const autoplayAttr = isActive ? `autoplay ${shouldStartMuted ? 'muted' : ''}` : '';

            // ✅ NATIVE RESET: Ensure new elements start with clean intent
            const videoHTML = `<video controls playsinline ${autoplayAttr} src="${url}" class="lightbox-video" data-user-paused="false" data-user-muted="false"></video>`;
            return videoHTML;
        }
        else if (['youtube', 'instagram', 'tiktok'].includes(type)) {
            const embedUrl = this.getUniversalEmbedUrl(type, url, isActive);
            return `<iframe class="lightbox-iframe" frameborder="0" allowfullscreen allow="autoplay; encrypted-media" src="${embedUrl}"></iframe>`;
        } else {
            return `<img class="lightbox-image" src="${url}" alt="">`;
        }
    }

    getUniversalEmbedUrl(type, url, isActive) {
        if (type === 'youtube') {
            // 🛡️ Unified Optimistic Strategy: Always attempt unmuted (mute=0)
            const muteVal = isActive ? '0' : '1';
            const autoplayVal = isActive ? '1' : '0';
            return this.getYouTubeEmbedUrl(url, autoplayVal, muteVal);
        }
        if (type === 'instagram') {
            const embed = this.getInstagramEmbedUrl(url);
            // Instagram doesn't support autoplay param well, so we rely on isActive to trigger unmuting pulse later
            return embed;
        }
        if (type === 'tiktok') {
            const embed = this.getTikTokEmbedUrl(url);
            // TikTok often autoplays by default if visible, so we ensure visibility logic handles it
            return embed;
        }
        return url;
    }

    updateCounter() {
        const overlay = document.getElementById('mediaLightbox');
        const counter = overlay.querySelector('.lightbox-counter');
        if (counter) counter.textContent = `${this.currentIndex + 1} / ${this.mediaArray.length}`;
    }

    updateNavButtons() {
        const overlay = document.getElementById('mediaLightbox');
        const prevBtn = overlay.querySelector('.lightbox-prev');
        const nextBtn = overlay.querySelector('.lightbox-next');
        const isMobile = window.innerWidth < 768;

        if (isMobile) {
            // Mobile: Swipes are primary, hide arrows to clear space
            prevBtn.style.display = 'none';
            nextBtn.style.display = 'none';
        } else {
            // Desktop: Show arrows for ergonomic navigation
            prevBtn.style.display = 'flex';
            nextBtn.style.display = 'flex';

            const isFirst = this.currentIndex === 0;
            const isLast = this.currentIndex === this.mediaArray.length - 1;

            // Use visibility/opacity to participate in auto-hide while maintaining layout
            prevBtn.style.visibility = isFirst ? 'hidden' : 'visible';
            prevBtn.style.opacity = isFirst ? '0' : '1';
            prevBtn.style.pointerEvents = isFirst ? 'none' : 'auto';

            nextBtn.style.visibility = isLast ? 'hidden' : 'visible';
            nextBtn.style.opacity = isLast ? '0' : '1';
            nextBtn.style.pointerEvents = isLast ? 'none' : 'auto';
        }
    }

    close() {
        const overlay = document.getElementById('mediaLightbox');
        overlay.classList.remove('active');
        overlay.classList.remove('controls-hidden');
        document.body.style.overflow = '';

        this.isOpen = false;
        MediaLightbox.activeInstance = null;

        if (this._idleTimer) {
            clearTimeout(this._idleTimer);
            this._idleTimer = null;
        }

        this.stopMedia();
    }

    /**
     * Auto-Hide Interface Logic
     */
    initIdleTimer() {
        this.resetIdleTimer();
    }

    resetIdleTimer() {
        const overlay = document.getElementById('mediaLightbox');
        if (!overlay || !this.isOpen) return;

        overlay.classList.remove('controls-hidden');

        if (this._idleTimer) clearTimeout(this._idleTimer);

        this._idleTimer = setTimeout(() => {
            if (this.isOpen) {
                overlay.classList.add('controls-hidden');
            }
        }, 2000); // Snappier hide: 2 seconds of peace
    }

    /**
     * Stop Media - Silences and KILL everything in the lightbox
     */
    stopMedia() {
        const overlay = document.getElementById('mediaLightbox');
        if (!overlay) return;

        // Clear any active pulse intervals
        if (this._pulseInterval) {
            clearInterval(this._pulseInterval);
            this._pulseInterval = null;
        }

        // Nuclear Purge: Find ALL media wrappers in the strip
        const wrappers = overlay.querySelectorAll('.lightbox-media-wrapper');
        wrappers.forEach(wrapper => {
            const video = wrapper.querySelector('video');
            if (video) {
                video.pause();
                video.src = '';
                video.load(); // Force release
                video.remove();
            }

            const iframe = wrapper.querySelector('iframe');
            if (iframe) {
                if (iframe.contentWindow) {
                    // Try to send stop commands before killing
                    try {
                        iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'pauseVideo', args: '' }), '*');
                        iframe.contentWindow.postMessage(JSON.stringify({ method: 'pause' }), '*');
                        iframe.contentWindow.postMessage('pause', '*');
                    } catch (e) { }
                }
                iframe.src = '';
                iframe.remove();
            }

            const img = wrapper.querySelector('img');
            if (img) {
                img.src = '';
                img.remove();
            }
        });

        // Finally, wipe the strip to be absolutely sure
        const strip = overlay.querySelector('.lightbox-sliding-strip');
        if (strip) strip.innerHTML = '';
    }

    next() {
        if (this.currentIndex < this.mediaArray.length - 1) {
            this.currentIndex++;

            // ✅ NAVIGATION RESET: Force intent to play on next
            const currentVideo = document.querySelector('#mediaLightbox .center-slot video');
            if (currentVideo) currentVideo.dataset.userPaused = 'false';

            this.refreshStrip();
        }
    }

    prev() {
        if (this.currentIndex > 0) {
            this.currentIndex--;

            // ✅ NAVIGATION RESET: Force intent to play on prev
            const currentVideo = document.querySelector('#mediaLightbox .center-slot video');
            if (currentVideo) currentVideo.dataset.userPaused = 'false';

            this.refreshStrip();
        }
    }

    /**
     * Triggers unmuting pulses for the media element in the center slot
     */
    triggerPulsesForCenterSlot() {
        if (!this.isOpen) return;
        const overlay = document.getElementById('mediaLightbox');
        const centerSlot = overlay.querySelector('.center-slot');
        if (!centerSlot) return;

        const video = centerSlot.querySelector('video');
        const iframe = centerSlot.querySelector('iframe');

        // 🛡️ USER INTENT SOVEREIGNTY: Back off if user manually paused
        if (video?.dataset.userPaused === 'true') {
            if (this._pulseInterval) {
                clearInterval(this._pulseInterval);
                this._pulseInterval = null;
            }
            return;
        }

        // 🛡️ GUARD: Only unmute if intent is established OR it's a pulse after manual tap
        const shouldMute = window.MediaState?.shouldStartMuted();

        if (video) {
            if (!shouldMute) {
                video.muted = false;
                video.volume = 0.5;
            } else {
                video.muted = true;
            }
            video.play().catch(() => { });
        }

        if (iframe) {
            const sendPulse = () => {
                if (!this.isOpen || !iframe.contentWindow) return;

                // If we should be muted (iOS or 1st Android), only send Play command, keep muted
                if (shouldMute) {
                    iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'playVideo', args: '' }), '*');
                    return;
                }

                iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'unMute', args: '' }), '*');
                iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'setVolume', args: [20] }), '*');
                iframe.contentWindow.postMessage('unmute', '*');
                iframe.contentWindow.postMessage(JSON.stringify({ event: 'unmute' }), '*');
                iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'playVideo', args: '' }), '*');
            };

            if (this._pulseInterval) clearInterval(this._pulseInterval);

            sendPulse();
            let pulses = 0;
            this._pulseInterval = setInterval(() => {
                sendPulse();
                if (++pulses >= 10 || !this.isOpen) clearInterval(this._pulseInterval);
            }, 400);
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
        const pill = overlay.querySelector('.engagement-pill');
        const prevBtn = overlay.querySelector('.lightbox-prev');
        const nextBtn = overlay.querySelector('.lightbox-next');

        // Hide all media types
        loader.style.display = 'block';
        img.style.display = 'none';
        video.style.display = 'none';
        iframe.style.display = 'none';
        videoPlaceholder.style.display = 'none';
        socialPlaceholder.style.display = 'none';

        // 🛡️ AUTO-RELEASE: No shield barrier if sound is already unlocked
        const shield = overlay.querySelector('.lightbox-iframe-shield');
        if (shield) {
            const isUnmutedSession = window.MediaState && window.MediaState.isUnmuted();
            const strategy = window.Device?.getStrategy() || 'muted';
            const isHighTrust = (strategy === 'unmuted' || isUnmutedSession);

            if (isHighTrust) {
                shield.style.pointerEvents = 'none';
                shield.style.display = 'none';
                if (pill) pill.classList.remove('active');
            } else {
                shield.style.pointerEvents = 'auto';
                shield.style.display = 'block';
                if (pill) pill.classList.add('active');
            }
        }

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

        // Show/hide navigation arrows based on device and boundary
        const isSmallScreen = window.innerWidth < 768; // Mobile Phones
        if (isSmallScreen) {
            prevBtn.style.display = 'none';
            nextBtn.style.display = 'none';
        } else {
            prevBtn.style.display = 'flex';
            nextBtn.style.display = 'flex';

            // Lock positions by using visibility/pointer-events instead of display
            const isFirst = index === 0;
            const isLast = index === this.mediaArray.length - 1;

            prevBtn.style.visibility = isFirst ? 'hidden' : 'visible';
            prevBtn.style.pointerEvents = isFirst ? 'none' : 'auto';
            prevBtn.style.opacity = isFirst ? '0' : '1';

            nextBtn.style.visibility = isLast ? 'hidden' : 'visible';
            nextBtn.style.pointerEvents = isLast ? 'none' : 'auto';
            nextBtn.style.opacity = isLast ? '0' : '1';
        }

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

    /**
     * Fresh Player Injection (Mobile Optimization)
     * Replaces the target element with a fresh one to reset browser autoplay state
     */
    refreshPlayer(type, container, url, attributes = {}) {
        if (type === 'iframe') {
            const attrStr = Object.entries(attributes).map(([k, v]) => `${k}="${v}"`).join(' ');
            container.innerHTML = `<iframe class="lightbox-iframe" frameborder="0" allowfullscreen allow="autoplay; encrypted-media" src="${url}" ${attrStr} style="display: block;"></iframe>`;
            return container.querySelector('iframe');
        } else if (type === 'video') {
            const attrStr = Object.entries(attributes).map(([k, v]) => `${k}="${v}"`).join(' ');
            // 🛡️ ASYMMETRIC MUTE: Initial attribute based on platform trust
            const shouldStartMuted = window.MediaState?.shouldStartMuted();
            const muteAttr = shouldStartMuted ? 'muted' : '';
            container.innerHTML = `<video class="lightbox-video" controls autoplay ${muteAttr} playsinline src="${url}" ${attrStr} style="display: block;"></video>`;
            return container.querySelector('video');
        }
        return null;
    }

    loadInstagram(url, iframe, placeholder, loader, caption, filename) {
        const embedUrl = this.getInstagramEmbedUrl(url);
        const isMobile = this.isMobileOrTablet();

        if (embedUrl) {
            if (isMobile) {
                const container = iframe.parentElement;
                iframe = this.refreshPlayer('iframe', container, embedUrl);
                loader.style.display = 'none';
            } else {
                iframe.src = embedUrl;
                iframe.onload = () => {
                    loader.style.display = 'none';
                    iframe.style.display = 'block';
                };
            }

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
        const isMobile = this.isMobileOrTablet();

        if (embedUrl) {
            if (isMobile) {
                const container = iframe.parentElement;
                iframe = this.refreshPlayer('iframe', container, embedUrl);
                loader.style.display = 'none';
            } else {
                iframe.src = embedUrl;
                iframe.onload = () => {
                    loader.style.display = 'none';
                    iframe.style.display = 'block';
                };
            }

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
        const isMobile = this.isMobileOrTablet();

        if (embedUrl) {
            const onMediaReady = () => {
                loader.style.display = 'none';
                iframe.style.display = 'block';

                // 🔊 Successive Pulse: Ensure unmuted & 20% volume
                const sendAudioPulse = () => {
                    if (!this.isOpen || !iframe.contentWindow) return;

                    // 🛡️ THE PULSE GUARD: Wait for warmup (300ms), then flip sound
                    const isUnmutedSession = window.MediaState && window.MediaState.isUnmuted();
                    const strategy = window.Device?.getStrategy() || 'muted';
                    const isHighTrust = (strategy === 'unmuted' || isUnmutedSession);

                    if (isHighTrust) {
                        setTimeout(() => {
                            if (!this.isOpen || !iframe.contentWindow) return;
                            iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'unMute', args: '' }), '*');
                            iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'setVolume', args: [20] }), '*');
                            iframe.contentWindow.postMessage('unmute', '*');
                            iframe.contentWindow.postMessage(JSON.stringify({ event: 'unmute' }), '*');
                        }, 300);
                    }

                    iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'playVideo', args: '' }), '*');
                };

                sendAudioPulse();
                let pulseCount = 0;
                this._pulseInterval = setInterval(() => {
                    sendAudioPulse();
                    if (++pulseCount >= 10 || !this.isOpen) clearInterval(this._pulseInterval);
                }, 400); // 🔊 Pulse Overdrive (Global Standard)
            };

            if (isMobile) {
                const container = iframe.parentElement;
                iframe = this.refreshPlayer('iframe', container, embedUrl);
                // On mobile, just fire the pulses immediately since we don't have a reliable onload synchronization that keeps the gesture active
                onMediaReady();
            } else {
                iframe.src = embedUrl;
                iframe.onload = onMediaReady;
            }

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
        const isMobile = this.isMobileOrTablet();

        const onVideoReady = () => {
            loader.style.display = 'none';
            video.style.display = 'block';

            // 🛡️ BELT & SUSPENDERS: HTML attributes + JS Fallback
            video.muted = true;
            video.volume = 0.2;
            video.setAttribute('playsinline', '');
            video.setAttribute('autoplay', '');
            video.setAttribute('muted', '');

            // ✅ NATIVE BRIDGE: Flip sound as soon as motion starts
            if (!video.dataset.bridgeSet) {
                video.dataset.bridgeSet = 'true';
                video.addEventListener('playing', () => {
                    if (window.MediaState && window.MediaState.isUnmuted()) {
                        video.muted = false;
                        video.volume = 0.5;
                    }
                }, { once: true });
            }

            // ✅ USER INTENT SOVEREIGNTY: Back off if user manually interacted
            if (video.dataset.userMuted === 'true' || video.dataset.userPaused === 'true') {
                return;
            }

            video.play().then(() => {
                // 🔊 SAFE UNMUTE: Only unmute AFTER confirmed playback
                // AND only if the user hasn't explicitly muted it already
                const strategy = window.Device?.getStrategy() || 'muted';
                const isHighTrust = (strategy === 'unmuted' || (window.MediaState && window.MediaState.isUnmuted()));

                if (isHighTrust && video.dataset.userMuted !== 'true') {
                    video.muted = false;
                    video.volume = 0.5;
                }
            }).catch(error => {
                console.warn("🎬 Lightbox: Autoplay blocked:", error);
                video.muted = true;
                video.play().catch(() => { });
            });

            // Track Intent
            if (!video.dataset.intentBound) {
                video.dataset.intentBound = 'true';
                video.addEventListener('volumechange', () => {
                    if (video.muted) video.dataset.userMuted = 'true';
                    else video.dataset.userMuted = 'false';
                });
                video.addEventListener('pause', () => {
                    video.dataset.userPaused = 'true';
                });
            }
        };

        if (isMobile) {
            const container = video.parentElement;
            video = this.refreshPlayer('video', container, url);
            // On mobile, native videos often play better if we trigger immediately
            onVideoReady();
        } else {
            video.src = url;
            video.onloadeddata = onVideoReady;
        }

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

    getYouTubeEmbedUrl(url, autoplay = '1', mute = '1') {
        let videoId = null;

        const watchMatch = url.match(/youtube\.com\/watch\?v=([^&]+)/);
        if (watchMatch) videoId = watchMatch[1];

        const shortMatch = url.match(/youtu\.be\/([^?]+)/);
        if (shortMatch) videoId = shortMatch[1];

        const shortsMatch = url.match(/youtube\.com\/shorts\/([^?]+)/);
        if (shortsMatch) videoId = shortsMatch[1];

        if (videoId) {
            // 🛡️ MOBILE PROTOCOL: Always start MUTED (mute=1) to guarantee autoplay permission.
            // UNLESS: The session is already unmuted globally.
            const initialMute = (window.MediaState && window.MediaState.isUnmuted()) ? '0' : '1';

            return `https://www.youtube.com/embed/${videoId}?enablejsapi=1&autoplay=${autoplay}&mute=${initialMute}&rel=0`;
        }
        return null;
    }

    renderDots() {
        if (!this.options.showDots) return;

        const overlay = document.getElementById('mediaLightbox');
        if (!overlay) return;
        const dotsContainer = overlay.querySelector('.lightbox-dots');
        const totalMedia = this.mediaArray.length;

        if (totalMedia <= 1) {
            dotsContainer.style.display = 'none';
            return;
        }

        dotsContainer.style.display = 'flex';
        dotsContainer.innerHTML = '';

        for (let i = 0; i < totalMedia; i++) {
            const dot = document.createElement('span');
            dot.className = 'lightbox-dot';
            dot.addEventListener('click', () => {
                const active = MediaLightbox.activeInstance;
                if (active) {
                    active.currentIndex = i;
                    active.showMedia(i);
                }
            });
            dotsContainer.appendChild(dot);
        }

        this.updateDots(this.currentIndex);
    }

    updateDots(index) {
        if (!this.options.showDots) return;

        const overlay = document.getElementById('mediaLightbox');
        if (!overlay) return;
        const dots = overlay.querySelectorAll('.lightbox-dot');
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
