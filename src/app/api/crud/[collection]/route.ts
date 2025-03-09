import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, getDynamicModel } from '@/lib/mongodb';
import mongoose from 'mongoose';

export async function POST(
  request: NextRequest,
  { params }: { params: { collection: string } }
) {
  try {
    const { connectionString, data } = await request.json();
    await connectToDatabase(connectionString);
    
    const model = getDynamicModel(params.collection);
    const document = new model({
      _id: new mongoose.Types.ObjectId(),
      data: new Map(Object.entries(data))
    });
    
    await document.save();
    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create document' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { collection: string } }
) {
  try {
    const connectionString = request.headers.get('x-mongodb-connection');
    if (!connectionString) {
      return NextResponse.json(
        { error: 'Connection string is required' },
        { status: 400 }
      );
    }

    const searchParams = new URL(request.url).searchParams;
    const filters = searchParams.get('filters');
    const searchQuery = searchParams.get('query');

    await connectToDatabase(connectionString);
    const model = getDynamicModel(params.collection);

    // Build the MongoDB query
    const query: any = {};

    // Handle global search
    if (searchQuery) {
      const searchRegex = new RegExp(searchQuery, 'i');
      query.$or = [
        { 'data.$**': searchRegex }
      ];
    }

    // Handle advanced filters
    if (filters) {
      const parsedFilters = JSON.parse(filters);
      Object.entries(parsedFilters).forEach(([field, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (typeof value === 'string') {
            // Case-insensitive search for string values
            query[`data.${field}`] = new RegExp(value, 'i');
          } else {
            // Exact match for other types
            query[`data.${field}`] = value;
          }
        }
      });
    }

    const documents = await model.find(query).sort({ createdAt: -1 });
    return NextResponse.json(documents);
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { collection: string } }
) {
  try {
    const { connectionString, id, data } = await request.json();
    await connectToDatabase(connectionString);
    
    const model = getDynamicModel(params.collection);
    const document = await model.findByIdAndUpdate(
      id,
      { 
        $set: { data: new Map(Object.entries(data)) },
        updatedAt: new Date()
      },
      { new: true }
    );
    
    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(document);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update document' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { collection: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const connectionString = request.headers.get('x-mongodb-connection');

    if (!connectionString) {
      return NextResponse.json(
        { error: 'Connection string is required' },
        { status: 400 }
      );
    }

    await connectToDatabase(connectionString);
    const model = getDynamicModel(params.collection);
    const document = await model.findByIdAndDelete(id);
    
    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ message: 'Document deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    );
  }
} 