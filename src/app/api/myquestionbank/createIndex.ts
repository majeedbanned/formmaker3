import { NextRequest, NextResponse } from 'next/server';
import { connectToMasterDb } from '@/lib/masterdb';

// API route for creating indexes on the questions collection
export async function GET(request: NextRequest) {
  try {
    // Connect to the master database
    const db = await connectToMasterDb();
    
    // Create indexes to improve query performance
    const results = await Promise.all([
      // Index for grade filtering
      db.collection('questions').createIndex({ grade: 1 }),
      
      // Compound indexes for categorical filtering
      db.collection('questions').createIndex({ grade: 1, cat1: 1 }),
      db.collection('questions').createIndex({ grade: 1, cat1: 1, cat2: 1 }),
      db.collection('questions').createIndex({ grade: 1, cat1: 1, cat2: 1, cat3: 1 }),
      
      // Index for sorting by id
      db.collection('questions').createIndex({ _id: -1 }),
      
      // Index for difficulty
      db.collection('questions').createIndex({ difficulty: 1 })
    ]);
    
    // Create indexes on the categories collection too
    await Promise.all([
      db.collection('categories').createIndex({ grade: 1 }),
      db.collection('categories').createIndex({ grade: 1, cat1: 1 }),
      db.collection('categories').createIndex({ grade: 1, cat1: 1, cat2: 1 }),
      db.collection('categories').createIndex({ grade: 1, cat1: 1, cat2: 1, cat3: 1 })
    ]);
    
    return NextResponse.json({
      success: true,
      message: 'Indexes created successfully',
      results
    });
  } catch (error) {
    console.error('Error creating indexes:', error);
    return NextResponse.json(
      { error: 'Failed to create indexes' },
      { status: 500 }
    );
  }
} 