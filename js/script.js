document.addEventListener('DOMContentLoaded', () => {
  const headerRoot = document.querySelector('[data-header]');
  const tickerRoot = document.querySelector('[data-ticker]');
  const metricsRoot = document.querySelector('[data-metrics]');
  const signalRoot = document.querySelector('[data-signals]');
  const stateRoot = document.querySelector('[data-states]');
  const articleRoot = document.querySelector('[data-articles]');
  const featuresRoot = document.querySelector('[data-features]');
  const newsletterRoot = document.querySelector('[data-newsletter]');
  const footerRoot = document.querySelector('[data-footer]');
  const filterRoot = document.querySelector('[data-filters]');
  const menuToggle = document.querySelector('.menu-toggle');
  const mobileNav = document.querySelector('.mobile-nav');

  if (headerRoot) renderHeader(headerRoot, window.location.pathname);
  if (tickerRoot) renderTicker(tickerRoot);
  if (metricsRoot) renderMarketMetrics(metricsRoot);
  if (signalRoot) renderSignalWire(signalRoot);
  if (stateRoot) renderStateCards(stateRoot);
  if (featuresRoot) renderFeatureCards(featuresRoot);
  if (newsletterRoot) renderNewsletter(newsletterRoot);
  if (footerRoot) renderFooter(footerRoot);

  if (articleRoot && filterRoot) {
    const filters = ['All', 'Export', 'Disease', 'Global', 'Policy', 'Farming', 'Technology'];
    filterRoot.innerHTML = filters.map((filter) => `<button class="filter-btn ${filter === 'All' ? 'active' : ''}" data-filter="${filter}">${filter}</button>`).join('');
    renderArticleCards(articleRoot, 'All');

    filterRoot.querySelectorAll('.filter-btn').forEach((button) => {
      button.addEventListener('click', () => {
        filterRoot.querySelectorAll('.filter-btn').forEach((item) => item.classList.remove('active'));
        button.classList.add('active');
        renderArticleCards(articleRoot, button.dataset.filter);
        observeReveals();
      });
    });
  }

  if (menuToggle && mobileNav) {
    menuToggle.addEventListener('click', () => {
      mobileNav.classList.toggle('open');
    });

    mobileNav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => mobileNav.classList.remove('open'));
    });

    document.addEventListener('click', (event) => {
      if (!mobileNav.classList.contains('open')) return;
      if (!mobileNav.contains(event.target) && !menuToggle.contains(event.target)) {
        mobileNav.classList.remove('open');
      }
    });
  }

  const liveClock = document.querySelector('[data-clock]');
  if (liveClock) {
    const updateClock = () => {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true });
      liveClock.textContent = formatter.format(now);
    };
    updateClock();
    setInterval(updateClock, 1000);
  }

  const newsletterForm = document.querySelector('.newsletter-form');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const input = newsletterForm.querySelector('input');
      const message = newsletterForm.parentElement.querySelector('.form-message');
      if (!input.value.includes('@')) {
        message.textContent = 'Please enter a valid email address.';
        message.className = 'form-message error';
        return;
      }
      message.textContent = 'Thanks for subscribing. The Shrimp Brief is on the way.';
      message.className = 'form-message success';
      input.value = '';
    });
  }

  const observeReveals = () => {
    document.querySelectorAll('.reveal').forEach((item) => {
      if (item.classList.contains('is-visible')) return;
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.disconnect();
          }
        });
      }, { threshold: 0.2 });
      observer.observe(item);
    });
  };

  observeReveals();

  const chart = document.querySelector('.chart-svg path');
  if (chart) {
    chart.style.strokeDasharray = chart.getTotalLength();
    chart.style.strokeDashoffset = chart.getTotalLength();
    requestAnimationFrame(() => {
      chart.style.transition = 'stroke-dashoffset 1.2s ease';
      chart.style.strokeDashoffset = '0';
    });
  }

  const heroGraphic = document.querySelector('.hero-graphic');
  if (heroGraphic) {
    heroGraphic.animate([{ transform: 'translateY(0px)' }, { transform: 'translateY(-6px)' }, { transform: 'translateY(0px)' }], { duration: 4500, iterations: Infinity, easing: 'ease-in-out' });
  }

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        event.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
});
