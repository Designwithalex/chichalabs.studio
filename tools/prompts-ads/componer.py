# -*- coding: utf-8 -*-
"""
Compone los creativos de Meta a partir de los renders generados.

POR QUÉ ESTE SCRIPT Y NO PEDIRLE EL TEXTO AL GENERADOR DE IMÁGENES
Los modelos de imagen manglean tildes y eñes, y un anuncio que dice
"cotizadór" cuesta más credibilidad de lo que aporta el titular. Acá el texto
lo dibuja Pillow con el TTF real de Inter, así que "¿Perdés" y "operación"
salen perfectos siempre.

EL SCRIM
Los renders son full-bleed y densos: texto blanco encima queda ilegible,
sobre todo en ia-aplicada (pila de papel gris claro que llega al borde) y
dashboards (la planilla ocupa arriba a la izquierda). Cada creativo declara
su propia altura y opacidad de scrim — un degradado que oscurece SOLO la
banda del texto y deja el resto del render intacto.

SALIDAS
Por cada escena, dos archivos en creativos/:
  <slug>-1080x1080.png   feed de Facebook e Instagram
  <slug>-1080x1920.png   Stories y Reels
El 9:16 no recorta el cuadrado: lo apoya sobre lienzo negro y funde los
bordes, así la composición del render se conserva entera y quedan zonas
limpias arriba (titular) y abajo (CTA).

USO
  python tools/prompts-ads/componer.py
"""

from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
import glob
import sys

BASE = Path(__file__).resolve().parent
RENDERS = BASE / "renders"
SALIDA = BASE / "creativos"
FUENTES = BASE.parent.parent / "includes/dompdf/vendor/dompdf/dompdf/lib/fonts"

# --- Tokens de css/tokens.css. No inventar valores acá. ---
BG = (10, 10, 11)            # --bg          #0A0A0B
INK = (245, 246, 247)        # --ink         #F5F6F7
MINT = (44, 229, 139)        # --green       #2CE58B
INK_ON_ACCENT = (5, 19, 11)  # --ink-on-accent #05130B

TRACKING_EM = -0.022         # --tracking-tight

MARGEN = 72                  # margen seguro lateral


def fuente(patron, tam):
    """Los TTF de dompdf llevan un hash en el nombre, así que hay que buscarlos."""
    hits = sorted(glob.glob(str(FUENTES / patron)))
    if not hits:
        sys.exit(
            "No encontré la fuente %s en %s.\n"
            "Son los TTF que cachea dompdf; si borraste esa carpeta, generá un\n"
            "PDF del cotizador para que las vuelva a bajar." % (patron, FUENTES)
        )
    return ImageFont.truetype(hits[0], tam)


def ancho_con_tracking(draw, texto, font, tracking):
    if not texto:
        return 0
    base = draw.textlength(texto, font=font)
    return base + tracking * (len(texto) - 1)


def texto_con_tracking(draw, xy, texto, font, fill, tracking):
    """
    Pillow no soporta letter-spacing, así que dibujamos carácter por carácter.
    Sin esto el titular se ve suelto comparado con el sitio, que usa
    --tracking-tight: -0.022em.
    """
    x, y = xy
    for ch in texto:
        draw.text((x, y), ch, font=font, fill=fill)
        x += draw.textlength(ch, font=font) + tracking


def envolver(draw, texto, font, tracking, ancho_max):
    palabras = texto.split()
    lineas, actual = [], ""
    for p in palabras:
        prueba = (actual + " " + p).strip()
        if ancho_con_tracking(draw, prueba, font, tracking) <= ancho_max:
            actual = prueba
        else:
            if actual:
                lineas.append(actual)
            actual = p
    if actual:
        lineas.append(actual)
    return lineas


def scrim(img, alto, opacidad_max, desde="top"):
    """
    Degradado de #0A0A0B sobre la banda del texto. Se construye como máscara
    de 1px de ancho y se escala: mucho más rápido que dibujar línea por línea.
    """
    w, h = img.size
    mascara = Image.new("L", (1, alto))
    for y in range(alto):
        t = y / max(alto - 1, 1)
        if desde == "top":
            a = (1 - t) ** 1.6          # opaco arriba, transparente abajo
        else:
            a = t ** 1.6                # al revés
        mascara.putpixel((0, y), int(opacidad_max * 255 * a))
    mascara = mascara.resize((w, alto))

    capa = Image.new("RGB", (w, alto), BG)
    caja = (0, 0, w, alto) if desde == "top" else (0, h - alto, w, h)
    region = img.crop(caja)
    img.paste(Image.composite(capa, region, mascara), caja)


def fundir_bordes(img, px):
    """Funde arriba y abajo hacia el negro para que el 9:16 no parezca pegado."""
    w, h = img.size
    for desde in ("top", "bottom"):
        mascara = Image.new("L", (1, px))
        for y in range(px):
            t = y / max(px - 1, 1)
            a = (1 - t) if desde == "top" else t
            mascara.putpixel((0, y), int(255 * a))
        mascara = mascara.resize((w, px))
        capa = Image.new("RGB", (w, px), BG)
        caja = (0, 0, w, px) if desde == "top" else (0, h - px, w, h)
        region = img.crop(caja)
        img.paste(Image.composite(capa, region, mascara), caja)


def pill(draw, x, y, texto, font, tracking):
    """Botón pill mint. Radio 999px = completamente redondeado."""
    pad_x, pad_y = 46, 30
    tw = ancho_con_tracking(draw, texto, font, tracking)
    asc, desc = font.getmetrics()
    th = asc + desc
    w, h = tw + pad_x * 2, th + pad_y * 2
    draw.rounded_rectangle([x, y, x + w, y + h], radius=h // 2, fill=MINT)
    texto_con_tracking(draw, (x + pad_x, y + pad_y - 2), texto, font,
                       INK_ON_ACCENT, tracking)
    return h


# --- Los 5 creativos ---------------------------------------------------------
# scrim_1x1 / scrim_9x16: (alto_px, opacidad). Tuneado por render según cuánto
# ruido claro tiene arriba. ia-aplicada y dashboards necesitan más.
CREATIVOS = [
    {
        "slug": "automatizaciones",
        "render": "automatizaciones.png",
        "titular": "¿Perdés leads porque nadie contesta el WhatsApp?",
        "cta": "Sabé el precio en 2 minutos",
        "scrim_1x1": (470, 0.88),
        "scrim_9x16": (150, 0.55),
    },
    {
        "slug": "web-comercial",
        "render": "web-comercial.png",
        "titular": "¿Tu web recibe visitas pero no te llegan consultas?",
        "cta": "Sabé el precio en 2 minutos",
        "scrim_1x1": (480, 0.90),
        "scrim_9x16": (150, 0.55),
    },
    {
        "slug": "dashboards",
        "render": "dashboards.png",
        # La planilla gris ocupa arriba a la izquierda: scrim más opaco.
        "titular": "¿Tu operación vive en planillas que entiende una sola persona?",
        "cta": "Sabé el precio en 2 minutos",
        "scrim_1x1": (560, 0.94),
        "scrim_9x16": (170, 0.60),
    },
    {
        "slug": "ia-aplicada",
        "render": "ia-aplicada.png",
        # La pila de papel gris claro llega al borde superior: el scrim más
        # fuerte de los cinco, o el texto no se lee.
        "titular": "¿Tu equipo pierde horas clasificando y copiando información?",
        "cta": "Sabé el precio en 2 minutos",
        "scrim_1x1": (580, 0.96),
        "scrim_9x16": (180, 0.62),
    },
    {
        "slug": "cotizador",
        "render": "cotizador.png",
        # Acá el titular ES la oferta, no el dolor.
        "titular": "Sabé cuánto sale tu proyecto en 2 minutos",
        "cta": "Ver el precio, sin llamada",
        "scrim_1x1": (450, 0.86),
        "scrim_9x16": (150, 0.55),
    },
]


def componer_1x1(c):
    L = 1080
    img = Image.open(RENDERS / c["render"]).convert("RGB").resize((L, L), Image.LANCZOS)
    alto_scrim, op = c["scrim_1x1"]
    scrim(img, alto_scrim, op, "top")

    draw = ImageDraw.Draw(img)
    tam = 68
    f_tit = fuente("inter_bold_*.ttf", tam)
    f_cta = fuente("inter_600_*.ttf", 34)
    tr = TRACKING_EM * tam

    lineas = envolver(draw, c["titular"], f_tit, tr, L - MARGEN * 2)
    interlinea = int(tam * 1.18)          # --lh-snug 1.2
    y = 92
    for ln in lineas:
        texto_con_tracking(draw, (MARGEN, y), ln, f_tit, INK, tr)
        y += interlinea

    # Regla mint: ancla el bloque de texto al sistema visual del render.
    y += 16
    draw.rounded_rectangle([MARGEN, y, MARGEN + 96, y + 6], radius=3, fill=MINT)

    pill(draw, MARGEN, L - 72 - 96, c["cta"], f_cta, TRACKING_EM * 34)
    return img


def componer_9x16(c):
    W, H = 1080, 1920
    lienzo = Image.new("RGB", (W, H), BG)

    render = Image.open(RENDERS / c["render"]).convert("RGB").resize((W, W), Image.LANCZOS)
    alto_scrim, op = c["scrim_9x16"]
    scrim(render, alto_scrim, op, "top")
    fundir_bordes(render, 130)

    top_render = 430
    lienzo.paste(render, (0, top_render))

    draw = ImageDraw.Draw(lienzo)
    tam = 76
    f_tit = fuente("inter_bold_*.ttf", tam)
    f_cta = fuente("inter_600_*.ttf", 36)
    tr = TRACKING_EM * tam

    lineas = envolver(draw, c["titular"], f_tit, tr, W - MARGEN * 2)
    interlinea = int(tam * 1.18)
    bloque = interlinea * len(lineas)
    y = max(120, top_render - 60 - bloque)
    for ln in lineas:
        texto_con_tracking(draw, (MARGEN, y), ln, f_tit, INK, tr)
        y += interlinea

    # El tercio inferior lo tapa la interfaz de Stories: el CTA va arriba de eso.
    pill(draw, MARGEN, 1580, c["cta"], f_cta, TRACKING_EM * 36)
    return lienzo


def main():
    if not RENDERS.is_dir():
        sys.exit("No existe %s" % RENDERS)
    SALIDA.mkdir(parents=True, exist_ok=True)

    for c in CREATIVOS:
        origen = RENDERS / c["render"]
        if not origen.exists():
            print("  falta %s — salteado" % c["render"])
            continue
        for etiqueta, fn in (("1080x1080", componer_1x1), ("1080x1920", componer_9x16)):
            destino = SALIDA / ("%s-%s.png" % (c["slug"], etiqueta))
            fn(c).save(destino, "PNG", optimize=True)
            print("  %s  (%.0f KB)" % (destino.name, destino.stat().st_size / 1024))


if __name__ == "__main__":
    main()
