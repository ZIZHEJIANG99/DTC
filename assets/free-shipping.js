/**
 * Free Shipping Banner Dynamic Updates
 * Updates banner content and progress based on cart changes
 */

const THRESHOLD_CENTS = 2500; // $25 in cents

class FreeShippingBanner {
  constructor() {
    this.banner = document.querySelector('.free-shipping-banner');
    this.init();
  }

  init() {
    if (!this.banner) return;
    
    // Listen for cart updates
    document.addEventListener('cart:updated', this.handleCartUpdate.bind(this));
    
    // Listen for PubSub events if available
    if (window.PUB_SUB_EVENTS) {
      subscribe(window.PUB_SUB_EVENTS.cartUpdate, this.handleCartUpdate.bind(this));
      subscribe(window.PUB_SUB_EVENTS.quantityUpdate, this.handleCartUpdate.bind(this));
    }
    
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
    if (!this.banner || !cart) return;

    const cartSubtotalCents = cart.total_price;
    const remainingCents = Math.max(0, THRESHOLD_CENTS - cartSubtotalCents);
    const progressPercent = Math.min(100, Math.round((cartSubtotalCents / THRESHOLD_CENTS) * 100));
    
    // Format remaining amount
    const remainingAmount = this.formatMoney(remainingCents);
    
    // Update threshold data attribute
    this.banner.dataset.threshold = THRESHOLD_CENTS;
    
    // Generate content based on cart state
    let content = '';
    
    if (cart.item_count === 0) {
      content = this.getEmptyCartContent();
    } else if (cartSubtotalCents < THRESHOLD_CENTS) {
      content = this.getProgressContent(remainingAmount, progressPercent);
    } else {
      content = this.getUnlockedContent();
    }
    
    // Update banner content
    const contentElement = this.banner.querySelector('.free-shipping-banner__content');
    if (contentElement) {
      contentElement.innerHTML = content;
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
      <div class="free-shipping-banner__progress" role="progressbar" aria-valuenow="${progressPercent}" aria-valuemin="0" aria-valuemax="100" aria-label="Free shipping progress">
        <div class="free-shipping-banner__progress-track">
          <div class="free-shipping-banner__progress-fill" style="width: ${progressPercent}%;"></div>
        </div>
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
