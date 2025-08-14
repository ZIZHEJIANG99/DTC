/**
 * Cart Icon Bubble Auto Refresh
 * Automatically updates the cart icon bubble when cart contents change
 */

class CartBubbleRefresh {
  constructor() {
    this.cartIconBubble = document.getElementById('cart-icon-bubble');
    this.init();
  }

  init() {
    if (!this.cartIconBubble) {
      console.warn('Cart icon bubble element not found');
      return;
    }

    // Listen for cart update events
    document.addEventListener('cart:updated', this.handleCartUpdate.bind(this));
    
    // Listen for PubSub events if available
    if (window.PUB_SUB_EVENTS) {
      subscribe(window.PUB_SUB_EVENTS.cartUpdate, this.handleCartUpdate.bind(this));
      subscribe(window.PUB_SUB_EVENTS.quantityUpdate, this.handleCartUpdate.bind(this));
    }

    // Listen for cart form submissions
    this.observeCartForms();
    
    // Initial refresh on page load
    setTimeout(() => this.refreshCartIconBubble(), 100);
  }

  observeCartForms() {
    // Monitor add to cart forms
    const addToCartForms = document.querySelectorAll('form[action*="/cart/add"]');
    addToCartForms.forEach(form => {
      form.addEventListener('submit', () => {
        // Delay to allow cart update to process
        setTimeout(() => this.refreshCartIconBubble(), 500);
      });
    });

    // Monitor cart drawer changes
    const cartDrawer = document.querySelector('cart-drawer');
    if (cartDrawer) {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList' || mutation.type === 'subtree') {
            this.refreshCartIconBubble();
          }
        });
      });
      
      observer.observe(cartDrawer, {
        childList: true,
        subtree: true,
        attributes: false
      });
    }
  }

  async handleCartUpdate(event) {
    // Small delay to ensure cart has been updated server-side
    setTimeout(() => this.refreshCartIconBubble(), 100);
  }

  async refreshCartIconBubble() {
    try {
      // Fetch the cart icon bubble section
      const response = await fetch(`${window.location.origin}?section_id=cart-icon-bubble`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const html = await response.text();
      
      // Parse the response to get just the cart icon bubble content
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const newCartIconBubble = doc.getElementById('cart-icon-bubble');
      
      if (newCartIconBubble && this.cartIconBubble) {
        // Replace the content
        this.cartIconBubble.innerHTML = newCartIconBubble.innerHTML;
        
        // Copy over any data attributes
        Array.from(newCartIconBubble.attributes).forEach(attr => {
          if (attr.name.startsWith('data-')) {
            this.cartIconBubble.setAttribute(attr.name, attr.value);
          }
        });
        
        // Trigger a custom event to notify other scripts
        document.dispatchEvent(new CustomEvent('cart-icon:updated', {
          detail: { 
            cartIconBubble: this.cartIconBubble,
            timestamp: Date.now()
          }
        }));
      }
    } catch (error) {
      console.warn('Failed to refresh cart icon bubble:', error);
    }
  }

  // Manual refresh method for external use
  forceRefresh() {
    return this.refreshCartIconBubble();
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.cartBubbleRefresh = new CartBubbleRefresh();
  });
} else {
  window.cartBubbleRefresh = new CartBubbleRefresh();
}

// Global function for manual refresh
window.__refreshCartIconBubble = function() {
  if (window.cartBubbleRefresh) {
    return window.cartBubbleRefresh.forceRefresh();
  } else {
    console.warn('CartBubbleRefresh not initialized');
    return Promise.resolve();
  }
};

// Export for potential module use
window.CartBubbleRefresh = CartBubbleRefresh;
