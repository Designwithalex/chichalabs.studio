/* ============================================================================
   ChichaLabs Studio — COTIZADOR EN VIVO  (js/cotizador.js)

   IMPORTANTE — por qué este archivo no calcula nada:
   La tabla de horas por módulo vive SÓLO en Notion y sólo la lee n8n. Si la
   fórmula (horas × valor hora) estuviera acá, cualquiera la vería en el
   código fuente. Este archivo únicamente:
     1. pide los módulos de un servicio      → GET  {api}/modulos?servicio=ID
     2. manda la selección y recibe el precio → POST {api}/precio
     3. manda el contacto y dispara el PDF    → POST {api}/propuesta
   Ninguna respuesta del paso 1 incluye horas ni precios unitarios.

   Endpoints y link de Calendar se configuran por data-attributes en #quoter.
   ============================================================================ */
(() => {
  'use strict';

  const root = document.getElementById('quoter');
  if (!root) return;

  const API      = (root.dataset.api || '').replace(/\/+$/, '');
  const TIMEOUT  = 12000;   // ms — n8n Cloud arranca frío a veces
  const DEBOUNCE = 300;     // ms entre cambio y recálculo

  const el = {
    services:  root.querySelector('.quoter__services'),
    layout:    document.getElementById('quoter-layout'),
    modules:   document.getElementById('quoter-modules'),
    price:     document.getElementById('qsummary-price'),
    meta:      document.getElementById('qsummary-meta'),
    toggle:    document.getElementById('qsummary-toggle'),
    breakdown: document.getElementById('qsummary-breakdown'),
    cta:       document.getElementById('qsummary-cta'),
    back:      document.getElementById('qsummary-back'),
    form:      document.getElementById('qform'),
    formError: document.getElementById('qform-error'),
    submit:    document.getElementById('qform-submit'),
    okMail:    document.getElementById('qsummary-ok-mail'),
    fallback:  document.getElementById('quoter-fallback'),
    summary:   document.getElementById('qsummary')
  };

  /* Estado. `seleccion` es {moduloId: cantidad}; los módulos base entran
     siempre en 1 y no se pueden tocar. */
  const state = {
    servicio:   null,
    servicioNombre: '',
    modulos:    [],
    seleccion:  Object.create(null),
    precio:     null,
    reqId:      0,      // descarta respuestas viejas que llegan tarde
    debounceId: null
  };

  init();

  function init() {
    el.services.addEventListener('click', onServiceClick);
    el.services.addEventListener('keydown', onServiceKeydown);
    el.modules.addEventListener('change', onModuleChange);
    el.modules.addEventListener('click', onStepperClick);
    el.toggle.addEventListener('click', onToggleBreakdown);
    el.cta.addEventListener('click', () => showView('form'));
    el.back.addEventListener('click', () => showView('precio'));
    el.form.addEventListener('submit', onSubmit);

    preselectFromQuery();
  }

  /* Las landings de servicio linkean a index.html?servicio=X#cotizador, así
     que el visitante que viene de un ad ya cae con su servicio elegido. */
  function preselectFromQuery() {
    const id = new URLSearchParams(location.search).get('servicio');
    if (!id) return;
    const btn = el.services.querySelector('[data-servicio="' + cssEscape(id) + '"]');
    if (btn) selectService(btn);
  }

  /* ══════════════════════════════════════════════════════════
     PASO 01 · servicio
  ══════════════════════════════════════════════════════════ */
  function onServiceClick(e) {
    const btn = e.target.closest('.qservice');
    if (btn) selectService(btn);
  }

  /* radiogroup accesible: flechas mueven la selección, como un radio nativo */
  function onServiceKeydown(e) {
    if (['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].indexOf(e.key) === -1) return;
    const btns = Array.from(el.services.querySelectorAll('.qservice'));
    const i = btns.indexOf(document.activeElement);
    if (i === -1) return;
    e.preventDefault();
    const step = (e.key === 'ArrowRight' || e.key === 'ArrowDown') ? 1 : -1;
    const next = btns[(i + step + btns.length) % btns.length];
    next.focus();
    selectService(next);
  }

  function selectService(btn) {
    const id = btn.dataset.servicio;
    if (id === state.servicio) return;

    el.services.querySelectorAll('.qservice').forEach((b) => {
      b.setAttribute('aria-checked', String(b === btn));
      b.tabIndex = b === btn ? 0 : -1;
    });

    state.servicio       = id;
    state.servicioNombre = btn.querySelector('.qservice__name').textContent.trim();
    state.seleccion      = Object.create(null);
    state.precio         = null;

    showView('precio');
    el.layout.hidden = false;
    el.modules.setAttribute('aria-busy', 'true');
    el.modules.innerHTML = '<p class="quoter__loading">Cargando los módulos del servicio…</p>';
    setPrice('—', 'Elegí las opciones que necesitás');
    el.toggle.hidden = true;
    el.breakdown.hidden = true;
    el.toggle.setAttribute('aria-expanded', 'false');
    el.toggle.textContent = 'Ver el desglose';

    trackCustom('QuoteStarted', { servicio: id, servicio_nombre: state.servicioNombre });
    loadModules(id);
  }

  async function loadModules(servicio) {
    const req = ++state.reqId;
    try {
      const data = await api('GET', '/modulos?servicio=' + encodeURIComponent(servicio));
      if (req !== state.reqId) return;         // el usuario ya cambió de servicio

      state.modulos = Array.isArray(data.modulos) ? data.modulos : [];
      if (!state.modulos.length) throw new Error('sin modulos');

      /* Los módulos base entran siempre; el resto arranca en 0. */
      state.modulos.forEach((m) => {
        state.seleccion[m.id] = m.control === 'incluido' ? 1 : 0;
      });

      renderModules();
      el.modules.setAttribute('aria-busy', 'false');
      requestPrice();
    } catch (err) {
      if (req !== state.reqId) return;
      showFallback(err);
    }
  }

  /* ══════════════════════════════════════════════════════════
     RENDER de módulos
  ══════════════════════════════════════════════════════════ */
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

    /* Base: no es una pregunta, es el piso del proyecto. */
    if (m.control === 'incluido') {
      return '<div class="qmod qmod--base">' +
        '<div class="qmod__text">' +
          '<span class="qmod__name">' + esc(m.nombre) + '</span>' + desc +
        '</div>' +
        '<span class="qmod__included">Incluido</span>' +
      '</div>';
    }

    /* El label visible es la pregunta del formulario (viene de Notion);
       el nombre del módulo sólo aparece en el desglose y en el PDF. */
    const label = esc(m.pregunta || m.nombre);

    if (m.control === 'cantidad') {
      const max = Number(m.max) > 0 ? Number(m.max) : 10;
      return '<div class="qmod" data-modulo="' + id + '" data-max="' + max + '">' +
        '<div class="qmod__text">' +
          '<span class="qmod__name">' + label + '</span>' + desc +
        '</div>' +
        '<div class="qmod__stepper">' +
          '<button type="button" class="qstep-btn" data-step="-1" aria-label="Restar uno" disabled>−</button>' +
          '<span class="qmod__qty" data-zero="true" aria-live="polite">0</span>' +
          '<button type="button" class="qstep-btn" data-step="1" aria-label="Sumar uno">+</button>' +
        '</div>' +
      '</div>';
    }

    return '<div class="qmod" data-modulo="' + id + '">' +
      '<div class="qmod__text">' +
        '<span class="qmod__name">' + label + '</span>' + desc +
      '</div>' +
      '<label class="qmod__toggle">' +
        '<input type="checkbox" data-modulo="' + id + '">' +
        '<span class="qmod__track" aria-hidden="true"></span>' +
        '<span class="sr-only">' + label + '</span>' +
      '</label>' +
    '</div>';
  }

  /* ══════════════════════════════════════════════════════════
     Interacción con los módulos
  ══════════════════════════════════════════════════════════ */
  function onModuleChange(e) {
    const input = e.target.closest('input[type="checkbox"][data-modulo]');
    if (!input) return;
    state.seleccion[input.dataset.modulo] = input.checked ? 1 : 0;
    requestPrice();
  }

  function onStepperClick(e) {
    const btn = e.target.closest('.qstep-btn');
    if (!btn) return;
    const row = btn.closest('.qmod');
    const id  = row.dataset.modulo;
    const max = Number(row.dataset.max) || 10;

    const actual = state.seleccion[id] || 0;
    const nuevo  = Math.min(max, Math.max(0, actual + Number(btn.dataset.step)));
    if (nuevo === actual) return;

    state.seleccion[id] = nuevo;

    const qty = row.querySelector('.qmod__qty');
    qty.textContent = String(nuevo);
    qty.dataset.zero = String(nuevo === 0);
    row.querySelector('[data-step="-1"]').disabled = nuevo === 0;
    row.querySelector('[data-step="1"]').disabled  = nuevo === max;

    requestPrice();
  }

  /* ══════════════════════════════════════════════════════════
     PRECIO — siempre lo resuelve n8n, nunca el front
  ══════════════════════════════════════════════════════════ */
  function requestPrice() {
    clearTimeout(state.debounceId);
    el.price.dataset.loading = 'true';
    state.debounceId = setTimeout(fetchPrice, DEBOUNCE);
  }

  async function fetchPrice() {
    const req = ++state.reqId;
    try {
      const data = await api('POST', '/precio', {
        servicio:  state.servicio,
        seleccion: state.seleccion
      });
      if (req !== state.reqId) return;

      state.precio = data;
      el.price.dataset.loading = 'false';
      setPrice(formatARS(data.total), horasLabel(data.horas));
      renderBreakdown(data.desglose || []);
    } catch (err) {
      if (req !== state.reqId) return;
      showFallback(err);
    }
  }

  function setPrice(txt, meta) {
    el.price.textContent = txt;
    el.meta.textContent  = meta;
  }

  function horasLabel(horas) {
    if (!horas) return 'Elegí las opciones que necesitás';
    const h = Number(horas);
    return h + (h === 1 ? ' hora estimada' : ' horas estimadas') + ' de trabajo';
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
    el.toggle.textContent = abierto ? 'Ver el desglose' : 'Ocultar el desglose';
  }

  /* ══════════════════════════════════════════════════════════
     PASO 03 · contacto → dispara el PDF + email en n8n
  ══════════════════════════════════════════════════════════ */
  async function onSubmit(e) {
    e.preventDefault();
    hideError();

    const fd = new FormData(el.form);
    const contacto = {
      nombre:   String(fd.get('nombre')   || '').trim(),
      email:    String(fd.get('email')    || '').trim(),
      empresa:  String(fd.get('empresa')  || '').trim(),
      telefono: String(fd.get('telefono') || '').trim(),
      mensaje:  String(fd.get('mensaje')  || '').trim()
    };

    const invalido = validar(contacto);
    if (invalido) { showError(invalido.msg, invalido.campo); return; }

    el.submit.disabled = true;
    el.submit.textContent = 'Enviando…';

    try {
      await api('POST', '/propuesta', {
        servicio:  state.servicio,
        seleccion: state.seleccion,
        contacto:  contacto,
        origen:    location.href
      });

      el.okMail.textContent = 'Te la mandamos a ' + contacto.email + '. Revisá tu casilla en los próximos minutos.';
      showView('ok');

      /* Mismo evento Lead que los clicks a WhatsApp, a propósito: con el
         volumen de la campaña, partir la señal en dos eventos la deja
         inservible. La ubicación distingue el canal. Ver PIXEL-EVENTS.md. */
      track('Lead', {
        content_name:     state.servicioNombre,
        content_category: 'cotizador',
        content_ids:      [state.servicio],
        location:         'cotizador',
        value:            state.precio ? Number(state.precio.total) : undefined,
        currency:         'ARS'
      });
    } catch (err) {
      showError('No pudimos enviar la propuesta. Probá de nuevo en un momento, o escribinos por WhatsApp.');
      el.submit.disabled = false;
      el.submit.textContent = 'Enviarme la propuesta';
    }
  }

  function validar(c) {
    if (c.nombre.length < 2) return { campo: 'nombre', msg: 'Necesitamos tu nombre para armar la propuesta.' };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c.email)) return { campo: 'email', msg: 'Revisá el email: ahí es donde te llega el PDF.' };
    return null;
  }

  function showError(msg, campo) {
    el.formError.textContent = msg;
    el.formError.hidden = false;
    if (!campo) return;
    const input = el.form.querySelector('[name="' + campo + '"]');
    if (input) { input.setAttribute('aria-invalid', 'true'); input.focus(); }
  }

  function hideError() {
    el.formError.hidden = true;
    el.form.querySelectorAll('[aria-invalid]').forEach((i) => i.removeAttribute('aria-invalid'));
  }

  /* ══════════════════════════════════════════════════════════
     Vistas del panel resumen
  ══════════════════════════════════════════════════════════ */
  function showView(name) {
    el.summary.querySelectorAll('.qsummary__view').forEach((v) => {
      v.hidden = v.dataset.view !== name;
    });
    if (name === 'form') {
      const first = el.form.querySelector('input');
      if (first) first.focus({ preventScroll: true });
    }
  }

  /* ══════════════════════════════════════════════════════════
     HTTP
  ══════════════════════════════════════════════════════════ */
  async function api(method, path, body) {
    if (!API) throw new Error('cotizador sin API configurada');

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

  /* Si n8n no responde, el cotizador se esconde y queda un camino humano.
     Nunca dejamos la sección rota y muda. */
  function showFallback(err) {
    console.warn('[cotizador]', err && err.message ? err.message : err);
    el.layout.hidden = true;
    el.fallback.hidden = false;
    trackCustom('QuoteUnavailable', { servicio: state.servicio || 'sin_elegir' });
  }

  /* ══════════════════════════════════════════════════════════
     Utilidades
  ══════════════════════════════════════════════════════════ */
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

  /* Sólo para selectores: los ids de servicio son slugs, pero no confiamos
     en el query string de la URL. */
  function cssEscape(s) {
    return String(s).replace(/[^a-zA-Z0-9_-]/g, '');
  }

  function track(evento, params) {
    if (typeof window.fbq === 'function') window.fbq('track', evento, params);
  }

  function trackCustom(evento, params) {
    if (typeof window.fbq === 'function') window.fbq('trackCustom', evento, params);
  }
})();
