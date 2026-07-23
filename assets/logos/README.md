# Logos de clientes

Los usa el componente `.logo-strip` (ver `css/styles.css`), que tiene **dos
estados**: en reposo, chip glass oscuro (`--glass-bg`) con el logo en blanco
translúcido; en **hover**, el chip pasa a blanco sólido y el logo recupera su
color real.

Los archivos son siempre la versión **sobre claro** (los `-ink.png` para los 4
que venían en blanco). Sirven tal cual para el hover, y el filtro
`invert(1) grayscale(1) brightness(2)` los pasa a blanco para el reposo.

## Por qué el filtro es invert y no una silueta

Lo obvio para pasar un logo a blanco es `brightness(0) invert(1)`, pero eso
aplana a **silueta** y borra la figura/fondo interna. Probado sobre los 12:
Café la Humedad (badge oscuro con el texto claro adentro) quedaba
irreconocible, y el hexágono de Chemikal y el apretón de manos de Mercado Libre
quedaban como manchas blancas. `invert(1) grayscale(1)` conserva esa estructura
y los 12 se leen.

El `brightness(2)` es por FieldView y Ernesto: invertidos caen en un gris medio
y sin eso quedan en **2.7:1** contra el chip. Con 2 el peor caso llega a 4.3:1.

## Por qué el hover es a chip claro

8 de las 12 marcas son azules, marrones o negras y sobre `#0A0A0B` no llegan al
mínimo de 4.5:1 — medido: Cabrales **1.9:1**, PACTO **2.3:1**, Café la Humedad
**3.9:1**. Sobre el chip claro cada marca se ve con su color real, que es lo que
hace que el usuario la reconozca. Un tratamiento duotono o en escala de grises
resolvía el contraste pero borraba justo lo que genera la confianza.

## Los `-ink.png`

Cuatro logos venían en blanco y sobre el chip claro desaparecían. El `-ink` es la
versión adaptada, **es la que usa el sitio**. El original queda al lado por si
alguna vez hace falta la versión sobre fondo oscuro.

| Archivo | Qué se le hizo | Contraste sobre el chip |
|---|---|---|
| `patagonia-berries-ink.png` | Monocromo blanco → tinta `#14161A` | 1.0:1 → **13:1** |
| `familia-cabrales-ink.png` | Monocromo blanco → tinta | 1.0:1 → **13:1** |
| `coderhouse-ink.png` | Monocromo blanco → tinta | 1.1:1 → **13:1** |
| `chemikal-ink.png` | **Sólo el wordmark** a tinta | texto **13:1** |

En los tres monocromos no se perdió ningún color porque no tenían: saturación
medida = 0.00.

**Chemikal es el caso especial.** Tiene texto blanco + un ícono de color
(`#0DABA5`). Se pasó a tinta únicamente lo que está a la derecha del ícono
(x > 89 de 427 px), así el hexágono turquesa, el rojo y la gota blanca de adentro
quedan exactamente como en el original. Si alguna vez se regenera, no alcanza con
filtrar por saturación: eso también oscurecía la gota.

La luminancia de cada pixel pasa al canal alpha en vez de pintar todo de tinta
plana — sin eso el antialias se engorda y el logo queda tosco.

## Si agregás un logo

1. PNG con transparencia a `assets/logos/<marca>.png`.
2. Miralo en los **dos** estados: sobre blanco (hover) y pasado por
   `invert(1) grayscale(1) brightness(2)` sobre el chip oscuro (reposo). Si en
   blanco no contrasta, generá el `-ink`.
3. En el markup, el `--logo-h` del chip se calcula como `63 / √(ancho/alto)`
   redondeado, con tope entre 22 y 56 px. Es lo que hace que un logotipo muy
   ancho y una marca cuadrada tengan la misma masa óptica en vez del mismo alto.
4. El logo va en los **6 strips**: el del hero y el de media página en
   `index.html`, más el hero de las 4 landings de `servicios/`. Acordate de
   duplicarlo en las dos copias del track (la segunda va con `aria-hidden`).
