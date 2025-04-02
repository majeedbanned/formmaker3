import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { logger } from '@/lib/logger';
import { ObjectId } from 'mongodb';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // Get domain from request headers
    const domain = req.headers.get("x-domain") || "localhost:3000";
    
    // Validate ID
    if (!id) {
      logger.warn(`Missing required parameter 'id' for form input deletion on domain: ${domain}`);
      return NextResponse.json(
        { error: 'Required parameter missing: id is required' },
        { status: 400 }
      );
    }
    
    logger.info(`Attempting to delete form input with ID: ${id} for domain: ${domain}`);

    try {
      // Connect to the domain-specific database
      const connection = await connectToDatabase(domain);
      
      // Get the formsInput collection directly from the connection
      const formsInputCollection = connection.collection('formsInput');

      // Delete the form input
      const result = await formsInputCollection.deleteOne({ 
        _id: new ObjectId(id) 
      });

      if (result.deletedCount === 0) {
        logger.warn(`Form input with ID: ${id} not found for domain: ${domain}`);
        return NextResponse.json(
          { error: 'Form input not found' },
          { status: 404 }
        );
      }

      logger.info(`Successfully deleted form input with ID: ${id} for domain: ${domain}`);
      return NextResponse.json({
        success: true,
        message: 'Form input deleted successfully',
      });
    } catch (dbError) {
      logger.error(`Database error deleting form input (ID: ${id}) for domain ${domain}:`, dbError);
      return NextResponse.json(
        { error: 'Error deleting from the database' },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error('Error deleting form input:', error);
    return NextResponse.json(
      { error: 'Failed to delete form input' },
      { status: 500 }
    );
  }
} 