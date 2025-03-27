import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase, getDynamicModel } from "@/lib/mongodb";

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


    

    // Connect to the database
    const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/formmaker";
    await connectToDatabase(MONGODB_URI);

    // Get the classes model
    const ClassModel = getDynamicModel("classes");

    // Build the query to find classes where the teacher teaches
    const query = {
      'data.schoolCode': schoolCode,
      'data.teachers': {
        $elemMatch: {
          teacherCode: teacherCode
        }
      }
    };

    console.log("Executing query:", JSON.stringify(query));

    // Fetch classes from the database
    const classes = await ClassModel.find(query).lean();
    
    
    console.log(`Found ${classes.length} classes for teacher ${teacherCode} in school ${schoolCode}`);
 console.log(( classes))

 const responseData = classes.map(classObj => ({ data: classObj.data }));
 console.log( responseData)
    // Return the classes

const ttt=[
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
 
];


const  schoolData = [
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
            { day: "سه شنبه", timeSlot: "9" },
            { day: "دوشنبه", timeSlot: "9" },
            { day: "دوشنبه", timeSlot: "10" }
          ],
          weeklySchedule_expanded: true
        },
        {
          teacherCode: "we",
          courseCode: "11111",
          weeklySchedule: [
            { day: "شنبه", timeSlot: "8" },
            { day: "پنج شنبه", timeSlot: "7" }
          ],
          weeklySchedule_expanded: true
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
     
    }
  },
 
];





    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Error fetching classes:", error);
    return NextResponse.json(
      { error: "Failed to fetch classes from database" },
      { status: 500 }
    );
  }
} 