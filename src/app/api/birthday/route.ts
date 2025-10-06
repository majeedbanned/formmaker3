import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getCurrentUser } from "../chatbot7/config/route";

// Convert Persian numerals to English
const persianToEnglish = (str: string): string => {
  const persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const englishNumbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  
  let result = str;
  for (let i = 0; i < 10; i++) {
    result = result.replace(new RegExp(persianNumbers[i], 'g'), englishNumbers[i]);
  }
  return result;
};

// Get today's Persian month and day (in English numerals for comparison)
const getTodayPersianMonthDay = (): string => {
  const today = new Date();
  const persianDate = today.toLocaleDateString('fa-IR', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit' 
  });
  // Convert Persian numerals to English for comparison
  const persianDateEnglish = persianToEnglish(persianDate);
  // Extract month and day (format: YYYY/MM/DD)
  const parts = persianDateEnglish.split('/');
  if (parts.length === 3) {
    return `/${parts[1]}/${parts[2]}`;
  }
  return '';
};

export async function GET(request: NextRequest) {
  try {
    // Get domain from headers
    const domain = request.headers.get("x-domain") || "localhost:3000";

    // Get current user
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "لطفاً وارد شوید" },
        { status: 401 }
      );
    }

    // Only school users can access this
    if (user.userType !== "school") {
      return NextResponse.json(
        { error: "فقط مدیران مدرسه می‌توانند به این اطلاعات دسترسی داشته باشند" },
        { status: 403 }
      );
    }

    // Connect to database
    const connection = await connectToDatabase(domain);

    // Get today's month/day pattern
    const todayMonthDay = getTodayPersianMonthDay();
    
    if (!todayMonthDay) {
      return NextResponse.json(
        { error: "خطا در محاسبه تاریخ امروز" },
        { status: 500 }
      );
    }

    // Convert today's month/day back to Persian for regex matching
    const persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    const englishNumbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    
    let persianTodayMonthDay = todayMonthDay;
    for (let i = 0; i < 10; i++) {
      persianTodayMonthDay = persianTodayMonthDay.replace(new RegExp(englishNumbers[i], 'g'), persianNumbers[i]);
    }

    // Create regex pattern for matching birthDate ending with today's month/day
    const regexPattern = new RegExp(`${persianTodayMonthDay}$`);

    // Query students with birthday today
    const students = await connection.collection("students").find({
      "data.schoolCode": user.schoolCode,
      "data.birthDate": { $regex: regexPattern }
    }).toArray();

    // Query teachers with birthday today
    const teachers = await connection.collection("teachers").find({
      "data.schoolCode": user.schoolCode,
      "data.birthDate": { $regex: regexPattern }
    }).toArray();

    // Format the response
    const birthdayPeople = [
      ...students.map(student => ({
        type: 'student' as const,
        data: student
      })),
      ...teachers.map(teacher => ({
        type: 'teacher' as const,
        data: teacher
      }))
    ];

    return NextResponse.json({
      success: true,
      today: persianTodayMonthDay,
      count: birthdayPeople.length,
      people: birthdayPeople
    });

  } catch (error) {
    console.error("Error fetching birthday people:", error);
    return NextResponse.json(
      { error: "خطا در دریافت لیست تولدها" },
      { status: 500 }
    );
  }
}
