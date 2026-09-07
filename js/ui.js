/* =========================================================================
   ui.js · utilidades compartidas por los dos modos
   -------------------------------------------------------------------------
   No se arma HTML concatenando strings en ningún lado de esta demo. Todo pasa
   por h(), que crea nodos y mete el texto con createTextNode. Así el nombre y
   la dirección que tipea el cliente no pueden romper el markup ni inyectar
   nada, sin tener que acordarse de escapar en cada lugar.
   ========================================================================= */

window.VB = window.VB || {};

(function () {
  'use strict';

  var fmt = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 });

  /* Agrega hijos: nodos tal cual, cualquier otra cosa como texto plano. */
  function agregar(el, hijos) {
    if (hijos == null || hijos === false || hijos === true) return;
    if (Array.isArray(hijos)) {
      for (var i = 0; i < hijos.length; i++) agregar(el, hijos[i]);
      return;
    }
    if (hijos instanceof Node) { el.appendChild(hijos); return; }
    el.appendChild(document.createTextNode(String(hijos)));
  }

  /*  h('div.tarjeta.grande', { id: 'x', onclick: fn }, ['texto', otroNodo])
      El selector acepta tag + clases separadas por punto. */
  function h(sel, attrs, hijos) {
    var partes = String(sel || 'div').split('.');
    var tag = partes.shift() || 'div';
    var el = document.createElement(tag);
    if (partes.length) el.className = partes.join(' ');

    if (attrs) {
      for (var k in attrs) {
        if (!Object.prototype.hasOwnProperty.call(attrs, k)) continue;
        var v = attrs[k];
        if (v == null || v === false) continue;
        if (k === 'class') { el.className += (el.className ? ' ' : '') + v; }
        else if (k === 'text') { el.textContent = String(v); }
        else if (k === 'dataset') { for (var d in v) el.dataset[d] = v[d]; }
        else if (k.slice(0, 2) === 'on') { el.addEventListener(k.slice(2), v); }
        else if (k === 'disabled' || k === 'checked' || k === 'hidden' || k === 'selected') { el[k] = !!v; }
        else { el.setAttribute(k, v === true ? '' : String(v)); }
      }
    }
    agregar(el, hijos);
    return el;
  }

  function vaciar(el) { while (el && el.firstChild) el.removeChild(el.firstChild); }

  function poner(el, hijos) { vaciar(el); agregar(el, hijos); return el; }

  var ui = {
    h: h,
    vaciar: vaciar,
    poner: poner,

    plata: function (n) { return '$' + fmt.format(Math.round(n || 0)); },

    /* Importe con la marca de "valor de ejemplo" cuando el precio no salió
       del menú publicado por el local. */
    precio: function (n, real) {
      var t = ui.plata(n);
      if (real) return document.createTextNode(t);
      return h('span.demo-dato', {
        title: 'Valor de ejemplo: el local no publica este precio',
        text: t
      });
    },

    /* "hace 3 min" / "hace 1 h 12 min". El dato que hoy en WhatsApp no existe. */
    hace: function (ts) {
      var m = ui.minutos(ts);
      if (m < 1) return 'recién';
      if (m < 60) return 'hace ' + m + ' min';
      return 'hace ' + Math.floor(m / 60) + ' h ' + (m % 60) + ' min';
    },

    minutos: function (ts) { return Math.max(0, Math.floor((Date.now() - ts) / 60000)); },

    rombos: function () {
      return h('span.rombos', { 'aria-hidden': 'true' }, [h('i'), h('i'), h('i')]);
    },

    /* Avisos efímeros. `alerta` los pinta en rojo. */
    toast: function (partes, alerta) {
      var cont = document.getElementById('toasts');
      if (!cont) return;
      var t = h('div.toast' + (alerta ? '.toast--alerta' : ''), null, partes);
      cont.appendChild(t);
      setTimeout(function () {
        t.style.transition = 'opacity .3s';
        t.style.opacity = '0';
        setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 320);
      }, 3800);
    },

    /* Cartel de origen del contenido. Va en los dos modos a propósito: quien
       mire la demo tiene que saber siempre qué es real y qué es de ejemplo. */
    pieDemo: function () {
      var L = VB.LOCAL;
      return [
        h('p', null, [h('strong', { text: 'Demo conceptual.' }),
          ' Hecha para mostrarle el sistema al dueño de Vikings Burger. ' +
          'No está publicada ni conectada a ningún sistema real.']),

        h('p', { style: 'margin-top:10px' }, [
          h('strong', { text: 'Qué es real: ' }),
          'el nombre, el logo, el lema, la zona, los días y horarios, el WhatsApp ' +
          L.whatsapp + ', y las 9 hamburguesas con sus ingredientes y sus precios. ' +
          'Todo tomado del Instagram público ' + L.instagram + ' (menú publicado el 21/08/2026).']),

        h('p', { style: 'margin-top:10px' }, [
          h('strong', { text: 'Qué es de ejemplo' }),
          ' y hay que reemplazar: acompañamientos, bebidas, agregados y sus precios; ' +
          'los pedidos, nombres y direcciones del tablero; los cupos por franja; ' +
          'los medios de pago. Los importes de ejemplo van ',
          h('span.demo-dato', { text: 'subrayados con puntos' }), '.']),

        h('div.pie__ops', null, [h('i', { 'aria-hidden': 'true' }), h('b', { text: 'Operon' })])
      ];
    }
  };

  VB.ui = ui;
})();
