import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

// Hardcoded schema with relationships - tailored for an educational management system
const detailedSchema = {
  "collections": [
    {
      "name": "schools",
      "description": "Contains information about educational institutions/schools. Most fields are nested within a 'data' object.",
      "fields": [
        { "name": "_id", "type": "ObjectId", "description": "Unique identifier for the school" },
        { "name": "data", "type": "Object", "description": "Container object for school data with nested fields" },
        { "name": "data.schoolName", "type": "String", "description": "Name of the school (e.g., 'مدرسه متوسطه دوم3')" },
        { "name": "data.schoolCode", "type": "String", "description": "Unique code identifying the school (e.g., '2295566177')" },
        { "name": "data.password", "type": "String", "description": "Password for school account" },
        { "name": "data.maghta", "type": "String", "description": "Educational level of the school (e.g., '3' for high school)" },
        { "name": "data.Grade", "type": "String", "description": "Grade level offered by the school (e.g., '10')" },
        { "name": "data.premisions", "type": "Array", "description": "Array of permission objects defining access rights" },
        { "name": "data.premisions[].systems", "type": "String", "description": "System name for permission (e.g., 'school', 'teacher', 'courses')" },
        { "name": "data.premisions[].access", "type": "Array<String>", "description": "List of allowed actions (e.g., 'edit', 'show', 'create')" },
        { "name": "data.isActive", "type": "Boolean", "description": "Whether the school is currently active" },
        { "name": "data.username", "type": "String", "description": "Username for school account login (often same as schoolCode)" },
        { "name": "data.domain", "type": "String", "description": "Custom domain for the school (e.g., 'pars3.farsamooz.ir')" },
        { "name": "createdAt", "type": "Date", "description": "When the record was created" },
        { "name": "updatedAt", "type": "Date", "description": "When the record was last updated" }
      ],
      "relationships": [
        { "with": "classes", "type": "oneToMany", "joinField": "data.schoolCode", "targetField": "data.schoolCode", "description": "A school has many classes" },
        { "with": "teachers", "type": "oneToMany", "joinField": "data.schoolCode", "targetField": "data.schoolCode", "description": "A school employs many teachers" },
        { "with": "students", "type": "oneToMany", "joinField": "data.schoolCode", "targetField": "data.schoolCode", "description": "A school has many students enrolled" },
        { "with": "courses", "type": "oneToMany", "joinField": "data.schoolCode", "targetField": "data.schoolCode", "description": "A school offers many courses" }
      ]
    },
    {
      "name": "classes",
      "description": "Represents classes/groups within schools. Contains nested teacher and student data.",
      "fields": [
        { "name": "_id", "type": "ObjectId", "description": "Unique identifier for the class" },
        { "name": "data", "type": "Object", "description": "Container object for class data with nested fields" },
        { "name": "data.classCode", "type": "String", "description": "Unique code identifying the class (e.g., '232', '200')" },
        { "name": "data.className", "type": "String", "description": "Name of the class (e.g., 'دوم سیب')" },
        { "name": "data.Grade", "type": "String", "description": "Grade level of the class (e.g., '7', '11')" },
        { "name": "data.schoolCode", "type": "String", "description": "Reference to the school this class belongs to" },
        { "name": "data.major", "type": "String", "description": "Major or specialization code for the class (e.g., '16000')" },
        { "name": "data.teachers", "type": "Array", "description": "Array of teacher-course assignments for this class" },
        { "name": "data.teachers[].teacherCode", "type": "String", "description": "Reference to teacher code (e.g., 'we', '102')" },
        { "name": "data.teachers[].courseCode", "type": "String", "description": "Reference to course code (e.g., '710', '11131')" },
        { "name": "data.teachers[].weeklySchedule", "type": "Array", "description": "Array of scheduled time slots" },
        { "name": "data.teachers[].weeklySchedule[].day", "type": "String", "description": "Day of the week in Persian (e.g., 'یکشنبه', 'سه شنبه')" },
        { "name": "data.teachers[].weeklySchedule[].timeSlot", "type": "String", "description": "Time slot number (e.g., '8', '9')" },
        { "name": "data.students", "type": "Array", "description": "Array of student data for this class" },
        { "name": "data.students[].studentCode", "type": "String", "description": "Student code (e.g., '2095845241')" },
        { "name": "data.students[].studentName", "type": "String", "description": "Student's first name (e.g., 'رضا')" },
        { "name": "data.students[].studentlname", "type": "String", "description": "Student's last name (e.g., 'شیری')" },
        { "name": "data.students[].phone", "type": "String", "description": "Student's phone number (e.g., '9175231560')" },
        { "name": "createdAt", "type": "Date", "description": "When the record was created" },
        { "name": "updatedAt", "type": "Date", "description": "When the record was last updated" }
      ],
      "relationships": [
        { "with": "schools", "type": "manyToOne", "joinField": "data.schoolCode", "targetField": "data.schoolCode", "description": "Each class belongs to a single school" },
        { "with": "teachers", "type": "manyToMany", "joinField": "data.teachers[].teacherCode", "targetField": "data.teacherCode", "description": "A class has many teachers" },
        { "with": "students", "type": "oneToMany", "joinField": "data.students[].studentCode", "targetField": "data.studentCode", "description": "A class has many students" },
        { "with": "courses", "type": "manyToMany", "joinField": "data.teachers[].courseCode", "targetField": "data.courseCode", "description": "A class offers many courses" }
      ]
    },
    {
      "name": "students",
      "description": "Contains information about students, including personal details and class enrollments.",
      "fields": [
        { "name": "_id", "type": "ObjectId", "description": "Unique identifier for the student" },
        { "name": "data", "type": "Object", "description": "Container object for student data with nested fields" },
        { "name": "data.studentName", "type": "String", "description": "Student's first name (e.g., 'محمد')" },
        { "name": "data.studentFamily", "type": "String", "description": "Student's last/family name (e.g., 'قاسمی')" },
        { "name": "data.studentCode", "type": "String", "description": "Unique code identifying the student (e.g., '2236523')" },
        { "name": "data.schoolCode", "type": "String", "description": "School code the student belongs to" },
        { "name": "data.classCode", "type": "Array<String>", "description": "Array of class codes the student is enrolled in" },
        { "name": "data.isActive", "type": "Boolean", "description": "Whether the student is currently active/enrolled" },
        { "name": "data.password", "type": "String", "description": "Password for student portal access" },
        { "name": "data.birthdate", "type": "String", "description": "Student's birthdate in Persian date format" },
        { "name": "data.fatherName", "type": "String", "description": "Student's father's name" },
        { "name": "data.nationalCode", "type": "String", "description": "National identification code" },
        { "name": "data.phoneNumber", "type": "String", "description": "Contact phone number" },
        { "name": "createdAt", "type": "Date", "description": "When the record was created" },
        { "name": "updatedAt", "type": "Date", "description": "When the record was last updated" }
      ],
      "relationships": [
        { "with": "schools", "type": "manyToOne", "joinField": "data.schoolCode", "targetField": "data.schoolCode", "description": "Each student belongs to a single school" },
        { "with": "classes", "type": "manyToMany", "joinField": "data.classCode", "targetField": "data.classCode", "description": "A student can be enrolled in multiple classes" },
        { "with": "grades", "type": "oneToMany", "joinField": "data.studentCode", "targetField": "data.studentCode", "description": "A student has many grade records" }
      ]
    },
    {
      "name": "teachers",
      "description": "Contains information about teachers, including contact details and class assignments.",
      "fields": [
        { "name": "_id", "type": "ObjectId", "description": "Unique identifier for the teacher" },
        { "name": "data", "type": "Object", "description": "Container object for teacher data with nested fields" },
        { "name": "data.teacherName", "type": "String", "description": "Teacher's first name (e.g., 'علی')" },
        { "name": "data.teacherFamily", "type": "String", "description": "Teacher's last/family name (e.g., 'محمدی')" },
        { "name": "data.teacherCode", "type": "String", "description": "Unique code identifying the teacher (e.g., '102')" },
        { "name": "data.schoolCode", "type": "String", "description": "School code the teacher is associated with" },
        { "name": "data.isActive", "type": "Boolean", "description": "Whether the teacher is currently active" },
        { "name": "data.password", "type": "String", "description": "Password for teacher portal access" },
        { "name": "data.phoneNumber", "type": "String", "description": "Contact phone number" },
        { "name": "data.email", "type": "String", "description": "Email address" },
        { "name": "data.expertise", "type": "Array<String>", "description": "Teacher's subject expertise/specializations" },
        { "name": "createdAt", "type": "Date", "description": "When the record was created" },
        { "name": "updatedAt", "type": "Date", "description": "When the record was last updated" }
      ],
      "relationships": [
        { "with": "schools", "type": "manyToOne", "joinField": "data.schoolCode", "targetField": "data.schoolCode", "description": "Each teacher belongs to a single school" },
        { "with": "classes", "type": "manyToMany", "joinField": "data.teacherCode", "targetField": "data.teachers[].teacherCode", "description": "A teacher can teach multiple classes" },
        { "with": "courses", "type": "manyToMany", "joinField": "data.expertise", "targetField": "data.courseCode", "description": "A teacher can teach multiple courses based on expertise" }
      ]
    },
    {
      "name": "courses",
      "description": "Contains information about academic courses offered.",
      "fields": [
        { "name": "_id", "type": "ObjectId", "description": "Unique identifier for the course" },
        { "name": "data", "type": "Object", "description": "Container object for course data with nested fields" },
        { "name": "data.courseCode", "type": "String", "description": "Unique code identifying the course (e.g., '710')" },
        { "name": "data.courseName", "type": "String", "description": "Name of the course (e.g., 'ریاضی', 'فیزیک')" },
        { "name": "data.schoolCode", "type": "String", "description": "School code the course is associated with" },
        { "name": "data.grade", "type": "String", "description": "Grade level for this course (e.g., '10')" },
        { "name": "data.units", "type": "Number", "description": "Academic units/credits for this course" },
        { "name": "data.isActive", "type": "Boolean", "description": "Whether the course is currently active/offered" },
        { "name": "createdAt", "type": "Date", "description": "When the record was created" },
        { "name": "updatedAt", "type": "Date", "description": "When the record was last updated" }
      ],
      "relationships": [
        { "with": "schools", "type": "manyToOne", "joinField": "data.schoolCode", "targetField": "data.schoolCode", "description": "Each course belongs to a single school" },
        { "with": "classes", "type": "manyToMany", "joinField": "data.courseCode", "targetField": "data.teachers[].courseCode", "description": "A course can be taught in multiple classes" },
        { "with": "teachers", "type": "manyToMany", "joinField": "data.courseCode", "targetField": "data.expertise", "description": "A course can be taught by multiple teachers" },
        { "with": "grades", "type": "oneToMany", "joinField": "data.courseCode", "targetField": "data.courseCode", "description": "A course has many grade records" }
      ]
    },
    {
      "name": "grades",
      "description": "Contains academic performance records for students by course.",
      "fields": [
        { "name": "_id", "type": "ObjectId", "description": "Unique identifier for the grade record" },
        { "name": "data", "type": "Object", "description": "Container object for grade data with nested fields" },
        { "name": "data.studentCode", "type": "String", "description": "Student code this grade belongs to" },
        { "name": "data.courseCode", "type": "String", "description": "Course code this grade is for" },
        { "name": "data.classCode", "type": "String", "description": "Class code where this grade was earned" },
        { "name": "data.teacherCode", "type": "String", "description": "Teacher code who assigned this grade" },
        { "name": "data.schoolCode", "type": "String", "description": "School code this grade belongs to" },
        { "name": "data.semester", "type": "String", "description": "Academic semester (e.g., '1402-1')" },
        { "name": "data.score", "type": "Number", "description": "Numerical score (typically 0-20 in Iranian system)" },
        { "name": "data.examType", "type": "String", "description": "Type of examination (e.g., 'mid-term', 'final')" },
        { "name": "data.date", "type": "String", "description": "Date the grade was recorded in Persian format" },
        { "name": "createdAt", "type": "Date", "description": "When the record was created" },
        { "name": "updatedAt", "type": "Date", "description": "When the record was last updated" }
      ],
      "relationships": [
        { "with": "students", "type": "manyToOne", "joinField": "data.studentCode", "targetField": "data.studentCode", "description": "Each grade belongs to a specific student" },
        { "with": "courses", "type": "manyToOne", "joinField": "data.courseCode", "targetField": "data.courseCode", "description": "Each grade is for a specific course" },
        { "with": "teachers", "type": "manyToOne", "joinField": "data.teacherCode", "targetField": "data.teacherCode", "description": "Each grade was assigned by a specific teacher" },
        { "with": "classes", "type": "manyToOne", "joinField": "data.classCode", "targetField": "data.classCode", "description": "Each grade was earned in a specific class" },
        { "with": "schools", "type": "manyToOne", "joinField": "data.schoolCode", "targetField": "data.schoolCode", "description": "Each grade belongs to a specific school" }
      ]
    }
  ],
  "common_query_examples": [
    {
      "farsi_query": "لیست تمام مدارس",
      "mongo_query": {
        "collection": "schools",
        "operation": "find",
        "query": {}
      }
    },
    {
      "farsi_query": "دانش آموزان کلاس با کد 232",
      "mongo_query": {
        "collection": "classes",
        "operation": "find",
        "query": {
          "data.classCode": "232"
        }
      }
    },
    {
      "farsi_query": "نمرات دانش آموز با کد 2236523",
      "mongo_query": {
        "collection": "grades",
        "operation": "find",
        "query": {
          "data.studentCode": "2236523"
        }
      }
    },
    {
      "farsi_query": "میانگین نمرات هر کلاس به تفکیک درس",
      "mongo_query": {
        "collection": "grades",
        "operation": "aggregate",
        "query": [
          {
            "$lookup": {
              "from": "courses",
              "localField": "data.courseCode",
              "foreignField": "data.courseCode",
              "as": "course"
            }
          },
          {
            "$group": {
              "_id": {
                "classCode": "$data.classCode",
                "courseCode": "$data.courseCode"
              },
              "averageScore": {
                "$avg": "$data.score"
              },
              "courseName": {
                "$first": "$course.data.courseName"
              }
            }
          },
          {
            "$sort": {
              "_id.classCode": 1,
              "averageScore": -1
            }
          }
        ]
      }
    },
    {
      "farsi_query": "معلمان مدرسه با کد 2295566177",
      "mongo_query": {
        "collection": "teachers",
        "operation": "find",
        "query": {
          "data.schoolCode": "2295566177"
        }
      }
    }
  ]
};

// GET endpoint to fetch the hardcoded schema
export async function GET() {
  logger.info("Fetching hardcoded MongoDB schema with relationships...");
  try {
    return NextResponse.json({ 
      success: true,
      schema: detailedSchema 
    });
  } catch (error) {
    logger.error("Error fetching hardcoded schema:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch schema" },
      { status: 500 }
    );
  }
}

// POST endpoint to accept custom schema (just returns the schema passed in)
export async function POST(req: Request) {
  try {
    const { schema } = await req.json();
    
    if (!schema) {
      return NextResponse.json(
        { success: false, error: "No schema provided" },
        { status: 400 }
      );
    }
    
    logger.info("Using custom MongoDB schema");
    
    // Return the provided schema
    return NextResponse.json({ 
      success: true,
      schema 
    });
  } catch (error) {
    logger.error("Error processing custom schema:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process custom schema" },
      { status: 500 }
    );
  }
} 