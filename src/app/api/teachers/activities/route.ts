import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { logger } from "@/lib/logger";

// Define types for MongoDB documents
interface TeacherDocument {
  _id: string;
  data: {
    teacherName: string;
    teacherCode: string;
    schoolCode: string;
    isActive?: boolean;
    avatar?: {
      path: string;
    };
    [key: string]: unknown;
  };
}

interface CommentCountDocument {
  _id: string;
  commentCount: number;
  lastCommentDate: string;
}

interface EventCountDocument {
  _id: string;
  eventCount: number;
  lastEventDate: string;
}

interface ClassDocument {
  _id: string;
  allClasses: string[];
}

interface StudentDocument {
  _id: string;
  students: Array<Array<{
    studentCode: string;
    [key: string]: unknown;
  }>>;
}

interface ActivityByDayDocument {
  _id: {
    teacherCode: string;
    date: string;
  };
  gradeCount: number;
  presenceCount: number;
  assessmentCount: number;
  noteCount: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolCode = searchParams.get("schoolCode");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Get domain from request headers
    const domain = request.headers.get("x-domain") || "localhost:3000";
    logger.info(`Fetching teacher activities for domain: ${domain}, schoolCode: ${schoolCode}`);

    if (!schoolCode) {
      return NextResponse.json({ error: "School code is required" }, { status: 400 });
    }

    if (!startDate || !endDate) {
      return NextResponse.json({ error: "Date range is required" }, { status: 400 });
    }
    
    // Create MongoDB aggregation to fetch teacher activities
    const pipeline = [
      {
        $match: {
          schoolCode: schoolCode,
          date: { 
            $gte: startDate, 
            $lte: endDate 
          }
        }
      },
      {
        $group: {
          _id: "$teacherCode",
          gradeCounts: {
            $sum: {
              $cond: [{ $isArray: "$grades" }, { $size: "$grades" }, 0]
            }
          },
          presenceRecords: {
            $sum: {
              $cond: [{ $ne: ["$presenceStatus", null] }, 1, 0]
            }
          },
          assessments: {
            $sum: {
              $cond: [{ $isArray: "$assessments" }, { $size: "$assessments" }, 0]
            }
          },
          comments: {
            $sum: {
              $cond: [{ $gt: [{ $strLenCP: "$note" }, 0] }, 1, 0]
            }
          },
          // Count the number of unique dates with activity
          uniqueDates: { $addToSet: "$date" },
          lastActivity: { $max: "$date" },
          // Store distinct classes for coverage calculation
          classes: { $addToSet: "$classCode" },
          // Store distinct student codes
          students: { $addToSet: "$studentCode" },
          // Count events indirectly through a separate collection query
          // This will be populated afterward
        }
      },
      {
        $project: {
          _id: 0,
          teacherCode: "$_id",
          gradeCounts: 1,
          presenceRecords: 1,
          assessments: 1,
          comments: 1,
          uniqueDates: 1,
          lastActivity: 1,
          classes: 1,
          students: 1
        }
      }
    ];
    
    try {
      // Connect to the domain-specific database
      const connection = await connectToDatabase(domain);
      
      // Execute main aggregation
      const teacherActivities = await connection.collection("classsheet").aggregate(pipeline).toArray();
      
      // Get teachers from the teachers collection to have names
      const teachers = await connection.collection("teachers").find({
        "data.schoolCode": schoolCode
      }).toArray() as unknown as TeacherDocument[];
      
      // Create a map of teacher codes to names
      const teacherNames: Record<string, string> = {};
      teachers.forEach((teacher: TeacherDocument) => {
        if (teacher.data && teacher.data.teacherCode && teacher.data.teacherName) {
          teacherNames[teacher.data.teacherCode] = teacher.data.teacherName;
        }
      });
      
      // Fetch teacher comments from comment collection
      const commentsCountPipeline = [
        {
          $match: {
            schoolCode: schoolCode,
            date: { 
              $gte: startDate, 
              $lte: endDate 
            }
          }
        },
        {
          $group: {
            _id: "$teacherCode",
            commentCount: { $sum: 1 },
            lastCommentDate: { $max: "$date" }
          }
        }
      ];
      
      const teacherComments = await connection.collection("teacherComments").aggregate(commentsCountPipeline).toArray() as CommentCountDocument[];
      
      // Fetch events from events collection
      const eventsCountPipeline = [
        {
          $match: {
            schoolCode: schoolCode,
            date: { 
              $gte: startDate, 
              $lte: endDate 
            }
          }
        },
        {
          $group: {
            _id: "$teacherCode",
            eventCount: { $sum: 1 },
            lastEventDate: { $max: "$date" }
          }
        }
      ];
      
      const teacherEvents = await connection.collection("events").aggregate(eventsCountPipeline).toArray() as EventCountDocument[];
      
      // Create a map of comments and events by teacher
      const commentsByTeacher: Record<string, number> = {};
      const lastCommentDateByTeacher: Record<string, string> = {};
      teacherComments.forEach((item: CommentCountDocument) => {
        commentsByTeacher[item._id] = item.commentCount;
        lastCommentDateByTeacher[item._id] = item.lastCommentDate;
      });
      
      const eventsByTeacher: Record<string, number> = {};
      const lastEventDateByTeacher: Record<string, string> = {};
      teacherEvents.forEach((item: EventCountDocument) => {
        eventsByTeacher[item._id] = item.eventCount;
        lastEventDateByTeacher[item._id] = item.lastEventDate;
      });
      
      // Get all classes to calculate coverage percentages
      const classesByTeacherPipeline = [
        {
          $match: {
            "data.schoolCode": schoolCode
          }
        },
        {
          $project: {
            _id: 0,
            classCode: "$data.classCode",
            teachers: "$data.teachers"
          }
        },
        {
          $unwind: "$teachers"
        },
        {
          $group: {
            _id: "$teachers.teacherCode",
            allClasses: { $addToSet: "$classCode" }
          }
        }
      ];
      
      const allClassesByTeacher = await connection.collection("formbuilder").aggregate(classesByTeacherPipeline).toArray() as ClassDocument[];
      
      // Create map of all classes by teacher
      const allClassesMap: Record<string, string[]> = {};
      allClassesByTeacher.forEach((item: ClassDocument) => {
        allClassesMap[item._id] = item.allClasses;
      });
      
      // Get all students to calculate coverage percentages
      const studentsByTeacherPipeline = [
        {
          $match: {
            "data.schoolCode": schoolCode
          }
        },
        {
          $project: {
            _id: 0,
            classCode: "$data.classCode",
            students: "$data.students",
            teachers: "$data.teachers"
          }
        },
        {
          $unwind: "$teachers"
        },
        {
          $group: {
            _id: "$teachers.teacherCode",
            students: { $push: "$students" }
          }
        }
      ];
      
      const allStudentsByTeacher = await connection.collection("formbuilder").aggregate(studentsByTeacherPipeline).toArray() as StudentDocument[];
      
      // Flatten student arrays and count unique students per teacher
      const allStudentsCountByTeacher: Record<string, number> = {};
      allStudentsByTeacher.forEach((item: StudentDocument) => {
        // Flatten all student arrays and count unique student codes
        const allStudents = new Set<string>();
        item.students.forEach((studentArray) => {
          studentArray.forEach((student) => {
            if (student && student.studentCode) {
              allStudents.add(student.studentCode);
            }
          });
        });
        allStudentsCountByTeacher[item._id] = allStudents.size;
      });
      
      // Process data to calculate activity by day
      const activityByDayPipeline = [
        {
          $match: {
            schoolCode: schoolCode,
            date: { 
              $gte: startDate, 
              $lte: endDate 
            }
          }
        },
        {
          $group: {
            _id: {
              teacherCode: "$teacherCode",
              date: "$date"
            },
            gradeCount: {
              $sum: {
                $cond: [{ $isArray: "$grades" }, { $size: "$grades" }, 0]
              }
            },
            presenceCount: {
              $sum: {
                $cond: [{ $ne: ["$presenceStatus", null] }, 1, 0]
              }
            },
            assessmentCount: {
              $sum: {
                $cond: [{ $isArray: "$assessments" }, { $size: "$assessments" }, 0]
              }
            },
            noteCount: {
              $sum: {
                $cond: [{ $gt: [{ $strLenCP: "$note" }, 0] }, 1, 0]
              }
            }
          }
        }
      ];
      
      const activityByDay = await connection.collection("classsheet").aggregate(activityByDayPipeline).toArray() as ActivityByDayDocument[];
      
      // Process activity by day data
      const activityByDayMap: Record<string, Record<string, number>> = {};
      const activityByTypeMap: Record<string, Record<string, number>> = {};
      
      activityByDay.forEach((item: ActivityByDayDocument) => {
        const teacherCode = item._id.teacherCode;
        const date = item._id.date;
        
        // Initialize if needed
        if (!activityByDayMap[teacherCode]) {
          activityByDayMap[teacherCode] = {};
        }
        
        if (!activityByTypeMap[teacherCode]) {
          activityByTypeMap[teacherCode] = {
            grades: 0,
            presence: 0,
            assessments: 0,
            comments: 0,
            events: 0
          };
        }
        
        // Sum all activities for this day
        const totalActivities = 
          item.gradeCount + 
          item.presenceCount + 
          item.assessmentCount + 
          item.noteCount;
        
        // Add to activity by day map
        activityByDayMap[teacherCode][date] = totalActivities;
        
        // Add to activity by type map
        activityByTypeMap[teacherCode].grades += item.gradeCount;
        activityByTypeMap[teacherCode].presence += item.presenceCount;
        activityByTypeMap[teacherCode].assessments += item.assessmentCount;
        activityByTypeMap[teacherCode].comments += item.noteCount;
      });
      
      // Add events to activity by type
      Object.keys(eventsByTeacher).forEach(teacherCode => {
        if (!activityByTypeMap[teacherCode]) {
          activityByTypeMap[teacherCode] = {
            grades: 0,
            presence: 0,
            assessments: 0,
            comments: 0,
            events: 0
          };
        }
        
        activityByTypeMap[teacherCode].events = eventsByTeacher[teacherCode] || 0;
      });
      
      // Combine all data
      const result = teacherActivities.map(teacher => {
        const teacherCode = teacher.teacherCode;
        
        // Calculate the most recent activity date
        const lastGradeDate = teacher.lastActivity || null;
        const lastCommentDate = lastCommentDateByTeacher[teacherCode] || null;
        const lastEventDate = lastEventDateByTeacher[teacherCode] || null;
        
        const dates = [lastGradeDate, lastCommentDate, lastEventDate].filter(Boolean);
        const lastActivity = dates.length > 0 
          ? new Date(Math.max(...dates.map(d => new Date(d).getTime()))) 
          : null;
        
        // Calculate class coverage
        const totalClasses = (allClassesMap[teacherCode] || []).length;
        const activatedClasses = (teacher.classes || []).length;
        const classCoverage = totalClasses > 0 
          ? (activatedClasses / totalClasses) * 100 
          : 0;
        
        // Calculate student coverage
        const totalStudents = allStudentsCountByTeacher[teacherCode] || 0;
        const activatedStudents = (teacher.students || []).length;
        const studentCoverage = totalStudents > 0 
          ? (activatedStudents / totalStudents) * 100 
          : 0;
        
        // Calculate total activities
        const totalActivities = 
          teacher.gradeCounts + 
          teacher.presenceRecords + 
          teacher.assessments + 
          teacher.comments + 
          (eventsByTeacher[teacherCode] || 0);
        
        return {
          teacherCode,
          teacherName: teacherNames[teacherCode] || teacherCode,
          gradeCounts: teacher.gradeCounts,
          presenceRecords: teacher.presenceRecords,
          assessments: teacher.assessments,
          comments: teacher.comments + (commentsByTeacher[teacherCode] || 0),
          events: eventsByTeacher[teacherCode] || 0,
          totalActivities,
          lastActivity,
          activityByDay: activityByDayMap[teacherCode] || {},
          activityByType: activityByTypeMap[teacherCode] || {
            grades: 0,
            presence: 0,
            assessments: 0,
            comments: 0,
            events: 0
          },
          classCoverage,
          studentCoverage
        };
      });
      
      logger.info(`Successfully fetched teacher activities for ${teacherActivities.length} teachers`);
      return NextResponse.json(result);
    } catch (dbError) {
      logger.error(`Database error for domain ${domain}:`, dbError);
      return NextResponse.json(
        { error: "Error connecting to the database" },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error("Error fetching teacher activities:", error);
    return NextResponse.json(
      { error: "Failed to fetch teacher activities data" },
      { status: 500 }
    );
  }
} 