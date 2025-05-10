import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { logger } from '@/lib/logger';
import ExcelJS from 'exceljs';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const formId = searchParams.get('formId');
    
    // Get domain from request headers
    const domain = request.headers.get('x-domain') || 'localhost:3000';
    logger.info(`Exporting form submissions to Excel for domain: ${domain}, formId: ${formId}`);

    if (!formId) {
      return NextResponse.json(
        { error: 'formId is required', errorFa: 'شناسه فرم الزامی است' }, 
        { status: 400 }
      );
    }
    
    try {
      // Connect to the domain-specific database
      const connection = await connectToDatabase(domain);
      
      // Get collections
      const formsCollection = connection.collection('forms');
      const formsInputCollection = connection.collection('formsInput');
      
      // Get form details
      let objectId;
      try {
        objectId = new ObjectId(formId);
      } catch {
        logger.warn(`Invalid ObjectId format: ${formId}`);
        return NextResponse.json(
          { error: 'Invalid form ID format', errorFa: 'فرمت شناسه فرم نامعتبر است' }, 
          { status: 400 }
        );
      }
      
      const form = await formsCollection.findOne({ _id: objectId });
      if (!form) {
        return NextResponse.json(
          { error: 'Form not found', errorFa: 'فرم یافت نشد' }, 
          { status: 404 }
        );
      }
      
      // Get all submissions for this form
      const submissions = await formsInputCollection
        .find({ formId })
        .sort({ createdAt: -1 })
        .toArray();
      
      // Create a new Excel workbook
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'FormMaker';
      workbook.lastModifiedBy = 'FormMaker API';
      workbook.created = new Date();
      workbook.modified = new Date();
      
      // Add a worksheet
      const worksheet = workbook.addWorksheet(form.title || 'Form Submissions');
      
      // Define headers
      const headers = ['Row', 'User', 'Submission Date'];
      const fieldsMap = new Map<string, string>(); // Map to store field name to column mapping
      
      // Add field headers from the form definition
      if (Array.isArray(form.fields)) {
        form.fields.forEach(field => {
          if (field.label && field.name) {
            headers.push(field.label);
            fieldsMap.set(field.name, field.label);
          }
        });
      }
      
      // Add headers to worksheet
      worksheet.addRow(headers);
      
      // Add data rows
      submissions.forEach((submission, index) => {
        // Create a new row
        const row = worksheet.addRow([
          index + 1, // Row number
          submission.submittedBy || 'Anonymous',
          new Date(submission.createdAt).toLocaleString('fa-IR')
        ]);
        
        // Track current column
        let columnIndex = 4; // Start after the first 3 fixed columns
        
        // Add field values
        Array.from(fieldsMap.entries()).forEach(([fieldName]) => {
          const value = submission.answers[fieldName];
          
          // Format the value based on its type
          if (value === null || value === undefined) {
            row.getCell(columnIndex).value = '';
          } else if (typeof value === 'object') {
            if (value.path) {
              // This is a file - create a hyperlink
              const fileName = value.originalName || value.filename || 'File';
              const filePath = value.path;

              // Calculate absolute URL for the file link if it's a relative path
              let fullUrl = filePath;
              if (filePath.startsWith('/')) {
                // Construct full URL based on domain, ensuring we use https for production
                const protocol = domain.includes('localhost') ? 'http' : 'https';
                fullUrl = `${protocol}://${domain}${filePath}`;
              }

              // Set cell value with hyperlink
              row.getCell(columnIndex).value = {
                text: fileName,
                hyperlink: fullUrl,
                tooltip: `Download ${fileName}`
              };
              
              // Style the hyperlink
              row.getCell(columnIndex).font = {
                color: { argb: '0563C1' },
                underline: true
              };
            } else {
              // Convert object to string representation
              row.getCell(columnIndex).value = JSON.stringify(value);
            }
          } else {
            // Regular value
            row.getCell(columnIndex).value = value;
          }
          
          // Move to next column
          columnIndex++;
        });
      });
      
      // Format the header row
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
      
      // Auto-fit columns
      worksheet.columns.forEach(column => {
        column.width = 20;
      });
      
      // Write to buffer
      const buffer = await workbook.xlsx.writeBuffer();
      
      // Convert buffer to Uint8Array for streaming
      const arrayBuffer = new Uint8Array(buffer);
      
      // Create response with correct headers
      const response = new NextResponse(arrayBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${encodeURIComponent(form.title || 'export')}.xlsx"`,
        },
      });
      
      return response;
    } catch (dbError) {
      logger.error(`Database error for domain ${domain}:`, dbError);
      return NextResponse.json(
        { error: 'Error querying the database' },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error('Error exporting to Excel:', error);
    return NextResponse.json(
      { error: 'Failed to export to Excel' },
      { status: 500 }
    );
  }
} 