import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getCurrentUser } from "../../chatbot7/config/route";
import { ObjectId } from "mongodb";

export const runtime = 'nodejs';

// POST - Create bulk transactions for a class
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only school admins can create bulk transactions
    if (user.userType !== "school") {
      return NextResponse.json(
        { error: "Unauthorized. Only school admins can create bulk transactions." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      classCode,
      transactionType,
      amount,
      description,
      paymentMethod,
      category,
      receiptNumber,
      referenceNumber,
      transactionDate,
      isRecurring = false,
      recurringConfig = null,
      notes = ""
    } = body;

    // Validate required fields
    if (!classCode || !transactionType || !amount || !description) {
      return NextResponse.json(
        { error: "Missing required fields: classCode, transactionType, amount, description" },
        { status: 400 }
      );
    }

    if (!["debit", "credit"].includes(transactionType)) {
      return NextResponse.json(
        { error: "transactionType must be 'debit' or 'credit'" },
        { status: 400 }
      );
    }

    if (parseFloat(amount) <= 0) {
      return NextResponse.json(
        { error: "Amount must be greater than 0" },
        { status: 400 }
      );
    }

    // Get domain from request headers or use default
    const domain = request.headers.get('x-domain') || 'localhost:3000';
    
    // Connect to the domain-specific database
    const connection = await connectToDatabase(domain);
    
    // Get class information and students
    const classInfo = await connection.collection("classes").findOne({
      "data.classCode": classCode,
      "data.schoolCode": user.schoolCode
    });

    if (!classInfo) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    const students = classInfo.data.students || [];
    if (students.length === 0) {
      return NextResponse.json({ error: "No students found in this class" }, { status: 400 });
    }

    // Create transactions for all students in the class
    const transactions = [];
    const errors = [];

    for (const student of students) {
      try {
        // Get student full name
        const studentDoc = await connection.collection("students").findOne({ 
          _id: new ObjectId(student._id) 
        });
        
        const personName = studentDoc 
          ? `${studentDoc.data.studentName} ${studentDoc.data.studentFamily}`
          : `${student.studentName} ${student.studentlname}`;

        const transaction = {
          schoolCode: user.schoolCode,
          personType: "student",
          personId: student._id,
          personName,
          transactionType,
          amount: parseFloat(amount),
          description,
          paymentMethod: paymentMethod || "",
          category: category || "",
          receiptNumber: receiptNumber || "",
          referenceNumber: referenceNumber || "",
          transactionDate: transactionDate ? new Date(transactionDate) : new Date(),
          isRecurring,
          recurringConfig,
          status: "completed",
          createdBy: user.id,
          createdByType: user.userType,
          createdAt: new Date(),
          updatedAt: new Date(),
          notes: notes || `ثبت دسته‌جمعی برای کلاس ${classInfo.data.className}`,
          bulkTransactionId: new ObjectId(), // Group transactions together
          classCode: classCode,
          className: classInfo.data.className
        };

        transactions.push(transaction);
      } catch (error) {
        console.error(`Error processing student ${student._id}:`, error);
        errors.push({
          studentId: student._id,
          studentName: `${student.studentName} ${student.studentlname}`,
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }

    if (transactions.length === 0) {
      return NextResponse.json(
        { error: "No valid transactions could be created", errors },
        { status: 400 }
      );
    }

    // Insert all transactions
    const result = await connection
      .collection("financial_transactions")
      .insertMany(transactions);

    return NextResponse.json({
      success: true,
      message: `Successfully created ${result.insertedCount} transactions for class ${classInfo.data.className}`,
      summary: {
        totalStudents: students.length,
        successfulTransactions: result.insertedCount,
        errors: errors.length,
        className: classInfo.data.className,
        classCode: classCode,
        totalAmount: result.insertedCount * parseFloat(amount)
      },
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error("Error creating bulk transactions:", error);
    return NextResponse.json(
      { error: "Failed to create bulk transactions" },
      { status: 500 }
    );
  }
}

// GET - Fetch classes for bulk transaction selection
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only school admins can access classes
    if (user.userType !== "school") {
      return NextResponse.json(
        { error: "Unauthorized. Only school admins can access classes." },
        { status: 403 }
      );
    }

    // Get domain from request headers or use default
    const domain = request.headers.get('x-domain') || 'localhost:3000';
    
    // Connect to the domain-specific database
    const connection = await connectToDatabase(domain);
    
    // Fetch all classes for the school
    const classes = await connection
      .collection("classes")
      .find({ "data.schoolCode": user.schoolCode })
      .project({
        _id: 1,
        "data.classCode": 1,
        "data.className": 1,
        "data.Grade": 1,
        "data.major": 1,
        "data.students": 1
      })
      .toArray();

    const classesWithCount = classes.map(cls => ({
      _id: cls._id,
      classCode: cls.data.classCode,
      className: cls.data.className,
      grade: cls.data.Grade,
      major: cls.data.major,
      studentCount: cls.data.students ? cls.data.students.length : 0
    }));

    return NextResponse.json({
      classes: classesWithCount
    });
  } catch (error) {
    console.error("Error fetching classes:", error);
    return NextResponse.json(
      { error: "Failed to fetch classes" },
      { status: 500 }
    );
  }
} 