/* =========================================================================
   Vikings Burger — Central de Pedidos (DEMO)
   data.js · catálogo, zonas, franjas y escenarios de demostración
   -------------------------------------------------------------------------
   PROCEDENCIA DEL CONTENIDO
   · REAL  → tomado del Instagram público @the.vikingsburger (menú publicado
             el 21/08/2026 y flyer del 04/09/2026). Marcado `real: true`.
   · DEMO  → valor de ejemplo inventado para que la demo funcione.
             Marcado `real: false` y señalizado en pantalla.
   ========================================================================= */

window.VB = window.VB || {};

VB.LOCAL = {
  nombre: 'Vikings Burger',
  lema: 'Sabor · Fuerza · Leyenda',                 // REAL (bio de Instagram)
  bajada: 'Hamburguesas de otro siglo',             // REAL (bio de Instagram)
  zona: 'Lanús · Banfield',                         // REAL (bio de Instagram)
  ubicacion: 'Lanús Este',                          // REAL (geotag de posteos)
  dias: 'Jueves a domingo',                         // REAL (bio de Instagram)
  horario: '19:00 a 23:00',                         // REAL (bio de Instagram)
  whatsapp: '11 4043-1472',                         // REAL (flyer 04/09/2026)
  instagram: '@the.vikingsburger',                  // REAL
  desde: 2023,                                      // REAL (logo "EST. 2023")
  incluye: 'Todas las hamburguesas vienen con papas fritas' // REAL (flyer)
};

/* Franjas de entrega de 30 minutos dentro del horario real del local.
   `cap` = cuántos pedidos entran por franja. Es el número que hoy nadie
   controla y que en un pico de 150 pedidos hace que todo se desborde. */
VB.SLOTS_BASE = [
  { id: '19:30', cap: 6 },
  { id: '20:00', cap: 8 },
  { id: '20:30', cap: 8 },
  { id: '21:00', cap: 8 },
  { id: '21:30', cap: 6 },
  { id: '22:00', cap: 6 },
  { id: '22:30', cap: 4 }
];

/* Zonas de reparto. `ruta` agrupa las que quedan cerca entre sí: es lo que
   arma la "Próxima vuelta" para que el reparto no cruce el partido dos veces. */
VB.ZONAS = [
  { id: 'lanus-este',  nombre: 'Lanús Este',           ruta: 'A', real: true },
  { id: 'gerli',       nombre: 'Gerli',                ruta: 'A', real: true },
  { id: 'alsina',      nombre: 'Valentín Alsina',      ruta: 'A', real: true },
  { id: 'lanus-oeste', nombre: 'Lanús Oeste',          ruta: 'B', real: true },
  { id: 'escalada',    nombre: 'Remedios de Escalada', ruta: 'B', real: true },
  { id: 'banfield',    nombre: 'Banfield',             ruta: 'B', real: true }
];

VB.RUTAS = { A: 'Lanús Este · Gerli · Alsina', B: 'Lanús Oeste · Escalada · Banfield' };

/* Medios de pago: los tres habituales del rubro. A confirmar con el local. */
VB.PAGOS = [
  { id: 'efectivo',    nombre: 'Efectivo',      nota: 'Aclarar con cuánto abonás', real: false },
  { id: 'transf',      nombre: 'Transferencia', nota: 'Se envía el alias al confirmar', real: false },
  { id: 'mercadopago', nombre: 'Mercado Pago',  nota: 'Link de pago por WhatsApp', real: false }
];

/* ------------------------------------------------------------------ MENÚ */
/* Las 9 hamburguesas, sus ingredientes y sus precios son los publicados por
   el local el 21/08/2026 ("NUEVOS PRECIOS / MENU ACTUALIZADO"). */
VB.MENU = {
  burgers: [
    { id: 'floki',   nombre: 'Floki',          tipo: 'Doble',  precio: 9500,
      ing: 'Pan de papa · Cheddar · Cebolla cruda · Kétchup · Bacon', real: true },
    { id: 'ubbe',    nombre: 'Ubbe',           tipo: 'Doble',  precio: 9500,
      ing: 'Pan de papa · Cheddar · Cebolla caramelizada · Barbacoa', real: true },
    { id: 'harald',  nombre: 'Harald',         tipo: 'Doble',  precio: 9500,
      ing: 'Pan con sésamo · Cheddar · Cebolla cruda · Barbacoa', real: true },
    { id: 'katia',   nombre: 'Princess Katia', tipo: 'Doble',  precio: 9500,
      ing: 'Pan de papa · Cheddar feta · Cheddar líquido · Bacon · Palitos de pollo · Barbacoa', real: true },
    { id: 'torvi',   nombre: 'Torvi',          tipo: 'Doble',  precio: 9500,
      ing: 'Pan de papa · Cheddar · Bacon · Salsa Vikinga · Aros de cebolla', real: true },
    { id: 'ragnar',  nombre: 'Ragnar',         tipo: 'Triple', precio: 10500,
      ing: 'Pan de papa · Cheddar · Huevo · Kétchup · Bacon', real: true },
    { id: 'gyda',    nombre: 'Gyda',           tipo: 'Triple', precio: 10500,
      ing: 'Pan con sésamo · Cheddar · Lechuga · Tomate', real: true },
    { id: 'siggy',   nombre: 'Siggy',          tipo: 'Triple', precio: 10500,
      ing: 'Pan con sésamo · Cheddar · Salsa golf · Pepino · Bacon', real: true },
    { id: 'porunn',  nombre: 'Porunn',         tipo: 'Triple', precio: 10500,
      ing: 'Pan de papa · Cheddar · Salsa picante · Tomate', real: true }
  ],
  /* El local no publica acompañamientos ni bebidas. Todo esto es de ejemplo. */
  compartir: [
    { id: 'papas-cheddar', nombre: 'Papas con cheddar y bacon', precio: 6500,
      ing: 'Para dos personas', real: false },
    { id: 'aros',          nombre: 'Aros de cebolla',           precio: 4800,
      ing: '8 unidades', real: false },
    { id: 'palitos',       nombre: 'Palitos de pollo',          precio: 5200,
      ing: '6 unidades con salsa a elección', real: false }
  ],
  bebidas: [
    { id: 'gaseosa', nombre: 'Gaseosa línea Coca 500 ml', precio: 2500, ing: '', real: false },
    { id: 'agua',    nombre: 'Agua saborizada 500 ml',    precio: 2300, ing: '', real: false },
    { id: 'birra',   nombre: 'Cerveza artesanal pinta',   precio: 4500, ing: '', real: false }
  ]
};

/* Agregados. La Salsa Vikinga existe (el local la publicó con su receta:
   pepino y cebolla triturados, kétchup, mayonesa y mostaza). Los importes
   de los agregados son de ejemplo. */
VB.EXTRAS = [
  { id: 'salsa',   nombre: 'Salsa Vikinga extra', precio: 900,  real: false },
  { id: 'cheddar', nombre: 'Cheddar extra',       precio: 1200, real: false },
  { id: 'bacon',   nombre: 'Bacon extra',         precio: 1500, real: false },
  { id: 'huevo',   nombre: 'Huevo',               precio: 900,  real: false }
];

VB.CATEGORIAS = [
  { id: 'burgers',   nombre: 'Hamburguesas', lista: 'burgers' },
  { id: 'compartir', nombre: 'Para compartir', lista: 'compartir' },
  { id: 'bebidas',   nombre: 'Bebidas', lista: 'bebidas' }
];

/* ------------------------------------------------------ ESCENARIOS DEMO */
/* Pedidos ficticios para poder mostrar el tablero con contenido. Los nombres
   son inventados (nombre de pila + inicial) y no corresponden a clientes
   reales del local. `hace` son minutos desde que entró el pedido. */

function ped(codigo, cliente, tel, entrega, zona, dir, pago, franja, estado, hace, items, nota) {
  return { codigo, cliente, tel, entrega, zona, dir, pago, franja, estado, hace,
           items, nota: nota || '', demora: false, origen: 'demo' };
}

VB.ESCENARIOS = {
  vacio: { nombre: 'Tablero vacío', demora: 20, llenas: [], pedidos: [] },

  normal: {
    nombre: 'Cola normal', demora: 25, llenas: [],
    pedidos: [
      ped('VK-118', 'Nico R.',  '11 5xxx-4471', 'delivery', 'banfield', 'Alsina al 1200', 'transf', '20:30', 'nuevo', 3,
          [{ id: 'ragnar', cant: 1, extras: ['bacon'] }, { id: 'gaseosa', cant: 2 }]),
      ped('VK-117', 'Cami P.',  '11 3xxx-9082', 'retiro',   null, '', 'efectivo', '20:30', 'nuevo', 7,
          [{ id: 'floki', cant: 2 }], 'Una sin cebolla'),
      ped('VK-116', 'Flor M.',  '11 6xxx-2210', 'delivery', 'lanus-este', 'Anatole France al 800', 'mercadopago', '20:00', 'cocina', 14,
          [{ id: 'torvi', cant: 1 }, { id: 'siggy', cant: 1 }, { id: 'papas-cheddar', cant: 1 }]),
      ped('VK-115', 'Diego A.', '11 2xxx-7734', 'delivery', 'gerli', 'Murature al 2400', 'efectivo', '20:00', 'cocina', 19,
          [{ id: 'katia', cant: 1, extras: ['salsa'] }]),
      ped('VK-114', 'Sol B.',   '11 4xxx-1156', 'delivery', 'lanus-este', 'Del Valle Iberlucea al 3100', 'transf', '19:30', 'listo', 26,
          [{ id: 'gyda', cant: 1 }, { id: 'porunn', cant: 1 }, { id: 'agua', cant: 1 }])
    ]
  },

  pico: {
    nombre: 'Noche pico', demora: 50, llenas: ['20:00', '20:30'],
    pedidos: [
      ped('VK-141', 'Vicky L.',  '11 3xxx-5518', 'delivery', 'escalada', 'Colón al 900', 'transf', '21:30', 'nuevo', 1,
          [{ id: 'harald', cant: 2 }, { id: 'aros', cant: 1 }]),
      ped('VK-140', 'Pablo D.',  '11 5xxx-3390', 'delivery', 'banfield', 'Larroque al 400', 'efectivo', '21:30', 'nuevo', 4,
          [{ id: 'ragnar', cant: 1 }, { id: 'floki', cant: 1 }, { id: 'gaseosa', cant: 1 }]),
      ped('VK-139', 'Lu T.',     '11 6xxx-8827', 'retiro',   null, '', 'mercadopago', '21:00', 'nuevo', 9,
          [{ id: 'siggy', cant: 3 }], 'Llego 10 min antes'),
      ped('VK-138', 'Fede C.',   '11 2xxx-4402', 'delivery', 'lanus-oeste', 'Pasco al 1500', 'efectivo', '21:00', 'nuevo', 12,
          [{ id: 'katia', cant: 1 }, { id: 'torvi', cant: 1 }, { id: 'palitos', cant: 1 }]),
      ped('VK-137', 'Ariel S.',  '11 4xxx-6673', 'delivery', 'banfield', 'Vieytes al 200', 'transf', '21:00', 'cocina', 16,
          [{ id: 'porunn', cant: 2 }, { id: 'birra', cant: 2 }]),
      ped('VK-136', 'Martín G.', '11 3xxx-1194', 'delivery', 'escalada', 'Rodríguez Peña al 700', 'efectivo', '20:30', 'cocina', 21,
          [{ id: 'ubbe', cant: 1, extras: ['cheddar', 'bacon'] }]),
      ped('VK-135', 'Juli V.',   '11 5xxx-9046', 'delivery', 'alsina', 'Remedios de Escalada al 1900', 'transf', '20:30', 'cocina', 24,
          [{ id: 'gyda', cant: 2 }, { id: 'papas-cheddar', cant: 1 }]),
      ped('VK-134', 'Rama F.',   '11 6xxx-2258', 'retiro',   null, '', 'efectivo', '20:30', 'cocina', 27,
          [{ id: 'floki', cant: 1 }, { id: 'harald', cant: 1 }]),
      ped('VK-133', 'Belén O.',  '11 2xxx-7719', 'delivery', 'lanus-este', 'Ministro Brin al 2600', 'mercadopago', '20:00', 'listo', 33,
          [{ id: 'torvi', cant: 1 }, { id: 'agua', cant: 2 }]),
      ped('VK-132', 'Seba M.',   '11 4xxx-3385', 'delivery', 'gerli', 'Manuel Castro al 1100', 'efectivo', '20:00', 'listo', 36,
          [{ id: 'ragnar', cant: 1 }, { id: 'siggy', cant: 1 }]),
      ped('VK-131', 'Nadia K.',  '11 3xxx-6640', 'delivery', 'lanus-este', 'Salta al 500', 'transf', '20:00', 'listo', 41,
          [{ id: 'katia', cant: 1 }, { id: 'aros', cant: 1 }, { id: 'gaseosa', cant: 1 }])
    ]
  }
};
