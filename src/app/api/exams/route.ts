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
    const collection = connection.collection('exam');
    
    // Query exams for the user's school
    const exams = await collection.find({ 
      'data.schoolCode': user.schoolCode 
    }).sort({ 
      'createdAt': -1 
    }).toArray();

    return NextResponse.json(exams);
    
  } catch (error) {
    console.error('Error fetching exams:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 