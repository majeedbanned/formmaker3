#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Answer-sheet scanner & corrector
Unicode-free graphical edition
--------------------------------
• Detects ArUco markers → perspective warp
• Reads QR, bubbles, multiple answers
• Draws clear tick / cross / ring / square / dot symbols using
  plain OpenCV primitives (no missing glyphs)
• Saves full-res + thumbnail JPEGs
• Prints JSON summary to stdout
"""

import cv2, sys, json, random, numpy as np, pandas as pd
import cv2.aruco as aruco
from pyzbar.pyzbar import decode

# ──────────────────────────────────────────────────────────────────────────────
#                               VISUAL SETTINGS
# ──────────────────────────────────────────────────────────────────────────────
COLORS = {
    "correct"  : ( 40, 185,  40),   # tick, ring
    "wrong"    : ( 35,  35, 200),   # cross
    "multiple" : (  0, 215, 255),   # square frame
    "missed"   : ( 40, 185,  40),   # ring around missed correct
    "neutral"  : (160, 160, 160),   # tiny dot
    "grid"     : (190, 190, 190)    # alignment grid
}
FONT       = cv2.FONT_HERSHEY_SIMPLEX
FONT_SMALL = 0.9
FONT_THICK = 2
FRAME_THK  = 4

# ──────────────────────────────────────────────────────────────────────────────
#                               DRAW HELPERS
# ──────────────────────────────────────────────────────────────────────────────
def draw_tick(img, center, color, size=20, thick=3):
    x, y = center
    cv2.line(img, (x - size // 2, y),     (x - size // 6, y + size // 2), color, thick, cv2.LINE_AA)
    cv2.line(img, (x - size // 6, y + size // 2), (x + size // 2, y - size // 2), color, thick, cv2.LINE_AA)

def draw_cross(img, center, color, size=20, thick=3):
    x, y = center
    cv2.line(img, (x - size, y - size), (x + size, y + size), color, thick, cv2.LINE_AA)
    cv2.line(img, (x - size, y + size), (x + size, y - size), color, thick, cv2.LINE_AA)

def draw_square(img, center, color, side=28, thick=3):
    x, y = center
    s = side // 2
    cv2.rectangle(img, (x - s, y - s), (x + s, y + s), color, thick)

def draw_ring(img, center, color, radius=18, thick=3):
    cv2.circle(img, center, radius, color, thick, cv2.LINE_AA)

def draw_dot(img, center, color, radius=4):
    cv2.circle(img, center, radius, color, -1, cv2.LINE_AA)

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
    """Identify the sheet (A4/A5) by marker IDs and set global `rois`."""
    global rois
    if ids is None: return None
    ids_set = set(ids.flatten())
    paper_specs = {
        'A4': {
            'ids': {1, 2, 3, 4},
            'rois': {
                'answer_sheet_roi_1': (200, 1180,  600, 3180),
                'answer_sheet_roi_2': (740, 1180, 1140, 3180),
                'answer_sheet_roi_3': (1313,1180,1713, 3180),
                'answer_sheet_roi_4': (1860,1180,2260, 3180)
            }
        },
        'A5': {
            'ids': {5, 6, 7, 8},
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

def warp_image(img):
    global paper_size
    aruco_dict = aruco.getPredefinedDictionary(aruco.DICT_6X6_250)
    params = aruco.DetectorParameters_create()
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    corners, ids, _ = aruco.detectMarkers(gray, aruco_dict, parameters=params)

    paper_size = detect_paper_size_and_set_rois(ids)
    if paper_size not in ('A4', 'A5'):
        raise ValueError("ArUco markers / paper size not recognised")

    dst_size = (2360, 3388)
    targets = [1, 2, 3, 4] if paper_size == 'A4' else [5, 6, 7, 8]
    idx = [np.where(ids == t)[0][0] for t in targets]

    dst_pts = np.float32([[0, 0],
                          [dst_size[0]-1, 0],
                          [0, dst_size[1]-1],
                          [dst_size[0]-1, dst_size[1]-1]])
    src_pts = np.float32([corners[i][0][k] for i, k in zip(idx, [0, 3, 1, 2])])
    M = cv2.getPerspectiveTransform(src_pts, dst_pts)
    return cv2.warpPerspective(img, M, dst_size)

def convert_to_two_tone(img):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    _, th = cv2.threshold(gray, 140, 255, cv2.THRESH_BINARY)
    return th

def detect_circles(img, min_r):
    blur = cv2.GaussianBlur(img, (9, 9), 5)
    cir = cv2.HoughCircles(blur, cv2.HOUGH_GRADIENT, 1.2, 40,
                           param1=50, param2=30,
                           minRadius=min_r, maxRadius=min_r+10)
    return None if cir is None else np.uint16(np.around(cir[0]))

def sort_circles(circles, prefix):
    """
    Stable reading-order IDs: q_0, q_1, …
    """
    global global_id_counter
    circles = sorted(circles, key=lambda c: c[1])              # by y
    rows, temp = [], [circles[0]]
    for a, b in zip(circles, circles[1:]):
        if abs(b[1] - a[1]) > 10:
            rows.append(temp)
            temp = []
        temp.append(b)
    rows.append(temp)
    for row in rows:
        row.sort(key=lambda c: c[0])                           # by x

    out = {}
    for row in rows:
        for c in row:
            out[f"q_{global_id_counter}"] = c
            global_id_counter += 1
    return out

def is_filled(img, circle, threshold):
    x, y, r = circle
    pts = [(x, y),
           (x - r//2, y), (x + r//2, y),
           (x, y - r//2), (x, y + r//2)]
    vals = [img[py, px]
            for px, py in pts
            if 0 <= px < img.shape[1] and 0 <= py < img.shape[0]]
    return sum(v < threshold for v in vals) >= len(vals)//2

def get_q_no_and_opt(cid):
    idx = int(cid.split('_')[1])
    return idx//4 + 1, "ABCD"[idx % 4]

# ──────────────────────────────────────────────────────────────────────────────
#                            ARGUMENT PARSE
# ──────────────────────────────────────────────────────────────────────────────
if len(sys.argv) != 3:
    sys.exit("Usage:  scanner.py  /path/to/image.jpg  \"[1,2,3,4…]\"")

image_path       = sys.argv[1]
correct_answers  = json.loads(sys.argv[2])          # list of numbers 1-4
rev_map          = {1: 'A', 2: 'B', 3: 'C', 4: 'D'}
mapped_answers   = [rev_map[n] for n in correct_answers]
total_questions  = len(mapped_answers)

# ──────────────────────────────────────────────────────────────────────────────
#                          PIPELINE
# ──────────────────────────────────────────────────────────────────────────────
raw_img          = read_local_image(image_path)
qr_code_data     = detect_qr_code(raw_img)
warped           = warp_image(raw_img)
sheet_gray       = convert_to_two_tone(warped)
sheet_color      = cv2.cvtColor(sheet_gray, cv2.COLOR_GRAY2BGR)

# ---- circle detection
global_id_counter = 0
detected          = {}
paper_thresh      = 120 if paper_size == 'A4' else 60
for key, roi in rois.items():
    x1, y1, x2, y2 = roi
    crop = sheet_gray[y1:y2, x1:x2]
    min_r = (33 if paper_size == 'A4' else 42) // 2
    cir   = detect_circles(crop, min_r)
    if cir is not None:
        detected[key] = sort_circles(cir, 'q')

# ---- DataFrame & counters
df           = pd.DataFrame({'Option': ['N'] * total_questions},
                            index=range(1, total_questions + 1))
filled_count = {}

for sec, ids in detected.items():
    xo, yo = rois[sec][0], rois[sec][1]
    for cid, (x, y, r) in ids.items():
        gx, gy = x + xo, y + yo
        filled = is_filled(sheet_gray, (gx, gy, r), paper_thresh)
        q, opt = get_q_no_and_opt(cid)
        if filled:
            filled_count[q] = filled_count.get(q, 0) + 1
            if filled_count[q] == 1:
                df.at[q, 'Option'] = opt
            else:
                df.at[q, 'Option'] = 'W'

# ──────────────────────────────────────────────────────────────────────────────
#                        VISUAL ANNOTATION (all states)
# ──────────────────────────────────────────────────────────────────────────────
# 1) Alignment grid
grid_x, grid_y = 250, 180
for x in range(0, sheet_color.shape[1], grid_x):
    cv2.line(sheet_color, (x, 0), (x, sheet_color.shape[0]),
             COLORS["grid"], 1)
for y in range(0, sheet_color.shape[0], grid_y):
    cv2.line(sheet_color, (0, y), (sheet_color.shape[1], y),
             COLORS["grid"], 1)

# 2) Bubble-by-bubble rendering
for sec, ids in detected.items():
    xo, yo = rois[sec][0], rois[sec][1]
    for cid, (x, y, r) in ids.items():
        gx, gy = x + xo, y + yo
        q, opt = get_q_no_and_opt(cid)
        if q > total_questions:
            continue

        selected     = is_filled(sheet_gray, (gx, gy, r), paper_thresh)
        multiple_sel = filled_count.get(q, 0) > 1
        correct_opt  = mapped_answers[q - 1] == opt

        if selected and multiple_sel:
            draw_square(sheet_color, (gx, gy), COLORS["multiple"])
            (draw_tick if correct_opt else draw_cross)(
                sheet_color, (gx, gy),
                COLORS["correct"] if correct_opt else COLORS["wrong"])
        elif selected:
            (draw_tick if correct_opt else draw_cross)(
                sheet_color, (gx, gy),
                COLORS["correct"] if correct_opt else COLORS["wrong"])
        elif correct_opt:                 # missed correct
            draw_ring(sheet_color, (gx, gy), COLORS["missed"])
        else:                             # neutral
            draw_dot(sheet_color, (gx, gy), COLORS["neutral"])

# 3) Legend + quick score card
panel_h, panel_w = 270, 450
px, py = sheet_color.shape[1] - panel_w - 30, 30
cv2.rectangle(sheet_color, (px, py), (px + panel_w, py + panel_h),
              (255, 255, 255), -1)
cv2.rectangle(sheet_color, (px, py), (px + panel_w, py + panel_h),
              (0, 0, 0), 2)

legend = [
    ("tick",    "Chosen & correct",  "correct"),
    ("cross",   "Chosen & wrong",    "wrong"),
    ("square",  "Multiple chosen",   "multiple"),
    ("ring",    "Correct missed",    "missed"),
    ("dot",     "Empty option",      "neutral")
]
for i, (shape, text, cat) in enumerate(legend):
    cx, cy = px + 30, py + 60 + i * 42
    if shape == "tick":
        draw_tick(sheet_color, (cx, cy), COLORS[cat])
    elif shape == "cross":
        draw_cross(sheet_color, (cx, cy), COLORS[cat])
    elif shape == "square":
        draw_square(sheet_color, (cx, cy), COLORS[cat], side=30, thick=4)
    elif shape == "ring":
        draw_ring(sheet_color, (cx, cy), COLORS[cat], radius=14, thick=3)
    else:
        draw_dot(sheet_color, (cx, cy), COLORS[cat], radius=5)
    cv2.putText(sheet_color, text, (cx + 45, cy + 5),
                FONT, FONT_SMALL, (0, 0, 0), 1, cv2.LINE_AA)

score = sum(df.at[q, 'Option'] == mapped_answers[q - 1]
            for q in range(1, total_questions + 1))
cv2.putText(sheet_color, f"{score}/{total_questions} correct",
            (px + 20, py + panel_h - 25),
            FONT, 1, (0, 0, 0), 2, cv2.LINE_AA)

# ──────────────────────────────────────────────────────────────────────────────
#                         SAVE & JSON OUTPUT
# ──────────────────────────────────────────────────────────────────────────────
full_path  = f"../public/upload/corrects/full_{qr_code_data}.jpg"
thumb_path = f"../public/upload/corrects/{qr_code_data}.jpg"

cv2.imwrite(full_path, sheet_color,
            [int(cv2.IMWRITE_JPEG_QUALITY), 95])

thumb = cv2.resize(sheet_color, (1000, 1436),
                   interpolation=cv2.INTER_AREA)
cv2.imwrite(thumb_path, thumb)

def make_json():
    right, wrong, multi, unans, user = [], [], [], [], []
    to_num = {'A': 1, 'B': 2, 'C': 3, 'D': 4}
    for q in range(1, total_questions + 1):
        opt = df.at[q, 'Option']
        user.append(to_num.get(opt, 0))
        if filled_count.get(q, 0) > 1:
            multi.append(q)
        elif filled_count.get(q, 0) == 0:
            unans.append(q)
        elif opt == mapped_answers[q - 1]:
            right.append(q)
        else:
            wrong.append(q)
    return json.dumps({
        "qRCodeData"    : qr_code_data,
        "rightAnswers"  : right,
        "wrongAnswers"  : wrong,
        "multipleAnswers": multi,
        "unAnswered"    : unans,
        "Useranswers"   : user,
        "correctedImageUrl": thumb_path
    })

print(make_json())
