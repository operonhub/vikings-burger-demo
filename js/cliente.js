/* =========================================================================
   cliente.js · el flujo de pedido, pensado para un celular
   -------------------------------------------------------------------------
   Lo que resuelve respecto del WhatsApp de hoy: el pedido, la dirección, el
   pago y la hora entran juntos y completos en un solo movimiento, y la hora
   sólo se puede elegir entre las que todavía tienen cupo.
   ========================================================================= */

window.VB = window.VB || {};

(function () {
  'use strict';

  var h = VB.ui.h, poner = VB.ui.poner, ui = VB.ui;
  var store = VB.store;

  var catActiva = 'burgers';
  var extrasAbiertos = {};   // qué tarjeta tiene el panel de agregados desplegado
  var errores = {};

  /* ------------------------------------------------------------ CARRITO */
  function linea(id) {
    var c = store.get().carrito;
    for (var i = 0; i < c.items.length; i++) if (c.items[i].id === id) return c.items[i];
    return null;
  }

  function cantidad(id) { var l = linea(id); return l ? l.cant : 0; }

  function sumar(id, delta) {
    store.set(function (s) {
      var items = s.carrito.items;
      var l = null;
      for (var i = 0; i < items.length; i++) if (items[i].id === id) l = items[i];
      if (!l) {
        if (delta <= 0) return;
        items.push({ id: id, cant: delta, extras: [], nota: '' });
        return;
      }
      l.cant += delta;
      if (l.cant <= 0) s.carrito.items = items.filter(function (x) { return x.id !== id; });
    });
  }

  function quitar(id) {
    store.set(function (s) {
      s.carrito.items = s.carrito.items.filter(function (x) { return x.id !== id; });
    });
  }

  function alternarExtra(id, extraId) {
    store.set(function (s) {
      s.carrito.items.forEach(function (l) {
        if (l.id !== id) return;
        var i = l.extras.indexOf(extraId);
        if (i === -1) l.extras.push(extraId); else l.extras.splice(i, 1);
      });
    });
  }

  /* ------------------------------------------------------ ESTADO DEL LOCAL */
  function estadoLocal() {
    var s = store.get();
    if (s.pausado) return { clave: 'pausa', texto: 'Pausado ahora' };
    var libres = store.franjas().filter(function (f) { return !f.llena; });
    if (!libres.length) return { clave: 'pausa', texto: 'Sin cupos por hoy' };
    if (libres.length <= 2) return { clave: 'justo', texto: 'Cupos limitados' };
    return { clave: 'abierto', texto: 'Abierto' };
  }

  function puedeConfirmar() {
    var s = store.get();
    if (s.pausado) return false;
    return store.franjas().some(function (f) { return !f.llena; });
  }

  /* ============================================================== MENÚ */
  function tarjetaProducto(p, esBurger) {
    var cant = cantidad(p.id);
    var l = linea(p.id);
    var abierto = !!extrasAbiertos[p.id];

    var nombre = [p.nombre];
    if (p.tipo) nombre.push(h('span.prod__tipo', { text: p.tipo }));
    if (!p.real) nombre.push(h('span.et-demo', { title: 'Producto de ejemplo: el local no lo publica', text: 'Demo' }));

    var izq = [h('h3.prod__nom', null, nombre)];
    if (p.ing) izq.push(h('p.prod__ing', { text: p.ing }));

    var pie = [h('span.prod__precio', null, [ui.precio(p.precio, p.real)])];
    if (esBurger) pie.push(h('span.prod__papas', { text: 'Viene con papas' }));
    if (esBurger && cant > 0) {
      pie.push(h('button.prod__extras-b', {
        type: 'button',
        'aria-expanded': abierto ? 'true' : 'false',
        onclick: function () { extrasAbiertos[p.id] = !abierto; render(); }
      }, abierto ? 'Cerrar agregados' : 'Agregados y aclaraciones'));
    }
    izq.push(h('div.prod__pie', null, pie));

    var der = cant > 0
      ? h('div.cant', null, [
          h('button.cant__b', {
            type: 'button', 'aria-label': 'Quitar uno de ' + p.nombre,
            onclick: function () { sumar(p.id, -1); }
          }, '−'),
          h('span.cant__v', { 'aria-live': 'polite', text: String(cant) }),
          h('button.cant__b', {
            type: 'button', 'aria-label': 'Agregar uno de ' + p.nombre,
            onclick: function () { sumar(p.id, 1); }
          }, '+')
        ])
      : h('button.b.b--pri.prod__agregar', {
          type: 'button', onclick: function () { sumar(p.id, 1); }
        }, 'Agregar');

    var hijos = [h('div', null, izq), h('div.prod__der', null, [der])];

    if (esBurger && cant > 0 && abierto) {
      hijos.push(h('div.extras', null, [
        h('div.extras__t', { text: 'Agregados' }),
        h('div.extras__grid', null, VB.EXTRAS.map(function (x) {
          var puesto = l && l.extras.indexOf(x.id) !== -1;
          return h('label.chkx', null, [
            h('input', {
              type: 'checkbox', checked: puesto,
              onchange: function () { alternarExtra(p.id, x.id); }
            }),
            h('span', null, [x.nombre + ' ', ui.precio(x.precio, false)])
          ]);
        })),
        h('label.campo', null, [
          h('span.campo__et', { text: 'Aclaración para la cocina' }),
          h('input.entrada', {
            type: 'text', value: l ? l.nota : '',
            placeholder: 'Ej: sin cebolla, cheddar bien derretido',
            oninput: function (e) {
              var v = e.target.value;
              store.setSilencioso(function (s) {
                s.carrito.items.forEach(function (it) { if (it.id === p.id) it.nota = v; });
              });
            }
          })
        ])
      ]));
    }

    return h('article.prod' + (cant > 0 ? '.prod--elegido' : ''), null, hijos);
  }

  function renderMenu() {
    poner(document.getElementById('catnav'), VB.CATEGORIAS.map(function (c) {
      return h('button.catnav__b', {
        type: 'button', role: 'tab',
        'aria-selected': catActiva === c.id ? 'true' : 'false',
        onclick: function () { catActiva = c.id; render(); }
      }, c.nombre + ' (' + VB.MENU[c.lista].length + ')');
    }));

    var cat = VB.CATEGORIAS.filter(function (c) { return c.id === catActiva; })[0];
    var lista = VB.MENU[cat.lista];
    var esBurger = cat.id === 'burgers';

    var cab = h('div.grupo__cab', null, [
      h('h2', { text: cat.nombre }),
      h('span', { text: esBurger ? 'Publicado el 21/08/2026' : 'Precios de ejemplo' })
    ]);

    poner(document.getElementById('cli-menu'),
      [cab].concat(lista.map(function (p) { return tarjetaProducto(p, esBurger); })));
  }

  /* ============================================== PANEL: PASO 1 CARRITO */
  function pasoCarrito() {
    var c = store.get().carrito;

    if (!c.items.length) {
      return [h('div.vacio', null, [
        h('div.vacio__t', { text: 'Todavía no elegiste nada' }),
        h('p', { text: 'Agregá hamburguesas del menú y las vas a ver acá con el total, antes de mandar nada.' })
      ])];
    }

    var lineas = c.items.map(function (l) {
      var p = store.producto(l.id);
      var detalle = [];
      if (l.extras.length) {
        detalle.push('Con ' + l.extras.map(function (e) {
          return store.extra(e).nombre.replace(/ extra$/, '').toLowerCase();
        }).join(', '));
      }
      if (l.nota) detalle.push('“' + l.nota + '”');

      return h('div.lin', null, [
        h('div.lin__n', { text: l.cant + '× ' + p.nombre }),
        h('div.lin__p', null, [ui.precio(store.precioLinea(l), p.real && !l.extras.length)]),
        detalle.length ? h('div.lin__d', { text: detalle.join(' · ') }) : null,
        h('div.lin__acc', null, [
          h('div.cant', null, [
            h('button.cant__b', { type: 'button', 'aria-label': 'Quitar uno', onclick: function () { sumar(l.id, -1); } }, '−'),
            h('span.cant__v', { text: String(l.cant) }),
            h('button.cant__b', { type: 'button', 'aria-label': 'Agregar uno', onclick: function () { sumar(l.id, 1); } }, '+')
          ]),
          h('button.lin__quitar', { type: 'button', onclick: function () { quitar(l.id); } }, 'Quitar')
        ])
      ]);
    });

    var total = store.total(c.items);

    lineas.push(h('div.tot', null, [
      h('div.tot__f', null, [h('span', { text: 'Productos' }), h('span', { text: store.unidades(c.items) + ' unidades' })]),
      h('div.tot__f', null, [
        h('span', { text: 'Envío' }),
        h('span', { text: c.entrega === 'retiro' ? 'Retirás en el local' : 'A coordinar con el local' })
      ]),
      h('div.tot__f.tot__f--grande', null, [h('span', { text: 'Total' }), h('span', null, [ui.plata(total)])])
    ]));

    if (store.tienePrecioDemo(c.items)) {
      lineas.push(h('p.aviso-fuente', { style: 'margin-top:12px' }, [
        'El total incluye ', h('b', { text: 'valores de ejemplo' }),
        ' (bebidas, acompañamientos o agregados). Los precios de las hamburguesas son los que publicó el local.'
      ]));
    }

    return lineas;
  }

  /* ============================================== PANEL: PASO 2 ENTREGA */
  function campo(clave, etiqueta, control, ayuda) {
    return h('label.campo' + (errores[clave] ? '.campo--mal' : ''), null, [
      h('span.campo__et', { text: etiqueta }),
      control,
      errores[clave] ? h('span.campo__error', { text: errores[clave] }) : null,
      ayuda ? h('span.campo__ay', { text: ayuda }) : null
    ]);
  }

  function texto(clave, ph, tipo) {
    return h('input.entrada', {
      type: tipo || 'text', value: store.get().carrito[clave] || '', placeholder: ph,
      oninput: function (e) {
        var v = e.target.value;
        store.setSilencioso(function (s) { s.carrito[clave] = v; });
        if (errores[clave] && v.trim()) { delete errores[clave]; pintarCampo(e.target); }
      }
    });
  }

  function pintarCampo(input) {
    var l = input.closest('.campo');
    if (!l) return;
    l.classList.remove('campo--mal');
    var e = l.querySelector('.campo__error');
    if (e) e.remove();
  }

  function pasoEntrega() {
    var c = store.get().carrito;
    var bloques = [];

    /* Cómo lo recibe */
    bloques.push(h('div.bloque', null, [
      h('h3.bloque__t', { text: 'Cómo lo recibís' }),
      h('div.ops.ops--2', null, [
        opcion('entrega', 'delivery', 'Delivery', 'Te lo llevamos', c.entrega === 'delivery'),
        opcion('entrega', 'retiro', 'Retiro', 'Pasás por el local', c.entrega === 'retiro')
      ])
    ]));

    if (c.entrega === 'delivery') {
      bloques.push(h('div.bloque', null, [
        h('h3.bloque__t', { text: 'A dónde' }),
        campo('zona', 'Zona', h('select.selec', {
          onchange: function (e) {
            var v = e.target.value;
            store.set(function (s) { s.carrito.zona = v; });
          }
        }, [h('option', { value: '', text: 'Elegí tu zona' })].concat(
          VB.ZONAS.map(function (z) {
            return h('option', { value: z.id, selected: c.zona === z.id, text: z.nombre });
          })
        ))),
        campo('dir', 'Dirección', texto('dir', 'Calle y altura'), 'Calle, altura y piso o depto si corresponde.'),
        campo('ref', 'Referencia (opcional)', texto('ref', 'Ej: portón negro, entre Sáenz y Rivadavia'))
      ]));
    }

    /* Pago */
    bloques.push(h('div.bloque', null, [
      h('h3.bloque__t', null, ['Cómo pagás ', h('span.et-demo', { text: 'Demo' })]),
      h('div.ops', null, VB.PAGOS.map(function (m) {
        return opcion('pago', m.id, m.nombre, m.nota, c.pago === m.id);
      })),
      errores.pago ? h('span.campo__error', { text: errores.pago }) : null,
      h('p.aviso-fuente', { text: 'Los medios de pago son de ejemplo. Hay que confirmarlos con el local antes de publicar.' })
    ]));

    /* Franja */
    var franjas = store.franjas();
    bloques.push(h('div.bloque', null, [
      h('h3.bloque__t', { text: 'Para qué hora' }),
      h('div.fr-cli', null, franjas.map(function (f) {
        return h('label.fr-cli__op', null, [
          h('input', {
            type: 'radio', name: 'franja', value: f.id,
            checked: c.franja === f.id, disabled: f.llena,
            onchange: function () { store.set(function (s) { s.carrito.franja = f.id; }); }
          }),
          h('span.fr-cli__c', null, [
            h('span.fr-cli__h', { text: f.id }),
            h('span.fr-cli__e', { text: f.llena ? 'Completa' : 'Quedan ' + f.libres })
          ])
        ]);
      })),
      errores.franja ? h('span.campo__error', { text: errores.franja }) : null,
      h('p.campo__ay', {
        text: 'Las franjas completas no se pueden elegir. Es el cupo real de la cocina, no una promesa.'
      })
    ]));

    /* Quién sos */
    bloques.push(h('div.bloque', null, [
      h('h3.bloque__t', { text: 'Quién sos' }),
      campo('nombre', 'Nombre', texto('nombre', 'Cómo te anotamos')),
      campo('tel', 'WhatsApp', texto('tel', '11 xxxx-xxxx', 'tel'), 'Sólo para avisarte cuando sale.'),
      campo('nota', 'Algo más (opcional)', h('textarea.area', {
        placeholder: 'Ej: tocar timbre 2, no funciona el portero',
        value: c.nota,
        oninput: function (e) {
          var v = e.target.value;
          store.setSilencioso(function (s) { s.carrito.nota = v; });
        }
      }))
    ]));

    return bloques;
  }

  function opcion(grupo, valor, titulo, sub, elegido) {
    return h('label.op', null, [
      h('input', {
        type: 'radio', name: grupo, value: valor, checked: elegido,
        onchange: function () {
          store.set(function (s) { s.carrito[grupo] = valor; });
          delete errores[grupo];
        }
      }),
      h('span.op__c', null, [
        h('span.op__t', { text: titulo }),
        sub ? h('span.op__s', { text: sub }) : null
      ])
    ]);
  }

  function validarEntrega() {
    var c = store.get().carrito;
    errores = {};
    if (c.entrega === 'delivery') {
      if (!c.zona) errores.zona = 'Elegí la zona para saber si llegamos.';
      if (!c.dir.trim()) errores.dir = 'Sin dirección el pedido no sale.';
    }
    if (!c.pago) errores.pago = 'Elegí cómo vas a pagar.';
    if (!c.franja) errores.franja = 'Elegí una hora con cupo.';
    if (!c.nombre.trim()) errores.nombre = 'Necesitamos un nombre para cantarlo.';
    if (!c.tel.trim()) errores.tel = 'Sin WhatsApp no podemos avisarte.';
    return Object.keys(errores).length === 0;
  }

  /* =========================================== PANEL: PASO 3 CONFIRMAR */
  function pasoConfirmar() {
    var s = store.get();
    var c = s.carrito;
    var z = store.zona(c.zona);
    var pago = store.pago(c.pago);

    function fila(dt, dd) {
      return h('div.res__f', null, [h('dt', { text: dt }), h('dd', { text: dd })]);
    }

    var res = h('dl.res', null, [
      fila('Pedido', store.resumen(c.items)),
      fila('Entrega', c.entrega === 'retiro'
        ? 'Retirás en el local (' + VB.LOCAL.ubicacion + ')'
        : (z ? z.nombre : '') + ' · ' + c.dir + (c.ref ? ' (' + c.ref + ')' : '')),
      fila('Hora', c.franja + ' hs'),
      fila('Pago', pago ? pago.nombre : ''),
      fila('A nombre de', c.nombre + ' · ' + c.tel),
      c.nota ? fila('Aclaración', c.nota) : null
    ]);

    return [
      res,
      h('div.tot', null, [
        h('div.tot__f', null, [h('span', { text: 'Productos' }), h('span', { text: store.unidades(c.items) + ' unidades' })]),
        h('div.tot__f', null, [
          h('span', { text: 'Envío' }),
          h('span', { text: c.entrega === 'retiro' ? 'Retirás' : 'A coordinar con el local' })
        ]),
        h('div.tot__f.tot__f--grande', null, [h('span', { text: 'Total' }), h('span', null, [ui.plata(store.total(c.items))])])
      ]),
      h('div.aviso.aviso--oro', { style: 'margin-top:14px' }, [
        h('span.aviso__ico', { 'aria-hidden': 'true', text: '#' }),
        h('span', null, [
          'Demora estimada de esta noche: ', h('b', { text: s.demora + ' minutos' }),
          '. Si se estira, te avisamos por WhatsApp antes de que salga.'])
      ]),
      h('p.aviso-fuente', { style: 'margin-top:12px' }, [
        h('b', { text: 'Esto es una demo. ' }),
        'Al confirmar no se manda nada a nadie: el pedido aparece en el tablero de la Central, ' +
        'acá mismo, para que veas cómo lo recibe el local.'
      ])
    ];
  }

  /* --------------------------------------------------------- CONFIRMAR */
  function confirmar() {
    var s = store.get();
    var c = s.carrito;

    if (s.pausado) {
      ui.toast(['El local ', h('b', { text: 'pausó los pedidos' }), '. No se puede confirmar.'], true);
      return;
    }
    if (store.franja(c.franja).llena) {
      ui.toast(['La franja ', h('b', { text: c.franja }), ' se llenó mientras pedías. Elegí otra hora.'], true);
      store.set(function (st) { st.carrito.franja = ''; st.paso = 'entrega'; });
      return;
    }

    var codigo = 'VK-' + s.seq;
    var nuevo = {
      codigo: codigo,
      cliente: c.nombre.trim(),
      tel: c.tel.trim(),
      entrega: c.entrega,
      zona: c.entrega === 'delivery' ? c.zona : null,
      dir: c.entrega === 'delivery' ? (c.dir + (c.ref ? ' (' + c.ref + ')' : '')) : '',
      pago: c.pago,
      franja: c.franja,
      estado: 'nuevo',
      creado: Date.now(),
      items: JSON.parse(JSON.stringify(c.items)),
      nota: c.nota.trim(),
      demora: false,
      origen: 'cliente',
      entrando: true
    };

    var seLleno = false;
    store.set(function (st) {
      st.pedidos.push(nuevo);
      st.seq += 1;
      st.ultimoPedido = codigo;
      st.paso = 'exito';
      /* El pedido ya salió: se vacía el carrito en el acto para que no quede
         una copia que se pueda mandar dos veces. Los datos de la persona sí
         quedan — si pide de nuevo no tiene que volver a escribir la dirección. */
      st.carrito.items = [];
      st.carrito.franja = '';
      st.carrito.nota = '';
      seLleno = store.franja(nuevo.franja).llena;
    });
    extrasAbiertos = {};

    if (seLleno) {
      ui.toast(['Con este pedido la franja ', h('b', { text: nuevo.franja }),
        ' quedó completa. Nadie más la puede elegir.'], true);
    }
  }

  /* --------------------------------------------------------------- ÉXITO */
  function pasoExito() {
    var s = store.get();
    var p = s.pedidos.filter(function (x) { return x.codigo === s.ultimoPedido; })[0];
    if (!p) return [];

    return [h('div.exito', null, [
      h('div.exito__sello', null, [
        h('b', { text: p.codigo }),
        h('i', { text: 'En cola' })
      ]),
      h('h2', { text: 'Pedido tomado' }),
      h('p', { text: 'Tu pedido entró a la cola. Te avisamos cuando salga a reparto.' }),
      h('div.exito__caja', null, [
        h('div', null, ['Comprometido para las ', h('b', { text: p.franja + ' hs' }), '.']),
        h('div', { style: 'margin-top:6px' }, [
          p.entrega === 'retiro'
            ? 'Lo retirás en el local. Te avisamos cuando esté sobre el mostrador.'
            : ['Sale para ', h('b', { text: store.zona(p.zona) ? store.zona(p.zona).nombre : '' }),
               '. Te avisamos cuando el repartidor arranca.']
        ]),
        h('div', { style: 'margin-top:6px' }, ['Demora estimada de la noche: ', h('b', { text: s.demora + ' min' }), '.'])
      ]),
      h('p', { style: 'margin-top:18px;font-size:13px', text: 'Este pedido ya está en el tablero del local.' }),
      h('div', { style: 'display:grid;gap:8px;max-width:340px;margin:10px auto 0' }, [
        h('button.b.b--pri.b--bloque', {
          type: 'button', onclick: function () { VB.app.irA('central'); }
        }, 'Ver cómo le llegó al local'),
        h('button.b.b--bloque.b--fantasma', {
          type: 'button',
          onclick: function () {
            store.set(function (st) { st.paso = 'menu'; });
            cerrarHoja();
          }
        }, 'Hacer otro pedido')
      ])
    ])];
  }

  /* ------------------------------------------------------------- PANEL */
  var PASOS = [
    { id: 'menu', et: 'Pedido' },
    { id: 'entrega', et: 'Entrega' },
    { id: 'confirmar', et: 'Confirmar' }
  ];

  function renderPasos() {
    var paso = store.get().paso;
    var cont = document.getElementById('pasos');
    if (paso === 'exito') { poner(cont, []); cont.style.display = 'none'; return; }
    cont.style.display = '';

    var i = PASOS.map(function (p) { return p.id; }).indexOf(paso);
    var nodos = [];
    PASOS.forEach(function (p, n) {
      var mod = n === i ? '.paso--activo' : (n < i ? '.paso--hecho' : '');
      nodos.push(h('span.paso' + mod, null, [
        h('i', { text: n < i ? '✓' : String(n + 1) }), p.et
      ]));
      if (n < PASOS.length - 1) nodos.push(h('span.pasos__sep'));
    });
    poner(cont, nodos);
  }

  function renderPanel() {
    var s = store.get();
    var paso = s.paso;
    var titulos = { menu: 'Tu pedido', entrega: 'Entrega y pago', confirmar: 'Revisá antes de mandar', exito: '' };
    document.getElementById('hoja-titulo').textContent = titulos[paso] || 'Tu pedido';

    renderPasos();

    var cuerpo;
    if (paso === 'entrega') cuerpo = pasoEntrega();
    else if (paso === 'confirmar') cuerpo = pasoConfirmar();
    else if (paso === 'exito') cuerpo = pasoExito();
    else cuerpo = pasoCarrito();
    poner(document.getElementById('hoja-cuerpo'), cuerpo);

    /* Pie del panel */
    var pie = [];
    var hayItems = s.carrito.items.length > 0;

    if (paso === 'menu') {
      pie.push(h('button.b.b--pri.b--bloque', {
        type: 'button', disabled: !hayItems || !puedeConfirmar(),
        onclick: function () { store.set(function (st) { st.paso = 'entrega'; }); }
      }, hayItems ? 'Continuar con la entrega' : 'Elegí algo del menú'));
      if (!puedeConfirmar() && hayItems) {
        pie.push(h('p.campo__ay', {
          text: store.get().pausado
            ? 'El local pausó los pedidos. Podés armar el pedido igual y confirmarlo cuando reabra.'
            : 'No quedan franjas con cupo para hoy.'
        }));
      }
    } else if (paso === 'entrega') {
      pie.push(h('button.b.b--pri.b--bloque', {
        type: 'button',
        onclick: function () {
          if (validarEntrega()) store.set(function (st) { st.paso = 'confirmar'; });
          else {
            render();
            var mal = document.querySelector('.campo--mal, .campo__error');
            if (mal) mal.scrollIntoView({ block: 'center', behavior: 'smooth' });
          }
        }
      }, 'Revisar el pedido'));
      pie.push(h('button.b.b--bloque.b--fantasma', {
        type: 'button', onclick: function () { store.set(function (st) { st.paso = 'menu'; }); }
      }, 'Volver al pedido'));
    } else if (paso === 'confirmar') {
      pie.push(h('button.b.b--pri.b--bloque', {
        type: 'button', disabled: !puedeConfirmar(), onclick: confirmar
      }, 'Confirmar pedido'));
      pie.push(h('button.b.b--bloque.b--fantasma', {
        type: 'button', onclick: function () { store.set(function (st) { st.paso = 'entrega'; }); }
      }, 'Corregir la entrega'));
    }

    poner(document.getElementById('hoja-pie'), pie);
  }

  /* -------------------------------------------------------- BARRA MÓVIL */
  function renderBarra() {
    var c = store.get().carrito;
    var u = store.unidades(c.items);
    var cont = document.getElementById('barra-carrito');

    /* Con el carrito vacío la barra no dice nada útil y se come 70 px de menú
       en un celular. Aparece cuando hay algo que mirar. */
    cont.classList.toggle('barra-carrito--vacia', u === 0);

    poner(cont, [
      h('div.barra-carrito__info', null, [
        h('div.barra-carrito__u', { text: u ? u + (u === 1 ? ' producto' : ' productos') : 'Tu pedido' }),
        h('div.barra-carrito__t', { text: u ? ui.plata(store.total(c.items)) : 'Vacío' })
      ]),
      h('button.b.b--pri', { type: 'button', onclick: abrirHoja }, 'Ver pedido')
    ]);
  }

  function abrirHoja() {
    document.getElementById('hoja').classList.add('abierta');
    document.body.style.overflow = 'hidden';
    var x = document.getElementById('cerrar-hoja');
    if (x) x.focus();
  }

  function cerrarHoja() {
    document.getElementById('hoja').classList.remove('abierta');
    document.body.style.overflow = '';
  }

  /* --------------------------------------------------------------- HERO */
  function renderHero() {
    var e = estadoLocal();
    poner(document.getElementById('hero-estado'),
      h('span.hero__estado.hero__estado--' + e.clave, null, [
        h('i', { 'aria-hidden': 'true' }), e.texto
      ]));

    var cont = document.getElementById('cli-cartel');
    if (store.get().pausado) {
      poner(cont, h('div.pausa-cartel', null, [
        h('span.aviso__ico', { 'aria-hidden': 'true', text: '!', style: 'background:var(--sangre-senal);color:#0A0A0B' }),
        h('div', null, [
          h('div.pausa-cartel__t', { text: 'El local pausó los pedidos' }),
          h('p', { text: 'Podés mirar el menú y armar tu pedido, pero no se puede confirmar hasta que reabran. Nadie manda un mensaje que después se pierde.' })
        ])
      ]));
    } else {
      poner(cont, []);
    }
  }

  /* ------------------------------------------------------------- RENDER */
  function render() {
    if (store.get().modo !== 'cliente') return;
    renderHero();
    renderMenu();
    renderPanel();
    renderBarra();
  }

  VB.cliente = {
    render: render,
    cerrarHoja: cerrarHoja,
    conectar: function () {
      document.getElementById('cerrar-hoja').addEventListener('click', cerrarHoja);
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && document.getElementById('hoja').classList.contains('abierta')) cerrarHoja();
      });
    }
  };
})();
