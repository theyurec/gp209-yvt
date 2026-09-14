from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
FONT = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
WATERMARK = "Демо-страница"


def natural_key(path: Path):
    return int(path.stem.split("-")[-1])


def add_watermark(image: Image.Image) -> Image.Image:
    base = image.convert("RGBA")
    layer = Image.new("RGBA", base.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    font = ImageFont.truetype(FONT, max(20, round(base.width * 0.024)))
    bbox = draw.textbbox((0, 0), WATERMARK, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    pad_x = round(base.width * 0.018)
    pad_y = round(base.width * 0.009)
    x = (base.width - text_width) // 2
    y = base.height - text_height - pad_y * 2
    draw.rounded_rectangle(
        (x - pad_x, y - pad_y, x + text_width + pad_x, y + text_height + pad_y),
        radius=8,
        fill=(255, 255, 255, 205),
        outline=(28, 44, 79, 90),
        width=1,
    )
    draw.text((x, y - bbox[1]), WATERMARK, font=font, fill=(28, 44, 79, 150))
    return Image.alpha_composite(base, layer).convert("RGB")


def process(src: Path, dst: Path, prefix: str, width: int, quality: int):
    dst.mkdir(parents=True, exist_ok=True)
    for old in dst.glob(f"{prefix}-*.webp"):
        old.unlink()
    for index, path in enumerate(sorted(src.glob("*.png"), key=natural_key), start=1):
        with Image.open(path) as image:
            scale = min(1.0, width / image.width)
            size = (round(image.width * scale), round(image.height * scale))
            rendered = image.resize(size, Image.Resampling.LANCZOS) if scale < 1 else image.copy()
            rendered = add_watermark(rendered)
            rendered.save(dst / f"{prefix}-{index:02d}.webp", "WEBP", quality=quality, method=6)


process(ROOT / ".build/new-doc-render", ROOT / "dist/assets/report", "page", 1200, 78)
process(ROOT / ".build/new-ppt-render", ROOT / "dist/assets/slides", "slide", 1280, 82)
