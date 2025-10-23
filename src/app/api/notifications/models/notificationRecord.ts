import mongoose from 'mongoose';

// Define interface for Notification records
export interface INotificationRecord {
  title: string;
  body: string;
  recipientCodes: string[];
  recipientDetails: Array<{
    code: string;
    name: string;
    type: 'student' | 'teacher';
  }>;
  pushTokens: string[]; // Store tokens but don't show to users
  tokenCount: number;
  schoolCode: string;
  userId: string;
  sentAt: Date;
  status: 'sent' | 'failed' | 'pending';
  expoResponse?: any; // Store Expo push notification response
  data?: any; // Additional data sent with notification
  createdAt: Date;
  updatedAt: Date;
}

// Schema for storing Notification records
const notificationRecordSchema = new mongoose.Schema<INotificationRecord>({
  title: {
    type: String,
    required: true,
  },
  body: {
    type: String,
    required: true,
  },
  recipientCodes: {
    type: [String],
    required: true,
  },
  recipientDetails: [{
    code: String,
    name: String,
    type: {
      type: String,
      enum: ['student', 'teacher'],
    },
  }],
  pushTokens: {
    type: [String],
    required: true,
  },
  tokenCount: {
    type: Number,
    required: true,
  },
  schoolCode: {
    type: String,
    required: true,
  },
  userId: {
    type: String,
    required: true,
  },
  sentAt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['sent', 'failed', 'pending'],
    default: 'sent',
  },
  expoResponse: {
    type: mongoose.Schema.Types.Mixed,
    required: false,
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

// Create indexes for better query performance
notificationRecordSchema.index({ userId: 1 });
notificationRecordSchema.index({ schoolCode: 1 });
notificationRecordSchema.index({ sentAt: -1 });
notificationRecordSchema.index({ recipientCodes: 1 });

// Function to get the Notification record model for a specific MongoDB connection
export const getNotificationRecordModel = (connection: mongoose.Connection) => {
  try {
    return connection.model<INotificationRecord>('NotificationRecord');
  } catch {
    return connection.model<INotificationRecord>('NotificationRecord', notificationRecordSchema);
  }
};


