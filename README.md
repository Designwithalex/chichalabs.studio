# ChichaLabs Studio — sitio público

Sitio comercial estático. HTML, CSS y JS vanilla, sin build step. El único PHP
que queda es `api/meta-capi.php`, el envío server-side del píxel de Meta.

---

## Qué hay acá

```
index.html            — home completa
case-study.html       — detalle de un caso (levanta los datos de js/case-studies-data.js)
privacidad.html       — política de privacidad
servicios/            — 5 landings de servicio, una por campaña
  aplicaciones-web.html · apps.html · automatizaciones.html
  dashboards.html · ia-procesos.html
css/
  tokens.css          — design system "Dark Premium" (fuente de verdad, ver DESIGN-SYSTEM.md)
  styles.css          — home + estilos base
  case-study.css      — página de caso
  landing.css         — landings de servicio
js/
  main.js             — canvas del hero, reveals con GSAP, íconos, count-up, marquee
  case-studies-data.js — CMS de los casos. Editar acá actualiza home y case-study
  case-study.js       — render de la página de caso
  pixel-events.js     — eventos de Meta (ver PIXEL-EVENTS.md)
  vendor/             — GSAP + ScrollTrigger
api/
  meta-capi.php       — Conversions API. Necesita config/config.php
config/
  config.php.example  — plantilla. El config.php real vive SÓLO en el servidor
assets/               — logos, imágenes, favicon
```

**Los casos de estudio no salen de una base de datos.** La fuente de verdad es
`js/case-studies-data.js`; el flag `showInHome` decide cuáles aparecen en la home.

> **2026-08-20 — se dieron de baja el panel admin, el portal del cliente, el
> sistema de propuestas y el cotizador público.** Nunca se usaron. Con ellos se
> fueron `admin/`, `portal/`, `sql/`, `n8n/`, `tools/` y todo `includes/`
> (dompdf y PHPMailer incluidos). Las tablas siguen existiendo en Hostinger,
> pero ya no hay interfaz que las lea. Si necesitás recuperar algo, está en el
> historial de git.

---

## Deploy

**Push a `main` publica el sitio.** `.github/workflows/deploy.yml` sincroniza el
repo por FTP contra `public_html/` en Hostinger en cada push. No hay build ni
paso manual.

`config/config.php` está excluido del sync a propósito: tiene el token real de
la Conversions API y vive únicamente en el servidor. Si lo pisás, el píxel
server-side deja de mandar y `/api/meta-capi.php` empieza a devolver **503**.

---

## ⚠️ Al cambiar un CSS o un JS: subile la versión

Hostinger sirve los assets con `Cache-Control: max-age=604800` (**7 días**).
Sin nada más, cualquiera que haya entrado en la última semana sigue viendo el
CSS y el JS viejos aunque el HTML sea nuevo. Ya nos mordió una vez: se
publicaron botones que dependían de un JS nuevo y a los visitantes recurrentes
no les hacían nada.

Por eso toda referencia local lleva un sello de versión:

```html
<link rel="stylesheet" href="css/styles.css?v=20260820">
<script defer src="js/pixel-events.js?v=20260820"></script>
```

**Cada vez que edites algo de `css/` o `js/`, subí el número en todas las
páginas:**

```bash
grep -rl "v=20260820" --include="*.html" . | xargs sed -i "" "s/v=20260820/v=$(date +%Y%m%d)/g"
```

Sin eso el cambio queda publicado pero medio invisible, y es difícil de
diagnosticar porque a vos —que hiciste hard-reload— se te ve bien.

---

## Los dos caminos de contacto

El sitio no vende precio: pide una conversación. Todos los CTA van a uno de dos
destinos, y no hay un tercero:

| Destino | URL |
|---|---|
| Agendar | `https://calendar.app.google/YrXbTqH8iREgLShf6` |
| WhatsApp | `https://wa.me/5491178221468?text=…` |

Si cambia alguno, hay que reemplazarlo en las 8 páginas públicas. Y a cada `<a>`
nuevo ponele `data-location="…"`: es lo que después permite cortar los eventos
por ubicación. Ver **[PIXEL-EVENTS.md](PIXEL-EVENTS.md)**.

---

## Sistema visual — Dark Premium

Documentado en detalle en **[DESIGN-SYSTEM.md](DESIGN-SYSTEM.md)**. Resumen:

| Token | Valor | |
|---|---|---|
| `--bg` | `#0A0A0B` | Fondo base (negro por capas) |
| `--ink` | `#F5F6F7` | Títulos |
| `--ink-2` | `#A1A1AA` | Cuerpo |
| `--green` | `#2CE58B` | Único acento saturado (CTAs, foco, activos) |
| `--font-display` | `'Inter Tight', 'Inter', sans-serif` | Titulares (sentence case) |
| `--font-body` | `'Inter', sans-serif` | Cuerpo |
| `--font-mono` | `'JetBrains Mono', monospace` | Eyebrows y datos |

`css/tokens.css` se linkea **antes** que cualquier otra hoja. Nunca hardcodees
un hex o un px en un componente: referenciá un token.

---

## Probar en local

```bash
php -S 127.0.0.1:8000 -t .
```

Alcanza con eso: el sitio es estático salvo `api/meta-capi.php`, que sin
`config/config.php` devuelve 503 y no rompe nada más.
