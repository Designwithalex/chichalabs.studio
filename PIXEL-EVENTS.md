# Meta Pixel — mapa de eventos

Qué mide cada evento, dónde dispara y para qué sirve. Si dentro de seis meses
alguien se pregunta "¿y esto qué era?", la respuesta está acá.

- **Pixel ID:** `1013150531476636`
- **Snippet base:** inline en el `<head>` de las 7 páginas públicas (dispara `PageView`).
- **Eventos:** `js/pixel-events.js`, cargado en las 7 páginas.
- **Server-side (Conversions API):** no está implementado. Todo es client-side.

## Por qué un archivo aparte de `main.js`

`case-study.html` **no carga `main.js`** (carga `case-study.js`) y arma su CTA de
WhatsApp por JS después del load. Por eso `pixel-events.js` es independiente y
escucha los clicks **delegados en `document`**: funciona con CTAs inyectados
dinámicamente y no depende de qué otro JS cargue cada página.

## Los eventos

| Evento | Tipo | Dónde dispara | Para qué |
|---|---|---|---|
| `PageView` | standard | Todas las páginas, en el load | Base de todo. Lo dispara el snippet, no `pixel-events.js`. |
| `ViewContent` | standard | Load de `servicios/*.html` | **Público base de retargeting.** "Vio la landing de un servicio". |
| `Lead` | standard | Click en cualquier link `wa.me`, en todas las páginas | **La conversión.** Es el evento de optimización de la campaña. |
| `Schedule` | standard | Click en cualquier link `calendar.app.google` | El otro camino de cierre: reunión agendada en vez de WhatsApp. |
| `LandingEngaged` | custom | Sección del caso visible en una landing, una sola vez | **Diagnóstico**, no público. Ver abajo. |

### Parámetros

Todos llevan `content_name`, `content_category` y `content_ids`. `content_ids`
es el slug del archivo (`automatizaciones`, `dashboards`, …) — **es por ahí que se
arman los públicos**, así que no lo cambies sin actualizar los públicos en
Events Manager.

```js
// ViewContent
{ content_name: 'Automatizaciones e integraciones', content_category: 'servicio',
  content_ids: ['automatizaciones'], content_type: 'product' }

// Lead / Schedule
{ content_name: …, content_category: 'servicio' | 'sitio', content_ids: [slug],
  location: 'hero' | 'inversion' | 'cta_final' | 'footer' | 'flotante' | 'nav' | 'nav_mobile' | 'diagnostico' | 'contenido',
  source_page: '/servicios/automatizaciones.html' }

// LandingEngaged
{ content_name: …, content_category: 'servicio', content_ids: [slug], section: 'caso' }
```

`location` sale del atributo **`data-location`** puesto a mano en cada `<a>`.
Si a un CTA nuevo se le olvida el atributo, `pixel-events.js` lo infiere del
contenedor (footer / nav / sección) para no ensuciar el corte con `undefined`
— pero **ponelo igual**, la inferencia es un paracaídas, no el mecanismo.

## Los públicos que hay que armar en Events Manager

**Retargeting fase 2 — "visitó la landing y no convirtió":**

```
INCLUIR: ViewContent  donde content_ids contiene 'automatizaciones'
EXCLUIR: Lead         (todos)
```

Ese es exactamente el público de la fase 2. La exclusión por `Lead` es lo que
evita pagarle impresiones a gente que ya te escribió.

## Decisiones que parecen raras y no lo son

**Un solo `Lead` para todos los clicks de WhatsApp del sitio, no un evento por
página.** Con un budget de $140.000 y un CPL sano de $8.000-15.000 estás
esperando entre 9 y 17 leads **en total**, no por semana. Meta necesita ~50
conversiones semanales para salir de fase de aprendizaje. Partir un signal ya
escaso en varios nombres de evento lo vuelve inservible. La diferencia entre
páginas y ubicaciones va en los parámetros, que sirve igual para analizar y no
fragmenta la optimización.

**La home no dispara `ViewContent`.** Su `PageView` alcanza para armar un
público por URL, y mezclarla con las landings rompería el corte por servicio,
que es justo lo que hace útil al público de retargeting.

**`LandingEngaged` es diagnóstico, no público.** Con ~500-900 visitas totales a
la landing, filtrar el retargeting a "leyó el caso" deja un público de ~300
personas: Meta entrega mal por debajo de ~1.000 y te quema el 15% del budget.
Su valor es otro: si el CPL sale mal, distingue **"no llegan a la landing"**
(problema del ad) de **"llegan y rebotan antes del caso"** (problema de la
landing). Un solo evento, no cinco thresholds de scroll.

**Apunta a `.section--tinted`, no a un `aria-label` fijo.** Es la 2da sección de
la landing: en Automatizaciones y Aplicaciones es el caso real, en Dashboards e
IA es "El problema". Mismo slot del funnel en las 4.

**No usamos `Contact`.** Es redundante con `Lead` para la misma acción y
partiría el signal.

## Verificar que funciona

1. **Meta Pixel Helper** (extensión de Chrome) o Events Manager → Test Events.
2. Los bloqueadores de ads cortan `connect.facebook.net` y `fbq` queda sin
   definir. `pixel-events.js` chequea eso antes de cada llamada, así que el
   sitio no se rompe — pero **no vas a ver ningún evento hasta que pruebes sin
   bloqueador**. Si "no anda", descartá esto primero.
3. El JS se cachea fuerte. Al testear cambios, hard reload (Ctrl+Shift+R).

## Si agregás un CTA nuevo

Ponele `data-location="…"` al `<a>` y listo: el tracking es delegado, no hay que
tocar `pixel-events.js` salvo que sea un destino nuevo (ni `wa.me` ni
`calendar.app.google`).
