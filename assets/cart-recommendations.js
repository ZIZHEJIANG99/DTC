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
        btn.disabled = true;
        try {
          await fetch(`${window.Shopify?.routes?.root || '/'}cart/add.js`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: [{ id: Number(btn.dataset.vid), quantity: 1 }] })
          }).then(r => (r.ok ? r.json() : Promise.reject(r)));
          // 触发你的 Drawer 刷新逻辑；简单方案：
          document.dispatchEvent(new CustomEvent('cart:updated'));
        } catch (err) {
          console.error('Add to cart failed', err);
          btn.disabled = false;
          alert('Failed to add to cart, please try again.');
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