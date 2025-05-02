#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Answer-sheet scanner & corrector
--------------------------------
• Detects ArUco markers → warps to canonical size
• Finds, classifies & marks bubbles
• Saves full-resolution and thumbnail JPEGs
• Emits JSON summary on stdout

UI layer (NEW):
• Coherent colour palette, tick/cross glyphs
• Hair-line grid for alignment check
• Legend + quick score panel
"""

import cv2, sys, json, random, numpy as np, pandas as pd
import cv2.aruco as aruco
from operator      import itemgetter
from PIL           import Image
from pyzbar.pyzbar import decode

# --------------------------------------------------------------------------- #
#                           ─── configurable look ───                         #
# --------------------------------------------------------------------------- #
COLORS = {
    "correct"  : ( 40, 180,  40),   # green
    "wrong"    : ( 35,  35, 200),   # red-blue
    "multiple" : (  0, 215, 255),   # orange-yellow
    "empty"    : (  0, 255, 255),   # yellow
    "grid"     : (180, 180, 180)    # light grey
}
THICK        = 4
FONT         = cv2.FONT_HERSHEY_SIMPLEX
FONT_SCALE   = 0.9
FONT_THICK   = 2
TICK, CROSS  = u"\u2713", u"\u2717"  # ✓  ✗

# --------------------------------------------------------------------------- #
#                               helper functions                              #
# --------------------------------------------------------------------------- #
def read_local_image(path: str) -> np.ndarray:
    img = cv2.imread(path, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError(f"Cannot read image: {path}")
    return img

def detect_qr_code(image: np.ndarray):
    for obj in decode(image):
        if obj.type == "QRCODE":
            return obj.data.decode("utf-8")
    return None

def detect_paper_size_and_set_rois(ids):
    """Identify sheet type by marker IDs + inject global `rois`."""
    global rois
    if ids is None: return None
    ids_set = set(ids.flatten())

    paper_specs = {
        'A4': {
            'ids' : {1, 2, 3, 4},
            'rois': {
                'answer_sheet_roi_1': (200, 1180,  600, 3180),
                'answer_sheet_roi_2': (740, 1180, 1140, 3180),
                'answer_sheet_roi_3': (1313,1180,1713, 3180),
                'answer_sheet_roi_4': (1860,1180,2260, 3180)
            }
        },
        'A5': {
            'ids' : {5, 6, 7, 8},
            'rois': {
                'answer_sheet_roi_1': (250, 1430,  750, 3190),
                'answer_sheet_roi_2': (950, 1430, 1480, 3190),
                'answer_sheet_roi_3': (1680,1430,2220, 3190)
            }
        }
    }
    for size, spec in paper_specs.items():
        if spec['ids'].issubset(ids_set):
            rois = spec['rois']
            return size
    return None

def warp_image(img: np.ndarray):
    """Perspective-correct the sheet using the corner markers."""
    global paper_size
    aruco_dict  = aruco.getPredefinedDictionary(aruco.DICT_6X6_250)
    params      = aruco.DetectorParameters_create()
    gray        = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    corners, ids, _ = aruco.detectMarkers(gray, aruco_dict, parameters=params)

    paper_size  = detect_paper_size_and_set_rois(ids)
    if paper_size not in ('A4', 'A5'):
        raise ValueError("ArUco markers / paper size not recognised")

    dst_size    = (2360, 3388)
    targets     = [1,2,3,4] if paper_size=='A4' else [5,6,7,8]
    idx_map     = [np.where(ids == t)[0][0] for t in targets]

    dst_pts = np.array([[0,0],
                        [dst_size[0]-1,0],
                        [0,dst_size[1]-1],
                        [dst_size[0]-1,dst_size[1]-1]], dtype='float32')
    src_pts = np.array([corners[i][0][k] for i,k in zip(idx_map,[0,3,1,2])],
                       dtype='float32')

    M   = cv2.getPerspectiveTransform(src_pts, dst_pts)
    out = cv2.warpPerspective(img, M, dst_size)
    return out

def convert_to_two_tone(img: np.ndarray):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    _, th = cv2.threshold(gray, 140, 255, cv2.THRESH_BINARY)
    return th

def detect_circles(img: np.ndarray, min_radius):
    blur = cv2.GaussianBlur(img, (9,9), 5)
    circles = cv2.HoughCircles(blur, cv2.HOUGH_GRADIENT, dp=1.2, minDist=40,
                               param1=50, param2=30,
                               minRadius=min_radius,
                               maxRadius=min_radius+10)
    return None if circles is None else np.uint16(np.around(circles[0,:]))

def sort_circles_into_rows_and_columns(circles, prefix):
    """Stable id assignment q_0 … based on reading order (top→bottom, left→right)."""
    global global_id_counter
    circles = sorted(circles, key=lambda c: c[1])  # by y
    rows, tmp = [], [circles[0]]
    for a,b in zip(circles, circles[1:]):
        if abs(b[1]-a[1]) > 10:
            rows.append(tmp); tmp = []
        tmp.append(b)
    rows.append(tmp)
    for row in rows: row.sort(key=lambda c: c[0])

    out = {}
    for row in rows:
        for c in row:
            cid = f"{prefix}_{global_id_counter}"
            out[cid] = c
            global_id_counter += 1
    return out

def is_filled_circle(img, circle, thresh):
    x,y,r = circle
    pts = [(x,y), (x-r//2,y), (x+r//2,y), (x,y-r//2), (x,y+r//2)]
    vals = [img[py,px] for px,py in pts if 0<=px<img.shape[1] and 0<=py<img.shape[0]]
    return sum(v < thresh for v in vals) >= len(vals)//2

def get_question_number_and_option(cid):
    idx = int(cid.split('_')[1])
    return idx//4 + 1, "ABCD"[idx%4]

def generate_json_output(qr_code_data):
    """(Original function - unchanged)"""
    right_answers, wrong_answers   = [], []
    multiple_answers, un_answered  = [], []
    user_answers                   = []

    total_questions                = len(correct_answers)
    answer_map                     = { 'A':1,'B':2,'C':3,'D':4 }

    for q in range(1, total_questions+1):
        letter  = df.at[q,'Option']
        user_answers.append(answer_map.get(letter,0))

        filled  = filled_circles_count.get(q,0)
        if filled>1:
            multiple_answers.append(q)
        elif filled==0:
            un_answered.append(q)
        else:
            if letter == mapped_answers[q-1]:
                right_answers.append(q)
            else:
                wrong_answers.append(q)

    return json.dumps({
        "qRCodeData"   : qr_code_data,
        "rightAnswers" : right_answers,
        "wrongAnswers" : wrong_answers,
        "multipleAnswers": multiple_answers,
        "unAnswered"   : un_answered,
        "Useranswers"  : user_answers,
        "correctedImageUrl": thumb_path
    })

# --------------------------------------------------------------------------- #
#                               main pipeline                                 #
# --------------------------------------------------------------------------- #
if len(sys.argv) != 3:
    sys.exit("Usage: scanner.py IMAGE_PATH '[1,2,3,4,…]'")

image_path          = sys.argv[1]
correct_answers     = json.loads(sys.argv[2])
answer_mapping_rev  = {1:'A',2:'B',3:'C',4:'D'}
mapped_answers      = [answer_mapping_rev[i] for i in correct_answers]

# 1) Load + warp
raw_img             = read_local_image(image_path)
qr_code_data        = detect_qr_code(raw_img)
warped              = warp_image(raw_img)
two_tone            = convert_to_two_tone(warped)
final_gray          = two_tone
final_color         = cv2.cvtColor(final_gray, cv2.COLOR_GRAY2BGR)

# 2) Detect circles within ROIs
global_id_counter   = 0
student_code_ids    = {}
detected_circles    = {}
paper_threshold     = 120 if 'A4' in locals() and paper_size=='A4' else 60

for key, roi in rois.items():
    x1,y1,x2,y2 = roi
    crop        = final_gray[y1:y2, x1:x2]
    min_r       = (33 if paper_size=='A4' else 42)//2
    circles     = detect_circles(crop, min_r)
    if circles is None: continue
    detected_circles[key] = sort_circles_into_rows_and_columns(circles, 'q')

# 3) Prepare DF & counters
total_q   = len(correct_answers)
df        = pd.DataFrame({'Option':['N']*total_q}, index=range(1,total_q+1))
filled_circles_count = {}

# 4) Analyse each bubble & update DF
for section, ids in detected_circles.items():
    xo, yo = rois[section][0], rois[section][1]
    for cid,(x,y,r) in ids.items():
        gx, gy     = x+xo, y+yo
        filled     = is_filled_circle(final_gray,(gx,gy,r), paper_threshold)
        q_no, opt  = get_question_number_and_option(cid)

        if filled:
            filled_circles_count[q_no] = filled_circles_count.get(q_no,0)+1
            if filled_circles_count[q_no] == 1:
                df.at[q_no,'Option'] = opt
            else:  # multiple
                df.at[q_no,'Option'] = 'W'

# 5) --------------  UI LAYER (NEW) -------------- #
# 5-A  thin alignment grid
step_x, step_y = 250, 180
for x in range(0, final_color.shape[1], step_x):
    cv2.line(final_color,(x,0),(x,final_color.shape[0]),COLORS["grid"],1)
for y in range(0, final_color.shape[0], step_y):
    cv2.line(final_color,(0,y),(final_color.shape[1],y),COLORS["grid"],1)

# 5-B one-pass annotation
for section, ids in detected_circles.items():
    xo, yo = rois[section][0], rois[section][1]
    for cid,(x,y,r) in ids.items():
        gx, gy = x+xo, y+yo
        q_no, opt = get_question_number_and_option(cid)
        if q_no > total_q: continue

        filled   = is_filled_circle(final_gray,(gx,gy,r), paper_threshold)
        multiple = filled and filled_circles_count[q_no]>1
        empty    = not filled
        corr_ans = mapped_answers[q_no-1]

        if multiple:            # >1 filled
            cv2.rectangle(final_color,(gx-25,gy-25),(gx+25,gy+25),
                           COLORS["multiple"], THICK)
        elif empty:             # unanswered
            cv2.circle(final_color,(gx,gy),12,COLORS["empty"],-1)
        elif opt == corr_ans:   # correct
            cv2.putText(final_color,TICK,(gx-15,gy+15),
                        FONT,1.2,COLORS["correct"],FONT_THICK,cv2.LINE_AA)
        else:                   # wrong
            cv2.putText(final_color,CROSS,(gx-15,gy+15),
                        FONT,1.2,COLORS["wrong"],FONT_THICK,cv2.LINE_AA)

# 5-C legend + quick score
panel_h, panel_w = 230, 420
px, py           = final_color.shape[1]-panel_w-30, 30
cv2.rectangle(final_color,(px,py),(px+panel_w,py+panel_h),(255,255,255),-1)
cv2.rectangle(final_color,(px,py),(px+panel_w,py+panel_h),(0,0,0),2)

legend = [(TICK,"Correct","correct"),(CROSS,"Wrong","wrong"),
          ("■","Multiple","multiple"),("●","Unanswered","empty")]
for i,(sym,text,cat) in enumerate(legend):
    cx, cy = px+20, py+50+i*45
    cv2.putText(final_color,sym,(cx,cy),FONT,1.2,COLORS[cat],FONT_THICK,cv2.LINE_AA)
    cv2.putText(final_color,text,(cx+55,cy),FONT,FONT_SCALE,(0,0,0),1,cv2.LINE_AA)

score = sum(df.at[q,'Option']==mapped_answers[q-1] for q in range(1,total_q+1))
cv2.putText(final_color,f"{score}/{total_q} correct",
            (px+20, py+panel_h-20), FONT, 0.9, (0,0,0), 2, cv2.LINE_AA)

# 6) --------------  SAVE FILES & JSON -------------- #
random.seed()
full_path   = f"../public/upload/corrects/full_{qr_code_data}.jpg"
thumb_path  = f"../public/upload/corrects/{qr_code_data}.jpg"
cv2.imwrite(full_path, final_color,
            [int(cv2.IMWRITE_JPEG_QUALITY), 95])
thumb = cv2.resize(final_color, (1000, 1436), interpolation=cv2.INTER_AREA)
cv2.imwrite(thumb_path, thumb)

# 7) --------------  OUTPUT JSON -------------- #
print(generate_json_output(qr_code_data))
