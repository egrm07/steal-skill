import math
import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFont

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
# Text added on top of the generated art, drawn at output size so it stays sharp.
INK = (17, 18, 15)
MONO = ('/System/Library/Fonts/Menlo.ttc', 1)       # Menlo Bold
SANS = ('/System/Library/Fonts/Helvetica.ttc', 1)   # Helvetica Bold
CHECKLIST = ['add a test?', 'nit: naming', 'handle errors']
BUBBLE = ['Your lead would', 'flag line 42.']
SP = im.load()
def cream(p): return p[0] > 200 and p[1] > 185 and p[2] > 150 and p[0] - p[2] > 12
def fit(spec, lines, w, h, gap=0.25):
    size = 200
    while size > 6:
        f = ImageFont.truetype(spec[0], size, index=spec[1])
        lw = max(f.getlength(t) for t in lines); lh = size * (len(lines) + gap * (len(lines) - 1))
        if lw <= w and lh <= h: return f
        size -= 1
    return f
def stamp(img, text, font, cx, cy, angle):
    w = int(font.getlength(text)) + 8; h = int(font.size * 1.4)
    layer = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    ImageDraw.Draw(layer).text((w / 2, h / 2), text, font=font, fill=INK, anchor='mm')
    layer = layer.rotate(-angle, resample=Image.BICUBIC, expand=True)
    img.paste(layer, (round(cx - layer.width / 2), round(cy - layer.height / 2)), layer)
def checklist(img, T, k):
    # the three comment boxes on the scroll, in sheet pixels (found by colour)
    for (x0, y0, x1, y1), text in zip([(621, 165, 752, 210), (596, 230, 740, 278), (560, 297, 717, 344)], CHECKLIST):
        green = [x for y in range(y0, y1) for x in range(x0, x1) if SP[x, y][1] > SP[x, y][0] + 60 and SP[x, y][1] > 90]
        right = min(green) - 5
        def mid(x, y0=y0, y1=y1):
            ys = [y for y in range(y0 - 3, y1 + 4) if cream(SP[x, y])]
            return (ys[0] + ys[-1]) / 2, ys[-1] - ys[0]
        # the boxes lean with the scroll, so start the text past the furthest-right left edge
        band = range((3 * y0 + y1) // 4, (y0 + 3 * y1) // 4)
        left = max(next(x for x in range(x0, x1) if cream(SP[x, y])) for y in band) + 6
        (ya, ha), (yb, _) = mid(left), mid(right)
        angle = math.degrees(math.atan2(yb - ya, right - left))
        font = fit(MONO, [text], (right - left) * k * 0.97, ha * k * 0.42)
        tw = font.getlength(text)
        ax, ay = T(left, ya); c = math.cos(math.radians(angle)); s_ = math.sin(math.radians(angle))
        stamp(img, text, font, ax + tw / 2 * c, ay + tw / 2 * s_, angle)
def bubble(img, T, k):
    x0, y0, x1, y1 = 326, 398, 599, 560   # white bubble, sheet pixels
    widths = {y: sum(1 for x in range(x0, x1) if min(SP[x, y]) > 235) for y in range(y0, y1)}
    big = [y for y, n in widths.items() if n > 0.5 * max(widths.values())]
    cx, cy = T((x0 + x1) / 2, (big[0] + big[-1]) / 2)
    font = fit(SANS, BUBBLE, (x1 - x0) * k * 0.66, (big[-1] - big[0]) * k * 0.5)
    lh = font.size * 1.25
    for i, line in enumerate(BUBBLE):
        stamp(img, line, font, cx, cy + (i - (len(BUBBLE) - 1) / 2) * lh, 0)
# banner 3:1, padded on the empty left
wide = pad_to(P1, 3); k = 2400 / wide.width; off = wide.width - P1.width
banner = wide.resize((2400, 800), L)
checklist(banner, lambda x, y: ((x - 11 + off) * k, (y - 11) * k), k)
banner.save(out/'banner.png', optimize=True)
# social preview 2:1, GitHub size, and launch post 16:9, both from the robot panel
for name, cw, size in [('social-preview', 942, (1280, 640)), ('launch-post', 837, (1600, 900))]:
    k = size[0] / cw; img = P2.crop((0, 0, cw, 471)).resize(size, L)
    bubble(img, lambda x, y, k=k: ((x - 11) * k, (y - 390) * k), k)
    img.save(out/f'{name}.png', optimize=True)
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
