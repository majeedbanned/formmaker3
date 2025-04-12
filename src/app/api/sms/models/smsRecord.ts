import mongoose from 'mongoose';

// Define interface for SMS records
export interface ISmsRecord {
  messageId: string;
  fromNumber: string;
  toNumber: string;
  message: string;
  status: string;
  statusCheckedAt?: Date;
  userId: string;
  sentAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Schema for storing SMS records
const smsRecordSchema = new mongoose.Schema<ISmsRecord>({
  messageId: {
    type: String,
    required: true,
  },
  fromNumber: {
    type: String,
    required: true,
  },
  toNumber: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    default: 'sent',
  },
  statusCheckedAt: {
    type: Date,
    default: null,
  },
  userId: {
    type: String,
    required: true,
  },
  sentAt: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Create indexes for better query performance
smsRecordSchema.index({ userId: 1 });
smsRecordSchema.index({ messageId: 1 });
smsRecordSchema.index({ sentAt: -1 });

// Function to get the SMS record model for a specific MongoDB connection
export const getSmsRecordModel = (connection: mongoose.Connection) => {
  try {
    return connection.model<ISmsRecord>('SmsRecord');
  } catch {
    return connection.model<ISmsRecord>('SmsRecord', smsRecordSchema);
  }
}; 