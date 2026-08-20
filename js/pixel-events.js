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

  /* Arriba de todo a propósito: los scripts van con `defer`, así que cuando
     este archivo corre `readyState` ya es 'interactive' y `init()` se ejecuta
     en la línea de abajo — antes de llegar al resto del archivo. Declarada
     más abajo, `aCapi()` la leería en zona muerta y el ViewContent de cada
     landing se perdería en silencio (el try/catch se come el ReferenceError). */
  const CAPI_URL = '/api/meta-capi.php';

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

  /* ============================================================
     ENVÍO DOBLE — browser (fbq) + servidor (Conversions API)

     Los bloqueadores cortan connect.facebook.net y `fbq` queda sin definir:
     ese evento no le llega a Meta y para la campaña no existió. Por eso el
     mismo evento sale también por /api/meta-capi.php, que es first-party y
     los bloqueadores no tocan.

     Las dos copias llevan el MISMO event_id: Meta las une y cuenta una sola.
     Si no coincidieran, cada lead se contaría dos veces y el CPL que reporta
     Meta sería la mitad del real. Ver PIXEL-EVENTS.md.

     Nunca romper la página: si algo de esto falla, el sitio sigue igual.
  ============================================================ */
  function track(evento, params, userData) {
    enviar('track', evento, params, userData);
  }

  function trackCustom(evento, params, userData) {
    enviar('trackCustom', evento, params, userData);
  }

  function enviar(metodo, evento, params, userData) {
    const id = nuevoEventId();
    if (typeof window.fbq === 'function') {
      window.fbq(metodo, evento, params, { eventID: id });
    }
    aCapi(evento, params, id, userData);
  }

  function nuevoEventId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      return window.crypto.randomUUID();
    }
    return 'e' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  }

  /* fbp, fbc, IP y user-agent no se mandan desde acá: al ser same-origin el
     browser manda las cookies solo y PHP ve la IP real. Hoy ningún evento
     lleva user_data: no quedó ningún formulario en el sitio. */
  function aCapi(evento, params, id, userData) {
    try {
      const body = JSON.stringify({
        event_name: evento,
        event_id: id,
        event_source_url: location.href,
        custom_data: params || {},
        user_data: userData || {}
      });
      /* keepalive porque varios de estos eventos disparan justo antes de
         navegar a WhatsApp o al calendario: sin esto el browser cancela el
         request al descargar la página y se pierde el lead. */
      fetch(CAPI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body,
        keepalive: true,
        credentials: 'same-origin'
      }).catch(function () {});
    } catch (e) { /* nunca romper la página por tracking */ }
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
     ContactoIniciado — click a WhatsApp (señal BLANDA, de diagnóstico)
     AgendaAbierta — click a "Agendá una reunión" (igual de blanda)

     2026-08-18 — POR QUÉ ESTO YA NO ES `Lead`

     Hasta hoy un click en cualquier link de WhatsApp disparaba `Lead`, que
     es el evento de optimización de la campaña. O sea: UN SOLO TOQUE sobre
     el globo flotante — fijo abajo a la derecha, justo donde cae el pulgar —
     valía una conversión. Sin formulario, sin validar nada, sin que nadie
     del otro lado confirme que hay una persona interesada.

     Meta puja por volumen al menor costo: le pedimos "conseguime `Lead`" y
     encontró la forma más barata de fabricarlo. En la campaña C1 fueron 60
     leads en 6 días, el 97% del gasto en Audience Network, el 65% de los
     leads con 65+ años para un servicio B2B, y un CTR de 20-25% que SUBÍA
     con la edad. Eso no es interés: es el dedo tocando donde no quería.
     Mientras el evento se dispare con un toque, el algoritmo va a seguir
     comprando toques accidentales, porque son lo más barato que hay.

     Así que el toque a WhatsApp pasa a ser un custom de diagnóstico. Se
     sigue midiendo (sirve para el embudo y para el público de exclusión),
     pero ya NO es la señal contra la que Meta optimiza.

     2026-08-20 — Y POR QUÉ `Schedule` AHORA ES `AgendaAbierta`

     Mismo error, otro evento. `Schedule` disparaba en el CLICK al link del
     calendario, no en la reserva. La reunión se agenda en el dominio de
     Google, en otra pestaña, y el sitio nunca se entera de si se completó.
     El resultado medido: 6 `Schedule` en 7 días y cero reuniones reales en
     el calendario. Un evento que dice "agendó" cuando en realidad dice
     "hizo click" miente igual que mentía `Lead`, así que pasa a llamarse
     por lo que es.

     `Schedule` queda reservado para el día que la reserva se confirme de
     verdad. Eso pide una herramienta que redirija a una página de gracias
     propia — Google Calendar no lo permite, Cal.com sí.

     Con el cotizador dado de baja, el sitio ya no emite NINGUNA señal dura:
     `Lead`, `LeadCalificado` y los `Quote*` se fueron con él. Las dos que
     quedan, `ContactoIniciado` y `AgendaAbierta`, son de un toque. Sirven
     para armar públicos, no para optimizar. Volver a correr campañas de
     conversión exige construir antes un evento duro nuevo.
     Ver PIXEL-EVENTS.md → "Señal blanda vs. señal dura".
  ============================================================ */
  function initClicks() {
    document.addEventListener('click', (e) => {
      const target = e.target;
      if (!target || typeof target.closest !== 'function') return;
      const link = target.closest('a[href]');
      if (!link) return;

      const href = link.getAttribute('href') || '';

      if (href.indexOf('wa.me') !== -1) {
        trackCustom('ContactoIniciado', {
          content_name: pagina.nombre,
          content_category: pagina.categoria,
          content_ids: [pagina.slug],
          location: ubicacion(link),
          source_page: location.pathname
        });
      } else if (href.indexOf('calendar.app.google') !== -1) {
        trackCustom('AgendaAbierta', {
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
