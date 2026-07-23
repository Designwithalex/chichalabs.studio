# Logos de clientes

Los usa el componente `.logo-strip` (ver `css/styles.css`). Van sobre un **chip
glass en clave clara** — `rgba(255,255,255,0.85)` + el `--glass-blur` del sistema,
que sobre el fondo del sitio da `#DADADA` — no sobre el fondo oscuro.

## Por qué chip claro

El `--glass-bg` de los tokens es `rgba(255,255,255,0.04)`: sobre `#0A0A0B` da un
chip `#141415`, o sea casi negro, y ahí Cabrales vuelve a **1.7:1**. Por eso el
chip usa el vocabulario glass del sistema (blur, borde, highlight, radius) pero
con el fill claro.

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
2. Miralo sobre `#DADADA` (el chip resultante). Si es claro u oscuro-sin-contraste, generá el `-ink`.
3. En el markup, el `--logo-h` del chip se calcula como `63 / √(ancho/alto)`
   redondeado, con tope entre 22 y 56 px. Es lo que hace que un logotipo muy
   ancho y una marca cuadrada tengan la misma masa óptica en vez del mismo alto.
4. El logo va en los **6 strips**: el del hero y el de media página en
   `index.html`, más el hero de las 4 landings de `servicios/`. Acordate de
   duplicarlo en las dos copias del track (la segunda va con `aria-hidden`).
