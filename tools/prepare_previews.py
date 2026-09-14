from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
FONT = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
WATERMARK = "ДЕМО • НЕ ДЛЯ РАСПРОСТРАНЕНИЯ"


def natural_key(path: Path):
    return int(path.stem.split("-")[-1])


def add_watermark(image: Image.Image) -> Image.Image:
    base = image.convert("RGBA")
    tile = Image.new("RGBA", (900, 220), (0, 0, 0, 0))
    draw = ImageDraw.Draw(tile)
    font = ImageFont.truetype(FONT, 34)
    bbox = draw.textbbox((0, 0), WATERMARK, font=font)
    x = (tile.width - (bbox[2] - bbox[0])) // 2
    y = (tile.height - (bbox[3] - bbox[1])) // 2
    draw.text((x, y), WATERMARK, font=font, fill=(25, 38, 69, 48))
    tile = tile.rotate(-24, expand=True, resample=Image.Resampling.BICUBIC)
    layer = Image.new("RGBA", base.size, (0, 0, 0, 0))
    for y in range(-tile.height, base.height + tile.height, 310):
        offset = 0 if (y // 310) % 2 == 0 else -360
        for x in range(offset, base.width + tile.width, 720):
            layer.alpha_composite(tile, (x, y))
    return Image.alpha_composite(base, layer).convert("RGB")


def process(src: Path, dst: Path, prefix: str, width: int, quality: int):
    dst.mkdir(parents=True, exist_ok=True)
    for index, path in enumerate(sorted(src.glob("*.png"), key=natural_key), start=1):
        with Image.open(path) as image:
            scale = min(1.0, width / image.width)
            size = (round(image.width * scale), round(image.height * scale))
            rendered = image.resize(size, Image.Resampling.LANCZOS) if scale < 1 else image.copy()
            rendered = add_watermark(rendered)
            rendered.save(dst / f"{prefix}-{index:02d}.webp", "WEBP", quality=quality, method=6)


process(ROOT / ".build/doc-render", ROOT / "dist/assets/report", "page", 1200, 78)
process(ROOT / ".build/ppt-render", ROOT / "dist/assets/slides", "slide", 1280, 82)
