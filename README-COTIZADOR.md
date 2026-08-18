# Cotizador automático — cómo funciona y cómo se mantiene

Cotizador en vivo de chichalabs.studio: el visitante elige un servicio, marca
los módulos que necesita, ve el precio actualizarse al instante y recibe la
propuesta en PDF por email con el link de Calendar.

**Estado: MVP con email. WhatsApp queda para Fase 2** (ver el final).

---

## 1. Las cinco piezas

| Pieza | Dónde vive | Qué hace |
|---|---|---|
| Base de módulos | Notion — [Módulos del Cotizador](https://app.notion.com/p/1d233d3aae7c4398877adf5c00916f1a) | Las horas de cada módulo. **Única fuente de verdad de los precios.** |
| API liviana | n8n — `Cotizador — API liviana` | Sirve el formulario y calcula el precio en vivo |
| Propuesta | n8n — `Cotizador — Propuesta (PDF + email)` | Calcula, genera el PDF y manda el email |
| Web | este repo | La sección `#cotizador` de la home y el modal de las landings |
| Admin | este repo | El importador del editor de propuestas (ver sección 5) |

### Dos formas de mostrarlo, un solo template

`js/cotizador.js` genera todo el markup del widget. En el HTML no hay ni una
línea del formulario, a propósito: si estuviera, habría que mantener cinco
copias iguales (home + 4 landings).

- **Inline** — un `<div class="quoter" data-inline></div>` vacío. Está sólo
  en la home, con el selector de los 4 servicios arriba.
- **Modal** — cualquier `<button data-cotizador="ID-DE-SERVICIO">`. Abre el
  cotizador ya filtrado por ese servicio, **sin sacar al visitante de la
  landing donde está**. No muestra el selector: entra directo a las
  preguntas.

Para sumar un botón en cualquier página:

```html
<button type="button" class="btn btn--outline btn--lg"
        data-cotizador="automatizaciones" data-location="hero_cotizador">
  Quiero saber el precio
</button>
```

Y que la página cargue `css/cotizador.css` y `js/cotizador.js`. Nada más:
el listener es delegado en `document`, así que funciona con botones que
aparezcan después.

Todos los CTA del cotizador dicen **"Quiero saber el precio"**. Si agregás
uno nuevo, mantené el texto: es el mismo botón en toda la web.

### Por qué el cálculo NO está en JavaScript

Si la fórmula `horas × $45.000` estuviera en el front, cualquiera la vería con
"Ver código fuente" y sabría exactamente cuánto cuesta cada módulo. Por eso:

- `GET /modulos` devuelve los módulos **sin horas ni precios**. El navegador
  sólo sabe qué preguntar, nunca cuánto vale.
- `POST /precio` recibe la selección y devuelve el total ya calculado.
- El servidor **no confía en lo que manda el navegador**: los módulos Base
  entran siempre, las cantidades se recortan a `[0, 20]`, los toggles cuentan
  como máximo 1 y los ids desconocidos se ignoran.

---

## 2. Recorrido completo

```
Visitante en chichalabs.studio/#cotizador
        │
        │  elige servicio
        ▼
GET  {n8n}/webhook/cotizador/modulos?servicio=automatizaciones
        └─→ Notion → filtra por Servicio → devuelve preguntas SIN horas
        │
        │  marca módulos (cada cambio, con 300 ms de debounce)
        ▼
POST {n8n}/webhook/cotizador/precio
        └─→ Notion → suma horas × $45.000 → { total, horas, desglose }
        │
        │  completa nombre + email + empresa + teléfono AR y envía
        │  (los 4 son obligatorios desde el 2026-08-18; el front valida
        │   formato, honeypot y piso de tiempo — ver PIXEL-EVENTS.md →
        │   "Guardas anti-accidente")
        ▼
POST {n8n}/webhook/cotizador/propuesta
        ├─→ Notion → recalcula (nunca confía en el precio del navegador)
        ├─→ POST chichalabs.studio/api/cotizador-pdf.php → PDF binario
        ├─→ Email al cliente, con el PDF adjunto y el link de Calendar
        ├─→ Email de aviso interno a notificaciones@chichalabs.studio
        └─→ responde { ok: true } → la web muestra "Te mandamos la propuesta"
```

---

## 3. Qué hace cada nodo

### Workflow `Cotizador — API liviana` (`n8n/cotizador-api-liviana.json`)

Dos ramas independientes, una por endpoint.

**Rama módulos** (dibuja el formulario)

| Nodo | Qué hace |
|---|---|
| `Webhook módulos` | `GET cotizador/modulos?servicio=<id>`. CORS limitado a chichalabs.studio |
| `Notion · módulos` | Trae las filas de la base (page_size 100; hoy son ~36) |
| `Armar formulario` | Filtra por servicio, decide el tipo de control y **borra las horas** |
| `Responder módulos` | Devuelve el JSON al navegador |

**Rama precio** (calculadora en vivo)

| Nodo | Qué hace |
|---|---|
| `Webhook precio` | `POST cotizador/precio` con `{servicio, seleccion}` |
| `Notion · precio` | Mismo query a Notion |
| `Calcular precio` | Valida la selección y suma `horas × VALOR_HORA` |
| `Responder precio` | Devuelve `{total, horas, desglose}` |

### Workflow `Cotizador — Propuesta` (`n8n/cotizador-propuesta.json`)

| Nodo | Qué hace |
|---|---|
| `Webhook propuesta` | `POST cotizador/propuesta` con selección + contacto |
| `Notion · módulos` | Trae las filas otra vez (recalcula de cero, por seguridad) |
| `Armar propuesta` | Valida el contacto, recalcula el precio, arma número y fecha |
| `Generar PDF` | POST a `/api/cotizador-pdf.php`, recibe el PDF como binario |
| `Preparar envío` | **Punto único de salida.** Deja listos los datos + el PDF |
| `Email al cliente` | Manda el PDF adjunto, el link de Calendar y el de descarga |
| `Aviso interno` | Copia a notificaciones@chichalabs.studio |
| `FASE 2 · acá va WhatsApp` | Placeholder. Ver sección 9 |
| `Confirmar al formulario` | Responde `{ok:true, numero}` a la web |

### Cómo se decide el tipo de control de cada módulo

Sale de las columnas de Notion, sin tocar código:

| En Notion | En el formulario |
|---|---|
| `Categoría = Base` | Aparece como **"Incluido"**, no se puede desmarcar |
| `Se aplica = Una vez` | Interruptor sí/no |
| `Se aplica = Por página / Por idioma / Por revisión` | Selector de cantidad (0 a 10) |
| `Pregunta del formulario` empieza con `(` y **no** es Base | **No se muestra** (ej. "Ronda de revisión extra") |
| `Activo` destildado | No se muestra |

---

## 4. Tareas de mantenimiento

### Agregar un módulo nuevo

Todo en Notion, **sin tocar código ni n8n**:

1. Nueva fila en [Módulos del Cotizador](https://app.notion.com/p/1d233d3aae7c4398877adf5c00916f1a).
2. Completá: **Módulo**, **Servicio**, **Categoría**, **Horas**, **Se aplica**,
   **Descripción** y **Pregunta del formulario**.
3. Tildá **Activo**.

La pregunta es el texto que ve el cliente — escribila como pregunta directa
("¿Necesitás vender productos online?"). La descripción va abajo, en gris, y
también sale en el PDF. Si querés que un módulo exista para cotizar a mano
pero **no** aparezca en la web, poné la pregunta entre paréntesis.

> ⚠️ **`Módulo`, `Pregunta del formulario` y `Descripción` son texto de cara
> al cliente.** Salen tal cual en la web y en el PDF de la propuesta. Las
> notas internas ("ojo que este campo está así por tal motivo") van en el
> **cuerpo de la página del módulo**, que el cotizador no lee: solo lee
> propiedades.

Dos reglas de redacción, aprendidas a los golpes:

1. **Nada de jerga.** El que lee es un dueño de negocio, no un developer.
   Nunca: n8n, RAG, CRM, ERP, API, KPI, CMS, flujo, disparador, fuente de
   datos, microinteracciones, human-in-the-loop. Escribí lo que la persona
   va a *notar*, no cómo está hecho por dentro.
2. **La pregunta tiene que coincidir con el control.** Si `Se aplica` no es
   `Una vez`, el formulario dibuja un selector de cantidad: la pregunta
   tiene que arrancar con "¿Cuántos…?". Si es `Una vez`, es un interruptor
   sí/no y la pregunta no puede pedir un número.

Aparece en la web en el próximo pedido: no hay cache, cada request lee Notion.

### Sacar o cambiar el precio de un módulo

Destildá **Activo** o cambiá **Horas** en Notion. Listo.

### Cambiar el valor de la hora

Está en **un solo lugar por workflow**: la constante `VALOR_HORA` arriba del
código de los nodos `Armar formulario`, `Calcular precio` y `Armar propuesta`.
Hay que cambiarla en los **tres** (los workflows son autocontenidos a
propósito, para poder importar uno sin el otro).

### Agregar un servicio nuevo

1. **Notion:** sumá la opción en la columna `Servicio` y cargá sus módulos
   (al menos uno de Categoría `Base`).
2. **n8n:** agregá la línea en el mapa `SERVICIOS` de los tres Code nodes:
   ```js
   'mi-servicio-nuevo': 'Nombre exacto en Notion',
   ```
3. **Web:** sumá la entrada al array `SERVICIOS` de `js/cotizador.js`, con su
   ícono. **El markup de los botones lo genera ese archivo**: en `index.html`
   no hay nada que tocar. Si quedan más de 5 servicios, revisá los breakpoints
   de `.quoter__services` en `css/cotizador.css` para que la última fila no
   quede con una tarjeta suelta.
4. **Admin:** sumá el `{ id, nombre }` al array `SERVICIOS` de
   `admin/js/cotizador-admin.js`, para que aparezca en el importador.
5. Si tiene landing propia, los botones `data-cotizador="mi-servicio-nuevo"`
   abren el modal ya filtrado. El link viejo
   `index.html?servicio=mi-servicio-nuevo#cotizador` también sigue andando.

El id **tiene que ser idéntico en los tres archivos** (n8n, `js/cotizador.js`
y `admin/js/cotizador-admin.js`), y el valor del mapa de n8n tiene que ser
idéntico al de Notion.

---

## 5. El cotizador dentro del admin

El editor de propuestas (`/admin/propuesta-editor.php`) tiene un panel
**“Armar desde el cotizador”**: elegís un servicio, respondés las mismas
preguntas que ve un visitante en la web y los módulos entran en la propuesta
de ese cliente, en vez de cargarlos a mano uno por uno.

### Qué comparte con el cotizador público y qué no

**Comparte** el contrato con n8n (`GET /modulos` para las preguntas,
`POST /precio` para el desglose) y las clases de `css/cotizador.css` para
dibujarlas. El catálogo sigue siendo Notion: un módulo nuevo aparece en los
dos lados sin tocar código.

**No comparte** ni la UI ni el precio, y son dos archivos distintos a
propósito:

| | Cotizador público | Importador del admin |
|---|---|---|
| Termina en | Formulario de contacto → PDF por email | `proposal_modules` de una propuesta |
| Valor hora | `VALOR_HORA` de n8n, siempre en pesos | El de la propuesta, en su moneda |
| Horas | Las decide Notion | Las decide Notion, **editables a mano** |
| Eventos de Pixel | Sí | No — es una herramienta interna |

### Por qué importa las horas y no el precio

De la respuesta de `/precio` se usa **`horas` de cada módulo, nunca
`subtotal`**. El cotizador público cotiza a $45.000/h en pesos; una propuesta
puede estar en dólares y a otro valor hora. Con las horas cargadas, el precio
lo resuelve la propuesta con la fórmula que ya usaba (`valor hora × horas`), y
cambiar el valor hora recalcula todos los módulos de una.

Si la propuesta todavía no tiene valor hora, la importación igual funciona:
los módulos entran con precio 0 y toman precio en cuanto lo cargues y guardes.

### Las horas son editables — a propósito

En la tabla de preview cada fila trae las horas del catálogo en un campo
editable, y se puede destildar una fila para que no entre. Lo que se guarda es
**lo que quedó en el formulario**, no lo que devolvió n8n.

Es la excepción deliberada a la regla de “el servidor no confía en el
navegador” de la sección 1: esa regla existe porque del lado público la
selección la arma un visitante anónimo. Acá la arma un admin logueado, que
tiene todo el derecho de corregir la estimación para un cliente puntual.

### Detalles que conviene saber

- **Suma, no reemplaza.** Los módulos se agregan al final, con la numeración
  siguiendo desde el último. Para volver a empezar está el tilde *“Reemplazar
  los N módulos que ya tiene la propuesta”*.
- **Todo entra como costo único.** El cotizador no distingue mensual de único;
  si un módulo es mensual, se cambia después desde la tabla de módulos.
- **Las cantidades van en el nombre.** Tres páginas adicionales entran como una
  sola fila, `Página adicional ×3`, con las horas ya multiplicadas.
- **Una propuesta aceptada no se toca.** El panel ni siquiera se muestra, y el
  POST está bloqueado igual que el resto de las mutaciones.
- **Si n8n no responde**, el panel avisa y te quedan el formulario de “Nuevo
  módulo” de siempre para cargar a mano.

---

## 6. Puesta en marcha en n8n

### 5.1 Credenciales (crear antes de importar)

| Credencial | Tipo | Contenido |
|---|---|---|
| `Notion — Cotizador` | Header Auth | Nombre `Authorization`, valor `Bearer secret_xxx` |
| `ChichaLabs — PDF cotizador` | Header Auth | Nombre `X-Cotizador-Key`, valor = `COTIZADOR_PDF_SECRET` |
| `Hostinger — notificaciones@…` | SMTP | host `smtp.hostinger.com`, puerto `465`, SSL, usuario y contraseña de la casilla |

Para la de Notion: crear una integración interna en
notion.so/my-integrations, copiar el token, y en la base de Módulos hacer
**⋯ → Conexiones → agregar la integración** (si no, la API devuelve 404).

### 5.2 En el servidor web

Agregar a `config/config.php` (vive sólo en el servidor, no se commitea):

```php
define('COTIZADOR_PDF_SECRET', 'pegá-acá-un-secreto-largo');
```

Generar uno con `php -r "echo bin2hex(random_bytes(24));"`. Tiene que ser el
mismo valor que la credencial `ChichaLabs — PDF cotizador` de n8n. Si queda
vacío, `/api/cotizador-pdf.php` responde 503 y no genera nada — falla cerrado
a propósito.

### 5.3 Importar y activar

1. En n8n: **Workflows → Import from File** → `n8n/cotizador-api-liviana.json`
   y `n8n/cotizador-propuesta.json`.
2. En cada nodo con credencial, elegirla del desplegable (los JSON traen
   `REEMPLAZAR_ID_*` como placeholder).
3. **Activar los dos workflows.** Sin activar, las URLs `/webhook/...` no
   existen (sólo andan las de `/webhook-test/...` mientras mirás el editor).
4. Verificar que la URL base coincida con el `data-api` de `index.html`:
   ```html
   <div class="quoter" id="quoter" data-api="https://TU-N8N/webhook/cotizador">
   ```

### 5.4 Probar sin la web

```bash
curl "https://TU-N8N/webhook/cotizador/modulos?servicio=automatizaciones"

curl -X POST https://TU-N8N/webhook/cotizador/precio \
  -H "Content-Type: application/json" \
  -d '{"servicio":"automatizaciones","seleccion":{}}'
# → sólo el módulo base: {"horas":10,"total":450000,...}
```

---

## 7. Archivos del repo

| Archivo | Para qué |
|---|---|
| `index.html` → `<section id="cotizador">` | Marcado de la sección |
| `css/cotizador.css` | Estilos (sólo tokens de `css/tokens.css`) |
| `js/cotizador.js` | Pide módulos, precio y envía la propuesta. **No calcula nada**. También el array `SERVICIOS` con los íconos |
| `admin/js/cotizador-admin.js` | El importador del admin (sección 5). Mismo contrato con n8n, otra UI |
| `admin/propuesta-editor.php` → `import_cotizacion` | Crea los `proposal_modules` con lo que quedó en el preview |
| `api/cotizador-pdf.php` | Endpoint que devuelve el PDF. Autenticado por header |
| `includes/propuesta-pdf.php` | Template HTML + render del PDF |
| `includes/dompdf/` | Dompdf vendorizado (sin Composer) |
| `includes/fonts/` | Inter + JetBrains Mono, embebidas en el PDF |
| `tools/preview-propuesta.php` | Preview del PDF sin pasar por n8n |
| `n8n/*.json` | Los dos workflows, importables |

`n8n/` y `tools/` **no se suben al hosting** (excluidos en el deploy).

### Tocar el diseño del PDF

```bash
php tools/preview-propuesta.php        # genera tools/preview.html y preview.pdf
php tools/preview-propuesta.php --html # sólo el HTML, para iterar rápido
```

El template está en `propuesta_html()` dentro de `includes/propuesta-pdf.php`.
Los colores están todos juntos arriba de la función.

---

## 8. Decisiones que conviene conocer

**El PDF es claro, no oscuro.** La marca es Dark Premium, pero Dompdf pinta
siempre de blanco el área del margen de página: un PDF full-dark queda con un
marco blanco alrededor. Además una propuesta se imprime y se reenvía. La
identidad se mantiene con la banda negra del encabezado, el bloque de totales
en negro, el verde de marca y las tipografías reales. Si igual se quiere
oscuro, se cambian los colores arriba de `propuesta_html()`.

**El PDF se genera en el hosting, no en n8n.** n8n no tiene nodo de HTML→PDF y
las alternativas eran servicios pagos. El hosting ya tiene PHP, así que el
template vive en este repo, al lado de los tokens de diseño, y se puede
previsualizar en el navegador.

**Un solo evento `Lead` en el Pixel.** El envío del formulario dispara `Lead`
con `location: 'cotizador'`, el mismo evento que los clics a WhatsApp. Con el
volumen de la campaña, partir la señal en dos eventos la dejaría inservible
(ver `PIXEL-EVENTS.md`). Además dispara `QuoteStarted` (custom) al elegir
servicio y `QuoteUnavailable` si n8n no responde.

**Si n8n se cae, la sección no queda rota.** Se esconde la calculadora y
aparece un bloque con WhatsApp y Calendar. Lo mismo sin JavaScript.

**El PDF va adjunto Y queda descargable.** El adjunto es la vía principal,
pero en el celular muchos clientes de correo lo esconden, así que el email
suma un botón secundario. `Armar propuesta` genera un token aleatorio de 96
bits y el endpoint guarda una copia en `/propuestas/<numero>-<token>.pdf`.

Sobre esa carpeta:

- **Lo único que protege una propuesta es que la URL no es adivinable.** No
  hay login. Si el token se filtra, esa propuesta queda accesible — no
  pongas nada ahí que no puedas mandar por mail.
- `.htaccess` corta el listado de directorio, la ejecución de PHP y todo lo
  que no sea `.pdf`. Además está en `robots.txt` y va con `X-Robots-Tag`.
- Los PDF están **excluidos del sync por FTP**: si no, cada deploy borraría
  las propuestas ya emitidas. La carpeta y su `.htaccess` sí se despliegan.
- Se borran solas a los 180 días (`limpiar_viejas()`), para que no crezca
  sin techo.
- La carpeta tiene que ser **escribible** en el servidor. Si no lo es, el
  PDF igual se genera y se manda adjunto, pero el botón de descarga da 404.

**Los emails no llevan la firma de n8n.** Los dos nodos van con
`appendAttribution: false`; si no, el pie dice "This email was sent
automatically with n8n".

---

## 9. Fase 2 — sumar WhatsApp

Cuando Meta apruebe la verificación del negocio:

1. Abrir `Cotizador — Propuesta` en n8n.
2. Borrar el nodo `FASE 2 · acá va WhatsApp` (es un No-Op vacío).
3. Poner en su lugar el nodo de **WhatsApp Business Cloud** y conectarlo a la
   salida de **`Preparar envío`**.
4. No hay que tocar nada más. `Preparar envío` ya entrega todo lo necesario:

   | Campo | Contenido |
   |---|---|
   | `telefono` | Teléfono que cargó el cliente |
   | `nombre`, `servicio`, `numero` | Para el template del mensaje |
   | `total_formateado` | Ej. `$ 1.170.000` |
   | `calendar` | Link de reservas |
   | `pdf_url` | URL pública del PDF — **la vía más simple para WhatsApp** |
   | `binary.data` | El PDF ya generado, por si preferís subirlo como media |

Para el documento, WhatsApp Cloud API acepta una URL directa, así que
`pdf_url` te evita todo el paso de subir el archivo a la API de media.

El template aprobado de WhatsApp tiene que tener **header de tipo documento**
para poder mandar el PDF. Si el cliente no dejó teléfono, hay que poner un IF
antes del nodo — el teléfono es opcional en el formulario.

El email no se toca: sigue saliendo igual, en paralelo.
