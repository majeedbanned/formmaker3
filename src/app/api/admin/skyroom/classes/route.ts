import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { SkyroomApiClient } from "@/lib/skyroom";
import { logger } from "@/lib/logger";
import { ObjectId } from "mongodb";
import { getCurrentUser } from "@/app/api/chatbot7/config/route";

/**
 * Extract Google Meet code from a Google Meet URL
 * Returns the meeting code (e.g., "xxx-yyyy-zzz") or null if invalid
 */
function extractGoogleMeetCode(meetUrl: string): string | null {
  if (!meetUrl || typeof meetUrl !== "string") return null;
  
  // Remove whitespace
  const trimmed = meetUrl.trim();
  
  // Try to extract code from URL patterns:
  // https://meet.google.com/xxx-yyyy-zzz
  // meet.google.com/xxx-yyyy-zzz
  // xxx-yyyy-zzz
  const patterns = [
    /meet\.google\.com\/([a-z]{3}-[a-z]{4}-[a-z]{3})/i,
    /^([a-z]{3}-[a-z]{4}-[a-z]{3})$/i,
  ];
  
  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match && match[1]) {
      return match[1].toLowerCase();
    }
  }
  
  return null;
}

// GET - Fetch all Skyroom classes for the school
//apikey-39574801-1-4e7b99ebd922b1f7f1e5719b7f7e8cee
export async function GET(request: NextRequest) {
  try {
    const domain = request.headers.get("x-domain") || "localhost:3000";
    
    // Get current user
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: "لطفاً وارد شوید" },
        { status: 401 }
      );
    }

    // Only school admins can access this
    if (user.userType !== "school") {
      return NextResponse.json(
        { success: false, error: "فقط مدیران مدرسه می‌توانند به این اطلاعات دسترسی داشته باشند" },
        { status: 403 }
      );
    }

    const connection = await connectToDatabase(domain);
    const collection = connection.collection("skyroomclasses");

    // Find all classes for this school
    const classes = await collection
      .find({ "data.schoolCode": user.schoolCode })
      .sort({ "data.classDate": -1, "data.classTime": 1 })
      .toArray();

    return NextResponse.json({
      success: true,
      classes: classes.map((cls) => ({
        _id: cls._id.toString(),
        ...cls.data,
      })),
    });
  } catch (error) {
    logger.error("Error fetching Skyroom classes:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create a new Skyroom class
export async function POST(request: NextRequest) {
  try {
    const domain = request.headers.get("x-domain") || "localhost:3000";
    
    // Get current user
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: "لطفاً وارد شوید" },
        { status: 401 }
      );
    }

    // Only school admins can create classes
    if (user.userType !== "school") {
      return NextResponse.json(
        { success: false, error: "فقط مدیران مدرسه می‌توانند کلاس اسکای‌روم ایجاد کنند" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      className,
      classDescription,
      classDate,
      classTime,
      duration,
      maxUsers,
      selectedStudents,
      selectedTeachers,
      selectedClasses,
      classType = "skyroom", // "skyroom" or "googlemeet"
      googleMeetLink, // Google Meet link (manually entered)
      // skyroomApiKey is ignored; we read from schools collection instead
      scheduleSlots, // optional: weekly schedule from UI
    } = body;

    if (!className || !classDate || !classTime) {
      return NextResponse.json(
        { success: false, error: "نام کلاس، تاریخ و ساعت الزامی است" },
        { status: 400 }
      );
    }

    const connection = await connectToDatabase(domain);

    // Handle Google Meet classes (no API key needed)
    if (classType === "googlemeet") {
      // Validate Google Meet link
      if (!googleMeetLink || typeof googleMeetLink !== "string") {
        return NextResponse.json(
          { success: false, error: "لینک گوگل میت الزامی است" },
          { status: 400 }
        );
      }

      // Extract and validate meeting code
      const meetCode = extractGoogleMeetCode(googleMeetLink);
      if (!meetCode) {
        return NextResponse.json(
          {
            success: false,
            error:
              "لینک گوگل میت معتبر نیست. لطفاً یک لینک معتبر مانند https://meet.google.com/xxx-yyyy-zzz وارد کنید",
          },
          { status: 400 }
        );
      }

      // Normalize the link to full URL format
      const normalizedLink = googleMeetLink.includes("http")
        ? googleMeetLink
        : `https://meet.google.com/${meetCode}`;

      // Get students from selected classes (by classCode) for Google Meet
      let selectedClassCodes: string[] = [];
      if (selectedClasses && selectedClasses.length > 0) {
        const classesCollection = connection.collection("classes");
        const selectedClassDocs = await classesCollection
          .find({
            _id: { $in: selectedClasses.map((id: string) => new ObjectId(id)) },
            "data.schoolCode": user.schoolCode,
          })
          .project({ "data.classCode": 1 })
          .toArray();

        selectedClassCodes = selectedClassDocs
          .map((cls) => cls.data?.classCode as string | undefined)
          .filter((code): code is string => !!code);
      }

      // Store Google Meet class information in database
      const classData = {
        schoolCode: user.schoolCode,
        className,
        classDescription: classDescription || "",
        classDate,
        classTime,
        duration: duration || 60,
        maxUsers: maxUsers || 50,
        classType: "googlemeet",
        googleMeetLink: normalizedLink,
        googleMeetCode: meetCode,
        // explicit student selections by _id
        selectedStudents: selectedStudents || [],
        selectedTeachers: selectedTeachers || [],
        // store class codes (not ids) for matching with students later
        selectedClasses: selectedClassCodes.length
          ? selectedClassCodes
          : selectedClasses || [],
        // store weekly schedule if provided
        scheduleSlots: Array.isArray(scheduleSlots) ? scheduleSlots : [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const classesCollection = connection.collection("skyroomclasses");
      const result = await classesCollection.insertOne({
        data: classData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return NextResponse.json({
        success: true,
        class: {
          _id: result.insertedId.toString(),
          ...classData,
        },
      });
    }

    // Handle Skyroom classes (requires API key)
    // Read Skyroom API key from schools collection
    const schoolsCollection = connection.collection("schools");
    const school = await schoolsCollection.findOne({
      "data.schoolCode": user.schoolCode,
    });

    const skyroomApiKey: string | undefined =
      school?.data?.skyroomapikey || school?.data?.skyroomApiKey;

    if (!skyroomApiKey || skyroomApiKey.length !== 50) {
      return NextResponse.json(
        {
          success: false,
          error:
            "کلید API اسکای‌روم برای این مدرسه تنظیم نشده است. لطفاً از بخش تنظیمات مدرسه آن را فعال کنید.",
        },
        { status: 400 }
      );
    }

    const skyroomClient = new SkyroomApiClient(skyroomApiKey);

    // Ensure numeric values are numbers (Skyroom API is strict about types)
    const maxUsersNumber =
      typeof maxUsers === "number"
        ? maxUsers
        : Number.parseInt(maxUsers || "50", 10) || 50;

    // Generate a unique room name (Latin characters only, max 128 chars)
    const roomName = `room-${user.schoolCode}-${Date.now()}`.toLowerCase().replace(/[^a-z0-9-]/g, "-");

    // Create the room in Skyroom
    const roomId = await skyroomClient.createRoom({
      name: roomName,
      title: className,
      description: classDescription || "",
      max_users: maxUsersNumber,
      op_login_first: true, // Operator must login first
      guest_login: false,
    });

    if (!roomId) {
      return NextResponse.json(
        { success: false, error: "Failed to create Skyroom room" },
        { status: 500 }
      );
    }

    // Get or create Skyroom users for students
    const studentUserIds: number[] = [];
    if (selectedStudents && selectedStudents.length > 0) {
      const studentsCollection = connection.collection("students");
      for (const studentId of selectedStudents) {
        const student = await studentsCollection.findOne({
          _id: new ObjectId(studentId),
          "data.schoolCode": user.schoolCode,
        });

        if (student) {
          const username = `student-${student.data.studentCode}`;
          let skyroomUser = await skyroomClient.getUser(undefined, username);

          if (!skyroomUser) {
            // Create new Skyroom user
            const userId = await skyroomClient.createUser({
              username,
              password: student.data.password || "123456",
              nickname: `${student.data.studentName} ${student.data.studentFamily}`,
              status: 1,
              is_public: false,
            });
            skyroomUser = await skyroomClient.getUser(userId);
          }

          if (skyroomUser) {
            studentUserIds.push(skyroomUser.id);
          }
        }
      }
    }

    // Get or create Skyroom users for teachers
    const teacherUserIds: number[] = [];
    if (selectedTeachers && selectedTeachers.length > 0) {
      const teachersCollection = connection.collection("teachers");
      for (const teacherId of selectedTeachers) {
        const teacher = await teachersCollection.findOne({
          _id: new ObjectId(teacherId),
          "data.schoolCode": user.schoolCode,
        });

        if (teacher) {
          const username = `teacher-${teacher.data.teacherCode}`;
          let skyroomUser = await skyroomClient.getUser(undefined, username);

          if (!skyroomUser) {
            // Create new Skyroom user
            const userId = await skyroomClient.createUser({
              username,
              password: teacher.data.password || "123456",
              nickname: teacher.data.teacherName,
              status: 1,
              is_public: false,
            });
            skyroomUser = await skyroomClient.getUser(userId);
          }

          if (skyroomUser) {
            teacherUserIds.push(skyroomUser.id);
          }
        }
      }
    }

    // Get students from selected classes (by classCode) and ensure they become Skyroom users
    let selectedClassCodes: string[] = [];
    if (selectedClasses && selectedClasses.length > 0) {
      // First, get the class codes from the selected class IDs
      const classesCollection = connection.collection("classes");
      const selectedClassDocs = await classesCollection
        .find({
          _id: { $in: selectedClasses.map((id: string) => new ObjectId(id)) },
          "data.schoolCode": user.schoolCode,
        })
        .project({ "data.classCode": 1 })
        .toArray();

      selectedClassCodes = selectedClassDocs
        .map((cls) => cls.data?.classCode as string | undefined)
        .filter((code): code is string => !!code);

      if (selectedClassCodes.length > 0) {
        const studentsCollection = connection.collection("students");
        const classStudents = await studentsCollection
          .find({
            "data.schoolCode": user.schoolCode,
            "data.classCode": { $in: selectedClassCodes },
          })
          .toArray();

        for (const student of classStudents) {
          const username = `student-${student.data.studentCode}`;
          let skyroomUser = await skyroomClient.getUser(undefined, username);

          if (!skyroomUser) {
            const userId = await skyroomClient.createUser({
              username,
              password: student.data.password || "123456",
              nickname: `${student.data.studentName} ${student.data.studentFamily}`,
              status: 1,
              is_public: false,
            });
            skyroomUser = await skyroomClient.getUser(userId);
          }

          if (skyroomUser && !studentUserIds.includes(skyroomUser.id)) {
            studentUserIds.push(skyroomUser.id);
          }
        }
      }
    }

    // Add all users to the room
    const usersToAdd = [
      ...studentUserIds.map((id) => ({ user_id: id, access: 1 })), // Normal users
      ...teacherUserIds.map((id) => ({ user_id: id, access: 3 })), // Operators
    ];

    if (usersToAdd.length > 0) {
      await skyroomClient.addRoomUsers(roomId, usersToAdd);
    }

    // Store Skyroom class information in database
    const classData = {
      schoolCode: user.schoolCode,
      className,
      classDescription: classDescription || "",
      classDate,
      classTime,
      duration: duration || 60,
      maxUsers: maxUsers || 50,
      classType: "skyroom",
      skyroomRoomId: roomId,
      skyroomRoomName: roomName,
      // explicit student selections by _id
      selectedStudents: selectedStudents || [],
      selectedTeachers: selectedTeachers || [],
      // store class codes (not ids) for matching with students later
      selectedClasses: selectedClassCodes.length
        ? selectedClassCodes
        : selectedClasses || [],
      studentUserIds,
      teacherUserIds,
      // store weekly schedule if provided
      scheduleSlots: Array.isArray(scheduleSlots) ? scheduleSlots : [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const classesCollection = connection.collection("skyroomclasses");
    const result = await classesCollection.insertOne({
      data: classData,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      class: {
        _id: result.insertedId.toString(),
        ...classData,
      },
    });
  } catch (error: any) {
    logger.error("Error creating Skyroom class:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}

// PUT - Update a Skyroom class
export async function PUT(request: NextRequest) {
  try {
    const domain = request.headers.get("x-domain") || "localhost:3000";
    
    // Get current user
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: "لطفاً وارد شوید" },
        { status: 401 }
      );
    }

    if (user.userType !== "school") {
      return NextResponse.json(
        { success: false, error: "فقط مدیران مدرسه می‌توانند کلاس اسکای‌روم را ویرایش کنند" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      classId,
      selectedStudents,
      selectedTeachers,
      selectedClasses,
      scheduleSlots,
      classType,
      googleMeetLink,
      ...updateData
    } = body;

    if (!classId) {
      return NextResponse.json(
        { success: false, error: "Class ID is required" },
        { status: 400 }
      );
    }

    if (!ObjectId.isValid(classId)) {
      return NextResponse.json(
        { success: false, error: "Invalid class ID" },
        { status: 400 }
      );
    }

    const connection = await connectToDatabase(domain);
    const collection = connection.collection("skyroomclasses");

    const updateFields: any = {
      "data.updatedAt": new Date(),
    };

    // Update only provided fields
    if (typeof updateData.className === "string" && updateData.className.length > 0) {
      updateFields["data.className"] = updateData.className;
    }
    if (Object.prototype.hasOwnProperty.call(updateData, "classDescription")) {
      updateFields["data.classDescription"] = updateData.classDescription;
    }
    if (typeof updateData.classDate === "string" && updateData.classDate.length > 0) {
      updateFields["data.classDate"] = updateData.classDate;
    }
    if (typeof updateData.classTime === "string" && updateData.classTime.length > 0) {
      updateFields["data.classTime"] = updateData.classTime;
    }
    if (typeof updateData.duration !== "undefined") {
      updateFields["data.duration"] = updateData.duration;
    }
    if (typeof updateData.maxUsers !== "undefined") {
      updateFields["data.maxUsers"] = updateData.maxUsers;
    }
    if (typeof classType === "string" && (classType === "skyroom" || classType === "googlemeet")) {
      updateFields["data.classType"] = classType;
    }
    
    // Update Google Meet link if provided
    if (typeof googleMeetLink === "string" && googleMeetLink.length > 0) {
      const meetCode = extractGoogleMeetCode(googleMeetLink);
      if (meetCode) {
        const normalizedLink = googleMeetLink.includes("http")
          ? googleMeetLink
          : `https://meet.google.com/${meetCode}`;
        updateFields["data.googleMeetLink"] = normalizedLink;
        updateFields["data.googleMeetCode"] = meetCode;
      }
    }

    // Weekly schedule
    if (Array.isArray(scheduleSlots)) {
      updateFields["data.scheduleSlots"] = scheduleSlots;
    }

    // Participants: selected students and teachers (store ids as-is)
    if (Array.isArray(selectedStudents)) {
      updateFields["data.selectedStudents"] = selectedStudents;
    }
    if (Array.isArray(selectedTeachers)) {
      updateFields["data.selectedTeachers"] = selectedTeachers;
    }

    // Participants: selected classes – convert ids to classCode like in POST
    if (Array.isArray(selectedClasses)) {
      const classesCollection = connection.collection("classes");
      const selectedClassDocs = await classesCollection
        .find({
          _id: {
            $in: selectedClasses
              .filter((id: string) => ObjectId.isValid(id))
              .map((id: string) => new ObjectId(id)),
          },
          "data.schoolCode": user.schoolCode,
        })
        .project({ "data.classCode": 1 })
        .toArray();

      const selectedClassCodes = selectedClassDocs
        .map((cls: any) => cls.data?.classCode as string | undefined)
        .filter((code): code is string => !!code);

      updateFields["data.selectedClasses"] =
        selectedClassCodes.length > 0 ? selectedClassCodes : selectedClasses;
    }

    await collection.updateOne(
      { _id: new ObjectId(classId), "data.schoolCode": user.schoolCode },
      { $set: updateFields }
    );

    return NextResponse.json({
      success: true,
      message: "Class updated successfully",
    });
  } catch (error) {
    logger.error("Error updating Skyroom class:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a Skyroom class
export async function DELETE(request: NextRequest) {
  try {
    const domain = request.headers.get("x-domain") || "localhost:3000";
    
    // Get current user
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: "لطفاً وارد شوید" },
        { status: 401 }
      );
    }

    if (user.userType !== "school") {
      return NextResponse.json(
        { success: false, error: "فقط مدیران مدرسه می‌توانند کلاس اسکای‌روم را حذف کنند" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get("classId");

    if (!classId) {
      return NextResponse.json(
        { success: false, error: "Class ID is required" },
        { status: 400 }
      );
    }

    if (!ObjectId.isValid(classId)) {
      return NextResponse.json(
        { success: false, error: "Invalid class ID" },
        { status: 400 }
      );
    }

    const connection = await connectToDatabase(domain);
    const collection = connection.collection("skyroomclasses");

    const classDoc = await collection.findOne({
      _id: new ObjectId(classId),
      "data.schoolCode": user.schoolCode,
    });

    if (!classDoc) {
      return NextResponse.json(
        { success: false, error: "Class not found" },
        { status: 404 }
      );
    }

    // Note: We don't delete the Skyroom room, just the database record
    // This follows best practices of reusing rooms
    await collection.deleteOne({ _id: new ObjectId(classId) });

    return NextResponse.json({
      success: true,
      message: "Class deleted successfully",
    });
  } catch (error) {
    logger.error("Error deleting Skyroom class:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

