import { SignJWT, jwtVerify } from "jose";
import { getDynamicModel } from "@/lib/mongodb";
import type { Document, Model } from "mongoose";

interface SchoolData {
  schoolName: string;
  schoolCode: string;
  Grade: string;
  isActive: boolean;
  password: string;
  maghta: string;
  premisions: Array<{
    systems: string;
    access: string[];
  }>;
  premisions_expanded: boolean;
}

interface School extends Document {
  data: Map<keyof SchoolData, SchoolData[keyof SchoolData]>;
}

interface TeacherData {
  name: string;
  username: string;
  password: string;
  schoolCode: string;
  teacherCode: string;
  isActive: boolean;
  permissions: Array<{
    systems: string;
    access: string[];
  }>;
}

interface Teacher extends Document {
  data: Map<keyof TeacherData, TeacherData[keyof TeacherData]>;
}

interface StudentData {
  name: string;
  username: string;
  password: string;
  studentCode: string;

  schoolCode: string;
  isActive: boolean;
  permissions: Array<{
    systems: string;
    access: string[];
  }>;
}

interface Student extends Document {
  data: Map<keyof StudentData, StudentData[keyof StudentData]>;
}

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key"
);

// Mock user database - in a real app, this would be your database
export const users = [
  {
    id: 1,
    username: "admin",
    password: "admin123", // In a real app, this would be hashed
    role: "admin",
  },
];

export async function verifyAuth(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch (error) {
    console.error("Token verification failed:", error);
    throw new Error("Invalid token");
  }
}

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
  const token = await new SignJWT({
    userId: user._id,
    userType,
    schoolCode,
    username,
    name: userData.get('name'),
    role: userType,
    permissions: userData.get('premisions') || userData.get('permissions') || [],
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1d")
    .sign(JWT_SECRET);

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
    }
  };
} 