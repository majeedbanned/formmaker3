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

// Get Persian day name from date
function getPersianDayName(): string {
  const days = ['یکشنبه', 'دوشنبه', 'سه شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه'];
  const today = new Date();
  // JavaScript getDay() returns: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
  // Persian week: شنبه(Saturday), یکشنبه(Sunday), دوشنبه(Monday), سه شنبه(Tuesday), چهارشنبه(Wednesday), پنجشنبه(Thursday), جمعه(Friday)
  // Mapping: 0(Sun)->یکشنبه(0), 1(Mon)->دوشنبه(1), 2(Tue)->سه شنبه(2), 3(Wed)->چهارشنبه(3), 4(Thu)->پنجشنبه(4), 5(Fri)->جمعه(5), 6(Sat)->شنبه(6)
  const jsDay = today.getDay();
  const dayIndex = jsDay === 6 ? 6 : jsDay; // Saturday stays 6, others map directly
  return days[dayIndex];
}

export async function GET(request: NextRequest) {
  try {
    // console.log("Mobile classsheet request received");
    
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

    // Check if a specific date is requested
    const { searchParams } = new URL(request.url);
    const requestedDate = searchParams.get('date'); // Expected format: YYYY-MM-DD

    // console.log("Mobile classsheet request for user:", decoded.userType, decoded.username);
    // console.log("Requested date parameter:", requestedDate);

    // Check if user is teacher
    if (decoded.userType !== 'teacher') {
      return NextResponse.json(
        { success: false, message: 'فقط معلمان می‌توانند برنامه کلاسی را مشاهده کنند' },
        { status: 403 }
      );
    }

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
    
    // console.log("Connected to database:", dbName);

    try {
      // Use requested date or today's date
      let targetDate: Date;
      let date: string;
      
      if (requestedDate) {
        // Parse the requested date (YYYY-MM-DD) - parse as local date to avoid timezone issues
        const [year, month, day] = requestedDate.split('-').map(Number);
        targetDate = new Date(year, month - 1, day);
        date = requestedDate;
      } else {
        // Use today
        targetDate = new Date();
        date = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`;
      }
      
      // Get Persian day name for the target date
      const getPersianDayNameForDate = (d: Date): string => {
        const days = ['یکشنبه', 'دوشنبه', 'سه شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه'];
        const jsDay = d.getDay();
        return days[jsDay];
      };
      
      const targetPersianDay = getPersianDayNameForDate(targetDate);
      // console.log("Target date:", date, "Persian day:", targetPersianDay);
      // console.log("Date object created:", targetDate.toString());
      // console.log("Day of week (JS):", targetDate.getDay());

      // Find all classes where this teacher teaches
      const classes = await db.collection('classes').find({
        'data.schoolCode': decoded.schoolCode,
        'data.teachers.teacherCode': decoded.username
      }).toArray();

      // console.log("Found classes for teacher:", classes.length);

      // Extract today's schedule for this teacher
      const todaySchedule: any[] = [];

      for (const classDoc of classes) {
        const classData = classDoc.data;
        
        // console.log(`Processing class: ${classData.classCode} - ${classData.className}`);
        
        // Find teacher's courses in this class
        const teacherCourses = classData.teachers.filter(
          (t: any) => t.teacherCode === decoded.username
        );

        // console.log(`Teacher courses in this class: ${teacherCourses.length}`);

        for (const teacherCourse of teacherCourses) {
          // console.log(`Checking course ${teacherCourse.courseCode}, weekly schedule:`, teacherCourse.weeklySchedule);
          
          // Filter schedule for target day
          const daySlots = teacherCourse.weeklySchedule.filter(
            (slot: any) => slot.day === targetPersianDay
          );

          // console.log(`Slots matching ${targetPersianDay}:`, daySlots.length, daySlots);

          // Get course information
          const courseDoc = await db.collection('courses').findOne({
            'data.schoolCode': decoded.schoolCode,
            'data.courseCode': teacherCourse.courseCode
          });

          for (const slot of daySlots) {
            // Get attendance statistics for this class/course/timeSlot today
            const absentStudents: string[] = [];
            const delayedStudents: string[] = [];

            // Query classsheet records for today
            const classheetRecords = await db.collection('classsheet').find({
              classCode: classData.classCode,
              courseCode: teacherCourse.courseCode,
              teacherCode: decoded.username,
              schoolCode: decoded.schoolCode,
              date: date,
              timeSlot: slot.timeSlot
            }).toArray();

            // Build a map of student presence status
            const presenceMap = new Map();
            classheetRecords.forEach((record: any) => {
              if (record.presenceStatus) {
                presenceMap.set(record.studentCode, record.presenceStatus);
              }
            });

            // Check each student's presence status
            if (classData.students && Array.isArray(classData.students)) {
              classData.students.forEach((student: any) => {
                const status = presenceMap.get(student.studentCode);
                const studentName = `${student.studentName || ''} ${student.studentlname || ''}`.trim();
                
                if (status === 'absent') {
                  absentStudents.push(studentName);
                } else if (status === 'delayed') {
                  delayedStudents.push(studentName);
                }
              });
            }

            // Get three random student avatars for this class
            let studentAvatars: Array<{ studentCode: string; avatar: any }> = [];
            if (classData.students && Array.isArray(classData.students) && classData.students.length > 0) {
              // Get student codes from class
              const studentCodes = classData.students.map((s: any) => s.studentCode).filter(Boolean);
              
              if (studentCodes.length > 0) {
                // Fetch student avatars from students collection
                const studentsWithAvatars = await db.collection('students').find({
                  'data.schoolCode': decoded.schoolCode,
                  'data.studentCode': { $in: studentCodes },
                  'data.avatar': { $exists: true, $ne: null }
                }).project({
                  'data.studentCode': 1,
                  'data.avatar': 1
                }).toArray();

                // Create a map of studentCode to avatar
                const avatarMap = new Map();
                studentsWithAvatars.forEach((student: any) => {
                  if (student.data?.avatar && student.data?.studentCode) {
                    avatarMap.set(student.data.studentCode, student.data.avatar);
                  }
                });

                // Get random student codes (up to 3)
                const shuffledCodes = studentCodes.sort(() => 0.5 - Math.random());
                const selectedCodes = shuffledCodes.slice(0, Math.min(3, shuffledCodes.length));

                // Build avatar array
                studentAvatars = selectedCodes
                  .map((code: string) => {
                    const avatar = avatarMap.get(code);
                    if (avatar) {
                      return { studentCode: code, avatar };
                    }
                    return null;
                  })
                  .filter(Boolean) as Array<{ studentCode: string; avatar: any }>;
              }
            }

            const scheduleItem = {
              classCode: classData.classCode,
              className: classData.className,
              courseCode: teacherCourse.courseCode,
              courseName: courseDoc?.data?.courseName || 'نامشخص',
              timeSlot: slot.timeSlot,
              day: slot.day,
              major: classData.major,
              grade: classData.Grade,
              studentCount: classData.students?.length || 0,
              absentStudents: absentStudents,
              delayedStudents: delayedStudents,
              studentAvatars: studentAvatars
            };
            
            // console.log(`Adding schedule item:`, scheduleItem);
            todaySchedule.push(scheduleItem);
          }
        }
      }

      // Sort by timeSlot
      todaySchedule.sort((a, b) => {
        const slotA = parseInt(a.timeSlot) || 0;
        const slotB = parseInt(b.timeSlot) || 0;
        return slotA - slotB;
      });

      // console.log("Final schedule count:", todaySchedule.length);
      // console.log("Final schedule items:", JSON.stringify(todaySchedule, null, 2));

      return NextResponse.json({
        success: true,
        schedule: todaySchedule,
        todayDay: targetPersianDay,
        selectedDate: date,
        teacherCode: decoded.username
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
    console.error('Error fetching classsheet:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت برنامه کلاسی' },
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


