import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { logger } from "@/lib/logger";
import { getCurrentUser } from "@/app/api/chatbot7/config/route";
import { ObjectId } from "mongodb";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "غیر مجاز" }, { status: 401 });
    }

    const { id } = await params;
    const domain = request.headers.get("x-domain") || "localhost:3000";

    // Connect to domain-specific database
    const connection = await connectToDatabase(domain);
    const ticketsCollection = connection.collection("ticketing_tickets");
    const departmentsCollection = connection.collection("ticketing_departments");
    const repliesCollection = connection.collection("ticketing_replies");

    // Get ticket
    const ticket = await ticketsCollection.findOne({
      "_id": new ObjectId(id),
      "data.schoolCode": user.schoolCode
    });

    if (!ticket) {
      return NextResponse.json(
        { error: "تیکت یافت نشد" },
        { status: 404 }
      );
    }

    // Check permissions
    if (user.userType === "teacher") {
      // Check if teacher can access this ticket
      const isCreator = ticket.data.createdByTeacherId === user.id;
      
      if (!isCreator) {
        // Check if teacher is assigned to the department
        const department = await departmentsCollection.findOne({
          "_id": new ObjectId(ticket.data.departmentId),
          "data.assignedTeachers": user.id
        });
        
        if (!department) {
          return NextResponse.json({ error: "غیر مجاز" }, { status: 403 });
        }
      }
    }

    // Get replies for this ticket
    const replies = await repliesCollection
      .find({ "data.ticketId": id })
      .sort({ "data.createdAt": 1 })
      .toArray();

    // Get department info
    const department = await departmentsCollection.findOne({
      "_id": new ObjectId(ticket.data.departmentId)
    });

    // Get teachers info for creator and reply authors
    const teachersCollection = connection.collection("teachers");
    const teacherIdsSet = new Set<string>();

    if (ticket.data.createdByTeacherId) {
      teacherIdsSet.add(ticket.data.createdByTeacherId);
    }

    replies.forEach(reply => {
      const potentialTeacherId =
        reply.data.authorTeacherId ||
        (reply.data.authorType === "teacher" ? reply.data.authorId : undefined);
      if (potentialTeacherId) {
        teacherIdsSet.add(potentialTeacherId);
      }
    });

    const teacherIds = Array.from(teacherIdsSet);
    let teachersMap: Map<string, any> | null = null;
    if (teacherIds.length > 0) {
      const teachers = await teachersCollection
        .find({ "_id": { $in: teacherIds.map(id => new ObjectId(id)) } })
        .toArray();
      teachersMap = new Map(teachers.map(teacher => [teacher._id.toString(), teacher]));
    }

    // Enrich replies with author names
    const enrichedReplies = replies.map(reply => {
      if (reply.data.authorName) {
        return {
          ...reply,
          authorName: reply.data.authorName
        };
      }

      const teacherId =
        reply.data.authorTeacherId ||
        (reply.data.authorType === "teacher" ? reply.data.authorId : undefined);
      const author =
        teacherId && teachersMap ? teachersMap.get(teacherId.toString()) : undefined;

      return {
        ...reply,
        authorName: author?.data.teacherName || "نامشخص"
      };
    });

    // Enrich ticket with additional info
    const creator =
      teachersMap && ticket.data.createdByTeacherId
        ? teachersMap.get(ticket.data.createdByTeacherId.toString())
        : undefined;
    const enrichedTicket = {
      ...ticket,
      departmentName: department?.data.name || "نامشخص",
      creatorName: creator?.data.teacherName || "نامشخص",
      replies: enrichedReplies
    };

    return NextResponse.json({ ticket: enrichedTicket });
  } catch (error) {
    logger.error("Error fetching ticket:", error);
    return NextResponse.json(
      { error: "خطا در دریافت تیکت" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "غیر مجاز" }, { status: 401 });
    }

    const { id } = await params;
    const domain = request.headers.get("x-domain") || "localhost:3000";
    const { status, priority } = await request.json();

    // Connect to domain-specific database
    const connection = await connectToDatabase(domain);
    const ticketsCollection = connection.collection("ticketing_tickets");
    const departmentsCollection = connection.collection("ticketing_departments");

    // Get ticket to check permissions
    const ticket = await ticketsCollection.findOne({
      "_id": new ObjectId(id),
      "data.schoolCode": user.schoolCode
    });

    if (!ticket) {
      return NextResponse.json(
        { error: "تیکت یافت نشد" },
        { status: 404 }
      );
    }

    // Check permissions
    let canUpdate = false;
    
    if (user.userType === "school") {
      canUpdate = true; // School admin can update any ticket
    } else if (user.userType === "teacher") {
      // Teacher can update if they created it or are assigned to the department
      const isCreator = ticket.data.createdByTeacherId === user.id;
      
      if (!isCreator) {
        const department = await departmentsCollection.findOne({
          "_id": new ObjectId(ticket.data.departmentId),
          "data.assignedTeachers": user.id
        });
        canUpdate = !!department;
      } else {
        canUpdate = true;
      }
    }

    if (!canUpdate) {
      return NextResponse.json({ error: "غیر مجاز" }, { status: 403 });
    }

    // Update ticket
    const updateData: Record<string, unknown> = {
      "data.updatedAt": new Date()
    };

    if (status && ["Open", "In Progress", "Resolved", "Closed"].includes(status)) {
      updateData["data.status"] = status;
    }

    if (priority && ["Low", "Medium", "High"].includes(priority)) {
      updateData["data.priority"] = priority;
    }

    const result = await ticketsCollection.updateOne(
      { "_id": new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "تیکت یافت نشد" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error updating ticket:", error);
    return NextResponse.json(
      { error: "خطا در بروزرسانی تیکت" },
      { status: 500 }
    );
  }
}


