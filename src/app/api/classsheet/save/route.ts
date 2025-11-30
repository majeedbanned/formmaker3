import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { logger } from "@/lib/logger";
import { 
  sendAbsenceNotification, 
  sendGradeNotification, 
  sendAssessmentNotification,
  sendNoteNotification 
} from "@/lib/notifications/autoSendHelper";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      classCode, 
      studentCode, 
      teacherCode, 
      courseCode, 
      date, 
      timeSlot, 
      note, 
      schoolCode, 
      grades, 
      presenceStatus, 
      descriptiveStatus, 
      assessments,
      persianDate,
      persianMonth
    } = body;

    // Get domain from request headers
    const domain = request.headers.get("x-domain") || "localhost:3000";
    
    // Create a unique identifier for debugging
    const cellIdentifier = `${classCode}_${studentCode}_${teacherCode}_${courseCode}_${schoolCode}_${date}_${timeSlot}`;
    logger.info(`Saving classsheet data for domain: ${domain}, identifier: ${cellIdentifier}`);
    logger.debug("Data includes:", { 
      presenceStatus, 
      descriptiveStatus: descriptiveStatus || 'None',
      gradeCount: grades?.length || 0,
      assessmentCount: assessments?.length || 0,
      hasNote: note ? 'Yes' : 'No',
      persianDate: persianDate || 'Not provided',
      persianMonth: persianMonth || 'Not provided'
    });

    // Validate required fields
    if (!classCode || !studentCode || !teacherCode || !courseCode || !date || !timeSlot || !schoolCode) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    try {
      // Connect to the domain-specific database
      const connection = await connectToDatabase(domain);
      
      // Get the classsheet collection directly from the connection
      const classheetCollection = connection.collection("classsheet");
      
      // Query to find if this cell data already exists (for debugging)
      const existingRecord = await classheetCollection.findOne({
        classCode,
        studentCode,
        teacherCode,
        courseCode,
        schoolCode,
        date,
        timeSlot,
      });

      logger.debug(`Existing record found: ${existingRecord ? "Yes" : "No"}`);
      
      // Create or update the cell data
      const result = await classheetCollection.updateOne(
        {
          classCode,
          studentCode,
          teacherCode,
          courseCode,
          schoolCode,
          date,
          timeSlot,
        },
        {
          $set: {
            note,
            grades: grades || [],
            presenceStatus,
            descriptiveStatus: descriptiveStatus || "",
            assessments: assessments || [],
            persianDate: persianDate || "",
            persianMonth: persianMonth || "",
            updatedAt: new Date(),
          },
          $setOnInsert: {
            createdAt: new Date(),
          },
        },
        { upsert: true }
      );

      logger.info(`Save result for ${cellIdentifier}: upserted=${result.upsertedCount > 0}, modified=${result.modifiedCount > 0}`);
      
      // Send automatic notifications (async, don't wait)
      sendAutoNotificationsForClasssheet({
        domain,
        schoolCode,
        studentCode,
        teacherCode,
        courseCode,
        classCode,
        presenceStatus,
        grades,
        assessments,
        note,
        descriptiveStatus,
        existingRecord,
        date,
        timeSlot,
        persianDate,
        persianMonth
      }).catch(error => {
        logger.error(`Error sending auto-notifications for ${cellIdentifier}:`, error);
      });
      
      return NextResponse.json({
        success: true,
        message: "Cell data saved successfully",
        upserted: result.upsertedCount > 0,
        modified: result.modifiedCount > 0,
      });
    } catch (dbError) {
      logger.error(`Database error for domain ${domain}:`, dbError);
      return NextResponse.json(
        { error: "Error connecting to the database" },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error("Error in classsheet save API:", error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

/**
 * Send automatic notifications based on classsheet changes
 */
async function sendAutoNotificationsForClasssheet(params: {
  domain: string;
  schoolCode: string;
  studentCode: string;
  teacherCode: string;
  courseCode: string;
  classCode: string;
  presenceStatus: any;
  grades: any;
  assessments: any;
  note: any;
  descriptiveStatus: any;
  existingRecord: any;
  date: string;
  timeSlot: string;
  persianDate: string;
  persianMonth: string;
}) {
  const {
    domain,
    schoolCode,
    studentCode,
    teacherCode,
    courseCode,
    classCode,
    presenceStatus,
    grades,
    assessments,
    note,
    descriptiveStatus,
    existingRecord,
    date,
    timeSlot,
    persianDate,
    persianMonth
  } = params;

  try {
    // Get student and course info for notification messages
    const connection = await connectToDatabase(domain);
    
    const student = await connection.collection('students').findOne({
      'data.studentCode': studentCode,
      'data.schoolCode': schoolCode
    });

    if (!student) {
      logger.warn(`[AutoNotif] Student ${studentCode} not found`);
      return;
    }

    const studentName = `${student.data.studentName || ''} ${student.data.studentFamily || ''}`.trim();
    
    // Get course name
    const course = await connection.collection('courses').findOne({
      'data.courseCode': courseCode,
      'data.schoolCode': schoolCode
    });
    const courseName = course?.data?.courseName || courseCode;

    // Get teacher name
    const teacher = await connection.collection('teachers').findOne({
      'data.teacherCode': teacherCode,
      'data.schoolCode': schoolCode
    });
    const teacherName = teacher?.data?.teacherName || undefined;

    // Get class name
    const classDoc = await connection.collection('classes').findOne({
      'data.classCode': classCode,
      'data.schoolCode': schoolCode
    });
    const className = classDoc?.data?.className || undefined;

    // 1. Check for absence/delay changes
    if (presenceStatus && (!existingRecord || existingRecord.presenceStatus !== presenceStatus)) {
      if (presenceStatus === 'absent' || presenceStatus === 'late') {
        logger.info(`[AutoNotif] Presence status changed to ${presenceStatus}, sending notification`);
        await sendAbsenceNotification(
          studentCode,
          schoolCode,
          domain,
          presenceStatus,
          studentName,
          courseName,
          teacherCode,
          classCode,
          teacherName,
          className,
          persianDate,
          timeSlot
        );
      }
    }

    // 2. Check for new grades
    if (grades && Array.isArray(grades) && grades.length > 0) {
      const hasNewGrades = !existingRecord || 
        !existingRecord.grades || 
        grades.length > existingRecord.grades.length ||
        JSON.stringify(grades) !== JSON.stringify(existingRecord.grades);

      if (hasNewGrades) {
        logger.info(`[AutoNotif] Grades changed, sending notification`);
        const gradeInfo = grades.map((g: any) => `${g.title}: ${g.value}`).join(', ');
        await sendGradeNotification(
          studentCode,
          schoolCode,
          domain,
          studentName,
          courseName,
          gradeInfo,
          teacherCode,
          classCode,
          teacherName,
          className,
          persianDate
        );
      }
    }

    // 3. Check for new assessments
    if (assessments && Array.isArray(assessments) && assessments.length > 0) {
      const hasNewAssessments = !existingRecord || 
        !existingRecord.assessments || 
        assessments.length > existingRecord.assessments.length ||
        JSON.stringify(assessments) !== JSON.stringify(existingRecord.assessments);

      if (hasNewAssessments) {
        logger.info(`[AutoNotif] Assessments changed, sending notification`);
        const assessmentInfo = assessments
          .map((a: any) => {
            const title = a.title || 'ارزیابی';
            const value = a.value || a.assessment;
            return value ? `${title}: ${value}` : title;
          })
          .join('\n📋 ');
        await sendAssessmentNotification(
          studentCode,
          schoolCode,
          domain,
          studentName,
          courseName,
          assessmentInfo,
          teacherCode,
          classCode,
          teacherName,
          className,
          persianDate
        );
      }
    }

    // 4. Check for new notes
    if (note && (!existingRecord || existingRecord.note !== note)) {
      logger.info(`[AutoNotif] Note changed, sending notification`);
      await sendNoteNotification(
        studentCode,
        schoolCode,
        domain,
        studentName,
        courseName,
        'note',
        teacherCode,
        classCode,
        teacherName,
        className,
        persianDate,
        note
      );
    }

    // 5. Check for new descriptive status
    if (descriptiveStatus && (!existingRecord || existingRecord.descriptiveStatus !== descriptiveStatus)) {
      logger.info(`[AutoNotif] Descriptive status changed, sending notification`);
      await sendNoteNotification(
        studentCode,
        schoolCode,
        domain,
        studentName,
        courseName,
        'descriptive',
        teacherCode,
        classCode,
        teacherName,
        className,
        persianDate,
        descriptiveStatus
      );
    }

  } catch (error) {
    logger.error('[AutoNotif] Error in sendAutoNotificationsForClasssheet:', error);
    // Don't throw - notification failures shouldn't stop the save
  }
} 