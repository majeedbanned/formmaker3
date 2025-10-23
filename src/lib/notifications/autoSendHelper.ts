import { connectToDatabase } from "@/lib/mongodb";
import { logger } from "@/lib/logger";
import axios from "axios";
import { XMLParser } from "fast-xml-parser";

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_"
});

const PUSH_SERVICE_ENDPOINT = "http://push.farsamooz.ir/sendnotif.asmx";

// Event types for auto-notification
export type NotificationEventType = 'absence' | 'late' | 'grade' | 'assessment' | 'event' | 'note';

// Notification payload
export interface AutoNotificationPayload {
  eventType: NotificationEventType;
  studentCode: string;
  schoolCode: string;
  domain: string;
  title: string;
  body: string;
  data?: any;
  teacherCode?: string;
  courseCode?: string;
  classCode?: string;
}

// Result of notification sending
export interface AutoNotificationResult {
  success: boolean;
  sent: boolean;
  reason?: string;
  tokenCount?: number;
  error?: string;
}

/**
 * Main helper function to send automatic notifications
 * Can be called from any API route or service
 * 
 * @param payload - Notification details
 * @returns Result indicating if notification was sent
 */
export async function sendAutoNotification(
  payload: AutoNotificationPayload
): Promise<AutoNotificationResult> {
  const logPrefix = `[AutoNotif][${payload.eventType}][${payload.studentCode}]`;
  
  try {
    logger.info(`${logPrefix} Starting auto-notification check`);

    // Step 1: Check if notifications are enabled for this event type
    const isEnabled = await isNotificationEnabled(payload.schoolCode, payload.eventType, payload.domain);
    
    if (!isEnabled) {
      logger.info(`${logPrefix} Notifications disabled for ${payload.eventType}`);
      return {
        success: true,
        sent: false,
        reason: 'Notifications disabled in preferences'
      };
    }

    logger.info(`${logPrefix} Notifications enabled for ${payload.eventType}`);

    // Step 2: Get student's push tokens
    const tokens = await getStudentPushTokens(payload.studentCode, payload.schoolCode, payload.domain);
    
    logger.info(`${logPrefix} Found ${tokens.length} push tokens`);

    // Step 3: Always log to database (even if no tokens)
    await logAutoNotification(payload, tokens.length, payload.domain, tokens.length === 0 ? 'no_tokens' : 'sent');
    
    if (tokens.length === 0) {
      logger.info(`${logPrefix} No push tokens found for student, but notification logged to database`);
      return {
        success: true,
        sent: false,
        reason: 'No push tokens found',
        tokenCount: 0
      };
    }

    // Step 4: Send notification
    const sendResult = await sendPushNotification(tokens, payload.title, payload.body, payload.data || {});
    
    if (sendResult.success) {
      logger.info(`${logPrefix} Notification sent successfully to ${tokens.length} devices`);
      
      return {
        success: true,
        sent: true,
        tokenCount: tokens.length
      };
    } else {
      logger.error(`${logPrefix} Failed to send notification: ${sendResult.error}`);
      
      // Update log status to failed
      await updateNotificationLogStatus(payload, payload.domain, 'failed');
      
      return {
        success: false,
        sent: false,
        error: sendResult.error,
        tokenCount: tokens.length
      };
    }

  } catch (error) {
    logger.error(`${logPrefix} Error in auto-notification:`, error);
    return {
      success: false,
      sent: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Check if notifications are enabled for specific event type
 * Default: ENABLED (true) if no preference found
 * Only disabled if explicitly set to false in preferences
 */
async function isNotificationEnabled(
  schoolCode: string, 
  eventType: NotificationEventType,
  domain: string
): Promise<boolean> {
  try {
    const connection = await connectToDatabase(domain);
    const preferences = await connection.collection("preferences").findOne({
      schoolCode: schoolCode,
    });

    // If no preferences found, notifications are ENABLED by default
    if (!preferences || !preferences.notifications) {
      logger.info(`[AutoNotif] No preferences found for school ${schoolCode}, using default: ENABLED`);
      return true;
    }

    // Map event types to preference fields
    // Only return false if explicitly set to false
    switch (eventType) {
      case 'absence':
      case 'late':
        // Default to true if not set
        return preferences.notifications.sendOnAbsence !== false;
      case 'grade':
      case 'assessment':
        // Default to true if not set
        return preferences.notifications.sendOnGrade !== false;
      case 'event':
      case 'note':
        // Default to true if not set
        return preferences.notifications.sendOnEvent !== false;
      default:
        return true;
    }
  } catch (error) {
    logger.error('[AutoNotif] Error checking preferences:', error);
    // On error, default to enabled for better UX
    return true;
  }
}

/**
 * Get push tokens for a student
 */
async function getStudentPushTokens(
  studentCode: string,
  schoolCode: string,
  domain: string
): Promise<string[]> {
  try {
    const connection = await connectToDatabase(domain);
    const student = await connection.collection('students').findOne({
      'data.studentCode': studentCode,
      'data.schoolCode': schoolCode
    });

    if (!student || !student.data || !student.data.pushTokens) {
      return [];
    }

    // Extract active tokens
    const tokens = student.data.pushTokens
      .filter((t: any) => t.active !== false)
      .map((t: any) => t.token)
      .filter(Boolean);

    return tokens;
  } catch (error) {
    logger.error('[AutoNotif] Error getting student tokens:', error);
    return [];
  }
}

/**
 * Send push notification via ASMX service
 */
async function sendPushNotification(
  tokens: string[],
  title: string,
  body: string,
  data: any
): Promise<{ success: boolean; error?: string }> {
  try {
    const dataJson = JSON.stringify(data);
    
    // Build SOAP envelope
    const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <soap:Body>
    <SendPushNotificationBatch xmlns="http://push.farsamooz.ir/">
      <tokens>
        ${tokens.map(token => `<string>${escapeXml(token)}</string>`).join('\n        ')}
      </tokens>
      <title>${escapeXml(title)}</title>
      <body>${escapeXml(body)}</body>
      <data>${escapeXml(dataJson)}</data>
    </SendPushNotificationBatch>
  </soap:Body>
</soap:Envelope>`;

    // Send SOAP request
    const response = await axios.post(PUSH_SERVICE_ENDPOINT, soapEnvelope, {
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': 'http://push.farsamooz.ir/SendPushNotificationBatch'
      },
      timeout: 30000
    });

    if (response.status === 200) {
      logger.info('[AutoNotif] ASMX service responded successfully');
      return { success: true };
    } else {
      logger.error('[AutoNotif] ASMX service error:', response.status);
      return { success: false, error: 'ASMX service returned non-200 status' };
    }
  } catch (error) {
    logger.error('[AutoNotif] Error sending push notification:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Log auto-sent notification to database for tracking
 * Always logs regardless of whether tokens exist or notification was sent
 */
async function logAutoNotification(
  payload: AutoNotificationPayload,
  tokenCount: number,
  domain: string,
  status: 'sent' | 'no_tokens' | 'failed' = 'sent'
): Promise<void> {
  try {
    const connection = await connectToDatabase(domain);
    
    // Save to notificationsContent collection (ALWAYS save, even if no tokens)
    await connection.collection('notificationsContent').insertOne({
      type: 'auto',
      eventType: payload.eventType,
      studentCode: payload.studentCode,
      schoolCode: payload.schoolCode,
      teacherCode: payload.teacherCode,
      courseCode: payload.courseCode,
      classCode: payload.classCode,
      title: payload.title,
      body: payload.body,
      tokenCount: tokenCount,
      sentAt: new Date(),
      data: payload.data,
      status: status,
      hasPushTokens: tokenCount > 0,
      delivered: tokenCount > 0 && status === 'sent',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    logger.info(`[AutoNotif] Logged auto-notification to notificationsContent (status: ${status}, tokens: ${tokenCount})`);
  } catch (error) {
    logger.error('[AutoNotif] Error logging to notificationsContent:', error);
    // Don't throw - logging failure shouldn't stop the process
  }
}

/**
 * Update notification log status (if send fails after logging)
 */
async function updateNotificationLogStatus(
  payload: AutoNotificationPayload,
  domain: string,
  status: 'failed'
): Promise<void> {
  try {
    const connection = await connectToDatabase(domain);
    
    // Update the most recent matching notification to failed status
    await connection.collection('notificationsContent').updateOne(
      {
        type: 'auto',
        studentCode: payload.studentCode,
        eventType: payload.eventType,
        title: payload.title,
      },
      {
        $set: {
          status: status,
          delivered: false,
          updatedAt: new Date(),
        }
      },
      { sort: { createdAt: -1 } }
    );

    logger.info(`[AutoNotif] Updated notification status to ${status}`);
  } catch (error) {
    logger.error('[AutoNotif] Error updating notification status:', error);
  }
}

/**
 * Helper to escape XML special characters
 */
function escapeXml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Convenience function: Send notification for absence/late
 */
export async function sendAbsenceNotification(
  studentCode: string,
  schoolCode: string,
  domain: string,
  presenceStatus: string,
  studentName: string,
  courseName: string,
  teacherCode?: string,
  classCode?: string,
  teacherName?: string,
  className?: string,
  date?: string,
  timeSlot?: string
): Promise<AutoNotificationResult> {
  const eventType: NotificationEventType = presenceStatus === 'late' ? 'late' : 'absence';
  
  // Get current Persian date and time
  const now = new Date();
  const persianDate = new Intl.DateTimeFormat('fa-IR').format(now);
  const persianTime = new Intl.DateTimeFormat('fa-IR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  }).format(now);
  
  // Build detailed message
  const title = presenceStatus === 'late' ? '⏰ اطلاع تأخیر' : '❌ اطلاع غیبت';
  
  let body = `دانش آموز عزیز ${studentName}\n`;
  
  if (presenceStatus === 'late') {
    body += `📌 شما امروز ${date || persianDate} در ${timeSlot ? `زنگ ${timeSlot}` : 'کلاس'} تأخیر داشته‌اید\n`;
  } else {
    body += `📌 شما امروز ${date || persianDate} در ${timeSlot ? `زنگ ${timeSlot}` : 'کلاس'} غیبت کرده‌اید\n`;
  }
  
  body += `📚 درس: ${courseName}\n`;
  
  if (className) {
    body += `🏫 کلاس: ${className}\n`;
  }
  
  if (teacherName) {
    body += `👨‍🏫 معلم: ${teacherName}\n`;
  }
  
  body += `\n⏱ زمان ثبت: ${persianTime}`;
  
  return sendAutoNotification({
    eventType,
    studentCode,
    schoolCode,
    domain,
    title,
    body,
    data: {
      type: eventType,
      presenceStatus,
      courseName,
      className,
      teacherName,
      date: date || persianDate,
      timeSlot,
      timestamp: now.toISOString(),
    },
    teacherCode,
    classCode,
  });
}

/**
 * Convenience function: Send notification for grade
 */
export async function sendGradeNotification(
  studentCode: string,
  schoolCode: string,
  domain: string,
  studentName: string,
  courseName: string,
  gradeInfo: string,
  teacherCode?: string,
  classCode?: string,
  teacherName?: string,
  className?: string,
  date?: string
): Promise<AutoNotificationResult> {
  const now = new Date();
  const persianDate = new Intl.DateTimeFormat('fa-IR').format(now);
  const persianTime = new Intl.DateTimeFormat('fa-IR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  }).format(now);
  
  let body = `دانش آموز عزیز ${studentName}\n`;
  body += `✅ نمره شما در درس ${courseName} ثبت شد\n\n`;
  body += `📊 نمره: ${gradeInfo}\n`;
  body += `📅 تاریخ: ${date || persianDate}\n`;
  
  if (className) {
    body += `🏫 کلاس: ${className}\n`;
  }
  
  if (teacherName) {
    body += `👨‍🏫 معلم: ${teacherName}\n`;
  }
  
  body += `\n⏱ زمان ثبت: ${persianTime}`;
  
  return sendAutoNotification({
    eventType: 'grade',
    studentCode,
    schoolCode,
    domain,
    title: '📝 ثبت نمره جدید',
    body,
    data: {
      type: 'grade',
      courseName,
      className,
      teacherName,
      gradeInfo,
      date: date || persianDate,
      timestamp: now.toISOString(),
    },
    teacherCode,
    classCode,
  });
}

/**
 * Convenience function: Send notification for assessment
 */
export async function sendAssessmentNotification(
  studentCode: string,
  schoolCode: string,
  domain: string,
  studentName: string,
  courseName: string,
  assessmentInfo: string,
  teacherCode?: string,
  classCode?: string,
  teacherName?: string,
  className?: string,
  date?: string
): Promise<AutoNotificationResult> {
  const now = new Date();
  const persianDate = new Intl.DateTimeFormat('fa-IR').format(now);
  const persianTime = new Intl.DateTimeFormat('fa-IR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  }).format(now);
  
  let body = `دانش آموز عزیز ${studentName}\n`;
  body += `⭐ ارزیابی شما در درس ${courseName} ثبت شد\n\n`;
  body += `📋 ${assessmentInfo}\n`;
  body += `📅 تاریخ: ${date || persianDate}\n`;
  
  if (className) {
    body += `🏫 کلاس: ${className}\n`;
  }
  
  if (teacherName) {
    body += `👨‍🏫 معلم: ${teacherName}\n`;
  }
  
  body += `\n⏱ زمان ثبت: ${persianTime}`;
  
  return sendAutoNotification({
    eventType: 'assessment',
    studentCode,
    schoolCode,
    domain,
    title: '⭐ ارزیابی جدید',
    body,
    data: {
      type: 'assessment',
      courseName,
      className,
      teacherName,
      assessmentInfo,
      date: date || persianDate,
      timestamp: now.toISOString(),
    },
    teacherCode,
    classCode,
  });
}

/**
 * Convenience function: Send notification for note/descriptive status
 */
export async function sendNoteNotification(
  studentCode: string,
  schoolCode: string,
  domain: string,
  studentName: string,
  courseName: string,
  noteType: 'note' | 'descriptive',
  teacherCode?: string,
  classCode?: string,
  teacherName?: string,
  className?: string,
  date?: string,
  noteContent?: string
): Promise<AutoNotificationResult> {
  const now = new Date();
  const persianDate = new Intl.DateTimeFormat('fa-IR').format(now);
  const persianTime = new Intl.DateTimeFormat('fa-IR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  }).format(now);
  
  const title = noteType === 'note' ? '📝 یادداشت جدید' : '📄 توضیحات جدید';
  
  let body = `دانش آموز عزیز ${studentName}\n`;
  body += noteType === 'note' 
    ? `📝 یادداشت جدیدی برای شما در درس ${courseName} ثبت شد\n\n`
    : `📄 توضیحات تکمیلی جدیدی برای شما در درس ${courseName} ثبت شد\n\n`;
  
  // Include note content if provided (truncate if too long)
  if (noteContent) {
    const truncatedContent = noteContent.length > 100 
      ? noteContent.substring(0, 100) + '...' 
      : noteContent;
    body += `💬 محتوا: ${truncatedContent}\n\n`;
  }
  
  body += `📅 تاریخ: ${date || persianDate}\n`;
  
  if (className) {
    body += `🏫 کلاس: ${className}\n`;
  }
  
  if (teacherName) {
    body += `👨‍🏫 معلم: ${teacherName}\n`;
  }
  
  body += `\n⏱ زمان ثبت: ${persianTime}\n`;
  body += `\nℹ️ برای مشاهده جزئیات بیشتر وارد اپلیکیشن شوید`;

  return sendAutoNotification({
    eventType: 'note',
    studentCode,
    schoolCode,
    domain,
    title,
    body,
    data: {
      type: noteType,
      courseName,
      className,
      teacherName,
      date: date || persianDate,
      timestamp: now.toISOString(),
    },
    teacherCode,
    classCode,
  });
}

