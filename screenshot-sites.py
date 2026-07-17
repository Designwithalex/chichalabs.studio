#!/usr/bin/env python3
"""
ChichaLabs Studio — Screenshot de sitios reales para casos de estudio
Requiere: pip install playwright pillow
          playwright install chromium
Uso:    python screenshot-sites.py --slug all
        python screenshot-sites.py --slug pacto-estudio
        python screenshot-sites.py --slug pacto-estudio --only hero
        python screenshot-sites.py --slug pacto-estudio --only gallery
        python screenshot-sites.py --slug all --force
"""

import sys
import time
import argparse
import io
from pathlib import Path

try:
    from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout
except ImportError:
    print("Instalá playwright: pip install playwright && playwright install chromium")
    sys.exit(1)

try:
    from PIL import Image
except ImportError:
    print("Instalá pillow: pip install pillow")
    sys.exit(1)

# ---------------------------------------------------------------------------
# CONFIG
# ---------------------------------------------------------------------------

OUTPUT_DIR = Path(__file__).parent / "assets" / "cases"

HERO_W, HERO_H = 1536, 1024
GALLERY_SIZE    = 1024        # square crop

# Scroll stops as a fraction of total page height (0% → 85%)
GALLERY_SCROLL_FRACTIONS = [0.0, 0.15, 0.30, 0.50, 0.70, 0.85]

# CSS injected to collapse sticky headers / cookie banners before capture
HIDE_OVERLAYS_CSS = """
  [class*="cookie"], [id*="cookie"],
  [class*="gdpr"],   [id*="gdpr"],
  [class*="banner"], [id*="banner"],
  [class*="popup"],  [id*="popup"],
  [class*="modal"],  [id*="modal"],
  [class*="consent"],[id*="consent"] {
    display: none !important;
  }
"""

# ---------------------------------------------------------------------------
# PROJECTS
# ---------------------------------------------------------------------------

PROJECTS = {
    "pacto-estudio":      {"name": "Pacto Estudio",        "url": "https://pactoestudio.com"},
    "agriedge":           {"name": "Agriedge",             "url": "https://www.trialedge.agriedge.ma/"},
    "patagonia-berries":  {"name": "Patagonia Berries",    "url": "https://patagoniaberriesarg.com"},
    "chemikal":           {"name": "Chemikal",             "url": "https://chemikal.com.ar/"},
    "gauchitas":          {"name": "Gauchitas",            "url": "https://gauchitas.com.ar/"},
    "kike-cafe":          {"name": "Kike Café",            "url": "https://kikecafe.com.ar"},
    "longevity-argentina":{"name": "Longevity Argentina",  "url": "https://longevityargentina.com/"},
    "ernesto-automotores":{"name": "Ernesto Automotores",  "url": "https://www.ernestoautomotores.com.ar/"},
    "cafe-la-humedad":    {"name": "Café La Humedad",      "url": "https://cafelahumedad.com/"},
    "identidad-genesis":  {"name": "Identidad Génesis",    "url": "https://identidadgenesis.framer.website/"},
}

# ---------------------------------------------------------------------------
# HELPERS
# ---------------------------------------------------------------------------

def ensure_dir(slug: str) -> Path:
    d = OUTPUT_DIR / slug
    d.mkdir(parents=True, exist_ok=True)
    return d


def bytes_to_jpeg(png_bytes: bytes, quality: int = 90) -> bytes:
    img = Image.open(io.BytesIO(png_bytes)).convert("RGB")
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=quality, optimize=True)
    return buf.getvalue()


def crop_square(png_bytes: bytes, size: int) -> bytes:
    img = Image.open(io.BytesIO(png_bytes)).convert("RGB")
    w, h = img.size
    left = max(0, (w - size) // 2)
    cropped = img.crop((left, 0, left + size, min(h, size)))
    if cropped.height < size:
        # pad with white if the viewport capture is shorter than size
        padded = Image.new("RGB", (size, size), (255, 255, 255))
        padded.paste(cropped, (0, 0))
        cropped = padded
    buf = io.BytesIO()
    cropped.save(buf, format="JPEG", quality=90, optimize=True)
    return buf.getvalue()


def navigate(page, url: str) -> bool:
    try:
        page.goto(url, wait_until="load", timeout=60_000)
        page.add_style_tag(content=HIDE_OVERLAYS_CSS)
        time.sleep(2.0)  # allow JS animations / lazy images to settle
        return True
    except PlaywrightTimeout:
        print(f"  ✗  Timeout al cargar {url}")
        return False
    except Exception as e:
        print(f"  ✗  Error al cargar {url}: {e}")
        return False

# ---------------------------------------------------------------------------
# CAPTURE FUNCTIONS
# ---------------------------------------------------------------------------

def capture_hero(page, out_dir: Path, force: bool) -> None:
    path = out_dir / "hero.jpg"
    if path.exists() and not force:
        print(f"  —  Existe: hero.jpg, saltando. (usá --force para sobreescribir)")
        return

    page.set_viewport_size({"width": HERO_W, "height": HERO_H})
    # Scroll to top to ensure above-fold capture
    page.evaluate("window.scrollTo(0, 0)")
    time.sleep(0.3)

    png = page.screenshot(clip={"x": 0, "y": 0, "width": HERO_W, "height": HERO_H})
    path.write_bytes(bytes_to_jpeg(png))
    print(f"  ✓  Guardado: {path.relative_to(Path(__file__).parent)}")


def capture_gallery(page, out_dir: Path, force: bool) -> None:
    # Use a taller viewport so scrolled content renders properly
    page.set_viewport_size({"width": HERO_W, "height": HERO_H})

    # Get total scrollable height
    total_height: int = page.evaluate(
        "() => Math.max(document.body.scrollHeight, document.documentElement.scrollHeight)"
    )

    for i, fraction in enumerate(GALLERY_SCROLL_FRACTIONS, start=1):
        path = out_dir / f"{i:02d}.jpg"
        if path.exists() and not force:
            print(f"  —  Existe: {path.name}, saltando.")
            continue

        scroll_y = int(total_height * fraction)
        page.evaluate(f"window.scrollTo(0, {scroll_y})")
        time.sleep(0.4)

        # Capture exactly the current viewport
        png = page.screenshot(clip={"x": 0, "y": 0, "width": HERO_W, "height": HERO_H})
        path.write_bytes(crop_square(png, GALLERY_SIZE))
        print(f"  ✓  Guardado: {path.relative_to(Path(__file__).parent)}")


# ---------------------------------------------------------------------------
# PROCESS
# ---------------------------------------------------------------------------

def process_project(browser, slug: str, data: dict, only: str | None, force: bool) -> None:
    print(f"\n[ {data['name']} ] ({slug})")
    out_dir = ensure_dir(slug)

    context = browser.new_context(
        user_agent=(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/124.0.0.0 Safari/537.36"
        ),
        ignore_https_errors=True,
    )
    page = context.new_page()

    try:
        ok = navigate(page, data["url"])
        if not ok:
            return

        if only in ("hero", "both"):
            capture_hero(page, out_dir, force)

        if only in ("gallery", "both"):
            # Re-navigate to reset scroll state cleanly for gallery
            if only == "both":
                ok = navigate(page, data["url"])
                if not ok:
                    return
            capture_gallery(page, out_dir, force)

    finally:
        context.close()


# ---------------------------------------------------------------------------
# MAIN
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Captura screenshots de sitios reales para casos de estudio ChichaLabs"
    )
    parser.add_argument("--slug",  default="all", help="Slug del proyecto o 'all'")
    parser.add_argument("--only",  choices=["hero", "gallery", "both"], default="gallery",
                        help="Capturar 'hero', 'gallery' (default), o 'both'")
    parser.add_argument("--force", action="store_true",
                        help="Sobreescribir imágenes existentes")
    args = parser.parse_args()

    if args.slug != "all" and args.slug not in PROJECTS:
        print(f"Slug desconocido: {args.slug}")
        print(f"Disponibles: {', '.join(PROJECTS)}")
        sys.exit(1)

    targets = PROJECTS if args.slug == "all" else {args.slug: PROJECTS[args.slug]}

    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True)
        try:
            for slug, data in targets.items():
                process_project(browser, slug, data, only=args.only, force=args.force)
        finally:
            browser.close()

    print("\n¡Listo! Las imágenes están en assets/cases/")


if __name__ == "__main__":
    main()
