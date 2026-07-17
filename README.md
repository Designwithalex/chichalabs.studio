# ChichaLabs Studio — Landing

Landing comercial. HTML, CSS y JS vanilla. Sin build step — subir directamente a cualquier hosting estático.

---

## Antes de publicar: 4 cosas para reemplazar

### 1. Número de WhatsApp

Buscar `549XXXXXXXXXX` en `index.html` (aparece 7 veces: nav, hero, sección diagnóstico, CTA final x2, footer, botón flotante) y reemplazar por el número real en formato internacional sin `+` ni espacios.

Ejemplo: si el número es +54 9 11 1234-5678, el reemplazo es `5491112345678`.

### 2. Fuente Dharama Gothic E

Cuando tengas el archivo `.woff2` con licencia web:

1. Copiarlo a `assets/fonts/DharmaGothicE-Bold.woff2`
2. Agregar al inicio de `css/styles.css`:
   ```css
   @font-face {
     font-family: 'DharmaGothicE';
     src: url('/assets/fonts/DharmaGothicE-Bold.woff2') format('woff2');
     font-weight: 700;
     font-style: normal;
     font-display: swap;
   }
   ```
3. La variable `--font-display: 'DharmaGothicE', 'Anton', 'Oswald', sans-serif;` ya está configurada — la fuente se activará automáticamente. No hay que tocar más nada.

Hoy usa Anton (Google Fonts) como fallback. Es condensada y ALL CAPS, espíritu similar.

### 3. Resaltados a mano (`reenie-placeholder`)

Hay 3 palabras marcadas en verde como placeholder para el resaltado manuscrito que vas a hacer vos:

- **Hero** (`index.html` ~línea 66): `<span class="reenie-placeholder">tecnológica</span>`
- **Diagnóstico** (~línea 130): `<span class="reenie-placeholder">diagnóstico</span>`
- **CTA final** (~línea 196): `<span class="reenie-placeholder">mejorar</span>`

Para encontrarlos rápido: buscar `reenie-placeholder` en el HTML. Cuando estén listos, reemplazar el `<span>` y el texto con la versión final (Reenie Beanie + círculo SVG dibujado a mano encima, como en el sistema de Canva).

### 4. Formulario (opcional)

El formulario de la sección CTA apunta a `https://formspree.io/f/XXXXXXXX`. Opciones:

- **Formspree**: crear cuenta en formspree.io, crear un nuevo formulario, y reemplazar `XXXXXXXX` por el ID real.
- **Netlify Forms**: si deployás en Netlify, reemplazar `action="..."` por `action=""` y agregar `data-netlify="true"` al `<form>`.
- **Sin formulario**: eliminar el bloque `<details class="form-wrap">` — el WhatsApp directo cubre el 95% de los casos.

---

## Deploy

### Netlify (recomendado)

```bash
# Arrastrar la carpeta chichalabs-studio-landing/ al panel de Netlify
# O conectar el repo y apuntar la carpeta raíz a chichalabs-studio-landing/
```

### Vercel

```bash
vercel --prod
# Raíz del proyecto: chichalabs-studio-landing/
```

### Cualquier hosting estático

Subir el contenido de `chichalabs-studio-landing/` a la raíz del dominio. No hay build, no hay dependencias.

---

## Estructura de archivos

```
chichalabs-studio-landing/
  index.html          — toda la landing (copy literal de chichalabs__copy_contexto_web.md sec. 12)
  css/
    styles.css        — sistema Terminal Claro completo
  js/
    main.js           — canvas hero, GSAP reveals, animaciones de íconos, count-up, marquee
  assets/
    favicon.svg       — monograma CL en verde sobre fondo hueso
    fonts/
      DharmaGothicE-Bold.woff2   — pendiente de licencia web (ver punto 2 arriba)
  README.md
```

---

## Sistema visual — Terminal Claro

| Token | Valor |
|---|---|
| `--green` | `#00BF63` |
| `--black` | `#0B0B0B` |
| `--bg`    | `#F7F7F7` |
| `--font-display` | `'DharmaGothicE', 'Anton', 'Oswald', sans-serif` |
| `--font-body` | `'Inter', sans-serif` |

Regla fija: **fondo siempre `#F7F7F7`**, sin excepciones. No hay secciones oscuras.
