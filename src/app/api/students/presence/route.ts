import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getCurrentUser } from "../../chatbot7/config/route";

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

// Get Persian date
const getPersianDate = (date: Date) => {
  const persianDate = date.toLocaleDateString('fa-IR', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit' 
  });
  const persianDateEnglish = persianToEnglish(persianDate);
  const parts = persianDateEnglish.split('/');
  
  return {
    persianDate: persianDate,
    persianMonth: getPersianMonthName(parseInt(parts[1])),
    year: parts[0],
    month: parts[1],
    day: parts[2]
  };
};

const getPersianMonthName = (month: number): string => {
  const months = [
    '', 'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
  ];
  return months[month] || '';
};

// GET - Fetch presence records for a student
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentCode = searchParams.get("studentCode");

    if (!studentCode) {
      return NextResponse.json(
        { error: "کد دانش‌آموز الزامی است" },
        { status: 400 }
      );
    }

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

    // Fetch presence records for the student
    const presenceRecords = await connection.collection("classsheet").find({
      "schoolCode": user.schoolCode,
      "studentCode": studentCode
    })
    .sort({ "date": -1, "timeSlot": -1 })
    .limit(50) // Limit to last 50 records
    .toArray();

    return NextResponse.json({
      success: true,
      records: presenceRecords
    });

  } catch (error) {
    console.error("Error fetching presence records:", error);
    return NextResponse.json(
      { error: "خطا در دریافت سوابق حضور" },
      { status: 500 }
    );
  }
}

// POST - Create or update presence record
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      studentCode, 
      classCode, 
      courseCode, 
      timeSlot, 
      presenceStatus,
      note = "",
      absenceAcceptable = "",
      teacherCode = ""
    } = body;

    // Validate required fields
    if (!studentCode || !classCode || !courseCode || !timeSlot || !presenceStatus) {
      return NextResponse.json(
        { error: "تمام فیلدهای الزامی را پر کنید" },
        { status: 400 }
      );
    }

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
        { error: "فقط مدیران مدرسه می‌توانند این عملیات را انجام دهند" },
        { status: 403 }
      );
    }

    // Connect to database
    const connection = await connectToDatabase(domain);

    const now = new Date();
    const persianDateInfo = getPersianDate(now);
    
    // Create presence record object matching the existing structure
    const presenceRecord = {
      classCode,
      courseCode,
      date: now.toISOString().split('T')[0], // YYYY-MM-DD format
      schoolCode: user.schoolCode,
      studentCode,
      teacherCode: teacherCode || user.username,
      timeSlot: timeSlot.toString(),
      assessments: [],
      createdAt: now,
      descriptiveStatus: "",
      grades: [],
      note,
      absenceAcceptable,
      persianDate: persianDateInfo.persianDate,
      persianMonth: persianDateInfo.persianMonth,
      presenceStatus,
      updatedAt: now
    };

    // Check if record already exists for today, same class, course, and time slot
    const existingRecord = await connection.collection("classsheet").findOne({
      studentCode,
      classCode,
      courseCode,
      timeSlot: timeSlot.toString(),
      date: now.toISOString().split('T')[0],
      schoolCode: user.schoolCode
    });

    let result;
    if (existingRecord) {
      // Update existing record
      result = await connection.collection("classsheet").updateOne(
        { _id: existingRecord._id },
        {
          $set: {
            presenceStatus,
            note,
            absenceAcceptable,
            updatedAt: now,
            persianDate: persianDateInfo.persianDate,
            persianMonth: persianDateInfo.persianMonth
          }
        }
      );
    } else {
      // Create new record
      result = await connection.collection("classsheet").insertOne(presenceRecord);
    }

    if (result.acknowledged) {
      return NextResponse.json({
        success: true,
        message: existingRecord ? "وضعیت حضور به‌روزرسانی شد" : "وضعیت حضور ثبت شد",
        record: existingRecord ? { ...existingRecord, presenceStatus, note, absenceAcceptable } : presenceRecord
      });
    } else {
      return NextResponse.json(
        { error: "خطا در ثبت وضعیت حضور" },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("Error saving presence record:", error);
    return NextResponse.json(
      { error: "خطا در ثبت وضعیت حضور" },
      { status: 500 }
    );
  }
}