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

export async function authenticateUser(schoolCode: string, password: string) {
  // Get the schools model
  console.log('schoolCode',schoolCode)
  const SchoolModel = getDynamicModel("schools") as Model<School>;

  console.log('Searching for school with code:', schoolCode);
  
  // Find all schools and filter in memory
  const schools = await SchoolModel.find({});
  console.log('Found schools:', schools);
  
  const school = schools.find(s => s.data.get('schoolCode') === schoolCode);
  console.log('Found matching school:', school);

  if (!school) {
    console.log('No school found with code:', schoolCode);
    throw new Error("کد مدرسه یا رمز عبور اشتباه است");
  }

  // Get school data from the Map
  const schoolData = school.data;
  console.log('School data:', Object.fromEntries(schoolData));
  
  const isActive = schoolData.get('isActive');
  const schoolPassword = schoolData.get('password');
  const schoolName = schoolData.get('schoolName');
  const permissions = schoolData.get('premisions') || [];

  console.log('Extracted data:', {
    isActive,
    schoolPassword,
    schoolName,
    permissions
  });

  // Check if school is active
  if (!isActive) {
    console.log('School is not active');
    throw new Error("این مدرسه غیرفعال است");
  }

  // Verify password
  if (schoolPassword !== password) {
    console.log('Password mismatch:', {
      provided: password,
      stored: schoolPassword
    });
    throw new Error("کد مدرسه یا رمز عبور اشتباه است");
  }

  // Generate token with school info
  const token = await new SignJWT({
    schoolId: school._id,
    schoolCode: schoolCode,
    schoolName: schoolName,
    role: "school",
    permissions: permissions,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1d")
    .sign(JWT_SECRET);

  return { 
    token, 
    user: {
      id: school._id,
      schoolCode: schoolCode,
      schoolName: schoolName,
      role: "school",
      permissions: permissions,
    }
  };
} 