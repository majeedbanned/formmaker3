import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { logger } from '@/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // Get domain from request headers
    const domain = request.headers.get("x-domain") || "localhost:3000";
    
    if (!id) {
      logger.warn(`Missing form ID in request for domain: ${domain}`);
      return NextResponse.json({ error: 'Form ID is required' }, { status: 400 });
    }

    // Validate ObjectId format
    if (!ObjectId.isValid(id)) {
      logger.warn(`Invalid form ID format: ${id} for domain: ${domain}`);
      return NextResponse.json({ error: 'Invalid form ID format' }, { status: 400 });
    }
    
    try {
      // Connect to the domain-specific database
      const connection = await connectToDatabase(domain);
      logger.info(`Connected to database for domain: ${domain}, fetching form ID: ${id}`);
      
      // Get the forms collection directly from the connection
      const formsCollection = connection.collection('forms');
      
      // Query the form
      const form = await formsCollection.findOne({ 
        _id: new ObjectId(id) 
      });
      
      if (!form) {
        logger.warn(`Form not found with ID: ${id} for domain: ${domain}`);
        return NextResponse.json({ error: 'Form not found' }, { status: 404 });
      }
      
      logger.info(`Successfully retrieved form with ID: ${id} for domain: ${domain}`);
      return NextResponse.json(form);
    } catch (dbError) {
      logger.error(`Database error for domain ${domain}:`, dbError);
      return NextResponse.json(
        { error: 'Error querying the database' },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error('Error fetching form:', error);
    return NextResponse.json(
      { error: 'Failed to fetch form data' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const formData = await request.json();
    
    // Get domain from request headers
    const domain = request.headers.get("x-domain") || "localhost:3000";
    
    if (!id) {
      logger.warn(`Missing form ID in update request for domain: ${domain}`);
      return NextResponse.json({ error: 'Form ID is required' }, { status: 400 });
    }

    // Validate ObjectId format
    if (!ObjectId.isValid(id)) {
      logger.warn(`Invalid form ID format: ${id} for domain: ${domain}`);
      return NextResponse.json({ error: 'Invalid form ID format' }, { status: 400 });
    }
    
    // Validate required fields
    if (!formData.title) {
      return NextResponse.json(
        { error: 'Form title is required' },
        { status: 400 }
      );
    }
    
    if (!Array.isArray(formData.fields)) {
      return NextResponse.json(
        { error: 'Form fields must be an array' },
        { status: 400 }
      );
    }
    
    try {
      // Connect to the domain-specific database
      const connection = await connectToDatabase(domain);
      
      // Get the forms collection
      const formsCollection = connection.collection('forms');
      
      // Update the form with the new data and add updateAt timestamp
      const updateData = {
        ...formData,
        updatedAt: new Date()
      };
      
      delete updateData._id; // Remove _id to avoid immutable field error
      
      const result = await formsCollection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updateData },
        { returnDocument: 'after' }
      );
      
      if (!result) {
        logger.warn(`Form not found for update with ID: ${id} for domain: ${domain}`);
        return NextResponse.json({ error: 'Form not found' }, { status: 404 });
      }
      
      logger.info(`Successfully updated form with ID: ${id} for domain: ${domain}`);
      return NextResponse.json(result);
    } catch (dbError) {
      logger.error(`Database error for domain ${domain}:`, dbError);
      return NextResponse.json(
        { error: 'Error updating the form in database' },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error('Error updating form:', error);
    return NextResponse.json(
      { error: 'Failed to update form' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // Get domain from request headers
    const domain = request.headers.get("x-domain") || "localhost:3000";
    
    if (!id) {
      logger.warn(`Missing form ID in delete request for domain: ${domain}`);
      return NextResponse.json({ error: 'Form ID is required' }, { status: 400 });
    }

    // Validate ObjectId format
    if (!ObjectId.isValid(id)) {
      logger.warn(`Invalid form ID format: ${id} for domain: ${domain}`);
      return NextResponse.json({ error: 'Invalid form ID format' }, { status: 400 });
    }
    
    try {
      // Connect to the domain-specific database
      const connection = await connectToDatabase(domain);
      
      // Get the forms collection
      const formsCollection = connection.collection('forms');
      
      // Delete the form
      const result = await formsCollection.deleteOne({
        _id: new ObjectId(id)
      });
      
      if (result.deletedCount === 0) {
        logger.warn(`Form not found for deletion with ID: ${id} for domain: ${domain}`);
        return NextResponse.json({ error: 'Form not found' }, { status: 404 });
      }
      
      logger.info(`Successfully deleted form with ID: ${id} for domain: ${domain}`);
      return NextResponse.json({
        success: true,
        message: 'Form deleted successfully'
      });
    } catch (dbError) {
      logger.error(`Database error for domain ${domain}:`, dbError);
      return NextResponse.json(
        { error: 'Error deleting the form from database' },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error('Error deleting form:', error);
    return NextResponse.json(
      { error: 'Failed to delete form' },
      { status: 500 }
    );
  }
} 