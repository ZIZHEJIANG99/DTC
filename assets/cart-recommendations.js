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
    document.getElementById('recommendations-loading').style.display = 'none';
    const err = document.getElementById('recommendations-error');
    err.style.display = '';
    if (msg) console.error('[Cart Recos] ', msg);
  }

  function bindRetry() {
    const btn = document.getElementById('recommendations-retry');
    if (btn) btn.addEventListener('click', init);
  }

  async function init() {
    document.getElementById('recommendations-error').style.display = 'none';
    document.getElementById('recommendations-empty').style.display = 'none';
    document.getElementById('recommendations-loading').style.display = '';

    try {
      const data = await fetchRecommendations();
      const items = (data && Array.isArray(data.products)) ? data.products : [];
      document.getElementById('recommendations-loading').style.display = 'none';

      if (!items.length) {
        document.getElementById('recommendations-empty').style.display = '';
        return;
      }

      const list = document.getElementById('recommendations-list');
      list.innerHTML = '';
      items.slice(0, settings.maxProducts || 6).forEach(p => {
        const el = document.createElement('div');
        el.className = 'recommended-item';
        el.innerHTML = `
          <a href="${p.url}" class="recos-card">
            <img loading="lazy" src="${p.image}" alt="${p.title}" />
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

  bindRetry();
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();