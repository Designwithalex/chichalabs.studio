/* ============================================================
   ChichaLabs Studio — Proposal Calculator
   Lee window.MODULES + window.PROPOSAL_META (inyectados por PHP
   como JSON embebido) y dibuja los módulos + calcula el total en
   vivo. Mismo archivo en /portal/js/ y /admin/js/ — no editar uno
   sin editar el otro (o reemplazar por symlink).
   ============================================================ */

(function () {
  'use strict';

  var CALENDAR_URL  = 'https://calendar.app.google/n4zQmUWpKw96TnSX8';
  var WHATSAPP_URL  = 'https://wa.me/5491178221468?text=Hola%2C%20mi%20propuesta%20de%20ChichaLabs%20Studio%20venci%C3%B3%2C%20%C2%BFme%20ayud%C3%A1s%20a%20renovarla%3F';

  if (typeof window.MODULES === 'undefined' || typeof window.PROPOSAL_META === 'undefined') return;

  var MODULES = window.MODULES;
  var META    = window.PROPOSAL_META;
  var root    = document.getElementById('proposal-app');
  if (!root) return;

  var isPortal    = META.mode === 'portal';
  var isExpired   = !!META.expired;
  var interactive = isPortal && !isExpired; // habilita el flujo real de aceptar (submit)

  init();

  function init() {
    root.innerHTML = renderCategories() + renderTotals() + renderConditions() + renderCTA();
    if (interactive) wireAccept();
    paintTotals();
  }

  /* ============================================================
     RENDER
  ============================================================ */
  function renderCategories() {
    var categories = [];
    var byCategory = {};
    MODULES.forEach(function (m) {
      if (!byCategory[m.category]) { byCategory[m.category] = []; categories.push(m.category); }
      byCategory[m.category].push(m);
    });

    return '<div class="pc-categories">' + categories.map(function (cat) {
      return '<div class="pc-category">' +
        '<h3 class="pc-category__title">' + esc(cat) + '</h3>' +
        byCategory[cat].map(renderModule).join('') +
        '</div>';
    }).join('') + '</div>';
  }

  /* Todos los módulos forman parte de la propuesta: no hay nada que tildar.
     La selección opcional se sacó porque no se entendía qué era obligatorio. */
  function renderModule(m) {
    var perMonth   = m.billing_type === 'monthly' ? ' / mes' : '';
    var priceLabel = formatRange(m.price_min, m.price_max) + perMonth;
    var priceAlt   = formatAlt(m.price_min, m.price_max);

    var bullets = String(m.description || '')
      .split('\n')
      .map(function (l) { return l.trim().replace(/^-\s*/, ''); })
      .filter(Boolean);

    return (
      '<div class="pc-module">' +
        '<div class="pc-module__body">' +
          '<span class="pc-module__head">' +
            '<span class="pc-module__num">Módulo ' + String(m.module_number).padStart(2, '0') + '</span>' +
            '<span class="pc-module__name">' + esc(m.name) + '</span>' +
            '<span class="pc-module__price">' + esc(priceLabel) +
              (priceAlt ? '<span class="pc-price-alt">≈ ' + esc(priceAlt + perMonth) + '</span>' : '') +
            '</span>' +
          '</span>' +
          (bullets.length ? '<ul class="pc-module__bullets">' + bullets.map(function (b) { return '<li>' + esc(b) + '</li>'; }).join('') + '</ul>' : '') +
          (m.delivery_estimate ? '<p class="pc-module__delivery">Entrega estimada: ' + esc(m.delivery_estimate) + '</p>' : '') +
          (m.notes ? '<p class="pc-module__notes">' + esc(m.notes) + '</p>' : '') +
          (m.external_cost_note ? '<p class="pc-module__external">⚠ Costo externo, aparte: ' + esc(m.external_cost_note) + '</p>' : '') +
        '</div>' +
      '</div>'
    );
  }

  function renderTotals() {
    return (
      '<div class="pc-totals">' +
        '<div class="pc-totals__row pc-totals__row--once" id="pc-total-once"></div>' +
        '<div class="pc-totals__row pc-totals__row--monthly" id="pc-total-monthly"></div>' +
      '</div>'
    );
  }

  function renderConditions() {
    var parts = [];
    if (META.payment_terms) parts.push('<p><strong>Forma de pago:</strong> ' + esc(META.payment_terms) + '</p>');
    var validUntil = computeValidUntil();
    if (validUntil) parts.push('<p><strong>Válida hasta:</strong> ' + esc(validUntil) + '</p>');
    if (META.general_notes) parts.push('<p>' + esc(META.general_notes) + '</p>');
    if (!parts.length) return '';
    return '<div class="pc-conditions">' + parts.join('') + '</div>';
  }

  function renderCTA() {
    if (isExpired) {
      return (
        '<div class="pc-cta pc-cta--expired">' +
          '<p class="pc-cta__expired-msg">Esta propuesta venció' + (computeValidUntil() ? ' el ' + esc(computeValidUntil()) : '') + '. Escribinos y te la renovamos.</p>' +
          '<a href="' + esc(WHATSAPP_URL) + '" target="_blank" rel="noopener noreferrer" class="btn btn--ghost">Hablar por WhatsApp →</a>' +
        '</div>'
      );
    }
    if (interactive) {
      return (
        '<div class="pc-cta" id="pc-cta">' +
          '<a href="' + esc(CALENDAR_URL) + '" target="_blank" rel="noopener noreferrer" class="btn btn--ghost" id="pc-cta-open">Agendá tu diagnóstico →</a>' +
          '<button type="submit" class="btn btn--ghost" id="pc-cta-accept" hidden>Aceptar propuesta</button>' +
        '</div>' +
        renderConfirmModal()
      );
    }
    return (
      '<div class="pc-cta pc-cta--preview" id="pc-cta">' +
        '<span class="pc-cta__badge" id="pc-cta-open">Vista previa: se mostraría "Agendá tu diagnóstico →"</span>' +
        '<span class="pc-cta__badge pc-cta__badge--accept" id="pc-cta-accept" hidden>Vista previa: se mostraría "Aceptar propuesta"</span>' +
      '</div>'
    );
  }

  function renderConfirmModal() {
    return (
      '<div class="pc-modal" id="pc-modal" aria-hidden="true">' +
        '<div class="pc-modal__panel" role="dialog" aria-modal="true" aria-labelledby="pc-modal-title">' +
          '<p class="pc-modal__title" id="pc-modal-title">¿Confirmás la propuesta?</p>' +
          '<p class="pc-modal__body">Una vez aceptada, la propuesta queda cerrada y no se puede modificar.</p>' +
          '<div class="pc-modal__actions">' +
            '<button type="button" class="btn btn--text" id="pc-modal-cancel">Cancelar</button>' +
            '<button type="button" class="btn btn--ghost" id="pc-modal-confirm">Sí, aceptar</button>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  /* ============================================================
     CÁLCULO
  ============================================================ */
  function paintTotals() {
    renderTotalRow('pc-total-once', MODULES.filter(function (m) { return m.billing_type === 'once'; }), 'Costo único');
    renderTotalRow('pc-total-monthly', MODULES.filter(function (m) { return m.billing_type === 'monthly'; }), 'Costo mensual');

    /* Con algún módulo de precio abierto todavía no hay nada que aceptar. */
    var allClosed = MODULES.every(function (m) { return Number(m.price_min) === Number(m.price_max); });
    toggleCTA(MODULES.length > 0 && allClosed);
  }

  function renderTotalRow(elId, mods, label) {
    var el = document.getElementById(elId);
    if (!el) return;
    if (!mods.length) { el.innerHTML = ''; return; }
    var min = mods.reduce(function (s, m) { return s + Number(m.price_min); }, 0);
    var max = mods.reduce(function (s, m) { return s + Number(m.price_max); }, 0);
    var alt = formatAlt(min, max);
    el.innerHTML = '<span class="pc-totals__label">' + esc(label) + '</span>' +
      '<span class="pc-totals__value">' + esc(formatRange(min, max, META.currency)) +
        (alt ? '<span class="pc-price-alt">≈ ' + esc(alt) + '</span>' : '') +
      '</span>';
  }

  function toggleCTA(showAccept) {
    var open   = document.getElementById('pc-cta-open');
    var accept = document.getElementById('pc-cta-accept');
    if (!open || !accept) return;
    open.hidden   = showAccept;
    accept.hidden = !showAccept;
  }

  /* ============================================================
     EVENTOS
  ============================================================ */
  function wireAccept() {
    var form    = root.closest('form') || root;
    var modal   = document.getElementById('pc-modal');
    var panel   = modal ? modal.querySelector('.pc-modal__panel') : null;
    var openBtn = document.getElementById('pc-cta-accept');
    var cancel  = document.getElementById('pc-modal-cancel');
    var confirm = document.getElementById('pc-modal-confirm');
    if (!modal || !openBtn) return;

    var lastFocused = null;
    var FOCUSABLE = 'a[href], button:not([disabled])';

    function openModal(e) {
      /* El botón de aceptar es type="submit": sin esto, el click enviaría el form
         de una y el modal de confirmación nunca llegaría a mostrarse. El submit real
         lo dispara el botón "Sí, aceptar" del modal (form.requestSubmit()). */
      if (e && e.preventDefault) e.preventDefault();
      lastFocused = document.activeElement;
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      cancel.focus();
      document.addEventListener('keydown', onKeydown);
    }

    function closeModal() {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      document.removeEventListener('keydown', onKeydown);
      if (lastFocused) lastFocused.focus();
    }

    function onKeydown(e) {
      if (e.key === 'Escape') { closeModal(); return; }
      if (e.key !== 'Tab' || !panel) return;
      var focusables = Array.prototype.slice.call(panel.querySelectorAll(FOCUSABLE));
      if (!focusables.length) return;
      var first = focusables[0];
      var last  = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }

    openBtn.addEventListener('click', openModal);
    cancel.addEventListener('click', closeModal);
    modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
    confirm.addEventListener('click', function () {
      if (form.requestSubmit) form.requestSubmit(); else form.submit();
    });
  }

  /* ============================================================
     HELPERS
  ============================================================ */
  function formatRange(min, max, currency) {
    var cur = currency || META.currency || 'ARS';
    min = Number(min); max = Number(max);
    if (min === max) return cur + ' ' + min.toLocaleString('es-AR');
    return cur + ' ' + min.toLocaleString('es-AR') + ' – ' + max.toLocaleString('es-AR');
  }

  /* Equivalente en la moneda secundaria (ej. ARS cuando se cotiza en USD).
     Devuelve '' si la propuesta no tiene moneda secundaria + tipo de cambio. */
  function formatAlt(min, max) {
    var fx = Number(META.fx_rate || 0);
    if (!META.secondary_currency || fx <= 0) return '';
    var lo = Math.round(Number(min) * fx);
    var hi = Math.round(Number(max) * fx);
    if (lo === hi) return META.secondary_currency + ' ' + lo.toLocaleString('es-AR');
    return META.secondary_currency + ' ' + lo.toLocaleString('es-AR') + ' – ' + hi.toLocaleString('es-AR');
  }

  function computeValidUntil() {
    if (!META.sent_at || !META.validity_days) return null;
    var d = new Date(META.sent_at);
    if (isNaN(d.getTime())) return null;
    d.setDate(d.getDate() + Number(META.validity_days));
    return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  function esc(str) {
    var div = document.createElement('div');
    div.textContent = String(str == null ? '' : str);
    return div.innerHTML;
  }

})();
