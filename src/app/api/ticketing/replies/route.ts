import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { logger } from "@/lib/logger";
import { getCurrentUser } from "@/app/api/chatbot7/config/route";
import { ObjectId } from "mongodb";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !["teacher", "school"].includes(user.userType)) {
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

    if (user.userType === "teacher") {
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
    }

    // Create reply
    const replyData: {
      data: {
        ticketId: string;
        authorTeacherId?: string;
        authorId: string;
        authorType: string;
        authorName: string;
        message: string;
        attachments: Array<unknown>;
        createdAt: Date;
      };
    } = {
      data: {
        ticketId: ticketId,
        authorId: user.id,
        authorType: user.userType,
        authorName:
          user.name ||
          (user.userType === "school" ? "مدیر مدرسه" : "نامشخص"),
        message: message.trim(),
        attachments: Array.isArray(attachments) ? attachments : [],
        createdAt: new Date()
      }
    };

    if (user.userType === "teacher") {
      replyData.data.authorTeacherId = user.id;
    }

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

    // Prepare teacher lookup for replies missing authorName
    const teacherIds = Array.from(
      new Set(
        replies
          .map(reply => {
            if (reply.data.authorName) {
              return null;
            }
            return (
              reply.data.authorTeacherId ||
              (reply.data.authorType === "teacher" ? reply.data.authorId : null)
            );
          })
          .filter((id): id is string => !!id)
      )
    );

    let teachersMap: Map<string, any> | null = null;
    if (teacherIds.length > 0) {
      const teachersCollection = connection.collection("teachers");
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

    return NextResponse.json({ replies: enrichedReplies });
  } catch (error) {
    logger.error("Error fetching replies:", error);
    return NextResponse.json(
      { error: "خطا در دریافت پاسخ‌ها" },
      { status: 500 }
    );
  }
}


