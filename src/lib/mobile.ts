/**
 * Mobile Experience Utilities
 * Comprehensive mobile optimization for Sonic Guardian
 */

export interface MobileBreakpoints {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
}

export const MOBILE_BREAKPOINTS: MobileBreakpoints = {
  xs: 320,
  sm: 375,
  md: 768,
  lg: 1024,
  xl: 1280
};

export interface TouchGesture {
  type: 'tap' | 'double-tap' | 'swipe' | 'long-press';
  x: number;
  y: number;
  timestamp: number;
  deltaX?: number;
  deltaY?: number;
  velocity?: number;
}

export class MobileUtils {
  private static touchStartX = 0;
  private static touchStartY = 0;
  private static touchStartTime = 0;
  private static isLongPress = false;
  private static longPressTimer: number | null = null;

  /**
   * Get current device information
   */
  static getDeviceInfo() {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
      isMobile: this.isMobile(),
      isTablet: this.isTablet(),
      isTouch: this.isTouchDevice(),
      orientation: this.getOrientation(),
      pixelRatio: window.devicePixelRatio || 1
    };
  }

  /**
   * Check if device is mobile
   */
  static isMobile(): boolean {
    return window.innerWidth <= MOBILE_BREAKPOINTS.md;
  }

  /**
   * Check if device is tablet
   */
  static isTablet(): boolean {
    return window.innerWidth > MOBILE_BREAKPOINTS.md && window.innerWidth <= MOBILE_BREAKPOINTS.lg;
  }

  /**
   * Check if device supports touch
   */
  static isTouchDevice(): boolean {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  /**
   * Get device orientation
   */
  static getOrientation(): 'portrait' | 'landscape' {
    return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
  }

  /**
   * Get appropriate breakpoint
   */
  static getCurrentBreakpoint(): keyof MobileBreakpoints {
    const width = window.innerWidth;
    if (width < MOBILE_BREAKPOINTS.sm) return 'xs';
    if (width < MOBILE_BREAKPOINTS.md) return 'sm';
    if (width < MOBILE_BREAKPOINTS.lg) return 'md';
    if (width < MOBILE_BREAKPOINTS.xl) return 'lg';
    return 'xl';
  }

  /**
   * Add touch gesture detection to an element
   */
  static addTouchGestures(
    element: HTMLElement,
    callbacks: {
      onTap?: (gesture: TouchGesture) => void;
      onDoubleTap?: (gesture: TouchGesture) => void;
      onSwipe?: (gesture: TouchGesture) => void;
      onLongPress?: (gesture: TouchGesture) => void;
    }
  ): () => void {
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      
      const touch = e.touches[0];
      this.touchStartX = touch.clientX;
      this.touchStartY = touch.clientY;
      this.touchStartTime = Date.now();
      this.isLongPress = false;

      // Start long press detection
      this.longPressTimer = window.setTimeout(() => {
        this.isLongPress = true;
        callbacks.onLongPress?.({
          type: 'long-press',
          x: touch.clientX,
          y: touch.clientY,
          timestamp: Date.now()
        });
      }, 500);
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.changedTouches.length !== 1) return;
      
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - this.touchStartX;
      const deltaY = touch.clientY - this.touchStartY;
      const deltaTime = Date.now() - this.touchStartTime;
      const velocity = Math.sqrt(deltaX ** 2 + deltaY ** 2) / deltaTime;

      // Clear long press timer
      if (this.longPressTimer) {
        clearTimeout(this.longPressTimer);
        this.longPressTimer = null;
      }

      // Handle different gestures
      if (this.isLongPress) return;

      if (Math.abs(deltaX) > 30 || Math.abs(deltaY) > 30) {
        // Swipe gesture
        callbacks.onSwipe?.({
          type: 'swipe',
          x: touch.clientX,
          y: touch.clientY,
          timestamp: Date.now(),
          deltaX,
          deltaY,
          velocity
        });
      } else if (deltaTime < 300) {
        // Tap gesture
        callbacks.onTap?.({
          type: 'tap',
          x: touch.clientX,
          y: touch.clientY,
          timestamp: Date.now()
        });
      }
    };

    const handleTouchMove = () => {
      // Cancel long press if user moves finger
      if (this.longPressTimer) {
        clearTimeout(this.longPressTimer);
        this.longPressTimer = null;
      }
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });

    // Return cleanup function
    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchmove', handleTouchMove);
      if (this.longPressTimer) {
        clearTimeout(this.longPressTimer);
        this.longPressTimer = null;
      }
    };
  }

  /**
   * Optimize form inputs for mobile
   */
  static optimizeFormInputs(container: HTMLElement) {
    const inputs = container.querySelectorAll('input, textarea, select');
    
    inputs.forEach(input => {
      const element = input as HTMLElement;
      
      // Add mobile-specific attributes
      if (element.tagName === 'INPUT') {
        const inputElement = element as HTMLInputElement;
        
        switch (inputElement.type) {
          case 'text':
            inputElement.setAttribute('inputmode', 'text');
            break;
          case 'email':
            inputElement.setAttribute('inputmode', 'email');
            break;
          case 'tel':
            inputElement.setAttribute('inputmode', 'tel');
            break;
          case 'url':
            inputElement.setAttribute('inputmode', 'url');
            break;
        }
      }

      // Add touch-friendly styling
      element.style.minHeight = '44px';
      element.style.fontSize = '16px';
      element.style.padding = '12px 16px';
    });
  }

  /**
   * Create mobile-friendly progress indicator
   */
  static createProgressIndicator(container: HTMLElement): {
    update: (progress: number, label?: string) => void;
    complete: (label?: string) => void;
    error: (message?: string) => void;
    destroy: () => void;
  } {
    const progressContainer = document.createElement('div');
    progressContainer.className = 'mobile-progress-container';
    progressContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: rgba(0,0,0,0.1);
      z-index: 9999;
      display: none;
    `;

    const progressBar = document.createElement('div');
    progressBar.className = 'mobile-progress-bar';
    progressBar.style.cssText = `
      height: 100%;
      background: linear-gradient(90deg, #6366f1, #f43f5e);
      width: 0%;
      transition: width 0.3s ease;
    `;

    const progressLabel = document.createElement('div');
    progressLabel.className = 'mobile-progress-label';
    progressLabel.style.cssText = `
      position: fixed;
      top: 8px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0,0,0,0.8);
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: bold;
      z-index: 9999;
      display: none;
      pointer-events: none;
    `;

    progressContainer.appendChild(progressBar);
    document.body.appendChild(progressContainer);
    document.body.appendChild(progressLabel);

    return {
      update: (progress: number, label?: string) => {
        progressContainer.style.display = 'block';
        progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
        
        if (label) {
          progressLabel.style.display = 'block';
          progressLabel.textContent = label;
        }
      },
      complete: (label?: string) => {
        progressBar.style.width = '100%';
        progressBar.style.background = '#10b981';
        
        if (label) {
          progressLabel.style.display = 'block';
          progressLabel.textContent = label;
        }
        
        setTimeout(() => {
          progressContainer.style.display = 'none';
          progressLabel.style.display = 'none';
        }, 1000);
      },
      error: (message?: string) => {
        progressBar.style.background = '#ef4444';
        progressBar.style.width = '100%';
        
        if (message) {
          progressLabel.style.display = 'block';
          progressLabel.textContent = message;
          progressLabel.style.background = 'rgba(239, 68, 68, 0.9)';
        }
        
        setTimeout(() => {
          progressContainer.style.display = 'none';
          progressLabel.style.display = 'none';
          progressBar.style.background = 'linear-gradient(90deg, #6366f1, #f43f5e)';
        }, 2000);
      },
      destroy: () => {
        document.body.removeChild(progressContainer);
        document.body.removeChild(progressLabel);
      }
    };
  }

  /**
   * Create contextual help tooltip
   */
  static createTooltip(
    element: HTMLElement,
    content: string,
    position: 'top' | 'bottom' | 'left' | 'right' = 'top'
  ): {
    show: () => void;
    hide: () => void;
    toggle: () => void;
    destroy: () => void;
  } {
    const tooltip = document.createElement('div');
    tooltip.className = 'mobile-tooltip';
    tooltip.textContent = content;
    tooltip.style.cssText = `
      position: absolute;
      background: rgba(15, 23, 42, 0.95);
      color: white;
      padding: 8px 12px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 500;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      z-index: 1000;
      display: none;
      max-width: 200px;
      word-wrap: break-word;
      border: 1px solid rgba(255, 255, 255, 0.1);
    `;

    const arrow = document.createElement('div');
    arrow.className = 'mobile-tooltip-arrow';
    arrow.style.cssText = `
      position: absolute;
      width: 0;
      height: 0;
      border: 6px solid transparent;
    `;

    tooltip.appendChild(arrow);
    document.body.appendChild(tooltip);

    const updatePosition = () => {
      const rect = element.getBoundingClientRect();
      const tooltipRect = tooltip.getBoundingClientRect();
      
      let top = 0;
      let left = 0;

      switch (position) {
        case 'top':
          top = rect.top - tooltipRect.height - 10;
          left = rect.left + rect.width / 2 - tooltipRect.width / 2;
          arrow.style.top = '100%';
          arrow.style.left = '50%';
          arrow.style.marginLeft = '-6px';
          arrow.style.borderTopColor = 'rgba(15, 23, 42, 0.95)';
          break;
        case 'bottom':
          top = rect.bottom + 10;
          left = rect.left + rect.width / 2 - tooltipRect.width / 2;
          arrow.style.top = '-12px';
          arrow.style.left = '50%';
          arrow.style.marginLeft = '-6px';
          arrow.style.borderBottomColor = 'rgba(15, 23, 42, 0.95)';
          break;
        case 'left':
          top = rect.top + rect.height / 2 - tooltipRect.height / 2;
          left = rect.left - tooltipRect.width - 10;
          arrow.style.top = '50%';
          arrow.style.right = '-12px';
          arrow.style.marginTop = '-6px';
          arrow.style.borderLeftColor = 'rgba(15, 23, 42, 0.95)';
          break;
        case 'right':
          top = rect.top + rect.height / 2 - tooltipRect.height / 2;
          left = rect.right + 10;
          arrow.style.top = '50%';
          arrow.style.left = '-12px';
          arrow.style.marginTop = '-6px';
          arrow.style.borderRightColor = 'rgba(15, 23, 42, 0.95)';
          break;
      }

      // Adjust for viewport boundaries
      if (left < 10) left = 10;
      if (left + tooltipRect.width > window.innerWidth - 10) {
        left = window.innerWidth - tooltipRect.width - 10;
      }
      if (top < 10) top = 10;
      if (top + tooltipRect.height > window.innerHeight - 10) {
        top = window.innerHeight - tooltipRect.height - 10;
      }

      tooltip.style.top = `${top}px`;
      tooltip.style.left = `${left}px`;
    };

    return {
      show: () => {
        updatePosition();
        tooltip.style.display = 'block';
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true);
      },
      hide: () => {
        tooltip.style.display = 'none';
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition, true);
      },
      toggle: () => {
        if (tooltip.style.display === 'none') {
          updatePosition();
          tooltip.style.display = 'block';
          window.addEventListener('resize', updatePosition);
          window.addEventListener('scroll', updatePosition, true);
        } else {
          tooltip.style.display = 'none';
          window.removeEventListener('resize', updatePosition);
          window.removeEventListener('scroll', updatePosition, true);
        }
      },
      destroy: () => {
        document.body.removeChild(tooltip);
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition, true);
      }
    };
  }

  /**
   * Optimize visualizer for mobile performance
   */
  static optimizeVisualizerForMobile() {
    const deviceInfo = this.getDeviceInfo();
    
    // Reduce visual complexity on mobile
    if (deviceInfo.isMobile) {
      return {
        maxParticles: 50,
        renderQuality: 'medium',
        animationSpeed: 0.8,
        enableShaders: false
      };
    } else if (deviceInfo.isTablet) {
      return {
        maxParticles: 100,
        renderQuality: 'high',
        animationSpeed: 1.0,
        enableShaders: true
      };
    } else {
      return {
        maxParticles: 200,
        renderQuality: 'ultra',
        animationSpeed: 1.0,
        enableShaders: true
      };
    }
  }

  /**
   * Handle mobile viewport issues
   */
  static fixMobileViewport() {
    // Prevent zoom on form inputs
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
    }

    // Fix iOS Safari viewport height issues
    const setVh = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    setVh();
    window.addEventListener('resize', setVh);
    window.addEventListener('orientationchange', () => {
      setTimeout(setVh, 100);
    });

    return () => {
      window.removeEventListener('resize', setVh);
      window.removeEventListener('orientationchange', setVh);
    };
  }

  /**
   * Create mobile-friendly modal
   */
  static createMobileModal(content: string | HTMLElement): {
    show: () => void;
    hide: () => void;
    element: HTMLElement;
  } {
    const modal = document.createElement('div');
    modal.className = 'mobile-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(15, 23, 42, 0.8);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s ease;
    `;

    const modalContent = document.createElement('div');
    modalContent.className = 'mobile-modal-content';
    modalContent.style.cssText = `
      background: white;
      border-radius: 16px;
      padding: 24px;
      max-width: 90vw;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
      transform: translateY(20px);
      transition: transform 0.3s ease;
    `;

    if (typeof content === 'string') {
      modalContent.innerHTML = content;
    } else {
      modalContent.appendChild(content);
    }

    // Add close button
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '✕';
    closeButton.style.cssText = `
      position: absolute;
      top: 16px;
      right: 16px;
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #64748b;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: background 0.2s ease;
    `;
    
    closeButton.addEventListener('click', () => {
      modal.style.opacity = '0';
      modal.style.pointerEvents = 'none';
      modalContent.style.transform = 'translateY(20px)';
    });
    modalContent.appendChild(closeButton);

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    return {
      show: () => {
        modal.style.opacity = '1';
        modal.style.pointerEvents = 'auto';
        modalContent.style.transform = 'translateY(0)';
      },
      hide: () => {
        modal.style.opacity = '0';
        modal.style.pointerEvents = 'none';
        modalContent.style.transform = 'translateY(20px)';
        setTimeout(() => {
          document.body.removeChild(modal);
        }, 300);
      },
      element: modal
    };
  }
}

// Export mobile-specific CSS-in-JS styles
export const mobileStyles = `
  /* Mobile-specific styles */
  .mobile-progress-container {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: rgba(0,0,0,0.1);
    z-index: 9999;
    display: none;
  }
  
  .mobile-progress-bar {
    height: 100%;
    background: linear-gradient(90deg, #6366f1, #f43f5e);
    width: 0%;
    transition: width 0.3s ease;
  }
  
  .mobile-tooltip {
    position: absolute;
    background: rgba(15, 23, 42, 0.95);
    color: white;
    padding: 8px 12px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 500;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    z-index: 1000;
    display: none;
    max-width: 200px;
    word-wrap: break-word;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .mobile-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(15, 23, 42, 0.8);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.3s ease;
  }
  
  .mobile-modal-content {
    background: white;
    border-radius: 16px;
    padding: 24px;
    max-width: 90vw;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    transform: translateY(20px);
    transition: transform 0.3s ease;
  }
  
  /* Touch-friendly button styles */
  .touch-friendly {
    min-height: 44px;
    padding: 12px 16px;
    font-size: 16px;
    border-radius: 12px;
  }
  
  /* Mobile form optimizations */
  .mobile-form-input {
    min-height: 44px;
    padding: 12px 16px;
    font-size: 16px;
    border-radius: 8px;
    border: 2px solid #e2e8f0;
    transition: border-color 0.2s ease;
  }
  
  .mobile-form-input:focus {
    outline: none;
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }
`;

// Inject mobile styles
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = mobileStyles;
  document.head.appendChild(style);
}