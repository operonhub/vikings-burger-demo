/* =========================================================================
   store.js · estado único de la demo
   -------------------------------------------------------------------------
   Un solo objeto de estado para los dos modos. Es la idea que se le vende al
   dueño: el cliente, la cocina y el reparto miran LA MISMA cola. Acá eso es
   literal — el modo cliente y la central escriben sobre el mismo `pedidos`.
   Se guarda en localStorage para que sobreviva un refresh; si el navegador
   lo bloquea (modo privado, file:// restringido) sigue funcionando en memoria.
   ========================================================================= */

window.VB = window.VB || {};

(function () {
  'use strict';

  var CLAVE = 'vikings_central_demo_v1';
  var suscriptores = [];
  var estado = null;
  var almacenOk = true;

  VB.ESTADOS = {
    nuevo:      { nombre: 'Sin confirmar', col: 'nuevos',  icono: '!' },
    cocina:     { nombre: 'En cocina',     col: 'cocina',  icono: '~' },
    listo:      { nombre: 'Listo',         col: 'reparto', icono: '#' },
    en_reparto: { nombre: 'En la calle',   col: 'reparto', icono: '>' },
    entregado:  { nombre: 'Entregado',     col: null,      icono: 'v' },
    rechazado:  { nombre: 'Rechazado',     col: null,      icono: 'x' }
  };

  function slotsDesde(llenas) {
    var s = {};
    VB.SLOTS_BASE.forEach(function (b) {
      s[b.id] = { cap: b.cap, forzada: llenas.indexOf(b.id) !== -1 };
    });
    return s;
  }

  function carritoVacio() {
    return {
      items: [], entrega: 'delivery', zona: '', dir: '', ref: '',
      pago: '', franja: '', nombre: '', tel: '', nota: ''
    };
  }

  function montarEscenario(clave) {
    var esc = VB.ESCENARIOS[clave];
    var ahora = Date.now();
    var maxNum = 100;
    var pedidos = esc.pedidos.map(function (p) {
      var copia = JSON.parse(JSON.stringify(p));
      copia.creado = ahora - copia.hace * 60000;
      delete copia.hace;
      var n = parseInt(copia.codigo.split('-')[1], 10);
      if (n > maxNum) maxNum = n;
      return copia;
    });
    return {
      v: 1,
      escenario: clave,
      modo: 'central',
      pausado: false,
      demora: esc.demora,
      slots: slotsDesde(esc.llenas),
      pedidos: pedidos,
      seq: maxNum + 1,
      rechazados: 0,
      carrito: carritoVacio(),
      paso: 'menu',
      ultimoPedido: null,
      verEntregados: false
    };
  }

  function cargar() {
    try {
      var crudo = localStorage.getItem(CLAVE);
      if (crudo) {
        var p = JSON.parse(crudo);
        if (p && p.v === 1 && Array.isArray(p.pedidos)) return p;
      }
    } catch (e) { almacenOk = false; }
    return montarEscenario('normal');
  }

  function guardar() {
    if (!almacenOk) return;
    try { localStorage.setItem(CLAVE, JSON.stringify(estado)); }
    catch (e) { almacenOk = false; }
  }

  var store = {
    get: function () { return estado; },

    set: function (fn) {
      var r = fn(estado);
      if (r) estado = r;
      guardar();
      suscriptores.forEach(function (s) { s(estado); });
      return estado;
    },

    /* Igual que set() pero sin avisar a nadie. Es para lo que se tipea en un
       input: si redibujáramos en cada tecla, el campo perdería el foco y el
       cursor saltaría al principio. Se guarda igual, así sobrevive el refresh. */
    setSilencioso: function (fn) { fn(estado); guardar(); return estado; },

    on: function (fn) { suscriptores.push(fn); },

    cargarEscenario: function (clave) {
      store.set(function () { return montarEscenario(clave); });
    },

    reset: function () {
      try { localStorage.removeItem(CLAVE); } catch (e) {}
      store.set(function () { return montarEscenario('normal'); });
    },

    almacenDisponible: function () { return almacenOk; }
  };

  store.tomados = function (franja) {
    return estado.pedidos.filter(function (p) {
      return p.franja === franja && p.estado !== 'rechazado';
    }).length;
  };

  store.franja = function (id) {
    var s = estado.slots[id];
    var t = store.tomados(id);
    return { id: id, cap: s.cap, tomados: t, forzada: s.forzada,
             llena: s.forzada || t >= s.cap, libres: Math.max(0, s.cap - t) };
  };

  store.franjas = function () {
    return VB.SLOTS_BASE.map(function (b) { return store.franja(b.id); });
  };

  var indice = null;
  store.producto = function (id) {
    if (!indice) {
      indice = {};
      ['burgers', 'compartir', 'bebidas'].forEach(function (k) {
        VB.MENU[k].forEach(function (p) { indice[p.id] = p; });
      });
    }
    return indice[id];
  };

  store.extra = function (id) {
    for (var i = 0; i < VB.EXTRAS.length; i++) if (VB.EXTRAS[i].id === id) return VB.EXTRAS[i];
    return null;
  };

  store.zona = function (id) {
    for (var i = 0; i < VB.ZONAS.length; i++) if (VB.ZONAS[i].id === id) return VB.ZONAS[i];
    return null;
  };

  store.pago = function (id) {
    for (var i = 0; i < VB.PAGOS.length; i++) if (VB.PAGOS[i].id === id) return VB.PAGOS[i];
    return null;
  };

  store.precioLinea = function (linea) {
    var p = store.producto(linea.id);
    if (!p) return 0;
    var extras = (linea.extras || []).reduce(function (a, e) {
      var x = store.extra(e); return a + (x ? x.precio : 0);
    }, 0);
    return (p.precio + extras) * linea.cant;
  };

  store.total = function (items) {
    return (items || []).reduce(function (a, l) { return a + store.precioLinea(l); }, 0);
  };

  store.unidades = function (items) {
    return (items || []).reduce(function (a, l) { return a + l.cant; }, 0);
  };

  store.resumen = function (items) {
    return (items || []).map(function (l) {
      var p = store.producto(l.id);
      var t = l.cant + '× ' + (p ? p.nombre : l.id);
      if (l.extras && l.extras.length) {
        t += ' +' + l.extras.map(function (e) {
          var x = store.extra(e);
          return x ? x.nombre.replace(/ extra$/, '').toLowerCase() : e;
        }).join(' +');
      }
      return t;
    }).join(' · ');
  };

  store.tienePrecioDemo = function (items) {
    return (items || []).some(function (l) {
      var p = store.producto(l.id);
      return (p && !p.real) || (l.extras && l.extras.length > 0);
    });
  };

  estado = cargar();
  VB.store = store;
})();
