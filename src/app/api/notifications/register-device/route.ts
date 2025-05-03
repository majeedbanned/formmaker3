import { NextResponse } from "next/server";
// import { getServerSession } from "next-auth/next";
// import { authOptions } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { connectToDatabase } from "@/lib/mongodb";
import fs from 'fs';
import path from 'path';
// Set runtime to nodejs
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    // Get domain from request headers for logging purposes
    let domain = request.headers.get("x-domain") 
    const domaintype = request.headers.get("x-domaintype") ;
    // // Get the session
    // const session = await getServerSession(authOptions);

    // // If not authenticated, return unauthorized
    // if (!session || !session.user) {
    //   logger.warn(`Unauthorized attempt to register device from domain: ${domain}`);
    //   return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    // }

    // Parse the request body
    const body = await request.json();
    const { userId, token, device,schoolCode,userType } = body;
console.log("userIdxxx",userId);
console.log("tokenxxx",token);
console.log("devicexxx",device);
console.log("schoolCodexxx",schoolCode);
console.log("typexxx",userType);


    if (domaintype==="mobileapp") {
        console.log("mobileapp start");
        // If domain is not provided in headers, try to find it from database.json based on schoolCode
        if (!schoolCode) {
          return NextResponse.json(
            { message: "کد مدرسه الزامی است" },
            { status: 400 }
          );
        }
        
        try {
          // Load database configuration from JSON file
          const configPath = path.join(process.cwd(), 'src/config/database.json');
          const configData = fs.readFileSync(configPath, 'utf8');
          const databaseConfig = JSON.parse(configData);
        //  console.log("schoolCode",schoolCode);
          // Find domain by schoolCode
          for (const [domainKey, config] of Object.entries(databaseConfig)) {
  
          //  console.log("config.schoolCode",config.schoolCode);
            if (config.schoolCode === schoolCode) {
              console.log("domainKey",domainKey);
              domain = domainKey;
              logger.info("Domain found from schoolCode", { domain, schoolCode });
              break;
            }
          }
          
          if (!domain) {
            logger.error("No domain found for schoolCode", { schoolCode });
            return NextResponse.json(
              { message: "دامنه معتبری برای این کد مدرسه یافت نشد" },
              { status: 400 }
            );
          }
        } catch (error) {
          logger.error("Error finding domain from schoolCode", { error, schoolCode });
          return NextResponse.json(
            { message: "خطا در پیدا کردن دامنه" },
            { status: 500 }
          );
        }
      }




    // Verify the user ID matches the authenticated user
    // if (session.user.id !== userId) {
    //   logger.warn(`User ID mismatch during device registration. Session: ${session.user.id}, Request: ${userId}`);
    //   return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    // }

    // Connect to database
    const connection = await connectToDatabase(domain);
    
    // Access the userstoken collection
    const userstokenCollection = connection.collection('userstoken');
    
    // Store the token in the database with upsert
    const result = await userstokenCollection.updateOne(
      { token: token, userId: userId },
      { 
        $set: {
          token: token,
          userId: userId,
          deviceInfo: device,
          isActive: true,
          lastUpdated: new Date(),
          schoolCode: schoolCode,
          userType: userType
        }
      },
      { upsert: true }
    );

    // Now update the appropriate collection based on userType
    if (userType === 'student') {
      // Store token in students collection
      const studentsCollection = connection.collection('students');
      
      console.log(`Trying to update student with userId: ${userId} and schoolCode: ${schoolCode}`);
      
      // First try to find by _id (MongoDB ObjectId)
      let updateResult = await studentsCollection.updateOne(
        { _id: userId },
        {
          $addToSet: { 
            'data.tokens': { 
              token: token, 
              deviceInfo: device 
            } 
          }
        }
      );
      
      // If no student found by _id, try by studentCode and schoolCode
      if (updateResult.matchedCount === 0) {
        console.log(`No student found with _id ${userId}, trying with studentCode and schoolCode`);
        updateResult = await studentsCollection.updateOne(
          { 
            'data.studentCode': userId,
            'data.schoolCode': schoolCode 
          },
          {
            $addToSet: { 
              'data.tokens': { 
                token: token, 
                deviceInfo: device 
              } 
            }
          }
        );
      }
      
      console.log(`Student update result: ${JSON.stringify(updateResult)}`);
      
      if (updateResult.matchedCount > 0) {
        logger.info(`Added token to student record. UserId: ${userId}, SchoolCode: ${schoolCode}`);
      } else {
        logger.warn(`No student found with either _id ${userId} or studentCode ${userId} with schoolCode ${schoolCode}`);
      }
    } 
    else if (userType === 'teacher') {
      // Store token in teachers collection
      const teachersCollection = connection.collection('teachers');
      
      console.log(`Trying to update teacher with userId: ${userId} and schoolCode: ${schoolCode}`);
      
      // First try to find by _id (MongoDB ObjectId)
      let updateResult = await teachersCollection.updateOne(
        { _id: userId },
        {
          $addToSet: { 
            'data.tokens': { 
              token: token, 
              deviceInfo: device 
            } 
          }
        }
      );
      
      // If no teacher found by _id, try by teacherCode and schoolCode
      if (updateResult.matchedCount === 0) {
        console.log(`No teacher found with _id ${userId}, trying with teacherCode and schoolCode`);
        updateResult = await teachersCollection.updateOne(
          { 
            'data.teacherCode': userId,
            'data.schoolCode': schoolCode 
          },
          {
            $addToSet: { 
              'data.tokens': { 
                token: token, 
                deviceInfo: device 
              } 
            }
          }
        );
      }
      
      console.log(`Teacher update result: ${JSON.stringify(updateResult)}`);
      
      if (updateResult.matchedCount > 0) {
        logger.info(`Added token to teacher record. UserId: ${userId}, SchoolCode: ${schoolCode}`);
      } else {
        logger.warn(`No teacher found with either _id ${userId} or teacherCode ${userId} with schoolCode ${schoolCode}`);
      }
    }
    else if (userType === 'school') {
      // Store token in schools collection
      const schoolsCollection = connection.collection('schools');
      
      console.log(`Trying to update school with userId: ${userId} and schoolCode: ${schoolCode}`);
      
      // First try to find by _id (MongoDB ObjectId of the school)
      let updateResult = await schoolsCollection.updateOne(
        { _id: userId },
        {
          $addToSet: { 
            'data.tokens': { 
              token: token, 
              deviceInfo: device 
            } 
          }
        }
      );
      
      // If no school found by _id, try by schoolCode
      if (updateResult.matchedCount === 0) {
        console.log(`No school found with _id ${userId}, trying with schoolCode ${schoolCode}`);
        updateResult = await schoolsCollection.updateOne(
          { 'data.schoolCode': schoolCode },
          {
            $addToSet: { 
              'data.tokens': { 
                token: token, 
                deviceInfo: device 
              } 
            }
          }
        );
      }
      
      console.log(`School update result: ${JSON.stringify(updateResult)}`);
      
      if (updateResult.matchedCount > 0) {
        logger.info(`Added token to school record. UserId: ${userId}, SchoolCode: ${schoolCode}`);
      } else {
        logger.warn(`No school found with either _id ${userId} or schoolCode ${schoolCode}`);
      }
    }

    logger.info(`Device registered for notifications: ${token.substring(0, 10)}... for domain: ${domain}`);

    return NextResponse.json({ 
      message: "Device registered successfully",
      registered: true,
      deviceId: result.upsertedId || userId
    }, { status: 200 });

  } catch (error) {
    logger.error("Error registering device for notifications:", error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { message: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { message: "خطا در ثبت دستگاه برای اعلان‌ها" },
      { status: 500 }
    );
  }
} 