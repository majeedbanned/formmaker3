import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/app/api/chatbot7/config/route";
import { connectToDatabase } from "@/lib/mongodb";

export async function POST(request: NextRequest) {
  try {
    // Get user and verify authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only school users can access student phone numbers
    if (user.userType !== "school") {
      return NextResponse.json(
        { error: "Only school administrators can access student phone numbers" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { studentCodes, schoolCode } = body;

    if (!studentCodes || !Array.isArray(studentCodes) || studentCodes.length === 0) {
      return NextResponse.json(
        { error: "Student codes array is required" },
        { status: 400 }
      );
    }

    if (!schoolCode) {
      return NextResponse.json(
        { error: "School code is required" },
        { status: 400 }
      );
    }

    // Get domain from request headers
    const domain = request.headers.get("x-domain") || "localhost:3000";
    
    // Connect to database
    const connection = await connectToDatabase(domain);
    
    // Fetch students with phone numbers
    const students = await connection.collection("students").find({
      "data.studentCode": { $in: studentCodes },
      "data.schoolCode": schoolCode
    }).toArray();

    // Format the response
    const formattedStudents = students.map(student => {
      const phones = [];
      
      // Add phones from the phones array (newer format)
      if (student.data?.phones && Array.isArray(student.data.phones)) {
        student.data.phones.forEach((phone: any) => {
          if (phone.number && phone.owner) {
            phones.push({
              number: phone.number,
              owner: phone.owner
            });
          }
        });
      }
      
      // Add phone from the single phoneNumber field (older format) if no phones array exists
      if (phones.length === 0 && student.data?.phoneNumber) {
        phones.push({
          number: student.data.phoneNumber,
          owner: "والدین"
        });
      }

      return {
        studentCode: student.data?.studentCode,
        studentName: student.data?.studentName || "",
        studentlname: student.data?.studentFamily || student.data?.studentlname || "",
        phones: phones
      };
    });

    return NextResponse.json({ 
      success: true,
      students: formattedStudents
    });

  } catch (error) {
    console.error("Error fetching student phone numbers:", error);
    return NextResponse.json(
      { error: "Failed to fetch student phone numbers" },
      { status: 500 }
    );
  }
}
