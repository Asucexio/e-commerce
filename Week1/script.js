document.addEventListener('DOMContentLoaded', () => {

 
  const heroSlides = Array.from(document.querySelectorAll('.hero-slide'));
  const heroDots = Array.from(document.querySelectorAll('.hero-dots .dot'));
  const heroSection = document.getElementById('hero');
  let heroIndex = 0;
  let heroTimer = null;
  const HERO_INTERVAL = 1000;

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
        startHeroTimer(); // reset the clock after a manual jump
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
        } catch (err) {
          
        }
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

  /* ---------------------------------------------------------
     Currency helpers — the catalog mixes USD ("$29.99") and
     ETB ("850 ETB") prices, so cart/checkout totals need to
     track and format each currency separately rather than
     silently summing different currencies together.
  --------------------------------------------------------- */
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

  /* ---------------------------------------------------------
     Dark mode — persisted to localStorage, falls back to the
     visitor's OS-level preference on first visit.
  --------------------------------------------------------- */
  const THEME_KEY = 'marikato-theme';
  const themeToggleBtn = document.getElementById('theme-toggle');
  const themeIcon = document.getElementById('theme-icon');

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    if (themeIcon) themeIcon.className = theme === 'dark' ? 'fa fa-sun' : 'fa fa-moon';
    if (themeToggleBtn) themeToggleBtn.setAttribute('aria-pressed', String(theme === 'dark'));
  }

  function loadTheme() {
    let saved = null;
    try {
      saved = localStorage.getItem(THEME_KEY);
    } catch (err) {
      saved = null;
    }
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(saved || (prefersDark ? 'dark' : 'light'));
  }

  loadTheme();

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const next = isDark ? 'light' : 'dark';
      applyTheme(next);
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch (err) {
        // ignore
      }
    });
  }

  /* ---------------------------------------------------------
     Cart — persisted to localStorage as line items (name,
     price, qty), with a dropdown panel for review/checkout.
  --------------------------------------------------------- */
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
    try {
      return JSON.parse(localStorage.getItem(CART_KEY)) || [];
    } catch (err) {
      return [];
    }
  }

  function saveCart(items) {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(items));
    } catch (err) {
      // localStorage unavailable — fail silently
    }
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
      decBtn.type = 'button';
      decBtn.className = 'cart-qty-btn';
      decBtn.textContent = '−';
      decBtn.setAttribute('aria-label', `Decrease ${item.name} quantity`);
      const qtySpan = document.createElement('span');
      qtySpan.textContent = item.qty;
      const incBtn = document.createElement('button');
      incBtn.type = 'button';
      incBtn.className = 'cart-qty-btn';
      incBtn.textContent = '+';
      incBtn.setAttribute('aria-label', `Increase ${item.name} quantity`);
      qtyWrap.append(decBtn, qtySpan, incBtn);

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'cart-item-remove';
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

  function addToCart(name, price, currency) {
    const items = getCart();
    const existing = items.find(i => i.name === name);
    if (existing) {
      existing.qty += 1;
    } else {
      items.push({ name, price, currency, qty: 1 });
    }
    saveCart(items);
    updateCartBadge();
    renderCart();
  }

  function changeQty(name, delta) {
    let items = getCart();
    const item = items.find(i => i.name === name);
    if (!item) return;
    item.qty += delta;
    items = item.qty <= 0 ? items.filter(i => i.name !== name) : items;
    saveCart(items);
    updateCartBadge();
    renderCart();
  }

  function removeFromCart(name) {
    saveCart(getCart().filter(i => i.name !== name));
    updateCartBadge();
    renderCart();
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

  updateCartBadge();
  renderCart();

  if (cartBtn && cartPanel) {
    cartBtn.addEventListener('click', e => {
      e.stopPropagation();
      const isOpen = cartPanel.classList.contains('open');
      isOpen ? closeCartPanel() : openCartPanel();
    });

    cartPanel.addEventListener('click', e => e.stopPropagation());
    document.addEventListener('click', () => closeCartPanel());
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeCartPanel();
    });
  }

  if (cartCheckoutBtn) {
    cartCheckoutBtn.addEventListener('click', () => openCheckout());
  }

  document.querySelectorAll('.product-card').forEach(card => {
    const nameEl = card.querySelector('h2');
    const productName = nameEl ? nameEl.textContent.trim() : 'Item';

    const priceEl = card.querySelector('.price');
    const { amount: productPrice, currency: productCurrency } = parsePrice(priceEl ? priceEl.textContent : '');

    const addBtn = card.querySelector('.btn-row .primary');
    const buyBtn = card.querySelector('.btn-row button:not(.primary)');

    if (addBtn) {
      addBtn.addEventListener('click', () => {
        addToCart(productName, productPrice, productCurrency);
        showToast(`${productName} added to cart`);

        const original = addBtn.textContent;
        addBtn.textContent = 'Added ✓';
        addBtn.disabled = true;
        setTimeout(() => {
          addBtn.textContent = original;
          addBtn.disabled = false;
        }, 1000);
      });
    }

    if (buyBtn) {
      buyBtn.addEventListener('click', () => {
        addToCart(productName, productPrice, productCurrency);
        openCheckout();
      });
    }
  });

  /* ---------------------------------------------------------
     Checkout — modal with an order summary, shipping/payment
     form, and a confirmation view. Orders are saved to
     localStorage (tagged to the logged-in user's email when
     available) so they can be reviewed in Order History.
  --------------------------------------------------------- */
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

  // Demo promo codes — a real store would validate these server-side.
  const PROMO_CODES = { MARIKATO10: 10, WELCOME15: 15 };
  let appliedPromo = null; // { code, percent } | null

  function getOrders() {
    try {
      return JSON.parse(localStorage.getItem(ORDERS_KEY)) || [];
    } catch (err) {
      return [];
    }
  }

  function saveOrders(orders) {
    try {
      localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    } catch (err) {
      // localStorage unavailable — fail silently
    }
  }

  function computeTotals(items) {
    const totals = {};
    items.forEach(item => {
      totals[item.currency] = (totals[item.currency] || 0) + item.price * item.qty;
    });
    return totals;
  }

  function formatTotals(totals) {
    return Object.entries(totals)
      .map(([currency, amount]) => formatMoney(amount, currency))
      .join('  +  ');
  }

  function renderCheckoutSummary(items, promo) {
    if (!checkoutSummary) return {};
    checkoutSummary.innerHTML = '';

    items.forEach(item => {
      const row = document.createElement('div');
      row.className = 'checkout-summary-item';
      row.innerHTML = `<span>${item.name} &times; ${item.qty}</span><span>${formatMoney(item.price * item.qty, item.currency)}</span>`;
      checkoutSummary.appendChild(row);
    });

    const totals = computeTotals(items);

    if (promo) {
      const discountTotals = {};
      Object.entries(totals).forEach(([currency, amount]) => {
        discountTotals[currency] = amount * (promo.percent / 100);
      });

      const discountRow = document.createElement('div');
      discountRow.className = 'checkout-summary-discount';
      discountRow.innerHTML = `<span>Discount (${promo.code} &minus;${promo.percent}%)</span><span>&minus;${formatTotals(discountTotals)}</span>`;
      checkoutSummary.appendChild(discountRow);

      Object.keys(totals).forEach(currency => {
        totals[currency] -= discountTotals[currency];
      });
    }

    const totalRow = document.createElement('div');
    totalRow.className = 'checkout-summary-total';
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
      if (savedDelivery && savedDelivery.city && cityInput && !cityInput.value) {
        cityInput.value = savedDelivery.city;
      }
    } catch (err) {
      // ignore
    }
  }

  function openCheckout() {
    const items = getCart();
    if (items.length === 0) {
      showToast('Your cart is empty.');
      return;
    }

    if (checkoutError) checkoutError.textContent = '';
    appliedPromo = null;
    if (checkoutPromoInput) checkoutPromoInput.value = '';
    if (checkoutPromoMsg) { checkoutPromoMsg.textContent = ''; checkoutPromoMsg.className = 'form-msg'; }
    renderCheckoutSummary(items, null);
    prefillCheckoutForm();

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

      if (!code) {
        appliedPromo = null;
        if (checkoutPromoMsg) { checkoutPromoMsg.textContent = 'Enter a code first.'; checkoutPromoMsg.className = 'form-msg error'; }
      } else if (PROMO_CODES[code]) {
        appliedPromo = { code, percent: PROMO_CODES[code] };
        if (checkoutPromoMsg) { checkoutPromoMsg.textContent = `Code applied — ${appliedPromo.percent}% off!`; checkoutPromoMsg.className = 'form-msg success'; }
      } else {
        appliedPromo = null;
        if (checkoutPromoMsg) { checkoutPromoMsg.textContent = 'That code is not valid.'; checkoutPromoMsg.className = 'form-msg error'; }
      }

      renderCheckoutSummary(getCart(), appliedPromo);
    });
  }

  if (checkoutClose) checkoutClose.addEventListener('click', closeCheckout);
  if (checkoutOverlay) {
    checkoutOverlay.addEventListener('click', e => {
      if (e.target === checkoutOverlay) closeCheckout();
    });
  }
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && checkoutOverlay && checkoutOverlay.classList.contains('open')) {
      closeCheckout();
    }
  });

  if (checkoutForm) {
    checkoutForm.addEventListener('submit', e => {
      e.preventDefault();
      if (checkoutError) checkoutError.textContent = '';

      const items = getCart();
      if (items.length === 0) {
        if (checkoutError) checkoutError.textContent = 'Your cart is empty.';
        return;
      }

      const name = document.getElementById('checkout-name').value.trim();
      const address = document.getElementById('checkout-address').value.trim();
      const city = document.getElementById('checkout-city').value.trim();
      const paymentInput = document.querySelector('input[name="checkout-payment"]:checked');
      const payment = paymentInput ? paymentInput.value : 'Card';

      if (!name || !address || !city) {
        if (checkoutError) checkoutError.textContent = 'Please fill in every field.';
        return;
      }

      const session = getSession();
      const finalTotals = appliedPromo
        ? renderCheckoutSummary(items, appliedPromo) // returns post-discount totals as a side effect of the last render
        : computeTotals(items);
      const totalLabel = formatTotals(finalTotals);
      const order = {
        id: `ORD-${Date.now().toString().slice(-8)}`,
        date: new Date().toISOString(),
        email: session ? session.email : null,
        items: items.map(i => ({ name: i.name, qty: i.qty, price: i.price, currency: i.currency })),
        totalLabel,
        promo: appliedPromo ? appliedPromo.code : null,
        name,
        address,
        city,
        payment
      };

      const orders = getOrders();
      orders.unshift(order);
      saveOrders(orders);

      saveCart([]);
      updateCartBadge();
      renderCart();

      if (checkoutOrderId) checkoutOrderId.textContent = order.id;
      if (checkoutOrderTotal) checkoutOrderTotal.textContent = `Total: ${totalLabel} · ${payment}`;
      if (checkoutFormView) checkoutFormView.style.display = 'none';
      if (checkoutSuccessView) checkoutSuccessView.style.display = 'block';

      checkoutForm.reset();
      appliedPromo = null;
      showToast('Order placed! Thank you for shopping with Marikato.');
    });
  }

  if (checkoutDoneBtn) {
    checkoutDoneBtn.addEventListener('click', closeCheckout);
  }

  if (checkoutPrintBtn) {
    checkoutPrintBtn.addEventListener('click', () => window.print());
  }

  /* ---------------------------------------------------------
     Smooth-scroll navigation (top nav + hero "Shop Now")
  --------------------------------------------------------- */
  function scrollToTarget(target) {
    if (target === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
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
  if (shopNowBtn) {
    shopNowBtn.addEventListener('click', () => scrollToTarget('new-arrivals'));
  }

  const backToTopBtn = document.getElementById('back-to-top');
  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', () => scrollToTarget('top'));
  }

  /* ---------------------------------------------------------
     Sticky header gets a stronger shadow once the page scrolls,
     so it reads as "lifted" above content instead of blending in.
  --------------------------------------------------------- */
  const stickyWrap = document.querySelector('.sticky-wrap');
  window.addEventListener('scroll', () => {
    if (!stickyWrap) return;
    stickyWrap.classList.toggle('is-scrolled', window.scrollY > 10);
  });

  /* ---------------------------------------------------------
     Live product search — filters every .product-card on the
     page (both New Arrivals and Best Selling) by product name
     and description as the user types, no page reload needed.
  --------------------------------------------------------- */
  const searchForm = document.getElementById('search-form');
  const searchInput = document.getElementById('search-input');
  const noResultsMsg = document.getElementById('no-results-msg');
  const allCards = Array.from(document.querySelectorAll('.product-card'));

  /* ---------------------------------------------------------
     Low-stock urgency badges — deterministic per product name
     (same product always shows the same "left in stock" count
     rather than reshuffling on every reload) and lazy-loaded
     product images for faster initial page loads.
  --------------------------------------------------------- */
  function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash * 31 + str.charCodeAt(i)) | 0;
    }
    return Math.abs(hash);
  }

  allCards.forEach(card => {
    const img = card.querySelector('img');
    if (img) img.loading = 'lazy';

    const name = card.querySelector('h2')?.textContent.trim() || '';
    const seed = hashString(name);

    if (seed % 3 === 0) {
      const left = (seed % 5) + 2;
      const badge = document.createElement('p');
      badge.className = 'stock-badge';
      badge.textContent = `Only ${left} left in stock!`;
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

    if (noResultsMsg) {
      noResultsMsg.style.display = (q !== '' && visibleCount === 0) ? 'block' : 'none';
    }
  }

  if (searchInput) {
    searchInput.addEventListener('input', () => filterProducts(searchInput.value));
  }

  if (searchForm) {
    searchForm.addEventListener('submit', e => {
      e.preventDefault();
      filterProducts(searchInput ? searchInput.value : '');
      scrollToTarget('new-arrivals');
    });
  }

  /* ---------------------------------------------------------
     Sort toolbar — one per product grid, so New Arrivals and
     Best Selling (and any other grid) can be sorted by price
     or rating independently without touching the HTML markup.
  --------------------------------------------------------- */
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

      if (value === 'featured') {
        sorted = originalOrder;
      } else if (value === 'price-asc' || value === 'price-desc') {
        sorted = Array.from(grid.children).sort((a, b) => getCardPrice(a) - getCardPrice(b));
        if (value === 'price-desc') sorted.reverse();
      } else {
        sorted = Array.from(grid.children).sort((a, b) => getCardRating(b) - getCardRating(a));
      }

      sorted.forEach(card => grid.appendChild(card));
    });
  });

  /* ---------------------------------------------------------
     Wishlist — heart-toggle on every product card, persisted
     to localStorage, reflected in the header count, and
     click-to-filter "show wishlist only" on the header icon.
  --------------------------------------------------------- */
  const WISHLIST_KEY = 'marikato-wishlist';
  const wishlistWrap = document.getElementById('wishlist');
  const wishlistIcon = document.getElementById('wishlist-icon');
  const wishlistCountEl = document.getElementById('wishlist-count');
  const noResultsDefaultText = noResultsMsg ? noResultsMsg.dataset.defaultText : '';
  let wishlistFilterActive = false;

  function getWishlist() {
    try {
      return JSON.parse(localStorage.getItem(WISHLIST_KEY)) || [];
    } catch (err) {
      return [];
    }
  }

  function saveWishlist(list) {
    try {
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(list));
    } catch (err) {
      // localStorage unavailable — fail silently
    }
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

  function applyWishlistFilter() {
    const saved = getWishlist();

    allCards.forEach(card => {
      const name = card.querySelector('h2')?.textContent.trim() || '';
      const isSaved = saved.includes(name);
      card.style.display = (!wishlistFilterActive || isSaved) ? '' : 'none';
    });

    if (searchInput && wishlistFilterActive) searchInput.value = '';
    if (wishlistWrap) wishlistWrap.classList.toggle('active', wishlistFilterActive);

    if (noResultsMsg) {
      noResultsMsg.textContent = wishlistFilterActive
        ? 'Your wishlist is empty.'
        : noResultsDefaultText;
      noResultsMsg.style.display = (wishlistFilterActive && saved.length === 0) ? 'block' : 'none';
    }
  }

  allCards.forEach(card => {
    const nameEl = card.querySelector('h2');
    const productName = nameEl ? nameEl.textContent.trim() : 'Item';

    const heartBtn = document.createElement('button');
    heartBtn.type = 'button';
    heartBtn.className = 'wishlist-toggle';
    heartBtn.setAttribute('aria-label', `Save ${productName} to wishlist`);
    heartBtn.innerHTML = '<i class="far fa-heart"></i>';
    card.prepend(heartBtn);

    setHeartState(heartBtn, getWishlist().includes(productName));

    heartBtn.addEventListener('click', e => {
      e.stopPropagation();
      const list = getWishlist();
      const idx = list.indexOf(productName);
      const nowSaved = idx === -1;

      if (nowSaved) {
        list.push(productName);
        showToast(`${productName} added to wishlist`);
      } else {
        list.splice(idx, 1);
        showToast(`${productName} removed from wishlist`);
      }

      saveWishlist(list);
      setHeartState(heartBtn, nowSaved);
      updateWishlistBadge();
      if (wishlistFilterActive) applyWishlistFilter();
    });
  });

  updateWishlistBadge();

  if (wishlistWrap) {
    wishlistWrap.addEventListener('click', () => {
      wishlistFilterActive = !wishlistFilterActive;
      applyWishlistFilter();
      if (wishlistFilterActive) scrollToTarget('new-arrivals');
    });
  }

  /* ---------------------------------------------------------
     Recently Viewed — tracks the last 4 distinct products a
     visitor expands "View Details" on, persisted to
     localStorage, and rendered as a clickable strip that
     scrolls/highlights the real card (rather than a full
     duplicate with its own Add to Cart wiring).
  --------------------------------------------------------- */
  const RECENTLY_VIEWED_KEY = 'marikato-recently-viewed';
  const recentlyViewedSection = document.getElementById('recently-viewed');
  const recentlyViewedGrid = document.getElementById('recently-viewed-grid');

  function getRecentlyViewed() {
    try {
      return JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY)) || [];
    } catch (err) {
      return [];
    }
  }

  function saveRecentlyViewed(list) {
    try {
      localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(list));
    } catch (err) {
      // localStorage unavailable — fail silently
    }
  }

  function renderRecentlyViewed() {
    if (!recentlyViewedGrid || !recentlyViewedSection) return;
    const names = getRecentlyViewed();
    const matches = names
      .map(name => allCards.find(c => c.querySelector('h2')?.textContent.trim() === name))
      .filter(Boolean);

    recentlyViewedGrid.innerHTML = '';

    if (matches.length === 0) {
      recentlyViewedSection.style.display = 'none';
      return;
    }

    recentlyViewedSection.style.display = 'block';

    matches.forEach(originalCard => {
      const name = originalCard.querySelector('h2')?.textContent.trim() || '';
      const img = originalCard.querySelector('img');
      const priceText = originalCard.querySelector('.price')?.textContent || '';

      const mini = document.createElement('button');
      mini.type = 'button';
      mini.className = 'product-card recently-viewed-card';
      mini.innerHTML = `
        <img src="${img ? img.src : ''}" alt="${name}" loading="lazy" width="200" height="200">
        <h2>${name}</h2>
        <p class="price">${priceText}</p>
      `;
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
      details.addEventListener('toggle', () => {
        if (details.open) trackViewed(name);
      });
    }
  });

  renderRecentlyViewed();

  /* ---------------------------------------------------------
     Newsletter form — validated + "submitted" in the browser
     since there's no backend wired up yet.
  --------------------------------------------------------- */
  const newsletterForm = document.getElementById('newsletter-form');
  const newsletterMsg = document.getElementById('newsletter-msg');

  if (newsletterForm) {
    newsletterForm.addEventListener('submit', e => {
      e.preventDefault();

      const fullname = document.getElementById('fullname');
      const email = document.getElementById('email');

      if (!fullname.value.trim() || !email.value.trim()) {
        setNewsletterMsg('Please fill in both your name and email.', 'error');
        return;
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

  /* ---------------------------------------------------------
     Account: login / sign up
     NOTE: This is a front-end-only demo. Accounts + passwords
     are stored in localStorage on the visitor's own browser —
     fine for prototyping, but NOT secure for a real site. A
     production version needs a real backend that hashes
     passwords and issues sessions/tokens server-side.
  --------------------------------------------------------- */
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
    try {
      return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
    } catch (err) {
      return [];
    }
  }

  function saveUsers(users) {
    try {
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    } catch (err) {
      // localStorage unavailable (e.g. private browsing) — fail silently
    }
  }

  function getSession() {
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY));
    } catch (err) {
      return null;
    }
  }

  function setSession(email) {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify({ email }));
    } catch (err) {
      // ignore
    }
  }

  function clearSession() {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch (err) {
      // ignore
    }
  }

  // Extremely simple non-cryptographic hash so we at least avoid
  // storing raw passwords in plain text. Not real security.
  function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
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

    if (orders.length === 0) {
      orderHistoryList.innerHTML = '<p class="delivery-hint">No orders yet.</p>';
      return;
    }

    orders.forEach(order => {
      const card = document.createElement('div');
      card.className = 'order-item';
      const dateLabel = new Date(order.date).toLocaleDateString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric'
      });
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
      panelGuest.style.display = 'none';
      panelUser.style.display = 'block';
      accountUserName.textContent = user.name;
      accountUserEmail.textContent = user.email;
      if (orderHistoryList) orderHistoryList.style.display = 'none';
      renderOrderHistory(user.email);
    } else {
      accountLabel.textContent = 'Account';
      panelGuest.style.display = 'block';
      panelUser.style.display = 'none';
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
    loginError.textContent = '';
    signupError.textContent = '';
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

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeAccountPanel();
    });

    authTabs.forEach(tab => {
      tab.addEventListener('click', () => switchAuthTab(tab.dataset.authTab));
    });

    if (signupForm) {
      signupForm.addEventListener('submit', e => {
        e.preventDefault();
        signupError.textContent = '';

        const name = document.getElementById('signup-name').value.trim();
        const email = document.getElementById('signup-email').value.trim().toLowerCase();
        const password = document.getElementById('signup-password').value;
        const confirm = document.getElementById('signup-password-confirm').value;

        if (!name || !email || !password || !confirm) {
          signupError.textContent = 'Please fill in every field.';
          return;
        }
        if (password.length < 6) {
          signupError.textContent = 'Password must be at least 6 characters.';
          return;
        }
        if (password !== confirm) {
          signupError.textContent = 'Passwords do not match.';
          return;
        }
        if (findUser(email)) {
          signupError.textContent = 'An account with that email already exists.';
          return;
        }

        const users = getUsers();
        users.push({ name, email, passwordHash: simpleHash(password) });
        saveUsers(users);
        setSession(email);

        signupForm.reset();
        refreshAccountUI();
        closeAccountPanel();
        showToast(`Welcome, ${name}! Your account was created.`);
      });
    }

    if (loginForm) {
      loginForm.addEventListener('submit', e => {
        e.preventDefault();
        loginError.textContent = '';

        const email = document.getElementById('login-email').value.trim().toLowerCase();
        const password = document.getElementById('login-password').value;

        const user = findUser(email);
        if (!user || user.passwordHash !== simpleHash(password)) {
          loginError.textContent = 'Incorrect email or password.';
          return;
        }

        setSession(email);
        loginForm.reset();
        refreshAccountUI();
        closeAccountPanel();
        showToast(`Welcome back, ${user.name.split(' ')[0]}!`);
      });
    }

    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        clearSession();
        refreshAccountUI();
        closeAccountPanel();
        switchAuthTab('login');
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

});