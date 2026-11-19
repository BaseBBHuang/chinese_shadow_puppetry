"""Prepare approved bright v2 artwork; credentials and source PNGs stay out of app/."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter
import json
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'app/art'
SOURCE=ROOT/'output/imagegen/bright-assets'
sheet=Image.open(SOURCE/'sprites/gpt-image_20261119_114856_1.png').convert('RGB')
info={}
for name,box,maxheight in [('rabbit',(0,0,920,1024),760),('lamp',(960,0,1536,1024),480)]:
    im=sheet.crop(box).convert('RGBA')
    pixels=[]
    for r,g,b,a in im.getdata():
        key=min(r,b)-g
        alpha=max(0,min(1,1-(key-25)/140))
        if alpha<0.03:pixels.append((0,0,0,0));continue
        if alpha<1:
            r=max(0,min(255,round((r-255*(1-alpha))/alpha)))
            b=max(0,min(255,round((b-255*(1-alpha))/alpha)))
            g=max(0,min(255,round(g/alpha)))
        pixels.append((r,g,b,round(alpha*255)))
    im.putdata(pixels)
    # Strip chroma antialias specks; broad silhouettes remain continuous.
    alpha=im.getchannel('A')
    bbox=alpha.point(lambda x:255 if x>170 else 0).getbbox()
    im=im.crop(bbox)
    im.thumbnail((900,maxheight),Image.Resampling.LANCZOS)
    im.save(OUT/(name+'.webp'),quality=94,method=6)
    info[name]={'width':im.width,'height':im.height,'sourceBox':box,'trimBox':bbox}
ref=Image.open(ROOT/'design/shadow-play/level-01-bright-v2/02-明亮纸影版-修订.png').convert('RGBA')
# Approved moon center: (748,431), radius 121 at source resolution.
moon=ref.crop((624,306,873,555))
mask=Image.new('L',moon.size);ImageDraw.Draw(mask).ellipse((5,5,244,244),fill=255)
moon.putalpha(mask.filter(ImageFilter.GaussianBlur(1)))
moon.save(OUT/'moon.webp',quality=92,method=6)
# Very subtle paper variation, light enough to keep the whole UI in ambient daylight.
paper=ref.crop((700,600,900,750)).convert('RGB')
base=Image.new('RGB',paper.size,'#fff7eb')
Image.blend(base,paper,.12).save(OUT/'wood.webp',quality=82,method=6)
stages=sorted((SOURCE/'stage').glob('*.png'))
if stages:
    Image.open(stages[-1]).convert('RGB').crop((0,0,1024,960)).resize((900,900),Image.Resampling.LANCZOS).save(OUT/'stage.webp',quality=88,method=6)
(SOURCE/'asset-metrics.json').write_text(json.dumps(info,indent=2)+'\n')
print(json.dumps(info,indent=2))
# QA composites expose imperfect chroma edges on the actual intended light paper.
rabbit=Image.open(OUT/'rabbit.webp')
qa=Image.new('RGBA',rabbit.size,'#fff7eb');qa.alpha_composite(rabbit);qa.convert('RGB').save(ROOT/'docs/qa/bright-v2/rabbit-matte.jpg',quality=94)
