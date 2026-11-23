"""Regenerate the three editable visual-content starter tiles for VYRO MEDIA."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/library/templates/photo'
OUT.mkdir(parents=True, exist_ok=True)
W = H = 1080
BLACK = (5, 7, 9)
DARK = (13, 17, 22)
WHITE = (247, 249, 246)
LIME = (184, 255, 0)
MUTED = (151, 160, 164)
REG = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
BOLD = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
def f(size, bold=False): return ImageFont.truetype(BOLD if bold else REG, size)

def base(title_a, title_b, sub_a, sub_b, type_label):
    im = Image.new('RGB', (W, H), BLACK)
    px = im.load()
    for y in range(H):
        c = tuple(int(BLACK[i] + (DARK[i] - BLACK[i]) * y / H) for i in range(3))
        for x in range(W): px[x, y] = c
    d = ImageDraw.Draw(im)
    for i in range(4):
        x = 760 + i * 100
        d.polygon([(x,0),(x+65,0),(x-245,H),(x-310,H)], fill=(12,17,19) if i%2==0 else (22,30,28))
    d.polygon([(0,0),(72,0),(0,245)], fill=LIME)
    d.polygon([(W,H),(W-95,H),(W,H-280)], fill=LIME)
    d.text((72,70), 'VYRO MEDIA  /  VISUAL TEMPLATE', font=f(27,True), fill=LIME)
    d.text((72,265), title_a, font=f(78,True), fill=WHITE)
    d.text((72,365), title_b, font=f(78,True), fill=LIME)
    d.text((74,520), sub_a, font=f(26,True), fill=WHITE)
    d.text((74,565), sub_b, font=f(26,True), fill=WHITE)
    d.rounded_rectangle((72,680,500,795), radius=22, fill=(14,18,19), outline=LIME, width=3)
    d.text((105,710), type_label.upper(), font=f(25,True), fill=LIME)
    d.text((105,750), 'READY TO CUSTOMIZE', font=f(19,True), fill=WHITE)
    d.text((72,950), '1080 × 1080  •  FEED TEMPLATE', font=f(24,True), fill=MUTED)
    d.text((72,1000), 'Make Attention Matter.', font=f(24), fill=LIME)
    return im, ImageDraw.Draw(im)

# 01 Product spotlight
im,d = base('PROMO','PRODUK','Visual produk yang kuat,','pesan yang ringkas.','Product spotlight')
d.rounded_rectangle((555,210,990,900), radius=42, fill=(18,25,25), outline=(63,79,64), width=3)
d.ellipse((600,780,950,865), fill=(8,10,10), outline=LIME, width=4)
d.rounded_rectangle((680,400,860,790), radius=38, fill=(25,31,28), outline=(170,190,170), width=5)
d.rounded_rectangle((727,325,813,425), radius=15, fill=(43,54,45), outline=LIME, width=4)
d.rounded_rectangle((705,520,835,680), radius=14, fill=(9,12,12), outline=(80,100,75), width=3)
d.text((718,565),'VYRO',font=f(35,True),fill=WHITE)
d.text((718,615),'SELECT',font=f(23,True),fill=LIME)
d.line((590,315,920,245), fill=LIME, width=7)
im.save(OUT/'photo_01_product_spotlight.png', optimize=True)

# 02 Creator tips
im,d = base('TIPS','KREATOR','3 langkah untuk konten','yang lebih tajam.','Creator tips')
d.rounded_rectangle((555,210,990,900), radius=42, fill=(18,25,25), outline=(63,79,64), width=3)
# camera/creator silhouette with headset-style framing
d.ellipse((680,290,875,485), fill=(20,25,28), outline=LIME, width=6)
d.ellipse((715,330,742,357), fill=LIME)
d.polygon([(625,875),(655,625),(710,500),(850,500),(920,625),(955,875)], fill=(8,10,12), outline=(105,130,100))
d.polygon([(755,515),(795,515),(850,810),(730,810)], fill=(20,33,30))
d.arc((660,275,895,510), 185, 355, fill=WHITE, width=8)
d.line((575,540,950,540), fill=(60,80,65), width=3)
im.save(OUT/'photo_02_creator_tips.png', optimize=True)

# 03 Trend alert
im,d = base('TREND','ALERT','Bahas tren dengan','sumber dan konteks jelas.','Trend explainer')
d.rounded_rectangle((555,210,990,900), radius=42, fill=(18,25,25), outline=(63,79,64), width=3)
d.rounded_rectangle((620,285,925,815), radius=35, fill=(7,10,13), outline=(98,119,105), width=6)
d.rounded_rectangle((655,335,890,755), radius=20, fill=(15,21,22))
d.text((680,370),'TREND',font=f(32,True),fill=WHITE)
d.line((680,670,735,610,785,635,850,480), fill=LIME, width=14, joint='curve')
d.polygon([(850,480),(813,492),(846,523)], fill=LIME)
for i,h in enumerate([95,150,225,295]):
    x=680+i*52
    d.rounded_rectangle((x,720-h,x+27,720), radius=8, fill=(55,75,60) if i<3 else LIME)
im.save(OUT/'photo_03_trend_alert.png', optimize=True)
print('Generated 3 photo templates at 1080x1080.')
