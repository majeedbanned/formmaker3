import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { logger } from "@/lib/logger";
import { getCurrentUser } from "@/app/api/chatbot7/config/route";
import { ObjectId } from "mongodb";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.userType !== "teacher") {
      return NextResponse.json({ error: "غیر مجاز" }, { status: 401 });
    }

    const domain = request.headers.get("x-domain") || "localhost:3000";
    const { ticketId, message, attachments } = await request.json();

    if (!ticketId) {
      return NextResponse.json(
        { error: "شناسه تیکت الزامی است" },
        { status: 400 }
      );
    }

    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: "پیام الزامی است" },
        { status: 400 }
      );
    }

    // Connect to domain-specific database
    const connection = await connectToDatabase(domain);
    const ticketsCollection = connection.collection("ticketing_tickets");
    const departmentsCollection = connection.collection("ticketing_departments");

    // Get ticket to check permissions
    const ticket = await ticketsCollection.findOne({
      "_id": new ObjectId(ticketId),
      "data.schoolCode": user.schoolCode
    });

    if (!ticket) {
      return NextResponse.json(
        { error: "تیکت یافت نشد" },
        { status: 404 }
      );
    }

    // Check if teacher can reply to this ticket
    let canReply = false;
    
    // Creator can always reply
    if (ticket.data.createdByTeacherId === user.id) {
      canReply = true;
    } else {
      // Check if teacher is assigned to the department
      const department = await departmentsCollection.findOne({
        "_id": new ObjectId(ticket.data.departmentId),
        "data.assignedTeachers": user.id
      });
      canReply = !!department;
    }

    if (!canReply) {
      return NextResponse.json({ error: "غیر مجاز" }, { status: 403 });
    }

    // Create reply
    const replyData = {
      data: {
        ticketId: ticketId,
        authorTeacherId: user.id,
        message: message.trim(),
        attachments: attachments || [],
        createdAt: new Date()
      }
    };

    const repliesCollection = connection.collection("ticketing_replies");
    const result = await repliesCollection.insertOne(replyData);

    // Update ticket's updatedAt timestamp
    await ticketsCollection.updateOne(
      { "_id": new ObjectId(ticketId) },
      { $set: { "data.updatedAt": new Date() } }
    );

    return NextResponse.json({
      success: true,
      reply: {
        _id: result.insertedId,
        ...replyData,
        authorName: user.name
      }
    });
  } catch (error) {
    logger.error("Error creating reply:", error);
    return NextResponse.json(
      { error: "خطا در ایجاد پاسخ" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "غیر مجاز" }, { status: 401 });
    }

    const domain = request.headers.get("x-domain") || "localhost:3000";
    const { searchParams } = new URL(request.url);
    const ticketId = searchParams.get("ticketId");

    if (!ticketId) {
      return NextResponse.json(
        { error: "شناسه تیکت الزامی است" },
        { status: 400 }
      );
    }

    // Connect to domain-specific database
    const connection = await connectToDatabase(domain);
    const ticketsCollection = connection.collection("ticketing_tickets");
    const departmentsCollection = connection.collection("ticketing_departments");

    // Check if user can access this ticket
    const ticket = await ticketsCollection.findOne({
      "_id": new ObjectId(ticketId),
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

    // Get replies
    const repliesCollection = connection.collection("ticketing_replies");
    const replies = await repliesCollection
      .find({ "data.ticketId": ticketId })
      .sort({ "data.createdAt": 1 })
      .toArray();

    // Get teachers info for reply authors
    const teacherIds = replies.map(r => r.data.authorTeacherId)
      .filter((id, index, arr) => arr.indexOf(id) === index);

    const teachersCollection = connection.collection("teachers");
    const teachers = await teachersCollection
      .find({ "_id": { $in: teacherIds.map(id => new ObjectId(id)) } })
      .toArray();

    // Enrich replies with author names
    const enrichedReplies = replies.map(reply => {
      const author = teachers.find(t => t._id.toString() === reply.data.authorTeacherId);
      return {
        ...reply,
        authorName: author?.data.teacherName || "نامشخص"
      };
    });

    return NextResponse.json({ replies: enrichedReplies });
  } catch (error) {
    logger.error("Error fetching replies:", error);
    return NextResponse.json(
      { error: "خطا در دریافت پاسخ‌ها" },
      { status: 500 }
    );
  }
}

