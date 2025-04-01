import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import mongoose, { Filter, Document } from 'mongoose';
import { FormField } from '@/types/crud';
import { logger } from '@/lib/logger';

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
    // Get domain from request headers
    const domain = request.headers.get("x-domain") || "localhost:3000";
    logger.info(`Creating document in collection ${params.collection}`, { domain });

    const { data, formStructure } = await request.json() as {
      data: Record<string, unknown>;
      formStructure: FormField[];
    };

    // Connect to domain-specific database
    const connection = await connectToDatabase(domain);
    const collection = connection.collection(params.collection);
    
    // Check for individual uniqueness constraints
    const uniqueFields = Object.entries(data).filter(([field]) => {
      return formStructure?.find((f: FormField) => f.name === field && f.isUnique);
    });

    const duplicateFields: Record<string, string> = {};

    for (const [field, value] of uniqueFields) {
      const query = { [`data.${field}`]: value } as Filter<Document>;
      const existingDoc = await collection.findOne(query);

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
      const groupQuery = {} as Filter<Document>;
      let hasGroupValues = false;

      groupUniqueFields.forEach(field => {
        if (data[field] !== undefined && data[field] !== null) {
          groupQuery[`data.${field}`] = data[field];
          hasGroupValues = true;
        }
      });

      if (hasGroupValues) {
        const existingDoc = await collection.findOne(groupQuery);
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
    
    const document = {
      _id: new mongoose.Types.ObjectId(),
      data: new Map(Object.entries(data)),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await collection.insertOne(document);
    logger.info(`Document created successfully in ${params.collection}`, { domain });
    return NextResponse.json(document, { status: 201 });
  } catch (err) {
    logger.error('Create error:', err);
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
    // Get domain from request headers
    const domain = request.headers.get("x-domain") || "localhost:3000";
    logger.info(`Fetching documents from collection ${params.collection}`, { domain });

    const searchParams = new URL(request.url).searchParams;
    const filters = searchParams.get('filters');
    const searchQuery = searchParams.get('query');

    // Connect to domain-specific database
    const connection = await connectToDatabase(domain);
    const collection = connection.collection(params.collection);

    // Build the MongoDB query
    const query: MongoQuery = {};
    const conditions: Record<string, unknown>[] = [];

    // Handle global search
    if (searchQuery) {
      conditions.push({
        $or: ['name', 'schoolCode', 'username', 'domain'].map(field => ({
          [`data.${field}`]: { $regex: searchQuery, $options: 'i' }
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

    const documents = await collection.find(query).sort({ createdAt: -1 }).toArray();
    logger.info(`Found ${documents.length} documents in ${params.collection}`, { domain });
    return NextResponse.json(documents);
  } catch (err) {
    logger.error('Search error:', err);
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
    // Get domain from request headers
    const domain = request.headers.get("x-domain") || "localhost:3000";
    logger.info(`Updating document in collection ${params.collection}`, { domain });

    const { id, data, formStructure } = await request.json() as {
      id: string;
      data: Record<string, unknown>;
      formStructure: FormField[];
    };

    // Connect to domain-specific database
    const connection = await connectToDatabase(domain);
    const collection = connection.collection(params.collection);

    // Check for individual uniqueness constraints
    const uniqueFields = Object.entries(data).filter(([field]) => {
      return formStructure?.find((f: FormField) => f.name === field && f.isUnique);
    });

    const duplicateFields: Record<string, string> = {};

    for (const [field, value] of uniqueFields) {
      const query = { 
        _id: { $ne: new mongoose.Types.ObjectId(id) }, // Exclude current document
        [`data.${field}`]: value 
      } as Filter<Document>;
      const existingDoc = await collection.findOne(query);

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
      const groupQuery = { _id: { $ne: new mongoose.Types.ObjectId(id) } } as Filter<Document>;
      let hasGroupValues = false;

      groupUniqueFields.forEach(field => {
        if (data[field] !== undefined && data[field] !== null) {
          groupQuery[`data.${field}`] = data[field];
          hasGroupValues = true;
        }
      });

      if (hasGroupValues) {
        const existingDoc = await collection.findOne(groupQuery);
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

    const result = await collection.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(id) },
      { 
        $set: { 
          data: new Map(Object.entries(data)),
          updatedAt: new Date()
        } 
      },
      { returnDocument: 'after' }
    );

    if (!result) {
      logger.warn(`Document not found for update in ${params.collection}`, { domain, id });
      return NextResponse.json(
        { error: 'Document not found1' },
        { status: 404 }
      );
    }

    logger.info(`Document updated successfully in ${params.collection}`, { domain, id });
    return NextResponse.json(result.value);
  } catch (err) {
    logger.error('Update error:', err);
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
    // Get domain from request headers
    const domain = request.headers.get("x-domain") || "localhost:3000";
    logger.info(`Deleting document from collection ${params.collection}`, { domain });

    const { id } = await request.json() as { id: string };

    // Connect to domain-specific database
    const connection = await connectToDatabase(domain);
    const collection = connection.collection(params.collection);

    const result = await collection.deleteOne({ _id: new mongoose.Types.ObjectId(id) });

    if (result.deletedCount === 0) {
      logger.warn(`Document not found for deletion in ${params.collection}`, { domain, id });
      return NextResponse.json(
        { error: 'Document not found2' },
        { status: 404 }
      );
    }

    logger.info(`Document deleted successfully from ${params.collection}`, { domain, id });
    return NextResponse.json({ message: 'Document deleted successfully' });
  } catch (err) {
    logger.error('Delete error:', err);
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    );
  }
} 