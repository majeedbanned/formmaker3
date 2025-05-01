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
global paper_size
paper_size = None

def generate_json_output(qr_code_data):
    right_answers = []
    wrong_answers = []
    multiple_answers = []
    un_answered = []
    user_answers = []

    total_questions = len(correct_answers)
    answer_mapping = {'A': 1, 'B': 2, 'C': 3, 'D': 4}

    for question_number in range(1, total_questions + 1):
        letter_answer = df.at[question_number, 'Option']
        numeric_answer = answer_mapping.get(letter_answer, 0)
        user_answers.append(numeric_answer)

        filled_count = filled_circles_count.get(question_number, 0)
        if filled_count > 1:
            multiple_answers.append(question_number)
        elif filled_count == 0:
            un_answered.append(question_number)
        else:
            correct_answer = mapped_answers[question_number - 1]
            if correct_answer == letter_answer:
                right_answers.append(question_number)
            else:
                wrong_answers.append(question_number)

    json_output = {
		"qRCodeData": qr_code_data,
        "rightAnswers": right_answers,
        "wrongAnswers": wrong_answers,
        "multipleAnswers": multiple_answers,
        "unAnswered": un_answered,
        "Useranswers": user_answers,
        "correctedImageUrl": final_image_path
    }

    return json.dumps(json_output)


def detect_qr_code(image):
    decoded_objects = decode(image)
    qr_data = None
    for obj in decoded_objects:
        if obj.type == 'QRCODE':
            qr_data = obj.data.decode('utf-8')  # Decode QR code data to string
            break  # Assuming there's only one QR code of interest
    return qr_data
def read_local_image(file_path):
    image = cv2.imread(file_path, cv2.IMREAD_COLOR)
    if image is not None:
        return image
    else:
        raise Exception(f"Error reading image from path: {file_path}")

if len(sys.argv) != 3:
    raise ValueError("Two inputs required: 1) Image path, 2) Correct answers list")

image_path = sys.argv[1]
correct_answers_str = sys.argv[2]

try:
    correct_answers = json.loads(correct_answers_str)
except json.JSONDecodeError:
    raise ValueError("Invalid format for correct answers")

answer_mapping = {1: 'A', 2: 'B', 3: 'C', 4: 'D'}
mapped_answers = [answer_mapping[ans] for ans in correct_answers]

image = read_local_image(image_path)

qr_code_data = detect_qr_code(image)
# if qr_code_data:
#     print(f"QR Code data: {qr_code_data}")
# else:
#     print("No QR Code found.")
def detect_paper_size_and_set_rois(ids):
    global rois
    if ids is not None:
        ids_set = set(ids.flatten())
        paper_sizes = {
            'A4': {
                'ids': {1, 2, 3, 4},
                'rois': {
                    'answer_sheet_roi_1': (200, 1180, 600, 3180),
                    'answer_sheet_roi_2': (740, 1180, 1140, 3180),
                    'answer_sheet_roi_3': (1313, 1180, 1713, 3180),
                    'answer_sheet_roi_4': (1860, 1180, 2260, 3180),
                }
            },
            'A5': {
                'ids': {5, 6, 7, 8},
                'rois': {
                    'answer_sheet_roi_1': (250, 1430, 750, 3190),
                    'answer_sheet_roi_2': (950, 1430, 1480, 3190),
                    'answer_sheet_roi_3': (1680, 1430, 2220, 3190),
                }
            }
        }

        for size, details in paper_sizes.items():
            if details['ids'].issubset(ids_set):
                rois = details['rois']
                return size
    return None

    
def convert_to_two_tone(image):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    _, thresholded = cv2.threshold(gray, 140, 255, cv2.THRESH_BINARY)
    return thresholded

def warp_image(input_image):
    global paper_size
    aruco_dict = aruco.getPredefinedDictionary(aruco.DICT_6X6_250)
    parameters = aruco.DetectorParameters_create()

    gray = cv2.cvtColor(input_image, cv2.COLOR_BGR2GRAY)
    corners, ids, rejectedImgPoints = aruco.detectMarkers(gray, aruco_dict, parameters=parameters)

    paper_size = detect_paper_size_and_set_rois(ids)

    if paper_size in ['A4', 'A5']:
        destination_size = (2360, 3388)
        target_ids = [1, 2, 3, 4] if paper_size == 'A4' else [5, 6, 7, 8]
        if set(target_ids).issubset(ids.flatten()):
            target_indices = [np.where(ids == i)[0][0] for i in target_ids]
    else:
        raise ValueError("Unknown paper size or ArUco markers not found")

    destination_points = np.array([
        [0, 0],
        [destination_size[0] - 1, 0],
        [0, destination_size[1] - 1],
        [destination_size[0] - 1, destination_size[1] - 1]
    ], dtype="float32")

    source_points = np.array([
        corners[target_indices[0]][0][0],
        corners[target_indices[1]][0][3],
        corners[target_indices[2]][0][1],
        corners[target_indices[3]][0][2]
    ], dtype="float32")

    transform_matrix = cv2.getPerspectiveTransform(source_points, destination_points)
    warped_image = cv2.warpPerspective(input_image, transform_matrix, destination_size)
    return warped_image


image = read_local_image(image_path)

warped_image = warp_image(image)

if warped_image is not None:
    two_tone_image = convert_to_two_tone(warped_image)
    final_image = two_tone_image
    pil_image = Image.fromarray(final_image)


    
global_id_counter = 0

def detect_circles(input_image, min_radius=0):
    blurred_image = cv2.GaussianBlur(input_image, (9, 9), 5)
    circles = cv2.HoughCircles(blurred_image, cv2.HOUGH_GRADIENT, dp=1.2, minDist=40,
                               param1=50, param2=30, minRadius=min_radius, maxRadius=min_radius+10)
    if circles is not None:
        circles = np.uint16(np.around(circles[0, :]))
    return circles

def sort_circles_into_rows_and_columns(circles, rows, cols, prefix):
    global global_id_counter
    circles_sorted_by_y = sorted(circles, key=lambda c: c[1])
    row_break_points = [0]
    for i in range(1, len(circles_sorted_by_y)):
        if abs(circles_sorted_by_y[i][1] - circles_sorted_by_y[i - 1][1]) > 10:
            row_break_points.append(i)
    rows_of_circles = [circles_sorted_by_y[i:j] for i, j in zip(row_break_points, row_break_points[1:] + [None])]
    for i, row in enumerate(rows_of_circles):
        rows_of_circles[i] = sorted(row, key=lambda c: c[0])
    circle_ids_sorted = {}
    for i, row in enumerate(rows_of_circles):
        for j, circle in enumerate(row):
            circle_id = f"{prefix}_{global_id_counter}"
            global_id_counter += 1
            circle_ids_sorted[circle_id] = circle
    return circle_ids_sorted

def process_roi(image, roi, min_radius):
    cropped_image = image[roi[1]:roi[3], roi[0]:roi[2]]
    circles = detect_circles(cropped_image, min_radius=min_radius)
    return cropped_image, circles

def is_filled_circle(image, circle):
    global paper_size
    threshold = 120 if paper_size == 'A4' else 60 if paper_size == 'A5' else 120
    x, y, r = circle
    points_to_check = [
        (x, y),
        (x - r//2, y), (x + r//2, y),
        (x, y - r//2), (x, y + r//2)
    ]
    filled_points = 0

    for point in points_to_check:
        if 0 <= point[0] < image.shape[1] and 0 <= point[1] < image.shape[0]:
            if image[point[1], point[0]] < threshold:
                filled_points += 1

    return filled_points >= len(points_to_check) // 2

def get_question_number_and_option(id):
    question_number = (int(id.split('_')[1])) // 4 + 1
    option = ['A', 'B', 'C', 'D'][(int(id.split('_')[1])) % 4]
    return question_number, option


detected_circles = {}
for key, roi in rois.items():
    min_radius = 33 // 2 if paper_size == 'A4' else 42 // 2 if paper_size == 'A5' else 33 // 2
    _, circles = process_roi(final_image, roi, min_radius=min_radius)
    if circles is not None:
        sorted_circles = sorted(circles, key=itemgetter(1, 0))
        detected_circles[key] = sorted_circles


sorted_circle_ids = {}
for key, circles in detected_circles.items():
    prefix = 'q'
    rows = 10 if paper_size == 'A4' else 20 if paper_size == 'A5' else 30
    cols = 4
    sorted_circle_ids[key] = sort_circles_into_rows_and_columns(circles, rows, cols, prefix)

annotated_image = final_image.copy()
font = cv2.FONT_HERSHEY_SIMPLEX
font_scale = 1
font_color = (0, 0, 0)
font_thickness = 1

filled_circles_count = {}

if paper_size == 'A4':
    df = pd.DataFrame({'Option': ['N'] * 120}, index=range(1, 121))
elif paper_size == 'A5':
    df = pd.DataFrame({'Option': ['N'] * 60}, index=range(1, 61))
else:
    df = pd.DataFrame({'Option': ['N'] * 120}, index=range(1, 121))

for section, ids in sorted_circle_ids.items():
    x_offset, y_offset = rois[section][0], rois[section][1]
    for id, (x, y, r) in ids.items():
        adjusted_x, adjusted_y = x + x_offset, y + y_offset
        square_size = 60 if paper_size == 'A4' else 80 if paper_size == 'A5' else 60
        half_square = square_size // 2
        if is_filled_circle(final_image, (adjusted_x, adjusted_y, r)):
            cv2.rectangle(annotated_image, (adjusted_x - half_square, adjusted_y - half_square), 
                          (adjusted_x + half_square, adjusted_y + half_square), (0, 255, 0), 2)
            cv2.putText(annotated_image, id, (adjusted_x - r, adjusted_y - r), font, 
                        font_scale, font_color, font_thickness, cv2.LINE_AA)
            if id.startswith('s'):
                student_code_ids[id] = True
            else:
                question_number, option = get_question_number_and_option(id)
                if question_number not in filled_circles_count:
                    filled_circles_count[question_number] = 0
                filled_circles_count[question_number] += 1
                if filled_circles_count[question_number] > 1:
                    df.at[question_number, 'Option'] = 'W'
                else:
                    df.at[question_number, 'Option'] = option




circle_radius = 20 if paper_size == 'A4' else 25 if paper_size == 'A5' else 20

final_image_color = cv2.cvtColor(final_image, cv2.COLOR_GRAY2BGR)

total_questions = len(correct_answers)

for section, ids in sorted_circle_ids.items():
    if not section.startswith('s'):
        x_offset, y_offset = rois[section][0], rois[section][1]
        for id, (x, y, r) in ids.items():
            adjusted_x, adjusted_y = x + x_offset, y + y_offset
            question_number, option = get_question_number_and_option(id)

            if question_number <= total_questions:
                correct_answer = mapped_answers[question_number - 1]
                if correct_answer == option:
                    cv2.circle(final_image_color, (adjusted_x, adjusted_y), 
                               circle_radius, (0, 255, 0), 3)


circle_radius_yellow = 10 if paper_size == 'A4' else 15 if paper_size == 'A5' else 10

total_questions = len(correct_answers)
range_end = total_questions if total_questions < 120 else 120 if paper_size == 'A4' else total_questions if total_questions < 60 else 60 if paper_size == 'A5' else 120

for question_number in range(1, total_questions + 1):
    if filled_circles_count.get(question_number, 0) == 0:
        correct_answer = mapped_answers[question_number - 1]
        correct_answer_index = ['A', 'B', 'C', 'D'].index(correct_answer)
        section = 'answer_sheet_roi_' + str((question_number - 1) // 30 + 1) if paper_size == 'A4' else 'answer_sheet_roi_' + str((question_number - 1) // 20 + 1) if paper_size == 'A5' else 'answer_sheet_roi_' + str((question_number - 1) // 30 + 1)
        x_offset, y_offset = rois[section][0], rois[section][1]
        id_to_draw = f'q_{(question_number - 1) * 4 + correct_answer_index}'
        x, y, r = sorted_circle_ids[section][id_to_draw]
        adjusted_x, adjusted_y = x + x_offset, y + y_offset
        cv2.circle(final_image_color, (adjusted_x, adjusted_y), 
                   circle_radius_yellow, (0, 255, 255), -1)

for section, ids in sorted_circle_ids.items():
    if not section.startswith('s'):
        x_offset, y_offset = rois[section][0], rois[section][1]
        for id, (x, y, r) in ids.items():
            adjusted_x, adjusted_y = x + x_offset, y + y_offset
            question_number, option = get_question_number_and_option(id)

            if question_number <= total_questions:
                if is_filled_circle(final_image, (adjusted_x, adjusted_y, r)):
                    if filled_circles_count[question_number] > 1:
                        cv2.rectangle(final_image_color, (adjusted_x-half_square, adjusted_y-half_square), 
                                      (adjusted_x+half_square, adjusted_y+half_square), (0, 255, 255), 3)
                    else:
                        correct_answer = mapped_answers[question_number - 1]
                        if correct_answer == df.at[question_number, 'Option']:
                            cv2.rectangle(final_image_color, (adjusted_x-half_square, adjusted_y-half_square), 
                                          (adjusted_x+half_square, adjusted_y+half_square), (55, 155, 55), 3)
                        else:
                            cv2.rectangle(final_image_color, (adjusted_x-half_square, adjusted_y-half_square), 
                                          (adjusted_x+half_square, adjusted_y+half_square), (35, 35, 200), 3)


correction_guide = cv2.imread('correction_guide.jpg')

if paper_size == 'A4':
    upper_left = (1180, 641)
    lower_right = (1570, 955)
elif paper_size == 'A5':
    upper_left = (1570, 700)
    lower_right = (2160, 1160)
else:
    upper_left = (1180, 641)
    lower_right = (1570, 955)

correction_guide_resized = cv2.resize(correction_guide, (lower_right[0] - upper_left[0], lower_right[1] - upper_left[1]))

final_image_color[upper_left[1]:lower_right[1], upper_left[0]:lower_right[0]] = correction_guide_resized

resized_image = cv2.resize(final_image_color, (1000, 1436))
random_number = random.randint(1000000000, 9999999999)
final_image_path = f'upload/corrects/{qr_code_data}.jpg'
cv2.imwrite(final_image_path, resized_image)

json_result = generate_json_output(qr_code_data)
print(json_result)