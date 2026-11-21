from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).resolve().parents[1] / 'public' / 'icons'
FONT = r'C:\Windows\Fonts\simhei.ttf'


def make(size: int, name: str, ratio: float = 0.56) -> None:
    img = Image.new('RGB', (size, size), '#0a0d14')
    draw = ImageDraw.Draw(img)
    margin = int(size * 0.09)
    draw.ellipse((margin, margin, size - margin, size - margin), outline='#6a4a2d', width=max(2, size // 96))
    draw.ellipse((margin * 2, margin * 2, size - margin * 2, size - margin * 2), outline='#2a2230', width=max(1, size // 180))
    font = ImageFont.truetype(FONT, int(size * ratio))
    bbox = draw.textbbox((0, 0), '全', font=font)
    x = (size - (bbox[2] - bbox[0])) / 2 - bbox[0]
    y = (size - (bbox[3] - bbox[1])) / 2 - bbox[1]
    draw.text((x, y), '全', font=font, fill='#f0b26b')
    line_w = int(size * 0.26)
    lx = (size - line_w) // 2
    ly = int(size * 0.78)
    draw.line((lx, ly, lx + line_w, ly), fill='#e2603f', width=max(2, size // 80))
    img.save(OUT / name, 'PNG')


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for size in (192, 512):
        make(size, f'icon-{size}.png')
    make(512, 'icon-maskable-512.png', ratio=0.46)
    make(180, 'apple-touch-icon.png')
    make(64, 'favicon.png')
    print('icons:', ', '.join(sorted(p.name for p in OUT.glob('*.png'))))


if __name__ == '__main__':
    main()
