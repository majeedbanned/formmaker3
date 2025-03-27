import { NextRequest, NextResponse } from "next/server";

// Mock data for testing
const mockClasses = [
  {
    data: {
      classCode: "232",
      className: "دوم سیب",
      major: "16000",
      Grade: "11",
      schoolCode: "2295566177",
      teachers: [
        {
          teacherCode: "102",
          courseCode: "11131",
          weeklySchedule: [
            { day: "سه‌شنبه", timeSlot: "9" },
            { day: "دوشنبه", timeSlot: "9" },
            { day: "دوشنبه", timeSlot: "10" },
          ],
          weeklySchedule_expanded: true,
        },
        {
          teacherCode: "we",
          courseCode: "11111",
          weeklySchedule: [
            { day: "شنبه", timeSlot: "8" },
            { day: "پنج‌شنبه", timeSlot: "7" },
          ],
          weeklySchedule_expanded: true,
        },
        {
          teacherCode: "102",
          courseCode: "22222",
          weeklySchedule: [
            { day: "چهارشنبه", timeSlot: "11" },
            { day: "پنج‌شنبه", timeSlot: "12" },
          ],
          weeklySchedule_expanded: true,
        },
      ],
      teachers_expanded: true,
      students: [
        {
          studentCode: 2295845241,
          studentName: "رضا",
          studentlname: "شیری",
          phone: "9175231560",
        },
        {
          studentCode: 2286655145,
          studentName: "محمود",
          studentlname: "قادری",
          phone: "9120011451",
        },
        {
          studentCode: 2295566177,
          studentName: "نیما",
          studentlname: "قاسمی",
          phone: "9177204118",
        },
        {
          studentCode: 2295566173,
          studentName: "قاسم",
          studentlname: "قاسمی",
          phone: "9177204118",
        },
      ],
    },
  },
  {
    data: {
      classCode: "333",
      className: "سوم انار",
      major: "16000",
      Grade: "12",
      schoolCode: "2295566177",
      teachers: [
        {
          teacherCode: "102",
          courseCode: "11131",
          weeklySchedule: [
            { day: "یکشنبه", timeSlot: "3" },
            { day: "سه‌شنبه", timeSlot: "4" },
          ],
          weeklySchedule_expanded: true,
        },
        {
          teacherCode: "102",
          courseCode: "67890",
          weeklySchedule: [
            { day: "شنبه", timeSlot: "1" },
            { day: "چهارشنبه", timeSlot: "2" },
          ],
          weeklySchedule_expanded: true,
        },
      ],
      teachers_expanded: true,
      students: [
        {
          studentCode: 2295111222,
          studentName: "علی",
          studentlname: "محمدی",
          phone: "9123456789",
        },
        {
          studentCode: 2295333444,
          studentName: "حسن",
          studentlname: "رضایی",
          phone: "9187654321",
        },
      ],
    },
  },
];

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const schoolCode = searchParams.get("schoolCode");
    const teacherCode = searchParams.get("teacherCode");

    // Validate required parameters
    if (!schoolCode || !teacherCode) {
      return NextResponse.json(
        { error: "Missing required parameters: schoolCode and teacherCode" },
        { status: 400 }
      );
    }

    // Filter mock data based on schoolCode and teacherCode
    const classes = mockClasses.filter(classDoc => 
      classDoc.data.schoolCode === schoolCode && 
      classDoc.data.teachers.some(teacher => teacher.teacherCode === teacherCode)
    );

    console.log("Returning classes:", classes);

    // Return the classes
    return NextResponse.json(classes);
  } catch (error) {
    console.error("Error fetching classes:", error);
    return NextResponse.json(
      { error: "Failed to fetch classes" },
      { status: 500 }
    );
  }
} 