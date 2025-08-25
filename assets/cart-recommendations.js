/**
 * 购物车推荐栏JavaScript功能
 * 实现AJAX数据加载和加入购物车功能
 */

class CartRecommendations {
  constructor(settings) {
    this.settings = settings;
    this.loadingElement = document.getElementById('recommendations-loading');
    this.errorElement = document.getElementById('recommendations-error');
    this.listElement = document.getElementById('recommendations-list');
    this.retryButton = document.getElementById('recommendations-retry');

    this.init();
  }

  init() {
    // 绑定重试按钮事件
    if (this.retryButton) {
      this.retryButton.addEventListener('click', () => {
        this.loadRecommendations();
      });
    }

    // 开始加载推荐商品
    this.loadRecommendations();
  }

  async loadRecommendations() {
    if (!this.settings.apiUrl) {
      this.showError('API endpoint not configured');
      return;
    }

    this.showLoading();

    try {
      let data;

      // 如果API URL未配置或为空，使用本地数据
      if (!this.settings.apiUrl || this.settings.apiUrl.trim() === '') {
        // 加载本地推荐产品数据
        const response = await fetch('/assets/recommended-products-data.json', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to load local data: ${response.status}`);
        }

        data = await response.json();
      } else {
        // 使用配置的API端点
        const response = await fetch(this.settings.apiUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        data = await response.json();
      }

      this.renderProducts(data.products || []);

    } catch (error) {
      console.error('Failed to load recommendations:', error);
      this.showError();
    }
  }

  renderProducts(products) {
    this.hideLoading();
    this.hideError();

    if (!products || products.length === 0) {
      this.showEmptyState();
      return;
    }

    // 限制商品数量
    const maxProducts = this.settings.maxProducts || 6;
    const displayProducts = products.slice(0, maxProducts);

    // 清空现有内容
    this.listElement.innerHTML = '';

    // 渲染每个商品
    displayProducts.forEach(product => {
      const productElement = this.createProductElement(product);
      this.listElement.appendChild(productElement);
    });

    // 显示列表
    this.listElement.style.display = 'grid';
  }

  createProductElement(product) {
    const itemElement = document.createElement('div');
    itemElement.className = 'cart-recommendations__item';

    // 计算折扣百分比
    const discountPercent = this.calculateDiscountPercent(product.price, product.compare_at_price);

    itemElement.innerHTML = `
      <a href="${product.url || '#'}" class="cart-recommendations__item-link">
        ${discountPercent > 0 ? `<div class="cart-recommendations__discount-badge">-${discountPercent}%</div>` : ''}
        <img
          src="${product.image || '/placeholder-image.jpg'}"
          alt="${product.title || 'Product'}"
          class="cart-recommendations__item-image"
          loading="lazy"
        >
        <div class="cart-recommendations__item-content">
          <h3 class="cart-recommendations__item-title">${product.title || 'Product'}</h3>
          <div class="cart-recommendations__item-price">
            <span class="cart-recommendations__current-price">
              ${this.formatPrice(product.price)}
            </span>
            ${product.compare_at_price && product.compare_at_price > product.price ?
              `<span class="cart-recommendations__original-price">
                ${this.formatPrice(product.compare_at_price)}
              </span>` :
              ''
            }
          </div>
          <button
            type="button"
            class="cart-recommendations__add-button"
            data-variant-id="${product.variant_id || product.id}"
            data-product-id="${product.id}"
          >
            ${this.getTranslation('add_to_cart')}
          </button>
        </div>
      </a>
    `;

    // 绑定加入购物车按钮事件
    const addButton = itemElement.querySelector('.cart-recommendations__add-button');
    addButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.addToCart(product.variant_id || product.id, addButton);
    });

    return itemElement;
  }

  async addToCart(variantId, buttonElement) {
    if (!variantId) {
      alert('Product variant not available');
      return;
    }

    // 更新按钮状态
    buttonElement.disabled = true;
    buttonElement.classList.add('adding');
    buttonElement.textContent = this.getTranslation('adding');

    try {
      const response = await fetch(`${window.Shopify.routes.root}cart/add.js`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: [{
            id: variantId,
            quantity: 1
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // 更新购物车UI (如果需要)
      this.updateCartUI();

      // 显示成功消息
      this.showSuccessMessage();

    } catch (error) {
      console.error('Failed to add to cart:', error);
      alert('Failed to add item to cart. Please try again.');
    } finally {
      // 恢复按钮状态
      buttonElement.disabled = false;
      buttonElement.classList.remove('adding');
      buttonElement.textContent = this.getTranslation('add_to_cart');
    }
  }

  updateCartUI() {
    // 更新购物车数量显示
    if (window.Shopify && window.Shopify.cart) {
      // 如果有全局购物车对象，更新数量
      const cartCountElements = document.querySelectorAll('.cart-count, .cart-item-count');
      cartCountElements.forEach(element => {
        element.textContent = window.Shopify.cart.item_count || 0;
      });
    }

    // 触发购物车更新事件
    document.dispatchEvent(new CustomEvent('cart:updated'));
  }

  showSuccessMessage() {
    // 可以在这里显示成功消息或刷新页面
    // 简单起见，我们刷新页面来更新购物车显示
    setTimeout(() => {
      window.location.reload();
    }, 500);
  }

  calculateDiscountPercent(currentPrice, originalPrice) {
    if (!originalPrice || originalPrice <= currentPrice) {
      return 0;
    }
    return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
  }

  formatPrice(price) {
    // 将价格从分转换为元并格式化
    const priceInDollars = (price / 100).toFixed(2);
    return `$${priceInDollars}`;
  }

  showLoading() {
    if (this.loadingElement) {
      this.loadingElement.style.display = 'flex';
    }
    if (this.listElement) {
      this.listElement.style.display = 'none';
    }
    if (this.errorElement) {
      this.errorElement.style.display = 'none';
    }
  }

  hideLoading() {
    if (this.loadingElement) {
      this.loadingElement.style.display = 'none';
    }
  }

  showError(customMessage = null) {
    this.hideLoading();
    if (this.listElement) {
      this.listElement.style.display = 'none';
    }
    if (this.errorElement) {
      const messageElement = this.errorElement.querySelector('p');
      if (messageElement && customMessage) {
        messageElement.textContent = customMessage;
      }
      this.errorElement.style.display = 'block';
    }
  }

  hideError() {
    if (this.errorElement) {
      this.errorElement.style.display = 'none';
    }
  }

  showEmptyState() {
    if (this.listElement) {
      this.listElement.innerHTML = `
        <div class="cart-recommendations__empty">
          <div class="cart-recommendations__empty-icon">📦</div>
          <p>${this.getTranslation('empty_message')}</p>
        </div>
      `;
      this.listElement.style.display = 'block';
    }
  }

  getTranslation(key) {
    // 尝试从Shopify的语言包中获取翻译
    if (window.Shopify && window.Shopify.locale) {
      const locale = window.Shopify.locale;
      // 这里需要根据实际的Shopify语言包结构来调整
      // 暂时使用默认的英文翻译
      const translations = {
        'add_to_cart': 'Add to Cart',
        'adding': 'Adding...',
        'empty_message': 'No recommendations available at this time.',
        'loading': 'Loading recommendations...',
        'error_message': 'Unable to load recommendations. Please try again.',
        'retry_button': 'Retry',
        'success_message': 'Item added to cart successfully!'
      };

      // 如果是中文，使用中文翻译
      if (locale && locale.startsWith('zh')) {
        const chineseTranslations = {
          'add_to_cart': '加入购物车',
          'adding': '正在添加...',
          'empty_message': '暂时没有推荐商品。',
          'loading': '正在加载推荐商品...',
          'error_message': '无法加载推荐商品，请重试。',
          'retry_button': '重试',
          'success_message': '商品已成功加入购物车！'
        };
        return chineseTranslations[key] || translations[key];
      }

      return translations[key] || key;
    }

    // 默认翻译
    const defaultTranslations = {
      'add_to_cart': 'Add to Cart',
      'adding': 'Adding...',
      'empty_message': 'No recommendations available at this time.',
      'loading': 'Loading recommendations...',
      'error_message': 'Unable to load recommendations. Please try again.',
      'retry_button': 'Retry',
      'success_message': 'Item added to cart successfully!'
    };

    return defaultTranslations[key] || key;
  }
}

// 页面加载完成后初始化推荐栏
document.addEventListener('DOMContentLoaded', function() {
  if (window.cartRecommendationsSettings) {
    new CartRecommendations(window.cartRecommendationsSettings);
  }
});

// 导出类以便测试或其他用途
window.CartRecommendations = CartRecommendations;