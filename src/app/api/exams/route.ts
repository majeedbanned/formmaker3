import { NextResponse, NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getCurrentUser } from "../chatbot7/config/route";

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get domain from headers (or use default)
    const domain = req.headers.get("x-domain") || "localhost:3000";

    // Connect to MongoDB directly using the utility
    const connection = await connectToDatabase(domain);
    if (!connection) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }
    const collection = connection.collection('exam');
    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 500 });
    }
    // Query exams for the user's school
    console.log('stage xxxxx')
    // const exams = await collection.find({ 
    //   'data.schoolCode': user.schoolCode 
    // }).sort({ 
    //   'createdAt': -1 
    // }).toArray();

    const exams = await collection.find(
      { 'data.schoolCode': user.schoolCode },     // query
      { sort: { createdAt: -1 } }                 // options
    ).toArray();

    return NextResponse.json(exams);
    
  } catch (error) {
    console.error('Error fetching exams:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 