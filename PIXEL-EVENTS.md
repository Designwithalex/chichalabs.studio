# Meta Pixel — mapa de eventos

Qué mide cada evento, dónde dispara y para qué sirve. Si dentro de seis meses
alguien se pregunta "¿y esto qué era?", la respuesta está acá.

- **Pixel ID:** `1703278184288117`
  (reemplazó a `1013150531476636` el 2026-07-23; los datos del pixel viejo
  quedaron en su propia cuenta y no se migran)
- **Snippet base:** inline en el `<head>` de las 7 páginas públicas (dispara `PageView`).
- **Eventos:** `js/pixel-events.js`, cargado en las 7 páginas.
- **Server-side (Conversions API):** `api/meta-capi.php`. Cada evento sale por
  las dos vías con el mismo `event_id`. Ver "Envío doble" abajo.

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
| `LeadCalificado` | custom | Envío del cotizador **confirmado por el backend** | **LA conversión. Es el evento de optimización de la campaña** desde el 2026-08-18. Ver "Señal blanda vs. señal dura". |
| `Lead` | standard | Lo mismo que `LeadCalificado`, en el mismo momento | Mantiene andando los públicos y los informes que ya existían. **Ya no lo dispara el click a WhatsApp.** |
| `ContactoIniciado` | custom | Click en cualquier link `wa.me` | **Diagnóstico.** Era `Lead` hasta el 2026-08-18: un toque valía una conversión y eso es lo que rompió la campaña C1. |
| `Schedule` | standard | Click en cualquier link `calendar.app.google` | El otro camino de cierre: reunión agendada en vez de WhatsApp. **No usarlo como evento de optimización** — es de un toque, igual que `ContactoIniciado`. |
| `LandingEngaged` | custom | Sección del caso visible en una landing, una sola vez | **Diagnóstico**, no público. Ver abajo. |
| `QuoteStarted` | custom | Eligió un servicio en el cotizador | Arranque del embudo del cotizador. |
| `QuotePriced` | custom | Vio un precio por primera vez (una vez por servicio elegido) | **Diagnóstico.** Contra `QuoteStarted`: cuántos abren el cotizador y se van sin llegar al número. |
| `QuoteContactOpened` | custom | Pidió el formulario de contacto (una vez por servicio elegido) | **Diagnóstico.** Contra `QuotePriced`: si el precio espanta. Contra `Lead`: si la fricción es el formulario. |

### Parámetros

Todos llevan `content_name`, `content_category` y `content_ids`. `content_ids`
es el slug del archivo (`automatizaciones`, `dashboards`, …) — **es por ahí que se
arman los públicos**, así que no lo cambies sin actualizar los públicos en
Events Manager.

```js
// ViewContent
{ content_name: 'Automatizaciones e integraciones', content_category: 'servicio',
  content_ids: ['automatizaciones'], content_type: 'product' }

// ContactoIniciado / Schedule
{ content_name: …, content_category: 'servicio' | 'sitio', content_ids: [slug],
  location: 'hero' | 'inversion' | 'cta_final' | 'footer' | 'flotante' | 'nav' | 'nav_mobile' | 'contenido',
  source_page: '/servicios/automatizaciones.html' }

// LeadCalificado y Lead (los dispara js/cotizador.js, no pixel-events.js).
// Mismos parámetros los dos, pero cada uno con su propio event_id.
{ content_name: 'Automatizaciones', content_category: 'cotizador',
  content_ids: ['automatizaciones'],
  location: 'hero_cotizador' | 'inversion_cotizador' | 'cta_final' | 'nav_mobile' | 'cotizador',
  value: 1170000, currency: 'ARS' }
// + user_data { em, ph } — el endpoint los hashea con SHA-256 antes de Meta

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
INCLUIR: ViewContent       donde content_ids contiene 'automatizaciones'
EXCLUIR: Lead              (todos)
EXCLUIR: ContactoIniciado  (todos)
```

Ese es exactamente el público de la fase 2. La exclusión es lo que evita
pagarle impresiones a gente que ya te escribió.

> **Ojo — hay que tocar este público en Events Manager.** Desde el 2026-08-18
> el click a WhatsApp dispara `ContactoIniciado` y ya no `Lead`. Si el público
> excluye sólo por `Lead`, a todo el que te escriba por WhatsApp le vas a
> seguir pagando impresiones. Sumá la segunda exclusión a mano.

## Decisiones que parecen raras y no lo son

**~~Un solo `Lead` para todos los clicks de WhatsApp del sitio~~ — REVERTIDO
el 2026-08-18.** El razonamiento original era: con un budget de $140.000 y un
CPL sano de $8.000-15.000 esperás 9 a 17 leads **en total**; Meta necesita ~50
conversiones semanales para salir de fase de aprendizaje; partir un signal ya
escaso en varios nombres de evento lo vuelve inservible.

Eso era cierto mientras el problema fuera la **escasez** de señal. El problema
pasó a ser el opuesto: la señal era tan barata de producir que Meta la fabricó
en cantidad industrial y toda basura (60 leads en 6 días, ninguno cliente). Un
evento que se dispara con un toque no se puede defender con "es que tenemos
poco volumen" — el volumen que trae es ruido, y el ruido no enseña, confunde.

Sigue valiendo la mitad buena de la idea: **un solo evento duro**, no uno por
página ni por servicio. Lo que cambió es cuál es ese evento y qué hace falta
para dispararlo. La diferencia entre páginas y ubicaciones sigue yendo en los
parámetros, que sirve para analizar y no fragmenta la optimización.

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

### 2026-07-30 — de dónde viene el `Lead` en las landings de servicio

Las 4 landings de servicio **ya no tienen CTA de WhatsApp**: el botón
principal pasó a ser "Quiero saber el precio", que abre el cotizador. Sólo
quedó el globo flotante de WhatsApp.

El evento `Lead` **no se perdió**: el envío del formulario del cotizador
dispara el mismo `Lead`, con `location: 'cotizador_modal'` y además `value`
(el precio calculado) y `currency: 'ARS'`. Al ser el mismo nombre de evento,
la campaña sigue optimizando contra la misma señal y el público de exclusión
sigue funcionando igual.

> **Desactualizado el 2026-08-18.** El click a WhatsApp ya no dispara `Lead`
> sino `ContactoIniciado`, y el evento de optimización pasó a ser
> `LeadCalificado`. El resto de esta sección (el embudo del cotizador, el
> corte por `location`, el `value`) sigue vigente tal cual. Ver
> "Señal blanda vs. señal dura" más abajo.

Qué cambia en la práctica:

- El `Lead` ahora exige más del visitante (marcar opciones + dejar el email),
  así que **el volumen va a bajar y la calidad debería subir**: llega con el
  alcance elegido y el email confirmado, no una charla que arranca de cero.
- El corte por `location` te dice **desde qué botón** convirtió: el modal le
  pasa al evento el `data-location` del botón que lo abrió, así que vas a ver
  `hero_cotizador`, `inversion_cotizador`, `cta_final` o `nav_mobile`. Desde
  la home (widget inline, sin botón de por medio) es `cotizador`.
- `value` permite optimizar por valor, no sólo por cantidad de leads. Con el
  volumen actual todavía no alcanza, pero el dato ya se está juntando.

**Ojo si el CPL se dispara:** antes de tocar los ads, mirá dónde se cae la
gente dentro del cotizador. El embudo completo son cuatro pasos y cada caída
tiene un arreglo distinto:

```
QuoteStarted  →  QuotePriced  →  QuoteContactOpened  →  Lead
   abrió          vio el precio     pidió el form        dejó los datos
```

- Se caen entre **`QuoteStarted` y `QuotePriced`**: no entienden qué marcar.
  Es un problema de las preguntas de los módulos, no del precio.
- Se caen entre **`QuotePriced` y `QuoteContactOpened`**: el número los
  espantó. Ahí el problema es de oferta o de a quién le estás pautando.
- Se caen entre **`QuoteContactOpened` y `Lead`**: el precio les cerró pero no
  quieren dejar los datos. Es fricción del formulario.

Los dos del medio se reportan **una sola vez por servicio elegido** (`elegir()`
los resetea): el precio se recalcula con cada check y el formulario se puede
abrir y cerrar, y sin ese tope un solo visitante indeciso mandaría veinte
eventos y arruinaría la tasa.

**No usamos `Contact`.** Es redundante con `Lead` para la misma acción y
partiría el signal.

### 2026-08-18 — Señal blanda vs. señal dura

**Qué pasó.** La campaña `C1 · Cotizador` hizo 60 leads en 6 días a ARS 664
cada uno y **ninguno se convirtió en cliente**. El 97% del gasto se fue a
Audience Network (apps y juegos de terceros) y de ahí salieron los 60 leads;
Facebook e Instagram juntos, cero. El 65% de los leads tenía 65+ años para un
servicio B2B de automatización e IA. El CTR era de 20-25% (10x lo normal) y
**subía con la edad**: eso es patrón de clic accidental, no de interés.

**La causa raíz es de código, no de segmentación.** El evento de optimización
era `Lead`, y `Lead` se disparaba con un click en cualquier link de WhatsApp
— incluido el globo flotante, fijo abajo a la derecha, justo donde cae el
pulgar. Un toque, cero validación, cero confirmación de nadie: una conversión.

Meta puja por volumen al menor costo posible. Si le pedís `Lead` y `Lead`
cuesta un toque, va a comprar toques. Los encontró más baratos en gente mayor
tocando sin querer un banner adentro de un jueguito. **Mientras el evento sea
fácil de disparar, el algoritmo va a seguir buscando basura barata**, tengas
la segmentación que tengas. Sacar Audience Network y recortar la edad ayuda,
pero no arregla el incentivo.

**La regla que quedó:**

| | Blando | Duro |
|---|---|---|
| Eventos | `ContactoIniciado`, `Schedule`, `QuoteStarted`, `QuotePriced`, `QuoteContactOpened`, `LandingEngaged` | `LeadCalificado` y `Lead` |
| Cuesta | un toque | 4 campos válidos + confirmación del backend |
| Sirve para | diagnóstico, embudo, públicos de exclusión | **optimizar la campaña** |

Un evento blando **nunca** puede ser el evento de optimización de una campaña.
Si algún día hace falta poner uno ahí, primero hay que volverlo duro.

**Por qué `LeadCalificado` existe además de `Lead`.** Los dos salen en el mismo
momento y con los mismos parámetros, y a primera vista es redundante. No lo es:
en Meta, `Lead` arrastra el historial de aprendizaje contaminado con los 60
leads basura de C1. Apuntar la campaña a un nombre de evento **sin historia**
le da al algoritmo una hoja limpia, y ese nombre por definición sólo se puede
disparar completando el formulario entero. `Lead` se sigue mandando para no
romper los públicos ni los informes que ya existían.

### Guardas anti-accidente del formulario

Todo esto vive en `js/cotizador.js`, en `onSubmit()` y `validar()`.

| Guarda | Qué corta | Dónde |
|---|---|---|
| **Después del `await`** | El evento sale recién cuando n8n recalculó el precio, generó el PDF y mandó el mail. `api()` tira si la respuesta no es 2xx. | `onSubmit()` |
| **Honeypot** | Campo `url_sitio`, fuera de pantalla y del tab order. Si viene con algo, es un script: se muestra la vista de enviado y no se manda nada. | `onSubmit()`, guarda 1 |
| **Interacción real** | Exige un `pointerdown`, `keydown` o `input` adentro del formulario. El autofill del browser dispara `input`, así que no molesta a nadie. | `onSubmit()`, guarda 2 |
| **Piso de tiempo** | 5 segundos entre abrir el formulario y enviarlo (`MIN_SEGUNDOS_FORM`). Avisa y deja reintentar, no bloquea. | `onSubmit()`, guarda 3 |
| **Empresa obligatoria** | El campo que más separa B2B de curioso. | `validar()` |
| **Teléfono AR obligatorio** | Normaliza los formatos reales (`+54 9 11…`, `011 15…`, `11 2345 6789`) y exige 10 dígitos nacionales con característica válida. **Rechaza números de otros países a propósito.** | `telefonoARValido()` |
| **Email más estricto** | TLD alfabético de 2+, sin puntos pegados ni punto al borde. | `emailValido()` |

**No hay validación equivalente del lado de n8n.** El nodo `Armar propuesta`
sigue exigiendo sólo nombre + email (ver `n8n/cotizador-propuesta.json`). O sea:
alguien que pegue un POST a mano al webhook puede saltearse todo esto. **No
importa para el pixel** — los eventos los dispara el navegador, no n8n, así
que un POST directo no genera ninguna conversión. Sí importaría si algún día
los eventos se mandaran desde n8n: ahí habría que replicar las reglas allá.

## Envío doble — browser + Conversions API

Cada evento sale por dos caminos a la vez:

1. **Browser** — `fbq(...)`, como siempre.
2. **Servidor** — `POST /api/meta-capi.php`, que lo reenvía a Meta.

**Por qué.** Los bloqueadores cortan `connect.facebook.net` y `fbq` queda sin
definir: ese evento no le llega a Meta y para la campaña no existió. El
endpoint es *first-party* (mismo dominio), así que los bloqueadores no lo
tocan y el evento llega igual. Con ~15 leads al mes, perder 20-30% es la
diferencia entre que la campaña aprenda o no.

**Deduplicación.** Las dos copias llevan el **mismo `event_id`** (un UUID que
genera `pixel-events.js` y pasa a `fbq` como `eventID`). Meta las une y cuenta
una sola. Si no coincidieran, cada lead se contaría dos veces y el CPL que
reporta Meta sería la mitad del real.

**Qué NO hay que mandar desde el JS.** El `fetch` es same-origin, así que el
browser manda solo las cookies `_fbp` y `_fbc`, y PHP ve la IP y el user-agent
reales del visitante. Eso es justo lo que levanta el Event Match Quality y
sale gratis. Lo único que agrega el JS es el **email y el teléfono** del
cotizador, que no viajan en ninguna cookie: van en claro hasta el endpoint,
que los hashea con SHA-256 antes de mandarlos (Meta nunca los recibe en
limpio).

**Configuración.** `META_PIXEL_ID` y `META_CAPI_TOKEN` en `config/config.php`
(ver `config.php.example`). **Si el token está vacío el endpoint responde 503
y no manda nada** — falla cerrado, y el sitio sigue andando con el pixel del
browser solo. O sea: hasta que no cargues el token en el servidor, esto no
está haciendo nada.

**El endpoint es público**, no hay forma de que no lo sea. Lo que lo protege
es la allowlist de nombres de evento en `CAPI_EVENTOS` y un chequeo de
`Origin`. Si agregás un evento nuevo al sitio, **sumalo a esa constante** o el
espejo server-side lo va a descartar con un 422 (el del browser sí va a andar,
así que se nota poco: mirá el log de PHP).

## Verificar que funciona

1. **Meta Pixel Helper** (extensión de Chrome) o Events Manager → Test Events.
2. Los bloqueadores de ads cortan `connect.facebook.net` y `fbq` queda sin
   definir. `pixel-events.js` chequea eso antes de cada llamada, así que el
   sitio no se rompe, y **Pixel Helper no te va a mostrar nada**. Desde que
   existe el envío doble eso ya no significa que el evento se perdió: fijate
   en Events Manager, donde debería aparecer igual con origen *server*. Si no
   aparece por ninguna de las dos vías, ahí sí hay un problema.
3. Para probar el lado server: la pestaña Network del navegador tiene que
   mostrar el `POST` a `/api/meta-capi.php` con respuesta `200 {"ok":true}`.
   Un **503** es que falta `META_CAPI_TOKEN` en `config/config.php`; un
   **422**, que el evento no está en `CAPI_EVENTOS`.
4. El JS se cachea fuerte. Al testear cambios, hard reload (Ctrl+Shift+R), y
   acordate de subirle el `?v=` a `pixel-events.js` y `cotizador.js` en el
   HTML cuando lo despliegues.

## Si agregás un CTA nuevo

Ponele `data-location="…"` al `<a>` y listo: el tracking es delegado, no hay que
tocar `pixel-events.js` salvo que sea un destino nuevo (ni `wa.me` ni
`calendar.app.google`).
