/* ============================================================================
   ChichaLabs Studio — COTIZADOR EN VIVO  (js/cotizador.js)

   IMPORTANTE — por qué este archivo no calcula nada:
   La tabla de horas por módulo vive SÓLO en Notion y sólo la lee n8n. Si la
   fórmula (horas × valor hora) estuviera acá, cualquiera la vería en el
   código fuente. Este archivo únicamente:
     1. pide los módulos de un servicio      → GET  {API}/modulos?servicio=ID
     2. manda la selección y recibe el precio → POST {API}/precio
     3. manda el contacto y dispara el PDF    → POST {API}/propuesta
   Ninguna respuesta del paso 1 incluye horas ni precios unitarios.

   DOS FORMAS DE USARLO — el mismo widget, un solo template:
     · Inline  → un <div class="quoter"> vacío en la página (la home).
     · Modal   → cualquier <button data-cotizador="ID-DE-SERVICIO">.
                 Se abre ya filtrado por ese servicio, sin sacar al
                 visitante de la landing donde está.

   El markup lo genera este archivo a propósito: si viviera en el HTML
   habría que mantener cinco copias iguales (home + 4 landings).
   ============================================================================ */
(() => {
  'use strict';

  /* ── Configuración ────────────────────────────────────────────────
     Un solo lugar para las 5 páginas. Si cambia la instancia de n8n o
     la página de reservas, se toca acá y listo. */
  const API      = 'https://yellow-muskrat.pikapod.net/webhook/cotizador';
  const CALENDAR = 'https://calendar.app.google/YrXbTqH8iREgLShf6';
  const WHATSAPP = 'https://wa.me/5491178221468?text=Hola%2C%20quiero%20cotizar%20un%20proyecto%20de%20software%20para%20mi%20negocio.%20%C2%BFMe%20ayud%C3%A1s%20a%20ver%20qu%C3%A9%20conviene%20construir%3F';

  const TIMEOUT  = 12000;   // ms — n8n arranca frío a veces
  const DEBOUNCE = 300;     // ms entre cambio y recálculo

  /* El id tiene que coincidir con el mapa SERVICIOS de los Code nodes de
     n8n. Ver README-COTIZADOR.md → "Cómo agregar un servicio nuevo". */
  const SERVICIOS = [
    { id: 'web-comercial', nombre: 'Web comercial',
      desc: 'Una página pensada para vender',
      icono: '<rect x="6" y="10" width="52" height="40" rx="3" stroke="currentColor" stroke-width="2"/><line x1="6" y1="20" x2="58" y2="20" stroke="currentColor" stroke-width="2"/><circle cx="14" cy="15" r="2" fill="currentColor"/><circle cx="22" cy="15" r="2" fill="currentColor"/><line x1="14" y1="31" x2="50" y2="31" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="14" y1="39" x2="34" y2="39" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' },
    { id: 'automatizaciones', nombre: 'Automatizaciones',
      desc: 'Que la información llegue sola a donde tiene que ir',
      icono: '<circle cx="12" cy="32" r="6" stroke="currentColor" stroke-width="2"/><circle cx="52" cy="32" r="6" stroke="currentColor" stroke-width="2"/><path d="M18 32 C 28 14, 36 14, 46 32" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/>' },
    { id: 'dashboards', nombre: 'Dashboards y herramientas internas',
      desc: 'Un panel para ver y manejar tu negocio',
      icono: '<rect x="6" y="6" width="52" height="52" rx="3" stroke="currentColor" stroke-width="2"/><rect x="16" y="34" width="8" height="18" stroke="currentColor" stroke-width="2"/><rect x="28" y="24" width="8" height="28" stroke="currentColor" stroke-width="2"/><rect x="40" y="16" width="8" height="36" stroke="currentColor" stroke-width="2"/>' },
    { id: 'ia-aplicada', nombre: 'IA aplicada',
      desc: 'Que la IA haga una parte del trabajo',
      icono: '<circle cx="32" cy="32" r="8" stroke="currentColor" stroke-width="2"/><line x1="32" y1="24" x2="32" y2="12" stroke="currentColor" stroke-width="1.5"/><line x1="39" y1="27" x2="52" y2="22" stroke="currentColor" stroke-width="1.5"/><line x1="39" y1="37" x2="52" y2="42" stroke="currentColor" stroke-width="1.5"/><line x1="25" y1="37" x2="12" y2="42" stroke="currentColor" stroke-width="1.5"/><circle cx="32" cy="8" r="4" stroke="currentColor" stroke-width="1.5"/><circle cx="56" cy="19" r="4" stroke="currentColor" stroke-width="1.5"/><circle cx="56" cy="45" r="4" stroke="currentColor" stroke-width="1.5"/><circle cx="8" cy="45" r="4" stroke="currentColor" stroke-width="1.5"/>' }
  ];

  const buscarServicio = (id) => SERVICIOS.filter((s) => s.id === id)[0] || null;

  /* ══════════════════════════════════════════════════════════════════
     TEMPLATE — uno solo para inline y modal
  ══════════════════════════════════════════════════════════════════ */
  function plantilla(fijo) {
    return (fijo ? '' : pasoServicio()) + pasoAlcance(fijo) + fallback();
  }

  function pasoServicio() {
    return '' +
      '<div class="quoter__step">' +
        '<p class="quoter__step-label"><span class="quoter__step-num">01</span> ¿Qué necesitás?</p>' +
        '<div class="quoter__services" role="radiogroup" aria-label="Elegí qué necesitás">' +
          SERVICIOS.map((s) =>
            '<button type="button" class="qservice" role="radio" aria-checked="false" data-servicio="' + s.id + '">' +
              '<svg class="qservice__icon" viewBox="0 0 64 64" fill="none" aria-hidden="true">' + s.icono + '</svg>' +
              '<span class="qservice__name">' + esc(s.nombre) + '</span>' +
              '<span class="qservice__desc">' + esc(s.desc) + '</span>' +
            '</button>').join('') +
        '</div>' +
      '</div>';
  }

  function pasoAlcance(fijo) {
    const num = fijo ? '01' : '02';
    return '' +
      '<div class="quoter__layout" hidden>' +
        '<div class="quoter__main">' +
          '<p class="quoter__step-label"><span class="quoter__step-num">' + num + '</span> Contanos qué necesitás</p>' +
          '<div class="quoter__modules" aria-live="polite" aria-busy="true">' +
            '<p class="quoter__loading">Cargando las opciones…</p>' +
          '</div>' +
        '</div>' +
        '<aside class="quoter__summary"><div class="qsummary">' +

          /* vista A · estimación */
          '<div class="qsummary__view" data-view="precio">' +
            '<p class="qsummary__label">Precio estimado</p>' +
            '<p class="qsummary__price">—</p>' +
            '<p class="qsummary__meta">Marcá lo que necesitás</p>' +
            '<button type="button" class="qsummary__toggle" aria-expanded="false" hidden>Ver el detalle</button>' +
            '<ul class="qsummary__breakdown" hidden></ul>' +
            '<button type="button" class="btn btn--ghost qsummary__cta">Recibir la propuesta en PDF</button>' +
            '<p class="qsummary__note">Precio orientativo en pesos, calculado sobre las horas de trabajo que lleva cada cosa. No incluye IVA ni costos de terceros (hosting, licencias, servicios que se pagan aparte).</p>' +
          '</div>' +

          /* vista B · contacto */
          '<div class="qsummary__view" data-view="form" hidden>' +
            '<button type="button" class="qsummary__back">← Volver al detalle</button>' +
            '<p class="qsummary__label">Casi listo</p>' +
            '<p class="qsummary__form-title">¿A dónde te mandamos la propuesta?</p>' +
            '<form class="qform" novalidate>' +
              campo('Nombre y apellido *', 'nombre', 'text', 'name', true) +
              campo('Email *', 'email', 'email', 'email', true) +
              campo('Empresa o proyecto', 'empresa', 'text', 'organization') +
              campo('Teléfono / WhatsApp', 'telefono', 'tel', 'tel') +
              '<label class="qform__field">' +
                '<span class="qform__label">Contanos brevemente qué necesitás</span>' +
                '<textarea name="mensaje" rows="3"></textarea>' +
              '</label>' +
              '<p class="qform__error" role="alert" hidden></p>' +
              '<button type="submit" class="btn btn--ghost qform__submit">Enviarme la propuesta</button>' +
              '<p class="qform__legal">Al enviar aceptás que te contactemos por esta consulta. Ver la <a href="' + rel('privacidad.html') + '">política de privacidad</a>.</p>' +
            '</form>' +
          '</div>' +

          /* vista C · enviado */
          '<div class="qsummary__view" data-view="ok" hidden>' +
            '<div class="qsummary__check" aria-hidden="true">' +
              '<svg viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="22" stroke="currentColor" stroke-width="2"/><path d="M14 24.5 21 31.5 34 18" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
            '</div>' +
            '<p class="qsummary__form-title">Te mandamos la propuesta</p>' +
            '<p class="qsummary__meta" data-ok-mail>Revisá tu casilla en los próximos minutos.</p>' +
            '<p class="qsummary__note">Si no la ves, fijate en spam o promociones. Llega desde <strong>notificaciones@chichalabs.studio</strong>.</p>' +
            '<a class="btn btn--ghost qsummary__cta" data-location="cotizador_ok" href="' + CALENDAR + '" target="_blank" rel="noopener noreferrer">Agendá una reunión</a>' +
          '</div>' +

        '</div></aside>' +
      '</div>';
  }

  function campo(label, name, type, autocomplete, req) {
    return '<label class="qform__field">' +
      '<span class="qform__label">' + esc(label) + '</span>' +
      '<input type="' + type + '" name="' + name + '" autocomplete="' + autocomplete + '"' +
        (req ? ' required' : '') + (type === 'tel' ? ' inputmode="tel"' : '') + '>' +
    '</label>';
  }

  function fallback() {
    return '' +
      '<div class="quoter__fallback" hidden>' +
        '<p class="quoter__fallback-title">El cotizador no está respondiendo en este momento.</p>' +
        '<p>Escribinos y te pasamos el precio igual, en el día.</p>' +
        '<div class="quoter__fallback-actions">' +
          '<a data-location="cotizador_fallback" class="btn btn--ghost" href="' + WHATSAPP + '" target="_blank" rel="noopener noreferrer">Escribir por WhatsApp</a>' +
          '<a data-location="cotizador_fallback" class="btn btn--text" href="' + CALENDAR + '" target="_blank" rel="noopener noreferrer">Agendá una reunión →</a>' +
        '</div>' +
      '</div>';
  }

  /* Las landings viven en /servicios/, la home en la raíz. */
  function rel(archivo) {
    return (location.pathname.indexOf('/servicios/') !== -1 ? '../' : '') + archivo;
  }

  /* ══════════════════════════════════════════════════════════════════
     FÁBRICA — una instancia por contenedor
     Todo se busca dentro de `root`, nunca por id global: en la home
     puede haber una instancia inline y otra en modal a la vez.
  ══════════════════════════════════════════════════════════════════ */
  function crearCotizador(root, opciones) {
    const opts = opciones || {};
    const fijo = opts.servicio || null;
    /* De qué botón salió, para poder cortar el Lead por ubicación y saber
       cuál convierte (hero, CTA final, etc.). */
    const origen = opts.origen || (fijo ? 'cotizador_modal' : 'cotizador');
    root.innerHTML = plantilla(fijo);

    const q = (sel) => root.querySelector(sel);
    const el = {
      services:  q('.quoter__services'),
      layout:    q('.quoter__layout'),
      modules:   q('.quoter__modules'),
      summary:   q('.qsummary'),
      price:     q('.qsummary__price'),
      meta:      q('.qsummary__meta'),
      toggle:    q('.qsummary__toggle'),
      breakdown: q('.qsummary__breakdown'),
      cta:       q('.qsummary__cta'),
      back:      q('.qsummary__back'),
      form:      q('.qform'),
      formError: q('.qform__error'),
      submit:    q('.qform__submit'),
      okMail:    q('[data-ok-mail]'),
      fallback:  q('.quoter__fallback')
    };

    const state = {
      servicio: null, servicioNombre: '',
      modulos: [], seleccion: Object.create(null),
      precio: null, reqId: 0, debounceId: null
    };

    if (el.services) {
      el.services.addEventListener('click', onServiceClick);
      el.services.addEventListener('keydown', onServiceKeydown);
    }
    el.modules.addEventListener('change', onModuleChange);
    el.modules.addEventListener('click', onStepperClick);
    el.toggle.addEventListener('click', onToggleBreakdown);
    el.cta.addEventListener('click', () => showView('form'));
    el.back.addEventListener('click', () => showView('precio'));
    el.form.addEventListener('submit', onSubmit);

    if (fijo) {
      elegir(fijo);
    } else {
      /* Las landings viejas linkeaban a index.html?servicio=X#cotizador.
         Se sigue soportando para no romper links que ya estén dando vueltas. */
      const id = new URLSearchParams(location.search).get('servicio');
      if (id && buscarServicio(id)) elegir(id);
    }

    /* ── Paso 01 · servicio ─────────────────────────────────────── */
    function onServiceClick(e) {
      const btn = e.target.closest('.qservice');
      if (btn) elegir(btn.dataset.servicio);
    }

    function onServiceKeydown(e) {
      if (['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].indexOf(e.key) === -1) return;
      const btns = Array.from(el.services.querySelectorAll('.qservice'));
      const i = btns.indexOf(document.activeElement);
      if (i === -1) return;
      e.preventDefault();
      const paso = (e.key === 'ArrowRight' || e.key === 'ArrowDown') ? 1 : -1;
      const sig = btns[(i + paso + btns.length) % btns.length];
      sig.focus();
      elegir(sig.dataset.servicio);
    }

    function elegir(id) {
      const serv = buscarServicio(id);
      if (!serv || id === state.servicio) return;

      if (el.services) {
        el.services.querySelectorAll('.qservice').forEach((b) => {
          const activo = b.dataset.servicio === id;
          b.setAttribute('aria-checked', String(activo));
          b.tabIndex = activo ? 0 : -1;
        });
      }

      state.servicio = id;
      state.servicioNombre = serv.nombre;
      state.seleccion = Object.create(null);
      state.precio = null;

      showView('precio');
      el.layout.hidden = false;
      el.modules.setAttribute('aria-busy', 'true');
      el.modules.innerHTML = '<p class="quoter__loading">Cargando las opciones…</p>';
      setPrice('—', 'Marcá lo que necesitás');
      el.toggle.hidden = true;
      el.breakdown.hidden = true;
      el.toggle.setAttribute('aria-expanded', 'false');
      el.toggle.textContent = 'Ver el detalle';

      trackCustom('QuoteStarted', { servicio: id, servicio_nombre: serv.nombre });
      cargarModulos(id);
    }

    async function cargarModulos(servicio) {
      const req = ++state.reqId;
      try {
        const data = await api('GET', '/modulos?servicio=' + encodeURIComponent(servicio));
        if (req !== state.reqId) return;

        state.modulos = Array.isArray(data.modulos) ? data.modulos : [];
        if (!state.modulos.length) throw new Error('sin modulos');

        state.modulos.forEach((m) => {
          state.seleccion[m.id] = m.control === 'incluido' ? 1 : 0;
        });

        renderModules();
        el.modules.setAttribute('aria-busy', 'false');
        pedirPrecio();
      } catch (err) {
        if (req !== state.reqId) return;
        mostrarFallback(err);
      }
    }

    /* ── Render de módulos ──────────────────────────────────────── */
    function renderModules() {
      const orden = ['Base', 'Contenido', 'Funcionalidad', 'Diseño', 'Integración', 'Revisión'];
      const grupos = new Map();

      state.modulos.forEach((m) => {
        const cat = m.categoria || 'Otros';
        if (!grupos.has(cat)) grupos.set(cat, []);
        grupos.get(cat).push(m);
      });

      const cats = Array.from(grupos.keys()).sort((a, b) => {
        const ia = orden.indexOf(a), ib = orden.indexOf(b);
        return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
      });

      el.modules.innerHTML = cats.map((cat) =>
        '<div class="qgroup">' +
          '<p class="qgroup__title">' + esc(cat) + '</p>' +
          grupos.get(cat).map(renderModule).join('') +
        '</div>'
      ).join('');
    }

    function renderModule(m) {
      const id   = esc(m.id);
      const desc = m.descripcion ? '<span class="qmod__desc">' + esc(m.descripcion) + '</span>' : '';

      if (m.control === 'incluido') {
        return '<div class="qmod qmod--base">' +
          '<div class="qmod__text"><span class="qmod__name">' + esc(m.nombre) + '</span>' + desc + '</div>' +
          '<span class="qmod__included">Incluido</span>' +
        '</div>';
      }

      const label = esc(m.pregunta || m.nombre);

      if (m.control === 'cantidad') {
        const max = Number(m.max) > 0 ? Number(m.max) : 10;
        return '<div class="qmod" data-modulo="' + id + '" data-max="' + max + '">' +
          '<div class="qmod__text"><span class="qmod__name">' + label + '</span>' + desc + '</div>' +
          '<div class="qmod__stepper">' +
            '<button type="button" class="qstep-btn" data-step="-1" aria-label="Restar uno" disabled>−</button>' +
            '<span class="qmod__qty" data-zero="true" aria-live="polite">0</span>' +
            '<button type="button" class="qstep-btn" data-step="1" aria-label="Sumar uno">+</button>' +
          '</div>' +
        '</div>';
      }

      return '<div class="qmod" data-modulo="' + id + '">' +
        '<div class="qmod__text"><span class="qmod__name">' + label + '</span>' + desc + '</div>' +
        '<label class="qmod__toggle">' +
          '<input type="checkbox" data-modulo="' + id + '">' +
          '<span class="qmod__track" aria-hidden="true"></span>' +
          '<span class="sr-only">' + label + '</span>' +
        '</label>' +
      '</div>';
    }

    /* ── Interacción ────────────────────────────────────────────── */
    function onModuleChange(e) {
      const input = e.target.closest('input[type="checkbox"][data-modulo]');
      if (!input) return;
      state.seleccion[input.dataset.modulo] = input.checked ? 1 : 0;
      pedirPrecio();
    }

    function onStepperClick(e) {
      const btn = e.target.closest('.qstep-btn');
      if (!btn) return;
      const fila = btn.closest('.qmod');
      const id   = fila.dataset.modulo;
      const max  = Number(fila.dataset.max) || 10;

      const actual = state.seleccion[id] || 0;
      const nuevo  = Math.min(max, Math.max(0, actual + Number(btn.dataset.step)));
      if (nuevo === actual) return;

      state.seleccion[id] = nuevo;
      const qty = fila.querySelector('.qmod__qty');
      qty.textContent = String(nuevo);
      qty.dataset.zero = String(nuevo === 0);
      fila.querySelector('[data-step="-1"]').disabled = nuevo === 0;
      fila.querySelector('[data-step="1"]').disabled  = nuevo === max;

      pedirPrecio();
    }

    /* ── Precio — siempre lo resuelve n8n ───────────────────────── */
    function pedirPrecio() {
      clearTimeout(state.debounceId);
      el.price.dataset.loading = 'true';
      state.debounceId = setTimeout(traerPrecio, DEBOUNCE);
    }

    async function traerPrecio() {
      const req = ++state.reqId;
      try {
        const data = await api('POST', '/precio', {
          servicio: state.servicio, seleccion: state.seleccion
        });
        if (req !== state.reqId) return;

        state.precio = data;
        el.price.dataset.loading = 'false';
        setPrice(formatARS(data.total), horasLabel(data.horas));
        renderBreakdown(data.desglose || []);
      } catch (err) {
        if (req !== state.reqId) return;
        mostrarFallback(err);
      }
    }

    function setPrice(txt, meta) {
      el.price.textContent = txt;
      el.meta.textContent  = meta;
    }

    function horasLabel(horas) {
      if (!horas) return 'Marcá lo que necesitás';
      const h = Number(horas);
      return h + (h === 1 ? ' hora' : ' horas') + ' de trabajo';
    }

    function renderBreakdown(desglose) {
      if (!desglose.length) {
        el.toggle.hidden = true;
        el.breakdown.hidden = true;
        return;
      }
      el.toggle.hidden = false;
      el.breakdown.innerHTML = desglose.map((d) => {
        const cant = Number(d.cantidad) > 1 ? ' ×' + d.cantidad : '';
        return '<li><span>' + esc(d.modulo) + cant + '</span><span>' + formatARS(d.subtotal) + '</span></li>';
      }).join('');
    }

    function onToggleBreakdown() {
      const abierto = el.toggle.getAttribute('aria-expanded') === 'true';
      el.toggle.setAttribute('aria-expanded', String(!abierto));
      el.breakdown.hidden = abierto;
      el.toggle.textContent = abierto ? 'Ver el detalle' : 'Ocultar el detalle';
    }

    /* ── Contacto → dispara el PDF + email ──────────────────────── */
    async function onSubmit(e) {
      e.preventDefault();
      ocultarError();

      const fd = new FormData(el.form);
      const contacto = {
        nombre:   String(fd.get('nombre')   || '').trim(),
        email:    String(fd.get('email')    || '').trim(),
        empresa:  String(fd.get('empresa')  || '').trim(),
        telefono: String(fd.get('telefono') || '').trim(),
        mensaje:  String(fd.get('mensaje')  || '').trim()
      };

      const malo = validar(contacto);
      if (malo) { mostrarError(malo.msg, malo.campo); return; }

      el.submit.disabled = true;
      el.submit.textContent = 'Enviando…';

      try {
        await api('POST', '/propuesta', {
          servicio: state.servicio, seleccion: state.seleccion,
          contacto: contacto, origen: location.href
        });

        el.okMail.textContent = 'Te la mandamos a ' + contacto.email + '. Revisá tu casilla en los próximos minutos.';
        showView('ok');

        /* Mismo evento Lead que los clicks a WhatsApp, a propósito: con el
           volumen de la campaña, partir la señal en dos eventos la deja
           inservible. La ubicación distingue el canal. Ver PIXEL-EVENTS.md. */
        track('Lead', {
          content_name: state.servicioNombre,
          content_category: 'cotizador',
          content_ids: [state.servicio],
          location: origen,
          value: state.precio ? Number(state.precio.total) : undefined,
          currency: 'ARS'
        });
      } catch (err) {
        mostrarError('No pudimos enviar la propuesta. Probá de nuevo en un momento, o escribinos por WhatsApp.');
        el.submit.disabled = false;
        el.submit.textContent = 'Enviarme la propuesta';
      }
    }

    function validar(c) {
      if (c.nombre.length < 2) return { campo: 'nombre', msg: 'Necesitamos tu nombre para armar la propuesta.' };
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c.email)) return { campo: 'email', msg: 'Revisá el email: ahí es donde te llega el PDF.' };
      return null;
    }

    function mostrarError(msg, campo) {
      el.formError.textContent = msg;
      el.formError.hidden = false;
      if (!campo) return;
      const input = el.form.querySelector('[name="' + campo + '"]');
      if (input) { input.setAttribute('aria-invalid', 'true'); input.focus(); }
    }

    function ocultarError() {
      el.formError.hidden = true;
      el.form.querySelectorAll('[aria-invalid]').forEach((i) => i.removeAttribute('aria-invalid'));
    }

    function showView(nombre) {
      el.summary.querySelectorAll('.qsummary__view').forEach((v) => {
        v.hidden = v.dataset.view !== nombre;
      });
      if (nombre === 'form') {
        const primero = el.form.querySelector('input');
        if (primero) primero.focus({ preventScroll: true });
      }
    }

    /* Si n8n no responde, el widget se esconde y queda un camino humano.
       Nunca dejamos la sección rota y muda. */
    function mostrarFallback(err) {
      console.warn('[cotizador]', err && err.message ? err.message : err);
      el.layout.hidden = true;
      if (el.services) el.services.closest('.quoter__step').hidden = true;
      el.fallback.hidden = false;
      trackCustom('QuoteUnavailable', { servicio: state.servicio || 'sin_elegir' });
    }

    return { root: root };
  }

  /* ══════════════════════════════════════════════════════════════════
     MODAL
  ══════════════════════════════════════════════════════════════════ */
  let modalAbierto = null;

  function abrirModal(servicioId, disparador) {
    if (modalAbierto) return;
    const serv = buscarServicio(servicioId);
    if (!serv) return;

    const overlay = document.createElement('div');
    overlay.className = 'qmodal';
    overlay.innerHTML =
      '<div class="qmodal__dialog" role="dialog" aria-modal="true" aria-labelledby="qmodal-title">' +
        '<div class="qmodal__head">' +
          '<div>' +
            '<p class="qmodal__eyebrow">Precio estimado</p>' +
            '<h2 class="qmodal__title" id="qmodal-title">' + esc(serv.nombre) + '</h2>' +
          '</div>' +
          '<button type="button" class="qmodal__close" aria-label="Cerrar">' +
            '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>' +
          '</button>' +
        '</div>' +
        '<div class="qmodal__body"><div class="quoter"></div></div>' +
        '<p class="qmodal__foot">¿Necesitás otra cosa? <a href="' + rel('index.html') + '#cotizador">Ver todos los servicios</a></p>' +
      '</div>';

    document.body.appendChild(overlay);
    document.body.classList.add('qmodal-open');

    crearCotizador(overlay.querySelector('.quoter'), {
      servicio: servicioId,
      origen: (disparador && disparador.dataset.location) || 'cotizador_modal'
    });

    const dialog = overlay.querySelector('.qmodal__dialog');
    const cerrar = () => cerrarModal();

    overlay.addEventListener('mousedown', (e) => { if (e.target === overlay) cerrar(); });
    overlay.querySelector('.qmodal__close').addEventListener('click', cerrar);
    document.addEventListener('keydown', onKeydown);

    /* Foco atrapado: mientras el modal esté abierto, el tab no puede
       escaparse al contenido de atrás. */
    function onKeydown(e) {
      if (e.key === 'Escape') { cerrar(); return; }
      if (e.key !== 'Tab') return;
      const focos = dialog.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');
      const visibles = Array.from(focos).filter((n) => n.offsetParent !== null);
      if (!visibles.length) return;
      const primero = visibles[0], ultimo = visibles[visibles.length - 1];
      if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo.focus(); }
      else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
    }

    modalAbierto = { overlay: overlay, onKeydown: onKeydown, disparador: disparador };
    /* La animación de entrada es un @keyframes que arranca solo al insertar
       el nodo. Antes esto dependía de requestAnimationFrame para agregar una
       clase, pero rAF no corre en pestañas ocultas ni en navegadores
       controlados: el modal podía quedarse invisible para siempre. */
    overlay.querySelector('.qmodal__close').focus();
  }

  function cerrarModal() {
    if (!modalAbierto) return;
    const { overlay, onKeydown, disparador } = modalAbierto;
    modalAbierto = null;

    document.removeEventListener('keydown', onKeydown);
    document.body.classList.remove('qmodal-open');
    overlay.classList.add('is-closing');

    /* Lo sacamos del DOM cuando termina la animación de salida. El
       setTimeout es el respaldo: con reduced-motion la animación dura
       casi cero y animationend puede no llegar nunca. */
    let sacado = false;
    const sacar = () => { if (!sacado) { sacado = true; overlay.remove(); } };
    overlay.addEventListener('animationend', sacar);
    setTimeout(sacar, 350);

    if (disparador && document.contains(disparador)) disparador.focus();
  }

  /* ══════════════════════════════════════════════════════════════════
     HTTP
  ══════════════════════════════════════════════════════════════════ */
  async function api(method, path, body) {
    const ctrl  = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT);
    try {
      const res = await fetch(API + path, {
        method: method,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
        signal: ctrl.signal
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return await res.json();
    } finally {
      clearTimeout(timer);
    }
  }

  /* ══════════════════════════════════════════════════════════════════
     Utilidades
  ══════════════════════════════════════════════════════════════════ */
  function formatARS(n) {
    const v = Number(n);
    if (!isFinite(v)) return '—';
    return '$ ' + v.toLocaleString('es-AR', { maximumFractionDigits: 0 });
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function track(evento, params) {
    if (typeof window.fbq === 'function') window.fbq('track', evento, params);
  }

  function trackCustom(evento, params) {
    if (typeof window.fbq === 'function') window.fbq('trackCustom', evento, params);
  }

  /* ══════════════════════════════════════════════════════════════════
     ARRANQUE
  ══════════════════════════════════════════════════════════════════ */
  // 1. Widget inline (la home). Si no existe, no pasa nada.
  const inline = document.querySelector('.quoter[data-inline]');
  if (inline) crearCotizador(inline, {});

  // 2. Cualquier botón con data-cotizador abre el modal ya filtrado.
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-cotizador]');
    if (!btn) return;
    e.preventDefault();
    abrirModal(btn.getAttribute('data-cotizador'), btn);
  });
})();
