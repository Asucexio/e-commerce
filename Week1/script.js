document.addEventListener('DOMContentLoaded', () => {

  const allCards = Array.from(document.querySelectorAll('.product-card'));
  const heroSlides = Array.from(document.querySelectorAll('.hero-slide'));
  const heroDots = Array.from(document.querySelectorAll('.hero-dots .dot'));
  const heroSection = document.getElementById('hero');
  let heroIndex = 0;
  let heroTimer = null;
  const HERO_INTERVAL = 5000;

  function goToSlide(index) {
    heroSlides.forEach((slide, i) => slide.classList.toggle('active', i === index));
    heroDots.forEach((dot, i) => dot.classList.toggle('active', i === index));
    heroIndex = index;
  }

  function nextSlide() {
    goToSlide((heroIndex + 1) % heroSlides.length);
  }

  function startHeroTimer() {
    stopHeroTimer();
    if (heroSlides.length > 1) heroTimer = setInterval(nextSlide, HERO_INTERVAL);
  }

  function stopHeroTimer() {
    if (heroTimer) clearInterval(heroTimer);
  }

  if (heroSlides.length) {
    startHeroTimer();
    heroDots.forEach(dot => {
      dot.addEventListener('click', () => {
        goToSlide(Number(dot.dataset.slide));
        startHeroTimer();
      });
    });
    if (heroSection) {
      heroSection.addEventListener('mouseenter', stopHeroTimer);
      heroSection.addEventListener('mouseleave', startHeroTimer);
    }
  }

  const deliveryBtn = document.getElementById('delivery-btn');
  const deliveryPanel = document.getElementById('delivery-panel');
  const deliveryLabel = document.getElementById('delivery-label');
  const deliveryCountry = document.getElementById('delivery-country');
  const deliveryCity = document.getElementById('delivery-city');
  const deliverySave = document.getElementById('delivery-save');
  const DELIVERY_KEY = 'marikato-delivery';

  function loadDeliveryPref() {
    try {
      const saved = JSON.parse(localStorage.getItem(DELIVERY_KEY));
      if (saved && saved.city) {
        deliveryLabel.textContent = saved.city;
        if (deliveryCountry) deliveryCountry.value = saved.country || 'Ethiopia';
        if (deliveryCity) deliveryCity.value = saved.city;
        if (saved.method) {
          const radio = document.querySelector(`input[name="delivery-method"][value="${saved.method}"]`);
          if (radio) radio.checked = true;
        }
      }
    } catch (err) {
      console.warn('[Marikato] Could not load delivery preference:', err);
    }
  }

  function openDeliveryPanel() {
    deliveryPanel.classList.add('open');
    deliveryBtn.setAttribute('aria-expanded', 'true');
  }

  function closeDeliveryPanel() {
    deliveryPanel.classList.remove('open');
    deliveryBtn.setAttribute('aria-expanded', 'false');
  }

  if (deliveryBtn && deliveryPanel) {
    loadDeliveryPref();
    deliveryBtn.addEventListener('click', e => {
      e.stopPropagation();
      const isOpen = deliveryPanel.classList.contains('open');
      isOpen ? closeDeliveryPanel() : openDeliveryPanel();
    });
    deliveryPanel.addEventListener('click', e => e.stopPropagation());
    document.addEventListener('click', () => closeDeliveryPanel());
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeDeliveryPanel();
    });
    if (deliverySave) {
      deliverySave.addEventListener('click', () => {
        const country = deliveryCountry ? deliveryCountry.value : 'Ethiopia';
        const city = (deliveryCity && deliveryCity.value.trim()) || 'Wolaita Sodo';
        const methodInput = document.querySelector('input[name="delivery-method"]:checked');
        const method = methodInput ? methodInput.value : 'Delivery';
        deliveryLabel.textContent = city;
        closeDeliveryPanel();
        showToast(`${method} set for ${city}, ${country}`);
        try {
          localStorage.setItem(DELIVERY_KEY, JSON.stringify({ country, city, method }));
        } catch (err) {}
      });
    }
  }

  const toastEl = document.getElementById('toast');
  let toastTimer = null;

  function showToast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2200);
  }

  function parsePrice(text) {
    const raw = (text || '').trim();
    const currency = raw.startsWith('$') ? 'USD' : 'ETB';
    const amount = parseFloat(raw.replace(/[^0-9.]/g, '')) || 0;
    return { amount, currency };
  }

  function formatMoney(amount, currency) {
    return currency === 'USD'
      ? `$${amount.toFixed(2)}`
      : `${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })} ETB`;
  }

  function groupedTotalLabel(items) {
    const totals = {};
    items.forEach(item => {
      totals[item.currency] = (totals[item.currency] || 0) + item.price * item.qty;
    });
    return Object.entries(totals)
      .map(([currency, amount]) => formatMoney(amount, currency))
      .join('  +  ');
  }

  const THEME_KEY = 'marikato-theme';
  const themeToggleBtn = document.getElementById('theme-toggle');
  const themeIcon = document.getElementById('theme-icon');
  const themeLabel = document.getElementById('theme-label');

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    if (themeIcon) themeIcon.className = theme === 'dark' ? 'fa fa-moon' : 'fa fa-sun';
    if (themeLabel) themeLabel.textContent = theme === 'dark' ? 'Dark' : 'Light';
    if (themeToggleBtn) {
      themeToggleBtn.setAttribute('aria-pressed', String(theme === 'dark'));
      themeToggleBtn.title = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
    }
  }

  function loadTheme() {
    let saved = null;
    try { saved = localStorage.getItem(THEME_KEY); } catch (err) { saved = null; }
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(saved || (prefersDark ? 'dark' : 'light'));
  }

  loadTheme();

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const next = isDark ? 'light' : 'dark';
      applyTheme(next);
      try { localStorage.setItem(THEME_KEY, next); } catch (err) {}
    });
  }

  const CART_KEY = 'marikato-cart';
  const cartBtn = document.getElementById('cart-btn');
  const cartPanel = document.getElementById('cart-panel');
  const cartCountEl = document.getElementById('cart-count');
  const cartItemsEl = document.getElementById('cart-items');
  const cartEmptyMsg = document.getElementById('cart-empty-msg');
  const cartSubtotalEl = document.getElementById('cart-subtotal');
  const cartSubtotalAmount = document.getElementById('cart-subtotal-amount');
  const cartCheckoutBtn = document.getElementById('cart-checkout-btn');

  function getCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch (err) { return []; }
  }

  function saveCart(items) {
    try { localStorage.setItem(CART_KEY, JSON.stringify(items)); } catch (err) {}
  }

  function updateCartBadge() {
    if (!cartCountEl) return;
    cartCountEl.textContent = getCart().reduce((sum, item) => sum + item.qty, 0);
  }

  function renderCart() {
    if (!cartItemsEl) return;
    const items = getCart();
    cartItemsEl.innerHTML = '';
    const hasItems = items.length > 0;
    if (cartEmptyMsg) cartEmptyMsg.style.display = hasItems ? 'none' : 'block';
    if (cartSubtotalEl) cartSubtotalEl.style.display = hasItems ? 'flex' : 'none';
    if (cartCheckoutBtn) cartCheckoutBtn.style.display = hasItems ? 'block' : 'none';
    if (!hasItems) return;

    items.forEach(item => {
      const row = document.createElement('div');
      row.className = 'cart-item';
      const info = document.createElement('div');
      info.className = 'cart-item-info';
      const nameDiv = document.createElement('div');
      nameDiv.className = 'cart-item-name';
      nameDiv.textContent = item.name;
      const priceDiv = document.createElement('div');
      priceDiv.className = 'cart-item-price';
      priceDiv.textContent = `${formatMoney(item.price, item.currency)} each`;
      info.append(nameDiv, priceDiv);
      const qtyWrap = document.createElement('div');
      qtyWrap.className = 'cart-item-qty';
      const decBtn = document.createElement('button');
      decBtn.type = 'button'; decBtn.className = 'cart-qty-btn'; decBtn.textContent = '−';
      decBtn.setAttribute('aria-label', `Decrease ${item.name} quantity`);
      const qtySpan = document.createElement('span'); qtySpan.textContent = item.qty;
      const incBtn = document.createElement('button');
      incBtn.type = 'button'; incBtn.className = 'cart-qty-btn'; incBtn.textContent = '+';
      incBtn.setAttribute('aria-label', `Increase ${item.name} quantity`);
      qtyWrap.append(decBtn, qtySpan, incBtn);
      const removeBtn = document.createElement('button');
      removeBtn.type = 'button'; removeBtn.className = 'cart-item-remove';
      removeBtn.innerHTML = '<i class="fa fa-trash"></i>';
      removeBtn.setAttribute('aria-label', `Remove ${item.name} from cart`);
      decBtn.addEventListener('click', () => changeQty(item.name, -1));
      incBtn.addEventListener('click', () => changeQty(item.name, 1));
      removeBtn.addEventListener('click', () => removeFromCart(item.name));
      row.append(info, qtyWrap, removeBtn);
      cartItemsEl.appendChild(row);
    });
    if (cartSubtotalAmount) cartSubtotalAmount.textContent = groupedTotalLabel(items);
  }

  const stockLimits = new Map();
  function getStockLimit(name) {
    return stockLimits.has(name) ? stockLimits.get(name) : Infinity;
  }

  function addToCart(name, price, currency, qty = 1) {
    const items = getCart();
    const max = getStockLimit(name);
    const existing = items.find(i => i.name === name);
    const currentQty = existing ? existing.qty : 0;
    const allowedQty = Math.max(0, Math.min(qty, max - currentQty));
    if (allowedQty <= 0) {
      showToast(`Only ${max} ${name} in stock — you already have the max in your cart.`);
      return 0;
    }
    if (existing) { existing.qty += allowedQty; }
    else { items.push({ name, price, currency, qty: allowedQty }); }
    saveCart(items); updateCartBadge(); renderCart();
    if (allowedQty < qty) { showToast(`Only ${max} ${name} in stock — added ${allowedQty}.`); }
    return allowedQty;
  }

  function changeQty(name, delta) {
    let items = getCart();
    const item = items.find(i => i.name === name);
    if (!item) return;
    if (delta > 0 && item.qty >= getStockLimit(name)) {
      showToast(`Only ${getStockLimit(name)} ${name} in stock.`); return;
    }
    item.qty += delta;
    items = item.qty <= 0 ? items.filter(i => i.name !== name) : items;
    saveCart(items); updateCartBadge(); renderCart();
  }

  function removeFromCart(name) {
    saveCart(getCart().filter(i => i.name !== name));
    updateCartBadge(); renderCart();
  }

  function openCartPanel() {
    if (!cartPanel) return;
    cartPanel.classList.add('open');
    if (cartBtn) cartBtn.setAttribute('aria-expanded', 'true');
  }

  function closeCartPanel() {
    if (!cartPanel) return;
    cartPanel.classList.remove('open');
    if (cartBtn) cartBtn.setAttribute('aria-expanded', 'false');
  }

  updateCartBadge(); renderCart();

  if (cartBtn && cartPanel) {
    cartBtn.addEventListener('click', e => {
      e.stopPropagation();
      const isOpen = cartPanel.classList.contains('open');
      isOpen ? closeCartPanel() : openCartPanel();
    });
    cartPanel.addEventListener('click', e => e.stopPropagation());
    document.addEventListener('click', () => closeCartPanel());
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeCartPanel(); });
  }

  if (cartCheckoutBtn) {
    cartCheckoutBtn.addEventListener('click', () => openCheckout());
  }

  document.querySelectorAll('.product-card').forEach(card => {
    const nameEl = card.querySelector('h2');
    const productName = nameEl ? nameEl.textContent.trim() : 'Item';
    const priceEl = card.querySelector('.price');
    const { amount: productPrice, currency: productCurrency } = parsePrice(priceEl ? priceEl.textContent : '');
    const btnRow = card.querySelector('.btn-row');
    const addBtn = card.querySelector('.btn-row .primary');
    const buyBtn = card.querySelector('.btn-row button:not(.primary)');
    let selectedQty = 1;
    const maxStock = getStockLimit(productName);
    let refreshStepper = () => {};

    if (btnRow) {
      const stepper = document.createElement('div');
      stepper.className = 'card-qty-stepper';
      const decBtn = document.createElement('button');
      decBtn.type = 'button'; decBtn.className = 'card-qty-btn'; decBtn.textContent = '−';
      decBtn.setAttribute('aria-label', `Decrease quantity of ${productName}`);
      const qtySpan = document.createElement('span'); qtySpan.className = 'card-qty-value'; qtySpan.textContent = selectedQty;
      const incBtn = document.createElement('button');
      incBtn.type = 'button'; incBtn.className = 'card-qty-btn'; incBtn.textContent = '+';
      incBtn.setAttribute('aria-label', `Increase quantity of ${productName}`);
      refreshStepper = () => {
        qtySpan.textContent = selectedQty;
        decBtn.disabled = selectedQty <= 1;
        incBtn.disabled = selectedQty >= maxStock;
      };
      decBtn.addEventListener('click', () => { if (selectedQty > 1) selectedQty -= 1; refreshStepper(); });
      incBtn.addEventListener('click', () => { if (selectedQty < maxStock) selectedQty += 1; refreshStepper(); });
      refreshStepper();
      stepper.append(decBtn, qtySpan, incBtn);
      btnRow.before(stepper);
    }

    if (addBtn) {
      addBtn.addEventListener('click', () => {
        const added = addToCart(productName, productPrice, productCurrency, selectedQty);
        if (added > 0) {
          showToast(`${added} × ${productName} added to cart`);
          const original = addBtn.textContent;
          addBtn.textContent = 'Added ✓'; addBtn.disabled = true;
          setTimeout(() => { addBtn.textContent = original; addBtn.disabled = false; }, 1000);
          selectedQty = 1; refreshStepper();
        }
      });
    }
    if (buyBtn) {
      buyBtn.addEventListener('click', () => {
        const added = addToCart(productName, productPrice, productCurrency, selectedQty);
        if (added > 0) openCheckout();
      });
    }
  });

  const ORDERS_KEY = 'marikato-orders';
  const checkoutOverlay = document.getElementById('checkout-overlay');
  const checkoutFormView = document.getElementById('checkout-form-view');
  const checkoutSuccessView = document.getElementById('checkout-success-view');
  const checkoutSummary = document.getElementById('checkout-summary');
  const checkoutForm = document.getElementById('checkout-form');
  const checkoutClose = document.getElementById('checkout-close');
  const checkoutError = document.getElementById('checkout-error');
  const checkoutOrderId = document.getElementById('checkout-order-id');
  const checkoutOrderTotal = document.getElementById('checkout-order-total');
  const checkoutDoneBtn = document.getElementById('checkout-done-btn');
  const checkoutPromoInput = document.getElementById('checkout-promo');
  const checkoutPromoApply = document.getElementById('checkout-promo-apply');
  const checkoutPromoMsg = document.getElementById('checkout-promo-msg');
  const checkoutPrintBtn = document.getElementById('checkout-print-btn');

  const PROMO_CODES = { MARIKATO10: 10, WELCOME15: 15 };
  let appliedPromo = null;

  function getOrders() {
    try { return JSON.parse(localStorage.getItem(ORDERS_KEY)) || []; } catch (err) { return []; }
  }

  function saveOrders(orders) {
    try { localStorage.setItem(ORDERS_KEY, JSON.stringify(orders)); } catch (err) {}
  }

  function computeTotals(items) {
    const totals = {};
    items.forEach(item => { totals[item.currency] = (totals[item.currency] || 0) + item.price * item.qty; });
    return totals;
  }

  function formatTotals(totals) {
    return Object.entries(totals).map(([currency, amount]) => formatMoney(amount, currency)).join('  +  ');
  }

  function renderCheckoutSummary(items, promo) {
    if (!checkoutSummary) return {};
    checkoutSummary.innerHTML = '';
    if (items.length === 0) {
      if (checkoutError) checkoutError.textContent = 'Your cart is empty.';
      closeCheckout(); return {};
    }
    items.forEach(item => {
      const row = document.createElement('div'); row.className = 'checkout-summary-item';
      const label = document.createElement('span'); label.className = 'checkout-summary-item-label'; label.textContent = item.name;
      const qtyWrap = document.createElement('span'); qtyWrap.className = 'checkout-summary-qty';
      const decBtn = document.createElement('button'); decBtn.type = 'button'; decBtn.className = 'cart-qty-btn'; decBtn.textContent = '−';
      decBtn.setAttribute('aria-label', `Decrease ${item.name} quantity`);
      const qtySpan = document.createElement('span'); qtySpan.textContent = item.qty;
      const incBtn = document.createElement('button'); incBtn.type = 'button'; incBtn.className = 'cart-qty-btn'; incBtn.textContent = '+';
      incBtn.setAttribute('aria-label', `Increase ${item.name} quantity`);
      qtyWrap.append(decBtn, qtySpan, incBtn);
      const priceSpan = document.createElement('span'); priceSpan.className = 'checkout-summary-item-price';
      priceSpan.textContent = formatMoney(item.price * item.qty, item.currency);
      decBtn.addEventListener('click', () => { changeQty(item.name, -1); renderCheckoutSummary(getCart(), promo); });
      incBtn.addEventListener('click', () => { changeQty(item.name, 1); renderCheckoutSummary(getCart(), promo); });
      row.append(label, qtyWrap, priceSpan);
      checkoutSummary.appendChild(row);
    });
    const totals = computeTotals(items);
    if (promo) {
      const discountTotals = {};
      Object.entries(totals).forEach(([currency, amount]) => { discountTotals[currency] = amount * (promo.percent / 100); });
      const discountRow = document.createElement('div'); discountRow.className = 'checkout-summary-discount';
      discountRow.innerHTML = `<span>Discount (${promo.code} &minus;${promo.percent}%)</span><span>&minus;${formatTotals(discountTotals)}</span>`;
      checkoutSummary.appendChild(discountRow);
      Object.keys(totals).forEach(currency => { totals[currency] -= discountTotals[currency]; });
    }
    const totalRow = document.createElement('div'); totalRow.className = 'checkout-summary-total';
    totalRow.innerHTML = `<span>Total</span><span>${formatTotals(totals)}</span>`;
    checkoutSummary.appendChild(totalRow);
    return totals;
  }

  function prefillCheckoutForm() {
    const nameInput = document.getElementById('checkout-name');
    const cityInput = document.getElementById('checkout-city');
    const session = getSession();
    const user = session ? findUser(session.email) : null;
    if (user && nameInput && !nameInput.value) nameInput.value = user.name;
    try {
      const savedDelivery = JSON.parse(localStorage.getItem(DELIVERY_KEY));
      if (savedDelivery && savedDelivery.city && cityInput && !cityInput.value) cityInput.value = savedDelivery.city;
    } catch (err) {}
  }

  function openCheckout() {
    const items = getCart();
    if (items.length === 0) { showToast('Your cart is empty.'); return; }
    if (checkoutError) checkoutError.textContent = '';
    appliedPromo = null;
    if (checkoutPromoInput) checkoutPromoInput.value = '';
    if (checkoutPromoMsg) { checkoutPromoMsg.textContent = ''; checkoutPromoMsg.className = 'form-msg'; }
    renderCheckoutSummary(items, null); prefillCheckoutForm();
    if (checkoutFormView) checkoutFormView.style.display = 'block';
    if (checkoutSuccessView) checkoutSuccessView.style.display = 'none';
    if (checkoutOverlay) checkoutOverlay.classList.add('open');
    closeCartPanel();
  }

  function closeCheckout() {
    if (checkoutOverlay) checkoutOverlay.classList.remove('open');
  }

  if (checkoutPromoApply) {
    checkoutPromoApply.addEventListener('click', () => {
      const code = (checkoutPromoInput ? checkoutPromoInput.value : '').trim().toUpperCase();
      if (!code) { appliedPromo = null; if (checkoutPromoMsg) { checkoutPromoMsg.textContent = 'Enter a code first.'; checkoutPromoMsg.className = 'form-msg error'; } }
      else if (PROMO_CODES[code]) { appliedPromo = { code, percent: PROMO_CODES[code] }; if (checkoutPromoMsg) { checkoutPromoMsg.textContent = `Code applied — ${appliedPromo.percent}% off!`; checkoutPromoMsg.className = 'form-msg success'; } }
      else { appliedPromo = null; if (checkoutPromoMsg) { checkoutPromoMsg.textContent = 'That code is not valid.'; checkoutPromoMsg.className = 'form-msg error'; } }
      renderCheckoutSummary(getCart(), appliedPromo);
    });
  }

  if (checkoutClose) checkoutClose.addEventListener('click', closeCheckout);
  if (checkoutOverlay) {
    checkoutOverlay.addEventListener('click', e => { if (e.target === checkoutOverlay) closeCheckout(); });
  }
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && checkoutOverlay && checkoutOverlay.classList.contains('open')) closeCheckout();
  });

  if (checkoutForm) {
    checkoutForm.addEventListener('submit', e => {
      e.preventDefault();
      if (checkoutError) checkoutError.textContent = '';
      const items = getCart();
      if (items.length === 0) { if (checkoutError) checkoutError.textContent = 'Your cart is empty.'; return; }
      const name = document.getElementById('checkout-name').value.trim();
      const address = document.getElementById('checkout-address').value.trim();
      const city = document.getElementById('checkout-city').value.trim();
      const paymentInput = document.querySelector('input[name="checkout-payment"]:checked');
      const payment = paymentInput ? paymentInput.value : 'Card';
      if (!name || !address || !city) { if (checkoutError) checkoutError.textContent = 'Please fill in every field.'; return; }
      const session = getSession();
      const finalTotals = appliedPromo ? renderCheckoutSummary(items, appliedPromo) : computeTotals(items);
      const totalLabel = formatTotals(finalTotals);
      const order = {
        id: `ORD-${Date.now().toString().slice(-8)}`, date: new Date().toISOString(),
        email: session ? session.email : null,
        items: items.map(i => ({ name: i.name, qty: i.qty, price: i.price, currency: i.currency })),
        totalLabel, promo: appliedPromo ? appliedPromo.code : null, name, address, city, payment
      };
      const orders = getOrders(); orders.unshift(order); saveOrders(orders);
      saveCart([]); updateCartBadge(); renderCart();
      if (checkoutOrderId) checkoutOrderId.textContent = order.id;
      if (checkoutOrderTotal) checkoutOrderTotal.textContent = `Total: ${totalLabel} · ${payment}`;
      if (checkoutFormView) checkoutFormView.style.display = 'none';
      if (checkoutSuccessView) checkoutSuccessView.style.display = 'block';
      checkoutForm.reset(); appliedPromo = null;
      showToast('Order placed! Thank you for shopping with Marikato.');
    });
  }

  if (checkoutDoneBtn) checkoutDoneBtn.addEventListener('click', closeCheckout);
  if (checkoutPrintBtn) checkoutPrintBtn.addEventListener('click', () => window.print());

  function scrollToTarget(target) {
    if (target === 'top') { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    const el = document.getElementById(target);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const navToggle = document.getElementById('nav-toggle');
  const navigationEl = document.getElementById('navigation');

  if (navToggle && navigationEl) {
    navToggle.addEventListener('click', () => {
      const isOpen = navigationEl.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });
  }

  document.querySelectorAll('.navigation button[data-target]').forEach(btn => {
    btn.addEventListener('click', () => {
      scrollToTarget(btn.dataset.target);
      if (navigationEl) navigationEl.classList.remove('open');
      if (navToggle) navToggle.setAttribute('aria-expanded', 'false');
    });
  });

  const shopNowBtn = document.querySelector('.shop-now-btn');
  if (shopNowBtn) shopNowBtn.addEventListener('click', () => scrollToTarget('new-arrivals'));

  
  document.querySelectorAll('.hero-secondary-btn[data-target]').forEach(btn => {
    btn.addEventListener('click', () => scrollToTarget(btn.dataset.target));
  });

  const backToTopBtn = document.getElementById('back-to-top');
  if (backToTopBtn) backToTopBtn.addEventListener('click', () => scrollToTarget('top'));

  const stickyWrap = document.querySelector('.sticky-wrap');
  window.addEventListener('scroll', () => {
    if (!stickyWrap) return;
    stickyWrap.classList.toggle('is-scrolled', window.scrollY > 10);
  });

  const searchForm = document.getElementById('search-form');
  const searchInput = document.getElementById('search-input');
  const noResultsMsg = document.getElementById('no-results-msg');
  const clearFiltersBtn = document.getElementById('clear-filters-btn');

  function resetAllFilters() {
    wishlistFilterActive = false;
    activeCategory = 'all';
    if (searchInput) searchInput.value = '';
    if (categoryBar) {
      categoryBar.querySelectorAll('.cat-pill').forEach(button => {
        button.classList.toggle('active', button.dataset.cat === 'all');
      });
    }
    if (wishlistBtn) wishlistBtn.classList.remove('active');
    filterByCategory('all');
    if (noResultsMsg) {
      noResultsMsg.textContent = noResultsDefaultText || 'No products match your search.';
      noResultsMsg.style.display = 'none';
    }
    if (wishlistBtn) wishlistBtn.setAttribute('aria-expanded', 'false');
    closeWishlistPanel();
  }

  function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) { hash = (hash * 31 + str.charCodeAt(i)) | 0; }
    return Math.abs(hash);
  }

  allCards.forEach(card => {
    const img = card.querySelector('img');
    if (img) img.loading = 'lazy';
    const name = card.querySelector('h2')?.textContent.trim() || '';
    const seed = hashString(name);
    const lowStock = seed % 3 === 0;
    const maxStock = lowStock ? (seed % 5) + 2 : (seed % 20) + 15;
    stockLimits.set(name, maxStock);
    if (lowStock) {
      const badge = document.createElement('p');
      badge.className = 'stock-badge';
      badge.textContent = `Only ${maxStock} left in stock!`;
      const priceEl = card.querySelector('.price');
      if (priceEl) priceEl.after(badge);
    }
  });

  function filterProducts(query) {
    const q = query.trim().toLowerCase();
    let visibleCount = 0;
    allCards.forEach(card => {
      const name = card.querySelector('h2')?.textContent.toLowerCase() || '';
      const desc = card.querySelector('p:not(.stars):not(.price)')?.textContent.toLowerCase() || '';
      const matches = q === '' || name.includes(q) || desc.includes(q);
      card.style.display = matches ? '' : 'none';
      if (matches) visibleCount += 1;
    });
    if (noResultsMsg) noResultsMsg.style.display = (q !== '' && visibleCount === 0) ? 'block' : 'none';
  }

  if (searchInput) searchInput.addEventListener('input', () => filterProducts(searchInput.value));
  if (searchForm) {
    searchForm.addEventListener('submit', e => {
      e.preventDefault();
      filterProducts(searchInput ? searchInput.value : '');
      scrollToTarget('new-arrivals');
    });
  }

  const categoryBar = document.getElementById('category-filter-bar');
  let activeCategory = 'all';

  function filterByCategory(cat) {
    activeCategory = cat;
    if (categoryBar) {
      categoryBar.querySelectorAll('.cat-pill').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.cat === cat);
      });
    }
    allCards.forEach(card => {
      const cardCat = card.dataset.category || 'other';
      const catMatch = cat === 'all' || cardCat === cat;
      const searchQuery = searchInput ? searchInput.value.trim().toLowerCase() : '';
      const name = card.querySelector('h3')?.textContent.toLowerCase() || card.querySelector('h2')?.textContent.toLowerCase() || '';
      const desc = card.querySelector('p:not(.stars):not(.price)')?.textContent.toLowerCase() || '';
      const searchMatch = searchQuery === '' || name.includes(searchQuery) || desc.includes(searchQuery);
      card.style.display = (catMatch && searchMatch) ? '' : 'none';
    });
    if (noResultsMsg) {
      const visible = allCards.filter(c => c.style.display !== 'none').length;
      noResultsMsg.style.display = visible === 0 ? 'block' : 'none';
    }
  }

  if (categoryBar) {
    categoryBar.querySelectorAll('.cat-pill').forEach(btn => {
      btn.addEventListener('click', () => filterByCategory(btn.dataset.cat));
    });
  }

  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', () => {
      resetAllFilters();
      showToast('Filters cleared');
    });
  }

  function getCardPrice(card) {
    return parsePrice(card.querySelector('.price')?.textContent || '').amount;
  }

  function getCardRating(card) {
    const match = (card.querySelector('.stars')?.textContent || '').match(/\(([\d.]+)\/5\)/);
    return match ? parseFloat(match[1]) : 0;
  }

  document.querySelectorAll('.product-grid').forEach((grid, gridIndex) => {
    const originalOrder = Array.from(grid.children);
    const selectId = `sort-select-${gridIndex}`;
    const toolbar = document.createElement('div');
    toolbar.className = 'sort-toolbar';
    toolbar.innerHTML = `
      <label for="${selectId}">Sort by</label>
      <select id="${selectId}">
        <option value="featured">Featured</option>
        <option value="price-asc">Price: Low to High</option>
        <option value="price-desc">Price: High to Low</option>
        <option value="rating-desc">Top Rated</option>
      </select>
    `;
    grid.parentNode.insertBefore(toolbar, grid);
    toolbar.querySelector('select').addEventListener('change', e => {
      const value = e.target.value;
      let sorted;
      if (value === 'featured') sorted = originalOrder;
      else if (value === 'price-asc' || value === 'price-desc') {
        sorted = Array.from(grid.children).sort((a, b) => getCardPrice(a) - getCardPrice(b));
        if (value === 'price-desc') sorted.reverse();
      } else {
        sorted = Array.from(grid.children).sort((a, b) => getCardRating(b) - getCardRating(a));
      }
      sorted.forEach(card => grid.appendChild(card));
    });
  });

  const WISHLIST_KEY = 'marikato-wishlist';
  const wishlistBtn = document.getElementById('wishlist-btn');
  const wishlistPanel = document.getElementById('wishlist-panel');
  const wishlistIcon = document.getElementById('wishlist-icon');
  const wishlistCountEl = document.getElementById('wishlist-count');
  const wishlistItemsEl = document.getElementById('wishlist-items');
  const wishlistEmptyMsg = document.getElementById('wishlist-empty-msg');
  const wishlistViewAllBtn = document.getElementById('wishlist-view-all-btn');
  const noResultsDefaultText = noResultsMsg ? noResultsMsg.dataset.defaultText : '';
  let wishlistFilterActive = false;

  function getWishlist() {
    try { return JSON.parse(localStorage.getItem(WISHLIST_KEY)) || []; } catch (err) { return []; }
  }

  function saveWishlist(list) {
    try { localStorage.setItem(WISHLIST_KEY, JSON.stringify(list)); } catch (err) {}
  }

  function updateWishlistBadge() {
    if (wishlistCountEl) wishlistCountEl.textContent = getWishlist().length;
  }

  function setHeartState(btn, saved) {
    btn.classList.toggle('active', saved);
    btn.setAttribute('aria-pressed', String(saved));
    const icon = btn.querySelector('i');
    if (icon) icon.className = saved ? 'fas fa-heart' : 'far fa-heart';
  }

  function cardHeartBtn(name) {
    return allCards.find(card => (card.querySelector('h2')?.textContent.trim() || '') === name)?.querySelector('.wishlist-toggle') || null;
  }

  function removeFromWishlist(name) {
    saveWishlist(getWishlist().filter(n => n !== name));
    const heartBtn = cardHeartBtn(name);
    if (heartBtn) setHeartState(heartBtn, false);
    updateWishlistBadge(); renderWishlistPanel();
    if (wishlistFilterActive) applyWishlistFilter();
  }

  function renderWishlistPanel() {
    if (!wishlistItemsEl) return;
    const saved = getWishlist();
    wishlistItemsEl.innerHTML = '';
    const hasItems = saved.length > 0;
    if (wishlistEmptyMsg) wishlistEmptyMsg.style.display = hasItems ? 'none' : 'block';
    if (wishlistViewAllBtn) wishlistViewAllBtn.style.display = hasItems ? 'block' : 'none';
    if (!hasItems) return;
    saved.forEach(name => {
      const card = allCards.find(c => (c.querySelector('h2')?.textContent.trim() || '') === name);
      if (!card) return;
      const imgSrc = card.querySelector('img')?.getAttribute('src') || '';
      const priceEl = card.querySelector('.price');
      const { amount, currency } = parsePrice(priceEl ? priceEl.textContent : '');
      const row = document.createElement('div'); row.className = 'wishlist-item';
      const img = document.createElement('img'); img.className = 'wishlist-item-img'; img.src = imgSrc; img.alt = name;
      const info = document.createElement('div'); info.className = 'wishlist-item-info';
      const nameDiv = document.createElement('div'); nameDiv.className = 'wishlist-item-name'; nameDiv.textContent = name;
      const priceDiv = document.createElement('div'); priceDiv.className = 'wishlist-item-price'; priceDiv.textContent = formatMoney(amount, currency);
      info.append(nameDiv, priceDiv);
      const actions = document.createElement('div'); actions.className = 'wishlist-item-actions';
      const moveBtn = document.createElement('button'); moveBtn.type = 'button'; moveBtn.className = 'wishlist-move-btn';
      moveBtn.innerHTML = '<i class="fa fa-cart-plus"></i>'; moveBtn.setAttribute('aria-label', `Move ${name} to cart`); moveBtn.title = 'Move to cart';
      const removeBtn = document.createElement('button'); removeBtn.type = 'button'; removeBtn.className = 'wishlist-item-remove';
      removeBtn.innerHTML = '<i class="fa fa-times"></i>'; removeBtn.setAttribute('aria-label', `Remove ${name} from wishlist`);
      actions.append(moveBtn, removeBtn);
      moveBtn.addEventListener('click', () => { addToCart(name, amount, currency); removeFromWishlist(name); showToast(`${name} moved to cart`); });
      removeBtn.addEventListener('click', () => removeFromWishlist(name));
      row.append(img, info, actions);
      wishlistItemsEl.appendChild(row);
    });
  }

  function applyWishlistFilter() {
    const saved = getWishlist();
    allCards.forEach(card => {
      const name = card.querySelector('h2')?.textContent.trim() || '';
      const isSaved = saved.includes(name);
      card.style.display = (!wishlistFilterActive || isSaved) ? '' : 'none';
    });
    if (searchInput && wishlistFilterActive) searchInput.value = '';
    if (wishlistBtn) wishlistBtn.classList.toggle('active', wishlistFilterActive);
    if (noResultsMsg) {
      noResultsMsg.textContent = wishlistFilterActive ? 'Your wishlist is empty.' : noResultsDefaultText;
      noResultsMsg.style.display = (wishlistFilterActive && saved.length === 0) ? 'block' : 'none';
    }
  }

  allCards.forEach(card => {
    const nameEl = card.querySelector('h2');
    const productName = nameEl ? nameEl.textContent.trim() : 'Item';
    const heartBtn = document.createElement('button');
    heartBtn.type = 'button'; heartBtn.className = 'wishlist-toggle';
    heartBtn.setAttribute('aria-label', `Save ${productName} to wishlist`);
    heartBtn.innerHTML = '<i class="far fa-heart"></i>';
    card.prepend(heartBtn);
    setHeartState(heartBtn, getWishlist().includes(productName));
    heartBtn.addEventListener('click', e => {
      e.stopPropagation();
      const list = getWishlist();
      const idx = list.indexOf(productName);
      const nowSaved = idx === -1;
      if (nowSaved) { list.push(productName); showToast(`${productName} added to wishlist`); }
      else { list.splice(idx, 1); showToast(`${productName} removed from wishlist`); }
      saveWishlist(list);
      setHeartState(heartBtn, nowSaved);
      updateWishlistBadge(); renderWishlistPanel();
      if (wishlistFilterActive) applyWishlistFilter();
    });
  });

  updateWishlistBadge(); renderWishlistPanel();

  function openWishlistPanel() {
    if (!wishlistPanel) return;
    wishlistPanel.classList.add('open');
    if (wishlistBtn) wishlistBtn.setAttribute('aria-expanded', 'true');
  }

  function closeWishlistPanel() {
    if (!wishlistPanel) return;
    wishlistPanel.classList.remove('open');
    if (wishlistBtn) wishlistBtn.setAttribute('aria-expanded', 'false');
  }

  if (wishlistBtn && wishlistPanel) {
    wishlistBtn.addEventListener('click', e => {
      e.stopPropagation();
      const isOpen = wishlistPanel.classList.contains('open');
      isOpen ? closeWishlistPanel() : openWishlistPanel();
    });
    wishlistPanel.addEventListener('click', e => e.stopPropagation());
    document.addEventListener('click', () => closeWishlistPanel());
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeWishlistPanel(); });
  }

  if (wishlistViewAllBtn) {
    wishlistViewAllBtn.addEventListener('click', () => {
      wishlistFilterActive = true; applyWishlistFilter(); closeWishlistPanel(); scrollToTarget('new-arrivals');
    });
  }

  const RECENTLY_VIEWED_KEY = 'marikato-recently-viewed';
  const recentlyViewedSection = document.getElementById('recently-viewed');
  const recentlyViewedGrid = document.getElementById('recently-viewed-grid');

  function getRecentlyViewed() {
    try { return JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY)) || []; } catch (err) { return []; }
  }

  function saveRecentlyViewed(list) {
    try { localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(list)); } catch (err) {}
  }

  function renderRecentlyViewed() {
    if (!recentlyViewedGrid || !recentlyViewedSection) return;
    const names = getRecentlyViewed();
    const matches = names.map(name => allCards.find(c => c.querySelector('h2')?.textContent.trim() === name)).filter(Boolean);
    recentlyViewedGrid.innerHTML = '';
    if (matches.length === 0) { recentlyViewedSection.style.display = 'none'; return; }
    recentlyViewedSection.style.display = 'block';
    matches.forEach(originalCard => {
      const name = originalCard.querySelector('h2')?.textContent.trim() || '';
      const img = originalCard.querySelector('img');
      const priceText = originalCard.querySelector('.price')?.textContent || '';
      const mini = document.createElement('button');
      mini.type = 'button'; mini.className = 'product-card recently-viewed-card';
      mini.innerHTML = `<img src="${img ? img.src : ''}" alt="${name}" loading="lazy" width="200" height="200"><h2>${name}</h2><p class="price">${priceText}</p>`;
      mini.addEventListener('click', () => {
        originalCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        originalCard.classList.add('highlight-card');
        setTimeout(() => originalCard.classList.remove('highlight-card'), 1500);
      });
      recentlyViewedGrid.appendChild(mini);
    });
  }

  function trackViewed(name) {
    const list = getRecentlyViewed().filter(n => n !== name);
    list.unshift(name);
    saveRecentlyViewed(list.slice(0, 4));
    renderRecentlyViewed();
  }

  allCards.forEach(card => {
    const details = card.querySelector('details');
    const name = card.querySelector('h2')?.textContent.trim();
    if (details && name) {
      details.addEventListener('toggle', () => { if (details.open) trackViewed(name); });
    }
  });

  renderRecentlyViewed();

  const REVIEWS_KEY = 'marikato-reviews';

  function getAllReviews() {
    try { return JSON.parse(localStorage.getItem(REVIEWS_KEY)) || {}; } catch (err) { return {}; }
  }

  function getReviewsFor(name) {
    return getAllReviews()[name] || [];
  }

  function saveReviewsFor(name, reviews) {
    try { const all = getAllReviews(); all[name] = reviews; localStorage.setItem(REVIEWS_KEY, JSON.stringify(all)); } catch (err) {}
  }

  function starString(n) {
    return '⭐'.repeat(n) + '☆'.repeat(5 - n);
  }

  function updateCardRatingDisplay(card, seedRating, reviews) {
    const starsEl = card.querySelector('.stars');
    if (!starsEl) return;
    const count = reviews.length;
    const blended = count ? ((seedRating * 3) + reviews.reduce((sum, r) => sum + r.rating, 0)) / (3 + count) : seedRating;
    const rounded = Math.max(0, Math.min(5, Math.round(blended * 10) / 10));
    const full = Math.round(rounded);
    const reviewSuffix = count ? ` · ${count} review${count === 1 ? '' : 's'}` : '';
    starsEl.innerHTML = `${'⭐'.repeat(full)}<span>${'☆'.repeat(5 - full)} (${rounded.toFixed(1)}/5)${reviewSuffix}</span>`;
  }

  function renderReviewList(listEl, reviews) {
    listEl.innerHTML = '';
    if (reviews.length === 0) { listEl.innerHTML = '<p class="delivery-hint">No reviews yet — be the first to write one.</p>'; return; }
    reviews.slice().reverse().forEach(r => {
      const item = document.createElement('div'); item.className = 'review-item';
      const dateLabel = new Date(r.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
      item.innerHTML = `
        <div class="review-item-head">
          <span class="review-item-stars">${starString(r.rating)}</span>
          <span class="review-item-author"></span>
          <span class="review-item-date">${dateLabel}</span>
        </div>
        <p class="review-item-comment"></p>
      `;
      item.querySelector('.review-item-author').textContent = r.name;
      item.querySelector('.review-item-comment').textContent = r.comment;
      listEl.appendChild(item);
    });
  }

  allCards.forEach(card => {
    const details = card.querySelector('details');
    const name = card.querySelector('h2')?.textContent.trim();
    const starsEl = card.querySelector('.stars');
    if (!details || !name || !starsEl) return;
    const seedMatch = starsEl.textContent.match(/\(([\d.]+)\/5\)/);
    const seedRating = seedMatch ? parseFloat(seedMatch[1]) : 5;
    const wrap = document.createElement('div');
    wrap.className = 'review-section';
    wrap.innerHTML = `
      <h4 class="review-heading">Customer Reviews</h4>
      <div class="review-list"></div>
      <form class="review-form">
        <div class="review-star-picker" role="radiogroup" aria-label="Your rating">
          ${[1,2,3,4,5].map(n => `<button type="button" class="review-star-btn" data-value="${n}" aria-label="${n} star${n===1?'':'s'}">☆</button>`).join('')}
        </div>
        <input type="text" class="review-name-input" placeholder="Your name" maxlength="60">
        <textarea class="review-comment-input" placeholder="Share your thoughts on this product..." maxlength="500" rows="2"></textarea>
        <p class="form-msg error review-form-msg"></p>
        <button type="submit" class="delivery-save-btn">Submit Review</button>
      </form>
    `;
    details.appendChild(wrap);
    const listEl = wrap.querySelector('.review-list');
    const form = wrap.querySelector('.review-form');
    const starBtns = Array.from(wrap.querySelectorAll('.review-star-btn'));
    const nameInput = wrap.querySelector('.review-name-input');
    const commentInput = wrap.querySelector('.review-comment-input');
    const formMsg = wrap.querySelector('.review-form-msg');
    let selectedRating = 0;
    const session = getSession();
    const sessionUser = session ? findUser(session.email) : null;
    if (sessionUser) nameInput.value = sessionUser.name;

    function paintStars(value) {
      starBtns.forEach(btn => {
        const on = Number(btn.dataset.value) <= value;
        btn.textContent = on ? '★' : '☆';
        btn.classList.toggle('selected', on);
      });
    }

    starBtns.forEach(btn => {
      btn.addEventListener('click', e => { e.preventDefault(); selectedRating = Number(btn.dataset.value); paintStars(selectedRating); formMsg.textContent = ''; });
    });

    function refresh() {
      const reviews = getReviewsFor(name);
      renderReviewList(listEl, reviews);
      updateCardRatingDisplay(card, seedRating, reviews);
    }

    refresh();

    form.addEventListener('submit', e => {
      e.preventDefault(); formMsg.textContent = '';
      const reviewerName = nameInput.value.trim();
      const comment = commentInput.value.trim();
      if (!selectedRating) { formMsg.textContent = 'Please select a star rating.'; return; }
      if (!reviewerName || !comment) { formMsg.textContent = 'Please add your name and a comment.'; return; }
      const reviews = getReviewsFor(name);
      reviews.push({ name: reviewerName, rating: selectedRating, comment, date: new Date().toISOString() });
      saveReviewsFor(name, reviews);
      commentInput.value = ''; selectedRating = 0; paintStars(0);
      if (sessionUser) nameInput.value = sessionUser.name;
      refresh(); showToast('Thanks for your review!');
    });
  });

  const newsletterForm = document.getElementById('newsletter-form');
  const newsletterMsg = document.getElementById('newsletter-msg');

  if (newsletterForm) {
    newsletterForm.addEventListener('submit', e => {
      e.preventDefault();
      const fullname = document.getElementById('fullname');
      const email = document.getElementById('email');
      if (!fullname.value.trim() || !email.value.trim()) {
        setNewsletterMsg('Please fill in both your name and email.', 'error'); return;
      }
      setNewsletterMsg(`Thanks, ${fullname.value.trim()}! You're subscribed.`, 'success');
      newsletterForm.reset();
    });
    newsletterForm.addEventListener('reset', () => setNewsletterMsg('', ''));
  }

  function setNewsletterMsg(text, type) {
    if (!newsletterMsg) return;
    newsletterMsg.textContent = text;
    newsletterMsg.className = 'form-msg' + (type ? ` ${type}` : '');
  }

  const USERS_KEY = 'marikato-users';
  const SESSION_KEY = 'marikato-session';

  const accountWrap = document.getElementById('account-wrap');
  const accountBtn = document.getElementById('account-btn');
  const accountPanel = document.getElementById('account-panel');
  const accountLabel = document.getElementById('account-label');

  const panelGuest = document.getElementById('account-panel-guest');
  const panelUser = document.getElementById('account-panel-user');
  const accountUserName = document.getElementById('account-user-name');
  const accountUserEmail = document.getElementById('account-user-email');
  const logoutBtn = document.getElementById('logout-btn');
  const orderHistoryToggle = document.getElementById('order-history-toggle');
  const orderHistoryList = document.getElementById('order-history-list');

  const authTabs = document.querySelectorAll('.auth-tab');
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');
  const loginError = document.getElementById('login-error');
  const signupError = document.getElementById('signup-error');

  function getUsers() {
    try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; } catch (err) { return []; }
  }

  function saveUsers(users) {
    try { localStorage.setItem(USERS_KEY, JSON.stringify(users)); } catch (err) {}
  }

  function getSession() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch (err) { return null; }
  }

  function setSession(email) {
    try { localStorage.setItem(SESSION_KEY, JSON.stringify({ email })); } catch (err) {}
  }

  function clearSession() {
    try { localStorage.removeItem(SESSION_KEY); } catch (err) {}
  }

  function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) { hash = (hash << 5) - hash + str.charCodeAt(i); hash |= 0; }
    return String(hash);
  }

  function findUser(email) {
    const normalized = email.trim().toLowerCase();
    return getUsers().find(u => u.email === normalized);
  }

  function renderOrderHistory(email) {
    if (!orderHistoryList) return;
    const orders = getOrders().filter(o => o.email === email);
    orderHistoryList.innerHTML = '';
    if (orders.length === 0) { orderHistoryList.innerHTML = '<p class="delivery-hint">No orders yet.</p>'; return; }
    orders.forEach(order => {
      const card = document.createElement('div'); card.className = 'order-item';
      const dateLabel = new Date(order.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
      const itemsLabel = order.items.map(i => `${i.name} ×${i.qty}`).join(', ');
      card.innerHTML = `
        <div class="order-item-id">${order.id}</div>
        <div class="order-item-meta">${dateLabel} · ${order.payment}</div>
        <div class="order-item-meta">${itemsLabel}</div>
        <div class="order-item-total">${order.totalLabel}</div>
      `;
      orderHistoryList.appendChild(card);
    });
  }

  function refreshAccountUI() {
    const session = getSession();
    const user = session ? findUser(session.email) : null;
    if (user) {
      accountLabel.textContent = user.name.split(' ')[0];
      panelGuest.style.display = 'none'; panelUser.style.display = 'block';
      accountUserName.textContent = user.name;
      accountUserEmail.textContent = user.email;
      if (orderHistoryList) orderHistoryList.style.display = 'none';
      renderOrderHistory(user.email);
    } else {
      accountLabel.textContent = 'Account';
      panelGuest.style.display = 'block'; panelUser.style.display = 'none';
    }
  }

  function openAccountPanel() {
    accountPanel.classList.add('open');
    accountBtn.setAttribute('aria-expanded', 'true');
  }

  function closeAccountPanel() {
    accountPanel.classList.remove('open');
    accountBtn.setAttribute('aria-expanded', 'false');
  }

  function switchAuthTab(tab) {
    authTabs.forEach(btn => btn.classList.toggle('active', btn.dataset.authTab === tab));
    loginForm.style.display = tab === 'login' ? 'flex' : 'none';
    signupForm.style.display = tab === 'signup' ? 'flex' : 'none';
    loginError.textContent = ''; signupError.textContent = '';
  }

  if (accountBtn && accountPanel) {
    refreshAccountUI();
    accountBtn.addEventListener('click', e => {
      e.stopPropagation();
      const isOpen = accountPanel.classList.contains('open');
      isOpen ? closeAccountPanel() : openAccountPanel();
    });
    accountPanel.addEventListener('click', e => e.stopPropagation());
    document.addEventListener('click', () => closeAccountPanel());
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeAccountPanel(); });
    authTabs.forEach(tab => { tab.addEventListener('click', () => switchAuthTab(tab.dataset.authTab)); });

    if (signupForm) {
      signupForm.addEventListener('submit', e => {
        e.preventDefault(); signupError.textContent = '';
        const name = document.getElementById('signup-name').value.trim();
        const email = document.getElementById('signup-email').value.trim().toLowerCase();
        const password = document.getElementById('signup-password').value;
        const confirm = document.getElementById('signup-password-confirm').value;
        if (!name || !email || !password || !confirm) { signupError.textContent = 'Please fill in every field.'; return; }
        if (password.length < 6) { signupError.textContent = 'Password must be at least 6 characters.'; return; }
        if (password !== confirm) { signupError.textContent = 'Passwords do not match.'; return; }
        if (findUser(email)) { signupError.textContent = 'An account with that email already exists.'; return; }
        const users = getUsers();
        users.push({ name, email, passwordHash: simpleHash(password) });
        saveUsers(users); setSession(email);
        signupForm.reset(); refreshAccountUI(); closeAccountPanel();
        showToast(`Welcome, ${name}! Your account was created.`);
      });
    }

    if (loginForm) {
      loginForm.addEventListener('submit', e => {
        e.preventDefault(); loginError.textContent = '';
        const email = document.getElementById('login-email').value.trim().toLowerCase();
        const password = document.getElementById('login-password').value;
        const user = findUser(email);
        if (!user || user.passwordHash !== simpleHash(password)) { loginError.textContent = 'Incorrect email or password.'; return; }
        setSession(email); loginForm.reset(); refreshAccountUI(); closeAccountPanel();
        showToast(`Welcome back, ${user.name.split(' ')[0]}!`);
      });
    }

    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        clearSession(); refreshAccountUI(); closeAccountPanel(); switchAuthTab('login');
        showToast('You have been logged out.');
      });
    }

    if (orderHistoryToggle && orderHistoryList) {
      orderHistoryToggle.addEventListener('click', () => {
        const isOpen = orderHistoryList.style.display === 'block';
        orderHistoryList.style.display = isOpen ? 'none' : 'block';
      });
    }
  }

  /* ---------------------------------------------------------
     Quick View Modal — click any product image to open a
     detailed modal without leaving the page.
  --------------------------------------------------------- */
  const quickviewOverlay = document.getElementById('quickview-overlay');
  const quickviewModal = document.getElementById('quickview-modal');
  const quickviewClose = document.getElementById('quickview-close');

  const qvImg = document.getElementById('quickview-img');
  const qvCategory = document.getElementById('quickview-category');
  const qvTitle = document.getElementById('quickview-title');
  const qvStars = document.getElementById('quickview-stars');
  const qvPrice = document.getElementById('quickview-price');
  const qvDesc = document.getElementById('quickview-desc');
  const qvDetails = document.getElementById('quickview-details-list');
  const qvStock = document.getElementById('quickview-stock');
  const qvReviewList = document.getElementById('quickview-review-list');
  const qvAddCart = document.getElementById('qv-add-cart');
  const qvWishlist = document.getElementById('qv-wishlist');
  const qvDec = document.getElementById('qv-dec');
  const qvInc = document.getElementById('qv-inc');
  const qvQty = document.getElementById('qv-qty');

  let qvCurrentName = '';
  let qvCurrentPrice = 0;
  let qvCurrentCurrency = 'USD';
  let qvSelectedQty = 1;
  let qvMaxStock = Infinity;

  function openQuickView(card) {
    const name = card.querySelector('h2')?.textContent.trim() || '';
    const img = card.querySelector('img');
    const priceEl = card.querySelector('.price');
    const starsEl = card.querySelector('.stars');
    const descEl = card.querySelector('p:not(.stars):not(.price)');
    const detailsEl = card.querySelector('details ul');
    const category = card.dataset.category || 'Product';

    const { amount, currency } = parsePrice(priceEl?.textContent || '');
    qvCurrentName = name;
    qvCurrentPrice = amount;
    qvCurrentCurrency = currency;
    qvMaxStock = getStockLimit(name);
    qvSelectedQty = 1;

    qvImg.src = img?.src || '';
    qvImg.alt = name;
    qvCategory.textContent = category === 'local' ? 'Ethiopian Local' : category.charAt(0).toUpperCase() + category.slice(1);
    qvTitle.textContent = name;
    qvStars.innerHTML = starsEl?.innerHTML || '';
    qvPrice.textContent = priceEl?.textContent || '';
    qvDesc.textContent = descEl?.textContent || '';

    qvDetails.innerHTML = '';
    if (detailsEl) {
      const ul = document.createElement('ul');
      Array.from(detailsEl.children).forEach(li => { const clone = li.cloneNode(true); ul.appendChild(clone); });
      qvDetails.appendChild(ul);
    }

    const lowStock = qvMaxStock <= 6;
    qvStock.style.display = lowStock ? 'block' : 'none';
    qvStock.textContent = lowStock ? `Only ${qvMaxStock} left in stock!` : '';

    const reviews = getReviewsFor(name);
    qvReviewList.innerHTML = '';
    if (reviews.length === 0) {
      qvReviewList.innerHTML = '<p class="delivery-hint">No reviews yet — be the first to write one.</p>';
    } else {
      reviews.slice().reverse().forEach(r => {
        const item = document.createElement('div'); item.className = 'review-item';
        const dateLabel = new Date(r.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
        item.innerHTML = `
          <div class="review-item-head">
            <span class="review-item-stars">${'⭐'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</span>
            <span class="review-item-author">${r.name}</span>
            <span class="review-item-date">${dateLabel}</span>
          </div>
          <p class="review-item-comment">${r.comment}</p>
        `;
        qvReviewList.appendChild(item);
      });
    }

    const isSaved = getWishlist().includes(name);
    qvWishlist.classList.toggle('active', isSaved);
    const heartIcon = qvWishlist.querySelector('i');
    if (heartIcon) heartIcon.className = isSaved ? 'fas fa-heart' : 'far fa-heart';

    refreshQVQty();
    if (quickviewOverlay) quickviewOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeQuickView() {
    if (quickviewOverlay) quickviewOverlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  function refreshQVQty() {
    qvQty.textContent = qvSelectedQty;
    qvDec.disabled = qvSelectedQty <= 1;
    qvInc.disabled = qvSelectedQty >= qvMaxStock;
  }

  allCards.forEach(card => {
    const img = card.querySelector('img');
    if (img) img.addEventListener('click', () => openQuickView(card));
  });

  if (qvDec) qvDec.addEventListener('click', () => { if (qvSelectedQty > 1) qvSelectedQty -= 1; refreshQVQty(); });
  if (qvInc) qvInc.addEventListener('click', () => { if (qvSelectedQty < qvMaxStock) qvSelectedQty += 1; refreshQVQty(); });

  if (qvAddCart) {
    qvAddCart.addEventListener('click', () => {
      const added = addToCart(qvCurrentName, qvCurrentPrice, qvCurrentCurrency, qvSelectedQty);
      if (added > 0) {
        showToast(`${added} × ${qvCurrentName} added to cart`);
        qvSelectedQty = 1; refreshQVQty();
      }
    });
  }

  if (qvWishlist) {
    qvWishlist.addEventListener('click', () => {
      const list = getWishlist();
      const idx = list.indexOf(qvCurrentName);
      const nowSaved = idx === -1;
      if (nowSaved) { list.push(qvCurrentName); showToast(`${qvCurrentName} added to wishlist`); }
      else { list.splice(idx, 1); showToast(`${qvCurrentName} removed from wishlist`); }
      saveWishlist(list);
      qvWishlist.classList.toggle('active', nowSaved);
      const heartIcon = qvWishlist.querySelector('i');
      if (heartIcon) heartIcon.className = nowSaved ? 'fas fa-heart' : 'far fa-heart';
      const cardHeart = cardHeartBtn(qvCurrentName);
      if (cardHeart) setHeartState(cardHeart, nowSaved);
      updateWishlistBadge(); renderWishlistPanel();
    });
  }

  if (quickviewClose) quickviewClose.addEventListener('click', closeQuickView);
  if (quickviewOverlay) {
    quickviewOverlay.addEventListener('click', e => { if (e.target === quickviewOverlay) closeQuickView(); });
  }
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && quickviewOverlay?.classList.contains('open')) closeQuickView();
  });

});