import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getCurrentUser } from "../../chatbot7/config/route";
import { ObjectId } from "mongodb";

export async function PUT(request: NextRequest) {
  try {
    // Get current user from headers
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Only allow teachers to update their own profile
    if (user.userType !== "teacher") {
      return NextResponse.json(
        { error: "Only teachers can update their profile" },
        { status: 403 }
      );
    }

    // Get request body
    const { teacherId, profileData } = await request.json();
    
    // Verify the teacher is updating their own profile
    if (teacherId !== user.id) {
      return NextResponse.json(
        { error: "Teachers can only update their own profile" },
        { status: 403 }
      );
    }

    // Get domain
    const domain = request.headers.get("x-domain") || "localhost:3000";
    
    // Connect to database
    const connection = await connectToDatabase(domain);
    const teachersCollection = connection.collection("teachers");

    // Define allowed fields that teachers can update
    const allowedFields = [
      'birthDate',
      'phones',
      'avatar',
      'marrageStatus',
      'jobStatus',
      'paye',
      'personelID',
      'nationalCode',
      'originalService',
      'originalServiceUnit',
      'employmentStatus',
      'educationDegree',
      'educationMajor',
      'teachingMajor',
      'teachingTitle',
      'workingHours',
      'nonWorkingHours',
      'bankAccount',
      'bankName',
      'maritalStatus',
      'pot',
      'educationStatus',
      'resignationStatus',
      'workHistory',
      'managementHistory',
      'exactAddress',
      'IDserial'
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

    // Update the teacher document
    const result = await teachersCollection.updateOne(
      { _id: new ObjectId(teacherId) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Teacher not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      modifiedCount: result.modifiedCount
    });

  } catch (error) {
    console.error("Error updating teacher profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}




