#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Answer-sheet scanner & corrector  – “all-states” visual edition
"""

import cv2, sys, json, random, numpy as np, pandas as pd
import cv2.aruco as aruco
from operator      import itemgetter
from pyzbar.pyzbar import decode

# ──────────────────────────────────────────────────────────────────────────────
#                                UI SETTINGS
# ──────────────────────────────────────────────────────────────────────────────
COLORS = {
    "correct"  : ( 40, 185,  40),   # ✓ chosen & right
    "wrong"    : ( 35,  35, 200),   # ✗ chosen & wrong
    "multiple" : (  0, 215, 255),   # orange frame
    "missed"   : ( 40, 185,  40),   # ○ correct but not chosen
    "neutral"  : (170, 170, 170),   # · not chosen, not correct
    "grid"     : (190, 190, 190)    # alignment grid
}
THICK        = 4
FONT         = cv2.FONT_HERSHEY_SIMPLEX
FONT_THICK   = 2
TICK, CROSS  = u"\u2713", u"\u2717"                       # ✓ ✗

# ──────────────────────────────────────────────────────────────────────────────
#                            HELPER FUNCTIONS (unchanged
#                         except warping / ROI detection)
# ──────────────────────────────────────────────────────────────────────────────
def read_local_image(path):
    img = cv2.imread(path, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError(f"Cannot read image: {path}")
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
    paper_specs = {
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
    for size, spec in paper_specs.items():
        if spec['ids'].issubset(ids_set):
            rois = spec['rois'];  return size
    return None

def warp_image(img):
    global paper_size
    aruco_dict = aruco.getPredefinedDictionary(aruco.DICT_6X6_250)
    params     = aruco.DetectorParameters_create()
    gray       = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    corners, ids, _ = aruco.detectMarkers(gray, aruco_dict, parameters=params)
    paper_size = detect_paper_size_and_set_rois(ids)
    if paper_size not in ('A4','A5'):
        raise ValueError("ArUco markers / paper size not recognised")

    dst = (2360, 3388)
    targets  = [1,2,3,4] if paper_size=='A4' else [5,6,7,8]
    idx      = [np.where(ids==t)[0][0] for t in targets]

    dst_pts  = np.float32([[0,0],[dst[0]-1,0],[0,dst[1]-1],[dst[0]-1,dst[1]-1]])
    src_pts  = np.float32([corners[i][0][k] for i,k in zip(idx,[0,3,1,2])])
    M        = cv2.getPerspectiveTransform(src_pts, dst_pts)
    return cv2.warpPerspective(img, M, dst)

def convert_to_two_tone(img):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    _, th = cv2.threshold(gray, 140, 255, cv2.THRESH_BINARY)
    return th

def detect_circles(img, min_r):
    blur    = cv2.GaussianBlur(img,(9,9),5)
    circles = cv2.HoughCircles(blur, cv2.HOUGH_GRADIENT,1.2,40,
                               param1=50,param2=30,
                               minRadius=min_r,maxRadius=min_r+10)
    return None if circles is None else np.uint16(np.around(circles[0]))

def sort_circles_into_rows_and_columns(circles, prefix):
    global global_id_counter
    circles  = sorted(circles, key=lambda c:c[1])
    rows, tmp= [], [circles[0]]
    for a,b in zip(circles,circles[1:]):
        if abs(b[1]-a[1])>10: rows.append(tmp); tmp=[]
        tmp.append(b)
    rows.append(tmp)
    for r in rows: r.sort(key=lambda c:c[0])
    out={}
    for r in rows:
        for c in r:
            out[f"{prefix}_{global_id_counter}"]=c
            global_id_counter+=1
    return out

def is_filled_circle(img,circle,th):
    x,y,r = circle
    pts = [(x,y),(x-r//2,y),(x+r//2,y),(x,y-r//2),(x,y+r//2)]
    vals= [img[py,px] for px,py in pts if 0<=px<img.shape[1] and 0<=py<img.shape[0]]
    return sum(v<th for v in vals)>=len(vals)//2

def get_q_no_opt(cid):
    idx=int(cid.split('_')[1]);   return idx//4+1, "ABCD"[idx%4]

# ──────────────────────────────────────────────────────────────────────────────
#                       STDIN / ARG-PARSE & PREP
# ──────────────────────────────────────────────────────────────────────────────
if len(sys.argv)!=3:
    sys.exit("Usage:  scanner.py IMAGE_PATH  \"[1,2,4,3,…]\"")

image_path      = sys.argv[1]
correct_answers = json.loads(sys.argv[2])
rev_map         = {1:'A',2:'B',3:'C',4:'D'}
mapped_answers  = [rev_map[i] for i in correct_answers]
total_q         = len(correct_answers)

# ──────────────────────────────────────────────────────────────────────────────
#                           PIPELINE
# ──────────────────────────────────────────────────────────────────────────────
raw          = read_local_image(image_path)
qr_data      = detect_qr_code(raw)
warped       = warp_image(raw)
sheet_gray   = convert_to_two_tone(warped)
sheet_color  = cv2.cvtColor(sheet_gray, cv2.COLOR_GRAY2BGR)

# ── circle detection
global_id_counter=0
detected={}
paper_thresh = 120 if paper_size=='A4' else 60
for key,roi in rois.items():
    x1,y1,x2,y2 = roi
    crop=sheet_gray[y1:y2, x1:x2]
    min_r=(33 if paper_size=='A4' else 42)//2
    cir=detect_circles(crop,min_r)
    if cir is not None:
        detected[key]=sort_circles_into_rows_and_columns(cir,'q')

# ── DataFrame & counts
df  = pd.DataFrame({'Option':['N']*total_q},index=range(1,total_q+1))
filled_cnt={}

for sec,ids in detected.items():
    xo,yo = rois[sec][0], rois[sec][1]
    for cid,(x,y,r) in ids.items():
        gx,gy = x+xo, y+yo
        filled=is_filled_circle(sheet_gray,(gx,gy,r),paper_thresh)
        q,opt = get_q_no_opt(cid)
        if filled:
            filled_cnt[q]=filled_cnt.get(q,0)+1
            if filled_cnt[q]==1: df.at[q,'Option']=opt
            else:                df.at[q,'Option']='W'

# ──────────────────────────────────────────────────────────────────────────────
#                       VISUAL ANNOTATION  (all states)
# ──────────────────────────────────────────────────────────────────────────────
# 1) Alignment grid
sx,sy=250,180
for x in range(0,sheet_color.shape[1],sx):
    cv2.line(sheet_color,(x,0),(x,sheet_color.shape[0]),COLORS["grid"],1)
for y in range(0,sheet_color.shape[0],sy):
    cv2.line(sheet_color,(0,y),(sheet_color.shape[1],y),COLORS["grid"],1)

# 2) Bubble-by-bubble rendering
for sec,ids in detected.items():
    xo,yo = rois[sec][0], rois[sec][1]
    for cid,(x,y,r) in ids.items():
        gx,gy = x+xo, y+yo
        q,opt = get_q_no_opt(cid)
        if q>total_q: continue

        selected     = is_filled_circle(sheet_gray,(gx,gy,r),paper_thresh)
        multiple_sel = filled_cnt.get(q,0)>1
        correct_opt  = mapped_answers[q-1]==opt

        if selected and multiple_sel:
            cv2.rectangle(sheet_color,(gx-25,gy-25),(gx+25,gy+25),COLORS["multiple"],THICK)
            symbol = TICK if correct_opt else CROSS
            cv2.putText(sheet_color,symbol,(gx-15,gy+15),FONT,1.2,
                        COLORS["correct"] if correct_opt else COLORS["wrong"],
                        FONT_THICK,cv2.LINE_AA)

        elif selected:
            symbol, col = (TICK,COLORS["correct"]) if correct_opt else (CROSS,COLORS["wrong"])
            cv2.putText(sheet_color,symbol,(gx-15,gy+15),FONT,1.2,col,FONT_THICK,cv2.LINE_AA)

        elif correct_opt:  # missed correct answer
            cv2.circle(sheet_color,(gx,gy),18,COLORS["missed"],THICK)
        else:              # neutral
            cv2.circle(sheet_color,(gx,gy),4,COLORS["neutral"],-1)

# 3) Legend + score
panel_h,panel_w = 270,450
px,py = sheet_color.shape[1]-panel_w-30,30
cv2.rectangle(sheet_color,(px,py),(px+panel_w,py+panel_h),(255,255,255),-1)
cv2.rectangle(sheet_color,(px,py),(px+panel_w,py+panel_h),(0,0,0),2)
legend=[(TICK,"Chosen & correct","correct"),
        (CROSS,"Chosen & wrong","wrong"),
        ("■","Multiple chosen","multiple"),
        ("○","Correct missed","missed"),
        ("·","Empty option","neutral")]
for i,(sym,text,cat) in enumerate(legend):
    cx,cy=px+20, py+55+i*42
    if sym=="■":
        cv2.rectangle(sheet_color,(cx-6,cy-22),(cx+18,cy+2),COLORS[cat],-1,cv2.LINE_AA)
    else:
        cv2.putText(sheet_color,sym,(cx,cy),FONT,1.2,COLORS[cat],FONT_THICK,cv2.LINE_AA)
    cv2.putText(sheet_color,text,(cx+55,cy),FONT,0.9,(0,0,0),1,cv2.LINE_AA)

score=sum(df.at[q,'Option']==mapped_answers[q-1] for q in range(1,total_q+1))
cv2.putText(sheet_color,f"{score}/{total_q} correct",
            (px+20, py+panel_h-25), FONT, 1, (0,0,0), 2, cv2.LINE_AA)

# ──────────────────────────────────────────────────────────────────────────────
#                         SAVE & JSON OUTPUT
# ──────────────────────────────────────────────────────────────────────────────
full_path  = f"../public/upload/corrects/full_{qr_data}.jpg"
thumb_path = f"../public/upload/corrects/{qr_data}.jpg"
cv2.imwrite(full_path , sheet_color, [int(cv2.IMWRITE_JPEG_QUALITY),95])
thumb=cv2.resize(sheet_color,(1000,1436),interpolation=cv2.INTER_AREA)
cv2.imwrite(thumb_path, thumb)

def generate_json_output():
    right,wrong,multi,unans,user=[],[],[],[],[]
    map_num={'A':1,'B':2,'C':3,'D':4}
    for q in range(1,total_q+1):
        opt=df.at[q,'Option']; user.append(map_num.get(opt,0))
        if filled_cnt.get(q,0)>1:           multi.append(q)
        elif filled_cnt.get(q,0)==0:        unans.append(q)
        elif opt==mapped_answers[q-1]:      right.append(q)
        else:                               wrong.append(q)
    return json.dumps({
        "qRCodeData":qr_data,"rightAnswers":right,"wrongAnswers":wrong,
        "multipleAnswers":multi,"unAnswered":unans,
        "Useranswers":user,"correctedImageUrl":thumb_path})

print(generate_json_output())
