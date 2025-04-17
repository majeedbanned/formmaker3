import { connectToDatabase } from "@/lib/mongodb";
import { signJWT } from "./jwt";
import { logger } from "./logger";

export async function authenticateUser(
  domain: string,
  userType: "school" | "teacher" | "student",
  schoolCode: string,
  username: string,
  password: string
) {
  logger.info(`Authentication attempt for domain: ${domain}`, { userType, schoolCode, username });

  try {
    // Connect to the domain-specific database
    const connection = await connectToDatabase(domain);
    
    // Get collection directly from the connection
    const collection = connection.collection(
      userType === "school" ? "schools" : 
      userType === "teacher" ? "teachers" : 
      "students"
    );

    // Build query based on user type
    let query: Record<string, string> = {};
    if (userType === "school") {
      query = { 'data.schoolCode': schoolCode };
    } else if (userType === "teacher") {
      query = {
        'data.schoolCode': schoolCode,
        'data.teacherCode': username
      };
    } else if (userType === "student") {
      query = {
        'data.schoolCode': schoolCode,
        'data.studentCode': username
      };
    }

    logger.debug('MongoDB query:', query);
    
    // Find the matching user using the query
    const user = await collection.findOne(query);

    if (!user) {
      logger.warn('No user found with provided credentials', { domain, userType, schoolCode });
      throw new Error("اطلاعات وارد شده اشتباه است");
    }

    // Get user data from the Map
    const userData = user.data;
    
    const isActive = userData.isActive;
    const userPassword = userData.password;

    // Check if user is active
    if (!isActive) {
      logger.warn('Inactive user attempted login', { domain, userType, schoolCode });
      throw new Error("این حساب کاربری غیرفعال است");
    }

    // Verify password
    if (userPassword !== password) {
      logger.warn('Password mismatch during login attempt', { domain, userType, schoolCode });
      throw new Error("اطلاعات وارد شده اشتباه است");
    }

    // Generate token with user info
    const token = await signJWT({
      userId: user._id,
      userType,
      schoolCode,
      username,
      name:userType === "student" ? userData.studentName+ ' ' + userData.studentFamily : userType==="teacher" ? userData.teacherName : userType==="school" ? userData.schoolName : "",
      role: userType,
      permissions: userData.premisions || userData.permissions || [],
      ...(userType === 'school' ? {
        maghta: userData.maghta,
        grade: userData.Grade
      } : {})
    });

    logger.info('Authentication successful', { domain, userType, schoolCode });

    return { 
      token, 
      user: {
        id: user._id,
        userType,
        schoolCode,
        username,
        name: "salam",//userData.name,
        role: userType,
        permissions: userData.premisions || userData.permissions || [],
        ...(userType === 'school' ? {
          maghta: userData.maghta,
          grade: userData.Grade
        } : {})
      }
    };
  } catch (error) {
    logger.error('Authentication error:', error, { domain, userType, schoolCode });
    throw error;
  }
} 