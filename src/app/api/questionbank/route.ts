import { NextRequest, NextResponse } from 'next/server';
import { connectToMasterDb } from '@/lib/masterdb';

// API route for fetching paginated and filtered questions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const skip = (page - 1) * limit;
    
    // Filter parameters
    const grade = searchParams.get('grade');
    const cat1 = searchParams.get('cat1');
    const cat2 = searchParams.get('cat2');
    const cat3 = searchParams.get('cat3');
    const cat4 = searchParams.get('cat4');
    const difficulty = searchParams.get('difficulty');
    const type = searchParams.get('type');
    
    // Build query filter - omit empty filters for better performance
    const filter: Record<string, unknown> = {};
    
    if (grade && grade.trim() !== '') filter.grade = parseInt(grade, 10);
    if (cat1 && cat1.trim() !== '') filter.cat1 = cat1;
    if (cat2 && cat2.trim() !== '') filter.cat2 = cat2;
    if (cat3 && cat3.trim() !== '') filter.cat3 = cat3;
    if (cat4 && cat4.trim() !== '') filter.cat4 = cat4;
    if (difficulty && difficulty.trim() !== '') filter.difficulty = difficulty;
    if (type && type.trim() !== '') filter.type = type;

    // Connect to the master database
    const db = await connectToMasterDb();
    
    // Create projection to only return needed fields for better performance
    const projection = {
      _id: 1,
      id: 1,
      grade: 1,
      question: 1,
      questionkey: 1,
      cat1: 1,
      cat2: 1,
      cat3: 1,
      cat4: 1,
      difficulty: 1,
      type: 1,
      // Include options for multiple choice questions
      option1: 1,
      option2: 1,
      option3: 1,
      option4: 1,
      option1image: 1,
      option2image: 1,
      option3image: 1,
      option4image: 1,
      correctoption: 1
    };

    // Get questions with pagination
    const questions = await db
      .collection('questions')  // Correct collection name
      .find(filter)
      .project(projection)  // Use projection to limit returned fields
      .sort({ _id: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    
    // Get total count for pagination
    const total = await db.collection('questions').countDocuments(filter);
    
    return NextResponse.json({
      questions,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questions' },
      { status: 500 }
    );
  }
} 