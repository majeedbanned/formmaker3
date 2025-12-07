import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import { SkyroomApiClient } from '@/lib/skyroom';
import { AdobeConnectApiClient } from '@/lib/adobeconnect';
import { BigBlueButtonApiClient } from '@/lib/bigbluebutton';

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

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// POST - Generate a join link for an online class
export async function POST(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'توکن احراز هویت الزامی است' },
        { status: 401, headers: corsHeaders }
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
        { status: 401, headers: corsHeaders }
      );
    }

    const body = await request.json();
    const { classId } = body;

    if (!classId) {
      return NextResponse.json(
        { success: false, message: 'شناسه کلاس الزامی است' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Load database configuration
    const dbConfig: DatabaseConfig = getDatabaseConfig();
    const domainConfig = dbConfig[decoded.domain];
    
    if (!domainConfig) {
      return NextResponse.json(
        { success: false, message: 'دامنه مدرسه یافت نشد' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Connect to MongoDB
    const client = new MongoClient(domainConfig.connectionString);
    await client.connect();
    
    const dbName = domainConfig.connectionString.split('/')[3].split('?')[0];
    const db = client.db(dbName);

    try {
      const classesCollection = db.collection('skyroomclasses');
      const schoolsCollection = db.collection('schools');

      if (!ObjectId.isValid(classId)) {
        await client.close();
        return NextResponse.json(
          { success: false, message: 'شناسه کلاس نامعتبر است' },
          { status: 400, headers: corsHeaders }
        );
      }

      // Find the class
      const classDoc = await classesCollection.findOne({
        _id: new ObjectId(classId),
        'data.schoolCode': decoded.schoolCode,
      });

      if (!classDoc) {
        await client.close();
        return NextResponse.json(
          { success: false, message: 'کلاس یافت نشد' },
          { status: 404, headers: corsHeaders }
        );
      }

      const classData = classDoc.data;
      const classType = classData.classType || 'skyroom';
      const userType = decoded.userType || decoded.role;

      // Check if user has access to this class
      let hasAccess = false;
      if (userType === 'school') {
        hasAccess = classData.schoolCode === decoded.schoolCode;
      } else if (userType === 'teacher') {
        hasAccess = classData.selectedTeachers?.includes(decoded.userId) || false;
      } else if (userType === 'student') {
        hasAccess = classData.selectedStudents?.includes(decoded.userId) || false;
        
        // Also check if student's class is in selectedClasses
        if (!hasAccess) {
          const studentsCollection = db.collection('students');
          const student = await studentsCollection.findOne({
            _id: new ObjectId(decoded.userId),
            'data.schoolCode': decoded.schoolCode,
          });
          
          const studentClassCodes = student?.data?.classCode || [];
          let normalizedCodes: string[] = [];
          
          if (Array.isArray(studentClassCodes)) {
            normalizedCodes = studentClassCodes
              .map((item: any) => {
                if (typeof item === 'string') return item;
                if (item && typeof item.value === 'string') return item.value;
                return null;
              })
              .filter((v: string | null): v is string => !!v);
          } else if (typeof studentClassCodes === 'string') {
            normalizedCodes = [studentClassCodes];
          }
          
          hasAccess = classData.selectedClasses?.some((code: string) =>
            normalizedCodes.includes(code)
          ) || false;
        }
      }

      if (!hasAccess) {
        await client.close();
        return NextResponse.json(
          { success: false, message: 'شما دسترسی به این کلاس را ندارید' },
          { status: 403, headers: corsHeaders }
        );
      }

      // Get school config
      const school = await schoolsCollection.findOne({
        'data.schoolCode': decoded.schoolCode,
      });

      let joinUrl: string = '';

      // Handle Google Meet classes
      if (classType === 'googlemeet') {
        const googleMeetLink = classData.googleMeetLink;
        
        if (!googleMeetLink) {
          await client.close();
          return NextResponse.json(
            { success: false, message: 'لینک گوگل میت یافت نشد' },
            { status: 404, headers: corsHeaders }
          );
        }

        joinUrl = googleMeetLink;
      }

      // Handle Adobe Connect classes
      else if (classType === 'adobeconnect') {
        const adobeConnectUrlPath = classData.adobeConnectUrlPath;
        const adobeUserMappings = classData.adobeConnectUserMappings || [];
        const adobeUserDefaultPassword = classData.adobeUserDefaultPassword || 'Aa@123456';
        
        if (!adobeConnectUrlPath) {
          await client.close();
          return NextResponse.json(
            { success: false, message: 'آدرس ادوبی کانکت یافت نشد' },
            { status: 404, headers: corsHeaders }
          );
        }

        const adobeServerUrl = school?.data?.adobeConnectServerUrl || 'https://adobe.farsamooz.ir';
        const adobeAdminUsername = school?.data?.adobeConnectUsername || 'admin@gmail.com';
        const adobeAdminPassword = school?.data?.adobeConnectPassword || '357611123qwe!@#QQ';

        // Find user mapping
        let userMapping = adobeUserMappings.find(
          (m: any) => m.odUserId === decoded.userId
        );

        if (userMapping && userMapping.login) {
          try {
            const adobeClient = new AdobeConnectApiClient(
              adobeServerUrl,
              adobeAdminUsername,
              adobeAdminPassword
            );

            joinUrl = await adobeClient.createUserSession(
              userMapping.login,
              adobeUserDefaultPassword,
              adobeConnectUrlPath
            );
          } catch (err) {
            console.warn('Failed to create Adobe Connect user session:', err);
            joinUrl = `${adobeServerUrl}/${adobeConnectUrlPath}`;
          }
        } else if (userType === 'school') {
          try {
            const adobeClient = new AdobeConnectApiClient(
              adobeServerUrl,
              adobeAdminUsername,
              adobeAdminPassword
            );

            const schoolName = school?.data?.schoolName || school?.data?.name || `مدرسه ${decoded.schoolCode}`;
            const schoolLogin = `school-${decoded.schoolCode}`;
            
            const { actualLogin } = await adobeClient.getOrCreateUser({
              login: schoolLogin,
              password: adobeUserDefaultPassword,
              firstName: schoolName,
              lastName: '(مدیر)',
            });

            joinUrl = await adobeClient.createUserSession(
              actualLogin,
              adobeUserDefaultPassword,
              adobeConnectUrlPath
            );
          } catch (err) {
            console.warn('Failed to create school admin session:', err);
            joinUrl = `${adobeServerUrl}/${adobeConnectUrlPath}`;
          }
        } else {
          // Create user on-the-fly
          try {
            const adobeClient = new AdobeConnectApiClient(
              adobeServerUrl,
              adobeAdminUsername,
              adobeAdminPassword
            );

            let userLogin: string;
            let firstName: string;
            let lastName: string;
            let permission: 'host' | 'view';

            if (userType === 'teacher') {
              const teachersCollection = db.collection('teachers');
              const teacher = await teachersCollection.findOne({
                _id: new ObjectId(decoded.userId),
                'data.schoolCode': decoded.schoolCode,
              });
              userLogin = `teacher-${decoded.schoolCode}-${teacher?.data?.teacherCode || decoded.userId}`;
              firstName = teacher?.data?.teacherName || 'معلم';
              lastName = teacher?.data?.teacherFamily || '';
              permission = 'host';
            } else {
              const studentsCollection = db.collection('students');
              const student = await studentsCollection.findOne({
                _id: new ObjectId(decoded.userId),
                'data.schoolCode': decoded.schoolCode,
              });
              userLogin = `student-${decoded.schoolCode}-${student?.data?.studentCode || decoded.userId}`;
              firstName = student?.data?.studentName || 'دانش‌آموز';
              lastName = student?.data?.studentFamily || '';
              permission = 'view';
            }

            const { principalId, actualLogin } = await adobeClient.getOrCreateUser({
              login: userLogin,
              password: adobeUserDefaultPassword,
              firstName,
              lastName,
            });

            await adobeClient.addUserToMeeting(
              classData.adobeConnectScoId,
              principalId,
              permission
            );

            // Save mapping
            await classesCollection.updateOne(
              { _id: new ObjectId(classId) },
              {
                $push: {
                  'data.adobeConnectUserMappings': {
                    odUserId: decoded.userId,
                    adobePrincipalId: principalId,
                    role: userType,
                    login: actualLogin,
                  },
                },
              } as any
            );

            joinUrl = await adobeClient.createUserSession(
              actualLogin,
              adobeUserDefaultPassword,
              adobeConnectUrlPath
            );
          } catch (err) {
            console.warn('Failed to create user on-the-fly:', err);
            joinUrl = `${adobeServerUrl}/${adobeConnectUrlPath}`;
          }
        }
      }

      // Handle BigBlueButton classes
      else if (classType === 'bigbluebutton') {
        const bbbMeetingID = classData.bbbMeetingID;
        const bbbAttendeePW = classData.bbbAttendeePW;
        const bbbModeratorPW = classData.bbbModeratorPW;

        if (!bbbMeetingID) {
          await client.close();
          return NextResponse.json(
            { success: false, message: 'شناسه جلسه بیگ بلو باتن یافت نشد' },
            { status: 404, headers: corsHeaders }
          );
        }

        const bbbUrl = school?.data?.BBB_URL;
        const bbbSecret = school?.data?.BBB_SECRET;

        if (!bbbUrl || !bbbSecret) {
          await client.close();
          return NextResponse.json(
            { success: false, message: 'تنظیمات بیگ بلو باتن یافت نشد' },
            { status: 400, headers: corsHeaders }
          );
        }

        try {
          const bbbClient = new BigBlueButtonApiClient(bbbUrl, bbbSecret);

          // Ensure meeting exists
          await bbbClient.createMeeting({
            meetingID: bbbMeetingID,
            name: classData.className || 'کلاس آنلاین',
            attendeePW: bbbAttendeePW,
            moderatorPW: bbbModeratorPW,
            welcome: classData.bbbWelcomeMessage || `به کلاس ${classData.className} خوش آمدید!`,
            maxParticipants: classData.maxUsers || 50,
            duration: classData.duration || 60,
          });

          let fullName: string;
          let password: string;
          let listenOnly: boolean = false;

          if (userType === 'school') {
            const schoolName = school?.data?.schoolName || school?.data?.name || `مدرسه ${decoded.schoolCode}`;
            fullName = `${schoolName} (مدیر)`;
            password = bbbModeratorPW;
          } else if (userType === 'teacher') {
            const teachersCollection = db.collection('teachers');
            const teacher = await teachersCollection.findOne({
              _id: new ObjectId(decoded.userId),
              'data.schoolCode': decoded.schoolCode,
            });
            fullName = teacher?.data?.teacherName
              ? `${teacher.data.teacherName} ${teacher.data.teacherFamily || ''}`.trim()
              : 'معلم';
            password = bbbModeratorPW;
          } else {
            const studentsCollection = db.collection('students');
            const student = await studentsCollection.findOne({
              _id: new ObjectId(decoded.userId),
              'data.schoolCode': decoded.schoolCode,
            });
            fullName = student?.data?.studentName
              ? `${student.data.studentName} ${student.data.studentFamily || ''}`.trim()
              : 'دانش‌آموز';
            password = bbbAttendeePW;
            listenOnly = true; // Students join as listeners
          }

          joinUrl = bbbClient.getJoinUrl({
            meetingID: bbbMeetingID,
            fullName,
            password,
            userID: decoded.userId,
            listenOnly,
          });
        } catch (error: any) {
          console.error('Error generating BBB join URL:', error);
          await client.close();
          return NextResponse.json(
            { success: false, message: error.message || 'خطا در ایجاد لینک ورود' },
            { status: 500, headers: corsHeaders }
          );
        }
      }

      // Handle Skyroom classes
      else {
        const roomId = classData.skyroomRoomId;

        if (!roomId) {
          await client.close();
          return NextResponse.json(
            { success: false, message: 'شناسه اتاق اسکای‌روم یافت نشد' },
            { status: 404, headers: corsHeaders }
          );
        }

        const skyroomApiKey: string | undefined = school?.data?.skyroomapikey || school?.data?.skyroomApiKey;

        if (!skyroomApiKey || skyroomApiKey.length !== 50) {
          await client.close();
          return NextResponse.json(
            { success: false, message: 'کلید API اسکای‌روم تنظیم نشده است' },
            { status: 400, headers: corsHeaders }
          );
        }

        const skyroomClient = new SkyroomApiClient(skyroomApiKey);
        
        // Get user name for display - match web version approach
        // Web version uses simple, short names that Skyroom accepts
        let userName: string;
        
        if (userType === 'teacher') {
          const teachersCollection = db.collection('teachers');
          const teacher = await teachersCollection.findOne({
            _id: new ObjectId(decoded.userId),
            'data.schoolCode': decoded.schoolCode,
          });
          // Use just first name or a short version
          const teacherName = teacher?.data?.teacherName || '';
          userName = teacherName.split(' ')[0] || decoded.username || 'معلم';
        } else if (userType === 'student') {
          const studentsCollection = db.collection('students');
          const student = await studentsCollection.findOne({
            _id: new ObjectId(decoded.userId),
            'data.schoolCode': decoded.schoolCode,
          });
          // Use just first name or a short version
          const studentName = student?.data?.studentName || '';
          const studentFamily = student?.data?.studentFamily || '';
          userName = studentName ? `${studentName} ${studentFamily}`.trim() : decoded.username || 'دانش‌آموز';
        } else {
          // School user - use a short identifier instead of full school name
          // Full school names can be too long for Skyroom
          userName = `مدیر ${decoded.schoolCode}`;
        }

        // Skyroom has a limit on nickname length - keep it under 30 chars
        if (userName.length > 30) {
          userName = userName.substring(0, 30).trim();
        }
        
        // Ensure we have a valid nickname
        if (!userName || userName.length < 2) {
          userName = userType === 'school' ? 'مدیر' : userType === 'teacher' ? 'معلم' : 'کاربر';
        }

        const userIdentifier = `${userType}-${decoded.schoolCode}-${decoded.username || decoded.userId}`;
        const access = (userType === 'school' || userType === 'teacher') ? 3 : 1;

        try {
          console.log('[Skyroom] Creating login URL with params:', {
            room_id: roomId,
            user_id: userIdentifier,
            nickname: userName,
            nicknameLength: userName.length,
            nicknameBytes: Buffer.from(userName, 'utf8').length,
            access,
          });

          const skyroomResponse = await skyroomClient.createLoginUrl({
            room_id: roomId,
            user_id: userIdentifier,
            nickname: userName,
            access,
            concurrent: 1,
            language: 'fa',
            ttl: 7200,
          });

          console.log('[Skyroom] createLoginUrl returned:', {
            responseType: typeof skyroomResponse,
            isString: typeof skyroomResponse === 'string',
            response: typeof skyroomResponse === 'string' 
              ? skyroomResponse.substring(0, 100) 
              : JSON.stringify(skyroomResponse),
          });

          // Check if response is a string URL or an error object
          if (typeof skyroomResponse === 'string' && skyroomResponse.length > 0) {
            joinUrl = skyroomResponse;
          } else if (typeof skyroomResponse === 'object' && skyroomResponse !== null) {
            // Skyroom returned an error object
            const errorObj = skyroomResponse as any;
            console.error('[Skyroom] API returned error object:', errorObj);
            
            if (errorObj.ok === false) {
              const errorMessage = errorObj.error_message || 'خطا در اسکای‌روم';
              throw new Error(`خطای اسکای‌روم: ${errorMessage}`);
            }
            
            throw new Error('پاسخ نامعتبر از اسکای‌روم');
          } else {
            console.error('[Skyroom] Invalid response - not a string or object');
            throw new Error('لینک ورود ایجاد نشد');
          }

          // Validate that joinUrl is actually a string URL
          if (!joinUrl || typeof joinUrl !== 'string' || joinUrl.length === 0) {
            console.error('[Skyroom] Invalid joinUrl after processing');
            // Try with a simpler nickname as fallback
            const fallbackNickname = userType === 'school' ? 'مدیر' : userType === 'teacher' ? 'معلم' : 'دانش‌آموز';
            console.log('[Skyroom] Retrying with fallback nickname:', fallbackNickname);
            
            try {
              const retryResponse = await skyroomClient.createLoginUrl({
                room_id: roomId,
                user_id: userIdentifier,
                nickname: fallbackNickname,
                access,
                concurrent: 1,
                language: 'fa',
                ttl: 7200,
              });
              
              if (typeof retryResponse === 'string' && retryResponse.length > 0) {
                joinUrl = retryResponse;
              } else {
                throw new Error('لینک ورود ایجاد نشد');
              }
            } catch (retryError: any) {
              console.error('[Skyroom] Retry with fallback also failed:', retryError);
              throw new Error(`خطا در ایجاد لینک ورود: ${retryError.message || 'نام نمایشی نامعتبر است'}`);
            }
          }

          // Validate it's a proper URL
          try {
            new URL(joinUrl);
          } catch (urlError) {
            console.error('[Skyroom] joinUrl is not a valid URL:', joinUrl);
            throw new Error('لینک ورود نامعتبر است');
          }
        } catch (error: any) {
          console.error('[Skyroom] createLoginUrl error:', error);
          console.error('[Skyroom] Error details:', {
            message: error.message,
            error_code: error.error_code,
            error_message: error.error_message,
            roomId,
            userName,
            userIdentifier,
            userType,
          });
          await client.close();
          
          // Extract more specific error message
          let errorMessage = 'خطا در ایجاد لینک ورود به اسکای‌روم';
          
          // Check for Skyroom API error messages
          if (error.message && error.message.includes('Skyroom API error')) {
            // Extract the actual error message from Skyroom
            const match = error.message.match(/Skyroom API error: \d+ - (.+)/);
            if (match && match[1]) {
              errorMessage = match[1];
            } else {
              errorMessage = error.message;
            }
          } else if (error.error_message) {
            errorMessage = error.error_message;
          } else if (error.message) {
            errorMessage = error.message;
          }
          
          return NextResponse.json(
            { success: false, message: errorMessage },
            { status: 500, headers: corsHeaders }
          );
        }
      }

      await client.close();

      return NextResponse.json({
        success: true,
        data: {
          joinUrl,
          classType,
          className: classData.className,
        },
      }, { headers: corsHeaders });

    } catch (dbError) {
      await client.close();
      console.error('Database error:', dbError);
      return NextResponse.json(
        { success: false, message: 'خطا در اتصال به پایگاه داده' },
        { status: 500, headers: corsHeaders }
      );
    }

  } catch (error) {
    console.error('Join class API error:', error);
    return NextResponse.json(
      { success: false, message: 'خطای سرور داخلی' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

