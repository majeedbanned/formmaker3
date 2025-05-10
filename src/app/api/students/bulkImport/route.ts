import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { logger } from '@/lib/logger';
import { ObjectId } from 'mongodb';

// Set runtime to nodejs
export const runtime = 'nodejs';

interface StudentImport {
  studentCode: string;
  studentName: string;
  studentFamily: string;
  phone: string;
}

interface ProcessedStudent {
  _id: ObjectId;
  studentCode: string;
  studentName: string;
  studentlname: string;
  phone: string;
}

interface BulkImportRequest {
  students: StudentImport[];
  classCode: string;
  className: string;
}

export async function POST(request: NextRequest) {
  try {
    // Get domain from request headers
    const domain = request.headers.get("x-domain") || "localhost:3000";
    
    const { students, classCode, className } = await request.json() as BulkImportRequest;
    
    if (!students || !Array.isArray(students) || students.length === 0) {
      return NextResponse.json(
        { error: 'No students provided for import' },
        { status: 400 }
      );
    }
    
    if (!classCode || !className) {
      return NextResponse.json(
        { error: 'Missing required parameters (classCode, className)' },
        { status: 400 }
      );
    }
    
    logger.info(`Bulk importing ${students.length} students to class ${className} (${classCode})`, { domain });

    // Connect to domain-specific database
    const connection = await connectToDatabase(domain);
    const studentsCollection = connection.collection('students');
    const classesCollection = connection.collection('classes');
    
    // Step 1: First remove this class code from all students
    // Find all students with this class code
    const studentsWithClass = await studentsCollection.find({
      'data.classCode': {
        $elemMatch: {
          'value': classCode
        }
      }
    }).toArray();
    
    logger.info(`Found ${studentsWithClass.length} students currently assigned to class ${classCode}`, { domain });
    
    // Remove class code from all students
    if (studentsWithClass.length > 0) {
      const removePromises = studentsWithClass.map(student => {
        const updatedClassCodes = (student.data.classCode || []).filter(
          (code: { value: string }) => code.value !== classCode
        );
        
        return studentsCollection.updateOne(
          { _id: student._id },
          { $set: { "data.classCode": updatedClassCodes } }
        );
      });
      
      await Promise.all(removePromises);
      logger.info(`Removed class ${classCode} from all previously assigned students`, { domain });
    }
    
    // Step 2: Process each student to add them to the class and collect their IDs
    const classCodeEntry = {
      label: className,
      value: classCode
    };
    
    // Keep track of student IDs for later class update
    const processedStudentRecords: ProcessedStudent[] = [];
    
    // Process all students in the import list
    await Promise.all(
      students.map(async (student) => {
        // Check if student exists
        const existingStudent = await studentsCollection.findOne({
          "data.studentCode": student.studentCode
        });
        
        if (existingStudent) {
          // Student exists - update their data and add the class code
          await studentsCollection.updateOne(
            { _id: existingStudent._id },
            { 
              $set: {
                "data.studentName": student.studentName,
                "data.studentFamily": student.studentFamily,
                "data.phone": student.phone,
                // Ensure classCode is set directly rather than using $push
                "data.classCode": [...(existingStudent.data.classCode || []), classCodeEntry]
              }
            }
          );
          
          // Add student record with ID to the processed list
          processedStudentRecords.push({
            _id: existingStudent._id,
            studentCode: student.studentCode,
            studentName: student.studentName,
            studentlname: student.studentFamily,
            phone: student.phone
          });
        } else {
          // Student doesn't exist - create a new record
          const newStudent = {
            data: {
              studentCode: student.studentCode,
              studentName: student.studentName,
              studentFamily: student.studentFamily,
              phone: student.phone,
              classCode: [classCodeEntry],
              // Add default values for required fields
              password: student.studentCode, // Default password same as student code
              isActive: true,
              groups: [],
              phones: [],
              premisions: [],
              premisions_expanded: false
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          const result = await studentsCollection.insertOne(newStudent);
          
          // Add student record with ID to the processed list
          processedStudentRecords.push({
            _id: result.insertedId,
            studentCode: student.studentCode,
            studentName: student.studentName,
            studentlname: student.studentFamily,
            phone: student.phone
          });
        }
      })
    );
    
    logger.info(`Successfully processed ${students.length} students`, { domain });
    
    // Step 3: Update the class document to replace the students array with records including IDs
    const classUpdateResult = await classesCollection.updateOne(
      { "data.classCode": classCode },
      { 
        $set: { 
          "data.students": processedStudentRecords
        } 
      }
    );
    
    logger.info(`Updated class with ${processedStudentRecords.length} students including their document IDs`, { domain });
    
    return NextResponse.json({
      success: true,
      message: `Successfully imported ${students.length} students to class ${className}`,
      classUpdated: classUpdateResult.modifiedCount > 0,
      studentsProcessed: students.length
    });
    
  } catch (err) {
    logger.error('Error bulk importing students:', err);
    return NextResponse.json(
      { error: 'Failed to import students' },
      { status: 500 }
    );
  }
} 