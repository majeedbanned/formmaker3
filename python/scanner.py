#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Answer-sheet scanner & corrector
Readable-symbols edition  (Unicode-free)
"""

import cv2, sys, json, random, numpy as np, pandas as pd
import cv2.aruco as aruco
from pyzbar.pyzbar import decode

# ──────────────────────────────────────────────────────────────────────────────
#                               VISUAL SETTINGS
# ──────────────────────────────────────────────────────────────────────────────
COLORS = {
    "correct"  : ( 40, 185,  40),   # ✓  ○ ring
    "wrong"    : ( 35,  35, 200),   # ✗
    "multiple" : (  0, 215, 255),   # ■ frame
    "missed"   : ( 40, 185,  40),   # ○
    "neutral"  : (140, 140, 140),   # ·
    "grid"     : (190, 190, 190)    # alignment grid
}
FONT        = cv2.FONT_HERSHEY_SIMPLEX
FONT_SMALL  = 1.0
FONT_THICK  = 2
FRAME_THICK = 5                    # for square, ring, legend boxes

# ──────────────────────────────────────────────────────────────────────────────
#                               DRAW HELPERS
# ──────────────────────────────────────────────────────────────────────────────
def draw_tick(img, c, color, size, thick):
    x,y = c
    cv2.line(img, (x-size//2, y), (x-size//6, y+size//2), color, thick, cv2.LINE_AA)
    cv2.line(img, (x-size//6, y+size//2), (x+size//2, y-size//2), color, thick, cv2.LINE_AA)

def draw_cross(img, c, color, size, thick):
    x,y = c
    cv2.line(img, (x-size, y-size), (x+size, y+size), color, thick, cv2.LINE_AA)
    cv2.line(img, (x-size, y+size), (x+size, y-size), color, thick, cv2.LINE_AA)

def draw_square(img, c, color, side, thick):
    x,y = c; s=side//2
    cv2.rectangle(img, (x-s,y-s), (x+s,y+s), color, thick)

def draw_ring(img, c, color, rad, thick):
    cv2.circle(img, c, rad, color, thick, cv2.LINE_AA)

def draw_dot(img, c, color, rad):
    cv2.circle(img, c, rad, color, -1, cv2.LINE_AA)

def symbol_sizes(r):
    """Return sizes that grow with bubble radius `r`."""
    return {
        "tick"   : max(30, int(r*2.0)),
        "cross"  : max(30, int(r*2.0)),
        "square" : max(40, int(r*2.5)),
        "ringR"  : max(22, int(r*1.6)),
        "dotR"   : max(8 , int(r*0.6))
    }

# ──────────────────────────────────────────────────────────────────────────────
#                           GENERIC HELPERS (UNCHANGED)
# ──────────────────────────────────────────────────────────────────────────────
def read_local_image(path):
    img = cv2.imread(path, cv2.IMREAD_COLOR)
    if img is None:
        raise FileNotFoundError(f"Cannot read image: {path}")
    return img

def detect_qr_code(image):
    for obj in decode(image):
        if obj.type == "QRCODE":
            return obj.data.decode("utf-8")
    return None

def detect_paper_size_and_set_rois(ids):
    global rois
    if ids is None: return None
    ids_set = set(ids.flatten())
    papers = {
        'A4': {
            'ids': {1,2,3,4},
            'rois': {
                'answer_sheet_roi_1': (200, 1180,  600, 3180),
                'answer_sheet_roi_2': (740, 1180, 1140, 3180),
                'answer_sheet_roi_3': (1313,1180,1713, 3180),
                'answer_sheet_roi_4': (1860,1180,2260, 3180)
            }
        },
        'A5': {
            'ids': {5,6,7,8},
            'rois': {
                'answer_sheet_roi_1': (250, 1430,  750, 3190),
                'answer_sheet_roi_2': (950, 1430, 1480, 3190),
                'answer_sheet_roi_3': (1680,1430,2220, 3190)
            }
        }
    }
    for sz,spec in papers.items():
        if spec['ids'].issubset(ids_set):
            rois = spec['rois'];  return sz
    return None

def warp_image(img):
    global paper_size
    aruco_dict = aruco.getPredefinedDictionary(aruco.DICT_6X6_250)
    params = aruco.DetectorParameters_create()
    gray   = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    corners, ids, _ = aruco.detectMarkers(gray, aruco_dict, parameters=params)
    paper_size = detect_paper_size_and_set_rois(ids)
    if paper_size not in ('A4','A5'):
        raise ValueError("ArUco markers / paper size not recognised")

    dst = (2360, 3388)
    t   = [1,2,3,4] if paper_size=='A4' else [5,6,7,8]
    idx = [np.where(ids==i)[0][0] for i in t]
    dst_pts = np.float32([[0,0],[dst[0]-1,0],[0,dst[1]-1],[dst[0]-1,dst[1]-1]])
    src_pts = np.float32([corners[i][0][k] for i,k in zip(idx,[0,3,1,2])])
    M = cv2.getPerspectiveTransform(src_pts, dst_pts)
    return cv2.warpPerspective(img, M, dst)

def convert_to_two_tone(img):
    g=cv2.cvtColor(img,cv2.COLOR_BGR2GRAY)
    _,th=cv2.threshold(g,140,255,cv2.THRESH_BINARY); return th

def detect_circles(img, min_r):
    bl=cv2.GaussianBlur(img,(9,9),5)
    cir=cv2.HoughCircles(bl,cv2.HOUGH_GRADIENT,1.2,40,
                         param1=50,param2=30,
                         minRadius=min_r,maxRadius=min_r+10)
    return None if cir is None else np.uint16(np.around(cir[0]))

def sort_circles(circles,prefix):
    global gid; circles=sorted(circles,key=lambda c:c[1])
    rows,tmp=[],[circles[0]]
    for a,b in zip(circles,circles[1:]):
        if abs(b[1]-a[1])>10: rows.append(tmp); tmp=[]
        tmp.append(b)
    rows.append(tmp)
    for r in rows: r.sort(key=lambda c:c[0])
    out={}
    for r in rows:
        for c in r:
            out[f"{prefix}_{gid}"]=c; gid+=1
    return out

def is_filled(img,circle,thr):
    x,y,r=circle
    pts=[(x,y),(x-r//2,y),(x+r//2,y),(x,y-r//2),(x,y+r//2)]
    vals=[img[py,px] for px,py in pts if 0<=px<img.shape[1] and 0<=py<img.shape[0]]
    return sum(v<thr for v in vals)>=len(vals)//2

def q_no_opt(cid):
    idx=int(cid.split('_')[1]); return idx//4+1,"ABCD"[idx%4]

# ──────────────────────────────────────────────────────────────────────────────
#                           ARGUMENT PARSE
# ──────────────────────────────────────────────────────────────────────────────
if len(sys.argv)!=3:
    sys.exit("Usage: scanner.py image.jpg \"[1,2,3,4,…]\"")

img_path       = sys.argv[1]
correct_nums   = json.loads(sys.argv[2])
num_to_let     = {1:'A',2:'B',3:'C',4:'D'}
mapped_answers = [num_to_let[n] for n in correct_nums]
total_q        = len(mapped_answers)

# ──────────────────────────────────────────────────────────────────────────────
#                            PIPELINE
# ──────────────────────────────────────────────────────────────────────────────
raw           = read_local_image(img_path)
qr_data       = detect_qr_code(raw)
warped        = warp_image(raw)
sheet_gray    = convert_to_two_tone(warped)
sheet_color   = cv2.cvtColor(sheet_gray,cv2.COLOR_GRAY2BGR)

# ---- circle detection
gid=0
detected={}
thr = 120 if paper_size=='A4' else 60
for key,roi in rois.items():
    x1,y1,x2,y2=roi
    crop=sheet_gray[y1:y2,x1:x2]
    rmin=(33 if paper_size=='A4' else 42)//2
    cir=detect_circles(crop,rmin)
    if cir is not None: detected[key]=sort_circles(cir,'q')

# ---- DF & counts
df=pd.DataFrame({'Option':['N']*total_q},index=range(1,total_q+1))
filled_cnt={}

for sec,ids in detected.items():
    xo,yo=rois[sec][0],rois[sec][1]
    for cid,(x,y,r) in ids.items():
        gx,gy=x+xo,y+yo
        fill=is_filled(sheet_gray,(gx,gy,r),thr)
        q,opt=q_no_opt(cid)
        if fill:
            filled_cnt[q]=filled_cnt.get(q,0)+1
            if filled_cnt[q]==1: df.at[q,'Option']=opt
            else: df.at[q,'Option']='W'

# ──────────────────────────────────────────────────────────────────────────────
#                       VISUAL ANNOTATION
# ──────────────────────────────────────────────────────────────────────────────
# 1) Alignment grid (keep thin)
for x in range(0,sheet_color.shape[1],250):
    cv2.line(sheet_color,(x,0),(x,sheet_color.shape[0]),COLORS["grid"],1)
for y in range(0,sheet_color.shape[0],180):
    cv2.line(sheet_color,(0,y),(sheet_color.shape[1],y),COLORS["grid"],1)

# 2) Bubbles
for sec,ids in detected.items():
    xo,yo=rois[sec][0],rois[sec][1]
    for cid,(x,y,r) in ids.items():
        gx,gy=x+xo,y+yo
        q,opt=q_no_opt(cid)
        if q>total_q: continue
        sel=is_filled(sheet_gray,(gx,gy,r),thr)
        multi=filled_cnt.get(q,0)>1
        correct=mapped_answers[q-1]==opt
        sz=symbol_sizes(r)

        if sel and multi:
            draw_square(sheet_color,(gx,gy),COLORS["multiple"],sz["square"],FRAME_THICK)
            (draw_tick if correct else draw_cross)(sheet_color,(gx,gy),
                                                   COLORS["correct"] if correct else COLORS["wrong"],
                                                   sz["tick"],FRAME_THICK)
        elif sel:
            (draw_tick if correct else draw_cross)(sheet_color,(gx,gy),
                                                   COLORS["correct"] if correct else COLORS["wrong"],
                                                   sz["tick"],FRAME_THICK)
        elif correct:
            draw_ring(sheet_color,(gx,gy),COLORS["missed"],sz["ringR"],FRAME_THICK)
        else:
            draw_dot(sheet_color,(gx,gy),COLORS["neutral"],sz["dotR"])

# 3) Legend / score (symbols sized for legend, not bubbles)
panel_h,panel_w=300,460
px,py=sheet_color.shape[1]-panel_w-30,30
cv2.rectangle(sheet_color,(px,py),(px+panel_w,py+panel_h),(255,255,255),-1)
cv2.rectangle(sheet_color,(px,py),(px+panel_w,py+panel_h),(0,0,0),2)

legend=[("tick","Chosen & correct","correct"),
        ("cross","Chosen & wrong","wrong"),
        ("square","Multiple chosen","multiple"),
        ("ring","Correct missed","missed"),
        ("dot","Empty option","neutral")]

lg_sz=32
for i,(shape,text,cat) in enumerate(legend):
    cx,cy=px+35, py+65+i*48
    if shape=="tick":   draw_tick  (sheet_color,(cx,cy),COLORS[cat],lg_sz,FRAME_THICK)
    elif shape=="cross":draw_cross (sheet_color,(cx,cy),COLORS[cat],lg_sz,FRAME_THICK)
    elif shape=="square":draw_square(sheet_color,(cx,cy),COLORS[cat],lg_sz+18,FRAME_THICK)
    elif shape=="ring": draw_ring (sheet_color,(cx,cy),COLORS[cat],lg_sz//2+10,FRAME_THICK)
    else:               draw_dot  (sheet_color,(cx,cy),COLORS[cat],lg_sz//3)
    cv2.putText(sheet_color,text,(cx+55,cy+8),
                FONT,FONT_SMALL,(0,0,0),1,cv2.LINE_AA)

score=sum(df.at[q,'Option']==mapped_answers[q-1] for q in range(1,total_q+1))
cv2.putText(sheet_color,f"{score}/{total_q} correct",
            (px+20,py+panel_h-30),FONT,1.2,(0,0,0),2,cv2.LINE_AA)

# ──────────────────────────────────────────────────────────────────────────────
#                        SAVE + JSON OUT
# ──────────────────────────────────────────────────────────────────────────────
full_path = f"../public/upload/corrects/full_{qr_data}.jpg"
thumb_path= f"../public/upload/corrects/{qr_data}.jpg"
cv2.imwrite(full_path , sheet_color,[int(cv2.IMWRITE_JPEG_QUALITY),95])
thumb=cv2.resize(sheet_color,(1000,1436),interpolation=cv2.INTER_AREA)
cv2.imwrite(thumb_path,thumb)

def make_json():
    right,wrong,multi,unans,user=[],[],[],[],[]
    to_num={'A':1,'B':2,'C':3,'D':4}
    for q in range(1,total_q+1):
        opt=df.at[q,'Option']; user.append(to_num.get(opt,0))
        if filled_cnt.get(q,0)>1: multi.append(q)
        elif filled_cnt.get(q,0)==0: unans.append(q)
        elif opt==mapped_answers[q-1]: right.append(q)
        else: wrong.append(q)
    return json.dumps({
        "qRCodeData"    : qr_data,
        "rightAnswers"  : right,
        "wrongAnswers"  : wrong,
        "multipleAnswers": multi,
        "unAnswered"    : unans,
        "Useranswers"   : user,
        "correctedImageUrl": thumb_path
    })

print(make_json())
