/**
 * Cart Checkout Tracking
 * Handles tracking events for checkout button clicks
 */

class CartTracking {
  constructor() {
    this.init();
  }

  init() {
    // Listen for checkout button clicks in cart drawer
    this.bindCheckoutButtons();
    
    // Listen for dynamic content updates
    document.addEventListener('cart:updated', this.bindCheckoutButtons.bind(this));
    document.addEventListener('cart-drawer:updated', this.bindCheckoutButtons.bind(this));
  }

  bindCheckoutButtons() {
    // Remove existing listeners to prevent duplicates
    const existingButtons = document.querySelectorAll('[data-checkout-tracked="true"]');
    existingButtons.forEach(button => {
      button.removeAttribute('data-checkout-tracked');
    });

    // Find all checkout buttons
    const checkoutButtons = document.querySelectorAll([
      '#CartDrawer-Checkout',
      '.cart__checkout-button',
      '[name="checkout"]',
      'button[form*="cart"]',
      'input[name="checkout"]'
    ].join(', '));

    checkoutButtons.forEach(button => {
      if (!button.hasAttribute('data-checkout-tracked')) {
        button.addEventListener('click', this.handleCheckoutClick.bind(this));
        button.setAttribute('data-checkout-tracked', 'true');
      }
    });
  }

  async handleCheckoutClick(event) {
    try {
      // Get current cart data
      const cartData = await this.getCartData();
      
      if (!cartData || cartData.item_count === 0) {
        console.warn('Cannot track checkout - cart is empty');
        return;
      }

      // Track with TikTok Pixel
      this.trackTikTokPixel(cartData);
      
      // Track with Google Analytics / dataLayer
      this.trackDataLayer(cartData);
      
      // Track with custom events
      this.trackCustomEvent(cartData);

    } catch (error) {
      console.warn('Failed to track checkout event:', error);
    }
  }

  async getCartData() {
    try {
      const response = await fetch('/cart.js');
      return await response.json();
    } catch (error) {
      console.warn('Failed to fetch cart data for tracking:', error);
      return null;
    }
  }

  trackTikTokPixel(cartData) {
    if (typeof ttq !== 'undefined') {
      try {
        // Calculate total value in dollars
        const value = (cartData.total_price / 100).toFixed(2);
        
        // Prepare item data
        const contents = cartData.items.map(item => ({
          content_id: item.variant_id?.toString() || item.id?.toString(),
          content_name: item.product_title || item.title,
          content_category: item.product_type || '',
          quantity: item.quantity,
          price: (item.price / 100).toFixed(2)
        }));

        // Track InitiateCheckout event
        ttq.track('InitiateCheckout', {
          value: parseFloat(value),
          currency: cartData.currency || 'USD',
          contents: contents,
          content_type: 'product'
        });

        console.log('TikTok InitiateCheckout event tracked:', { value, currency: cartData.currency });
      } catch (error) {
        console.warn('Failed to track TikTok pixel:', error);
      }
    } else {
      console.warn('TikTok pixel (ttq) not available');
    }
  }

  trackDataLayer(cartData) {
    if (typeof dataLayer !== 'undefined') {
      try {
        // Calculate total value
        const value = (cartData.total_price / 100).toFixed(2);
        
        // Prepare item data for GA4 format
        const items = cartData.items.map((item, index) => ({
          item_id: item.variant_id?.toString() || item.id?.toString(),
          item_name: item.product_title || item.title,
          item_category: item.product_type || '',
          item_variant: item.variant_title || '',
          price: (item.price / 100).toFixed(2),
          quantity: item.quantity,
          index: index
        }));

        // Push to dataLayer
        dataLayer.push({
          event: 'checkout_click',
          event_category: 'ecommerce',
          event_action: 'initiate_checkout',
          value: parseFloat(value),
          currency: cartData.currency || 'USD',
          items: items,
          cart_total: parseFloat(value),
          cart_item_count: cartData.item_count
        });

        console.log('DataLayer checkout_click event tracked:', { value, item_count: cartData.item_count });
      } catch (error) {
        console.warn('Failed to track dataLayer event:', error);
      }
    } else {
      console.warn('dataLayer not available');
    }
  }

  trackCustomEvent(cartData) {
    // Dispatch custom event for other tracking systems
    const customEvent = new CustomEvent('checkout:initiated', {
      detail: {
        cart: cartData,
        timestamp: Date.now(),
        source: 'cart-tracking'
      }
    });
    
    document.dispatchEvent(customEvent);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new CartTracking();
  });
} else {
  new CartTracking();
}

// Export for potential external use
window.CartTracking = CartTracking;
