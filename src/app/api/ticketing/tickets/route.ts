import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { logger } from "@/lib/logger";
import { getCurrentUser } from "@/app/api/chatbot7/config/route";
import { ObjectId } from "mongodb";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "غیر مجاز" }, { status: 401 });
    }

    const domain = request.headers.get("x-domain") || "localhost:3000";
    const { searchParams } = new URL(request.url);
    
    const departmentId = searchParams.get("departmentId");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const createdBy = searchParams.get("createdBy");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    // Connect to domain-specific database
    const connection = await connectToDatabase(domain);
    const ticketsCollection = connection.collection("ticketing_tickets");
    const departmentsCollection = connection.collection("ticketing_departments");

    // Build query based on user permissions
    let query: Record<string, unknown> = {
      "data.schoolCode": user.schoolCode
    };

    if (user.userType === "teacher") {
      // Teachers can see:
      // 1. Tickets they created
      // 2. Tickets in departments they're assigned to
      
      // Get departments assigned to this teacher
      const assignedDepartments = await departmentsCollection
        .find({
          "data.schoolCode": user.schoolCode,
          "data.assignedTeachers": user.id
        })
        .toArray();
      
      const assignedDeptIds = assignedDepartments.map(dept => dept._id.toString());
      
      query.$or = [
        { "data.createdByTeacherId": user.id },
        { "data.departmentId": { $in: assignedDeptIds } }
      ];
    }
    // School admins can see all tickets (no additional filter needed)

    // Apply additional filters
    if (departmentId) {
      query["data.departmentId"] = departmentId;
    }
    if (status) {
      query["data.status"] = status;
    }
    if (priority) {
      query["data.priority"] = priority;
    }
    if (createdBy) {
      query["data.createdByTeacherId"] = createdBy;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Get tickets with pagination
    const tickets = await ticketsCollection
      .find(query)
      .sort({ "data.createdAt": -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Get total count
    const total = await ticketsCollection.countDocuments(query);

    // Get departments and teachers info for enriching response
    const departments = await departmentsCollection
      .find({ "data.schoolCode": user.schoolCode })
      .toArray();
    
    const teachersCollection = connection.collection("teachers");
    const teachers = await teachersCollection
      .find({ "data.schoolCode": user.schoolCode })
      .toArray();

    // Enrich tickets with department and teacher names
    const enrichedTickets = tickets.map(ticket => {
      const department = departments.find(d => d._id.toString() === ticket.data.departmentId);
      const creator = teachers.find(t => t._id.toString() === ticket.data.createdByTeacherId);
      
      return {
        ...ticket,
        departmentName: department?.data.name || "نامشخص",
        creatorName: creator?.data.teacherName || "نامشخص"
      };
    });

    return NextResponse.json({
      tickets: enrichedTickets,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error("Error fetching tickets:", error);
    return NextResponse.json(
      { error: "خطا در دریافت تیکت‌ها" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.userType !== "teacher") {
      return NextResponse.json({ error: "غیر مجاز" }, { status: 401 });
    }

    const domain = request.headers.get("x-domain") || "localhost:3000";
    const { title, description, departmentId, priority, attachments } = await request.json();

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: "عنوان تیکت الزامی است" },
        { status: 400 }
      );
    }

    if (!description || !description.trim()) {
      return NextResponse.json(
        { error: "توضیحات تیکت الزامی است" },
        { status: 400 }
      );
    }

    if (!departmentId) {
      return NextResponse.json(
        { error: "انتخاب بخش الزامی است" },
        { status: 400 }
      );
    }

    // Connect to domain-specific database
    const connection = await connectToDatabase(domain);
    
    // Verify department exists and belongs to this school
    const departmentsCollection = connection.collection("ticketing_departments");
    const department = await departmentsCollection.findOne({
      "_id": new ObjectId(departmentId),
      "data.schoolCode": user.schoolCode
    });

    if (!department) {
      return NextResponse.json(
        { error: "بخش انتخاب شده معتبر نیست" },
        { status: 400 }
      );
    }

    // Create ticket
    const ticketData = {
      data: {
        title: title.trim(),
        description: description.trim(),
        departmentId: departmentId,
        createdByTeacherId: user.id,
        schoolCode: user.schoolCode,
        status: "Open",
        priority: priority || "Medium",
        attachments: attachments || [],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    };

    const ticketsCollection = connection.collection("ticketing_tickets");
    const result = await ticketsCollection.insertOne(ticketData);

    return NextResponse.json({
      success: true,
      ticket: {
        _id: result.insertedId,
        ...ticketData
      }
    });
  } catch (error) {
    logger.error("Error creating ticket:", error);
    return NextResponse.json(
      { error: "خطا در ایجاد تیکت" },
      { status: 500 }
    );
  }
}

