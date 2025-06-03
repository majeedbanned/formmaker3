import { NextResponse, NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getCurrentUser } from "../chatbot7/config/route";

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

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get domain from headers (or use default)
    const domain = req.headers.get("x-domain") || "localhost:3000";

    // Connect to MongoDB directly using the utility
    const connection = await connectToDatabase(domain);
    if (!connection) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }
    const collection = connection.collection('exam');
    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 500 });
    }

    // Base query for the user's school
    const query = { 'data.schoolCode': user.schoolCode };

    // For school admins: return all exams (no additional filtering)
    if (user.userType === 'school') {
      const exams = await collection.find(query, { sort: { createdAt: -1 } }).toArray();
      return NextResponse.json(exams);
    }

    // For teachers and students: filter based on recipients
    // We need to get all exams and then filter them based on access
    const allExams = await collection.find(query, { sort: { createdAt: -1 } }).toArray() as unknown as Exam[];
    
    // Filter exams based on user access
    const filteredExams = allExams.filter((exam) => hasExamAccess(exam, user as unknown as User));

    return NextResponse.json(filteredExams);
    
  } catch (error) {
    console.error('Error fetching exams:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 