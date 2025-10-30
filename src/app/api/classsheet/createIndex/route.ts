import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { logger } from '@/lib/logger';

// API route for creating indexes on the classsheet collection
export async function GET(request: NextRequest) {
  try {
    // Get domain from request headers
    const domain = request.headers.get("x-domain") || "localhost:3000";
    const db = await connectToDatabase(domain);
    
    logger.info(`Creating indexes for classsheet collection in domain: ${domain}`);
    
    // Create indexes to improve query performance based on common query patterns
    const results = await Promise.all([
      // 1. Primary query pattern: schoolCode + classCode (for filtered reports)
      db.collection('classsheet').createIndex(
        { schoolCode: 1, classCode: 1 },
        { name: 'schoolCode_classCode_idx' }
      ),
      
      // 2. Primary query pattern: schoolCode + classCode + date (for daily reports)
      db.collection('classsheet').createIndex(
        { schoolCode: 1, classCode: 1, date: 1 },
        { name: 'schoolCode_classCode_date_idx' }
      ),
      
      // 3. Teacher-based queries: schoolCode + teacherCode + date
      db.collection('classsheet').createIndex(
        { schoolCode: 1, teacherCode: 1, date: 1 },
        { name: 'schoolCode_teacherCode_date_idx' }
      ),
      
      // 4. Student-based queries: schoolCode + studentCode + date
      db.collection('classsheet').createIndex(
        { schoolCode: 1, studentCode: 1, date: 1 },
        { name: 'schoolCode_studentCode_date_idx' }
      ),
      
      // 5. Course-based queries: schoolCode + courseCode + date
      db.collection('classsheet').createIndex(
        { schoolCode: 1, courseCode: 1, date: 1 },
        { name: 'schoolCode_courseCode_date_idx' }
      ),
      
      // 6. Date range queries: schoolCode + date (for date range filtering)
      db.collection('classsheet').createIndex(
        { schoolCode: 1, date: 1 },
        { name: 'schoolCode_date_idx' }
      ),
      
      // 7. Update tracking: updatedAt for recent changes
      db.collection('classsheet').createIndex(
        { updatedAt: -1 },
        { name: 'updatedAt_desc_idx' }
      ),
      
      // 8. Persistence tracking: createdAt for reporting
      db.collection('classsheet').createIndex(
        { createdAt: -1 },
        { name: 'createdAt_desc_idx' }
      ),
      
      // 9. Presence status filtering: schoolCode + presenceStatus (for absent/late students)
      db.collection('classsheet').createIndex(
        { schoolCode: 1, presenceStatus: 1 },
        { name: 'schoolCode_presenceStatus_idx' }
      ),
      
      // 10. Multi-class + date: classCode array with date (for the new multi-select feature)
      db.collection('classsheet').createIndex(
        { classCode: 1, date: 1 },
        { name: 'classCode_date_idx' }
      ),
    ]);
    
    logger.info(`Successfully created ${results.length} indexes for classsheet collection`);
    
    return NextResponse.json({
      success: true,
      message: 'Indexes created successfully for classsheet collection',
      indexesCreated: results.length,
      indexes: [
        'schoolCode_classCode_idx',
        'schoolCode_classCode_date_idx',
        'schoolCode_teacherCode_date_idx',
        'schoolCode_studentCode_date_idx',
        'schoolCode_courseCode_date_idx',
        'schoolCode_date_idx',
        'updatedAt_desc_idx',
        'createdAt_desc_idx',
        'schoolCode_presenceStatus_idx',
        'classCode_date_idx'
      ]
    });
  } catch (error) {
    logger.error('Error creating indexes:', error);
    return NextResponse.json(
      { error: 'Failed to create indexes' },
      { status: 500 }
    );
  }
}

