/* =========================================================================
   app.js · arranque, cambio de modo y controles de la demostración
   ========================================================================= */

(function () {
  'use strict';

  var h = VB.ui.h, poner = VB.ui.poner, ui = VB.ui;
  var store = VB.store;

  var vistas = {
    central: document.getElementById('vista-central'),
    cliente: document.getElementById('vista-cliente')
  };

  function irA(modo) {
    store.set(function (s) {
      s.modo = modo;
      /* Si el pedido anterior ya se confirmó, al volver al modo cliente se
         arranca de nuevo desde el menú en lugar de quedar mirando el sello
         de un pedido que ya está cocinándose. */
      if (modo === 'cliente' && s.paso === 'exito' && !s.carrito.items.length) s.paso = 'menu';
    });
    VB.cliente.cerrarHoja();
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  function pintarModo() {
    var m = store.get().modo;
    Object.keys(vistas).forEach(function (k) { vistas[k].classList.toggle('oculto', k !== m); });
    document.querySelectorAll('.modos__b').forEach(function (b) {
      b.setAttribute('aria-pressed', b.dataset.modo === m ? 'true' : 'false');
    });

    /* La barra de arriba es la misma en los dos modos, así que el subtítulo
       tiene que decir en cuál estás parado. */
    document.querySelector('.marca__sub').textContent =
      m === 'central' ? 'Central de pedidos' : 'Hacé tu pedido';

    /* Los escenarios son del tablero: en el modo cliente sólo estorban. */
    document.querySelectorAll('[data-escenario]').forEach(function (b) {
      b.classList.toggle('oculto', m !== 'central');
    });

    document.title = (m === 'central' ? 'Central de pedidos' : 'Hacé tu pedido') +
      ' — Vikings Burger (demo)';
  }

  /* Un pedido recién entrado destella una vez y después se calma. */
  function limpiarEntrando() {
    if (!store.get().pedidos.some(function (p) { return p.entrando; })) return;
    setTimeout(function () {
      store.set(function (s) { s.pedidos.forEach(function (p) { delete p.entrando; }); });
    }, 600);
  }

  function render() {
    pintarModo();
    VB.central.render();
    VB.cliente.render();
    limpiarEntrando();
  }

  /* --------------------------------------------------------- CONTROLES */
  document.querySelectorAll('.modos__b').forEach(function (b) {
    b.addEventListener('click', function () { irA(b.dataset.modo); });
  });

  document.querySelectorAll('[data-escenario]').forEach(function (b) {
    b.addEventListener('click', function () {
      var clave = b.dataset.escenario;
      store.cargarEscenario(clave);
      store.set(function (s) { s.modo = 'central'; });
      ui.toast(['Escenario: ', h('b', { text: VB.ESCENARIOS[clave].nombre })]);
    });
  });

  document.getElementById('reset').addEventListener('click', function () {
    store.reset();
    ui.toast(['Demo restablecida. Volvió al arranque con la cola normal.']);
  });

  VB.central.conectar();
  VB.cliente.conectar();

  /* Los pies con la procedencia del contenido: se arman una sola vez. */
  poner(document.getElementById('pie-central'), ui.pieDemo());
  poner(document.getElementById('pie-cliente'), ui.pieDemo());

  /* "hace N min" se actualiza solo, sin redibujar las tarjetas: si redibujáramos
     entero cada 30 s se perdería el foco de un botón a medio apretar. */
  setInterval(function () {
    document.querySelectorAll('[data-ts]').forEach(function (el) {
      el.textContent = ui.hace(Number(el.dataset.ts));
    });
  }, 30000);

  store.on(render);
  render();

  if (!store.almacenDisponible()) {
    ui.toast(['Este navegador no deja guardar nada: la demo funciona igual, ' +
      'pero se reinicia al refrescar.'], true);
  }

  VB.app = { irA: irA, render: render };
})();
