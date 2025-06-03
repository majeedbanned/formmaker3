import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getCurrentUser } from "@/app/api/chatbot7/config/route";
import { ObjectId } from "mongodb";

// Type definitions for better type safety
interface ExamRecipient {
  label?: string;
  value: string;
  [key: string]: unknown;
}

interface ExamRecipients {
  students?: ExamRecipient[];
  groups?: ExamRecipient[];
  classCode?: ExamRecipient[];
  teachers?: ExamRecipient[];
}

interface ExamData {
  examCode: string;
  examName: string;
  schoolCode: string;
  recipients?: ExamRecipients;
  [key: string]: unknown;
}

interface Exam {
  _id: string;
  data: ExamData;
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: string;
  userType: 'school' | 'teacher' | 'student';
  schoolCode: string;
  username: string;
  name: string;
  role: string;
  classCode?: ExamRecipient[];
  groups?: ExamRecipient[];
}

/**
 * Check if a user has access to an exam based on recipients
 */
function hasExamAccess(exam: Exam, user: User): boolean {
  // School admins can see all exams
  if (user.userType === 'school') {
    return true;
  }

  const recipients = exam.data?.recipients;
  if (!recipients) {
    return false; // If no recipients defined, no access
  }

  // For teachers
  if (user.userType === 'teacher') {
    // Check if teacher is directly listed in recipients.teachers
    if (recipients.teachers && Array.isArray(recipients.teachers)) {
      const hasDirectAccess = recipients.teachers.some((teacher: ExamRecipient | string) => {
        const teacherValue = typeof teacher === 'string' ? teacher : teacher.value;
        return teacherValue === user.username;
      });
      if (hasDirectAccess) return true;
    }
  }

  // For students
  if (user.userType === 'student') {
    // Check if student is directly listed in recipients.students
    if (recipients.students && Array.isArray(recipients.students)) {
      const hasDirectAccess = recipients.students.some((student: ExamRecipient | string) => {
        const studentValue = typeof student === 'string' ? student : student.value;
        return studentValue === user.username;
      });
      if (hasDirectAccess) return true;
    }

    // Check if student's class is in the recipients
    if (recipients.classCode && Array.isArray(recipients.classCode) && user.classCode) {
      const studentClassCodes = user.classCode.map((c: ExamRecipient) => c.value);
      const hasClassAccess = recipients.classCode.some((classItem: ExamRecipient | string) => {
        const classValue = typeof classItem === 'string' ? classItem : classItem.value;
        return studentClassCodes.includes(classValue);
      });
      if (hasClassAccess) return true;
    }

    // Check if student's group is in the recipients
    if (recipients.groups && Array.isArray(recipients.groups) && user.groups) {
      const studentGroupIds = user.groups.map((g: ExamRecipient) => g.value);
      const hasGroupAccess = recipients.groups.some((group: ExamRecipient | string) => {
        const groupValue = typeof group === 'string' ? group : group.value;
        return studentGroupIds.includes(groupValue);
      });
      if (hasGroupAccess) return true;
    }
  }

  return false;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get the exam ID from params
    const examId = (await params).id;
    
    // Get current user and verify authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Get school code from user
    const schoolCode = user.schoolCode;
    if (!schoolCode) {
      return NextResponse.json({ message: "School code not found" }, { status: 400 });
    }

    // Get domain from request headers or use default
    const domain = request.headers.get("x-domain") || "localhost:3000";

    // Connect to database
    const connection = await connectToDatabase(domain);
    
    // Get collections
    const examCollection = connection.collection("exam");

    // Get exam details
    let exam;
    try {
      exam = await examCollection.findOne({ _id: new ObjectId(examId) });
    } catch {
      // If ID is not a valid ObjectId, try to find it by examCode
      exam = await examCollection.findOne({ "data.examCode": examId });
    }

    if (!exam) {
      return NextResponse.json(
        { message: "Exam not found" },
        { status: 404 }
      );
    }

    // Check if exam belongs to the user's school
    if (exam.data.schoolCode !== schoolCode) {
      return NextResponse.json(
        { message: "Not authorized to view this exam" },
        { status: 403 }
      );
    }

    // Check access based on recipients and user role
    if (!hasExamAccess(exam as unknown as Exam, user as unknown as User)) {
      return NextResponse.json(
        { message: "You don't have access to this exam" },
        { status: 403 }
      );
    }

    return NextResponse.json(exam);
  } catch (error) {
    console.error("Error fetching exam:", error);
    return NextResponse.json(
      { message: "Failed to fetch exam" },
      { status: 500 }
    );
  }
} 