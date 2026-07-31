 

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
     Cart
  --------------------------------------------------------- */
  const cartCountEl = document.getElementById('cart-count');
  let cartCount = 0;

  function updateCartBadge() {
    if (cartCountEl) cartCountEl.textContent = cartCount;
  }
  updateCartBadge();

  document.querySelectorAll('.product-card').forEach(card => {
    const nameEl = card.querySelector('h2');
    const productName = nameEl ? nameEl.textContent.trim() : 'Item';

    const addBtn = card.querySelector('.btn-row .primary');
    const buyBtn = card.querySelector('.btn-row button:not(.primary)');

    if (addBtn) {
      addBtn.addEventListener('click', () => {
        cartCount += 1;
        updateCartBadge();
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
        showToast(`Heading to checkout with ${productName}...`);
        // TODO: replace with a real redirect, e.g. window.location.href = '/checkout?item=...'
      });
    }
  });

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

  document.querySelectorAll('.navigation button[data-target]').forEach(btn => {
    btn.addEventListener('click', () => scrollToTarget(btn.dataset.target));
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

});