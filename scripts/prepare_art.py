"""Legacy v1 art reconstruction, written outside the active app directory."""
from pathlib import Path
from PIL import Image, ImageChops, ImageDraw, ImageFilter
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'output/imagegen/legacy-v1-art'
OUT.mkdir(parents=True, exist_ok=True)
sheet = Image.open(ROOT / 'output/imagegen/game-assets/sprites/gpt-image_20261119_111902_1.png').convert('RGBA')
for name, box, height in [('rabbit',(0,0,900,1024),760), ('lamp',(930,0,1536,1024),480)]:
    im=sheet.crop(box)
    r,g,b,a=im.split()
    light=ImageChops.darker(ImageChops.darker(r,g),b)
    alpha=light.point(lambda v: 255 if v<225 else max(0,round((245-v)*255/20)))
    im.putalpha(alpha)
    im=im.crop(alpha.getbbox())
    im.thumbnail((900,height),Image.Resampling.LANCZOS)
    im.save(OUT/(name+'.webp'),quality=94,method=6)
    print(name,im.size)
stage=Image.open(ROOT/'output/imagegen/game-assets/stage/gpt-image_20261119_111846_1.png')
stage.resize((900,900),Image.Resampling.LANCZOS).save(OUT/'stage.webp',quality=88,method=6)
ref=Image.open(ROOT/'design/shadow-play/level-01/01-初始引导.png').convert('RGBA')
moon=ref.crop((622,330,854,562))
mask=Image.new('L',moon.size); ImageDraw.Draw(mask).ellipse((4,4,228,228),fill=255)
moon.putalpha(mask.filter(ImageFilter.GaussianBlur(1)))
moon.save(OUT/'moon.webp',quality=92,method=6)
