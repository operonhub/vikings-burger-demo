# Vikings Burger — Central de Pedidos (demo)

> **Esta demo es una superficie Operate: prioridad en velocidad, cola, capacidad y estados.**
>
> No es una web institucional ni un clon de PedidosYa. Es la pantalla que ordena una noche
> de 150 pedidos, más el flujo mínimo que necesita el cliente para entrar a esa cola con
> todos los datos completos.

Demo conceptual para mostrarle el sistema al dueño de Vikings Burger (Lanús Este).
**No está publicada, no manda mensajes y no se conecta a nada.**

---

## Cómo abrirla

Doble clic en `index.html`. Se abre en cualquier navegador, sin servidor, sin internet
y sin instalar nada. Está verificado que funciona igual servida por `file://` que por HTTP.

Si preferís servirla:

```bash
python -m http.server 8731 --directory "vikings-central-demo"
```

Después entrá a `http://localhost:8731`.

**Para mostrarla en la reunión:** conviene un celular o la ventana angosta (390 px). El modo
Central se diseñó primero para el teléfono, que es donde lo van a usar de verdad, y recién
después se abrió a tres columnas en escritorio.

---

## Los dos modos

Arriba de todo hay un selector. La demo **arranca en Central de pedidos**, porque es la
pantalla que muestra el problema.

### Central de pedidos
Lo que ven el dueño y el papá durante un pico.

- **Control de noche**: pausar la entrada de pedidos, extender la demora que se le avisa
  al cliente, y los **cupos por franja** de 30 minutos. Tocando una franja se abre o se
  cierra a mano.
- **Nuevos pedidos** → ordenados por el que más espera, que es el que está por perderse.
  Acciones: Aceptar / Marcar demora / Rechazar por cupo.
- **Cocina** → ordenados por **hora de entrega comprometida**, no por orden de llegada.
  Lo que sale 20:00 va antes que lo de 21:30 aunque haya entrado después.
- **Reparto** → agrupado por zona, con una **Próxima vuelta** que junta hasta 3 pedidos
  que quedan cerca y los saca a todos juntos con un botón. Eso es para el papá.

### Cliente hace el pedido
Menú, carrito, entrega y confirmación. El punto no es que sea lindo: es que el pedido,
la dirección, el pago y la hora entran **juntos y completos** en un solo movimiento, y la
hora sólo se puede elegir entre las franjas que todavía tienen cupo.

---

## Qué demostrar en la reunión (en este orden)

1. **Noche pico** (botón en la tira de demo). Aparecen 11 pedidos, dos franjas completas
   y el aviso de que hay un pedido esperando hace más de 10 minutos sin confirmar.
2. **Reparto → Próxima vuelta.** "Estos tres quedan cerca, salen juntos." Un botón.
3. Pasar a **Cliente hace el pedido**, armar un pedido y confirmarlo.
4. Tocar **"Ver cómo le llegó al local"**: el pedido ya está en Nuevos, con la etiqueta
   *Por la web*, completo, sin que nadie tipeara nada.
5. Volver a Central, **cerrar la franja 21:00** tocándola. Volver al modo cliente: ya no se
   puede elegir. Ese es el argumento de capacidad.
6. **Pausar nuevos pedidos.** El cliente sigue viendo el menú y los precios, pero no puede
   confirmar. Frenás la entrada sin cerrar el local ni dejar de responder mensajes.

Todo queda guardado en el navegador y sobrevive al refresh.
**Restablecer demo** vuelve todo al arranque.

---

## Qué es real y qué es de ejemplo

Todo lo real salió del Instagram público [@the.vikingsburger](https://www.instagram.com/the.vikingsburger/).
Nada se inventó y se presentó como oficial.

### Real
| Dato | Fuente |
|---|---|
| Nombre, logo, lema "Sabor · Fuerza · Leyenda", "Hamburguesas de otro siglo" | Bio y foto de perfil |
| Zona (Lanús · Banfield), geotag Lanús Este | Bio y posteos |
| Jueves a domingo, 19:00 a 23:00 | Bio |
| WhatsApp **11 4043-1472** | Flyer del 04/09/2026 |
| "Todas las hamburguesas vienen con papas fritas" | Flyer del 04/09/2026 |
| **Las 9 hamburguesas**, sus ingredientes y sus precios ($9.500 dobles / $10.500 triples) | Carrusel "NUEVOS PRECIOS / MENU ACTUALIZADO" del **21/08/2026** |
| Que la Salsa Vikinga existe (pepino y cebolla triturados, kétchup, mayonesa, mostaza) | Posteo del menú |
| Paleta: negro, dorado tostado `#b28c5e`, borgoña `#602023`, crema `#e0c8a8` | Medida contando píxeles del logo |
| Foto del hero | Recorte del flyer del 04/09/2026 |

Las capturas del menú original están en `_referencia/` para poder chequear cualquier dato.

### De ejemplo — hay que reemplazarlo
- **Acompañamientos y bebidas** enteros (el local no los publica) y sus precios.
- **Agregados** (bacon extra, cheddar extra, huevo, salsa) y sus precios.
- **Medios de pago**: efectivo, transferencia y Mercado Pago son los tres habituales del
  rubro, pero **hay que confirmarlos con el local**.
- **Pedidos, nombres, teléfonos y direcciones** del tablero: todos inventados.
- **Cupos por franja** (6 a 8 por media hora): un número plausible, no el real. El número
  real lo tiene que decir la cocina.
- **Costo de envío**: no se inventó. Aparece como "a coordinar con el local" y no suma al total.

En pantalla, todo importe de ejemplo va <ins>subrayado con puntos</ins> y con un `title`
que lo aclara. Los productos que no existen llevan una etiqueta **Demo**.
El pie de las dos pantallas repite esta misma aclaración.

---

## Archivos

```
vikings-central-demo/
├─ index.html            Estructura y puntos de montaje
├─ css/styles.css        Todo el diseño. Sin frameworks, sin fuentes remotas.
├─ js/
│  ├─ data.js            Menú, zonas, franjas y escenarios de demo
│  ├─ store.js           Estado único + localStorage + cupos
│  ├─ ui.js              Fábrica de nodos, formato de plata, avisos
│  ├─ central.js         El tablero
│  ├─ cliente.js         El flujo de pedido
│  └─ app.js             Arranque y cambio de modo
├─ assets/               Logo, foto del hero
├─ capturas/             Capturas de escritorio y móvil
└─ _referencia/          El menú original de Instagram, para chequear datos
```

Sin dependencias, sin build, sin backend, sin login. Los scripts son clásicos (no módulos
ES) justamente para que `file://` funcione con doble clic.

### Decisiones que vale la pena conocer
- **Un solo estado para los dos modos.** El modo cliente y la central escriben sobre el
  mismo arreglo de pedidos. Es literalmente lo que se vende: cocina y reparto ven la misma cola.
- **El HTML no se arma concatenando strings.** Todo pasa por `h()` en `js/ui.js`, que mete
  el texto con `createTextNode`. Un nombre con comillas o una dirección rara no pueden
  romper nada.
- **El panel de pedido es un solo bloque de HTML** con dos presentaciones: hoja a pantalla
  completa en el celular, columna fija al costado en escritorio. No hay dos carritos que
  sincronizar.
- **Los estados nunca se codifican sólo con color**: cada uno tiene glifo y palabra.
- Contraste verificado: el par más ajustado da **4,79:1** (chip "En cocina"), por encima
  del mínimo AA de 4,5:1. Foco visible con contorno dorado. Objetivos táctiles de 44 px
  en todo lo que es producto.

---

## Qué falta para pasar de demo a producto

1. **Backend y base de datos.** Hoy todo vive en el navegador de quien mira la demo. Hace
   falta un servidor para que el pedido del cliente llegue de verdad al tablero del local.
2. **Tiempo real.** La cocina y el reparto tienen que ver el mismo tablero actualizándose
   solo en dos teléfonos distintos.
3. **Aviso al cliente.** Un mensaje automático de WhatsApp cuando el pedido se acepta y
   cuando sale a reparto. Es la mitad del valor y acá está sólo enunciado.
4. **Menú editable** por el dueño, sin tocar código: precios, altas y bajas, y sobre todo
   marcar algo como *sin stock* en el medio del servicio.
5. **Cupos y horarios configurables**, y que el local pueda abrir y cerrar la noche.
6. **Pagos.** Si va Mercado Pago, hay que definir si es link, QR o pago al confirmar.
7. **Cobertura de zonas y costo de envío**, que hoy quedó explícitamente sin inventar.
8. **Historial** de la noche y de la semana, para saber qué franja se llena siempre.
9. Datos reales: acompañamientos, bebidas, agregados, medios de pago y cupos por franja.

---

## Una decisión de negocio que quedó abierta

En `js/central.js` está la función **`marcarDemora()`**, con un comentario que la explica.
Hoy hace lo más conservador: el pedido se queda donde está y se le corren 15 minutos a la
hora comprometida, sin liberar el cupo ni moverlo de franja.

Hay al menos dos alternativas razonables, y cuál corresponde depende de cómo trabajan
en el local:

- **Pasarlo a la franja siguiente**, si en la práctica una demora significa que ese pedido
  ya no entra en su tanda. Libera el cupo actual, pero puede llenar la franja de al lado.
- **Marcarlo y esperar respuesta del cliente** antes de seguir cocinándolo, si prefieren
  darle la opción de cancelar.

Es un cambio de pocas líneas y está aislado en esa sola función. Vale la pena preguntárselo
al dueño en la reunión: la respuesta dice bastante sobre cómo manejan hoy los picos.

---

*Demo conceptual — Operon*
