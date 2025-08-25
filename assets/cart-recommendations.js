/**
 * 购物车推荐栏功能
 * 负责加载推荐商品数据并处理用户交互
 */

class CartRecommendations {
  constructor(section) {
    this.section = section;
    this.container = section.querySelector('#recommendations-container');
    this.list = section.querySelector('#recommendations-list');
    this.loading = section.querySelector('#recommendations-loading');
    this.empty = section.querySelector('#recommendations-empty');
    this.error = section.querySelector('#recommendations-error');

    // 从section设置中获取配置
    this.apiEndpoint = section.dataset.apiEndpoint;
    this.maxProducts = parseInt(section.dataset.maxProducts) || 6;

    // 加载推荐商品
    this.loadRecommendations();
  }

  /**
   * 加载推荐商品数据
   */
  async loadRecommendations() {
    try {
      this.showLoading();

      // 构建API URL
      let apiUrl = this.apiEndpoint;
      if (!apiUrl) {
        // 默认使用当前域的推荐商品接口
        apiUrl = '/api/recommendations.json';
      }

      // 添加查询参数
      const url = new URL(apiUrl, window.location.origin);
      url.searchParams.set('limit', this.maxProducts);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.products && data.products.length > 0) {
        this.renderProducts(data.products);
        this.showContainer();
      } else {
        this.showEmpty();
      }

    } catch (error) {
      console.error('加载推荐商品失败:', error);
      this.showError();
    }
  }

  /**
   * 渲染商品列表
   */
  renderProducts(products) {
    this.list.innerHTML = '';

    products.forEach(product => {
      const productElement = this.createProductElement(product);
      this.list.appendChild(productElement);
    });
  }

  /**
   * 创建单个商品元素
   */
  createProductElement(product) {
    const item = document.createElement('div');
    item.className = 'cart-recommendations__item';

    // 商品图片
    const imageContainer = document.createElement('div');
    imageContainer.className = 'cart-recommendations__item-image-container';

    const image = document.createElement('img');
    image.className = 'cart-recommendations__item-image';
    image.src = product.image || product.featured_image || '';
    image.alt = product.title || product.name || '';
    image.loading = 'lazy';
    imageContainer.appendChild(image);

    // 商品名称
    const name = document.createElement('p');
    name.className = 'cart-recommendations__item-name';
    name.textContent = product.title || product.name || '';

    // 商品价格
    const price = document.createElement('p');
    price.className = 'cart-recommendations__item-price';

    if (product.compare_at_price && product.compare_at_price > product.price) {
      // 有折扣价格
      const originalPrice = document.createElement('span');
      originalPrice.className = 'cart-recommendations__item-original-price';
      originalPrice.textContent = this.formatPrice(product.compare_at_price);

      const currentPrice = document.createElement('span');
      currentPrice.textContent = this.formatPrice(product.price);

      price.appendChild(originalPrice);
      price.appendChild(currentPrice);

      // 显示折扣标签
      const discount = document.createElement('div');
      discount.className = 'cart-recommendations__item-discount';
      const discountPercent = Math.round((1 - product.price / product.compare_at_price) * 100);
      discount.textContent = `-${discountPercent}%`;
      item.appendChild(discount);
    } else {
      price.textContent = this.formatPrice(product.price);
    }

    // 加入购物车按钮
    const button = document.createElement('button');
    button.className = 'cart-recommendations__item-button';
    button.textContent = '加入购物车';
    button.type = 'button';
    button.addEventListener('click', () => this.addToCart(product, button));

    // 组装商品元素
    item.appendChild(imageContainer);
    item.appendChild(name);
    item.appendChild(price);
    item.appendChild(button);

    return item;
  }

  /**
   * 格式化价格显示
   */
  formatPrice(price) {
    if (!price) return '$0.00';

    // 使用Shopify的money格式化
    if (window.Shopify && window.Shopify.currency) {
      return window.Shopify.formatMoney(price);
    }

    // 简单的价格格式化
    return `$${parseFloat(price / 100).toFixed(2)}`;
  }

  /**
   * 添加商品到购物车
   */
  async addToCart(product, button) {
    if (!product.variant_id && !product.variants) {
      console.error('商品缺少变体ID');
      alert('商品信息不完整，无法加入购物车');
      return;
    }

    // 获取变体ID
    let variantId = product.variant_id;
    if (!variantId && product.variants && product.variants.length > 0) {
      variantId = product.variants[0].id;
    }

    if (!variantId) {
      console.error('无法获取商品变体ID');
      alert('商品信息不完整，无法加入购物车');
      return;
    }

    try {
      // 显示加载状态
      button.disabled = true;
      button.classList.add('loading');
      button.textContent = '添加中...';

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

      const data = await response.json();

      if (data.items) {
        // 添加成功
        button.textContent = '已加入';
        button.classList.remove('loading');
        button.classList.add('success');

        // 更新购物车数量显示
        this.updateCartCount(data.item_count);

        // 触发Shopify的购物车更新事件
        document.dispatchEvent(new CustomEvent('cart:updated', {
          detail: { cart: data }
        }));

        // 可选：刷新页面以显示更新后的购物车
        setTimeout(() => {
          window.location.reload();
        }, 1000);

      } else {
        throw new Error(data.message || '添加失败');
      }

    } catch (error) {
      console.error('加入购物车失败:', error);
      alert('加入购物车时出现问题，请稍后重试');

      // 恢复按钮状态
      button.disabled = false;
      button.classList.remove('loading');
      button.textContent = '加入购物车';
    }
  }

  /**
   * 更新购物车数量显示
   */
  updateCartCount(count) {
    const cartCountElements = document.querySelectorAll('.cart-count, .cart-item-count');
    cartCountElements.forEach(element => {
      element.textContent = count;
    });
  }

  /**
   * 显示加载状态
   */
  showLoading() {
    this.loading.style.display = 'flex';
    this.container.style.display = 'none';
    this.empty.style.display = 'none';
    this.error.style.display = 'none';
  }

  /**
   * 显示商品容器
   */
  showContainer() {
    this.loading.style.display = 'none';
    this.container.style.display = 'block';
    this.empty.style.display = 'none';
    this.error.style.display = 'none';
  }

  /**
   * 显示空状态
   */
  showEmpty() {
    this.loading.style.display = 'none';
    this.container.style.display = 'none';
    this.empty.style.display = 'block';
    this.error.style.display = 'none';
  }

  /**
   * 显示错误状态
   */
  showError() {
    this.loading.style.display = 'none';
    this.container.style.display = 'none';
    this.empty.style.display = 'none';
    this.error.style.display = 'block';
  }
}

/**
 * 重试加载推荐商品
 */
function loadRecommendations() {
  const section = document.querySelector('.cart-recommendations[data-section-id]');
  if (section && window.cartRecommendations) {
    window.cartRecommendations.loadRecommendations();
  }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
  const sections = document.querySelectorAll('.cart-recommendations[data-section-id]');

  sections.forEach(section => {
    // 创建推荐栏实例
    const recommendations = new CartRecommendations(section);

    // 将实例保存到全局，以便重试功能使用
    window.cartRecommendations = recommendations;
  });
});

// 监听购物车更新事件（如果需要）
document.addEventListener('cart:updated', function(event) {
  console.log('购物车已更新:', event.detail);
});
