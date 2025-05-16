# Teacher Activities Report and Ranking System

This module provides comprehensive reporting and ranking of teacher activities within the school management system.

## Features

### 1. Summary Dashboard

- Total activities count by type (grades, presence records, assessments, comments, events)
- Most active and least active teachers
- Average activities per teacher
- Recently active teachers

### 2. Teacher Rankings

- Ranking by various metrics:
  - Total activities
  - Grade counts
  - Presence records
  - Assessments
  - Comments
  - Events
  - Last activity date
  - Class coverage
  - Student coverage

### 3. Detailed Teacher Activity

- Per-class breakdown of activities
- Class coverage percentages
- Activity timeline
- Detailed counts by activity type

### 4. Activity Visualization

- Activity trends over time
- Distribution of activities by type
- Daily activity patterns
- Comparative analytics

## Data Sources

The system analyzes data from the following sources:

- Class sheet records (grades, presence, assessments, notes)
- Teacher comments
- Events
- Class and student registrations

## API Endpoints

- `/api/teachers/activities` - Get summarized activity data for all teachers
- `/api/teachers/activities/[teacherCode]` - Get detailed activity data for a specific teacher

## Usage

1. Select a date range to analyze
2. Optionally filter by specific teacher
3. Navigate through the tabs to view different aspects of the data
4. Use the print button to generate a printer-friendly report

## Technical Details

- The system uses MongoDB aggregation pipelines for efficient data analysis
- Real-time data visualization with Recharts
- Print-friendly styling with custom CSS
- Responsive layout for both desktop and mobile viewing

## Integration Points

This module integrates with:

- Class Sheet system (for grade, presence, and assessment data)
- Teacher management system (for teacher information)
- Class management system (for class and student information)
- Comments and events system (for additional activity metrics)
