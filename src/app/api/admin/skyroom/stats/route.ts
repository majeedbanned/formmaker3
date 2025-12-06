import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { AdobeConnectApiClient } from "@/lib/adobeconnect";
import { BigBlueButtonApiClient } from "@/lib/bigbluebutton";
import { logger } from "@/lib/logger";
import { ObjectId } from "mongodb";
import { getCurrentUser } from "@/app/api/chatbot7/config/route";

// GET - Get statistics for a class (Adobe Connect or BigBlueButton)
export async function GET(request: NextRequest) {
  try {
    const domain = request.headers.get("x-domain") || "localhost:3000";
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get("classId");

    if (!classId) {
      return NextResponse.json(
        { success: false, error: "classId is required" },
        { status: 400 }
      );
    }

    // Get current user
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "لطفاً وارد شوید" },
        { status: 401 }
      );
    }

    const connection = await connectToDatabase(domain);
    const classesCollection = connection.collection("skyroomclasses");

    // Get class document
    const classDoc = await classesCollection.findOne({
      _id: new ObjectId(classId),
      "data.schoolCode": user.schoolCode,
    });

    if (!classDoc) {
      return NextResponse.json(
        { success: false, error: "Class not found" },
        { status: 404 }
      );
    }

    const classData = classDoc.data;
    const classType = classData.classType || "skyroom";

    // Get school config for API credentials
    const schoolsCollection = connection.collection("schools");
    const school = await schoolsCollection.findOne({
      "data.schoolCode": user.schoolCode,
    });

    // Handle Adobe Connect statistics
    if (classType === "adobeconnect") {
      const adobeConnectScoId = classData.adobeConnectScoId;

      if (!adobeConnectScoId) {
        return NextResponse.json(
          { success: false, error: "Adobe Connect SCO ID not found" },
          { status: 404 }
        );
      }

      const adobeServerUrl =
        school?.data?.adobeConnectServerUrl || "https://adobe.farsamooz.ir";
      const adobeAdminUsername =
        school?.data?.adobeConnectUsername || "admin@gmail.com";
      const adobeAdminPassword =
        school?.data?.adobeConnectPassword || "357611123qwe!@#QQ";

      try {
        const adobeClient = new AdobeConnectApiClient(
          adobeServerUrl,
          adobeAdminUsername,
          adobeAdminPassword
        );

        // Get meeting info
        const meetingInfo = await adobeClient.getMeetingStats(adobeConnectScoId);

        // Get current attendees
        const attendees = await adobeClient.getCurrentAttendees(adobeConnectScoId);

        // Get recordings
        const recordings = await adobeClient.getMeetingRecordings(adobeConnectScoId);

        return NextResponse.json({
          success: true,
          stats: {
            classType: "adobeconnect",
            meetingName: meetingInfo.name,
            isActive: meetingInfo.isActive || attendees.length > 0,
            currentUsers: attendees.length,
            attendees: attendees.map((a) => ({
              name: a.name,
              login: a.login,
            })),
            recordings: recordings.map((r) => ({
              id: r.scoId,
              name: r.name,
              dateCreated: r.dateCreated,
              playbackUrl: r.playbackUrl,
            })),
          },
        });
      } catch (error: any) {
        logger.error("Error fetching Adobe Connect stats:", error);
        return NextResponse.json({
          success: true,
          stats: {
            classType: "adobeconnect",
            meetingName: classData.className,
            isActive: false,
            currentUsers: 0,
            attendees: [],
            recordings: [],
            error: "Unable to fetch live stats",
          },
        });
      }
    }

    // Handle BigBlueButton statistics
    if (classType === "bigbluebutton") {
      const bbbMeetingID = classData.bbbMeetingID;

      if (!bbbMeetingID) {
        return NextResponse.json(
          { success: false, error: "BigBlueButton meeting ID not found" },
          { status: 404 }
        );
      }

      const bbbUrl = school?.data?.BBB_URL;
      const bbbSecret = school?.data?.BBB_SECRET;

      if (!bbbUrl || !bbbSecret) {
        return NextResponse.json(
          { success: false, error: "BigBlueButton configuration not found" },
          { status: 400 }
        );
      }

      try {
        const bbbClient = new BigBlueButtonApiClient(bbbUrl, bbbSecret);

        // Get meeting info
        const meetingInfo = await bbbClient.getMeetingInfo(bbbMeetingID);

        // Get attendees if meeting is running
        let attendees: Array<{ name: string; role: string }> = [];
        if (meetingInfo?.running) {
          const rawAttendees = await bbbClient.getAttendees(bbbMeetingID);
          attendees = rawAttendees.map((a) => ({
            name: a.fullName,
            role: a.role,
          }));
        }

        // Get recordings
        const recordings = await bbbClient.getRecordings(bbbMeetingID);

        return NextResponse.json({
          success: true,
          stats: {
            classType: "bigbluebutton",
            meetingName: meetingInfo?.meetingName || classData.className,
            isActive: meetingInfo?.running || false,
            currentUsers: meetingInfo?.participantCount || 0,
            moderatorCount: meetingInfo?.moderatorCount || 0,
            attendees,
            recordings: recordings
              .filter((r) => r.published)
              .map((r) => ({
                id: r.recordID,
                name: r.name,
                duration: r.duration,
                playbackUrl: r.playbackUrl,
                thumbnailUrl: r.thumbnailUrl,
              })),
          },
        });
      } catch (error: any) {
        logger.error("Error fetching BigBlueButton stats:", error);
        return NextResponse.json({
          success: true,
          stats: {
            classType: "bigbluebutton",
            meetingName: classData.className,
            isActive: false,
            currentUsers: 0,
            moderatorCount: 0,
            attendees: [],
            recordings: [],
            error: "Unable to fetch live stats",
          },
        });
      }
    }

    // For Skyroom and Google Meet, return basic info (no live stats available)
    return NextResponse.json({
      success: true,
      stats: {
        classType,
        meetingName: classData.className,
        isActive: null, // Unknown for these types
        currentUsers: null,
        attendees: [],
        recordings: [],
      },
    });
  } catch (error) {
    logger.error("Error fetching class stats:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

