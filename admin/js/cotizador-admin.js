/* ============================================================================
   ChichaLabs Studio — COTIZADOR EN EL ADMIN  (admin/js/cotizador-admin.js)

   Mismo contrato con n8n que el cotizador público (js/cotizador.js): el
   catálogo de módulos vive en Notion, `GET /modulos` devuelve las preguntas
   sin horas y `POST /precio` devuelve el desglose. De esa respuesta acá se
   usan las HORAS de cada módulo, no el subtotal: el precio lo pone la
   propuesta (valor hora × horas), que puede estar en otra moneda y a otro
   valor hora que el $/hora público.

   Por qué es un archivo aparte y no el mismo widget:
     · el público termina en un formulario de contacto → PDF por email;
     · éste termina en un POST a propuesta-editor.php que crea los
       proposal_modules de una propuesta concreta.
   Comparten el contrato con n8n y las clases de css/cotizador.css (.qmod,
   .qgroup, .qstep-btn), no la UI ni el embudo. El público no dispara eventos
   de Pixel desde acá a propósito: esto es una herramienta interna.

   Las horas del preview son EDITABLES antes de importar. Es un admin
   autenticado: puede corregir la estimación del catálogo para este cliente.
   ============================================================================ */
(() => {
  'use strict';

  const root = document.getElementById('cotizador-import');
  if (!root) return;

  /* Mismo endpoint que js/cotizador.js. Si cambia la instancia de n8n hay
     que tocarlo en los dos lados. */
  const API      = 'https://yellow-muskrat.pikapod.net/webhook/cotizador';
  const TIMEOUT  = 12000;   // ms — n8n arranca frío a veces
  const DEBOUNCE = 300;     // ms entre cambio y recálculo

  /* Los ids tienen que coincidir con el array SERVICIOS de js/cotizador.js y
     con el mapa SERVICIOS de los Code nodes de n8n. Ver README-COTIZADOR.md
     → "Agregar un servicio nuevo". */
  const SERVICIOS = [
    { id: 'web-comercial',    nombre: 'Web comercial' },
    { id: 'apps',             nombre: 'Apps' },
    { id: 'automatizaciones', nombre: 'Automatizaciones' },
    { id: 'dashboards',       nombre: 'Dashboards y herramientas internas' },
    { id: 'ia-aplicada',      nombre: 'IA aplicada' }
  ];

  /* Valor hora y moneda de ESTA propuesta, no los del cotizador público. */
  const cfg = window.CQ_CONFIG || {};
  const rate = Number(cfg.rate) || 0;
  const cur  = cfg.currency || '';
  const fx   = Number(cfg.fxRate) || 0;
  const cur2 = cfg.currency2 || '';

  const el = {
    servicio: root.querySelector('#cq-servicio'),
    body:     root.querySelector('#cq-body'),
    modules:  root.querySelector('#cq-modules'),
    form:     root.querySelector('#cq-form'),
    rows:     root.querySelector('#cq-rows'),
    total:    root.querySelector('#cq-total'),
    error:    root.querySelector('#cq-error')
  };

  const state = {
    servicio: null,
    modulos: [],
    seleccion: Object.create(null),
    reqId: 0,
    debounceId: null
  };

  el.servicio.innerHTML = '<option value="">Elegí un servicio…</option>' +
    SERVICIOS.map((s) => '<option value="' + esc(s.id) + '">' + esc(s.nombre) + '</option>').join('');

  el.servicio.addEventListener('change', () => elegir(el.servicio.value));
  el.modules.addEventListener('change', onModuleChange);
  el.modules.addEventListener('click', onStepperClick);
  /* Las horas editadas a mano y el destildado de una fila sólo cambian el
     preview: no se le vuelve a preguntar el precio a n8n. */
  el.rows.addEventListener('input', onRowEdit);
  el.rows.addEventListener('change', onRowEdit);

  /* ── Paso 1 · servicio ───────────────────────────────────────── */
  function elegir(id) {
    state.servicio = id || null;
    state.seleccion = Object.create(null);
    state.modulos = [];
    ocultarError();

    if (!id) { el.body.hidden = true; return; }

    el.body.hidden = false;
    el.form.hidden = true;
    el.modules.innerHTML = '<p class="admin-muted">Cargando las opciones…</p>';
    cargarModulos(id);
  }

  async function cargarModulos(servicio) {
    const req = ++state.reqId;
    try {
      const data = await api('GET', '/modulos?servicio=' + encodeURIComponent(servicio));
      if (req !== state.reqId) return;

      state.modulos = Array.isArray(data.modulos) ? data.modulos : [];
      if (!state.modulos.length) throw new Error('el servicio no tiene módulos cargados en Notion');

      state.modulos.forEach((m) => {
        state.seleccion[m.id] = m.control === 'incluido' ? 1 : 0;
      });

      renderModules();
      pedirPrecio();
    } catch (err) {
      if (req !== state.reqId) return;
      mostrarError(err);
    }
  }

  /* ── Render de las preguntas — mismas clases que el cotizador público ── */
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
        '<span class="admin-sr-only">' + label + '</span>' +
      '</label>' +
    '</div>';
  }

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

  /* ── Horas — las resuelve n8n, igual que en el cotizador público ── */
  function pedirPrecio() {
    clearTimeout(state.debounceId);
    state.debounceId = setTimeout(traerPrecio, DEBOUNCE);
  }

  async function traerPrecio() {
    const req = ++state.reqId;
    try {
      const data = await api('POST', '/precio', {
        servicio: state.servicio, seleccion: state.seleccion
      });
      if (req !== state.reqId) return;

      renderRows(data.desglose || []);
    } catch (err) {
      if (req !== state.reqId) return;
      mostrarError(err);
    }
  }

  /* ── Preview de lo que se va a importar ─────────────────────── */
  function renderRows(desglose) {
    if (!desglose.length) { el.form.hidden = true; return; }

    el.form.hidden = false;
    el.rows.innerHTML = desglose.map((d, i) => {
      const cant   = Number(d.cantidad) || 1;
      /* La cantidad va en el nombre: el módulo entra como una sola fila con
         las horas ya multiplicadas, que es como se lee en la propuesta. */
      const nombre = cant > 1 ? d.modulo + ' ×' + cant : String(d.modulo || '');
      const horas  = Number(d.horas) || 0;
      const cat    = String(d.categoria || '');
      const n      = 'mod[' + i + ']';

      return '<tr>' +
        '<td class="admin-cq__on">' +
          '<input type="checkbox" name="' + n + '[on]" checked aria-label="Incluir ' + esc(nombre) + '">' +
        '</td>' +
        '<td class="admin-cell-name">' + esc(nombre) +
          '<input type="hidden" name="' + n + '[name]" value="' + esc(nombre) + '">' +
          '<input type="hidden" name="' + n + '[description]" value="' + esc(d.descripcion || '') + '">' +
        '</td>' +
        '<td class="admin-cell-cat">' + esc(cat) +
          '<input type="hidden" name="' + n + '[category]" value="' + esc(cat) + '">' +
        '</td>' +
        '<td class="admin-num">' +
          '<input type="number" class="admin-cq__hours" name="' + n + '[hours]" step="any" min="0" value="' + horas + '" aria-label="Horas de ' + esc(nombre) + '">' +
        '</td>' +
        '<td class="admin-num" data-price>—</td>' +
      '</tr>';
    }).join('');

    recalcular();
  }

  function onRowEdit(e) {
    if (!e.target.closest('.admin-cq__hours, input[type="checkbox"]')) return;
    recalcular();
  }

  function recalcular() {
    let horas = 0;

    el.rows.querySelectorAll('tr').forEach((tr) => {
      const on    = tr.querySelector('input[type="checkbox"]');
      const input = tr.querySelector('.admin-cq__hours');
      const price = tr.querySelector('[data-price]');
      if (!input || !price) return;

      const h     = parseFloat(input.value) || 0;
      const activo = !on || on.checked;

      tr.classList.toggle('is-off', !activo);
      price.textContent = precioTxt(h);
      if (activo) horas += h;
    });

    const hTxt = redondear(horas) + (horas === 1 ? ' hora' : ' horas');
    el.total.textContent = rate > 0
      ? hTxt + ' · ' + precioTxt(horas)
      : hTxt + ' · definí el valor hora arriba para ver el precio';
  }

  function precioTxt(horas) {
    if (rate <= 0) return '—';
    const p = Math.round(horas * rate * 100) / 100;
    let txt = cur + ' ' + p.toLocaleString('es-AR');
    if (fx > 0 && cur2) txt += ' · ' + cur2 + ' ' + Math.round(p * fx).toLocaleString('es-AR');
    return txt;
  }

  /* ── Errores ────────────────────────────────────────────────── */
  function mostrarError(err) {
    const msg = err && err.message ? err.message : String(err);
    el.body.hidden = true;
    el.error.textContent = 'No pudimos traer los módulos (' + msg + '). Revisá que los dos workflows del cotizador estén activos en n8n, o cargá los módulos a mano acá abajo.';
    el.error.hidden = false;
  }

  function ocultarError() { el.error.hidden = true; }

  /* ── Utilidades ─────────────────────────────────────────────── */
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

  /* 7.5 → "7,5"  ·  8.0 → "8" */
  function redondear(n) {
    return String(Math.round(n * 100) / 100).replace('.', ',');
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
})();
