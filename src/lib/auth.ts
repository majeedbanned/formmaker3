import { getDynamicModel } from "@/lib/mongodb";
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
  // Get the appropriate model based on user type
  const model = getDynamicModel(userType === "school" ? "schools" : userType === "teacher" ? "teachers" : "students") as Model<School | Teacher | Student>;

  console.log('Searching for user:', { userType, schoolCode, username });
  
  // Find all users and filter in memory
  const users = await model.find({});
  console.log('Found users:', users);
  
  // Find the matching user based on user type
  let user;
  if (userType === "school") {
    user = users.find(u => (u as School).data.get('schoolCode') === schoolCode);
  } else if (userType === "teacher") {
    user = users.find(u => 
      (u as Teacher).data.get('schoolCode') === schoolCode &&
      (u as Teacher).data.get('teacherCode') === username
    );
  } else if (userType === "student") {
    user = users.find(u => 
      (u as Student).data.get('schoolCode') === schoolCode &&
      (u as Student).data.get('studentCode') === username
    );
  }
  
  console.log('Found matching user:', user);

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