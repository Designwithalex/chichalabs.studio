#!/usr/bin/env python3
"""
ChichaLabs Studio — Generador de imágenes para casos de estudio
Requiere: pip install openai pillow requests
Uso:    python generate-images.py --slug all
        python generate-images.py --slug pacto-estudio
        python generate-images.py --slug pacto-estudio --only hero
"""

import os
import sys
import argparse
import base64
import requests
from pathlib import Path

try:
    from openai import OpenAI
except ImportError:
    print("Instalá openai: pip install openai")
    sys.exit(1)

# ---------------------------------------------------------------------------
# CONFIG
# ---------------------------------------------------------------------------
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

OUTPUT_DIR = Path(__file__).parent / "assets" / "cases"
IMAGE_SIZE = "1536x1024"   # panorámico para heros (gpt-image-1 soporta 1536x1024)
GALLERY_SIZE = "1024x1024"
MODEL = "gpt-image-2"

STYLE_BASE = (
    "high-quality editorial photography, professional studio lighting, "
    "modern minimalist aesthetic, dark background or dramatic contrast, "
    "no text overlay, no watermark, photorealistic"
)

# ---------------------------------------------------------------------------
# PROYECTOS
# ---------------------------------------------------------------------------
PROJECTS = {

    "pacto-estudio": {
        "name": "Pacto Estudio",
        "industry": "Arquitectura",
        "accent_color": "#C4A882",
        "hero": (
            "Clean architectural studio workspace with drafting table, large format drawings "
            "and blueprints, warm ambient lighting with copper and earth tone accents, "
            "premium mid-century modern furniture, Buenos Aires architecture firm aesthetic. "
            + STYLE_BASE
        ),
        "gallery": [
            (
                "Detail of architectural blueprints and technical drawings spread on a glass desk, "
                "Moleskine sketchbooks, drafting tools, warm copper desk lamp, minimal and elegant. "
                + STYLE_BASE
            ),
            (
                "Modern portfolio website displayed on a MacBook Pro, showing residential architecture "
                "project grid, clean white UI with elegant serif typography, architect's studio background. "
                + STYLE_BASE
            ),
            (
                "Minimalist home interior designed by the studio, exposed concrete walls, large windows, "
                "natural wood and stone elements, Buenos Aires residential architecture, warm dusk light. "
                + STYLE_BASE
            ),
        ],
    },

    "agriedge": {
        "name": "Agriedge",
        "industry": "Agritech",
        "accent_color": "#40C074",
        "hero": (
            "Agronomist using tablet in vast Moroccan wheat field during golden hour, "
            "agricultural technology, soil sampling equipment nearby, data dashboard visible on screen, "
            "green and earth tones, lush crops in background. "
            + STYLE_BASE
        ),
        "gallery": [
            (
                "Detailed soil core samples arranged in laboratory trays, scientific measurement tools, "
                "data labels, clean lab environment, agricultural research setting. "
                + STYLE_BASE
            ),
            (
                "Modern UX dashboard displayed on iPad showing soil health metrics, charts and graphs, "
                "green accent colors, field trial data visualization, clean UI design in agricultural context. "
                + STYLE_BASE
            ),
            (
                "Aerial drone view of agricultural trial plots with distinct sections, Morocco farmland, "
                "geometric field divisions, varying crop stages, lush green and golden hues. "
                + STYLE_BASE
            ),
        ],
    },

    "patagonia-berries": {
        "name": "Patagonia Berries",
        "industry": "Alimentos",
        "accent_color": "#C44530",
        "hero": (
            "Artisan jam jars with handwritten labels, fresh Patagonian berries scattered on rustic wooden table, "
            "Chilean Patagonia mountain landscape blurred in background, warm natural light through linen curtains, "
            "organic and artisanal food brand aesthetic, deep red and warm earth tones. "
            + STYLE_BASE
        ),
        "gallery": [
            (
                "Close-up of dark berry jam jar being opened, steam rising, rustic ceramic spoon, "
                "scattered wild berries on slate surface, rich colors, artisan food photography. "
                + STYLE_BASE
            ),
            (
                "Product flat lay of five artisan jam varieties with illustrated paper labels, "
                "fresh maqui and calafate berries, dried herbs, on aged wooden surface, overhead shot. "
                + STYLE_BASE
            ),
            (
                "Patagonian landscape with berry bushes, native calafate in bloom, morning fog over mountains, "
                "editorial nature photography, deep blues and greens, wild and untouched scenery. "
                + STYLE_BASE
            ),
        ],
    },

    "chemikal": {
        "name": "Chemikal",
        "industry": "B2B / Química",
        "accent_color": "#0A7AFF",
        "hero": (
            "Modern industrial chemical supply company headquarters exterior at dusk, "
            "clean industrial architecture, blue and steel tones, loading docks visible, "
            "professional B2B corporate aesthetic, Argentine industrial zone. "
            + STYLE_BASE
        ),
        "gallery": [
            (
                "Corporate B2B website displayed on desktop monitor, clean dark blue UI, "
                "industrial chemical products catalog, professional typography, data tables. "
                + STYLE_BASE
            ),
            (
                "Row of industrial chemical containers and packaging with Chemikal brand labels, "
                "warehouse setting, blue and white color scheme, organized storage shelves. "
                + STYLE_BASE
            ),
            (
                "Professional meeting room with chemical industry executives reviewing digital dashboard, "
                "B2B sales presentation, modern Argentine corporate environment. "
                + STYLE_BASE
            ),
        ],
    },

    "gauchitas": {
        "name": "Gauchitas",
        "industry": "Moda / Indumentaria",
        "accent_color": "#E63030",
        "hero": (
            "Argentine fashion brand editorial shoot in Pampas landscape, "
            "two female models wearing modern gaucha-inspired clothing with folk embroidery details, "
            "golden grass fields at sunset, bold red and earth tone palette, vibrant Latin American fashion. "
            + STYLE_BASE
        ),
        "gallery": [
            (
                "Handcrafted textile products with gaucho motifs flat lay, embroidered fabrics, "
                "leather accessories, warm Argentine earth tones, artisan craftsmanship close-up. "
                + STYLE_BASE
            ),
            (
                "Fashion e-commerce website on laptop showing Gauchitas product catalog, "
                "warm editorial photography integrated in UI, bold typography, Argentine folk aesthetics. "
                + STYLE_BASE
            ),
            (
                "Detail close-up of embroidered gaucha jacket, intricate floral stitching, "
                "authentic Argentine craftsmanship, vibrant red and gold thread on dark fabric. "
                + STYLE_BASE
            ),
        ],
    },

    "kike-cafe": {
        "name": "Kike Café",
        "industry": "Gastronomía",
        "accent_color": "#C8863A",
        "hero": (
            "Cozy Argentine café interior with vintage wooden furniture, warm golden espresso being poured, "
            "steam rising, exposed brick walls, handwritten menu boards, Buenos Aires neighborhood café vibe. "
            + STYLE_BASE
        ),
        "gallery": [
            (
                "Latte art close-up in handmade ceramic cup, coffee beans scattered on wooden table, "
                "warm café ambient light, artisan coffee aesthetic. "
                + STYLE_BASE
            ),
            (
                "Café landing page displayed on iPhone mockup, warm amber and cream UI, "
                "menu highlight sections, coffee photography integration, modern minimalist web design. "
                + STYLE_BASE
            ),
            (
                "Morning rush at Argentine neighborhood café, barista serving espresso, "
                "customers with laptops, warm natural light through windows, community atmosphere. "
                + STYLE_BASE
            ),
        ],
    },

    "longevity-argentina": {
        "name": "Longevity Argentina",
        "industry": "Salud / Longevidad",
        "accent_color": "#4CAF50",
        "hero": (
            "Modern health and longevity clinic interior with clean white and green aesthetic, "
            "medical professional reviewing holistic wellness data on tablet, "
            "biohacking and preventive medicine equipment visible, calm serene Argentine health center. "
            + STYLE_BASE
        ),
        "gallery": [
            (
                "Health metrics dashboard on laptop showing biomarker tracking, "
                "longevity score visualization, green accent UI, medical data clean design, "
                "wellness app interface in health clinic setting. "
                + STYLE_BASE
            ),
            (
                "Physician and patient consultation in modern longevity clinic, "
                "personalized health plan on screen, integrative medicine, warm professional lighting. "
                + STYLE_BASE
            ),
            (
                "Premium wellness supplements and diagnostic tools arranged on white surface, "
                "green plants, stethoscope, medical data printouts, longevity clinic flat lay. "
                + STYLE_BASE
            ),
        ],
    },

    "ernesto-automotores": {
        "name": "Ernesto Automotores",
        "industry": "Automotriz",
        "accent_color": "#B8966E",
        "hero": (
            "Family-run Argentine car dealership showroom at dusk, "
            "well-maintained used vehicles displayed under warm lighting, "
            "modest but professional atmosphere, Buenos Aires suburbs car lot, trustworthy small business feel. "
            + STYLE_BASE
        ),
        "gallery": [
            (
                "Car dealership website displayed on desktop, clean grid of vehicle listings, "
                "PHP-powered admin panel visible in sidebar, professional automotive UI in dark and gold tones. "
                + STYLE_BASE
            ),
            (
                "Polished used car close-up in dealership showroom, warm lighting reflecting on hood, "
                "clean and trustworthy presentation, Argentine automotive market aesthetic. "
                + STYLE_BASE
            ),
            (
                "Dealership salesperson showing vehicle features to family clients in parking lot, "
                "friendly community car shop, Buenos Aires suburbs, natural daylight. "
                + STYLE_BASE
            ),
        ],
    },

    "cafe-la-humedad": {
        "name": "Café La Humedad",
        "industry": "Gastronomía / Eventos",
        "accent_color": "#6B4C3B",
        "hero": (
            "Underground Buenos Aires café with live jazz event in progress, "
            "moody atmospheric lighting, vintage posters on exposed brick walls, "
            "small stage with musician silhouette, intimate avant-garde cultural venue, "
            "warm amber and deep shadow tones. "
            + STYLE_BASE
        ),
        "gallery": [
            (
                "Event automation dashboard on laptop in backstage café environment, "
                "Python-generated weekly schedule, WhatsApp integration visible, "
                "upcoming events timeline, moody editorial aesthetic. "
                + STYLE_BASE
            ),
            (
                "Hand-lettered event poster on café chalkboard for upcoming live music night, "
                "vintage aesthetic, warm café light, artistic Buenos Aires underground scene. "
                + STYLE_BASE
            ),
            (
                "Barista preparing specialty coffee at La Humedad, intimate café counter, "
                "event flyers pinned to bulletin board behind them, cultural venue atmosphere. "
                + STYLE_BASE
            ),
        ],
    },

    "identidad-genesis": {
        "name": "Identidad Génesis",
        "industry": "Diseño / Portfolio",
        "accent_color": "#FFFFFF",
        "hero": (
            "Minimalist graphic designer portfolio website displayed on iMac in clean modern studio, "
            "monochrome black and white aesthetic, bold typography-driven layout, "
            "dark mode UI with white text, professional design portfolio presentation. "
            + STYLE_BASE
        ),
        "gallery": [
            (
                "Designer's desk with open Framer project on laptop, Pantone swatches, "
                "typography specimens, minimal workspace, creative studio environment. "
                + STYLE_BASE
            ),
            (
                "Portfolio case study page on screen showing brand identity project, "
                "logo variations, color palette display, professional designer presentation format. "
                + STYLE_BASE
            ),
            (
                "Printed brand identity deliverables spread on white table, "
                "business cards, letterhead, brand guidelines booklet, clean design photography. "
                + STYLE_BASE
            ),
        ],
    },

}

# ---------------------------------------------------------------------------
# HELPERS
# ---------------------------------------------------------------------------

def ensure_dir(slug: str) -> Path:
    d = OUTPUT_DIR / slug
    d.mkdir(parents=True, exist_ok=True)
    return d


def save_b64_image(b64_data: str, path: Path) -> None:
    img_bytes = base64.b64decode(b64_data)
    path.write_bytes(img_bytes)
    print(f"  ✓  Guardado: {path.relative_to(Path(__file__).parent)}")


def generate_image(prompt: str, size: str, output_path: Path) -> None:
    if output_path.exists():
        print(f"  —  Existe: {output_path.name}, saltando.")
        return

    print(f"  …  Generando: {output_path.name}")
    try:
        response = client.images.generate(
            model=MODEL,
            prompt=prompt,
            n=1,
            size=size,
            quality="high",
        )
        b64 = response.data[0].b64_json
        save_b64_image(b64, output_path)
    except Exception as e:
        print(f"  ✗  Error generando {output_path.name}: {e}")


# ---------------------------------------------------------------------------
# MAIN
# ---------------------------------------------------------------------------

def process_project(slug: str, data: dict, only: str | None = None) -> None:
    print(f"\n[ {data['name']} ] ({slug})")
    d = ensure_dir(slug)

    if only != "gallery":
        hero_path = d / "hero.jpg"
        generate_image(data["hero"], IMAGE_SIZE, hero_path)

    if only != "hero":
        for i, prompt in enumerate(data.get("gallery", []), start=1):
            gallery_path = d / f"{i:02d}.jpg"
            generate_image(prompt, GALLERY_SIZE, gallery_path)


def main():
    parser = argparse.ArgumentParser(description="Genera imágenes para casos de estudio ChichaLabs")
    parser.add_argument("--slug",  default="all", help="Slug del proyecto o 'all'")
    parser.add_argument("--only",  choices=["hero", "gallery"], default=None,
                        help="Generar solo hero o solo galería")
    args = parser.parse_args()

    if not os.environ.get("OPENAI_API_KEY"):
        print("Error: falta OPENAI_API_KEY en el entorno.")
        print("  Windows PowerShell: $env:OPENAI_API_KEY = 'sk-...'")
        print("  Bash/zsh:           export OPENAI_API_KEY=sk-...")
        sys.exit(1)

    if args.slug == "all":
        for slug, data in PROJECTS.items():
            process_project(slug, data, only=args.only)
    elif args.slug in PROJECTS:
        process_project(args.slug, PROJECTS[args.slug], only=args.only)
    else:
        print(f"Slug desconocido: {args.slug}")
        print(f"Disponibles: {', '.join(PROJECTS)}")
        sys.exit(1)

    print("\n¡Listo! Las imágenes están en assets/cases/")


if __name__ == "__main__":
    main()
