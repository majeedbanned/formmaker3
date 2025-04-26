import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const domain = request.headers.get("x-domain") || "localhost:3000";
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Exam ID is required' },
        { status: 400 }
      );
    }

    // Connect to the database
    const db = await connectToDatabase(domain);

    // Check if ID is a valid ObjectId
    let query;
    try {
      query = { _id: new ObjectId(id) };
    } catch {
      // If ID is not a valid ObjectId, try to find it by examCode
      query = { examCode: id };
    }

    // Find the exam
    const exam = await db.collection('exam').findOne(query);

    if (!exam) {
      return NextResponse.json(
        { error: 'Exam not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(exam);
  } catch (error) {
    console.error('Error fetching exam:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exam details' },
      { status: 500 }
    );
  }
} 