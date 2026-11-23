"""Regenerate VYRO MEDIA 9:16 silent motion template MP4s and poster frames."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import json, math, subprocess, shutil
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'public/library/templates/video'
TMP=ROOT/'.video-render-tmp'
OUT.mkdir(parents=True,exist_ok=True)
if TMP.exists(): shutil.rmtree(TMP)
TMP.mkdir()
W,H=720,1280
BLACK=(5,7,9); WHITE=(247,249,246); LIME=(184,255,0); MUTED=(151,160,164)
REG='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'; BOLD='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
def f(s,b=False): return ImageFont.truetype(BOLD if b else REG,s)
sym=Image.open(ROOT/'public/site-symbol.png').convert('RGBA')

def frame(video_idx, idx, total, lines, path):
    im=Image.new('RGB',(W,H),BLACK); d=ImageDraw.Draw(im)
    phase=idx/total; shift=int(155*phase)
    d.polygon([(0,0),(W,0),(W,260),(0,520)],fill=(12,16,18))
    d.polygon([(shift-240,0),(shift-125,0),(shift-560,H),(shift-675,H)],fill=(24,33,25))
    d.polygon([(W-shift+160,0),(W-shift+265,0),(W-shift-130,H),(W-shift-235,H)],fill=(18,26,21))
    d.polygon([(0,0),(25,0),(25,280),(0,320)],fill=LIME)
    d.polygon([(W,H),(W-30,H),(W,H-240)],fill=LIME)
    # A slow neon scan beam, different travel per template.
    beam_y=310+int(90*math.sin(phase*math.pi*2))
    d.line((70,beam_y,W-70,beam_y-55),fill=(57,82,34),width=3)
    logo=sym.copy(); logo.thumbnail((250,250),Image.Resampling.LANCZOS)
    im.paste(logo,((W-logo.width)//2,95),logo)
    section=min(len(lines)-1,int(phase*len(lines)))
    if video_idx==0:
        # Brand identity opener: orbit/rings around the logo and a sweeping title.
        d.ellipse((120,350,600,830),outline=(40,61,31),width=4)
        d.arc((90,325,630,855),190,340,fill=LIME,width=8)
        y_text=585
        fsize=49 if len(lines[section])>20 else 58
        d.text((70,1080),'VYRO MEDIA  /  BRAND IDENT',font=f(20,True),fill=MUTED)
    elif video_idx==1:
        # Product showcase: a stylized bottle on a lime-lit plinth.
        d.ellipse((180,770,540,850),fill=(8,10,10),outline=(95,132,38),width=4)
        d.rounded_rectangle((285,420,435,775),radius=32,fill=(18,25,23),outline=(170,190,170),width=5)
        d.rounded_rectangle((322,350,398,445),radius=12,fill=(35,48,39),outline=LIME,width=4)
        d.rounded_rectangle((305,535,415,665),radius=12,fill=(7,10,11),outline=(75,94,66),width=3)
        d.text((319,568),'VYRO',font=f(25,True),fill=WHITE)
        d.text((319,605),'SELECT',font=f(18,True),fill=LIME)
        y_text=890; fsize=48 if len(lines[section])>20 else 56
        d.text((70,1080),'PRODUCT / VALUE / ACTION',font=f(20,True),fill=MUTED)
    else:
        # Creator tips: three numbered steps with advancing progress.
        chips_y=390
        for step in range(3):
            yy=chips_y+step*145
            active=step==section
            fill=LIME if active else (21,30,27)
            d.rounded_rectangle((95,yy,625,yy+105),radius=20,fill=fill,outline=LIME if active else (72,89,76),width=3)
            text_color=BLACK if active else WHITE
            d.text((125,yy+25),f'0{step+1}',font=f(42,True),fill=text_color)
            d.rounded_rectangle((235,yy+31,570,yy+73),radius=10,fill=(12,17,15) if active else (38,48,42))
            d.rounded_rectangle((235,yy+31,235+int((335)*(0.35 if step<1 else 0.75 if step<2 else 1)),yy+73),radius=10,fill=(85,120,30) if active else (49,69,52))
        y_text=890; fsize=60
        d.text((70,1080),'HOOK  /  VALUE  /  ACTION',font=f(20,True),fill=MUTED)
    main=lines[section]
    face=f(fsize,True)
    bbox=d.textbbox((0,0),main,font=face); tw=bbox[2]-bbox[0]
    if tw>W-100:
        face=f(40,True); bbox=d.textbbox((0,0),main,font=face); tw=bbox[2]-bbox[0]
    x=(W-tw)//2
    d.rounded_rectangle((55,y_text-24,W-55,y_text+94),radius=20,fill=(7,10,11),outline=(60,80,44),width=2)
    d.text((x,y_text),main,font=face,fill=WHITE if section%2==0 else LIME)
    d.text((70,1150),'@vyromedia.id',font=f(26,True),fill=WHITE)
    d.text((70,1195),'MAKE ATTENTION MATTER.',font=f(18,True),fill=MUTED)
    im.save(path)

items=[
 ('video_01_brand_opener',['BRAND INTRO','CONTENT THAT MOVES','VYRO MEDIA'], 'Brand Opener', 'Reveal identitas brand dengan orbit mark, diagonal sweep, dan tagline.'),
 ('video_02_product_spotlight',['SHOW THE PRODUCT','TELL THE VALUE','MAKE THE NEXT MOVE'], 'Product Showcase', 'Sorot satu produk, satu nilai utama, dan satu ajakan bertindak.'),
 ('video_03_creator_tips',['HOOK','VALUE','ACTION'], 'Creator Tips', 'Template edukasi tiga tahap untuk konten vertikal singkat.')]
for idx,(slug,lines,title,desc) in enumerate(items):
    work=TMP/slug; work.mkdir()
    total=144
    for i in range(total): frame(idx,i,total,lines,work/f'frame_{i:04d}.png')
    mp4=OUT/f'{slug}.mp4'
    subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','error','-framerate','24','-i',str(work/'frame_%04d.png'),'-c:v','libx264','-preset','veryfast','-crf','22','-pix_fmt','yuv420p','-movflags','+faststart',str(mp4)],check=True)
    shutil.copy(work/'frame_0072.png',OUT/f'{slug}_poster.png')
    data={'id':slug,'title':title,'description':desc,'format':'9:16','resolution':'720x1280','duration_seconds':6,'fps':24,'audio':'none','source':'PNG frame sequence + JSON storyboard spec','storyboard':[{'time':'0–2s','text':lines[0]},{'time':'2–4s','text':lines[1]},{'time':'4–6s','text':lines[2]}],'customize':['Ganti teks per scene','Sesuaikan warna dengan brand','Tambahkan footage asli/berizin','Tambahkan voice-over dan audio berlisensi saat editing']}
    (OUT/f'{slug}.json').write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
shutil.rmtree(TMP)
print('Generated 3 motion templates (H.264, 720x1280, 24fps, 6s, silent).')
