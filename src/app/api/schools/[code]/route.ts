import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(
  request: NextRequest,
  
  { params }: { params: Promise<{ code: string }> }

) {
  // Make sure to await or explicitly handle the params object
  const { code } = await params;
  
  try {
    const domain = request.headers.get("x-domain") || "localhost:3000";

    if (!code) {
      return NextResponse.json(
        { error: 'School code is required' },
        { status: 400 }
      );
    }

    // Connect to the database
    const db = await connectToDatabase(domain);

    // Find the school
    const school = await db.collection('schools').findOne({ "data.schoolCode": code });
    console.log("school33", school);
    if (!school) {
      return NextResponse.json(
        { error: 'School not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(school);
  } catch (error) {
    console.error('Error fetching school:', error);
    return NextResponse.json(
      { error: 'Failed to fetch school details' },
      { status: 500 }
    );
  }
} 