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
            qr_data = obj.data.decode('utf-8')
            break
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


def detect_circles(input_image, min_radius=0):
    blurred_image = cv2.GaussianBlur(input_image, (9, 9), 5)
    # Adjusted parameters for better detection with your sheet layout
    circles = cv2.HoughCircles(blurred_image, cv2.HOUGH_GRADIENT, 
                               dp=1.2, 
                               minDist=35,  # Reduced slightly for tighter spacing
                               param1=50, 
                               param2=25,   # Lower threshold = more sensitive
                               minRadius=min_radius, 
                               maxRadius=min_radius+12)  # Slightly wider range
    if circles is not None:
        circles = np.uint16(np.around(circles[0, :]))
    return circles


def sort_circles_spatially(circles, roi_index, y_tolerance=20):
    """
    NEW APPROACH: Sort circles by spatial position and assign question/option based on coordinates
    This prevents cascading errors when bubbles are missing in a row
    
    Args:
        circles: Array of detected circles [(x, y, r), ...]
        roi_index: ROI number (1-4 for A4, 1-3 for A5)
        y_tolerance: Max Y-difference to consider circles in same row (pixels)
    
    Returns:
        dict: Maps (x, y, r) tuple -> (question_number, option)
    """
    if circles is None or len(circles) == 0:
        return {}
    
    # Sort circles by Y coordinate first
    circles_sorted = sorted(circles, key=lambda c: c[1])
    
    # Group circles into rows based on Y-coordinate proximity
    rows = []
    current_row = [circles_sorted[0]]
    
    for circle in circles_sorted[1:]:
        # If Y-coordinate is close to previous circle, same row
        if abs(circle[1] - current_row[-1][1]) <= y_tolerance:
            current_row.append(circle)
        else:
            # New row detected
            rows.append(current_row)
            current_row = [circle]
    rows.append(current_row)  # Don't forget last row
    
    # Sort each row by X coordinate (left to right = A, B, C, D)
    for i in range(len(rows)):
        rows[i] = sorted(rows[i], key=lambda c: c[0])
    
    # Calculate base question number for this ROI/column
    if paper_size == 'A4':
        questions_per_column = 30
    elif paper_size == 'A5':
        questions_per_column = 20
    else:
        questions_per_column = 30
    
    base_question = (roi_index - 1) * questions_per_column
    
    # VALIDATION: Check if we have reasonable number of rows
    expected_rows = questions_per_column
    detected_rows = len(rows)
    if detected_rows < expected_rows * 0.7:  # Less than 70% detected
        print(f"WARNING: ROI {roi_index} - Only detected {detected_rows}/{expected_rows} rows. Check scan quality.", file=sys.stderr)
    
    # Create mapping: circle -> (question_number, option)
    circle_mapping = {}
    
    for row_idx, row in enumerate(rows):
        question_number = base_question + row_idx + 1
        
        # VALIDATION: Warn if row has unusual number of bubbles
        if len(row) < 2:  # Less than 2 bubbles in a row is suspicious
            print(f"WARNING: Question {question_number} - Only {len(row)} bubble(s) detected", file=sys.stderr)
        
        # Assign options based on X position within row
        # Even if only 2-3 bubbles detected, they get correct A/B/C/D based on position
        for col_idx, circle in enumerate(row):
            if col_idx < 4:  # Only first 4 circles per row (A, B, C, D)
                option = ['A', 'B', 'C', 'D'][col_idx]
                circle_key = tuple(circle)
                circle_mapping[circle_key] = (question_number, option, circle)
    
    return circle_mapping


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


# Detect circles in each ROI
detected_circles = {}
for key, roi in rois.items():
    min_radius = 33 // 2 if paper_size == 'A4' else 42 // 2 if paper_size == 'A5' else 33 // 2
    _, circles = process_roi(final_image, roi, min_radius=min_radius)
    if circles is not None:
        detected_circles[key] = circles


# NEW: Process circles using spatial positioning (robust to missing bubbles)
circle_mappings = {}
for roi_key, circles in detected_circles.items():
    roi_index = int(roi_key.split('_')[-1])  # Extract number from 'answer_sheet_roi_1'
    circle_mappings[roi_key] = sort_circles_spatially(circles, roi_index)


# Initialize dataframe
if paper_size == 'A4':
    df = pd.DataFrame({'Option': ['N'] * 120}, index=range(1, 121))
elif paper_size == 'A5':
    df = pd.DataFrame({'Option': ['N'] * 60}, index=range(1, 61))
else:
    df = pd.DataFrame({'Option': ['N'] * 120}, index=range(1, 121))

filled_circles_count = {}

# Process filled circles using new mapping
for roi_key, circle_map in circle_mappings.items():
    x_offset, y_offset = rois[roi_key][0], rois[roi_key][1]
    
    for circle_key, (question_number, option, circle) in circle_map.items():
        x, y, r = circle
        adjusted_x, adjusted_y = x + x_offset, y + y_offset
        
        if is_filled_circle(final_image, (adjusted_x, adjusted_y, r)):
            # Track filled circles per question
            if question_number not in filled_circles_count:
                filled_circles_count[question_number] = 0
            filled_circles_count[question_number] += 1
            
            # Mark answer
            if filled_circles_count[question_number] > 1:
                df.at[question_number, 'Option'] = 'W'  # Multiple answers
            else:
                df.at[question_number, 'Option'] = option


# === VISUALIZATION SECTION ===

square_size = 60 if paper_size == 'A4' else 80 if paper_size == 'A5' else 60
half_square = square_size // 2
circle_radius = 20 if paper_size == 'A4' else 25 if paper_size == 'A5' else 20
circle_radius_yellow = 10 if paper_size == 'A4' else 15 if paper_size == 'A5' else 10

final_image_color = cv2.cvtColor(final_image, cv2.COLOR_GRAY2BGR)
total_questions = len(correct_answers)

# Draw green circles around correct answers
for roi_key, circle_map in circle_mappings.items():
    x_offset, y_offset = rois[roi_key][0], rois[roi_key][1]
    
    for circle_key, (question_number, option, circle) in circle_map.items():
        if question_number <= total_questions:
            x, y, r = circle
            adjusted_x, adjusted_y = x + x_offset, y + y_offset
            correct_answer = mapped_answers[question_number - 1]
            
            if correct_answer == option:
                cv2.circle(final_image_color, (adjusted_x, adjusted_y), 
                          circle_radius, (0, 255, 0), 3)

# Draw yellow dots for unanswered questions
for question_number in range(1, total_questions + 1):
    if filled_circles_count.get(question_number, 0) == 0:
        correct_answer = mapped_answers[question_number - 1]
        
        # Find the correct answer circle
        for roi_key, circle_map in circle_mappings.items():
            x_offset, y_offset = rois[roi_key][0], rois[roi_key][1]
            
            for circle_key, (q_num, option, circle) in circle_map.items():
                if q_num == question_number and option == correct_answer:
                    x, y, r = circle
                    adjusted_x, adjusted_y = x + x_offset, y + y_offset
                    cv2.circle(final_image_color, (adjusted_x, adjusted_y), 
                              circle_radius_yellow, (0, 255, 255), -1)
                    break

# Draw rectangles around filled answers (green=correct, red=wrong, yellow=multiple)
for roi_key, circle_map in circle_mappings.items():
    x_offset, y_offset = rois[roi_key][0], rois[roi_key][1]
    
    for circle_key, (question_number, option, circle) in circle_map.items():
        if question_number <= total_questions:
            x, y, r = circle
            adjusted_x, adjusted_y = x + x_offset, y + y_offset
            
            if is_filled_circle(final_image, (adjusted_x, adjusted_y, r)):
                if filled_circles_count[question_number] > 1:
                    # Multiple answers - yellow rectangle
                    cv2.rectangle(final_image_color, 
                                 (adjusted_x - half_square, adjusted_y - half_square), 
                                 (adjusted_x + half_square, adjusted_y + half_square), 
                                 (0, 255, 255), 3)
                else:
                    correct_answer = mapped_answers[question_number - 1]
                    if correct_answer == df.at[question_number, 'Option']:
                        # Correct answer - green rectangle
                        cv2.rectangle(final_image_color, 
                                     (adjusted_x - half_square, adjusted_y - half_square), 
                                     (adjusted_x + half_square, adjusted_y + half_square), 
                                     (55, 155, 55), 3)
                    else:
                        # Wrong answer - red rectangle
                        cv2.rectangle(final_image_color, 
                                     (adjusted_x - half_square, adjusted_y - half_square), 
                                     (adjusted_x + half_square, adjusted_y + half_square), 
                                     (35, 35, 200), 3)


# Add correction guide overlay
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

correction_guide_resized = cv2.resize(correction_guide, 
                                     (lower_right[0] - upper_left[0], 
                                      lower_right[1] - upper_left[1]))

final_image_color[upper_left[1]:lower_right[1], 
                 upper_left[0]:lower_right[0]] = correction_guide_resized

# Save final image
resized_image = cv2.resize(final_image_color, (1000, 1436))
final_image_path = f'../public/uploads/corrects/{qr_code_data}.jpg'
cv2.imwrite(final_image_path, resized_image)

# Generate and print JSON output
json_result = generate_json_output(qr_code_data)
print(json_result)