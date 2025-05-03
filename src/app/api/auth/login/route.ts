import { NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth";
import { logger } from "@/lib/logger";
import fs from 'fs';
import path from 'path';

// Set runtime to nodejs

export const runtime = 'nodejs';
export async function OPTIONS(request: Request) {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "http://localhost:8081",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, x-domain, x-domaintype",
    },
  });
}


export async function POST(request: Request) {
  try {
    // Get domain from request headers

    let domain = request.headers.get("x-domain") ;
    const domaintype = request.headers.get("x-domaintype") ;

//console.log("domaintype",domaintype);
  
    
    logger.info("Login request received", { domain });
    
    const body = await request.json();
    const { userType, schoolCode, username, password } = body;

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

    const { token, user } = await authenticateUser(
      domain,
      userType,
      schoolCode,
      username,
      password
    );

    // Set cookie with token
    const response = NextResponse.json({
      message: "ورود موفقیت‌آمیز",
      user: {
        id: user.id,
        userType: user.userType,
        schoolCode: user.schoolCode,
        username: user.username,
        name: user.name,
        role: user.role,
        permissions: user.permissions,
      }
    }, { status: 200 });

    response.headers.set("Access-Control-Allow-Origin", "http://localhost:8081");
response.headers.set("Access-Control-Allow-Credentials", "true");


    // Set the cookie in the response
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 1 day
    });

    logger.info("Auth token cookie set successfully", { domain });
    return response;

  } catch (error) {
    logger.error("Login error:", error);
    if (error instanceof Error) {
      logger.error("Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      return NextResponse.json(
        { message: error.message },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { message: "خطا در ورود به سیستم" },
      { status: 500 }
    );
  }
} 