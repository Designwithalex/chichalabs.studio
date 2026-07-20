/* ============================================================
   ChichaLabs Studio — Case Study Page Renderer
   Lee ?p=slug de la URL y renderiza el caso de estudio
   ============================================================ */

(function () {
  'use strict';

  const params = new URLSearchParams(window.location.search);
  const slug   = params.get('p');
  const main   = document.getElementById('cs-main');
  const nav    = document.getElementById('cs-nav');

  /* --- No slug o no encontrado --- */
  if (!slug || !getCaseBySlug(slug)) {
    renderError();
    return;
  }

  const cs = getCaseBySlug(slug);
  applyTheme(cs);
  renderPage(cs);
  initNav();
  initImageLazyLoad();
  initLightbox();

  /* ============================================================
     THEME
  ============================================================ */
  function applyTheme(cs) {
    document.documentElement.style.setProperty('--cs-accent',      cs.accent);
    document.documentElement.style.setProperty('--cs-accent-dark', cs.accentDark);
    document.documentElement.style.setProperty('--cs-bg-dark',     cs.bgDark);
    document.body.setAttribute('data-theme', cs.theme);
    document.getElementById('page-title').textContent =
      `${cs.client} — ${cs.title} | ChichaLabs Studio`;
    document.getElementById('page-desc').content =
      cs.snippet;
  }

  /* ============================================================
     RENDER
  ============================================================ */
  function renderPage(cs) {

    const all = CASE_STUDIES;
    const idx  = all.findIndex(c => c.slug === cs.slug);
    const prev = idx > 0             ? all[idx - 1] : null;
    const next = idx < all.length-1  ? all[idx + 1] : null;

    main.innerHTML = `

      ${renderHero(cs)}
      ${renderOverview(cs)}
      ${renderProblem(cs)}
      ${renderSolution(cs)}
      ${renderProcess(cs)}
      ${cs.images.gallery.length ? renderGallery(cs) : ''}
      ${renderResults(cs)}
      ${renderConclusion(cs)}
      ${renderCTA()}
      ${renderCaseNav(prev, next)}

    `;
  }

  /* --- HERO --- */
  function renderHero(cs) {
    const tagsHtml = cs.tags.map(t => `<span class="cs-hero__tag">${t}</span>`).join('');
    const urlHtml  = cs.url
      ? `<a href="${cs.url}" class="cs-hero__url" target="_blank" rel="noopener noreferrer">${cs.urlLabel} →</a>`
      : '';

    return `
    <section class="cs-hero" aria-label="Hero">
      <div class="cs-hero__pattern" aria-hidden="true"></div>
      <img
        class="cs-hero__img"
        data-src="${cs.images.hero}"
        alt="${cs.client} — ${cs.title}"
        loading="lazy"
      >
      <div class="cs-hero__overlay" aria-hidden="true"></div>
      <div class="container cs-hero__content">
        <p class="cs-hero__eyebrow">${cs.industry} · ${cs.category}</p>
        <h1 class="cs-hero__client">${cs.client}</h1>
        <p class="cs-hero__title">${cs.subtitle}</p>
        <div class="cs-hero__meta">
          <div class="cs-hero__tags">${tagsHtml}</div>
          ${urlHtml}
        </div>
      </div>
    </section>`;
  }

  /* --- OVERVIEW --- */
  function renderOverview(cs) {
    const resps = cs.responsibilities.map(r => `<li>${r}</li>`).join('');
    const tools = cs.tools.map(t =>
      `<span class="cs-meta-item__tool">${t}</span>`
    ).join('');

    return `
    <section class="cs-section" aria-labelledby="cs-overview-title">
      <div class="container">
        <p class="cs-section__label">Overview</p>
        <div class="cs-overview">
          <div>
            <p class="cs-overview__text">${cs.overview}</p>
          </div>
          <aside class="cs-overview__meta" aria-label="Metadatos del proyecto">
            <div class="cs-meta-item">
              <span class="cs-meta-item__label">Rol</span>
              <span class="cs-meta-item__value">${cs.role}</span>
            </div>
            <div class="cs-meta-item">
              <span class="cs-meta-item__label">Responsabilidades</span>
              <ul style="margin-top:0.5rem;display:flex;flex-direction:column;gap:0.4rem;">
                ${resps.replace(/<li>/g, '<li style="font-size:0.85rem;color:rgba(245,246,247,0.6);padding-left:1rem;position:relative;line-height:1.5;"><span style="position:absolute;left:0;color:var(--cs-accent);">·</span>')}
              </ul>
            </div>
            <div class="cs-meta-item">
              <span class="cs-meta-item__label">Herramientas</span>
              <div class="cs-meta-item__tools">${tools}</div>
            </div>
            ${cs.url ? `
            <div class="cs-meta-item">
              <span class="cs-meta-item__label">Sitio en vivo</span>
              <a href="${cs.url}" class="cs-meta-item__value" target="_blank" rel="noopener noreferrer"
                 style="color:var(--cs-accent);text-decoration:underline;text-underline-offset:3px;">
                ${cs.urlLabel} →
              </a>
            </div>` : ''}
          </aside>
        </div>
      </div>
    </section>`;
  }

  /* --- PROBLEM --- */
  function renderProblem(cs) {
    return `
    <section class="cs-section cs-section--tinted" aria-labelledby="cs-problem-title">
      <div class="container">
        <p class="cs-section__label">Problema y restricciones</p>
        <div class="cs-problem">
          <div>
            <h2 class="cs-problem__title" id="cs-problem-title">El problema</h2>
            <p class="cs-problem__text">${cs.problem}</p>
          </div>
          <div>
            <h2 class="cs-problem__title">Restricciones</h2>
            <p class="cs-problem__text">${cs.constraints}</p>
          </div>
        </div>
      </div>
    </section>`;
  }

  /* --- SOLUTION --- */
  function renderSolution(cs) {
    const items = cs.solutionItems.map(item => `
      <div class="cs-solution-item">
        <h3 class="cs-solution-item__title">${item.title}</h3>
        <p class="cs-solution-item__desc">${item.desc}</p>
      </div>
    `).join('');

    return `
    <section class="cs-section" aria-labelledby="cs-solution-title">
      <div class="container">
        <p class="cs-section__label">Solución</p>
        <div class="cs-solution">
          <p class="cs-solution__intro">${cs.solutionIntro}</p>
          ${items}
        </div>
      </div>
    </section>`;
  }

  /* --- PROCESS --- */
  function renderProcess(cs) {
    const steps = cs.process.map(step => `
      <div class="cs-process-step">
        <span class="cs-process-step__num" aria-hidden="true">${step.num}</span>
        <div class="cs-process-step__content">
          <h3>${step.title}</h3>
          <p>${step.desc}</p>
        </div>
      </div>
    `).join('');

    return `
    <section class="cs-section cs-section--tinted" aria-labelledby="cs-process-title">
      <div class="container">
        <p class="cs-section__label">Proceso</p>
        <h2 style="font-family:var(--font-display);font-size:clamp(2rem,4vw,3.5rem);text-transform:uppercase;margin-bottom:3rem;" id="cs-process-title">
          Cómo lo resolvimos
        </h2>
        <div class="cs-process">${steps}</div>
      </div>
    </section>`;
  }

  /* --- GALLERY --- */
  function renderGallery(cs) {
    const imgs = cs.images.gallery.map((src, i) => `
      <div class="cs-gallery__item" role="button" tabindex="0" aria-label="Ver imagen ${i + 1} en pantalla completa">
        <div class="cs-gallery__placeholder" data-label="Imagen ${i + 1}">
          <img
            data-src="${src}"
            alt="${cs.client} — imagen ${i + 1}"
            loading="lazy"
            style="width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity 0.4s;"
          >
        </div>
      </div>
    `).join('');

    return `
    <section class="cs-section" aria-label="Galería del proyecto">
      <div class="container">
        <p class="cs-section__label">Visuales del proyecto</p>
        <div class="cs-gallery">${imgs}</div>
      </div>
    </section>`;
  }

  /* --- RESULTS --- */
  function renderResults(cs) {
    const items = cs.results.map(r => `
      <div class="cs-result-item">
        <span class="cs-result-item__icon" aria-hidden="true">→</span>
        <p class="cs-result-item__text">${r}</p>
      </div>
    `).join('');

    return `
    <section class="cs-section" aria-labelledby="cs-results-title">
      <div class="container">
        <p class="cs-section__label">Resultados</p>
        <h2 style="font-family:var(--font-display);font-size:clamp(2rem,4vw,3.5rem);text-transform:uppercase;margin-bottom:3rem;" id="cs-results-title">
          Qué logramos
        </h2>
        <div class="cs-results">${items}</div>
      </div>
    </section>`;
  }

  /* --- CONCLUSION --- */
  function renderConclusion(cs) {
    return `
    <section class="cs-section cs-section--tinted" aria-label="Conclusión">
      <div class="container">
        <p class="cs-section__label">Aprendizajes</p>
        <div class="cs-conclusion">
          <p class="cs-conclusion__text">"${cs.conclusion}"</p>
        </div>
      </div>
    </section>`;
  }

  /* --- CTA --- */
  function renderCTA() {
    return `
    <section class="cs-cta" aria-label="Llamada a la acción">
      <div class="container cs-cta__inner">
        <h2 class="cs-cta__title">¿Tenés un proyecto similar?</h2>
        <p class="cs-cta__sub">Contanos qué necesitás. Arrancamos con un diagnóstico para entender el problema antes de proponer cualquier solución.</p>
        <div class="cs-cta__actions">
          <a href="https://wa.me/5491178221468?text=Hola%2C%20vi%20los%20casos%20de%20estudio%20y%20me%20interesa%20hablar%20de%20mi%20proyecto."
             class="btn btn--ghost" target="_blank" rel="noopener noreferrer">
            Escribir por WhatsApp
          </a>
          <a href="index.html#casos" class="btn btn--text">← Ver todos los casos</a>
        </div>
      </div>
    </section>`;
  }

  /* --- CASE NAV --- */
  function renderCaseNav(prev, next) {
    const prevHtml = prev
      ? `<a href="case-study.html?p=${prev.slug}" class="cs-case-nav__item">
           <span class="cs-case-nav__dir">← Anterior</span>
           <span class="cs-case-nav__name">${prev.client}</span>
         </a>`
      : `<div class="cs-case-nav__item" style="opacity:0.3;pointer-events:none;">
           <span class="cs-case-nav__dir">← Anterior</span>
           <span class="cs-case-nav__name">—</span>
         </div>`;

    const nextHtml = next
      ? `<a href="case-study.html?p=${next.slug}" class="cs-case-nav__item cs-case-nav__item--next">
           <span class="cs-case-nav__dir">Siguiente →</span>
           <span class="cs-case-nav__name">${next.client}</span>
         </a>`
      : `<div class="cs-case-nav__item cs-case-nav__item--next" style="opacity:0.3;pointer-events:none;">
           <span class="cs-case-nav__dir">Siguiente →</span>
           <span class="cs-case-nav__name">—</span>
         </div>`;

    return `<nav class="cs-case-nav" aria-label="Navegación entre casos">${prevHtml}${nextHtml}</nav>`;
  }

  /* --- ERROR --- */
  function renderError() {
    main.innerHTML = `
    <div class="cs-error">
      <span class="cs-error__code">404</span>
      <h1 class="cs-error__title">Caso no encontrado</h1>
      <p style="color:rgba(245,246,247,0.5);max-width:38ch;line-height:1.65;">
        El proyecto que buscás no existe o fue removido.
      </p>
      <a href="index.html#casos" class="btn btn--ghost" style="margin-top:1rem;">
        Ver todos los casos
      </a>
    </div>`;
    document.getElementById('cs-loading') && document.getElementById('cs-loading').remove();
  }

  /* ============================================================
     NAV SCROLL EFFECT
  ============================================================ */
  function initNav() {
    const observer = new IntersectionObserver(
      ([entry]) => {
        nav.classList.toggle('cs-nav--scrolled', !entry.isIntersecting);
      },
      { threshold: 0 }
    );
    const hero = document.querySelector('.cs-hero');
    if (hero) observer.observe(hero);
  }

  /* ============================================================
     LAZY LOAD DE IMÁGENES
  ============================================================ */
  function initImageLazyLoad() {
    const imgs = document.querySelectorAll('[data-src]');
    if (!imgs.length) return;

    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          const src = el.getAttribute('data-src');
          el.src = src;
          el.onload = () => {
            el.style.opacity = '1';
            el.classList.add('is-loaded');
            const placeholder = el.closest('.cs-gallery__placeholder');
            if (placeholder) placeholder.style.background = 'transparent';
          };
          el.onerror = () => {
            /* imagen no encontrada — mantener placeholder */
          };
          io.unobserve(el);
        });
      }, { rootMargin: '200px' });

      imgs.forEach(img => io.observe(img));
    } else {
      /* Fallback: cargar todas inmediatamente */
      imgs.forEach(img => {
        img.src = img.getAttribute('data-src');
        img.style.opacity = '1';
      });
    }
  }

  /* ============================================================
     LIGHTBOX — abrir imagen de galería en pantalla completa
  ============================================================ */
  function initLightbox() {
    const lightbox = document.getElementById('cs-lightbox');
    const lightboxImg = document.getElementById('cs-lightbox-img');
    const closeBtn = document.getElementById('cs-lightbox-close');
    if (!lightbox || !lightboxImg || !closeBtn) return;

    let lastFocused = null;

    function openLightbox(img) {
      const fullSrc = img.getAttribute('data-src') || img.src;
      lightboxImg.src = fullSrc;
      lightboxImg.alt = img.alt;
      lastFocused = document.activeElement;
      lightbox.classList.add('is-open');
      closeBtn.focus();
    }

    function closeLightbox() {
      lightbox.classList.remove('is-open');
      lightboxImg.src = '';
      if (lastFocused) lastFocused.focus();
    }

    main.addEventListener('click', (e) => {
      const item = e.target.closest('.cs-gallery__item');
      if (!item) return;
      const img = item.querySelector('img');
      if (img) openLightbox(img);
    });

    main.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const item = e.target.closest('.cs-gallery__item');
      if (!item) return;
      e.preventDefault();
      const img = item.querySelector('img');
      if (img) openLightbox(img);
    });

    closeBtn.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && lightbox.classList.contains('is-open')) closeLightbox();
    });
  }

})();
