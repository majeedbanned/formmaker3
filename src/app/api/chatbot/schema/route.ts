import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";

// Real database schema based on actual MongoDB collections
const hardcodedSchemaReal = [
  {
    name: "schools",
    description: "Contains information about educational institutions/schools. Most fields are nested within a 'data' object.",
    fields: [
      { name: "_id", type: "ObjectId", description: "Unique identifier for the school" },
      { name: "data", type: "Object", description: "Container object for school data with nested fields" },
      { name: "data.schoolName", type: "String", description: "Name of the school (e.g., 'مدرسه متوسطه دوم3')" },
      { name: "data.schoolCode", type: "String", description: "Unique code identifying the school (e.g., '2295566177')" },
      { name: "data.password", type: "String", description: "Password for school account" },
      { name: "data.maghta", type: "String", description: "Educational level of the school (e.g., '3' for high school)" },
      { name: "data.Grade", type: "String", description: "Grade level offered by the school (e.g., '10')" },
      { name: "data.premisions", type: "Array", description: "Array of permission objects defining access rights" },
      { name: "data.premisions[].systems", type: "String", description: "System name for permission (e.g., 'school', 'teacher', 'courses')" },
      { name: "data.premisions[].access", type: "Array<String>", description: "List of allowed actions (e.g., 'edit', 'show', 'create')" },
      { name: "data.premisions_expanded", type: "Boolean", description: "UI state for expanded permissions display" },
      { name: "data.isActive", type: "Boolean", description: "Whether the school is currently active" },
      { name: "data.username", type: "String", description: "Username for school account login (often same as schoolCode)" },
      { name: "data.domain", type: "String", description: "Custom domain for the school (e.g., 'pars3.farsamooz.ir')" },
      { name: "createdAt", type: "Date", description: "When the record was created" },
      { name: "updatedAt", type: "Date", description: "When the record was last updated" },
      { name: "__v", type: "Number", description: "Version key used by MongoDB" }
    ],
    relationships: [
      { with: "classes", type: "oneToMany", joinField: "data.schoolCode", targetField: "data.schoolCode", description: "A school has many classes" },
      { with: "teachers", type: "oneToMany", joinField: "data.schoolCode", targetField: "data.schoolCode", description: "A school employs many teachers" },
      { with: "students", type: "oneToMany", joinField: "data.schoolCode", targetField: "data.schoolCode", description: "A school has many students enrolled" },
      { with: "courses", type: "oneToMany", joinField: "data.schoolCode", targetField: "data.schoolCode", description: "A school offers many courses" },
      { with: "forms", type: "oneToMany", joinField: "data.schoolCode", targetField: "data.schoolCode", description: "A school has many forms" },
      { with: "assessments", type: "oneToMany", joinField: "data.schoolCode", targetField: "schoolCode", description: "A school has many assessments" }
    ]
  },
  {
    name: "classes",
    description: "Represents classes/groups within schools. Contains nested teacher and student data.",
    fields: [
      { name: "_id", type: "ObjectId", description: "Unique identifier for the class" },
      { name: "data", type: "Object", description: "Container object for class data with nested fields" },
      { name: "data.classCode", type: "String", description: "Unique code identifying the class (e.g., '232', '200')" },
      { name: "data.className", type: "String", description: "Name of the class (e.g., 'دوم سیب')" },
      { name: "data.Grade", type: "String", description: "Grade level of the class (e.g., '7', '11')" },
      { name: "data.schoolCode", type: "String", description: "Reference to the school this class belongs to" },
      { name: "data.major", type: "String", description: "Major or specialization code for the class (e.g., '16000')" },
      { name: "data.teachers", type: "Array", description: "Array of teacher-course assignments for this class" },
      { name: "data.teachers[].teacherCode", type: "String", description: "Reference to teacher code (e.g., 'we', '102')" },
      { name: "data.teachers[].courseCode", type: "String", description: "Reference to course code (e.g., '710', '11131')" },
      { name: "data.teachers[].weeklySchedule", type: "Array", description: "Array of scheduled time slots" },
      { name: "data.teachers[].weeklySchedule[].day", type: "String", description: "Day of the week in Persian (e.g., 'یکشنبه', 'سه شنبه')" },
      { name: "data.teachers[].weeklySchedule[].timeSlot", type: "String", description: "Time slot number (e.g., '8', '9')" },
      { name: "data.teachers[].weeklySchedule_expanded", type: "Boolean", description: "UI state for expanded schedule display" },
      { name: "data.teachers_expanded", type: "Boolean", description: "UI state for expanded teachers display" },
      { name: "data.students", type: "Array", description: "Array of student data for this class" },
      { name: "data.students[].studentCode", type: "Number", description: "Student code (e.g., 2095845241)" },
      { name: "data.students[].studentName", type: "String", description: "Student's first name (e.g., 'رضا')" },
      { name: "data.students[].studentlname", type: "String", description: "Student's last name (e.g., 'شیری')" },
      { name: "data.students[].phone", type: "String", description: "Student's phone number (e.g., '9175231560')" },
      { name: "data.tags", type: "Array<String>", description: "Array of tags for the class (e.g., ['دهم', 'دوازدهم'])" },
      { name: "data.courseCode2", type: "Array", description: "Additional course codes with label and value" },
      { name: "data.courseCode2[].label", type: "String", description: "Course name label (e.g., 'عربي، زبان قرآن2')" },
      { name: "data.courseCode2[].value", type: "String", description: "Course code value (e.g., '11021')" },
      { name: "data.special_requirements", type: "Object", description: "Special requirements for the class" },
      { name: "data.special_requirements.type", type: "String", description: "Type of requirement (e.g., 'technical')" },
      { name: "data.special_requirements.technical", type: "Object", description: "Technical requirement details" },
      { name: "data.special_requirements.technical.equipment", type: "String", description: "Required equipment (e.g., 'computer')" },
      { name: "data.special_requirements.technical.quantity", type: "Number", description: "Quantity needed (e.g., 1)" },
      { name: "data.schedule_datetime", type: "String", description: "Schedule datetime in Persian format (e.g., '۱۴۰۴/۰۱/۱۰ ۱۰:۲۹')" },
      { name: "createdAt", type: "Date", description: "When the record was created" },
      { name: "updatedAt", type: "Date", description: "When the record was last updated" },
      { name: "__v", type: "Number", description: "Version key used by MongoDB" }
    ],
    relationships: [
      { with: "schools", type: "manyToOne", joinField: "data.schoolCode", targetField: "data.schoolCode", description: "A class belongs to one school" },
      { with: "teachers", type: "manyToMany", joinField: "data.teachers[].teacherCode", targetField: "data.teacherCode", description: "A class has many teachers" },
      { with: "students", type: "oneToMany", joinField: "data.classCode", targetField: "data.classCode", description: "A class has many students" },
      { with: "courses", type: "manyToMany", joinField: "data.teachers[].courseCode", targetField: "data.courseCode", description: "A class offers many courses" },
      { with: "classsheet", type: "oneToMany", joinField: "data.classCode", targetField: "classCode", description: "A class has many class sheets/attendance records" }
    ]
  },
  {
    name: "students",
    description: "Information about students enrolled in the school. Student data is nested in a 'data' object.",
    fields: [
      { name: "_id", type: "ObjectId", description: "Unique identifier for the student" },
      { name: "data", type: "Object", description: "Container object for student data with nested fields" },
      { name: "data.studentName", type: "String", description: "Student's first name (e.g., 'محمد')" },
      { name: "data.studentFamily", type: "String", description: "Student's last name (e.g., 'قاسمی')" },
      { name: "data.studentCode", type: "String", description: "Student's ID or registration number (e.g., '2236523')" },
      { name: "data.schoolCode", type: "String", description: "Reference to the school the student is enrolled in (e.g., '2295566177')" },
      { name: "data.password", type: "String", description: "Password for student account" },
      { name: "data.isActive", type: "Boolean", description: "Whether the student is currently active" },
      { name: "data.premisions", type: "Array", description: "Access permissions for the student" },
      { name: "data.premisions_expanded", type: "Boolean", description: "UI state for expanded permissions display" },
      { name: "data.classCode", type: "Array<String>", description: "Array of class codes the student is enrolled in (e.g., ['232', '45454'])" },
      { name: "createdAt", type: "Date", description: "When the record was created" },
      { name: "updatedAt", type: "Date", description: "When the record was last updated" },
      { name: "__v", type: "Number", description: "Version key used by MongoDB" }
    ],
    relationships: [
      { with: "schools", type: "manyToOne", joinField: "data.schoolCode", targetField: "data.schoolCode", description: "A student belongs to one school" },
      { with: "classes", type: "manyToMany", joinField: "data.classCode", targetField: "data.classCode", description: "A student can belong to multiple classes" },
      { with: "classsheet", type: "oneToMany", joinField: "data.studentCode", targetField: "studentCode", description: "A student has many attendance and grade records" }
    ]
  },
 
];





// {
//     name: "teachers",
//     description: "Information about teachers employed at the schools. Teacher data is nested in a 'data' object.",
//     fields: [
//       { name: "_id", type: "ObjectId", description: "Unique identifier for the teacher" },
//       { name: "data", type: "Object", description: "Container object for teacher data with nested fields" },
//       { name: "data.teacherName", type: "String", description: "Teacher's full name (e.g., 'محمد نیساری')" },
//       { name: "data.teacherCode", type: "String", description: "Teacher's ID or employee number (e.g., 'we', '102')" },
//       { name: "data.schoolCode", type: "String", description: "Reference to the school the teacher works at (e.g., '2295566177')" },
//       { name: "data.password", type: "String", description: "Password for teacher account" },
//       { name: "data.premisions", type: "Array", description: "Access permissions for the teacher" },
//       { name: "data.premisions_expanded", type: "Boolean", description: "UI state for expanded permissions display" },
//       { name: "data.isActive", type: "Boolean", description: "Whether the teacher is currently active" },
//       { name: "createdAt", type: "Date", description: "When the record was created" },
//       { name: "updatedAt", type: "Date", description: "When the record was last updated" },
//       { name: "__v", type: "Number", description: "Version key used by MongoDB" }
//     ],
//     relationships: [
//       { with: "schools", type: "manyToOne", joinField: "data.schoolCode", targetField: "data.schoolCode", description: "A teacher belongs to one school" },
//       { with: "classes", type: "manyToMany", joinField: "data.teacherCode", targetField: "data.teachers[].teacherCode", description: "A teacher teaches multiple classes" },
//       { with: "courses", type: "manyToMany", through: "classes.data.teachers", joinField: "data.teacherCode", targetField: "data.teachers[].teacherCode", description: "A teacher teaches multiple courses" },
//       { with: "assessments", type: "oneToMany", joinField: "data.teacherCode", targetField: "teacherCode", description: "A teacher creates many assessments" },
//       { with: "classsheet", type: "oneToMany", joinField: "data.teacherCode", targetField: "teacherCode", description: "A teacher records many class sessions" }
//     ]
//   },
//   {
//     name: "courses",
//     description: "Information about academic courses or subjects offered. Course data is nested in a 'data' object.",
//     fields: [
//       { name: "_id", type: "ObjectId", description: "Unique identifier for the course" },
//       { name: "data", type: "Object", description: "Container object for course data with nested fields" },
//       { name: "data.courseCode", type: "String", description: "Unique code identifying the course (e.g., '12331', '11131')" },
//       { name: "data.courseName", type: "String", description: "Name of the course or subject (e.g., 'فيزيك3', 'انسان و محيط زيست')" },
//       { name: "data.Grade", type: "String", description: "Recommended grade level for the course (e.g., '12', '11')" },
//       { name: "data.vahed", type: "Number", description: "Credit value for the course (e.g., 3, 2)" },
//       { name: "data.major", type: "String", description: "Reference to the major this course belongs to (e.g., '16000')" },
//       { name: "data.schoolCode", type: "String", description: "Reference to the school that offers this course (e.g., '2295566177')" },
//       { name: "createdAt", type: "Date", description: "When the record was created" },
//       { name: "updatedAt", type: "Date", description: "When the record was last updated" },
//       { name: "__v", type: "Number", description: "Version key used by MongoDB" }
//     ],
//     relationships: [
//       { with: "schools", type: "manyToOne", joinField: "data.schoolCode", targetField: "data.schoolCode", description: "A course is offered by one school" },
//       { with: "classes", type: "manyToMany", joinField: "data.courseCode", targetField: "data.teachers[].courseCode", description: "A course is taught in multiple classes" },
//       { with: "teachers", type: "manyToMany", through: "classes.data.teachers", description: "A course is taught by multiple teachers" },
//       { with: "majors", type: "manyToOne", joinField: "data.major", targetField: "majorCode", description: "A course belongs to one major" },
//       { with: "classsheet", type: "oneToMany", joinField: "data.courseCode", targetField: "courseCode", description: "A course has many class sessions and grades" }
//     ]
//   },
//   {
//     name: "classsheet",
//     description: "Records of class sessions, attendance, and grades. Unlike other collections, fields are not nested in a 'data' object.",
//     fields: [
//       { name: "_id", type: "ObjectId", description: "Unique identifier for the class sheet record" },
//       { name: "classCode", type: "String", description: "Reference to the class (e.g., '232')" },
//       { name: "courseCode", type: "String", description: "Reference to the course (e.g., '11131')" },
//       { name: "date", type: "String", description: "Date of the class session (e.g., '2025-03-24')" },
//       { name: "schoolCode", type: "String", description: "Reference to the school (e.g., '2295566177')" },
//       { name: "studentCode", type: "Number", description: "Reference to the student (e.g., 2295845241)" },
//       { name: "teacherCode", type: "String", description: "Reference to the teacher (e.g., '102')" },
//       { name: "timeSlot", type: "String", description: "Time slot of the class session (e.g., '9')" },
//       { name: "assessments", type: "Array", description: "Assessments given in this session" },
//       { name: "grades", type: "Array", description: "Grades recorded in this session" },
//       { name: "presenceStatus", type: "String", description: "Attendance status (e.g., 'present', 'absent', 'late')" },
//       { name: "descriptiveStatus", type: "String", description: "Descriptive status or comments" },
//       { name: "note", type: "String", description: "Additional notes" },
//       { name: "createdAt", type: "Date", description: "When the record was created" },
//       { name: "updatedAt", type: "Date", description: "When the record was last updated" }
//     ],
//     relationships: [
//       { with: "schools", type: "manyToOne", joinField: "schoolCode", targetField: "data.schoolCode", description: "A class sheet belongs to one school" },
//       { with: "classes", type: "manyToOne", joinField: "classCode", targetField: "data.classCode", description: "A class sheet is for one class" },
//       { with: "courses", type: "manyToOne", joinField: "courseCode", targetField: "data.courseCode", description: "A class sheet is for one course" },
//       { with: "students", type: "manyToOne", joinField: "studentCode", targetField: "data.studentCode", description: "A class sheet is for one student" },
//       { with: "teachers", type: "manyToOne", joinField: "teacherCode", targetField: "data.teacherCode", description: "A class sheet is recorded by one teacher" },
//       { with: "assessments", type: "manyToMany", joinField: "assessments", targetField: "_id", description: "A class sheet can have many assessments" }
//     ]
//   },
//   {
//     name: "assessments",
//     description: "Evaluation criteria and assessments used by teachers. Unlike other collections, fields are not nested in a 'data' object.",
//     fields: [
//       { name: "_id", type: "ObjectId", description: "Unique identifier for the assessment" },
//       { name: "schoolCode", type: "String", description: "Reference to the school (e.g., '2295566177')" },
//       { name: "teacherCode", type: "String", description: "Reference to the teacher who created the assessment (e.g., '102')" },
//       { name: "type", type: "String", description: "Type of assessment (e.g., 'title', 'value')" },
//       { name: "value", type: "String", description: "Content or value of the assessment (e.g., 'salam', 'aliii')" },
//       { name: "isGlobal", type: "Boolean", description: "Whether the assessment is globally available" },
//       { name: "createdAt", type: "Date", description: "When the assessment was created" }
//     ],
//     relationships: [
//       { with: "schools", type: "manyToOne", joinField: "schoolCode", targetField: "data.schoolCode", description: "An assessment belongs to one school" },
//       { with: "teachers", type: "manyToOne", joinField: "teacherCode", targetField: "data.teacherCode", description: "An assessment is created by one teacher" },
//       { with: "classsheet", type: "manyToMany", joinField: "_id", targetField: "assessments", description: "An assessment can be used in many class sheets" }
//     ]
//   },
//   {
//     name: "forms",
//     description: "Forms or templates used in the school. Form data is nested in a 'data' object.",
//     fields: [
//       { name: "_id", type: "ObjectId", description: "Unique identifier for the form" },
//       { name: "data", type: "Object", description: "Container object for form data with nested fields" },
//       { name: "data.formCode", type: "String", description: "Unique code identifying the form (e.g., 'fg')" },
//       { name: "data.formName", type: "String", description: "Name of the form (e.g., 'hg')" },
//       { name: "data.formType", type: "String", description: "Type of form (e.g., '1')" },
//       { name: "data.startDate", type: "String", description: "Start date for form availability in Persian format (e.g., '۱۴۰۴/۰۱/۰۴ ۱۲:۲۵')" },
//       { name: "data.endDate", type: "String", description: "End date for form availability in Persian format (e.g., '۱۴۰۴/۰۱/۱۹ ۰۴:۰۲')" },
//       { name: "data.schoolCode", type: "String", description: "Reference to the school (e.g., '2295566177')" },
//       { name: "data.formFields", type: "Array", description: "Array of field definitions for the form" },
//       { name: "data.formFields[].fieldType", type: "String", description: "Type of field (e.g., 'date', 'file')" },
//       { name: "data.formFields[].fieldTitle", type: "String", description: "Title of the field (e.g., '3453', 'ttttt')" },
//       { name: "data.formFields[].required", type: "Boolean|String", description: "Whether the field is required (true, false, or empty string)" },
//       { name: "data.formFields[].items", type: "String", description: "Items for the field (e.g., '345', '626')" },
//       { name: "data.formFields[].fieldOrder", type: "String", description: "Order of the field (e.g., '1')" },
//       { name: "data.formFields_expanded", type: "Boolean", description: "UI state for expanded form fields display" },
//       { name: "data.Access_expanded", type: "Boolean", description: "UI state for expanded access display" },
//       { name: "createdAt", type: "Date", description: "When the form was created" },
//       { name: "updatedAt", type: "Date", description: "When the form was last updated" },
//       { name: "__v", type: "Number", description: "Version key used by MongoDB" }
//     ],
//     relationships: [
//       { with: "schools", type: "manyToOne", joinField: "data.schoolCode", targetField: "data.schoolCode", description: "A form belongs to one school" },
//       { with: "formsInput", type: "oneToMany", joinField: "_id", targetField: "formId", description: "A form can have many submitted instances" }
//     ]
//   },
//   {
//     name: "formsInput",
//     description: "Submitted instances of forms with user data. Unlike most collections, most fields are not nested in a 'data' object.",
//     fields: [
//       { name: "_id", type: "ObjectId", description: "Unique identifier for the form submission" },
//       { name: "formId", type: "ObjectId", description: "Reference to the form template (e.g., '67e6f50d377158dda562f59b')" },
//       { name: "schoolCode", type: "String", description: "Reference to the school (e.g., '2295566177')" },
//       { name: "username", type: "String", description: "Username of the submitter (e.g., '2295566177')" },
//       { name: "answers", type: "Object", description: "Form data submitted by the user" },
//       { name: "answers.field_N", type: "Mixed", description: "Form field answers where N is the field index" },
//       { name: "answers.field_0", type: "Object", description: "Example of a file upload field answer" },
//       { name: "answers.field_0.filename", type: "String", description: "Uploaded file name (e.g., '355b9679-0bf7-4ad2-becf-cae165087833.png')" },
//       { name: "answers.field_0.originalName", type: "String", description: "Original file name (e.g., 'cmsavard1.png.png')" },
//       { name: "answers.field_0.size", type: "Number", description: "File size in bytes (e.g., 24400)" },
//       { name: "answers.field_0.type", type: "String", description: "File MIME type (e.g., 'image/png')" },
//       { name: "answers.field_0.path", type: "String", description: "File storage path" },
//       { name: "answers.field_0.uploadedAt", type: "Date", description: "When the file was uploaded" },
//       { name: "formName", type: "String", description: "Name of the form (e.g., 'لیبلی')" },
//       { name: "createdAt", type: "Date", description: "When the submission was created" },
//       { name: "updatedAt", type: "Date", description: "When the submission was last updated" },
//       { name: "persianDate", type: "String", description: "Date of submission in Persian calendar (e.g., '۹ فروردین ۱۴۰۴')" },
//       { name: "persianTime", type: "String", description: "Time of submission in Persian format (e.g., '۱۷:۴۷:۰۳')" }
//     ],
//     relationships: [
//       { with: "forms", type: "manyToOne", joinField: "formId", targetField: "_id", description: "A form submission is based on one form template" },
//       { with: "schools", type: "manyToOne", joinField: "schoolCode", targetField: "data.schoolCode", description: "A form submission belongs to one school" }
//     ]
//   }

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_: NextRequest) {
  try {
    logger.info("Fetching hardcoded database schema");
    
    return NextResponse.json(
      { 
        success: true, 
        schema: hardcodedSchemaReal // Using the real schema based on the MongoDB structure
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error("Error fetching database schema:", error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to fetch database schema",
        error: (error as Error).message
      },
      { status: 500 }
    );
  }
}
