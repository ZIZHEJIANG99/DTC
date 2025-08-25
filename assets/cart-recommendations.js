(function () {
  const settings = window.cartRecommendationsSettings || {};
  const dataUrl = (settings.apiUrl && settings.apiUrl.trim() !== '')
    ? settings.apiUrl
    : settings.fallbackUrl;

  async function fetchRecommendations() {
    const res = await fetch(dataUrl, { credentials: 'omit' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  }

  function renderError(msg) {
    // 查找错误容器
    let loadingEl = document.getElementById('recommendations-loading');
    let errorEl = document.getElementById('recommendations-error');
    
    // 如果主页面中没找到，尝试在抽屉中查找
    if (!errorEl) {
      loadingEl = document.getElementById('drawer-recommendations-loading');
      errorEl = document.getElementById('drawer-recommendations-error');
    }
    
    if (loadingEl) loadingEl.style.display = 'none';
    if (errorEl) errorEl.style.display = '';
    
    if (msg) console.error('[Cart Recos] ', msg);
  }

  function bindRetry() {
    // 绑定主页面的重试按钮
    const btn = document.getElementById('recommendations-retry');
    if (btn) btn.addEventListener('click', init);
    
    // 绑定抽屉中的重试按钮
    const drawerBtn = document.getElementById('drawer-recommendations-retry');
    if (drawerBtn) drawerBtn.addEventListener('click', init);
  }

  async function init() {
    console.log('CartRecommendations: Initializing...');
    
    // 查找推荐栏容器（支持页面和抽屉两种场景）
    const containers = ['recommendations-loading', 'recommendations-error', 'recommendations-empty', 'recommendations-list'];
    const foundContainers = {};
    
    // 尝试在主页面中查找
    containers.forEach(id => {
      foundContainers[id] = document.getElementById(id);
    });
    
    // 如果主页面中没找到，尝试在抽屉中查找（使用drawer-前缀的ID）
    if (!foundContainers['recommendations-list']) {
      const drawerIds = {
        'recommendations-loading': 'drawer-recommendations-loading',
        'recommendations-error': 'drawer-recommendations-error', 
        'recommendations-empty': 'drawer-recommendations-empty',
        'recommendations-list': 'drawer-recommendations-list'
      };
      
      containers.forEach(id => {
        const drawerElement = document.getElementById(drawerIds[id]);
        if (drawerElement) {
          foundContainers[id] = drawerElement;
        }
      });
    }
    
    // 检查是否找到必要的容器
    if (!foundContainers['recommendations-list']) {
      console.log('CartRecommendations: No recommendations container found, skipping initialization');
      return;
    }
    
    console.log('CartRecommendations: Found containers:', Object.keys(foundContainers).filter(key => foundContainers[key]));
    
    // 重置状态
    if (foundContainers['recommendations-error']) {
      foundContainers['recommendations-error'].style.display = 'none';
    }
    if (foundContainers['recommendations-empty']) {
      foundContainers['recommendations-empty'].style.display = 'none';
    }
    if (foundContainers['recommendations-loading']) {
      foundContainers['recommendations-loading'].style.display = '';
    }

    try {
      const data = await fetchRecommendations();
      const items = (data && Array.isArray(data.products)) ? data.products : [];
      
      if (foundContainers['recommendations-loading']) {
        foundContainers['recommendations-loading'].style.display = 'none';
      }

      if (!items.length) {
        if (foundContainers['recommendations-empty']) {
          foundContainers['recommendations-empty'].style.display = '';
        }
        return;
      }

      const list = foundContainers['recommendations-list'];
      list.innerHTML = '';
      items.slice(0, settings.maxProducts || 6).forEach(p => {
        const el = document.createElement('div');
        el.className = 'recommended-item';
        
        // 优化图片URL，使用Shopify图片优化
        const optimizedImageUrl = p.image.includes('shopify.com') 
          ? p.image.replace(/(\.(jpg|jpeg|png|webp))\?.*$/, '$1?v=1&width=300&height=300&crop=center')
          : p.image;
        
        el.innerHTML = `
          <a href="${p.url}" class="recos-card">
            <img loading="lazy" src="${optimizedImageUrl}" alt="${p.title}" width="150" height="150" />
            <div class="title">${p.title}</div>
            <div class="price">
              ${p.compare_at_price ? `<s>${formatMoney(p.compare_at_price)}</s>` : ''}
              ${formatMoney(p.price)}
            </div>
          </a>
          <button class="recos-add" data-vid="${p.variant_id}">
            ${settings.strings?.addToCart || 'Add to cart'}
          </button>`;
        list.appendChild(el);
      });

      list.addEventListener('click', async (e) => {
        const btn = e.target.closest('.recos-add');
        if (!btn) return;
        
        const variantId = btn.dataset.vid;
        const originalText = btn.textContent;
        
        // 检查是否为演示数据
        if (typeof variantId === 'string' && variantId.startsWith('DEMO_')) {
          console.log('Demo product detected:', variantId);
          alert('This is a demo product. To enable real "Add to Cart" functionality, please:\n\n1. Replace demo data in assets/recommended-products-data.json with real product data\n2. Use actual variant IDs from your Shopify products\n3. Configure the API endpoint in theme settings');
          return;
        }
        
        // 输入验证
        if (!variantId || isNaN(Number(variantId))) {
          console.error('Invalid variant ID:', variantId);
          alert('Product variant ID is invalid. Please check the product data.');
          return;
        }
        
        btn.disabled = true;
        btn.textContent = settings.strings?.adding || 'Adding...';
        
        try {
          console.log('Adding to cart - Variant ID:', variantId);
          
          const response = await fetch(`${window.Shopify?.routes?.root || '/'}cart/add.js`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              items: [{ 
                id: Number(variantId), 
                quantity: 1 
              }] 
            })
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error('Cart API Error:', response.status, errorText);
            throw new Error(`HTTP ${response.status}: ${errorText}`);
          }
          
          const result = await response.json();
          console.log('Successfully added to cart:', result);
          
          // 成功反馈
          btn.textContent = settings.strings?.success || 'Added!';
          setTimeout(() => {
            btn.textContent = originalText;
            btn.disabled = false;
          }, 2000);
          
          // 触发购物车更新事件
          document.dispatchEvent(new CustomEvent('cart:updated'));
          
          // 如果有购物车抽屉，尝试更新
          if (window.cartDrawer && window.cartDrawer.refresh) {
            window.cartDrawer.refresh();
          }
          
        } catch (err) {
          console.error('Add to cart failed:', err);
          btn.disabled = false;
          btn.textContent = originalText;
          
          // 更详细的错误信息
          let errorMessage = 'Failed to add to cart. ';
          if (err.message.includes('422')) {
            errorMessage += 'This product variant may not exist or be out of stock.';
          } else if (err.message.includes('404')) {
            errorMessage += 'The cart API endpoint was not found.';
          } else {
            errorMessage += 'Please try again.';
          }
          
          alert(errorMessage);
        }
      });

      function formatMoney(cents) {
        // 简化：使用 Shopify 的货币格式可替换这里
        return '$' + (Number(cents) / 100).toFixed(2);
      }
    } catch (err) {
      renderError(err);
    }
  }

  // 监听购物车更新事件，重新初始化推荐栏
  function setupCartListeners() {
    // 监听自定义cart:updated事件
    document.addEventListener('cart:updated', () => {
      console.log('Cart updated, refreshing recommendations...');
      setTimeout(init, 500); // 延迟500ms确保DOM更新完成
    });
    
    // 监听Shopify原生购物车事件（如果存在）
    if (window.Shopify && window.Shopify.theme && window.Shopify.theme.cartUpdated) {
      window.Shopify.theme.cartUpdated = function() {
        console.log('Shopify cart updated, refreshing recommendations...');
        setTimeout(init, 500);
      };
    }
    
    // 监听可能的购物车抽屉打开事件
    document.addEventListener('cart-drawer:opened', () => {
      console.log('Cart drawer opened, refreshing recommendations...');
      setTimeout(init, 300);
    });
  }

  bindRetry();
  setupCartListeners();
  
  // 初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();