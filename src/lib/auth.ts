import { getDynamicModel, connectToDatabase } from "@/lib/mongodb";
import type { Document, Model } from "mongoose";
import { signJWT } from "./jwt";

interface School extends Document {
  data: Map<string, unknown>;
  _id: string;
}

interface Teacher extends Document {
  data: Map<string, unknown>;
  _id: string;
}

interface Student extends Document {
  data: Map<string, unknown>;
  _id: string;
}

// Mock user database - in a real app, this would be your database
export const users = [
  {
    id: 1,
    username: "admin",
    password: "admin123", // In a real app, this would be hashed
    role: "admin",
  },
];

export async function authenticateUser(
  userType: "school" | "teacher" | "student",
  schoolCode: string,
  username: string,
  password: string
) {
  // Ensure MongoDB connection is established
  const connectionString = process.env.NEXT_PUBLIC_MONGODB_URI;
  if (!connectionString) {
    throw new Error("MongoDB connection string is not configured");
  }
  
  await connectToDatabase(connectionString);

  // Get the appropriate model based on user type
  const model = getDynamicModel(userType === "school" ? "schools" : userType === "teacher" ? "teachers" : "students") as Model<School | Teacher | Student>;

  console.log('Searching for user:', { userType, schoolCode, username });
  
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

  console.log('MongoDB query:', JSON.stringify(query, null, 2));
  
  // Find the matching user using the query
  const user = await model.findOne(query);
  console.log('Found matching user:', user ? 'Yes' : 'No');

  if (!user) {
    console.log('No user found with provided credentials');
    throw new Error("اطلاعات وارد شده اشتباه است");
  }

  // Get user data from the Map
  const userData = user.data;
  console.log('User data:', Object.fromEntries(userData));
  
  const isActive = userData.get('isActive');
  const userPassword = userData.get('password');

  // Check if user is active
  if (!isActive) {
    console.log('User is not active');
    throw new Error("این حساب کاربری غیرفعال است");
  }

  // Verify password
  if (userPassword !== password) {
    console.log('Password mismatch:', {
      provided: password,
      stored: userPassword
    });
    throw new Error("اطلاعات وارد شده اشتباه است");
  }

  // Generate token with user info
  const token = await signJWT({
    userId: user._id,
    userType,
    schoolCode,
    username,
    name: userData.get('name'),
    role: userType,
    permissions: userData.get('premisions') || userData.get('permissions') || [],
    ...(userType === 'school' ? {
      maghta: userData.get('maghta'),
      grade: userData.get('Grade')
    } : {})
  });

  return { 
    token, 
    user: {
      id: user._id,
      userType,
      schoolCode,
      username,
      name: userData.get('name'),
      role: userType,
      permissions: userData.get('premisions') || userData.get('permissions') || [],
      ...(userType === 'school' ? {
        maghta: userData.get('maghta'),
        grade: userData.get('Grade')
      } : {})
    }
  };
} 