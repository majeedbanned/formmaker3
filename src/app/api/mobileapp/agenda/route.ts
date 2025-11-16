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

interface Event {
  _id: string;
  title: string;
  description: string;
  persianDate: string;
  date: string;
  timeSlot: string;
  teacherCode: string;
  courseCode: string;
  classCode: string;
  schoolCode: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  isSchoolEvent?: boolean;
}

interface Teacher {
  _id: string;
  data?: {
    teacherCode: string;
    teacherName: string;
    schoolCode: string;
  };
  username?: string;
  firstName?: string;
  lastName?: string;
  teacherCode?: string;
  teacherName?: string;
}

interface Course {
  _id: string;
  data?: {
    courseCode: string;
    courseName: string;
    schoolCode: string;
  };
  courseCode?: string;
  courseName?: string;
}

interface Class {
  _id: string;
  data?: {
    classCode: string;
    className: string;
    schoolCode: string;
  };
  classCode?: string;
  className?: string;
}

// Extract user info from JWT token
const getUserFromToken = (token: string): JWTPayload | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error('JWT verification error:', error);
    return null;
  }
};

export async function GET(request: NextRequest) {
  try {
    // Extract JWT token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'توکن احراز هویت یافت نشد' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const user = getUserFromToken(token);

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'توکن نامعتبر است' },
        { status: 401 }
      );
    }

    // console.log("User from token:", user);

    // Load database configuration
    const dbConfig: DatabaseConfig = getDatabaseConfig();
    
    // Find database configuration for the domain
    const domainConfig = dbConfig[user.domain];
    if (!domainConfig) {
      return NextResponse.json(
        { success: false, message: 'دامنه مدرسه یافت نشد' },
        { status: 404 }
      );
    }

    // console.log("Using connection string for domain:", user.domain);

    // Connect to MongoDB using domain-specific connection string
    const client = new MongoClient(domainConfig.connectionString);
    await client.connect();
    
    // Extract database name from connection string
    const dbName = domainConfig.connectionString.split('/')[3].split('?')[0];
    const db = client.db(dbName);

    try {
      let events: Event[] = [];
      let teachers: Teacher[] = [];
      let courses: Course[] = [];
      let classes: Class[] = [];

      // Fetch reference data
      const [teachersData, coursesData, classesData] = await Promise.all([
        db.collection('teachers').find({ 'data.schoolCode': user.schoolCode }).toArray(),
        db.collection('courses').find({ 'data.schoolCode': user.schoolCode }).toArray(),
        db.collection('classes').find({ 'data.schoolCode': user.schoolCode }).toArray()
      ]);

      teachers = teachersData as any[];
      courses = coursesData as any[];
      classes = classesData as any[];

      // Build query based on user type
      const eventsQuery: Record<string, any> = {
        schoolCode: user.schoolCode
      };

      switch (user.userType) {
        case 'student':
          // For students, we need to get their class codes first
          const student = await db.collection('students').findOne({
            'data.studentCode': user.username,
            'data.schoolCode': user.schoolCode
          });

          // console.log("Student found:", student);

          if (student && student.data && student.data.classCode && Array.isArray(student.data.classCode) && student.data.classCode.length > 0) {
            // Extract the 'value' from each classCode object
            const studentClassCodes = student.data.classCode
              .filter((classObj: any) => classObj && typeof classObj === 'object' && classObj.value)
              .map((classObj: any) => classObj.value);
            
            // console.log("Student class codes:", studentClassCodes);
            
            if (studentClassCodes.length > 0) {
              eventsQuery.classCode = { $in: studentClassCodes };
            } else {
              // If student has no valid class codes, return empty events
              events = [];
              break;
            }
          } else {
            // If student has no classes, return empty events
            // console.log("Student has no classes assigned");
            events = [];
            break;
          }
          
          // console.log("Events query for student:", eventsQuery);
          events = await db.collection('events').find(eventsQuery).sort({ persianDate: 1, timeSlot: 1 }).toArray() as any[];
          // console.log("Events found for student:", events.length);
          break;

        case 'teacher':
          // Teachers can see their own events
          eventsQuery.teacherCode = user.username;
          events = await db.collection('events').find(eventsQuery).sort({ persianDate: 1, timeSlot: 1 }).toArray() as any[];
          break;

        case 'school':
          // School admins can see all events
          events = await db.collection('events').find(eventsQuery).sort({ persianDate: 1, timeSlot: 1 }).toArray() as any[];
          break;

        default:
          await client.close();
          return NextResponse.json(
            { success: false, message: 'نقش کاربری نامعتبر است' },
            { status: 400 }
          );
      }

      await client.close();

      // Helper functions to get names
      const getTeacherName = (teacherCode: string) => {
        const teacher = teachers.find(t => 
          (t.data && t.data.teacherCode === teacherCode) ||
          t.username === teacherCode ||
          t.teacherCode === teacherCode
        );
        
        if (teacher) {
          if (teacher.data && teacher.data.teacherName) {
            return teacher.data.teacherName;
          }
          if (teacher.firstName && teacher.lastName) {
            return `${teacher.firstName} ${teacher.lastName}`;
          }
          if (teacher.teacherName) {
            return teacher.teacherName;
          }
        }
        return teacherCode;
      };

      const getCourseName = (courseCode: string) => {
        const course = courses.find(c => 
          (c.data && c.data.courseCode === courseCode) ||
          c.courseCode === courseCode
        );
        
        if (course) {
          if (course.data && course.data.courseName) {
            return course.data.courseName;
          }
          if (course.courseName) {
            return course.courseName;
          }
        }
        return courseCode;
      };

      const getClassName = (classCode: string) => {
        const classObj = classes.find(c => 
          (c.data && c.data.classCode === classCode) ||
          c.classCode === classCode
        );
        
        if (classObj) {
          if (classObj.data && classObj.data.className) {
            return classObj.data.className;
          }
          if (classObj.className) {
            return classObj.className;
          }
        }
        return classCode;
      };

      // Enrich events with additional information
      const enrichedEvents = events.map(event => ({
        ...event,
        teacherName: getTeacherName(event.teacherCode),
        courseName: getCourseName(event.courseCode),
        className: getClassName(event.classCode),
        isSchoolEvent: event.isSchoolEvent || event.teacherCode === 'school' || event.createdBy === 'school'
      }));

      // Group events by Persian date
      const groupedEvents = enrichedEvents.reduce((acc, event) => {
        const date = event.persianDate;
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(event);
        return acc;
      }, {} as Record<string, typeof enrichedEvents>);

      return NextResponse.json({
        success: true,
        data: {
          events: enrichedEvents,
          groupedEvents,
          userType: user.userType,
          totalEvents: enrichedEvents.length
        }
      });

    } catch (dbError) {
      await client.close();
      console.error('Database error:', dbError);
      return NextResponse.json(
        { success: false, message: 'خطا در اتصال به پایگاه داده' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Agenda API error:', error);
    return NextResponse.json(
      { success: false, message: 'خطای سرور داخلی' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
