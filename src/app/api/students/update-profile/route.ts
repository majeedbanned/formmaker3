import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// Helper function to get current user from headers
async function getCurrentUser(request: NextRequest) {
  const userId = request.headers.get("x-user-id");
  const userType = request.headers.get("x-user-type");
  const schoolCode = request.headers.get("x-school-code");
  const username = request.headers.get("x-username");
  
  if (!userId || !userType || !schoolCode || !username) {
    return null;
  }
  
  return {
    id: userId,
    userType,
    schoolCode,
    username
  };
}

export async function PUT(request: NextRequest) {
  try {
    // Get current user from headers
    const user = getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Only allow students to update their own profile
    // if (user.userType !== "student") {
    //   return NextResponse.json(
    //     { error: "Only students can update their profile" },
    //     { status: 403 }
    //   );
    // }

    // Get request body
    const { studentId, profileData } = await request.json();
    
    // Verify the student is updating their own profile
    // if (studentId !== user.id) {
    //   return NextResponse.json(
    //     { error: "Students can only update their own profile" },
    //     { status: 403 }
    //   );
    // }

    // Get domain
    const domain = request.headers.get("x-domain") || "localhost:3000";
    
    // Connect to database
    const connection = await connectToDatabase(domain);
    const studentsCollection = connection.collection("students");

    // Define allowed fields that students can update
    const allowedFields = [
      'birthDate',
      'phones',
      'codemelli',
      'birthplace',
      'IDserial',
      'fatherEducation',
      'motherEducation',
      'fatherJob',
      'fatherWorkPlace',
      'motherJob',
      'infos',
      'address',
      'postalcode'
    ];

    // Filter the profile data to only include allowed fields
    const updateData: Record<string, any> = {};
    Object.keys(profileData).forEach(key => {
      if (allowedFields.includes(key)) {
        updateData[`data.${key}`] = profileData[key];
      }
    });

    // Add update timestamp
    updateData['data.updatedAt'] = new Date();
    updateData['data.updatedBy'] = user.id;

    // Update the student document
    const result = await studentsCollection.updateOne(
      { _id: new ObjectId(studentId) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: "No changes were made" },
        { status: 400 }
      );
    }

    // Fetch updated student data
    const updatedStudent = await studentsCollection.findOne(
      { _id: new ObjectId(studentId) }
    );

    return NextResponse.json({
      message: "Profile updated successfully",
      student: updatedStudent
    });

  } catch (error) {
    console.error("Error updating student profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
