import { NextRequest, NextResponse } from 'next/server';
import { bbbAPI } from '@/lib/bbb';
import { connectToDatabase } from '@/lib/mongodb';
import { logger } from '@/lib/logger';

/**
 * BigBlueButton Join API
 * Handles creating/joining BBB meetings
 */

interface JoinRequest {
  classCode: string;
  className: string;
  userName: string;
  userType: 'school' | 'teacher' | 'student';
  userId: string;
  schoolCode: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: JoinRequest = await request.json();
    const { classCode, className, userName, userType, userId, schoolCode } = body;

    // Get domain from headers
    const domain = request.headers.get('x-domain') || 'localhost:3000';

    // Validate required fields
    if (!classCode || !className || !userName || !userType || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    try {
      // Create unique meeting ID based on school and class
      const meetingID = `${schoolCode}_${classCode}`;
      const meetingName = `${className} - ${schoolCode}`;

      // Check if meeting exists
      const isRunning = await bbbAPI.isMeetingRunning(meetingID);

      // If meeting is not running, create it
      if (!isRunning) {
        logger.info(`Creating new BBB meeting: ${meetingID}`);
        const createResult = await bbbAPI.createMeeting({
          meetingID,
          meetingName,
          attendeePW: 'ap',
          moderatorPW: 'mp',
          welcome: `به کلاس ${className} خوش آمدید`,
          maxParticipants: 100,
          record: false,
        });

        if (!createResult.success) {
          logger.error(`Failed to create BBB meeting: ${createResult.message}`);
          logger.error(`BBB Response: ${createResult.response}`);
          return NextResponse.json(
            { 
              error: 'Failed to create meeting', 
              details: createResult.message,
              response: createResult.response 
            },
            { status: 500 }
          );
        }

        logger.info(`Successfully created BBB meeting: ${meetingID}`);
      } else {
        logger.info(`Joining existing BBB meeting: ${meetingID}`);
      }

      // Determine role and password based on user type
      // School admins and teachers are moderators, students are attendees
      const isModerator = userType === 'school' || userType === 'teacher';
      const password = isModerator ? 'mp' : 'ap';

      // Generate join URL
      const joinUrl = bbbAPI.generateJoinUrl({
        meetingID,
        fullName: userName,
        password,
        userID: userId,
        role: isModerator ? 'moderator' : 'viewer',
      });

      // Log the join event to database
      try {
        const connection = await connectToDatabase(domain);
        const logsCollection = connection.collection('bbb_logs');
        
        await logsCollection.insertOne({
          meetingID,
          classCode,
          className,
          userName,
          userType,
          userId,
          schoolCode,
          action: isRunning ? 'joined' : 'created',
          timestamp: new Date(),
          domain,
        });
      } catch (dbError) {
        // Don't fail the join if logging fails
        logger.error('Failed to log BBB join event:', dbError);
      }

      return NextResponse.json({
        success: true,
        joinUrl,
        meetingID,
        isNewMeeting: !isRunning,
        role: isModerator ? 'moderator' : 'attendee',
      });

    } catch (error) {
      logger.error('Error in BBB join process:', error);
      return NextResponse.json(
        { error: 'Failed to process join request', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      );
    }

  } catch (error) {
    logger.error('Error parsing request:', error);
    return NextResponse.json(
      { error: 'Invalid request format' },
      { status: 400 }
    );
  }
}

/**
 * GET endpoint to check meeting status
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const meetingID = searchParams.get('meetingID');

    if (!meetingID) {
      return NextResponse.json(
        { error: 'meetingID is required' },
        { status: 400 }
      );
    }

    const isRunning = await bbbAPI.isMeetingRunning(meetingID);

    return NextResponse.json({
      meetingID,
      isRunning,
    });

  } catch (error) {
    logger.error('Error checking meeting status:', error);
    return NextResponse.json(
      { error: 'Failed to check meeting status' },
      { status: 500 }
    );
  }
}

