import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw

src, out = Path(sys.argv[1]), Path(sys.argv[2]); out.mkdir(parents=True, exist_ok=True)
im = Image.open(src).convert('RGB')
BG = (10, 11, 8)
L = Image.LANCZOS
def panel(x0,y0,x1,y1,i=3): return im.crop((x0+i,y0+i,x1+1-i,y1+1-i))
P1=panel(8,8,1015,377); P2=panel(8,387,1015,863); P3=panel(8,871,608,1526)
P4=panel(619,871,1015,1153); P5=panel(619,1163,1015,1526)
def bbox(p, thr=45, inset=4, min_px=3):
    d = ImageChops.difference(p, Image.new('RGB', p.size, BG)).convert('L').point(lambda v: 1 if v>thr else 0)
    w,h = d.size; px = d.load()
    cols = [x for x in range(inset,w-inset) if sum(px[x,y] for y in range(inset,h-inset))>=min_px]
    rows = [y for y in range(inset,h-inset) if sum(px[x,y] for x in range(inset,w-inset))>=min_px]
    return (cols[0], rows[0], cols[-1]+1, rows[-1]+1)
def square(p, pad=0.10, size=1024):
    b = bbox(p); c = p.crop(b); w,h = c.size; side = int(max(w,h)/(1-2*pad))
    canvas = Image.new('RGB', (side,side), BG); canvas.paste(c, ((side-w)//2, (side-h)//2))
    return canvas.resize((size,size), L)
def rounded(img, r=0.22, ss=4):
    s = img.size[0]; m = Image.new('L', (s*ss, s*ss), 0)
    ImageDraw.Draw(m).rounded_rectangle((0,0,s*ss-1,s*ss-1), radius=int(s*ss*r), fill=255)
    out = img.convert('RGBA'); out.putalpha(m.resize((s,s), L)); return out
def pad_to(p, ratio):  # widen with background on the left
    w,h = p.size; nw = round(h*ratio); c = Image.new('RGB',(nw,h),BG); c.paste(p,(nw-w,0)); return c
for n,p in [('P1',P1),('P2',P2),('P3',P3),('P4',P4),('P5',P5)]: print(n, p.size, bbox(p))
# banner 3:1, padded on the empty left
pad_to(P1, 3).resize((2400,800), L).save(out/'banner.png', optimize=True)
# social preview 2:1, GitHub size, keep left content
P2.crop((0,0,942,471)).resize((1280,640), L).save(out/'social-preview.png', optimize=True)
# launch post 16:9
P2.crop((0,0,837,471)).resize((1600,900), L).save(out/'launch-post.png', optimize=True)
# logo and avatar
head = square(P3, pad=0.09)
head.save(out/'avatar.png', optimize=True)
rounded(head).save(out/'logo.png', optimize=True)
rounded(square(P3, pad=0.04, size=256)).save(out/'icon-256.png', optimize=True)
# stickers
rounded(square(P4, pad=0.08)).save(out/'sticker-squawk.png', optimize=True)
rounded(square(P5, pad=0.08)).save(out/'sticker-treasure.png', optimize=True)
# small-size check sheet (not shipped)
chk = Image.new('RGB',(300,80),(255,255,255)); x=10
for s in (16,32,48,64):
    t = rounded(square(P3, pad=0.04, size=s)); chk.paste(t,(x,10),t); x+=s+20
chk.resize((900,240), Image.NEAREST).save(sys.argv[3])
