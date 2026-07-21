function renderHeader(container, currentPath = "") {
  const nav = siteData.navigation;
  const markup = `
    <header class="site-header">
      <div class="container">
        <div class="header-inner">
          <a class="brand" href="/index.html">
            <div class="brand-mark">SN</div>
            <div class="brand-copy">
              <strong>Shrimp.News</strong>
              <span>Live intelligence</span>
            </div>
          </a>

          <div class="header-center">
            <a class="ask-control" href="/pages/ask-aquaprana.html">
              <span class="ask-label"><span>✦</span> Ask Prana — disease, water, feed, prices...</span>
              <span class="ask-badge">AI</span>
            </a>
          </div>

          <div class="header-actions">
            <div class="nav-pill-group">
              ${nav
                .filter((item) => ["Feed", "Markets", "Tools"].includes(item.label))
                .map((item) => {
                  const href = item.href;
                  const normalizedPath = currentPath === '/' ? '/' : currentPath.replace(/\/+$/, '').replace(/\.html$/, '');
                  const normalizedHref = href.replace(/\/+$/, '').replace(/\.html$/, '');
                  const isActive = normalizedPath === normalizedHref || (item.label === 'Feed' && (normalizedPath === '/' || normalizedPath === '/index'));
                  return `<a class="nav-pill ${isActive ? 'active' : ''}" href="${href}">${item.label}</a>`;
                })
                .join('')}
            </div>
            <div class="status-pill"><span class="pulse-dot"></span><span>MARKETS LIVE</span><span class="status-time" data-clock></span></div>
          </div>

          <button class="menu-toggle btn btn-secondary" aria-label="Toggle navigation">☰</button>
        </div>
      </div>
      <nav class="mobile-nav" aria-label="Mobile navigation"></nav>
    </header>
  `;
  container.innerHTML = markup;
  const mobileNav = container.querySelector('.mobile-nav');
  mobileNav.innerHTML = nav.map((item) => `<a href="${item.href}">${item.label}</a>`).join('');
}

function renderTicker(container) {
  const items = [...siteData.tickerItems, ...siteData.tickerItems];
  const markup = `
    <section class="ticker" aria-label="Market ticker">
      <div class="container">
        <div class="ticker-track">
          ${items.map((item) => `
            <div class="ticker-item">
              <span class="ticker-label">${item.label}</span>
              <span class="ticker-value">${item.value}</span>
              <span class="ticker-change ${item.positive ? '' : 'negative'}">${item.positive ? '▲' : '▼'} ${item.change}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </section>
  `;
  container.innerHTML = markup;
}

function renderMarketMetrics(container) {
  const cards = siteData.marketMetrics;
  container.innerHTML = `
    <div class="metric-grid">
      ${cards.map((card) => `
        <article class="card metric-card">
          <div class="section-title">Market overview</div>
          <div class="metric-value">${card.value}</div>
          <div class="metric-change ${card.positive ? 'positive' : 'negative'}">${card.positive ? '▲' : '▼'} ${card.change}</div>
          <div class="metric-meta">${card.meta}</div>
        </article>
      `).join('')}
    </div>
  `;
}

function renderSignalWire(container) {
  container.innerHTML = `
    <div class="signal-wire">
      ${siteData.signalAlerts.map((signal) => `
        <article class="signal-card">
          <div class="signal-time">${signal.time}</div>
          <div class="signal-kicker">${signal.label}</div>
          <h4>${signal.title}</h4>
          <p>${signal.description}</p>
        </article>
      `).join('')}
    </div>
  `;
}

function renderStateCards(container) {
  container.innerHTML = `
    <div class="state-grid">
      ${siteData.stateMarkets.map((state) => `
        <article class="card state-card">
          <div class="signal-kicker">${state.name}</div>
          <div class="state-price">${state.price}</div>
          <div class="state-change ${state.change.startsWith('-') ? 'negative' : 'positive'}">${state.change.startsWith('-') ? '▼' : '▲'} ${state.change}</div>
          <div class="state-status">${state.status}</div>
        </article>
      `).join('')}
    </div>
  `;
}

function renderArticleCards(container, filter = 'All') {
  const articles = filter === 'All' ? siteData.articles : siteData.articles.filter((article) => article.category === filter || article.category.toLowerCase() === filter.toLowerCase());
  container.innerHTML = `
    <div class="article-grid">
      ${articles.map((article) => `
        <article class="card article-card reveal">
          <a href="/pages/article.html" style="display:block; color:inherit; text-decoration:none;">
            <div class="article-image"></div>
          <div class="article-tags">
            <span class="article-tag">${article.category}</span>
          </div>
          <h4>${article.title}</h4>
          <p>${article.summary}</p>
          <div class="article-meta">
            <span>${article.author}</span>
            <span>${article.date}</span>
            <span>${article.readTime}</span>
          </div>
          </a>
        </article>
      `).join('')}
    </div>
  `;
}

function renderFeatureCards(container) {
  container.innerHTML = `
    <div class="feature-grid">
      ${siteData.featureCards.map((card) => `
        <article class="card feature-card">
          <div>
            <div class="feature-kicker">${card.label}</div>
            <h3>${card.title}</h3>
            <p>${card.description}</p>
          </div>
          <a class="btn btn-primary" href="${card.href}">${card.cta}</a>
        </article>
      `).join('')}
    </div>
  `;
}

function renderNewsletter(container) {
  container.innerHTML = `
    <section class="newsletter">
      <div class="newsletter-content">
        <h3>The Shrimp Brief</h3>
        <p>Subscribe for concise shrimp intelligence, domestic consumption updates, market shifts, and the most important stories from the Indian shrimp ecosystem.</p>
      </div>
      <div>
        <form class="newsletter-form" novalidate>
          <input type="email" name="email" placeholder="Enter your email" aria-label="Email address" />
          <button class="btn btn-primary" type="submit">Subscribe free</button>
        </form>
        <div class="form-message" aria-live="polite"></div>
      </div>
    </section>
  `;
}

function renderFooter(container) {
  container.innerHTML = `
    <footer class="site-footer">
      <div class="container footer-inner">
        <div>
          <strong>Shrimp.News</strong>
          <p>India-first shrimp intelligence, education, and market reporting.</p>
        </div>
        <div class="footer-links">
          <a href="/pages/about.html">About</a>
          <a href="/pages/feed.html">Feed</a>
          <a href="/pages/markets.html">Markets</a>
          <a href="/pages/ask-aquaprana.html">Ask Prana</a>
        </div>
        <div>v1.0.0 · Built for the Shrimp.News launch</div>
      </div>
    </footer>
  `;
}
