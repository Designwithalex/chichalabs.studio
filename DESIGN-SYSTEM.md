# ChichaLabs Studio — Design System "Dark Premium"

Sistema visual compartido por las **3 superficies** del producto: la landing pública, el **portal del cliente** y el **panel admin**. Lenguaje de referencia: Linear · Vercel · Stripe · Apple. Oscuro, sobrio, con mucho aire, tipografía impecable y micro-interacciones sutiles.

La fuente de verdad son los tokens CSS en **`css/tokens.css`**. Este documento explica cómo está armado y cómo mantenerlo.

> **Regla de oro del proyecto:** el rediseño es solo capa visual (HTML/markup + CSS + micro-interacciones JS). No se toca la lógica PHP, los nombres de campos, los estados (`includes/statuses.php`), el CSRF, ni el flujo de aceptación de propuestas.

---

## 1. Arquitectura de archivos

| Archivo | Rol |
|---|---|
| **`css/tokens.css`** | Fuente de verdad: todas las variables `:root`. Se linkea **antes** que cualquier hoja de superficie. |
| `css/styles.css` | Landing + estilos base (botones, nav, tipografía, componentes de la landing, legal). |
| `css/case-study.css` | Páginas de caso de estudio (cada caso conserva su color de marca). |
| `css/proposal-calculator.css` | Presupuestador **compartido** portal + admin (`.pc-*`). |
| `portal/css/portal.css` | Portal del cliente (stepper, tarjetas de proyecto, auth). |
| `admin/css/admin.css` | Panel admin. Define tokens locales `--ad-*` derivados de los compartidos. |

**Orden de carga en cada `<head>`:** `tokens.css` → hoja(s) de la superficie.

```html
<link rel="stylesheet" href="/css/tokens.css">
<link rel="stylesheet" href="/css/styles.css">
<!-- luego, según la superficie: proposal-calculator.css, portal.css o admin.css -->
```

**Sin build step.** HTML/CSS/JS vanilla + el GSAP vendorizado en `js/vendor/`. Las fuentes se cargan por Google Fonts.

---

## 2. Reglas de uso

- **Nunca** hardcodear un hex o un `px` en un componente: siempre referenciar un token.
- Los **fondos** van de oscuro a claro por elevación: `--bg` < `--surface-1` < `--surface-2` < `--surface-3`.
- La **tinta** va de clara a oscura por importancia: `--ink` (títulos) > `--ink-2` (cuerpo) > `--ink-3` (secundario).
- El **verde es el único color saturado**. Se reserva para CTAs, estados activos, foco, acentos de datos y glows. Nunca para grandes bloques de texto.

---

## 3. Color

### Superficies (negro por capas, nunca `#000` puro → evita el "smear" en OLED)

| Token | Valor | Uso |
|---|---|---|
| `--bg` | `#0A0A0B` | Fondo base de página |
| `--bg-2` | `#0B0C0E` | Banda de sección alterna |
| `--surface-1` | `#111214` | Tarjetas, nav, inputs |
| `--surface-2` | `#16181C` | Tarjeta elevada / popover / hover |
| `--surface-3` | `#1C1F24` | Máxima elevación / fila activa / tooltip |

### Tinta (sin `#FFF` puro en bloques grandes)

| Token | Valor | Contraste AA | Uso |
|---|---|---|---|
| `--ink` | `#F5F6F7` | 18:1 sobre `--bg` | Títulos, números clave |
| `--ink-2` | `#A1A1AA` | 7.7:1 | Cuerpo |
| `--ink-3` | `#888D95` | 5.3:1 (peor caso, surface-2) | Secundario, captions, labels muted |
| `--ink-on-accent` | `#05130B` | 11.5:1 sobre el verde | Texto sobre un fill verde |

### Verde de marca (único acento saturado, ajustado para brillar sobre oscuro)

| Token | Valor | Uso |
|---|---|---|
| `--green` | `#2CE58B` | Acento primario: CTAs, activos, foco |
| `--green-bright` | `#00E676` | Fills / énfasis fuerte, hover del botón |
| `--green-dim` | `#1FA968` | Pressed / verde secundario |
| `--green-wash` | `rgba(44,229,139,.10)` | Fondos teñidos |
| `--green-line` | `rgba(44,229,139,.28)` | Bordes hairline verdes |
| `--green-glow` | `rgba(44,229,139,.35)` | Glow suave detrás de CTA/hero |

### Hairlines y glass

| Token | Valor | Uso |
|---|---|---|
| `--line` | `rgba(255,255,255,.08)` | Bordes de tarjetas/controles |
| `--line-2` | `rgba(255,255,255,.06)` | Separadores de sección |
| `--line-strong` | `rgba(255,255,255,.14)` | Bordes en hover/foco |
| `--glass-bg` | `rgba(255,255,255,.04)` | Fondo glass |
| `--glass-border` | `rgba(255,255,255,.10)` | Borde glass |
| `--glass-highlight` | `rgba(255,255,255,.14)` | Borde superior "atrapa-luz" (1px) |
| `--glass-blur` | `16px` | Radio de `backdrop-filter` |

### Estados semánticos (mapeados a `includes/statuses.php`)

Baja saturación para que el verde siga siendo el protagonista. Cada uno tiene texto (`--st-x`), fondo (`--st-x-bg`) y borde (`--st-x-line`).

| Token | Color | Estado de propuesta | Estado de proyecto |
|---|---|---|---|
| `--st-neutral` | `#A1A1AA` gris | `borrador` | `diagnostico` |
| `--st-info` | `#6AA8FF` azul | `enviada` | `propuesta_enviada` |
| `--st-success` | `#2CE58B` verde | `aceptada` | `propuesta_aceptada`, `finalizado` |
| `--st-warn` | `#F5B454` ámbar | — | `implementacion`; badge "En rango" |
| `--st-danger` | `#FF6B6B` rojo | `vencida` | — |
| `--st-active` | `#C9A6FF` violeta | — | `en_diseno`, `en_desarrollo` |

---

## 4. Tipografía

Se cargan por Google Fonts (`Inter Tight`, `Inter`, `JetBrains Mono`). Reemplazan a la vieja display condensada en mayúsculas (Anton) — ahora todo es **sentence case** con tracking negativo.

| Token | Familia | Uso |
|---|---|---|
| `--font-display` | Inter Tight | Titulares, nombres, números grandes |
| `--font-body` | Inter | Cuerpo, botones, formularios |
| `--font-mono` | JetBrains Mono | Eyebrows `[ ... ]`, datos técnicos, precios tabulares |

### Escala fluida (`clamp`, mín @375px … máx @1440px)

| Token | Rango | Uso |
|---|---|---|
| `--fs-display` | 44 → 80px | Hero |
| `--fs-h1` | 36 → 56px | Títulos de sección |
| `--fs-h2` | 28 → 40px | |
| `--fs-h3` | 21 → 28px | |
| `--fs-lead` | 18 → 22px | Subtítulo del hero |
| `--fs-body` | 17px | Cuerpo |
| `--fs-sm` / `--fs-xs` | 15 / 13px | |
| `--fs-eyebrow` | 12px | Eyebrow mono |

**Tracking:** `--tracking-tight` (-0.022em, display) · `--tracking-snug` (-0.012em, headings) · `--tracking-wide` (0.14em, labels mono).
**Line-height:** `--lh-tight` 1.05 (display) · `--lh-snug` 1.2 (headings) · `--lh-body` 1.65 (párrafos).

---

## 5. Espaciado, layout, radios

- **Espaciado base-4/8:** `--space-1` (0.25rem) … `--space-10` (8rem).
- **Ritmo vertical de sección:** `--section-y` = `clamp(5rem, 3rem + 9vw, 10rem)` → 80–160px.
- **Ancho de contenido:** `--container` 1200px · `--container-narrow` 1120px.
- **Radios:** `--radius-lg` 20px (tarjetas premium) · `--radius` 14px · `--radius-sm` 10px (botones/inputs) · `--radius-xs` 8px · `--radius-pill` 999px.

## 6. Profundidad (sombras difusas + borde 1px translúcido)

`--shadow-sm` · `--shadow` · `--shadow-lg` · `--shadow-glow` (glow verde para hover de CTA).

## 7. Motion

| Token | Valor | Uso |
|---|---|---|
| `--ease-out-expo` | `cubic-bezier(.16,1,.3,1)` | Entradas / reveals |
| `--ease-out-quint` | `cubic-bezier(.22,1,.36,1)` | Hover / transiciones de UI |
| `--t-fast` / `--t-mid` | 150ms / 250ms | Hover / controles |
| `--t-slow` / `--t-reveal` | 450ms / 700ms | Reveals chicos / grandes |

Reglas: animar solo `transform` y `opacity`. Nunca `linear` ni rebotes bruscos. Todo respeta **`prefers-reduced-motion`** (kill-switch global en `tokens.css` + reglas específicas por superficie).

---

## 8. Accesibilidad

- **Contraste AA** verificado con la fórmula WCAG. Todos los textos pasan 4.5:1 sobre su fondo (ver tabla de tinta). `--ink-3` está calibrado a `#888D95` para pasar 4.5 en la superficie más clara donde se usa.
- **Foco visible:** `:focus-visible { outline: 2px solid var(--green); outline-offset: 2px }`. Se usa `outline` (no `box-shadow`) a propósito, para que **el glow del botón primario no pueda pisar el ring** de foco.
- **Teclado:** el nav mobile y el modal de confirmación del presupuestador tienen focus-trap y cierre con `Esc` (en `js/main.js` y `proposal-calculator.js`).
- **`prefers-reduced-motion`:** desactiva reveals, marquee, glows animados, canvas, etc.

---

## 9. El presupuestador (compartido portal + admin)

`css/proposal-calculator.css` estila la UI que genera `proposal-calculator.js` (**mismo archivo en `portal/js/` y `admin/js/` — hay que editar los dos juntos**). Clases principales: `.pc-categories`, `.pc-category`, `.pc-module` (`.pc-module--locked`), `.pc-module__checkbox`, `.pc-totals` (sticky en el portal, estático dentro del preview del admin), `.pc-cta`, `.pc-modal`.

> **No cambiar los nombres de clase ni los IDs** (`#proposal-app`, `#pc-cta-open`, `#pc-cta-accept`, `#pc-modal`, `module_ids[]`, etc.) sin actualizar el JS en conjunto: el cálculo y la aceptación dependen de ellos.

**Nota de comportamiento:** el botón "Aceptar propuesta" es `type="submit"`; su handler `openModal` hace `preventDefault` para que el click abra el modal de confirmación en vez de enviar el form. El submit real lo dispara "Sí, aceptar" (`form.requestSubmit()`).

---

## 10. Mantenimiento y gotchas

- **Fuentes:** si cambian, actualizar el `<link>` de Google Fonts en los 4 heads (`index.html`, `case-study.html`, `privacidad.html`, `portal/inc/header.php`, `admin/inc/header.php`) **y** `--font-*` en `tokens.css`.
- **Cache al deployar:** los navegadores cachean CSS/JS. Al subir cambios conviene versionar los assets (`?v=x`) para forzar la actualización.
- **Email de acceso** (`includes/mailer.php`): usa branding claro (fondo `#F7F7F7`, verde `#00BF63`) **a propósito** — los emails van en fondo claro y el `#2CE58B` no contrasta bien en blanco. No forma parte de este sistema.
- **Testing responsive:** embeber la página en un `<iframe width="390">`; el iframe crea su propio viewport y las media queries evalúan contra su ancho.
