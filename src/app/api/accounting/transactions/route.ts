import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getCurrentUser } from "../../chatbot7/config/route";
import { ObjectId } from "mongodb";

export const runtime = 'nodejs';

// GET - Fetch transactions with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only school admins can access accounting
    if (user.userType !== "school") {
      return NextResponse.json(
        { error: "Unauthorized. Only school admins can access accounting." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;
    
    // Filter parameters
    const personType = searchParams.get("personType"); // student or teacher
    const personId = searchParams.get("personId");
    const transactionType = searchParams.get("transactionType"); // debit or credit
    const category = searchParams.get("category");
    const paymentMethod = searchParams.get("paymentMethod");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const status = searchParams.get("status");

    // Get domain from request headers or use default
    const domain = request.headers.get('x-domain') || 'localhost:3000';
    
    // Connect to the domain-specific database
    const connection = await connectToDatabase(domain);
    
    // Build query filter
    const query: Record<string, unknown> = { schoolCode: user.schoolCode };
    
    if (personType) query.personType = personType;
    if (personId) query.personId = personId;
    if (transactionType) query.transactionType = transactionType;
    if (category) query.category = category;
    if (paymentMethod) query.paymentMethod = paymentMethod;
    if (status) query.status = status;
    
    // Date range filter
    if (startDate || endDate) {
      query.transactionDate = {};
      if (startDate) (query.transactionDate as Record<string, Date>).$gte = new Date(startDate);
      if (endDate) (query.transactionDate as Record<string, Date>).$lte = new Date(endDate);
    }
    
    // Get transactions with pagination
    const transactions = await connection
      .collection("financial_transactions")
      .find(query)
      .sort({ transactionDate: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Get total count for pagination
    const totalCount = await connection
      .collection("financial_transactions")
      .countDocuments(query);

    // Calculate totals
    const totals = await connection
      .collection("financial_transactions")
      .aggregate([
        { $match: query },
        {
          $group: {
            _id: "$transactionType",
            total: { $sum: "$amount" }
          }
        }
      ])
      .toArray();

    const debitTotal = totals.find(t => t._id === "debit")?.total || 0;
    const creditTotal = totals.find(t => t._id === "credit")?.total || 0;
    const balance = creditTotal - debitTotal;

    return NextResponse.json({
      transactions,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit)
      },
      summary: {
        debitTotal,
        creditTotal,
        balance
      }
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}

// POST - Create a new transaction
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only school admins can create transactions
    if (user.userType !== "school") {
      return NextResponse.json(
        { error: "Unauthorized. Only school admins can create transactions." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      personType,
      personId,
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
      notes = "",
      documents = []
    } = body;

    // Validate required fields
    if (!personType || !personId || !transactionType || !amount || !description) {
      return NextResponse.json(
        { error: "Missing required fields: personType, personId, transactionType, amount, description" },
        { status: 400 }
      );
    }

    if (!["student", "teacher"].includes(personType)) {
      return NextResponse.json(
        { error: "personType must be 'student' or 'teacher'" },
        { status: 400 }
      );
    }

    if (!["debit", "credit"].includes(transactionType)) {
      return NextResponse.json(
        { error: "transactionType must be 'debit' or 'credit'" },
        { status: 400 }
      );
    }

    // Get domain from request headers or use default
    const domain = request.headers.get('x-domain') || 'localhost:3000';
    
    // Connect to the domain-specific database
    const connection = await connectToDatabase(domain);
    
    // Get person name based on personType
    let personName = "";
    if (personType === "student") {
      const student = await connection.collection("students").findOne({ _id: new ObjectId(personId) });
      if (!student) {
        return NextResponse.json({ error: "Student not found" }, { status: 404 });
      }
      personName = `${student.data.studentName} ${student.data.studentFamily}`;
    } else if (personType === "teacher") {
      const teacher = await connection.collection("teachers").findOne({ _id: new ObjectId(personId) });
      if (!teacher) {
        return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
      }
      personName = teacher.data.teacherName;
    }

    // Create transaction object
    const transaction = {
      schoolCode: user.schoolCode,
      personType,
      personId,
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
      notes,
      documents: documents || []
    };

    // Insert transaction
    const result = await connection
      .collection("financial_transactions")
      .insertOne(transaction);

    return NextResponse.json({
      success: true,
      transactionId: result.insertedId,
      transaction: { ...transaction, _id: result.insertedId }
    });
  } catch (error) {
    console.error("Error creating transaction:", error);
    return NextResponse.json(
      { error: "Failed to create transaction" },
      { status: 500 }
    );
  }
}

// PUT - Update an existing transaction
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only school admins can update transactions
    if (user.userType !== "school") {
      return NextResponse.json(
        { error: "Unauthorized. Only school admins can update transactions." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { transactionId, ...updates } = body;

    if (!transactionId) {
      return NextResponse.json(
        { error: "Transaction ID is required" },
        { status: 400 }
      );
    }

    // Get domain from request headers or use default
    const domain = request.headers.get('x-domain') || 'localhost:3000';
    
    // Connect to the domain-specific database
    const connection = await connectToDatabase(domain);
    
    // Update transaction
    const result = await connection
      .collection("financial_transactions")
      .updateOne(
        { 
          _id: new ObjectId(transactionId),
          schoolCode: user.schoolCode 
        },
        { 
          $set: {
            ...updates,
            updatedAt: new Date()
          }
        }
      );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Transaction updated successfully"
    });
  } catch (error) {
    console.error("Error updating transaction:", error);
    return NextResponse.json(
      { error: "Failed to update transaction" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a transaction
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only school admins can delete transactions
    if (user.userType !== "school") {
      return NextResponse.json(
        { error: "Unauthorized. Only school admins can delete transactions." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get("id");

    if (!transactionId) {
      return NextResponse.json(
        { error: "Transaction ID is required" },
        { status: 400 }
      );
    }

    // Get domain from request headers or use default
    const domain = request.headers.get('x-domain') || 'localhost:3000';
    
    // Connect to the domain-specific database
    const connection = await connectToDatabase(domain);
    
    // Delete transaction
    const result = await connection
      .collection("financial_transactions")
      .deleteOne({
        _id: new ObjectId(transactionId),
        schoolCode: user.schoolCode
      });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Transaction deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting transaction:", error);
    return NextResponse.json(
      { error: "Failed to delete transaction" },
      { status: 500 }
    );
  }
} 