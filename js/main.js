(() => {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    initNav();
    initNavDropdown();
    initMobileNav();
    initHeroCanvas();
    if (!prefersReducedMotion && window.gsap && window.ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);
      initReveal();
    }
    initIconAnimations();
    initFlowDot();
    initMarquee();
    initCountUp();
    initSpotlight();
    initScrollProgress();
  }

  /* ============================================================
     NAV
  ============================================================ */
  function initNav() {
    const nav = document.getElementById('nav');
    if (!nav) return;
    window.addEventListener('scroll', () => {
      nav.classList.toggle('nav--scrolled', window.scrollY > 24);
    }, { passive: true });
  }

  /* ============================================================
     NAV DROPDOWN — menú de servicios (desktop)
     Abre por hover y por click/teclado. El hover pasa por el mismo
     open()/close() que el click para que aria-expanded no se desincronice.
  ============================================================ */
  function initNavDropdown() {
    document.querySelectorAll('[data-nav-dropdown]').forEach((root) => {
      const toggle = root.querySelector('.nav__dropdown-toggle');
      const menu   = root.querySelector('.nav__menu');
      if (!toggle || !menu) return;

      let closeTimer = null;
      let pointerInside = false;

      function open() {
        clearTimeout(closeTimer);
        root.classList.add('is-open');
        toggle.setAttribute('aria-expanded', 'true');
      }

      function close() {
        clearTimeout(closeTimer);
        root.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }

      /* Cierre diferido: da margen para llegar del botón al panel sin que
         parpadee si el puntero cruza un borde por un instante. */
      function closeSoon() {
        clearTimeout(closeTimer);
        closeTimer = setTimeout(close, 140);
      }

      /* Con el puntero encima el menú ya está abierto por hover, así que un
         click ahí sólo lo cerraría bajo el mouse: se ignora y el panel queda
         abierto. Sin puntero (teclado) el click sigue siendo un toggle. */
      toggle.addEventListener('click', () => {
        if (!root.classList.contains('is-open')) open();
        else if (!pointerInside) close();
      });

      root.addEventListener('mouseenter', () => { pointerInside = true; open(); });
      root.addEventListener('mouseleave', () => { pointerInside = false; closeSoon(); });

      /* No se abre con el solo hecho de recibir foco: al tabular por el nav
         obligaría a atravesar los 6 links del menú para llegar a "Trabajos".
         Se abre con Enter/Espacio (click) y se cierra al salir con Tab.

         Va por relatedTarget y no por document.activeElement: durante el
         focusout el foco está en tránsito y activeElement es <body>, así que
         mirarlo cerraba el menú en el mousedown sobre un item — quedaba en
         pointer-events:none antes del mouseup y el link nunca recibía el
         click (había que clickear dos veces para navegar). */
      root.addEventListener('focusout', (e) => {
        if (!root.contains(e.relatedTarget)) close();
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && root.classList.contains('is-open')) {
          close();
          toggle.focus();
        }
      });

      document.addEventListener('click', (e) => {
        if (!root.contains(e.target)) close();
      });
    });
  }

  /* ============================================================
     NAV MOBILE — panel hamburguesa, accesible por teclado
  ============================================================ */
  function initMobileNav() {
    const toggle = document.getElementById('nav-toggle');
    const panel  = document.getElementById('nav-mobile');
    if (!toggle || !panel) return;

    const FOCUSABLE = 'a[href], button:not([disabled])';
    let lastFocused = null;

    function open() {
      lastFocused = document.activeElement;
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', 'Cerrar menú');
      panel.removeAttribute('inert');
      panel.setAttribute('aria-hidden', 'false');
      panel.classList.add('is-open');
      document.body.classList.add('nav-open');
      const first = panel.querySelector(FOCUSABLE);
      if (first) first.focus();
      document.addEventListener('keydown', onKeydown);
    }

    function close(opts) {
      const restoreFocus = !opts || opts.restoreFocus !== false;
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Abrir menú');
      panel.classList.remove('is-open');
      panel.setAttribute('aria-hidden', 'true');
      panel.setAttribute('inert', '');
      document.body.classList.remove('nav-open');
      document.removeEventListener('keydown', onKeydown);
      if (restoreFocus && lastFocused) lastFocused.focus();
    }

    function onKeydown(e) {
      if (e.key === 'Escape') { close(); return; }
      if (e.key !== 'Tab') return;
      const focusables = Array.from(panel.querySelectorAll(FOCUSABLE));
      if (!focusables.length) return;
      const first = focusables[0];
      const last  = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }

    toggle.addEventListener('click', () => {
      const isOpen = toggle.getAttribute('aria-expanded') === 'true';
      isOpen ? close() : open();
    });

    panel.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => close({ restoreFocus: false }));
    });

    const mq = window.matchMedia('(min-width: 900px)');
    (mq.addEventListener ? mq.addEventListener.bind(mq) : mq.addListener.bind(mq))('change', e => {
      if (e.matches) close({ restoreFocus: false });
    });
  }

  /* ============================================================
     HERO CANVAS — red de nodos
  ============================================================ */
  function initHeroCanvas() {
    const canvas = document.querySelector('.hero__canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const NODE_COUNT = 18;
    const MAX_DIST   = 140;
    const SPEED      = 0.22;
    let nodes = [];
    let raf;

    function resize() {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }

    function makeNodes() {
      nodes = Array.from({ length: NODE_COUNT }, () => ({
        x:  Math.random() * canvas.width,
        y:  Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * SPEED,
        vy: (Math.random() - 0.5) * SPEED,
      }));
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      nodes.forEach(n => {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > canvas.width)  n.vx *= -1;
        if (n.y < 0 || n.y > canvas.height)  n.vy *= -1;
      });
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const d  = Math.sqrt(dx*dx + dy*dy);
          if (d < MAX_DIST) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(120,140,130,${(1 - d / MAX_DIST) * 0.16})`;
            ctx.lineWidth = 1;
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }
      nodes.forEach(n => {
        ctx.beginPath();
        ctx.fillStyle = 'rgba(44,229,139,0.85)';
        ctx.shadowColor = 'rgba(44,229,139,0.6)';
        ctx.shadowBlur = 6;
        ctx.arc(n.x, n.y, 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });
      if (!prefersReducedMotion) raf = requestAnimationFrame(draw);
    }

    resize(); makeNodes(); draw();
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(raf);
      resize(); makeNodes(); draw();
    });
    ro.observe(canvas);
  }

  /* ============================================================
     SCROLL REVEALS — GSAP + ScrollTrigger
  ============================================================ */
  function initReveal() {
    /* Elementos individuales */
    const selectors = [
      '.section-label',
      '.split-header__title',
      '.split-header__sub',
      '.process-title',
      '.diag-layout__title',
      '.diag-layout__content > p',
      '.diag-layout__content .checklist',
      '.diag-offer__label',
      '.diag-offer__price',
      '.diag-layout__offer .btn',
      '.about-layout__main > *',
      '.cta-final__title',
      '.cta-final__sub',
      '.cta-final__actions',
      '.intro-strip__inner p',
      '.marquee-section__label',
    ].join(', ');

    document.querySelectorAll(selectors).forEach(el => {
      el.classList.add('js-reveal');
      gsap.fromTo(el,
        { opacity: 0, y: 24 },
        {
          opacity: 1, y: 0,
          duration: 0.75,
          ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none' },
        }
      );
    });

    /* Service rows — stagger */
    const serviceRows = document.querySelectorAll('.service-row');
    if (serviceRows.length) {
      serviceRows.forEach(el => el.classList.add('js-reveal'));
      gsap.fromTo(serviceRows,
        { opacity: 0, y: 24 },
        {
          opacity: 1, y: 0, duration: 0.65, ease: 'power2.out', stagger: 0.08,
          scrollTrigger: { trigger: '.services-list', start: 'top 80%', toggleActions: 'play none none none' },
        }
      );
    }

    /* Process steps — stagger */
    const steps = document.querySelectorAll('.process-step');
    if (steps.length) {
      steps.forEach(el => el.classList.add('js-reveal'));
      gsap.fromTo(steps,
        { opacity: 0, y: 24 },
        {
          opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', stagger: 0.1,
          scrollTrigger: { trigger: '.process-steps', start: 'top 80%', toggleActions: 'play none none none' },
        }
      );
    }

    /* Portfolio items — fade in on scroll */
    document.querySelectorAll('.portfolio-item').forEach(item => {
      const content = item.querySelector('.portfolio-item__content');
      const visual  = item.querySelector('.portfolio-item__visual');
      if (content) {
        content.classList.add('js-reveal');
        gsap.fromTo(content,
          { opacity: 0, y: 30 },
          {
            opacity: 1, y: 0, duration: 0.8, ease: 'power2.out',
            scrollTrigger: { trigger: item, start: 'top 78%', toggleActions: 'play none none none' },
          }
        );
      }
      if (visual) {
        visual.classList.add('js-reveal');
        gsap.fromTo(visual,
          { opacity: 0, y: 20 },
          {
            opacity: 1, y: 0, duration: 0.9, ease: 'power2.out', delay: 0.1,
            scrollTrigger: { trigger: item, start: 'top 78%', toggleActions: 'play none none none' },
          }
        );
      }
    });

    /* Case cards — stagger */
    const caseCards = document.querySelectorAll('.case-card');
    if (caseCards.length) {
      caseCards.forEach(el => el.classList.add('js-reveal'));
      gsap.fromTo(caseCards,
        { opacity: 0, y: 28 },
        {
          opacity: 1, y: 0, duration: 0.65, ease: 'power2.out', stagger: 0.1,
          scrollTrigger: { trigger: '.cases-grid', start: 'top 80%', toggleActions: 'play none none none' },
        }
      );
    }

    /* Cases list items — stagger */
    const caseListItems = document.querySelectorAll('.cases-list__item');
    if (caseListItems.length) {
      caseListItems.forEach(el => el.classList.add('js-reveal'));
      gsap.fromTo(caseListItems,
        { opacity: 0, y: 16 },
        {
          opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', stagger: 0.06,
          scrollTrigger: { trigger: '.cases-list', start: 'top 82%', toggleActions: 'play none none none' },
        }
      );
    }

    /* Metrics — stagger */
    const metrics = document.querySelectorAll('.metric');
    if (metrics.length) {
      metrics.forEach(el => el.classList.add('js-reveal'));
      gsap.fromTo(metrics,
        { opacity: 0, y: 24 },
        {
          opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', stagger: 0.1,
          scrollTrigger: { trigger: '.metrics', start: 'top 82%', toggleActions: 'play none none none' },
        }
      );
    }

    /* Pillars — stagger */
    const pillars = document.querySelectorAll('.pillar');
    if (pillars.length) {
      pillars.forEach(el => el.classList.add('js-reveal'));
      gsap.fromTo(pillars,
        { opacity: 0, y: 16 },
        {
          opacity: 1, y: 0, duration: 0.55, ease: 'power2.out', stagger: 0.1,
          scrollTrigger: { trigger: '.about-layout__pillars', start: 'top 82%', toggleActions: 'play none none none' },
        }
      );
    }

    /* Hero — cascade inmediata */
    const heroKids = document.querySelectorAll('.hero__content > *');
    if (heroKids.length) {
      heroKids.forEach(el => el.classList.add('js-reveal'));
      gsap.fromTo(heroKids,
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.85, ease: 'power2.out', stagger: 0.12, delay: 0.25 }
      );
    }
  }

  /* ============================================================
     ICON ANIMATIONS — toggle .is-animated via IntersectionObserver
  ============================================================ */
  function initIconAnimations() {
    if (!window.IntersectionObserver) return;

    function onVisible(el, cb, threshold = 0.35) {
      const obs = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting) { cb(); obs.disconnect(); }
      }, { threshold });
      obs.observe(el);
    }

    /* Los iconos ahora están dentro de .service-row */
    const diagIcon = document.querySelector('.icon--diagnostico');
    if (diagIcon) onVisible(diagIcon.closest('.service-row') || diagIcon, () => diagIcon.classList.add('is-animated'));

    const websIcon = document.querySelector('.icon--webs');
    if (websIcon) onVisible(websIcon.closest('.service-row') || websIcon, () => websIcon.classList.add('is-animated'));

    const dashIcon = document.querySelector('.icon--dashboards');
    if (dashIcon) onVisible(dashIcon.closest('.service-row') || dashIcon, () => dashIcon.classList.add('is-animated'));

    const iaIcon = document.querySelector('.icon--ia');
    if (iaIcon) onVisible(iaIcon.closest('.service-row') || iaIcon, () => iaIcon.classList.add('is-animated'));
  }

  /* ============================================================
     FLOW DOT — punto animado en el mockup de automatización
  ============================================================ */
  function initFlowDot() {
    if (prefersReducedMotion) return;
    const dot = document.querySelector('.flow-dot');
    if (!dot || !window.IntersectionObserver) return;

    /* Simula el recorrido de los segmentos de la línea del flow */
    const waypoints = [
      { x: 90,  y: 130 },
      { x: 175, y: 85  },
      { x: 260, y: 130 },
      { x: 345, y: 85  },
      { x: 260, y: 130 },
      { x: 345, y: 175 },
      { x: 260, y: 130 },
      { x: 90,  y: 130 },
    ];

    let segment = 0;
    let t = 0;
    let running = false;

    function animDot() {
      if (!running) return;
      t += 0.012;
      if (t >= 1) { t = 0; segment = (segment + 1) % (waypoints.length - 1); }
      const a = waypoints[segment];
      const b = waypoints[segment + 1];
      dot.setAttribute('cx', a.x + (b.x - a.x) * t);
      dot.setAttribute('cy', a.y + (b.y - a.y) * t);
      requestAnimationFrame(animDot);
    }

    const mockup = dot.closest('.mockup');
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !running) {
        running = true;
        animDot();
      }
    }, { threshold: 0.3 });
    if (mockup) obs.observe(mockup);
  }

  /* ============================================================
     MARQUEE — pausa en hover
  ============================================================ */
  function initMarquee() {
    if (prefersReducedMotion) return;
    const track = document.querySelector('.marquee__track');
    if (!track) return;
    const marquee = track.parentElement;
    marquee.addEventListener('mouseenter', () => { track.style.animationPlayState = 'paused'; });
    marquee.addEventListener('mouseleave', () => { track.style.animationPlayState = 'running'; });
  }

  /* ============================================================
     COUNT-UP — números/KPIs animan al entrar en viewport
  ============================================================ */
  function initCountUp() {
    const nums = document.querySelectorAll('.metric__num');
    if (!nums.length || !window.IntersectionObserver) return;

    nums.forEach(el => {
      // Parseo "+20", "×3", "7" → prefijo + entero + sufijo
      const raw = el.textContent.trim();
      const m = raw.match(/^(\D*)(\d+)(\D*)$/);
      if (!m) return;
      const [, prefix, digits, suffix] = m;
      const target = parseInt(digits, 10);
      el.dataset.done = 'false';

      if (prefersReducedMotion) return; // deja el valor final tal cual

      // Estado inicial visible: prefijo + 0
      const obs = new IntersectionObserver(entries => {
        if (!entries[0].isIntersecting || el.dataset.done === 'true') return;
        el.dataset.done = 'true';
        obs.disconnect();
        const duration = 1100;
        const start = performance.now();
        function tick(now) {
          const p = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
          el.textContent = prefix + Math.round(target * eased) + suffix;
          if (p < 1) requestAnimationFrame(tick);
          else el.textContent = raw;
        }
        el.textContent = prefix + '0' + suffix;
        requestAnimationFrame(tick);
      }, { threshold: 0.5 });
      obs.observe(el);
    });
  }

  /* ============================================================
     SPOTLIGHT — gradiente que sigue el cursor en tarjetas premium
  ============================================================ */
  function initSpotlight() {
    if (prefersReducedMotion || !window.matchMedia('(hover: hover)').matches) return;
    const cards = document.querySelectorAll('.case-card, .diag-layout__offer');
    cards.forEach(card => {
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--x', ((e.clientX - r.left) / r.width * 100) + '%');
        card.style.setProperty('--y', ((e.clientY - r.top) / r.height * 100) + '%');
      });
    });
  }

  /* ============================================================
     SCROLL PROGRESS — barra fina superior
  ============================================================ */
  function initScrollProgress() {
    const bar = document.createElement('div');
    bar.className = 'scroll-progress';
    document.body.appendChild(bar);
    function update() {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      const pct = max > 0 ? (h.scrollTop / max) * 100 : 0;
      bar.style.width = pct + '%';
    }
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    update();
  }

})();
