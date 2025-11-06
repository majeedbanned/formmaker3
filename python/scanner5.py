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


def estimate_missing_corners(corners, expected_ratio, dest_size):
    """
    Estimate missing corners based on detected ones using geometric relationships
    corners: list of 4 points [top-left, top-right, bottom-left, bottom-right]
    """
    corners = list(corners)
    detected_count = sum(1 for c in corners if c is not None)
    
    if detected_count == 4:
        return corners
    
    if detected_count == 3:
        # Find missing corner
        missing_idx = corners.index(None)
        
        if missing_idx == 0:  # top-left missing
            tr, bl, br = corners[1], corners[2], corners[3]
            tl = tr + (bl - br)
            corners[0] = tl
        elif missing_idx == 1:  # top-right missing
            tl, bl, br = corners[0], corners[2], corners[3]
            tr = tl + (br - bl)
            corners[1] = tr
        elif missing_idx == 2:  # bottom-left missing
            tl, tr, br = corners[0], corners[1], corners[3]
            bl = tl + (br - tr)
            corners[2] = bl
        elif missing_idx == 3:  # bottom-right missing
            tl, tr, bl = corners[0], corners[1], corners[2]
            br = tr + (bl - tl)
            corners[3] = br
    
    elif detected_count == 2:
        detected_indices = [i for i, c in enumerate(corners) if c is not None]
        
        if set(detected_indices) == {0, 3}:  # diagonal: top-left and bottom-right
            tl, br = corners[0], corners[3]
            distance = np.linalg.norm(br - tl)
            
            # Calculate width and height from diagonal
            width = distance * expected_ratio / np.sqrt(1 + expected_ratio**2)
            height = distance / np.sqrt(1 + expected_ratio**2)
            
            # Calculate angle of diagonal
            angle = np.arctan2(br[1] - tl[1], br[0] - tl[0])
            
            # Estimate top-right and bottom-left
            tr = tl + np.array([width * np.cos(angle), width * np.sin(angle)])
            bl = tl + np.array([height * np.cos(angle + np.pi/2), height * np.sin(angle + np.pi/2)])
            
            corners[1] = tr
            corners[2] = bl
            
        elif set(detected_indices) == {1, 2}:  # diagonal: top-right and bottom-left
            tr, bl = corners[1], corners[2]
            distance = np.linalg.norm(bl - tr)
            
            width = distance * expected_ratio / np.sqrt(1 + expected_ratio**2)
            height = distance / np.sqrt(1 + expected_ratio**2)
            
            angle = np.arctan2(bl[1] - tr[1], bl[0] - tr[0])
            
            tl = tr + np.array([height * np.cos(angle + np.pi/2), height * np.sin(angle + np.pi/2)])
            br = bl - np.array([height * np.cos(angle + np.pi/2), height * np.sin(angle + np.pi/2)])
            
            corners[0] = tl
            corners[3] = br
            
        elif 0 in detected_indices and 1 in detected_indices:  # top edge
            tl, tr = corners[0], corners[1]
            width = np.linalg.norm(tr - tl)
            height = width / expected_ratio
            
            angle = np.arctan2(tr[1] - tl[1], tr[0] - tl[0])
            perpendicular_angle = angle + np.pi/2
            
            bl = tl + np.array([height * np.cos(perpendicular_angle), height * np.sin(perpendicular_angle)])
            br = tr + np.array([height * np.cos(perpendicular_angle), height * np.sin(perpendicular_angle)])
            
            corners[2] = bl
            corners[3] = br
            
        elif 2 in detected_indices and 3 in detected_indices:  # bottom edge
            bl, br = corners[2], corners[3]
            width = np.linalg.norm(br - bl)
            height = width / expected_ratio
            
            angle = np.arctan2(br[1] - bl[1], br[0] - bl[0])
            perpendicular_angle = angle - np.pi/2
            
            tl = bl + np.array([height * np.cos(perpendicular_angle), height * np.sin(perpendicular_angle)])
            tr = br + np.array([height * np.cos(perpendicular_angle), height * np.sin(perpendicular_angle)])
            
            corners[0] = tl
            corners[1] = tr
            
        elif 0 in detected_indices and 2 in detected_indices:  # left edge
            tl, bl = corners[0], corners[2]
            height = np.linalg.norm(bl - tl)
            width = height * expected_ratio
            
            angle = np.arctan2(bl[1] - tl[1], bl[0] - tl[0])
            perpendicular_angle = angle - np.pi/2
            
            tr = tl + np.array([width * np.cos(perpendicular_angle), width * np.sin(perpendicular_angle)])
            br = bl + np.array([width * np.cos(perpendicular_angle), width * np.sin(perpendicular_angle)])
            
            corners[1] = tr
            corners[3] = br
            
        elif 1 in detected_indices and 3 in detected_indices:  # right edge
            tr, br = corners[1], corners[3]
            height = np.linalg.norm(br - tr)
            width = height * expected_ratio
            
            angle = np.arctan2(br[1] - tr[1], br[0] - tr[0])
            perpendicular_angle = angle + np.pi/2
            
            tl = tr + np.array([width * np.cos(perpendicular_angle), width * np.sin(perpendicular_angle)])
            bl = br + np.array([width * np.cos(perpendicular_angle), width * np.sin(perpendicular_angle)])
            
            corners[0] = tl
            corners[2] = bl
    
    return corners


def warp_image_robust(input_image):
    global paper_size
    aruco_dict = aruco.getPredefinedDictionary(aruco.DICT_6X6_250)
    parameters = aruco.DetectorParameters_create()

    gray = cv2.cvtColor(input_image, cv2.COLOR_BGR2GRAY)
    corners, ids, rejectedImgPoints = aruco.detectMarkers(gray, aruco_dict, parameters=parameters)

    if ids is None or len(ids) < 2:
        raise ValueError(f"Not enough ArUco markers detected (found {len(ids) if ids is not None else 0}, minimum 2 required)")

    # Try to detect paper size
    paper_size = detect_paper_size_and_set_rois(ids)
    
    if paper_size == 'A4':
        destination_size = (2360, 3388)
        target_ids = [1, 2, 3, 4]
        expected_ratio = 2360 / 3388
    elif paper_size == 'A5':
        destination_size = (2360, 3388)
        target_ids = [5, 6, 7, 8]
        expected_ratio = 2360 / 3388
    else:
        # If paper size cannot be determined, try both
        if ids is not None and any(id in [1, 2, 3, 4] for id in ids.flatten()):
            paper_size = 'A4'
            destination_size = (2360, 3388)
            target_ids = [1, 2, 3, 4]
            expected_ratio = 2360 / 3388
        else:
            paper_size = 'A5'
            destination_size = (2360, 3388)
            target_ids = [5, 6, 7, 8]
            expected_ratio = 2360 / 3388

    # Find which markers were detected
    detected_markers = {}
    for i, target_id in enumerate(target_ids):
        if target_id in ids.flatten():
            idx = np.where(ids == target_id)[0][0]
            detected_markers[i] = corners[idx][0]

    if len(detected_markers) < 2:
        raise ValueError("At least 2 ArUco markers required for reconstruction")

    print(f"Detected {len(detected_markers)} out of 4 markers for {paper_size} paper")

    # Define corner positions (0=top-left, 1=top-right, 2=bottom-left, 3=bottom-right)
    source_points = [None, None, None, None]
    
    # Extract detected corners
    corner_map = {
        0: 0,  # marker 0 -> top-left corner (corner index 0)
        1: 3,  # marker 1 -> top-right corner (corner index 3)
        2: 1,  # marker 2 -> bottom-left corner (corner index 1)
        3: 2   # marker 3 -> bottom-right corner (corner index 2)
    }
    
    for marker_idx, marker_corners in detected_markers.items():
        corner_idx = corner_map[marker_idx]
        source_points[marker_idx] = marker_corners[corner_idx]

    # Estimate missing corners based on detected ones
    source_points = estimate_missing_corners(source_points, expected_ratio, destination_size)

    destination_points = np.array([
        [0, 0],
        [destination_size[0] - 1, 0],
        [0, destination_size[1] - 1],
        [destination_size[0] - 1, destination_size[1] - 1]
    ], dtype="float32")

    source_points = np.array(source_points, dtype="float32")
    
    transform_matrix = cv2.getPerspectiveTransform(source_points, destination_points)
    warped_image = cv2.warpPerspective(input_image, transform_matrix, destination_size)
    return warped_image


def convert_to_two_tone(image):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    _, thresholded = cv2.threshold(gray, 140, 255, cv2.THRESH_BINARY)
    return thresholded


def detect_circles(input_image, min_radius=0):
    blurred_image = cv2.GaussianBlur(input_image, (9, 9), 5)
    circles = cv2.HoughCircles(blurred_image, cv2.HOUGH_GRADIENT, dp=1.2, minDist=40,
                               param1=50, param2=30, minRadius=min_radius, maxRadius=min_radius+10)
    if circles is not None:
        circles = np.uint16(np.around(circles[0, :]))
    return circles


def sort_circles_spatially(circles, roi_index, y_tolerance=15):
    """
    Sort circles by spatial position (Y then X) and assign question/option based on position
    """
    if circles is None or len(circles) == 0:
        return {}
    
    circles_sorted = sorted(circles, key=lambda c: c[1])
    
    rows = []
    current_row = [circles_sorted[0]]
    
    for circle in circles_sorted[1:]:
        if abs(circle[1] - current_row[-1][1]) <= y_tolerance:
            current_row.append(circle)
        else:
            rows.append(current_row)
            current_row = [circle]
    rows.append(current_row)
    
    for i in range(len(rows)):
        rows[i] = sorted(rows[i], key=lambda c: c[0])
    
    if paper_size == 'A4':
        base_question = (roi_index - 1) * 30
    elif paper_size == 'A5':
        base_question = (roi_index - 1) * 20
    else:
        base_question = (roi_index - 1) * 30
    
    circle_mapping = {}
    for row_idx, row in enumerate(rows):
        question_number = base_question + row_idx + 1
        
        for col_idx, circle in enumerate(row):
            if col_idx < 4:
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


# Main execution
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

# Use robust warping function
warped_image = warp_image_robust(image)

if warped_image is not None:
    two_tone_image = convert_to_two_tone(warped_image)
    final_image = two_tone_image
    pil_image = Image.fromarray(final_image)

# Detect circles in each ROI
detected_circles = {}
for key, roi in rois.items():
    min_radius = 33 // 2 if paper_size == 'A4' else 42 // 2 if paper_size == 'A5' else 33 // 2
    _, circles = process_roi(final_image, roi, min_radius=min_radius)
    if circles is not None:
        detected_circles[key] = circles

# Process circles using spatial positioning
circle_mappings = {}
for roi_key, circles in detected_circles.items():
    roi_index = int(roi_key.split('_')[-1])
    circle_mappings[roi_key] = sort_circles_spatially(circles, roi_index)

# Initialize dataframe
if paper_size == 'A4':
    df = pd.DataFrame({'Option': ['N'] * 120}, index=range(1, 121))
elif paper_size == 'A5':
    df = pd.DataFrame({'Option': ['N'] * 60}, index=range(1, 61))
else:
    df = pd.DataFrame({'Option': ['N'] * 120}, index=range(1, 121))

filled_circles_count = {}

# Process filled circles
for roi_key, circle_map in circle_mappings.items():
    x_offset, y_offset = rois[roi_key][0], rois[roi_key][1]
    
    for circle_key, (question_number, option, circle) in circle_map.items():
        x, y, r = circle
        adjusted_x, adjusted_y = x + x_offset, y + y_offset
        
        if is_filled_circle(final_image, (adjusted_x, adjusted_y, r)):
            if question_number not in filled_circles_count:
                filled_circles_count[question_number] = 0
            filled_circles_count[question_number] += 1
            
            if filled_circles_count[question_number] > 1:
                df.at[question_number, 'Option'] = 'W'
            else:
                df.at[question_number, 'Option'] = option

# Visualization and correction
circle_radius = 20 if paper_size == 'A4' else 25 if paper_size == 'A5' else 20
final_image_color = cv2.cvtColor(final_image, cv2.COLOR_GRAY2BGR)
total_questions = len(correct_answers)
square_size = 60 if paper_size == 'A4' else 80 if paper_size == 'A5' else 60
half_square = square_size // 2

# Draw correct answer circles (green)
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

# Draw yellow circles for unanswered questions
circle_radius_yellow = 10 if paper_size == 'A4' else 15 if paper_size == 'A5' else 10

for question_number in range(1, total_questions + 1):
    if filled_circles_count.get(question_number, 0) == 0:
        correct_answer = mapped_answers[question_number - 1]
        
        for roi_key, circle_map in circle_mappings.items():
            x_offset, y_offset = rois[roi_key][0], rois[roi_key][1]
            
            for circle_key, (q_num, option, circle) in circle_map.items():
                if q_num == question_number and option == correct_answer:
                    x, y, r = circle
                    adjusted_x, adjusted_y = x + x_offset, y + y_offset
                    cv2.circle(final_image_color, (adjusted_x, adjusted_y), 
                              circle_radius_yellow, (0, 255, 255), -1)
                    break

# Draw rectangles for filled answers
for roi_key, circle_map in circle_mappings.items():
    x_offset, y_offset = rois[roi_key][0], rois[roi_key][1]
    
    for circle_key, (question_number, option, circle) in circle_map.items():
        if question_number <= total_questions:
            x, y, r = circle
            adjusted_x, adjusted_y = x + x_offset, y + y_offset
            
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

# Add correction guide
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

# Save final image
resized_image = cv2.resize(final_image_color, (1000, 1436))
random_number = random.randint(1000000000, 9999999999)
final_image_path = f'../public/uploads/corrects/{qr_code_data}.jpg'
cv2.imwrite(final_image_path, resized_image)

# Generate and print JSON output
json_result = generate_json_output(qr_code_data)
print(json_result)