/* ============================================================
   META PIXEL — eventos de conversión
   Documentación completa y para qué sirve cada uno: PIXEL-EVENTS.md

   Va en un archivo aparte de main.js a propósito: case-study.html NO
   carga main.js (carga case-study.js) y arma su CTA de WhatsApp por JS
   después del load. Por eso los clicks se escuchan delegados en document
   y no atando listeners a cada link al arrancar.
============================================================ */
(() => {
  'use strict';

  /* Landings de servicio. La clave es el nombre del archivo sin .html y se
     usa tal cual como content_ids, que es por donde se arman los públicos. */
  const SERVICIOS = {
    'automatizaciones': 'Automatizaciones e integraciones',
    'aplicaciones-web': 'Aplicaciones y sitios web',
    'dashboards':       'Dashboards y herramientas internas',
    'ia-procesos':      'IA aplicada a procesos'
  };

  const OTRAS = {
    'index':       'Home',
    'case-study':  'Caso de estudio',
    'privacidad':  'Politica de privacidad'
  };

  const pagina = detectarPagina();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    trackViewContent();
    initClicks();
    initEngagement();
  }

  /* Los bloqueadores de tracking cortan connect.facebook.net y fbq queda
     sin definir. Nunca romper la página por eso: el sitio funciona igual. */
  function track(evento, params) {
    if (typeof window.fbq !== 'function') return;
    window.fbq('track', evento, params);
  }

  function trackCustom(evento, params) {
    if (typeof window.fbq !== 'function') return;
    window.fbq('trackCustom', evento, params);
  }

  function detectarPagina() {
    const archivo = (location.pathname.split('/').pop() || 'index').replace(/\.html$/, '') || 'index';
    if (SERVICIOS[archivo]) {
      return { slug: archivo, nombre: SERVICIOS[archivo], categoria: 'servicio' };
    }
    return { slug: archivo, nombre: OTRAS[archivo] || archivo, categoria: 'sitio' };
  }

  /* ============================================================
     ViewContent — "vio la landing de un servicio"
     Es el público BASE de retargeting. Sólo en las landings: la home ya
     queda cubierta por el PageView del snippet base y mezclarlas rompería
     el corte por servicio.
  ============================================================ */
  function trackViewContent() {
    if (pagina.categoria !== 'servicio') return;
    track('ViewContent', {
      content_name: pagina.nombre,
      content_category: 'servicio',
      content_ids: [pagina.slug],
      content_type: 'product'
    });
  }

  /* ============================================================
     Lead — click a WhatsApp (LA conversión, evento de optimización)
     Schedule — click a "Agendá una reunión" (el otro camino de cierre)

     Un solo nombre de evento para todos los clicks a WhatsApp de todo el
     sitio: con el volumen de esta campaña partir el signal en varios
     eventos lo dejaría inservible. La ubicación va como parámetro.
  ============================================================ */
  function initClicks() {
    document.addEventListener('click', (e) => {
      const target = e.target;
      if (!target || typeof target.closest !== 'function') return;
      const link = target.closest('a[href]');
      if (!link) return;

      const href = link.getAttribute('href') || '';

      if (href.indexOf('wa.me') !== -1) {
        track('Lead', {
          content_name: pagina.nombre,
          content_category: pagina.categoria,
          content_ids: [pagina.slug],
          location: ubicacion(link),
          source_page: location.pathname
        });
      } else if (href.indexOf('calendar.app.google') !== -1) {
        track('Schedule', {
          content_name: pagina.nombre,
          content_category: pagina.categoria,
          content_ids: [pagina.slug],
          location: ubicacion(link),
          source_page: location.pathname
        });
      }
    });
  }

  /* La ubicación sale del data-location del link. El fallback está para que
     un CTA nuevo al que se le olvide el atributo igual reporte algo usable
     en vez de ensuciar el corte con "undefined". */
  function ubicacion(link) {
    const explicita = link.getAttribute('data-location');
    if (explicita) return explicita;
    if (link.classList.contains('wa-float')) return 'flotante';

    const cont = link.closest('footer, .nav-mobile, section, nav');
    if (!cont) return 'sin_ubicacion';
    if (cont.tagName === 'FOOTER' || cont.classList.contains('footer__nav')) return 'footer';
    if (cont.classList.contains('nav-mobile')) return 'nav_mobile';
    if (cont.tagName === 'NAV') return 'nav';
    return 'seccion';
  }

  /* ============================================================
     LandingEngaged (custom) — "leyó el caso / el problema"
     Diagnóstico, NO público de retargeting: si el CPL sale mal, distingue
     "no llegan a la landing" (problema del ad) de "llegan y rebotan antes
     del caso" (problema de la landing). Dispara una sola vez.

     Apunta a la 2da sección de la landing (.section--tinted): en
     Automatizaciones y Aplicaciones es el caso real, en Dashboards e IA es
     "El problema". Mismo slot del funnel en las 4.
  ============================================================ */
  function initEngagement() {
    if (pagina.categoria !== 'servicio') return;
    if (!('IntersectionObserver' in window)) return;

    const caso = document.querySelector('section[aria-label="Caso real"], .section--tinted');
    if (!caso) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        /* Dos condiciones porque la sección puede ser más baja o más alta
           que la pantalla: media sección visible, o media pantalla llena
           con la sección. Sin esto, en mobile un bloque largo nunca llega
           al 50% de ratio y el evento no dispararía nunca. */
        const mediaSeccion = entry.intersectionRatio >= 0.5;
        const mediaPantalla = entry.intersectionRect.height >= window.innerHeight * 0.5;
        if (!entry.isIntersecting || (!mediaSeccion && !mediaPantalla)) return;

        observer.disconnect();
        trackCustom('LandingEngaged', {
          content_name: pagina.nombre,
          content_category: 'servicio',
          content_ids: [pagina.slug],
          section: 'caso'
        });
      });
    }, { threshold: [0, 0.25, 0.5, 0.75, 1] });

    observer.observe(caso);
  }
})();
