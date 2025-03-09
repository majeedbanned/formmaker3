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

    await connectToDatabase(connectionString);
    const model = getDynamicModel(params.collection);
    const documents = await model.find().sort({ createdAt: -1 });
    
    return NextResponse.json(documents);
  } catch (error) {
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