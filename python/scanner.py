#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Answer-sheet scanner & corrector
 • large readable symbols
 • legend  + coloured stats bar chart
 • full-resolution + thumbnail output
"""

import cv2, sys, json, numpy as np, pandas as pd, cv2.aruco as aruco
from pyzbar.pyzbar import decode

# ──────────────────────────────────────────────────────────────────────────────
#                           VISUAL CONSTANTS
# ──────────────────────────────────────────────────────────────────────────────
COLORS = {
    "correct"  : ( 40, 185,  40),   # green
    "wrong"    : ( 35,  35, 200),   # red-blue
    "multiple" : (  0, 215, 255),   # orange
    "missed"   : ( 40, 185,  40),   # ring (same green)
    "neutral"  : (140, 140, 140),   # grey
    "grid"     : (190, 190, 190)    # light grid
}
FONT        = cv2.FONT_HERSHEY_SIMPLEX
FONT_SMALL  = 1.0
FONT_THICK  = 2
FRAME_THICK = 5

# ──────────────────────────────────────────────────────────────────────────────
#                               DRAW HELPERS
# ──────────────────────────────────────────────────────────────────────────────
def draw_tick(img, c, col, sz):   _x,_y = c; s=sz//2; t=max(3,sz//10)
    cv2.line(img,(_x-s,_y),(_x-s//5,_y+s),col,t,cv2.LINE_AA)
    cv2.line(img,(_x-s//5,_y+s),(_x+s,_y-s),col,t,cv2.LINE_AA)

def draw_cross(img, c, col, sz):  _x,_y=c; t=max(3,sz//10)
    cv2.line(img,(_x-sz,_y-sz),(_x+sz,_y+sz),col,t,cv2.LINE_AA)
    cv2.line(img,(_x-sz,_y+sz),(_x+sz,_y-sz),col,t,cv2.LINE_AA)

def draw_square(img, c, col, side): _x,_y=c; s=side//2
    cv2.rectangle(img,(_x-s,_y-s),(_x+s,_y+s),col,FRAME_THICK)

def draw_ring(img, c, col, rad): cv2.circle(img,c,rad,col,FRAME_THICK,cv2.LINE_AA)
def draw_dot(img, c, col, rad):  cv2.circle(img,c,rad,col,-1,cv2.LINE_AA)

def sym_sizes(r):          # scale symbols to bubble radius
    return dict(tick =max(30,int(r*2.2)),
                cross=max(30,int(r*2.2)),
                square=max(44,int(r*2.8)),
                ringR =max(24,int(r*1.7)),
                dotR  =max(10,int(r*0.7)))

# ──────────────────────────────────────────────────────────────────────────────
#                        GENERIC HELPERS (UNCHANGED LOGIC)
# ──────────────────────────────────────────────────────────────────────────────
def read_image(p):
    img=cv2.imread(p,cv2.IMREAD_COLOR)
    if img is None: raise FileNotFoundError(p); return img
def qr_text(img):
    for o in decode(img):
        if o.type=="QRCODE": return o.data.decode("utf-8")
    return None
def detect_size_set_rois(ids):
    global rois
    if ids is None: return None
    ids=set(ids.flatten())
    presets={
        "A4":{"ids":{1,2,3,4},"rois":{
            'answer_sheet_roi_1':(200,1180,600 ,3180),
            'answer_sheet_roi_2':(740,1180,1140,3180),
            'answer_sheet_roi_3':(1313,1180,1713,3180),
            'answer_sheet_roi_4':(1860,1180,2260,3180)}},
        "A5":{"ids":{5,6,7,8},"rois":{
            'answer_sheet_roi_1':(250,1430,750 ,3190),
            'answer_sheet_roi_2':(950,1430,1480,3190),
            'answer_sheet_roi_3':(1680,1430,2220,3190)}}
    }
    for sz,d in presets.items():
        if d["ids"].issubset(ids): rois=d["rois"]; return sz
    return None
def warp(img):
    global PAPER
    ad=aruco.getPredefinedDictionary(aruco.DICT_6X6_250)
    par=aruco.DetectorParameters_create()
    gray=cv2.cvtColor(img,cv2.COLOR_BGR2GRAY)
    corners,ids,_=aruco.detectMarkers(gray,ad,parameters=par)
    PAPER=detect_size_set_rois(ids)
    if PAPER not in ("A4","A5"): raise ValueError("Markers not found")
    dst=(2360,3388)
    t=[1,2,3,4] if PAPER=="A4" else [5,6,7,8]
    idx=[np.where(ids==i)[0][0] for i in t]
    dpts=np.float32([[0,0],[dst[0]-1,0],[0,dst[1]-1],[dst[0]-1,dst[1]-1]])
    spts=np.float32([corners[i][0][k] for i,k in zip(idx,[0,3,1,2])])
    M=cv2.getPerspectiveTransform(spts,dpts)
    return cv2.warpPerspective(img,M,dst)
def to_two_tone(img):
    g=cv2.cvtColor(img,cv2.COLOR_BGR2GRAY); _,th=cv2.threshold(g,140,255,cv2.THRESH_BINARY); return th
def hough(img,rad):
    b=cv2.GaussianBlur(img,(9,9),5)
    c=cv2.HoughCircles(b,cv2.HOUGH_GRADIENT,1.2,40,param1=50,param2=30,
                       minRadius=rad,maxRadius=rad+10)
    return None if c is None else np.uint16(np.around(c[0]))
def sort_read_order(cir,pref):
    global CID; cir=sorted(cir,key=lambda c:c[1])
    rows,tmp=[],[cir[0]]
    for a,b in zip(cir,cir[1:]):
        if abs(b[1]-a[1])>10: rows.append(tmp); tmp=[]
        tmp.append(b)
    rows.append(tmp); [r.sort(key=lambda c:c[0]) for r in rows]
    out={}
    for r in rows:
        for c in r: out[f"{pref}_{CID}"]=c; CID+=1
    return out
def filled(img,circ,thr):
    x,y,r=circ
    pts=[(x,y),(x-r//2,y),(x+r//2,y),(x,y-r//2),(x,y+r//2)]
    vals=[img[py,px] for px,py in pts if 0<=px<img.shape[1] and 0<=py<img.shape[0]]
    return sum(v<thr for v in vals)>=len(vals)//2
def qno_opt(cid): i=int(cid.split('_')[1]); return i//4+1,"ABCD"[i%4]

# ──────────────────────────────────────────────────────────────────────────────
#                            ARGUMENTS
# ──────────────────────────────────────────────────────────────────────────────
if len(sys.argv)!=3:
    sys.exit("Usage: scanner.py image.jpg \"[1,2,3,4,…]\"")
IMG_PATH      = sys.argv[1]
CORRECT_LIST  = json.loads(sys.argv[2])
NUM2LET       = {1:'A',2:'B',3:'C',4:'D'}
MAP_ANS       = [NUM2LET[n] for n in CORRECT_LIST]
TOTAL_Q       = len(MAP_ANS)

# ──────────────────────────────────────────────────────────────────────────────
#                         PIPELINE
# ──────────────────────────────────────────────────────────────────────────────
raw              = read_image(IMG_PATH)
QR_TEXT          = qr_text(raw)
warped           = warp(raw)
sheet_gray       = to_two_tone(warped)
sheet_color      = cv2.cvtColor(sheet_gray,cv2.COLOR_GRAY2BGR)

# circle detection
CID=0
DET={}
thr= 120 if PAPER=="A4" else 60
for k,roi in rois.items():
    x1,y1,x2,y2=roi
    crop=sheet_gray[y1:y2,x1:x2]
    minr=(33 if PAPER=="A4" else 42)//2
    cir=hough(crop,minr)
    if cir is not None: DET[k]=sort_read_order(cir,'q')

# DF & counts
df=pd.DataFrame({'Option':['N']*TOTAL_Q},index=range(1,TOTAL_Q+1))
fillcnt={}
for sec,ids in DET.items():
    xo,yo=rois[sec][0],rois[sec][1]
    for cid,(x,y,r) in ids.items():
        gx,gy=x+xo,y+yo
        if filled(sheet_gray,(gx,gy,r),thr):
            q,opt=qno_opt(cid)
            fillcnt[q]=fillcnt.get(q,0)+1
            df.at[q,'Option']='W' if fillcnt[q]>1 else opt

# ──────────────────────────────────────────────────────────────────────────────
#                         VISUAL LAYER
# ──────────────────────────────────────────────────────────────────────────────
# 1) alignment grid
for x in range(0,sheet_color.shape[1],250):
    cv2.line(sheet_color,(x,0),(x,sheet_color.shape[0]),COLORS["grid"],1)
for y in range(0,sheet_color.shape[0],180):
    cv2.line(sheet_color,(0,y),(sheet_color.shape[1],y),COLORS["grid"],1)

# 2) bubble annotations
for sec,ids in DET.items():
    xo,yo=rois[sec][0],rois[sec][1]
    for cid,(x,y,r) in ids.items():
        gx,gy=x+xo,y+yo
        q,opt=qno_opt(cid);  sz=sym_sizes(r)
        selected = filled(sheet_gray,(gx,gy,r),thr)
        multiple = fillcnt.get(q,0)>1
        correct  = MAP_ANS[q-1]==opt
        if q>TOTAL_Q: continue
        if selected and multiple:
            draw_square(sheet_color,(gx,gy),COLORS["multiple"],sz["square"])
            (draw_tick if correct else draw_cross)(sheet_color,(gx,gy),
                                                   COLORS["correct"] if correct else COLORS["wrong"],
                                                   sz["tick"])
        elif selected:
            (draw_tick if correct else draw_cross)(sheet_color,(gx,gy),
                                                   COLORS["correct"] if correct else COLORS["wrong"],
                                                   sz["tick"])
        elif correct:
            draw_ring(sheet_color,(gx,gy),COLORS["missed"],sz["ringR"])
        else:
            draw_dot(sheet_color,(gx,gy),COLORS["neutral"],sz["dotR"])

# 3) score/legend panel + stats bar chart
panel_w=480; panel_h=500
px=sheet_color.shape[1]-panel_w-30; py=30
cv2.rectangle(sheet_color,(px,py),(px+panel_w,py+panel_h),(255,255,255),-1)
cv2.rectangle(sheet_color,(px,py),(px+panel_w,py+panel_h),(0,0,0),2)

# legend icons
legend=[("tick","Correct","correct"),
        ("cross","Wrong","wrong"),
        ("square","Multiple","multiple"),
        ("ring","Missed","missed"),
        ("dot","Empty","neutral")]
icon_size=38
for i,(shape,text,cat) in enumerate(legend):
    cx,cy=px+40, py+70+i*55
    if shape=="tick":   draw_tick(sheet_color,(cx,cy),COLORS[cat],icon_size)
    elif shape=="cross":draw_cross(sheet_color,(cx,cy),COLORS[cat],icon_size)
    elif shape=="square":draw_square(sheet_color,(cx,cy),COLORS[cat],icon_size+20)
    elif shape=="ring": draw_ring(sheet_color,(cx,cy),COLORS[cat],icon_size//2+12)
    else:               draw_dot(sheet_color,(cx,cy),COLORS[cat],icon_size//3)
    cv2.putText(sheet_color,text,(cx+65,cy+10),FONT,1,(0,0,0),1,cv2.LINE_AA)

# stats chart data
right  = sum(df.at[q,'Option']==MAP_ANS[q-1] for q in range(1,TOTAL_Q+1))
wrong  = sum((df.at[q,'Option'] not in ('N','W') and df.at[q,'Option']!=MAP_ANS[q-1])
             for q in range(1,TOTAL_Q+1))
unans  = sum(df.at[q,'Option']=='N' for q in range(1,TOTAL_Q+1))
multi  = sum(df.at[q,'Option']=='W' for q in range(1,TOTAL_Q+1))

stats=[("R",right ,COLORS["correct"]),
       ("W",wrong ,COLORS["wrong"]),
       ("U",unans ,COLORS["neutral"]),
       ("M",multi ,COLORS["multiple"])]

# bar chart settings
chart_top = py+350
base_y    = py+panel_h-40
bar_w     = 60
gap       = 40
max_h     = 120
max_val   = max(max(right,wrong,unans,multi),1)
for idx,(lab,val,col) in enumerate(stats):
    bx = px+40+idx*(bar_w+gap)
    bar_h = int(val/max_val*max_h)
    cv2.rectangle(sheet_color,(bx,base_y-bar_h),(bx+bar_w,base_y),col,-1)
    cv2.rectangle(sheet_color,(bx,base_y-bar_h),(bx+bar_w,base_y),(0,0,0),2)
    cv2.putText(sheet_color,str(val),(bx+10,base_y-bar_h-10),
                FONT,1,(0,0,0),2,cv2.LINE_AA)
    cv2.putText(sheet_color,lab,(bx+18,base_y+25),
                FONT,1,(0,0,0),2,cv2.LINE_AA)

# big score in panel header
cv2.putText(sheet_color,f"Score: {right}/{TOTAL_Q}",
            (px+20,py+35),FONT,1.4,(0,0,0),3,cv2.LINE_AA)

# ──────────────────────────────────────────────────────────────────────────────
#                  SAVE  (full + thumbnail)  &  JSON OUT
# ──────────────────────────────────────────────────────────────────────────────
FULL = f"../public/upload/corrects/full_{QR_TEXT}.jpg"
THMB = f"../public/upload/corrects/{QR_TEXT}.jpg"
cv2.imwrite(FULL,sheet_color,[int(cv2.IMWRITE_JPEG_QUALITY),95])
thumb=cv2.resize(sheet_color,(1000,1436),interpolation=cv2.INTER_AREA)
cv2.imwrite(THMB,thumb)

def make_json():
    multi=[q for q in range(1,TOTAL_Q+1) if fillcnt.get(q,0)>1]
    unans=[q for q in range(1,TOTAL_Q+1) if fillcnt.get(q,0)==0]
    right=[q for q in range(1,TOTAL_Q+1)
           if df.at[q,'Option']==MAP_ANS[q-1] and fillcnt.get(q,0)==1]
    wrong=[q for q in range(1,TOTAL_Q+1)
           if df.at[q,'Option'] not in ('N','W') and
              df.at[q,'Option']!=MAP_ANS[q-1]]
    to_num={'A':1,'B':2,'C':3,'D':4}
    user=[to_num.get(df.at[q,'Option'],0) for q in range(1,TOTAL_Q+1)]
    return json.dumps({
        "qRCodeData"      : QR_TEXT,
        "rightAnswers"    : right,
        "wrongAnswers"    : wrong,
        "multipleAnswers" : multi,
        "unAnswered"      : unans,
        "Useranswers"     : user,
        "correctedImageUrl": THMB
    })

print(make_json())
