import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, getDynamicModel } from '@/lib/mongodb';
import mongoose, { FilterQuery, Model } from 'mongoose';
import { FormField } from '@/types/crud';
import { getServerSession } from "next-auth";

// Set runtime to nodejs
export const runtime = 'nodejs';

interface MongoQuery {
  $and?: Array<Record<string, unknown>>;
  $or?: Array<Record<string, unknown>>;
  [key: string]: unknown;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { collection: string } }
) {
  try {
    const { connectionString, data, formStructure } = await request.json() as {
      connectionString: string;
      data: Record<string, unknown>;
      formStructure: FormField[];
    };
    await connectToDatabase(connectionString);
    
    const model = getDynamicModel(params.collection) as Model<any>;

    // Check for individual uniqueness constraints
    const uniqueFields = Object.entries(data).filter(([field]) => {
      return formStructure?.find((f: FormField) => f.name === field && f.isUnique);
    });

    const duplicateFields: Record<string, string> = {};

    for (const [field, value] of uniqueFields) {
      const query = { [`data.${field}`]: value } as FilterQuery<any>;
      const existingDoc = await model.findOne(query).exec();

      if (existingDoc) {
        const formField = formStructure?.find((f: FormField) => f.name === field);
        if (formField?.validation?.uniqueMessage) {
          duplicateFields[field] = formField.validation.uniqueMessage;
        }
      }
    }

    // Check for group uniqueness constraints
    const groupUniqueFields = formStructure
      .filter(f => f.groupUniqueness)
      .map(f => f.name);

    if (groupUniqueFields.length > 0) {
      const groupQuery = {} as FilterQuery<any>;
      let hasGroupValues = false;

      groupUniqueFields.forEach(field => {
        if (data[field] !== undefined && data[field] !== null) {
          groupQuery[`data.${field}`] = data[field];
          hasGroupValues = true;
        }
      });

      if (hasGroupValues) {
        const existingDoc = await model.findOne(groupQuery).exec();
        if (existingDoc) {
          const fields = groupUniqueFields.filter(field => data[field] !== undefined && data[field] !== null);
          const titles = fields.map(field => {
            const formField = formStructure.find(f => f.name === field);
            return formField?.title || field;
          });
          
          fields.forEach(field => {
            const formField = formStructure.find(f => f.name === field);
            if (formField?.validation?.groupUniqueMessage) {
              duplicateFields[field] = formField.validation.groupUniqueMessage;
            }
          });
        }
      }
    }

    if (Object.keys(duplicateFields).length > 0) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          duplicateFields
        },
        { status: 400 }
      );
    }
    
    const document = new model({
      _id: new mongoose.Types.ObjectId(),
      data: new Map(Object.entries(data))
    });
    
    await document.save();
    return NextResponse.json(document, { status: 201 });
  } catch (err) {
    console.error('Create error:', err);
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
    const query: MongoQuery = {};
    const conditions: Record<string, unknown>[] = [];

    // Handle global search
    if (searchQuery) {
      conditions.push({
        $or: Object.keys(model.schema.paths)
          .filter(path => path.startsWith('data.'))
          .map(path => ({
            [path]: { $regex: searchQuery, $options: 'i' }
          }))
      });
    }

    // Handle advanced filters
    if (filters) {
      const parsedFilters = JSON.parse(filters) as Record<string, unknown>;
      Object.entries(parsedFilters).forEach(([field, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (typeof value === 'string') {
            // Case-insensitive search for string values
            conditions.push({ [`data.${field}`]: { $regex: value, $options: 'i' } });
          } else if (typeof value === 'boolean') {
            // Exact match for boolean values
            conditions.push({ [`data.${field}`]: value });
          } else if (typeof value === 'number') {
            // Exact match for numeric values
            conditions.push({ [`data.${field}`]: value });
          } else if (Array.isArray(value)) {
            // Array contains for array values
            conditions.push({ [`data.${field}`]: { $in: value } });
          }
        }
      });
    }

    // Combine all conditions with $and
    if (conditions.length > 0) {
      query.$and = conditions;
    }

    const documents = await model.find(query as FilterQuery<unknown>).sort({ createdAt: -1 });
    return NextResponse.json(documents);
  } catch (err) {
    console.error('Search error:', err);
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
    const { connectionString, id, data, formStructure } = await request.json() as {
      connectionString: string;
      id: string;
      data: Record<string, unknown>;
      formStructure: FormField[];
    };
    await connectToDatabase(connectionString);
    
    const model = getDynamicModel(params.collection) as Model<any>;

    // Check for individual uniqueness constraints
    const uniqueFields = Object.entries(data).filter(([field]) => {
      return formStructure?.find((f: FormField) => f.name === field && f.isUnique);
    });

    const duplicateFields: Record<string, string> = {};

    for (const [field, value] of uniqueFields) {
      const query = { 
        _id: { $ne: id }, // Exclude current document
        [`data.${field}`]: value 
      } as FilterQuery<any>;
      const existingDoc = await model.findOne(query).exec();

      if (existingDoc) {
        const formField = formStructure?.find((f: FormField) => f.name === field);
        if (formField?.validation?.uniqueMessage) {
          duplicateFields[field] = formField.validation.uniqueMessage;
        }
      }
    }

    // Check for group uniqueness constraints
    const groupUniqueFields = formStructure
      .filter(f => f.groupUniqueness)
      .map(f => f.name);

    if (groupUniqueFields.length > 0) {
      const groupQuery = { _id: { $ne: id } } as FilterQuery<any>;
      let hasGroupValues = false;

      groupUniqueFields.forEach(field => {
        if (data[field] !== undefined && data[field] !== null) {
          groupQuery[`data.${field}`] = data[field];
          hasGroupValues = true;
        }
      });

      if (hasGroupValues) {
        const existingDoc = await model.findOne(groupQuery).exec();
        if (existingDoc) {
          const fields = groupUniqueFields.filter(field => data[field] !== undefined && data[field] !== null);
          
          fields.forEach(field => {
            const formField = formStructure.find(f => f.name === field);
            if (formField?.validation?.groupUniqueMessage) {
              duplicateFields[field] = formField.validation.groupUniqueMessage;
            }
          });
        }
      }
    }

    if (Object.keys(duplicateFields).length > 0) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          duplicateFields
        },
        { status: 400 }
      );
    }
    
    const document = await model.findByIdAndUpdate(
      id,
      { 
        $set: { data: new Map(Object.entries(data)) },
        updatedAt: new Date()
      },
      { new: true }
    ).exec();
    
    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(document);
  } catch (err) {
    console.error('Update error:', err);
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
    const document = await model.findByIdAndDelete(id) as unknown;
    
    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ message: 'Document deleted successfully' });
  } catch (err) {
    console.error('Delete error:', err);
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    );
  }
} 