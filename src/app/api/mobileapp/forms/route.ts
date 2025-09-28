import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';

// Load database configuration
const getDatabaseConfig = () => {
  try {
    const configPath = path.join(process.cwd(), 'src', 'config', 'database.json');
    const configData = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(configData);
  } catch (error) {
    console.error('Error loading database config:', error);
    return {};
  }
};

interface DatabaseConfig {
  [domain: string]: {
    schoolCode: string;
    connectionString: string;
    description: string;
  };
}

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

interface JWTPayload {
  userId: string;
  domain: string;
  schoolCode: string;
  role: string;
  userType: string;
  username: string;
  iat?: number;
  exp?: number;
}

export async function GET(request: NextRequest) {
  try {
    console.log("Mobile forms request received");
    
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'توکن احراز هویت الزامی است' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Verify JWT token
    let decoded: JWTPayload;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch (jwtError) {
      return NextResponse.json(
        { success: false, message: 'توکن نامعتبر یا منقضی شده است' },
        { status: 401 }
      );
    }

    console.log("Mobile forms request for user:", decoded.userType, decoded.username);

    // Load database configuration
    const dbConfig: DatabaseConfig = getDatabaseConfig();
    const domainConfig = dbConfig[decoded.domain];
    
    if (!domainConfig) {
      return NextResponse.json(
        { success: false, message: 'دامنه مدرسه یافت نشد' },
        { status: 404 }
      );
    }

    // Verify school code matches
    if (domainConfig.schoolCode !== decoded.schoolCode) {
      return NextResponse.json(
        { success: false, message: 'کد مدرسه با دامنه مطابقت ندارد' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const client = new MongoClient(domainConfig.connectionString);
    await client.connect();
    
    // Extract database name from connection string
    const dbName = domainConfig.connectionString.split('/')[3].split('?')[0];
    const db = client.db(dbName);
    
    console.log("Connected to database:", dbName);

    try {
      // Build the query filter based on user type
      const filter: Record<string, unknown> = {};
      
      if (decoded.userType === 'student') {
        // For students: fetch their class codes from database and show forms assigned to those classes
        const student = await db.collection('students').findOne({
          'data.studentCode': decoded.username,
          'data.schoolCode': decoded.schoolCode
        });

        if (student && student.data && student.data.classCode && Array.isArray(student.data.classCode)) {
          const studentClassCodes = student.data.classCode
            .filter((classObj: any) => classObj && typeof classObj === 'object' && classObj.value)
            .map((classObj: any) => classObj.value);

          console.log("Student class codes from database:", studentClassCodes);

          if (studentClassCodes.length > 0) {
            filter.assignedClassCodes = { $in: studentClassCodes };
          } else {
            // If student has no class codes, return empty result
            filter._id = { $exists: false };
          }
        } else {
          // If student not found or has no class codes, return empty result
          filter._id = { $exists: false };
        }
      } else if (decoded.userType === 'teacher') {
        // For teachers: show their own forms + forms where assignedTeacherCodes contains their teacher code
        const teacherCode = decoded.username;
        
        // Get teacher's classes by querying the classes collection
        const classesCollection = db.collection('classes');
        const teacherClassesResult = await classesCollection.find({
          'data.teachers.teacherCode': teacherCode
        }).toArray();
        
        const teacherClassCodes: string[] = [];
        for (const cls of teacherClassesResult) {
          if (cls && typeof cls === 'object' && 'data' in cls && 
              cls.data && typeof cls.data === 'object' && 'classCode' in cls.data &&
              typeof cls.data.classCode === 'string') {
            teacherClassCodes.push(cls.data.classCode);
          }
        }
        
        filter.$or = [
          { 'metadata.createdBy': teacherCode }, // Their own forms
          { assignedTeacherCodes: { $in: [teacherCode] } }, // Forms assigned to them
        ];
      } else if (decoded.userType === 'school') {
        // For school admin: show all forms (no additional filtering)
        // Keep existing behavior for school admins
      } else {
        // If no user or unknown user type, return empty result
        filter._id = { $exists: false };
      }

      console.log("Forms filter:", JSON.stringify(filter));

      // Get forms collection
      const collection = db.collection('forms');
      
      // Get forms with the filter
      const forms = await collection
        .find(filter)
        .sort({ updatedAt: -1 })
        .toArray() as any[];

      console.log("Found forms with filter:", forms.length);

      // Get submission counts for each form
      const submissionCounts: Record<string, number> = {};
      const userSubmissions: Record<string, boolean> = {};
      
      for (const form of forms) {
        const formId = form._id.toString();
        
        // Count total submissions
        const totalSubmissions = await db.collection('formsubmissions').countDocuments({
          formId: formId
        });
        submissionCounts[formId] = totalSubmissions;
        
        // Check if current user has submitted this form (for students)
        if (decoded.userType === 'student') {
          const userSubmission = await db.collection('formsubmissions').findOne({
            formId: formId,
            submittedBy: decoded.username
          });
          userSubmissions[formId] = !!userSubmission;
        }
      }

      // Format the response
      const formattedForms = forms.map(form => ({
        id: form._id.toString(),
        title: form.title,
        description: form.description || '',
        fields: form.fields || [],
        isMultiStep: form.isMultiStep || false,
        steps: form.steps || [],
        formStartEntryDatetime: form.formStartEntryDatetime,
        formEndEntryDateTime: form.formEndEntryDateTime,
        assignedClassCodes: form.assignedClassCodes || [],
        assignedTeacherCodes: form.assignedTeacherCodes || [],
        isEditable: form.isEditable !== false,
        oneTimeFillOnly: form.oneTimeFillOnly || false,
        multipleInstances: form.multipleInstances || false,
        createdAt: form.createdAt,
        updatedAt: form.updatedAt,
        metadata: form.metadata || {},
        submissionCount: submissionCounts[form._id.toString()] || 0,
        userHasSubmitted: userSubmissions[form._id.toString()] || false
      }));

      return NextResponse.json({
        success: true,
        forms: formattedForms,
        userType: decoded.userType
      });

    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { success: false, message: 'خطا در اتصال به پایگاه داده' },
        { status: 500 }
      );
    } finally {
      await client.close();
    }

  } catch (error) {
    console.error('Error fetching forms:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت فرم‌ها' },
      { status: 500 }
    );
  }
}

