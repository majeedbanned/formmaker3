/**
 * Utility functions for sending push notifications using Expo Push API
 */

interface ExpoPushMessage {
  to: string | string[];
  sound?: 'default' | null;
  title?: string;
  body?: string;
  data?: any;
  badge?: number;
  channelId?: string;
  categoryId?: string;
  mutableContent?: boolean;
  priority?: 'default' | 'normal' | 'high';
  subtitle?: string;
  ttl?: number;
}

interface PushNotificationResult {
  success: boolean;
  id?: string;
  error?: string;
  details?: any;
}

/**
 * Send a push notification using Expo Push API
 * @param message - The push notification message
 * @returns Result of the push notification send
 */
export async function sendExpoPushNotification(
  message: ExpoPushMessage
): Promise<PushNotificationResult> {
  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();

    if (response.ok && result.data) {
      const ticket = result.data[0];
      if (ticket.status === 'ok') {
        return {
          success: true,
          id: ticket.id,
        };
      } else {
        return {
          success: false,
          error: ticket.message || 'Unknown error',
          details: ticket.details,
        };
      }
    } else {
      return {
        success: false,
        error: result.errors ? result.errors[0].message : 'Unknown error',
      };
    }
  } catch (error) {
    console.error('Error sending push notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send push notifications to multiple devices
 * @param tokens - Array of Expo push tokens
 * @param title - Notification title
 * @param body - Notification body
 * @param data - Additional data
 * @returns Results for each token
 */
export async function sendBulkNotifications(
  tokens: string[],
  title: string,
  body: string,
  data?: any
): Promise<PushNotificationResult[]> {
  // Filter out invalid tokens
  const validTokens = tokens.filter(token => 
    token && (token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken['))
  );

  if (validTokens.length === 0) {
    console.warn('No valid Expo push tokens provided');
    return [];
  }

  // Expo allows up to 100 notifications per request
  const chunks = chunkArray(validTokens, 100);
  const results: PushNotificationResult[] = [];

  for (const chunk of chunks) {
    const message: ExpoPushMessage = {
      to: chunk,
      sound: 'default',
      title,
      body,
      data: data || {},
      channelId: 'default',
      priority: 'high',
    };

    const result = await sendExpoPushNotification(message);
    results.push(result);
  }

  return results;
}

/**
 * Send notification to a user based on their stored push tokens
 * @param userTokens - Array of user's device tokens
 * @param title - Notification title
 * @param body - Notification body
 * @param data - Additional data
 */
export async function sendNotificationToUser(
  userTokens: Array<{ token: string; active: boolean; deviceInfo?: any }>,
  title: string,
  body: string,
  data?: any
): Promise<void> {
  // Only send to active tokens
  const activeTokens = userTokens
    .filter(t => t.active && t.token)
    .map(t => t.token);

  if (activeTokens.length === 0) {
    console.log('No active push tokens for user');
    return;
  }

  console.log(`Sending notification to ${activeTokens.length} device(s)`);
  await sendBulkNotifications(activeTokens, title, body, data);
}

/**
 * Helper: Split array into chunks
 */
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Notification templates for common scenarios
 */
export const NotificationTemplates = {
  /**
   * New assignment notification
   */
  newAssignment: (courseName: string, dueDate?: string) => ({
    title: 'تکلیف جدید',
    body: dueDate 
      ? `تکلیف جدید برای درس ${courseName} - مهلت: ${dueDate}`
      : `تکلیف جدید برای درس ${courseName}`,
    data: {
      type: 'new_assignment',
      screen: 'assignments',
    },
  }),

  /**
   * Class reminder notification
   */
  classReminder: (courseName: string, timeSlot: string) => ({
    title: 'یادآوری کلاس',
    body: `کلاس ${courseName} در 15 دقیقه دیگر شروع می‌شود (زنگ ${timeSlot})`,
    data: {
      type: 'class_reminder',
      screen: 'classsheet',
      timeSlot,
    },
  }),

  /**
   * Grade published notification
   */
  gradePublished: (courseName: string, grade: number) => ({
    title: 'نمره جدید',
    body: `نمره درس ${courseName} منتشر شد: ${grade}`,
    data: {
      type: 'grade_published',
      screen: 'grades',
    },
  }),

  /**
   * Absence notification
   */
  absenceAlert: (studentName: string, courseName: string, date: string) => ({
    title: 'اطلاع غیبت',
    body: `${studentName} در درس ${courseName} غایب بود (${date})`,
    data: {
      type: 'absence_alert',
      screen: 'attendance',
    },
  }),

  /**
   * Form submission reminder
   */
  formReminder: (formTitle: string, deadline?: string) => ({
    title: 'یادآوری فرم',
    body: deadline
      ? `فرم "${formTitle}" را تا ${deadline} تکمیل کنید`
      : `لطفا فرم "${formTitle}" را تکمیل کنید`,
    data: {
      type: 'form_reminder',
      screen: 'forms',
    },
  }),

  /**
   * Event notification
   */
  newEvent: (eventTitle: string, eventDate: string) => ({
    title: 'رویداد جدید',
    body: `${eventTitle} - ${eventDate}`,
    data: {
      type: 'new_event',
      screen: 'agenda',
    },
  }),

  /**
   * General announcement
   */
  announcement: (title: string, message: string) => ({
    title,
    body: message,
    data: {
      type: 'announcement',
      screen: 'home',
    },
  }),
};

/**
 * Example usage in your backend:
 * 
 * // Send to a single user
 * const user = await db.collection('students').findOne({...});
 * await sendNotificationToUser(
 *   user.data.pushTokens,
 *   'عنوان',
 *   'متن اعلان',
 *   { customData: 'value' }
 * );
 * 
 * // Send to multiple users
 * const students = await db.collection('students').find({...}).toArray();
 * for (const student of students) {
 *   if (student.data.pushTokens) {
 *     await sendNotificationToUser(
 *       student.data.pushTokens,
 *       'عنوان',
 *       'متن اعلان'
 *     );
 *   }
 * }
 * 
 * // Using templates
 * const notification = NotificationTemplates.classReminder('ریاضی', '3');
 * await sendNotificationToUser(
 *   user.data.pushTokens,
 *   notification.title,
 *   notification.body,
 *   notification.data
 * );
 */

