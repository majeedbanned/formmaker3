import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getCurrentUser } from "@/app/api/chatbot7/config/route";

interface OnboardingStatus {
  hasTeachers: boolean;
  hasClasses: boolean;
  hasStudents: boolean;
  teachersCount: number;
  classesCount: number;
  studentsCount: number;
  weeklyProgramsCount: number;
  completedSteps: number;
  totalSteps: number;
  nextStep: string | null;
}

export async function GET(request: NextRequest) {
  try {
    console.log("Onboarding status API called");
    
    // Get current authenticated user
    const user = await getCurrentUser();
    console.log("User from getCurrentUser:", user);
    
    if (!user) {
      console.log("No user found, returning 401");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Only school users should access this endpoint
    if (user.userType !== "school") {
      console.log("User type is not school:", user.userType);
      return NextResponse.json(
        { error: `Access denied. Only school users can access onboarding status. Current user type: ${user.userType}` },
        { status: 403 }
      );
    }

    // Get domain from request headers
    const domain = request.headers.get("x-domain") || "localhost:3000";
    console.log("Domain:", domain);
    console.log("School code:", user.schoolCode);
    
    // Connect to the domain-specific database
    const connection = await connectToDatabase(domain);
    console.log("Database connection established");
    
    // Check teachers count
    const teachersCount = await connection
      .collection("teachers")
      .countDocuments({ "data.schoolCode": user.schoolCode });
    console.log("Teachers count:", teachersCount);

    // Check classes count
    const classesCount = await connection
      .collection("classes")
      .countDocuments({ "data.schoolCode": user.schoolCode });
    console.log("Classes count:", classesCount);

    // Check students count
    const studentsCount = await connection
      .collection("students")
      .countDocuments({ "data.schoolCode": user.schoolCode });
    console.log("Students count:", studentsCount);

    // Check classes with weekly programs (classes that have teachers with weeklySchedule)
    const weeklyProgramsCount = await connection
      .collection("classes")
      .countDocuments({ 
        "data.schoolCode": user.schoolCode,
        "data.teachers.weeklySchedule": { $exists: true, $ne: [] }
      });
    console.log("Weekly programs count:", weeklyProgramsCount);

    // Determine completion status
    const hasTeachers = teachersCount > 0;
    const hasClasses = classesCount > 0;
    const hasStudents = studentsCount > 0;

    let completedSteps = 0;
    let nextStep: string | null = null;

    if (hasTeachers) {
      completedSteps++;
      if (!hasClasses) {
        nextStep = "classes";
      } else {
        completedSteps++;
        if (!hasStudents) {
          nextStep = "students";
        } else {
          completedSteps++;
        }
      }
    } else {
      nextStep = "teachers";
    }

    const status: OnboardingStatus = {
      hasTeachers,
      hasClasses,
      hasStudents,
      teachersCount,
      classesCount,
      studentsCount,
      weeklyProgramsCount,
      completedSteps,
      totalSteps: 3,
      nextStep,
    };

    console.log("Returning status:", status);
    return NextResponse.json(status);
  } catch (error) {
    console.error("Error fetching onboarding status:", error);
    return NextResponse.json(
      { error: "Failed to fetch onboarding status", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
