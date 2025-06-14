import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getCurrentUser } from "../../chatbot7/config/route";
import { ObjectId } from "mongodb";

interface GradeData {
  score?: number;
  descriptiveText?: string;
  studentName: string;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only teachers and school admins can save grades
    if (user.userType !== "teacher" && user.userType !== "school") {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      title,
      gradeDate,
      gradingType = "numerical", // Default to numerical for backward compatibility
      classCode,
      className,
      courseCode,
      courseName,
      teacherCode,
      schoolCode,
      grades,
      isEditing,
      gradeListId
    } = body;

    // Validate required fields
    if (!title || !gradeDate || !classCode || !courseCode || !teacherCode || !schoolCode || !grades) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Additional authorization check
    if (user.userType === "teacher" && user.username !== teacherCode) {
      return NextResponse.json(
        { error: "Unauthorized to save grades for other teachers" },
        { status: 403 }
      );
    }

    if (user.schoolCode !== schoolCode) {
      return NextResponse.json(
        { error: "Unauthorized to save grades for this school" },
        { status: 403 }
      );
    }

    // Get domain from request headers or use default
    const domain = request.headers.get('x-domain') || 'localhost:3000';
    
    // Connect to the domain-specific database
    const connection = await connectToDatabase(domain);

    const now = new Date().toISOString();

    // Calculate statistics based on grading type
    const gradeValues = Object.values(grades) as GradeData[];
    let statistics;

    if (gradingType === "numerical") {
      const numericalGrades = gradeValues.filter(g => g.score !== undefined);
      const scores = numericalGrades.map(g => g.score!);
      const average = scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
      const passing = scores.filter(score => score >= 10).length;
      const failing = scores.filter(score => score < 10).length;
      const highest = scores.length > 0 ? Math.max(...scores) : 0;
      const lowest = scores.length > 0 ? Math.min(...scores) : 0;

      statistics = {
        average,
        passing,
        failing,
        highest,
        lowest,
        total: scores.length
      };
    } else {
      // For descriptive grades, we only track total count
      const descriptiveGrades = gradeValues.filter(g => g.descriptiveText && g.descriptiveText.trim() !== "");
      statistics = {
        total: descriptiveGrades.length,
        type: "descriptive"
      };
    }

    if (isEditing && gradeListId) {
      // Update existing grade list
      const gradeListObjectId = new ObjectId(gradeListId);
      
      // Update the grade list document
      await connection.collection("grade_lists").updateOne(
        { _id: gradeListObjectId },
        {
          $set: {
            title,
            gradeDate,
            gradingType,
            statistics,
            updatedAt: now
          }
        }
      );

      // Delete existing individual grades for this grade list
      await connection.collection("grades").deleteMany({
        gradeListId: gradeListId
      });

      // Insert new individual grades
      const gradeDocuments = Object.entries(grades).map(([studentCode, gradeData]) => {
        const typedGradeData = gradeData as GradeData;
        const baseDoc = {
          gradeListId: gradeListId,
          studentCode,
          studentName: typedGradeData.studentName,
          gradingType,
          classCode,
          courseCode,
          teacherCode,
          schoolCode,
          createdAt: now,
          updatedAt: now
        };

        if (gradingType === "numerical") {
          return {
            ...baseDoc,
            score: typedGradeData.score
          };
        } else {
          return {
            ...baseDoc,
            descriptiveText: typedGradeData.descriptiveText
          };
        }
      });

      if (gradeDocuments.length > 0) {
        await connection.collection("grades").insertMany(gradeDocuments);
      }

      return NextResponse.json({
        success: true,
        message: gradingType === "descriptive" ? "Evaluations updated successfully" : "Grades updated successfully",
        gradeListId: gradeListId
      });

    } else {
      // Create new grade list
      const gradeListResult = await connection.collection("grade_lists").insertOne({
        title,
        gradeDate,
        gradingType,
        classCode,
        className,
        courseCode,
        courseName,
        teacherCode,
        schoolCode,
        gradeCount: Object.keys(grades).length,
        statistics,
        createdAt: now,
        updatedAt: now
      });

      const gradeListId = gradeListResult.insertedId.toString();

      // Insert individual grades
      const gradeDocuments = Object.entries(grades).map(([studentCode, gradeData]) => {
        const typedGradeData = gradeData as GradeData;
        const baseDoc = {
          gradeListId: gradeListId,
          studentCode,
          studentName: typedGradeData.studentName,
          gradingType,
          classCode,
          courseCode,
          teacherCode,
          schoolCode,
          createdAt: now,
          updatedAt: now
        };

        if (gradingType === "numerical") {
          return {
            ...baseDoc,
            score: typedGradeData.score
          };
        } else {
          return {
            ...baseDoc,
            descriptiveText: typedGradeData.descriptiveText
          };
        }
      });

      if (gradeDocuments.length > 0) {
        await connection.collection("grades").insertMany(gradeDocuments);
      }

      return NextResponse.json({
        success: true,
        message: gradingType === "descriptive" ? "Evaluations saved successfully" : "Grades saved successfully",
        gradeListId: gradeListId
      });
    }

  } catch (error) {
    console.error("Error saving grades:", error);
    return NextResponse.json(
      { error: "Failed to save grades" },
      { status: 500 }
    );
  }
}