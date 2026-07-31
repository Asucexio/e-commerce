 

document.addEventListener('DOMContentLoaded', () => {
 
  const heroSlides = Array.from(document.querySelectorAll('.hero-slide'));
  const heroDots = Array.from(document.querySelectorAll('.hero-dots .dot'));
  const heroSection = document.getElementById('hero');
  let heroIndex = 0;
  let heroTimer = null;
  const HERO_INTERVAL = 2000;

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
 
  const toastEl = document.getElementById('toast');
  let toastTimer = null;

  function showToast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2200);
  }

 
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

        // brief visual confirmation on the button itself
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
 
      });
    }
  });

 
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

   
  const stickyWrap = document.querySelector('.sticky-wrap');
  window.addEventListener('scroll', () => {
    if (!stickyWrap) return;
    stickyWrap.classList.toggle('is-scrolled', window.scrollY > 10);
  });

   
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