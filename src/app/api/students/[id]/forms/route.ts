import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getCurrentUser } from "@/app/api/chatbot7/config/route";
import { ObjectId } from "mongodb";

interface FormSubmission {
  _id: string;
  formId: string;
  formTitle: string;
  answers: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  submittedBy: string;
  username: string;
  userName?: string;
  userFamily?: string;
  userType?: string;
}



interface StudentFormWithSubmission {
  _id: string;
  title: string;
  description?: string;
  submission: FormSubmission;
  submissionDate: string;
  lastUpdated: string;
}



export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const studentId = params.id;

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
    }

    // Get authenticated user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Check permissions - only school admins and teachers can access
    if (!user.userType || (user.userType !== "school" && user.userType !== "teacher")) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get domain from request headers
    const domain = request.headers.get("x-domain") || "localhost:3000";
    
    // Connect to domain-specific database
    const connection = await connectToDatabase(domain);

    // Validate ObjectId
    if (!ObjectId.isValid(studentId)) {
      return NextResponse.json(
        { error: "شناسه دانش‌آموز نامعتبر است" },
        { status: 400 }
      );
    }

    // Find the student in the domain database
    const student = await connection.collection("students").findOne({
      _id: new ObjectId(studentId),
      "data.schoolCode": user.schoolCode,
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Additional permission check for teachers
    if (user.userType === 'teacher') {
      const studentClassCodes = student.data.classCode?.map((c: { value: string }) => c.value) || [];
      
      // Get teacher's classes from teachers collection
      const teacher = await connection.collection("teachers").findOne({
        "data.teacherCode": user.username,
        "data.schoolCode": user.schoolCode,
      });

      if (!teacher) {
        return NextResponse.json(
          { error: "اطلاعات معلم یافت نشد" },
          { status: 403 }
        );
      }

      const teacherClassCodes = teacher.data.classCode?.map((c: { value: string }) => c.value) || [];
      
      // Check if teacher has access to any of student's classes
      const hasAccess = studentClassCodes.some((classCode: string) => 
        teacherClassCodes.includes(classCode)
      );

      if (!hasAccess) {
        return NextResponse.json(
          { error: 'Access denied to this student' },
          { status: 403 }
        );
      }
    }

    // Get student's username/code for matching form submissions
    const studentCode = student.data?.studentCode;
    const studentUsername = student.data?.username || studentCode;

    if (!studentCode) {
      return NextResponse.json({ 
        success: true, 
        forms: [],
        student: {
          id: student._id,
          name: student.data?.studentName,
          code: studentCode,
          schoolCode: student.data?.schoolCode
        },
        message: 'Student code not found'
      });
    }

    // Find all form submissions by this student in the formsInput collection
    const formSubmissions = await connection.collection('formsInput').find({
      $or: [
        { username: studentCode },
        { username: studentUsername },
        { submittedBy: studentCode },
        { submittedBy: studentUsername }
      ]
    }).toArray();

    // Get unique form IDs for efficient query (but we'll still show all submission instances)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const uniqueFormIds = [...new Set(formSubmissions.map((sub: any) => sub.formId))];

    // Get form definitions
    const formDefinitions = await connection.collection('forms').find({
      _id: { $in: uniqueFormIds.map((id: string) => new ObjectId(id)) }
    }).toArray();

    // Create a map of form definitions for easy lookup
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formDefMap = new Map<string, any>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    formDefinitions.forEach((form: any) => {
      formDefMap.set(form._id.toString(), form);
    });

    // Combine submissions with form definitions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const studentForms: StudentFormWithSubmission[] = formSubmissions.map((submission: any) => {
      const formDef = formDefMap.get(submission.formId);
      
              return {
          _id: submission._id.toString(),
          title: submission.formTitle || formDef?.title || `Form ${submission.formId.slice(-8)}`,
          description: formDef?.description,
          submission: {
            _id: submission._id.toString(),
            formId: submission.formId,
            formTitle: submission.formTitle || formDef?.title || 'Untitled Form',
            answers: submission.answers || {},
            createdAt: submission.createdAt,
            updatedAt: submission.updatedAt,
            submittedBy: submission.submittedBy || submission.username,
            username: submission.username,
            userName: submission.userName,
            userFamily: submission.userFamily,
            userType: submission.userType
          },
          submissionDate: submission.createdAt,
          lastUpdated: submission.updatedAt
        };
    });

    return NextResponse.json({
      success: true,
      forms: studentForms,
      student: {
        id: student._id,
        name: `${student.data?.studentName || ''} ${student.data?.studentFamily || ''}`.trim(),
        code: studentCode,
        schoolCode: student.data?.schoolCode
      },
      total: studentForms.length
    });

  } catch (error) {
    console.error('Error fetching student forms:', error);
    return NextResponse.json(
      { error: 'Failed to fetch student forms' },
      { status: 500 }
    );
  }
} 