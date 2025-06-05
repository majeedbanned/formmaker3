import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getCurrentUser } from "../../chatbot7/config/route";

export async function POST(request: NextRequest) {
  try {
    // Get user and verify authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { userType, userCode, schoolCode, classCode } = body;

    // Get domain from request headers
    const domain = request.headers.get("x-domain") || "localhost:3000";
    
    // Connect to database
    const connection = await connectToDatabase(domain);

    let birthdays: any[] = [];

    if (userType === "school") {
      // Admins see all students and teachers
      const [students, teachers] = await Promise.all([
        connection.collection("students")
          .find({
            "data.schoolCode": schoolCode,
            "data.birthDate": { $exists: true, $ne: "" }
          })
          .project({
            "data.studentCode": 1,
            "data.studentName": 1,
            "data.studentFamily": 1,
            "data.birthDate": 1,
            "data.avatar": 1,
            "data.classCode": 1
          })
          .toArray(),
        
        connection.collection("teachers")
          .find({
            "data.schoolCode": schoolCode,
            "data.birthDate": { $exists: true, $ne: "" }
          })
          .project({
            "data.teacherCode": 1,
            "data.teacherName": 1,
            "data.birthDate": 1,
            "data.avatar": 1
          })
          .toArray()
      ]);

      // Process students
      students.forEach((student) => {
        const className = student.data.classCode && student.data.classCode.length > 0 
          ? student.data.classCode[0].label 
          : undefined;
        
        birthdays.push({
          _id: student._id,
          code: student.data.studentCode,
          name: `${student.data.studentName || ''} ${student.data.studentFamily || ''}`.trim(),
          type: "student",
          birthDate: student.data.birthDate,
          avatar: student.data.avatar?.path,
          className
        });
      });

      // Process teachers
      teachers.forEach((teacher) => {
        birthdays.push({
          _id: teacher._id,
          code: teacher.data.teacherCode,
          name: teacher.data.teacherName || teacher.data.teacherCode,
          type: "teacher",
          birthDate: teacher.data.birthDate,
          avatar: teacher.data.avatar?.path
        });
      });

    } else if (userType === "teacher") {
      // Teachers see all teachers and their own students
      const [teachers, classes] = await Promise.all([
        connection.collection("teachers")
          .find({
            "data.schoolCode": schoolCode,
            "data.birthDate": { $exists: true, $ne: "" }
          })
          .project({
            "data.teacherCode": 1,
            "data.teacherName": 1,
            "data.birthDate": 1,
            "data.avatar": 1
          })
          .toArray(),
        
        connection.collection("classes")
          .find({
            "data.schoolCode": schoolCode,
            "data.teachers.teacherCode": userCode
          })
          .project({
            "data.classCode": 1,
            "data.className": 1,
            "data.students": 1
          })
          .toArray()
      ]);

      // Add all teachers
      teachers.forEach((teacher) => {
        birthdays.push({
          _id: teacher._id,
          code: teacher.data.teacherCode,
          name: teacher.data.teacherName || teacher.data.teacherCode,
          type: "teacher",
          birthDate: teacher.data.birthDate,
          avatar: teacher.data.avatar?.path
        });
      });

      // Get student codes from teacher's classes
      const studentCodes: string[] = [];
      const classMap: { [key: string]: string } = {};
      
      classes.forEach((cls) => {
        if (cls.data.students) {
          cls.data.students.forEach((student: any) => {
            studentCodes.push(student.studentCode);
            classMap[student.studentCode] = cls.data.className;
          });
        }
      });

      // Get student details
      if (studentCodes.length > 0) {
        const students = await connection.collection("students")
          .find({
            "data.studentCode": { $in: studentCodes },
            "data.schoolCode": schoolCode,
            "data.birthDate": { $exists: true, $ne: "" }
          })
          .project({
            "data.studentCode": 1,
            "data.studentName": 1,
            "data.studentFamily": 1,
            "data.birthDate": 1,
            "data.avatar": 1
          })
          .toArray();

        students.forEach((student) => {
          birthdays.push({
            _id: student._id,
            code: student.data.studentCode,
            name: `${student.data.studentName || ''} ${student.data.studentFamily || ''}`.trim(),
            type: "student",
            birthDate: student.data.birthDate,
            avatar: student.data.avatar?.path,
            className: classMap[student.data.studentCode]
          });
        });
      }

    } else if (userType === "student") {
      // Students see classmates and their teachers
      if (!classCode || classCode.length === 0) {
        return NextResponse.json({ birthdays: [] });
      }

      const studentClassCodes = classCode.map((cls: any) => cls.value);
      
      const [classes, teachers] = await Promise.all([
        connection.collection("classes")
          .find({
            "data.schoolCode": schoolCode,
            "data.classCode": { $in: studentClassCodes }
          })
          .project({
            "data.classCode": 1,
            "data.className": 1,
            "data.students": 1,
            "data.teachers": 1
          })
          .toArray(),
        
        connection.collection("teachers")
          .find({
            "data.schoolCode": schoolCode,
            "data.birthDate": { $exists: true, $ne: "" }
          })
          .project({
            "data.teacherCode": 1,
            "data.teacherName": 1,
            "data.birthDate": 1,
            "data.avatar": 1
          })
          .toArray()
      ]);

      // Get classmate codes and teacher codes
      const classmatesCodes: string[] = [];
      const teacherCodes: string[] = [];
      const classMap: { [key: string]: string } = {};

      classes.forEach((cls) => {
        // Add classmates
        if (cls.data.students) {
          cls.data.students.forEach((student: any) => {
            if (student.studentCode !== userCode) { // Exclude self
              classmatesCodes.push(student.studentCode);
              classMap[student.studentCode] = cls.data.className;
            }
          });
        }

        // Add teachers from this class
        if (cls.data.teachers) {
          cls.data.teachers.forEach((teacher: any) => {
            if (!teacherCodes.includes(teacher.teacherCode)) {
              teacherCodes.push(teacher.teacherCode);
            }
          });
        }
      });

      // Add relevant teachers
      teachers.forEach((teacher) => {
        if (teacherCodes.includes(teacher.data.teacherCode)) {
          birthdays.push({
            _id: teacher._id,
            code: teacher.data.teacherCode,
            name: teacher.data.teacherName || teacher.data.teacherCode,
            type: "teacher",
            birthDate: teacher.data.birthDate,
            avatar: teacher.data.avatar?.path
          });
        }
      });

      // Get classmate details
      if (classmatesCodes.length > 0) {
        const classmates = await connection.collection("students")
          .find({
            "data.studentCode": { $in: classmatesCodes },
            "data.schoolCode": schoolCode,
            "data.birthDate": { $exists: true, $ne: "" }
          })
          .project({
            "data.studentCode": 1,
            "data.studentName": 1,
            "data.studentFamily": 1,
            "data.birthDate": 1,
            "data.avatar": 1
          })
          .toArray();

        classmates.forEach((student) => {
          birthdays.push({
            _id: student._id,
            code: student.data.studentCode,
            name: `${student.data.studentName || ''} ${student.data.studentFamily || ''}`.trim(),
            type: "student",
            birthDate: student.data.birthDate,
            avatar: student.data.avatar?.path,
            className: classMap[student.data.studentCode]
          });
        });
      }
    }

    return NextResponse.json({ birthdays });

  } catch (error) {
    console.error("Error fetching birthdays:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 