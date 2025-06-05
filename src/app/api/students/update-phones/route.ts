import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getCurrentUser } from "../../chatbot7/config/route";

interface PhoneEntry {
  owner: string;
  number: string;
}

export async function POST(request: NextRequest) {
  try {
    // Get user and verify authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only school users can update student phone numbers
    if (user.userType !== "school") {
      return NextResponse.json(
        { error: "Only school administrators can update student phone numbers" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { studentCode, phones, action } = body;

    if (!studentCode) {
      return NextResponse.json(
        { error: "Student code is required" },
        { status: 400 }
      );
    }

    if (!phones || !Array.isArray(phones) || phones.length === 0) {
      return NextResponse.json(
        { error: "At least one phone number is required" },
        { status: 400 }
      );
    }

    // Validate phone entries
    for (const phone of phones) {
      if (!phone.owner || !phone.number) {
        return NextResponse.json(
          { error: "Each phone entry must have owner and number" },
          { status: 400 }
        );
      }
      
      // Basic phone number validation (Persian and English digits)
      const phoneRegex = /^[0-9۰-۹+\-\s()]+$/;
      if (!phoneRegex.test(phone.number)) {
        return NextResponse.json(
          { error: `Invalid phone number format: ${phone.number}` },
          { status: 400 }
        );
      }
    }

    // Get domain from request headers
    const domain = request.headers.get("x-domain") || "localhost:3000";
    
    // Connect to database
    const connection = await connectToDatabase(domain);
    
    // Verify that the student exists and belongs to the school
    const student = await connection.collection("students").findOne({
      "data.studentCode": studentCode,
      "data.schoolCode": user.schoolCode,
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student not found or doesn't belong to your school" },
        { status: 404 }
      );
    }

    let updateOperation;
    let resultMessage;

    if (action === "replace") {
      // Replace all existing phones
      updateOperation = {
        $set: { 
          "data.phones": phones,
          updatedAt: new Date()
        }
      };
      resultMessage = "Phone numbers replaced successfully";
    } else {
      // Add new phones (default behavior)
      // Get existing phones to merge
      const existingPhones = student.data?.phones || [];
      
      // Create a map of existing phones by owner for easy lookup
      const existingPhoneMap = new Map();
      existingPhones.forEach((phone: PhoneEntry, index: number) => {
        existingPhoneMap.set(phone.owner, { ...phone, index });
      });

      // Merge new phones with existing ones
      const mergedPhones = [...existingPhones];
      
      phones.forEach((newPhone: PhoneEntry) => {
        const existing = existingPhoneMap.get(newPhone.owner);
        if (existing) {
          // Update existing phone number for the same owner
          mergedPhones[existing.index] = newPhone;
        } else {
          // Add new phone entry
          mergedPhones.push(newPhone);
        }
      });

      updateOperation = {
        $set: { 
          "data.phones": mergedPhones,
          updatedAt: new Date()
        }
      };
      resultMessage = "Phone numbers updated successfully";
    }

    // Update student record
    const updateResult = await connection.collection("students").updateOne(
      { _id: student._id },
      updateOperation
    );

    if (updateResult.modifiedCount === 0) {
      return NextResponse.json(
        { error: "Failed to update student phone numbers" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: resultMessage,
      studentCode: studentCode,
      phonesCount: phones.length,
    });

  } catch (error) {
    console.error("Error updating phone numbers:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 