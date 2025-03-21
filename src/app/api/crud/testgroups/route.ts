import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import { parse } from 'querystring';

// Reusable function to connect to MongoDB
const connectToDatabase = async (connectionString: string) => {
  const client = new MongoClient(connectionString);
  await client.connect();
  return client;
};

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const params = parse(url.search.substring(1)); // Remove the leading '?'
    
    const connectionString = params.connectionString as string;
    const collectionName = params.collectionName as string;
    const page = parseInt(params.page as string) || 1;
    const pageSize = parseInt(params.pageSize as string) || 10;
    const sortField = params.sortField as string || '_id';
    const sortOrder = (params.sortOrder as string) === 'desc' ? -1 : 1;
    const searchQuery = params.searchQuery as string;
    const filterQuery = params.filterQuery ? JSON.parse(decodeURIComponent(params.filterQuery as string)) : {};
    
    // Validate required params
    if (!connectionString || !collectionName) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const client = await connectToDatabase(connectionString);
    const db = client.db();
    const collection = db.collection(collectionName);
    
    let query: any = { ...filterQuery };
    
    // Add search query if provided
    if (searchQuery) {
      // Simple text search across all string fields
      query = {
        ...query,
        $or: [
          { 'data.title': { $regex: searchQuery, $options: 'i' } },
          { 'data.course': { $regex: searchQuery, $options: 'i' } },
        ]
      };
    }
    
    // Get total count
    const totalCount = await collection.countDocuments(query);
    
    // Get paginated results
    const results = await collection
      .find(query)
      .sort({ [sortField]: sortOrder })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .toArray();
    
    await client.close();
    
    return NextResponse.json({
      data: results,
      page,
      pageSize,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize)
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { connectionString, collectionName, data } = body;
    
    // Validate required fields
    if (!connectionString || !collectionName || !data) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    const client = await connectToDatabase(connectionString);
    const db = client.db();
    const collection = db.collection(collectionName);
    
    // Add timestamps
    const now = new Date().toISOString();
    const entityData = {
      data,
      createdAt: now,
      updatedAt: now
    };
    
    const result = await collection.insertOne(entityData);
    await client.close();
    
    return NextResponse.json({
      _id: result.insertedId,
      ...entityData
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { connectionString, collectionName, id, data } = body;
    
    // Validate required fields
    if (!connectionString || !collectionName || !id || !data) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    const client = await connectToDatabase(connectionString);
    const db = client.db();
    const collection = db.collection(collectionName);
    
    // Update entity with timestamp
    const now = new Date().toISOString();
    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          data,
          updatedAt: now
        } 
      },
      { returnDocument: 'after' }
    );
    
    await client.close();
    
    if (!result) {
      return NextResponse.json(
        { error: 'Entity not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const params = parse(url.search.substring(1));
    
    const connectionString = params.connectionString as string;
    const collectionName = params.collectionName as string;
    const id = params.id as string;
    
    // Validate required params
    if (!connectionString || !collectionName || !id) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    const client = await connectToDatabase(connectionString);
    const db = client.db();
    const collection = db.collection(collectionName);
    
    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    await client.close();
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Entity not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
} 