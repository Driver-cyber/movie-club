from PIL import Image, ImageDraw
import math

def star_pts(cx, cy, R, r, n=5, rot=-math.pi/2):
    pts=[]
    for k in range(n*2):
        ang=rot + k*math.pi/n
        rad=R if k%2==0 else r
        pts.append((cx+rad*math.cos(ang), cy+rad*math.sin(ang)))
    return pts

def make(size):
    SS=4; S=size*SS
    img=Image.new('RGBA',(S,S),(24,18,14,255))           # warm ink #18120E
    d=ImageDraw.Draw(img); cx=cy=S/2
    d.polygon(star_pts(cx,cy,S*0.315,S*0.315*0.40), fill=(122,98,51,255))   # rim #7A6233
    d.polygon(star_pts(cx,cy,S*0.30, S*0.30*0.40),  fill=(224,178,92,255))  # gold #E0B25C
    return img.resize((size,size), Image.LANCZOS).convert('RGBA')

for s in (512,192,180):
    make(s).save(f'icon-{s}.png')
print("wrote icon-512.png icon-192.png icon-180.png")
