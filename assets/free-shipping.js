/**
 * Free Shipping Banner Dynamic Updates
 * Updates banner content and progress based on cart changes
 */

const THRESHOLD_CENTS = 2500; // $25 in cents

class FreeShippingBanner {
  constructor() {
    this.banner = document.querySelector('.free-shipping-banner');
    this.cartDrawerProgress = document.querySelector('.cart-drawer__free-shipping');
    this.isUpdatingCartDrawer = false;        // 写入保护
    this.observerDebounceTimer = null;        // 去抖
    this.lastCelebrationAt = 0;               // 动画冷却
    this.init();
  }

  init() {
    if (!this.banner && !this.cartDrawerProgress) return;
    
    // Ensure cart drawer styles are loaded
    this.ensureCartDrawerStyles();
    
    // Listen for cart updates
    document.addEventListener('cart:updated', this.handleCartUpdate.bind(this));
    
    // Listen for PubSub events if available
    if (window.PUB_SUB_EVENTS) {
      subscribe(window.PUB_SUB_EVENTS.cartUpdate, this.handleCartUpdate.bind(this));
      subscribe(window.PUB_SUB_EVENTS.quantityUpdate, this.handleCartUpdate.bind(this));
    }
    
    // Listen for cart drawer updates
    document.addEventListener('cart-drawer:updated', this.handleCartDrawerUpdate.bind(this));
    
    // Observe cart drawer for dynamic content changes
    this.observeCartDrawer();
    
    // Initial load
    this.updateBanner();
  }

  async handleCartUpdate(event) {
    try {
      // If we have cart data in the event, use it; otherwise fetch fresh data
      let cartData = event?.detail?.cart;
      
      if (!cartData) {
        const response = await fetch('/cart.js');
        cartData = await response.json();
      }
      
      this.updateBannerContent(cartData);
    } catch (error) {
      console.warn('Failed to update free shipping banner:', error);
    }
  }

  async updateBanner() {
    try {
      const response = await fetch('/cart.js');
      const cartData = await response.json();
      this.updateBannerContent(cartData);
    } catch (error) {
      console.warn('Failed to fetch cart data for free shipping banner:', error);
    }
  }

  updateBannerContent(cart) {
    if (!cart) return;

    const cartSubtotalCents = cart.total_price;
    const remainingCents = Math.max(0, THRESHOLD_CENTS - cartSubtotalCents);
    const progressPercent = Math.min(100, Math.round((cartSubtotalCents / THRESHOLD_CENTS) * 100));
    
    // Format remaining amount
    const remainingAmount = this.formatMoney(remainingCents);
    
    // Update banner if exists
    if (this.banner) {
      this.banner.dataset.threshold = THRESHOLD_CENTS;
      
      // 确定当前状态
      const prevState = this.banner.dataset.stateKey;
      const stateKey = 
        cart.item_count === 0 ? 'empty' :
        cartSubtotalCents < THRESHOLD_CENTS ? 'below' :
        'unlocked';

      const contentElement = this.banner.querySelector('.free-shipping-banner__content');
      if (!contentElement) return;

      if (prevState !== stateKey) {
        // 状态变了才重写整个容器
        this.banner.dataset.stateKey = stateKey;
        
        let content = '';
        if (stateKey === 'empty') {
          content = this.getEmptyCartContent();
        } else if (stateKey === 'below') {
          content = this.getProgressContent(remainingAmount, progressPercent);
        } else {
          content = this.getUnlockedContent();
        }
        
        contentElement.innerHTML = content;
        
        // 只在首次进入解锁状态时触发动画
        if (stateKey === 'unlocked') {
          this.handleCelebrationAnimation(contentElement);
        }
      } else if (stateKey === 'below') {
        // 仅在"未达标"时更新数值文本，不重写整个容器
        const textElement = contentElement.querySelector('.free-shipping-banner__text');
        if (textElement) {
          textElement.textContent = `Woohoo! You're only ${remainingAmount} away from free shipping!`;
        }
      }
    }
    
    // Update cart drawer progress if exists
    if (this.cartDrawerProgress) {
      this.updateCartDrawerProgress(cart, remainingAmount, progressPercent);
    }
    
    // Announce changes to screen readers
    this.announceChange(cart.item_count, cartSubtotalCents >= THRESHOLD_CENTS);
  }

  getEmptyCartContent() {
    return `
      <div class="free-shipping-banner__message">
        <span class="free-shipping-banner__icon">🚚</span>
        <span class="free-shipping-banner__text">Free Shipping on Orders $25+</span>
      </div>
    `;
  }

  getProgressContent(remainingAmount, progressPercent) {
    return `
      <div class="free-shipping-banner__message">
        <span class="free-shipping-banner__icon">💝</span>
        <span class="free-shipping-banner__text">
          Woohoo! You're only ${remainingAmount} away from free shipping!
        </span>
      </div>
    `;
  }

  getUnlockedContent() {
    return `
      <div class="free-shipping-banner__message free-shipping-banner__message--unlocked">
        <span class="free-shipping-banner__icon">🎉</span>
        <span class="free-shipping-banner__text">
          Congrats! You've unlocked FREE shipping!
        </span>
      </div>
    `;
  }

  updateCartDrawerProgress(cart, remainingAmount, progressPercent) {
    const cartSubtotalCents = cart.total_price;
    
    // Update threshold data attribute
    this.cartDrawerProgress.dataset.threshold = THRESHOLD_CENTS;
    
    let content = '';
    
    if (cart.item_count === 0) {
      // Hide progress section when cart is empty
      this.cartDrawerProgress.style.display = 'none';
      return;
    } else {
      this.cartDrawerProgress.style.display = 'block';
    }
    
    if (cartSubtotalCents < THRESHOLD_CENTS) {
      content = `
        <div class="cart-drawer__free-shipping-message">
          <span class="cart-drawer__free-shipping-icon">💝</span>
          <span class="cart-drawer__free-shipping-text">
            You're only ${remainingAmount} away from free shipping!
          </span>
        </div>
        <div class="cart-drawer__free-shipping-progress" role="progressbar" aria-valuenow="${progressPercent}" aria-valuemin="0" aria-valuemax="100" aria-label="Free shipping progress">
          <div class="cart-drawer__free-shipping-track">
            <div class="cart-drawer__free-shipping-fill" style="width: ${progressPercent}%;"></div>
          </div>
        </div>
      `;
    } else {
      content = `
        <div class="cart-drawer__free-shipping-message cart-drawer__free-shipping-message--unlocked">
          <span class="cart-drawer__free-shipping-icon">🎉</span>
          <span class="cart-drawer__free-shipping-text">
            Congrats! You've unlocked FREE shipping!
          </span>
        </div>
      `;
    }
    
    // 写入保护：防止自触发Observer
    this.isUpdatingCartDrawer = true;
    this.cartDrawerProgress.innerHTML = content;
    // 延迟重置保护标志，确保DOM更新完成
    setTimeout(() => {
      this.isUpdatingCartDrawer = false;
    }, 50);
  }

  observeCartDrawer() {
    // Watch for cart drawer element changes (when it gets re-rendered)
    const cartDrawer = document.querySelector('cart-drawer');
    if (!cartDrawer) return;

    const observer = new MutationObserver((mutations) => {
      if (this.isUpdatingCartDrawer) return;  // 我们自己改的 DOM 不触发更新

      // 仅在确实需要时触发，并做去抖
      clearTimeout(this.observerDebounceTimer);
      this.observerDebounceTimer = setTimeout(() => {
        this.cartDrawerProgress = document.querySelector('.cart-drawer__free-shipping');
        if (this.cartDrawerProgress) {
          this.updateBanner();
        }
      }, 120);
    });

    observer.observe(cartDrawer, {
      childList: true,
      subtree: true
    });
  }

  async handleCartDrawerUpdate(event) {
    // Re-find cart drawer progress element
    this.cartDrawerProgress = document.querySelector('.cart-drawer__free-shipping');
    await this.handleCartUpdate(event);
  }

  handleCelebrationAnimation(contentElement) {
    // Find the unlocked message element
    const unlockedMessage = contentElement.querySelector('.free-shipping-banner__message--unlocked');
    if (!unlockedMessage) return;

    const now = Date.now();
    if (now - this.lastCelebrationAt < 2500) return; // 冷却：2.5s 内不重复触发

    this.lastCelebrationAt = now;

    // Add flashing class for 2-second animation
    unlockedMessage.classList.add('celebration-flashing');
    
    // Remove flashing class after 2 seconds
    setTimeout(() => {
      unlockedMessage.classList.remove('celebration-flashing');
    }, 2000);
  }

  ensureCartDrawerStyles() {
    // Check if cart drawer styles are loaded, if not, inject fallback styles
    const existingStyle = document.getElementById('cart-drawer-progress-fallback');
    if (existingStyle) return;

    const style = document.createElement('style');
    style.id = 'cart-drawer-progress-fallback';
    style.textContent = `
      .cart-drawer__free-shipping {
        padding: 1rem 0 !important;
        border-bottom: 1px solid rgba(0, 0, 0, 0.1) !important;
        margin-bottom: 1rem !important;
        display: block !important;
      }
      .cart-drawer__free-shipping-message {
        display: flex !important;
        align-items: center !important;
        gap: 0.5rem !important;
        margin-bottom: 0.8rem !important;
        font-size: 1.4rem !important;
        font-weight: 500 !important;
        line-height: 1.4 !important;
      }
      .cart-drawer__free-shipping-icon {
        font-size: 1.6rem !important;
        flex-shrink: 0 !important;
      }
      .cart-drawer__free-shipping-text {
        color: #333333 !important;
      }
      .cart-drawer__free-shipping-progress {
        width: 100% !important;
      }
      .cart-drawer__free-shipping-track {
        width: 100% !important;
        height: 8px !important;
        background-color: rgba(0, 0, 0, 0.15) !important;
        border-radius: 20px !important;
        overflow: hidden !important;
        position: relative !important;
        border: 1px solid rgba(0, 0, 0, 0.08) !important;
      }
      .cart-drawer__free-shipping-fill {
        height: 100% !important;
        background: linear-gradient(90deg, #10b981, #059669) !important;
        border-radius: 20px !important;
        transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1) !important;
        position: relative !important;
        min-width: 4px !important;
        display: block !important;
      }
      .cart-drawer__free-shipping-message--unlocked {
        margin-bottom: 0 !important;
        animation: celebration 0.6s ease-out !important;
      }
      @keyframes celebration {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
      }
    `;
    document.head.appendChild(style);
  }

  formatMoney(cents) {
    // Simple money formatting - can be enhanced based on Shopify's money format
    const dollars = (cents / 100).toFixed(2);
    return `$${dollars}`;
  }

  announceChange(itemCount, hasUnlockedShipping) {
    // Create announcement for screen readers
    let announcement = '';
    
    if (itemCount === 0) {
      announcement = 'Cart is empty. Free shipping available on orders over $25.';
    } else if (hasUnlockedShipping) {
      announcement = 'Congratulations! You have unlocked free shipping.';
    } else {
      const remainingCents = THRESHOLD_CENTS - this.getCurrentCartTotal();
      const remainingAmount = this.formatMoney(Math.max(0, remainingCents));
      announcement = `You need ${remainingAmount} more to unlock free shipping.`;
    }
    
    // Use aria-live region to announce changes
    this.banner.setAttribute('aria-live', 'polite');
    
    // Create or update announcement element
    let announcer = document.getElementById('free-shipping-announcer');
    if (!announcer) {
      announcer = document.createElement('div');
      announcer.id = 'free-shipping-announcer';
      announcer.className = 'visually-hidden';
      announcer.setAttribute('aria-live', 'polite');
      announcer.setAttribute('aria-atomic', 'true');
      document.body.appendChild(announcer);
    }
    
    // Clear and set new announcement
    announcer.textContent = '';
    setTimeout(() => {
      announcer.textContent = announcement;
    }, 100);
  }

  async getCurrentCartTotal() {
    try {
      const response = await fetch('/cart.js');
      const cart = await response.json();
      return cart.total_price;
    } catch (error) {
      console.warn('Failed to get current cart total:', error);
      return 0;
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new FreeShippingBanner();
  });
} else {
  new FreeShippingBanner();
}

// Export for potential external use
window.FreeShippingBanner = FreeShippingBanner;
