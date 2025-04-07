import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { connectToDatabase } from "@/lib/mongodb";
import path from "path";
import fs from "fs";

// Real database schema based on actual MongoDB collections

const enhancedhardcodedSchema=[
    {
      "name": "schools",
      "collectionPurpose": "Holds account and configuration info for each school.",
      "description": "Contains information about educational institutions/schools. Most fields are nested inside a 'data' object.",
      "fields": [
        {
          "name": "_id",
          "type": "ObjectId",
          "description": "MongoDB unique identifier."
        },
        {
          "name": "data.schoolName",
          "type": "String",
          "description": "School name, e.g., 'مدرسه متوسطه دوم3'"
        },
        {
          "name": "data.schoolCode",
          "type": "String",
          "description": "Unique school identifier, e.g., '2295566177'"
        },
        {
          "name": "data.username",
          "type": "String",
          "description": "Username for login, often same as schoolCode."
        },
        {
          "name": "data.password",
          "type": "String",
          "description": "Password for the school's account login."
        },
        {
          "name": "data.maghta",
          "type": "String",
          "description": "Education level (e.g., '3' = High School)."
        },
        {
          "name": "data.Grade",
          "type": "String",
          "description": "Grade level offered, e.g., '10'"
        },
        {
          "name": "data.isActive",
          "type": "Boolean",
          "description": "Whether the school is currently active or not."
        },
        {
          "name": "data.domain",
          "type": "String",
          "description": "School's subdomain (e.g., 'pars3.farsamooz.ir')."
        },
        {
          "name": "data.premisions",
          "type": "Array",
          "description": "Array of access permissions for systems, e.g., [{ systems: 'teacher', access: ['edit', 'view'] }]"
        },
        {
          "name": "data.premisions[].systems",
          "type": "String",
          "description": "Name of the system (e.g., 'teacher', 'courses')."
        },
        {
          "name": "data.premisions[].access",
          "type": "Array<String>",
          "description": "Allowed actions (e.g., ['edit', 'show'])"
        },
        {
          "name": "data.premisions_expanded",
          "type": "Boolean",
          "description": "UI toggle for permissions section"
        },
        {
          "name": "createdAt",
          "type": "Date",
          "description": "Record creation timestamp."
        },
        {
          "name": "updatedAt",
          "type": "Date",
          "description": "Record update timestamp."
        },
        {
          "name": "__v",
          "type": "Number",
          "description": "MongoDB internal version key."
        }
      ],
      "relationships": [
        {
          "with": "classes",
          "type": "oneToMany",
          "joinField": "data.schoolCode",
          "targetField": "data.schoolCode",
          "description": "A school has many classes."
        },
        {
          "with": "teachers",
          "type": "oneToMany",
          "joinField": "data.schoolCode",
          "targetField": "data.schoolCode",
          "description": "A school employs many teachers."
        },
        {
          "with": "students",
          "type": "oneToMany",
          "joinField": "data.schoolCode",
          "targetField": "data.schoolCode",
          "description": "A school enrolls many students."
        },
        {
          "with": "courses",
          "type": "oneToMany",
          "joinField": "data.schoolCode",
          "targetField": "data.schoolCode",
          "description": "A school offers many courses."
        },
        {
          "with": "forms",
          "type": "oneToMany",
          "joinField": "data.schoolCode",
          "targetField": "data.schoolCode",
          "description": "A school owns many forms."
        },
        {
          "with": "assessments",
          "type": "oneToMany",
          "joinField": "data.schoolCode",
          "targetField": "schoolCode",
          "description": "A school has many assessments."
        }
      ]
    },
    {
      "name": "classes",
      "collectionPurpose": "Represents classrooms and teacher-student groupings within schools.",
      "fields": [
        {
          "name": "_id",
          "type": "ObjectId",
          "description": "MongoDB unique ID."
        },
        {
          "name": "data.classCode",
          "type": "String",
          "description": "Unique class code, e.g., '232'"
        },
        {
          "name": "data.className",
          "type": "String",
          "description": "Name of the class, e.g., 'دوم سیب'"
        },
        {
          "name": "data.Grade",
          "type": "String",
          "description": "Grade level, e.g., '7'"
        },
        {
          "name": "data.schoolCode",
          "type": "String",
          "description": "Linked school code."
        },
        {
          "name": "data.major",
          "type": "String",
          "description": "Specialization (e.g., '16000')."
        },
        {
          "name": "data.tags",
          "type": "Array<String>",
          "description": "Tags for filtering/search, e.g., ['دهم', 'نهم']"
        },
        {
          "name": "data.schedule_datetime",
          "type": "String",
          "description": "Class schedule in Persian date-time, e.g., '۱۴۰۴/۰۱/۱۰ ۱۰:۲۹'"
        },
        {
          "name": "data.teachers",
          "type": "Array",
          "description": "List of assigned teachers and courses for this class."
        },
        {
          "name": "data.teachers[].teacherCode",
          "type": "String",
          "description": "Teacher code, e.g., '102'"
        },
        {
          "name": "data.teachers[].courseCode",
          "type": "String",
          "description": "Course code, e.g., '11021'"
        },
        {
          "name": "data.teachers[].weeklySchedule",
          "type": "Array",
          "description": "Array of weekly class schedules (day/timeSlot)."
        },
        {
          "name": "data.teachers[].weeklySchedule[].day",
          "type": "String",
          "description": "Day name, e.g., 'سه شنبه'"
        },
        {
          "name": "data.teachers[].weeklySchedule[].timeSlot",
          "type": "String",
          "description": "Time slot, e.g., '8'"
        },
        {
          "name": "data.students",
          "type": "Array",
          "description": "List of students enrolled in the class."
        },
        {
          "name": "data.students[].studentCode",
          "type": "Number",
          "description": "Student unique code, e.g., 2095845241"
        },
        {
          "name": "data.students[].studentName",
          "type": "String",
          "description": "Student's first name, e.g., 'رضا'"
        },
        {
          "name": "data.students[].studentlname",
          "type": "String",
          "description": "Student's last name, e.g., 'شیری'"
        },
        {
          "name": "data.students[].phone",
          "type": "String",
          "description": "Student's contact number, e.g., '9175231560'"
        },
        {
          "name": "data.special_requirements",
          "type": "Object",
          "description": "Special class needs (e.g., technical setup)."
        },
        {
          "name": "data.special_requirements.type",
          "type": "String",
          "description": "Type of requirement (e.g., 'technical')."
        },
        {
          "name": "data.special_requirements.technical.equipment",
          "type": "String",
          "description": "Equipment needed, e.g., 'projector'"
        },
        {
          "name": "data.special_requirements.technical.quantity",
          "type": "Number",
          "description": "Quantity needed, e.g., 2"
        },
        {
          "name": "createdAt",
          "type": "Date",
          "description": "Creation time."
        },
        {
          "name": "updatedAt",
          "type": "Date",
          "description": "Last update time."
        }
      ],
      "relationships": [
        {
          "with": "schools",
          "type": "manyToOne",
          "joinField": "data.schoolCode",
          "targetField": "data.schoolCode",
          "description": "Belongs to one school."
        },
        {
          "with": "students",
          "type": "oneToMany",
          "joinField": "data.classCode",
          "targetField": "data.classCode",
          "description": "Has many students."
        },
        {
          "with": "classsheet",
          "type": "oneToMany",
          "joinField": "data.classCode",
          "targetField": "classCode",
          "description": "Linked to classsheet records."
        },
        {
          "with": "teachers",
          "type": "manyToMany",
          "joinField": "data.teachers[].teacherCode",
          "targetField": "data.teacherCode",
          "description": "Many teachers assigned."
        },
        {
          "with": "courses",
          "type": "manyToMany",
          "joinField": "data.teachers[].courseCode",
          "targetField": "data.courseCode",
          "description": "Courses taught in the class."
        }
      ]
    },
    {
      "name": "students",
      "collectionPurpose": "Contains personal and academic info for students.",
      "fields": [
        {
          "name": "_id",
          "type": "ObjectId",
          "description": "MongoDB unique ID."
        },
        {
          "name": "data.studentName",
          "type": "String",
          "description": "First name, e.g., 'محمد'"
        },
        {
          "name": "data.studentFamily",
          "type": "String",
          "description": "Last name, e.g., 'قاسمی'"
        },
        {
          "name": "data.studentCode",
          "type": "String",
          "description": "Student code/ID, e.g., '2236523'"
        },
        {
          "name": "data.schoolCode",
          "type": "String",
          "description": "School the student belongs to."
        },
        {
          "name": "data.classCode",
          "type": "Array<String>",
          "description": "Classes student is enrolled in, e.g., ['232']"
        },
        {
          "name": "data.isActive",
          "type": "Boolean",
          "description": "Is the student currently enrolled?"
        },
        {
          "name": "data.password",
          "type": "String",
          "description": "Password for student portal login."
        },
        {
          "name": "data.premisions",
          "type": "Array",
          "description": "Access rights for specific systems."
        },
        {
          "name": "data.premisions_expanded",
          "type": "Boolean",
          "description": "UI toggle for permissions section."
        },
        {
          "name": "createdAt",
          "type": "Date",
          "description": "Creation timestamp."
        },
        {
          "name": "updatedAt",
          "type": "Date",
          "description": "Last update timestamp."
        }
      ],
      "relationships": [
        {
          "with": "schools",
          "type": "manyToOne",
          "joinField": "data.schoolCode",
          "targetField": "data.schoolCode",
          "description": "Belongs to one school."
        },
        {
          "with": "classes",
          "type": "manyToMany",
          "joinField": "data.classCode",
          "targetField": "data.classCode",
          "description": "Enrolled in many classes."
        },
        {
          "with": "classsheet",
          "type": "oneToMany",
          "joinField": "data.studentCode",
          "targetField": "studentCode",
          "description": "Attendance and academic records."
        }
      ]
    }
  ]
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

// Hardcoded schema with relationships
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
      { "relationships": [
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(req: Request) {
  console.log("Fetching MongoDB schema...");
  try {
    // We're now using the hardcoded schema instead of dynamically fetching it
    // This ensures consistent relationships and structure for the AI
    
    return NextResponse.json({ schema: detailedSchema });
  } catch (error) {
    console.error("Error fetching schema:", error);
    return NextResponse.json(
      { error: "Failed to fetch schema" },
      { status: 500 }
    );
  }
}

// For POST requests - can be used to upload custom schemas
export async function POST(req: Request) {
  try {
    const { schema } = await req.json();
    
    if (!schema) {
      return NextResponse.json(
        { error: "No schema provided" },
        { status: 400 }
      );
    }
    
    // Return the newly uploaded schema
    return NextResponse.json({ schema });
  } catch (error) {
    console.error("Error processing schema upload:", error);
    return NextResponse.json(
      { error: "Failed to process schema upload" },
      { status: 500 }
    );
  }
}
