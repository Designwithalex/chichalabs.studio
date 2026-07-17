#!/usr/bin/env python3
"""
ChichaLabs Studio — Descargador de imágenes desde Notion
Requiere: pip install requests pillow
Uso:    set NOTION_API_KEY=secret_xxx   (PowerShell: $env:NOTION_API_KEY="secret_xxx")
        python download-notion-images.py
        python download-notion-images.py --slug pacto-estudio
        python download-notion-images.py --slug all --force
"""

import os
import sys
import argparse
import io
from pathlib import Path

try:
    import requests
except ImportError:
    print("Instalá requests: pip install requests")
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
NOTION_VERSION = "2022-06-28"

# Notion page IDs per slug (from the Case studies database)
PROJECTS = {
    "pacto-estudio":       "2a08437e-26f3-8009-b271-d45ab8c33cc6",
    "agriedge":            "2a58437e-26f3-8026-a7ee-d6ec052c2723",
    "patagonia-berries":   "2a28437e-26f3-809e-862e-ebb9e81e3886",
    "chemikal":            "2a58437e-26f3-8059-85b3-f46cf8d4f9e4",
    "gauchitas":           "2a58437e-26f3-8069-8b2c-e8fc2ef20009",
    "kike-cafe":           "2a28437e-26f3-8036-a91c-cedeb18ce473",
    "longevity-argentina": "3878437e-26f3-8119-bb6e-f585fb20854d",
    "ernesto-automotores": "3878437e-26f3-8113-9441-c36a637bf508",
    "cafe-la-humedad":     "3878437e-26f3-8196-a32f-c69ea18b4261",
    "identidad-genesis":   "2a58437e-26f3-80f7-a864-d293cf1d3e7e",
}

# Which Notion property maps to which gallery filename (01.jpg–06.jpg)
GALLERY_PROPS = ["Image 1", "Image 2", "Image 3", "Image 4", "Image 5", "Image 6"]

# ---------------------------------------------------------------------------
# HELPERS
# ---------------------------------------------------------------------------

def notion_headers(token: str) -> dict:
    return {
        "Authorization": f"Bearer {token}",
        "Notion-Version": NOTION_VERSION,
    }


def get_page_properties(page_id: str, token: str) -> dict:
    url = f"https://api.notion.com/v1/pages/{page_id}"
    r = requests.get(url, headers=notion_headers(token), timeout=30)
    if r.status_code != 200:
        raise RuntimeError(f"Notion API error {r.status_code}: {r.text[:200]}")
    return r.json().get("properties", {})


def extract_file_url(prop: dict) -> str | None:
    """Pull the download URL out of a Notion file property value."""
    files = prop.get("files", [])
    if not files:
        return None
    f = files[0]
    # Notion returns either {"type":"file","file":{"url":...}} or {"type":"external","external":{"url":...}}
    if f.get("type") == "file":
        return f["file"]["url"]
    if f.get("type") == "external":
        return f["external"]["url"]
    return None


def download_as_jpeg(url: str, dest: Path, quality: int = 90) -> None:
    r = requests.get(url, timeout=60, stream=True)
    r.raise_for_status()
    img = Image.open(io.BytesIO(r.content)).convert("RGB")
    img.save(dest, format="JPEG", quality=quality, optimize=True)


def ensure_dir(slug: str) -> Path:
    d = OUTPUT_DIR / slug
    d.mkdir(parents=True, exist_ok=True)
    return d

# ---------------------------------------------------------------------------
# PROCESS
# ---------------------------------------------------------------------------

def process_project(slug: str, page_id: str, token: str, force: bool) -> None:
    print(f"\n[ {slug} ]")
    out_dir = ensure_dir(slug)

    try:
        props = get_page_properties(page_id, token)
    except RuntimeError as e:
        print(f"  ✗  {e}")
        return

    downloaded = 0
    skipped = 0
    missing = 0

    for i, prop_name in enumerate(GALLERY_PROPS, start=1):
        dest = out_dir / f"{i:02d}.jpg"

        if dest.exists() and not force:
            print(f"  —  {dest.name} ya existe, saltando. (--force para sobreescribir)")
            skipped += 1
            continue

        prop = props.get(prop_name)
        if not prop:
            print(f"  –  Propiedad '{prop_name}' no encontrada en Notion.")
            missing += 1
            continue

        url = extract_file_url(prop)
        if not url:
            print(f"  –  '{prop_name}' está vacía en Notion.")
            missing += 1
            continue

        try:
            download_as_jpeg(url, dest)
            print(f"  ✓  {dest.relative_to(Path(__file__).parent)}")
            downloaded += 1
        except Exception as e:
            print(f"  ✗  Error descargando '{prop_name}': {e}")

    print(f"     → {downloaded} descargadas, {skipped} saltadas, {missing} sin imagen en Notion")

# ---------------------------------------------------------------------------
# MAIN
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Descarga imágenes de Notion y las guarda en assets/cases/"
    )
    parser.add_argument("--slug",  default="all", help="Slug del proyecto o 'all'")
    parser.add_argument("--force", action="store_true",
                        help="Sobreescribir archivos existentes")
    args = parser.parse_args()

    token = os.environ.get("NOTION_API_KEY")
    if not token:
        print("Error: falta NOTION_API_KEY en el entorno.")
        print("  PowerShell: $env:NOTION_API_KEY = 'secret_...'")
        print("  Bash/zsh:   export NOTION_API_KEY=secret_...")
        print()
        print("Conseguí tu token en: https://www.notion.so/profile/integrations")
        print("Asegurate de que la integración tenga acceso a la base 'Case studies'.")
        sys.exit(1)

    if args.slug != "all" and args.slug not in PROJECTS:
        print(f"Slug desconocido: {args.slug}")
        print(f"Disponibles: {', '.join(PROJECTS)}")
        sys.exit(1)

    targets = PROJECTS if args.slug == "all" else {args.slug: PROJECTS[args.slug]}

    for slug, page_id in targets.items():
        process_project(slug, page_id, token, force=args.force)

    print("\n¡Listo! Revisá assets/cases/ para ver las imágenes descargadas.")


if __name__ == "__main__":
    main()
