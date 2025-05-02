import cv2
import sys
import numpy as np
import pandas as pd
import json
from operator import itemgetter
import cv2.aruco as aruco
from PIL import Image, ImageOps
import random
from pyzbar.pyzbar import decode

global paper_size, rois

# --------------------- Helper Functions ---------------------

def preprocess_for_detection(img):
    """
    Auto-rotate based on EXIF, denoise, and apply CLAHE for even lighting.
    """
    try:
        pil = Image.fromarray(img)
        pil = ImageOps.exif_transpose(pil)
        img = np.array(pil)
    except Exception:
        pass

    img = cv2.fastNlMeansDenoisingColored(img, None, h=10, hColor=10,
                                          templateWindowSize=7, searchWindowSize=21)
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
    l = clahe.apply(l)
    img = cv2.cvtColor(cv2.merge((l,a,b)), cv2.COLOR_LAB2BGR)
    return img


def read_local_image(file_path):
    image = cv2.imread(file_path, cv2.IMREAD_COLOR)
    if image is not None:
        return image
    else:
        raise Exception(f"Error reading image from path: {file_path}")


def detect_qr_code(image):
    decoded = decode(image)
    for obj in decoded:
        if obj.type == 'QRCODE':
            return obj.data.decode('utf-8')
    return None


def draw_transparent_rect(img, top_left, bottom_right, color, alpha=0.25):
    overlay = img.copy()
    cv2.rectangle(overlay, top_left, bottom_right, color, -1)
    return cv2.addWeighted(overlay, alpha, img, 1-alpha, 0)


def auto_radius_params(img):
    h, w = img.shape[:2]
    unit = w / (4 * (30 if paper_size=='A4' else 20 if paper_size=='A5' else 30))
    est_r = int(unit)
    return max(10, est_r-5), est_r+5


def detect_paper_size_and_set_rois(ids):
    global rois
    if ids is not None:
        ids_set = set(ids.flatten())
        paper_sizes = {
            'A4': {'ids': {1,2,3,4}, 'rois': {
                'answer_sheet_roi_1': (200,1180,600,3180),
                'answer_sheet_roi_2': (740,1180,1140,3180),
                'answer_sheet_roi_3': (1313,1180,1713,3180),
                'answer_sheet_roi_4': (1860,1180,2260,3180),
            }},
            'A5': {'ids': {5,6,7,8}, 'rois': {
                'answer_sheet_roi_1': (250,1430,750,3190),
                'answer_sheet_roi_2': (950,1430,1480,3190),
                'answer_sheet_roi_3': (1680,1430,2220,3190),
            }}
        }
        for size, details in paper_sizes.items():
            if details['ids'].issubset(ids_set):
                rois = details['rois']
                return size
    return None


def convert_to_two_tone(image):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    _, th = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    return th


def warp_image(input_image):
    global paper_size
    aruco_dict = aruco.getPredefinedDictionary(aruco.DICT_6X6_250)
    parameters = aruco.DetectorParameters_create()
    # Tuned for mobile captures:
    parameters.adaptiveThreshWinSizeMin = 5
    parameters.adaptiveThreshWinSizeMax = 23
    parameters.adaptiveThreshWinSizeStep = 8
    parameters.adaptiveThreshConstant = 7
    parameters.minMarkerPerimeterRate = 0.02
    parameters.maxMarkerPerimeterRate = 4.0

    gray = cv2.cvtColor(input_image, cv2.COLOR_BGR2GRAY)
    corners, ids, _ = aruco.detectMarkers(gray, aruco_dict, parameters=parameters)

    paper_size = detect_paper_size_and_set_rois(ids)
    if paper_size not in ['A4','A5']:
        raise ValueError("Unknown paper size or ArUco markers not found")

    dest_size = (2360,3388)
    target_ids = [1,2,3,4] if paper_size=='A4' else [5,6,7,8]
    if not set(target_ids).issubset(ids.flatten()):
        raise ValueError("Not all target ArUco markers detected")

    idxs = [np.where(ids==i)[0][0] for i in target_ids]
    dst_pts = np.array([[0,0],[dest_size[0]-1,0],[0,dest_size[1]-1],[dest_size[0]-1,dest_size[1]-1]], dtype='float32')
    src_pts = np.array([
        corners[idxs[0]][0][0],
        corners[idxs[1]][0][3],
        corners[idxs[2]][0][1],
        corners[idxs[3]][0][2]
    ], dtype='float32')
    M = cv2.getPerspectiveTransform(src_pts, dst_pts)
    return cv2.warpPerspective(input_image, M, dest_size)


def detect_circles(input_image):
    blurred = cv2.GaussianBlur(input_image, (9,9), 5)
    min_r, max_r = auto_radius_params(input_image)
    circles = cv2.HoughCircles(blurred, cv2.HOUGH_GRADIENT, dp=1.2,
                               minDist=min_r*2, param1=50, param2=30,
                               minRadius=min_r, maxRadius=max_r)
    return np.uint16(np.around(circles[0])) if circles is not None else None


def process_roi(image, roi):
    crop = image[roi[1]:roi[3], roi[0]:roi[2]]
    return crop, detect_circles(crop)


def is_filled_circle(image, circle):
    threshold = 120 if paper_size=='A4' else 60 if paper_size=='A5' else 120
    x,y,r = circle
    pts = [(x,y),(x-r//2,y),(x+r//2,y),(x,y-r//2),(x,y+r//2)]
    filled = sum(1 for px,py in pts if 0<=px<image.shape[1] and 0<=py<image.shape[0] and image[py,px]<threshold)
    return filled >= len(pts)//2


def get_question_number_and_option(cid):
    idx = int(cid.split('_')[1])
    return idx//4+1, ['A','B','C','D'][idx%4]


def generate_json_output(qr_code_data):
    right, wrong, multi, Unans, user_ans = [],[],[],[],[]
    mapping = {'A':1,'B':2,'C':3,'D':4}
    total = len(correct_answers)
    for q in range(1, total+1):
        letter = df.at[q,'Option']
        num = mapping.get(letter,0)
        user_ans.append(num)
        cnt = filled_circles_count.get(q,0)
        if cnt>1: multi.append(q)
        elif cnt==0: Unans.append(q)
        else:
            if mapped_answers[q-1]==letter: right.append(q)
            else: wrong.append(q)
    return json.dumps({
        "qRCodeData": qr_code_data,
        "rightAnswers": right,
        "wrongAnswers": wrong,
        "multipleAnswers": multi,
        "unAnswered": Unans,
        "Useranswers": user_ans,
        "correctedImageUrl": final_image_path
    })

# --------------------- Main Pipeline ---------------------

if len(sys.argv)!=3:
    raise ValueError("Two inputs required: image path and JSON list of correct answers")

image_path, correct_str = sys.argv[1], sys.argv[2]
try:
    correct_answers = json.loads(correct_str)
except json.JSONDecodeError:
    raise ValueError("Invalid format for correct answers list")
answer_mapping = {1:'A',2:'B',3:'C',4:'D'}
mapped_answers = [answer_mapping[i] for i in correct_answers]

# Load and preprocess
raw = read_local_image(image_path)
image = preprocess_for_detection(raw)

# QR Detection
qr_code_data = detect_qr_code(image) or 'no_qr'

# Warp & Binarize
warped = warp_image(image)
bin_img = convert_to_two_tone(warped)
final_image = bin_img

# Circle detection & sorting
detected_circles = {}
for key, r in rois.items():
    crop, circs = process_roi(final_image, r)
    if circs is not None:
        detected_circles[key] = sorted(circs, key=itemgetter(1,0))

sorted_circle_ids = {}
for k, circs in detected_circles.items():
    sorted_circle_ids[k] = sort_circles_into_rows_and_columns(circs, 10 if paper_size=='A4' else 20, 4, 'q')

# Prepare annotation canvas
final_image_color = cv2.cvtColor(final_image, cv2.COLOR_GRAY2BGR)
overlay = final_image_color.copy()
scale = final_image_color.shape[1] / 1000.0
thickness = max(1, int(2*scale))
font_scale = max(0.5, 1*scale)
font = cv2.FONT_HERSHEY_SIMPLEX

filled_circles_count = {}

# Mark filled answers
for section, ids in sorted_circle_ids.items():
    if not section.startswith('s'):
        x_off, y_off = rois[section][0], rois[section][1]
        for cid, (x,y,r) in ids.items():
            ax, ay = x+x_off, y+y_off
            qnum, opt = get_question_number_and_option(cid)
            if is_filled_circle(final_image, (ax,ay,r)):
                filled_circles_count[qnum] = filled_circles_count.get(qnum,0)+1
                top_left = (ax-r, ay-r)
                bot_right = (ax+r, ay+r)
                overlay = draw_transparent_rect(overlay, top_left, bot_right,
                                               (0,255,0) if mapped_answers[qnum-1]==opt else (0,0,255), 0.3)
                cv2.putText(overlay, cid, (ax-r, ay-r-5), font, font_scale, (0,0,0), thickness, cv2.LINE_AA)

# Draw legend
legend = [("Correct",(0,255,0)),("Wrong",(0,0,255)),
          ("Multiple",(0,255,255)),("Unanswered",(255,0,0))]
for i,(text,col) in enumerate(legend):
    y = 30 + i*30
    cv2.rectangle(overlay, (10,y-20),(30,y), col, -1)
    cv2.putText(overlay, text, (35,y), font, 0.6, (0,0,0),1)

# Merge overlay
final_annotated = cv2.addWeighted(overlay, 1, final_image_color, 0, 0)

# Insert correction guide
guide = cv2.imread('correction_guide.jpg')
ul, lr = ((1180,641),(1570,955)) if paper_size=='A4' else ((1570,700),(2160,1160))
resized_guide = cv2.resize(guide, (lr[0]-ul[0], lr[1]-ul[1]))
final_annotated[ul[1]:lr[1], ul[0]:lr[0]] = resized_guide

# Save output
resized = cv2.resize(final_annotated, (1000,1436))
final_image_path = f'../public/upload/corrects/{qr_code_data}.jpg'
cv2.imwrite(final_image_path, resized)

# Output JSON
print(generate_json_output(qr_code_data))
