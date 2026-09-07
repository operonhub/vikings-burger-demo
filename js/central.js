/* =========================================================================
   central.js · el tablero que usarían el dueño y su papá durante un pico
   -------------------------------------------------------------------------
   Tres zonas fijas — Nuevos, Cocina, Reparto — porque son los tres momentos
   en los que hoy se pierde información en el WhatsApp:
     1. entra un pedido y nadie confirmó si se toma;
     2. está cocinándose y no se sabe para qué hora era;
     3. está listo y sale suelto, sin agrupar por zona.
   ========================================================================= */

window.VB = window.VB || {};

(function () {
  'use strict';

  var h = VB.ui.h, poner = VB.ui.poner, ui = VB.ui;
  var store = VB.store;

  var tabActiva = 'nuevos';
  var anchoEscritorio = window.matchMedia('(min-width: 900px)');

  /* ------------------------------------------------------------ HORARIOS */
  function sumarMin(hhmm, min) {
    var p = hhmm.split(':');
    var t = parseInt(p[0], 10) * 60 + parseInt(p[1], 10) + min;
    var hh = Math.floor(t / 60) % 24, mm = t % 60;
    return (hh < 10 ? '0' : '') + hh + ':' + (mm < 10 ? '0' : '') + mm;
  }

  function horaPrometida(p) {
    return p.demora ? sumarMin(p.franja, p.demoraMin || 15) : p.franja;
  }

  /* --------------------------------------------------------- SELECCIONES */
  function porEstado(e) {
    return store.get().pedidos.filter(function (p) { return p.estado === e; });
  }

  /* En Nuevos manda el que más espera: es el que está por perderse. */
  function ordenEspera(a, b) { return a.creado - b.creado; }

  /* En Cocina manda la franja comprometida, no el orden de llegada. Es la
     única prioridad real: lo que sale a las 20:00 va antes que lo de 21:30
     aunque haya entrado después. */
  function ordenFranja(a, b) {
    if (a.franja !== b.franja) return a.franja < b.franja ? -1 : 1;
    return a.creado - b.creado;
  }

  function ruta(p) {
    var z = store.zona(p.zona);
    return z ? z.ruta : null;
  }

  /* ---------------------------------------------------------- ACCIONES */
  function mover(codigo, estado, aviso, alerta) {
    store.set(function (s) {
      s.pedidos.forEach(function (p) {
        if (p.codigo === codigo) { p.estado = estado; p.tocado = Date.now(); }
      });
    });
    if (aviso) ui.toast(aviso, alerta);
  }

  /* -----------------------------------------------------------------------
     DECISIÓN DE NEGOCIO: qué significa "marcar demora".
     Hoy: el pedido se queda donde está y se le corren 15 minutos a la hora
     comprometida, así el cliente sabe la nueva hora y la cocina mantiene la
     prioridad. No libera el cupo ni lo pasa a otra franja.
     Si en el local conviene otra cosa (pasarlo a la franja siguiente, o
     avisarle al cliente y esperar respuesta), se cambia sólo acá.
     -------------------------------------------------------------------- */
  function marcarDemora(codigo) {
    var nueva = null;
    store.set(function (s) {
      s.pedidos.forEach(function (p) {
        if (p.codigo !== codigo) return;
        p.demora = true;
        p.demoraMin = (p.demoraMin || 0) + 15;
        nueva = horaPrometida(p);
      });
    });
    ui.toast([codigo + ' pasa a las ', h('b', { text: nueva }), '. Avisale al cliente.']);
  }

  function rechazarPorCupo(codigo) {
    store.set(function (s) {
      s.pedidos.forEach(function (p) {
        if (p.codigo === codigo) { p.estado = 'rechazado'; p.tocado = Date.now(); }
      });
      s.rechazados = (s.rechazados || 0) + 1;
    });
    ui.toast([h('b', { text: codigo }), ' rechazado. El cupo de esa franja queda libre otra vez.'], true);
  }

  function salirVuelta(codigos) {
    store.set(function (s) {
      s.pedidos.forEach(function (p) {
        if (codigos.indexOf(p.codigo) !== -1) { p.estado = 'en_reparto'; p.tocado = Date.now(); }
      });
    });
    ui.toast([h('b', { text: codigos.length + ' pedidos' }), ' salieron juntos. Una sola vuelta.']);
  }

  /* ============================================================ RENDER */

  function chipEstado(p) {
    if (p.demora) {
      return h('span.estado.estado--demora', null, [
        h('span.estado__g', { 'aria-hidden': 'true', text: '!' }),
        'Demora +' + (p.demoraMin || 15)
      ]);
    }
    var e = VB.ESTADOS[p.estado];
    return h('span.estado.estado--' + p.estado, null, [
      h('span.estado__g', { 'aria-hidden': 'true', text: e.icono }),
      e.nombre
    ]);
  }

  function tarjeta(p, acciones) {
    var esperando = ui.minutos(p.creado);
    var viejo = p.estado === 'nuevo' && esperando >= 10;
    var z = store.zona(p.zona);
    var pago = store.pago(p.pago);
    var total = store.total(p.items);

    var meta = [chipEstado(p)];

    if (p.entrega === 'retiro') {
      meta.push(h('span.tag.tag--retiro', { text: 'Retira en el local' }));
    } else {
      meta.push(h('span.tag.tag--zona', { text: z ? z.nombre : 'Sin zona' }));
    }

    meta.push(h('span.tag.tag--hora', { text: 'Entrega ' + horaPrometida(p) }));
    if (pago) meta.push(h('span.tag', { text: pago.nombre }));
    meta.push(h('span.tag.tag--plata', null, [ui.precio(total, !store.tienePrecioDemo(p.items))]));

    var cuerpo = [
      h('div.pd__cab', null, [
        h('span.pd__cod', { text: p.codigo }),
        /* Marca de dónde vino. Es media hoja del pitch: este pedido entró
           completo y solo, sin que nadie tipeara nada en un chat. */
        p.origen === 'cliente'
          ? h('span.et-demo', { title: 'Entró por la web, no por WhatsApp', text: 'Por la web' })
          : null,
        h('span.pd__t' + (viejo ? '.pd__t--viejo' : ''), {
          dataset: { ts: p.creado }, text: ui.hace(p.creado)
        })
      ]),
      h('div.pd__nombre', { text: p.cliente }),
      h('div.pd__items', { text: store.resumen(p.items) })
    ];

    if (p.entrega === 'delivery' && p.dir) {
      cuerpo.push(h('div.pd__items', { style: 'color:var(--hueso-3)', text: p.dir }));
    }
    if (p.nota) cuerpo.push(h('div.pd__nota', { text: p.nota }));

    cuerpo.push(h('div.pd__meta', null, meta));
    if (acciones && acciones.length) cuerpo.push(h('div.pd__acciones', null, acciones));

    var clases = '.pd.pd--' + p.estado;
    if (p.entrando) clases += '.pd--entrando';
    return h('article' + clases, { dataset: { cod: p.codigo } }, cuerpo);
  }

  function vacio(titulo, texto) {
    return h('div.vacio', null, [h('div.vacio__t', { text: titulo }), h('p', { text: texto })]);
  }

  /* ------------------------------------------------------- CONTROL NOCHE */
  function renderControl() {
    var s = store.get();
    var nuevos = porEstado('nuevo').length;
    var enCola = s.pedidos.filter(function (p) {
      return ['nuevo', 'cocina', 'listo', 'en_reparto'].indexOf(p.estado) !== -1;
    }).length;
    var entregados = porEstado('entregado').length;

    document.getElementById('control-sub').textContent =
      VB.LOCAL.dias + ' · ' + VB.LOCAL.horario + ' · ' + VB.LOCAL.ubicacion;

    function cifra(et, valor, sufijo, mod) {
      return h('div.cifra' + (mod || ''), null, [
        h('div.cifra__et', { text: et }),
        h('div.cifra__v', null, [String(valor), sufijo ? h('small', { text: ' ' + sufijo }) : null])
      ]);
    }

    poner(document.getElementById('control-cifras'), [
      cifra('Sin confirmar', nuevos, nuevos === 1 ? 'pedido' : 'pedidos', nuevos >= 3 ? '.cifra--alerta' : ''),
      cifra('En la cola', enCola, 'activos'),
      cifra('Demora que se avisa', s.demora, 'min', s.demora >= 45 ? '.cifra--alerta' : ''),
      cifra('Entregados', entregados, 'esta noche', entregados > 0 ? '.cifra--ok' : '')
    ]);

    document.getElementById('pausar').checked = !!s.pausado;

    /* Franjas */
    poner(document.getElementById('franjas'), store.franjas().map(function (f) {
      var mod = f.llena ? '.fr--llena' : (f.libres <= 2 ? '.fr--justa' : '.fr--holgada');
      return h('button.fr' + mod, {
        type: 'button',
        'aria-pressed': f.forzada ? 'true' : 'false',
        title: f.llena
          ? 'Franja cerrada. Tocá para volver a abrirla.'
          : 'Quedan ' + f.libres + ' de ' + f.cap + '. Tocá para cerrarla.',
        onclick: function () {
          store.set(function (st) { st.slots[f.id].forzada = !st.slots[f.id].forzada; });
          var d = store.franja(f.id);
          ui.toast(d.llena
            ? ['Franja ', h('b', { text: f.id }), ' cerrada. El cliente ya no la puede elegir.']
            : ['Franja ', h('b', { text: f.id }), ' abierta otra vez.'], d.llena);
        }
      }, [
        h('span.fr__h', { text: f.id }),
        h('span.fr__c', { text: f.llena ? 'Completa' : f.tomados + ' / ' + f.cap })
      ]);
    }));

    /* Avisos */
    var avisos = [];

    if (s.pausado) {
      avisos.push(h('div.aviso.aviso--rojo', null, [
        h('span.aviso__ico', { 'aria-hidden': 'true', text: '!' }),
        h('span', null, [h('b', { text: 'Pedidos en pausa. ' }),
          'El cliente ve el menú y los precios, pero no puede confirmar. ' +
          'Sirve para frenar la entrada sin cerrar el local.'])
      ]));
    }

    var llenas = store.franjas().filter(function (f) { return f.llena; }).map(function (f) { return f.id; });
    if (llenas.length) {
      avisos.push(h('div.aviso.aviso--oro', null, [
        h('span.aviso__ico', { 'aria-hidden': 'true', text: '#' }),
        h('span', null, [
          h('b', { text: llenas.join(' y ') + (llenas.length > 1 ? ' completas. ' : ' completa. ') }),
          'El cliente ya no las ve disponibles. No entran más pedidos para esa hora.'])
      ]));
    }

    var demorados = porEstado('nuevo').filter(function (p) { return ui.minutos(p.creado) >= 10; });
    if (demorados.length) {
      avisos.push(h('div.aviso.aviso--rojo', null, [
        h('span.aviso__ico', { 'aria-hidden': 'true', text: '!' }),
        h('span', null, demorados.length === 1
          ? [h('b', { text: '1 pedido espera ' }), 'hace más de 10 minutos sin que nadie lo confirme.']
          : [h('b', { text: demorados.length + ' pedidos esperan ' }), 'hace más de 10 minutos sin que nadie los confirme.'])
      ]));
    }

    poner(document.getElementById('avisos'), avisos);
  }

  /* --------------------------------------------------------------- TABS */
  function renderTabs() {
    var cuentas = {
      nuevos: porEstado('nuevo').length,
      cocina: porEstado('cocina').length,
      reparto: porEstado('listo').length + porEstado('en_reparto').length
    };
    var titulos = { nuevos: 'Nuevos', cocina: 'Cocina', reparto: 'Reparto' };

    poner(document.getElementById('tabs'), Object.keys(titulos).map(function (k) {
      return h('button.tabs__b', {
        type: 'button', role: 'tab', id: 'tab-' + k,
        'aria-selected': tabActiva === k ? 'true' : 'false',
        onclick: function () { tabActiva = k; render(); }
      }, [h('i', { text: String(cuentas[k]) }), h('b', { text: titulos[k] })]);
    }));

    /* Las tabs existen sólo en pantalla chica. En escritorio las tres columnas
       se ven juntas, así que ninguna queda con hidden: taparlo desde el CSS
       dejaría el atributo puesto y un lector de pantalla se saltearía dos
       tercios del tablero. */
    var enTabs = !anchoEscritorio.matches;
    document.querySelectorAll('#tablero .col').forEach(function (col) {
      col.hidden = enTabs && col.dataset.col !== tabActiva;
    });

    Object.keys(cuentas).forEach(function (k) {
      var el = document.querySelector('[data-cuenta="' + k + '"]');
      if (el) el.textContent = cuentas[k] + (cuentas[k] === 1 ? ' pedido' : ' pedidos');
    });
  }

  /* ---------------------------------------------------------- COLUMNAS */
  function renderNuevos() {
    var lista = porEstado('nuevo').sort(ordenEspera);
    var cont = document.getElementById('col-nuevos');

    if (!lista.length) {
      poner(cont, vacio('Sin pedidos nuevos',
        'Todo lo que entró ya está confirmado. Cuando llegue uno aparece acá arriba.'));
      return;
    }

    poner(cont, lista.map(function (p) {
      return tarjeta(p, [
        h('button.b.b--ch.b--pri', {
          type: 'button',
          onclick: function () { mover(p.codigo, 'cocina', [h('b', { text: p.codigo }), ' aceptado. Pasa a cocina.']); }
        }, 'Aceptar'),
        h('button.b.b--ch', { type: 'button', onclick: function () { marcarDemora(p.codigo); } }, 'Marcar demora'),
        h('button.b.b--ch.b--peligro', {
          type: 'button', onclick: function () { rechazarPorCupo(p.codigo); }
        }, 'Rechazar por cupo')
      ]);
    }));
  }

  function renderCocina() {
    var lista = porEstado('cocina').sort(ordenFranja);
    var cont = document.getElementById('col-cocina');

    if (!lista.length) {
      poner(cont, vacio('Cocina libre',
        'No hay nada en preparación. Los pedidos que aceptes aparecen acá, ordenados por la hora que prometiste.'));
      return;
    }

    var nodos = [];
    var franjaAnterior = null;

    lista.forEach(function (p) {
      /* Encabezado por franja: la cocina cocina por hora de entrega. */
      if (p.franja !== franjaAnterior) {
        franjaAnterior = p.franja;
        nodos.push(h('div.franjas__cab', { style: 'margin:14px 0 8px' }, [
          h('h3', { text: 'Sale ' + p.franja }),
          h('span', { text: lista.filter(function (q) { return q.franja === p.franja; }).length + ' en esta franja' })
        ]));
      }
      var retira = p.entrega === 'retiro';
      nodos.push(tarjeta(p, [
        h('button.b.b--ch.b--pri', {
          type: 'button',
          onclick: function () {
            mover(p.codigo, 'listo', [h('b', { text: p.codigo }), retira
              ? ' listo. Esperando que lo retiren.'
              : ' listo. Pasa a reparto.']);
          }
        }, retira ? 'Listo para retirar' : 'Listo para reparto'),
        h('button.b.b--ch', { type: 'button', onclick: function () { marcarDemora(p.codigo); } }, 'Marcar demora')
      ]));
    });

    poner(cont, nodos);
  }

  function renderReparto() {
    var listos = porEstado('listo').sort(ordenFranja);
    var enCalle = porEstado('en_reparto').sort(ordenFranja);
    var cont = document.getElementById('col-reparto');

    /* ------- Próxima vuelta: hasta 3 pedidos de la misma ruta ------- */
    var porRuta = { A: [], B: [] };
    listos.forEach(function (p) { var r = ruta(p); if (r) porRuta[r].push(p); });
    var mejor = porRuta.A.length >= porRuta.B.length ? 'A' : 'B';
    var vuelta = porRuta[mejor].slice(0, 3);

    var cVuelta = document.getElementById('vuelta');

    if (vuelta.length >= 2) {
      var codigos = vuelta.map(function (p) { return p.codigo; });
      poner(cVuelta, h('div.vuelta', null, [
        h('div.vuelta__cab', null, [ui.rombos(), h('h3', { text: 'Próxima vuelta' })]),
        h('p.vuelta__sub', {
          text: vuelta.length + ' pedidos que quedan cerca · ' + VB.RUTAS[mejor]
        }),
        h('div.vuelta__lista', null, vuelta.map(function (p) {
          var z = store.zona(p.zona);
          return h('div.vuelta__it', null, [
            h('b', { text: p.codigo }),
            h('span', { style: 'margin-left:0;color:var(--hueso)', text: z ? z.nombre : '' }),
            h('span', { text: p.dir })
          ]);
        })),
        h('button.b.b--pri.b--bloque', {
          type: 'button', onclick: function () { salirVuelta(codigos); }
        }, 'Salir con esta vuelta')
      ]));
    } else {
      poner(cVuelta, []);
    }

    /* ---------------------- Listos, agrupados por zona ---------------- */
    if (!listos.length && !enCalle.length) {
      poner(cont, vacio('Nada para salir',
        'Cuando la cocina marque un pedido como listo, aparece acá agrupado por zona.'));
      return;
    }

    var nodos = [];
    var grupos = [
      { et: 'Ruta ' + VB.RUTAS.A, ps: listos.filter(function (p) { return ruta(p) === 'A'; }) },
      { et: 'Ruta ' + VB.RUTAS.B, ps: listos.filter(function (p) { return ruta(p) === 'B'; }) },
      { et: 'Retiran en el local', ps: listos.filter(function (p) { return p.entrega === 'retiro'; }) }
    ];

    grupos.forEach(function (g) {
      if (!g.ps.length) return;
      nodos.push(h('div.franjas__cab', { style: 'margin:14px 0 8px' }, [
        h('h3', { text: g.et }),
        h('span', { text: g.ps.length + (g.ps.length === 1 ? ' pedido' : ' pedidos') })
      ]));
      g.ps.forEach(function (p) {
        nodos.push(tarjeta(p, [
          p.entrega === 'retiro'
            ? h('button.b.b--ch.b--ok', {
                type: 'button',
                onclick: function () { mover(p.codigo, 'entregado', [h('b', { text: p.codigo }), ' retirado.']); }
              }, 'Lo retiró')
            : h('button.b.b--ch.b--pri', {
                type: 'button',
                onclick: function () { mover(p.codigo, 'en_reparto', [h('b', { text: p.codigo }), ' salió a reparto.']); }
              }, 'En reparto')
        ]));
      });
    });

    if (enCalle.length) {
      nodos.push(h('div.franjas__cab', { style: 'margin:18px 0 8px' }, [
        h('h3', { text: 'En la calle' }),
        h('span', { text: enCalle.length + (enCalle.length === 1 ? ' pedido' : ' pedidos') })
      ]));
      enCalle.forEach(function (p) {
        nodos.push(tarjeta(p, [
          h('button.b.b--ch.b--ok', {
            type: 'button',
            onclick: function () { mover(p.codigo, 'entregado', [h('b', { text: p.codigo }), ' entregado.']); }
          }, 'Entregado')
        ]));
      });
    }

    poner(cont, nodos);
  }

  /* ------------------------------------------------------- ENTREGADOS */
  function renderEntregados() {
    var s = store.get();
    var lista = porEstado('entregado').sort(function (a, b) { return (b.tocado || 0) - (a.tocado || 0); });
    var rech = s.rechazados || 0;
    var cont = document.getElementById('entregados');

    if (!lista.length && !rech) { poner(cont, []); return; }

    var hijos = [h('button.entregados__b', {
      type: 'button', 'aria-expanded': s.verEntregados ? 'true' : 'false',
      onclick: function () { store.set(function (st) { st.verEntregados = !st.verEntregados; }); }
    }, [
      h('h3', { text: 'Cerrados esta noche' }),
      h('span', {
        style: 'font-size:12px;color:var(--hueso-3)',
        text: lista.length + (lista.length === 1 ? ' entregado' : ' entregados') +
              (rech ? ' · ' + rech + (rech === 1 ? ' rechazado' : ' rechazados') + ' por cupo' : '')
      }),
      /* Sin entregados no hay nada que desplegar: no se ofrece el desplegable. */
      lista.length ? h('i', { text: s.verEntregados ? 'Ocultar ▲' : 'Ver ▼' }) : null
    ])];

    if (s.verEntregados && lista.length) {
      hijos.push(h('div.entregados__lista', null, lista.map(function (p) {
        var z = store.zona(p.zona);
        return h('div.entregados__it', null, [
          h('b', { text: p.codigo }),
          h('span', { style: 'margin-left:0', text: p.cliente }),
          h('span', { text: (p.entrega === 'retiro' ? 'Retiró' : (z ? z.nombre : '')) + ' · ' + horaPrometida(p) })
        ]);
      })));
    }

    poner(cont, hijos);
  }

  /* -------------------------------------------------------------- RENDER */
  function render() {
    if (store.get().modo !== 'central') return;
    renderControl();
    renderTabs();
    renderNuevos();
    renderCocina();
    renderReparto();
    renderEntregados();
  }

  VB.central = {
    render: render,
    horaPrometida: horaPrometida,
    conectar: function () {
      document.getElementById('pausar').addEventListener('change', function (e) {
        var v = e.target.checked;
        store.set(function (s) { s.pausado = v; });
        ui.toast(v
          ? ['Entrada de pedidos ', h('b', { text: 'en pausa' }), '. El cliente no puede confirmar.']
          : ['Entrada de pedidos ', h('b', { text: 'reabierta' }), '.'], v);
      });

      document.getElementById('mas-demora').addEventListener('click', function () {
        store.set(function (s) { s.demora = Math.min(120, s.demora + 10); });
        ui.toast(['Demora estimada: ', h('b', { text: store.get().demora + ' min' }),
          '. El cliente la ve antes de confirmar.']);
      });

      document.getElementById('menos-demora').addEventListener('click', function () {
        store.set(function (s) { s.demora = Math.max(10, s.demora - 10); });
      });

      /* Al cruzar el ancho de escritorio hay que rehacer el tablero: es donde
         las tabs dejan de existir y las tres columnas pasan a verse juntas. */
      var alCambiar = function () { render(); };
      if (anchoEscritorio.addEventListener) anchoEscritorio.addEventListener('change', alCambiar);
      else anchoEscritorio.addListener(alCambiar);
    }
  };
})();
