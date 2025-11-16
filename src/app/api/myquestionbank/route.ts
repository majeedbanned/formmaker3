import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

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
    const username = searchParams.get('username'); // Get the current user's username
    
    // Build query filter - omit empty filters for better performance
    const filter: Record<string, unknown> = {};
    
    if (grade && grade.trim() !== '') filter.grade = parseInt(grade, 10);
    if (cat1 && cat1.trim() !== '') filter.cat1 = cat1;
    if (cat2 && cat2.trim() !== '') filter.cat2 = cat2;
    if (cat3 && cat3.trim() !== '') filter.cat3 = cat3;
    if (cat4 && cat4.trim() !== '') filter.cat4 = cat4;
    if (difficulty && difficulty.trim() !== '') filter.difficulty = difficulty;
    if (type && type.trim() !== '') filter.type = type;
    
    // Filter by username if provided
    if (username && username.trim() !== '') {
      filter.createdBy = username;
    }

    const domain = request.headers.get("x-domain") || "localhost:3000";

    // Connect to the master database
    const db = await connectToDatabase(domain);
    
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

// API route for creating new questions
export async function POST(request: NextRequest) {
  try {
    // Get domain from request headers
    const domain = request.headers.get("x-domain") || "localhost:3000";
    // console.log(`Adding new question for domain: ${domain}`);

    // Parse the request body
    const questionData = await request.json();

    // Validate required fields
    if (!questionData.grade || !questionData.cat1 || !questionData.question) {
      return NextResponse.json(
        { error: 'Required fields missing: grade, cat1, question' },
        { status: 400 }
      );
    }

    // Validate schoolCode and createdBy (user ID)
    if (!questionData.schoolCode || !questionData.createdBy) {
      return NextResponse.json(
        { error: 'Required metadata missing: schoolCode, createdBy' },
        { status: 400 }
      );
    }

    try {
      // Import the connectToDatabase function from mongodb.ts
      const { connectToDatabase } = await import('@/lib/mongodb');
      
      // Connect to the domain-specific database
      const connection = await connectToDatabase(domain);
      
      // Get the questions collection directly from the connection
      const questionsCollection = connection.collection("questions");

      // Get the latest ID to increment
      const latestQuestion = await questionsCollection
        .find()
        .sort({ id: -1 })
        .limit(1)
        .toArray();

      // Increment or start with ID 1
      const nextId = latestQuestion.length > 0 ? latestQuestion[0].id + 1 : 1;

      // Prepare the question object with metadata
      const newQuestion = {
        id: nextId,
        grade: parseInt(questionData.grade, 10),
        cat1: questionData.cat1,
        cat2: questionData.cat2 || '',
        cat3: questionData.cat3 || '',
        cat4: questionData.cat4 || '',
        difficulty: questionData.difficulty || ' متوسط ',
        type: questionData.type || ' تستی ',
        question: questionData.question,
        questionkey: questionData.questionkey || '',
        // Additional fields for multiple choice questions
        option1: questionData.option1 || '',
        option2: questionData.option2 || '',
        option3: questionData.option3 || '',
        option4: questionData.option4 || '',
        correctoption: parseInt(questionData.correctoption) || 1,
        // Metadata
        schoolCode: questionData.schoolCode,
        createdBy: questionData.createdBy,
        createdAt: new Date(),
        isPrivate: true // By default, questions are private to the school
      };

      // Insert the new question
      const result = await questionsCollection.insertOne(newQuestion);

      if (result.acknowledged) {
        // console.log(`Successfully added question with ID: ${nextId} for domain: ${domain}`);
        return NextResponse.json({
          success: true,
          message: 'Question added successfully',
          questionId: result.insertedId,
          id: nextId
        });
      } else {
        console.error(`Failed to insert question for domain: ${domain}`);
        return NextResponse.json(
          { error: 'Failed to insert question' },
          { status: 500 }
        );
      }
    } catch (dbError) {
      console.error(`Database error for domain ${domain}:`, dbError);
      return NextResponse.json(
        { error: "Error connecting to the database" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error creating question:', error);
    return NextResponse.json(
      { error: 'Failed to create question' },
      { status: 500 }
    );
  }
} 