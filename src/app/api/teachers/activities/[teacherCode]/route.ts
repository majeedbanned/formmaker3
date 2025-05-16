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

interface ClassStatsDocument {
  _id: {
    classCode: string;
    courseCode: string;
  };
  grades: number;
  presenceRecords: number;
  assessments: number;
  comments: number;
  lastActivity: string;
  students: string[];
}

interface ClassDocument {
  data: {
    classCode: string;
    className?: string;
    students: Array<{ studentCode: string; [key: string]: unknown }>;
  };
}

interface CourseDocument {
  courseCode: string;
  courseName?: string;
}

interface CommentsByClassDocument {
  _id: {
    classCode: string;
    courseCode: string;
  };
  count: number;
}

interface EventsByClassDocument {
  _id: {
    classCode: string;
    courseCode: string;
  };
  count: number;
}

interface DailyActivityDocument {
  _id: string; // date
  grades: number;
  presenceRecords: number;
  assessments: number;
  comments: number;
}

interface DailyCountDocument {
  _id: string; // date
  count: number;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { teacherCode: string } }
) {
  try {
    const teacherCode = params.teacherCode;
    const { searchParams } = new URL(request.url);
    const schoolCode = searchParams.get("schoolCode");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Get domain from request headers
    const domain = request.headers.get("x-domain") || "localhost:3000";
    logger.info(`Fetching detailed teacher activities for domain: ${domain}, schoolCode: ${schoolCode}, teacherCode: ${teacherCode}`);

    if (!teacherCode) {
      return NextResponse.json({ error: "Teacher code is required" }, { status: 400 });
    }

    if (!schoolCode) {
      return NextResponse.json({ error: "School code is required" }, { status: 400 });
    }

    if (!startDate || !endDate) {
      return NextResponse.json({ error: "Date range is required" }, { status: 400 });
    }

    try {
      // Connect to the domain-specific database
      const connection = await connectToDatabase(domain);

      // Step 1: Get the teacher's name
      const teacher = await connection.collection("teachers").findOne({
        "data.teacherCode": teacherCode,
        "data.schoolCode": schoolCode
      }) as unknown as TeacherDocument;

      const teacherName = teacher?.data?.teacherName || teacherCode;

      // Step 2: Fetch class-level statistics
      const classStatsPipeline = [
        {
          $match: {
            schoolCode: schoolCode,
            teacherCode: teacherCode,
            date: {
              $gte: startDate,
              $lte: endDate
            }
          }
        },
        {
          $group: {
            _id: {
              classCode: "$classCode",
              courseCode: "$courseCode"
            },
            grades: {
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
            lastActivity: { $max: "$date" },
            // Count unique students for this class
            students: { $addToSet: "$studentCode" }
          }
        }
      ];

      const classStats = await connection.collection("classsheet").aggregate(classStatsPipeline).toArray() as ClassStatsDocument[];

      // Step 3: Get class and course names
      const classNames: Record<string, string> = {};
      const courseNames: Record<string, string> = {};
      const classStudentCounts: Record<string, number> = {};

      // Fetch class information
      const classes = await connection.collection("formbuilder").find({
        "data.formType": "class",
        "data.schoolCode": schoolCode,
        "data.teachers.teacherCode": teacherCode
      }).toArray() as unknown as ClassDocument[];

      // Process class data
      classes.forEach((cls: ClassDocument) => {
        if (cls.data && cls.data.classCode) {
          classNames[cls.data.classCode] = cls.data.className || cls.data.classCode;
          classStudentCounts[cls.data.classCode] = (cls.data.students || []).length;
        }
      });

      // Fetch course information
      const courses = await connection.collection("courses").find({
        schoolCode: schoolCode
      }).toArray() as unknown as CourseDocument[];

      // Process course data
      courses.forEach((course: CourseDocument) => {
        if (course.courseCode) {
          courseNames[course.courseCode] = course.courseName || course.courseCode;
        }
      });

      // Step 4: Get teacher comments by class
      const commentsByClassPipeline = [
        {
          $match: {
            schoolCode: schoolCode,
            teacherCode: teacherCode,
            date: {
              $gte: startDate,
              $lte: endDate
            }
          }
        },
        {
          $group: {
            _id: {
              classCode: "$classCode",
              courseCode: "$courseCode"
            },
            count: { $sum: 1 }
          }
        }
      ];

      const commentsByClass = await connection.collection("teacherComments").aggregate(commentsByClassPipeline).toArray() as CommentsByClassDocument[];

      // Create a map of comment counts by class and course
      const commentCountMap: Record<string, number> = {};
      commentsByClass.forEach((item: CommentsByClassDocument) => {
        const key = `${item._id.classCode}_${item._id.courseCode}`;
        commentCountMap[key] = item.count;
      });

      // Step 5: Get events by class
      const eventsByClassPipeline = [
        {
          $match: {
            schoolCode: schoolCode,
            teacherCode: teacherCode,
            date: {
              $gte: startDate,
              $lte: endDate
            }
          }
        },
        {
          $group: {
            _id: {
              classCode: "$classCode",
              courseCode: "$courseCode"
            },
            count: { $sum: 1 }
          }
        }
      ];

      const eventsByClass = await connection.collection("events").aggregate(eventsByClassPipeline).toArray() as EventsByClassDocument[];

      // Create a map of event counts by class and course
      const eventCountMap: Record<string, number> = {};
      eventsByClass.forEach((item: EventsByClassDocument) => {
        const key = `${item._id.classCode}_${item._id.courseCode}`;
        eventCountMap[key] = item.count;
      });

      // Step 6: Get daily activity statistics
      const dailyActivityPipeline = [
        {
          $match: {
            schoolCode: schoolCode,
            teacherCode: teacherCode,
            date: {
              $gte: startDate,
              $lte: endDate
            }
          }
        },
        {
          $group: {
            _id: "$date",
            grades: {
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
            }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ];

      const dailyActivity = await connection.collection("classsheet").aggregate(dailyActivityPipeline).toArray() as DailyActivityDocument[];

      // Step 7: Get daily comments
      const dailyCommentsPipeline = [
        {
          $match: {
            schoolCode: schoolCode,
            teacherCode: teacherCode,
            date: {
              $gte: startDate,
              $lte: endDate
            }
          }
        },
        {
          $group: {
            _id: "$date",
            count: { $sum: 1 }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ];

      const dailyComments = await connection.collection("teacherComments").aggregate(dailyCommentsPipeline).toArray() as DailyCountDocument[];

      // Create a map of daily comment counts
      const dailyCommentCountMap: Record<string, number> = {};
      dailyComments.forEach((item: DailyCountDocument) => {
        dailyCommentCountMap[item._id] = item.count;
      });

      // Step 8: Get daily events
      const dailyEventsPipeline = [
        {
          $match: {
            schoolCode: schoolCode,
            teacherCode: teacherCode,
            date: {
              $gte: startDate,
              $lte: endDate
            }
          }
        },
        {
          $group: {
            _id: "$date",
            count: { $sum: 1 }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ];

      const dailyEvents = await connection.collection("events").aggregate(dailyEventsPipeline).toArray() as DailyCountDocument[];

      // Create a map of daily event counts
      const dailyEventCountMap: Record<string, number> = {};
      dailyEvents.forEach((item: DailyCountDocument) => {
        dailyEventCountMap[item._id] = item.count;
      });

      // Combine all data
      // Format class stats
      const processedClassStats = classStats.map((stats: ClassStatsDocument) => {
        const classCode = stats._id.classCode;
        const courseCode = stats._id.courseCode;
        const key = `${classCode}_${courseCode}`;
        
        // Calculate class coverage - what percentage of possible sessions have activity
        // Use actual class session count if available, otherwise use an estimate
        const estimatedSessions = 8; // Default estimate if not available
        const totalActivities = 
          stats.grades + 
          stats.presenceRecords + 
          stats.assessments + 
          stats.comments + 
          (commentCountMap[key] || 0) + 
          (eventCountMap[key] || 0);
        
        const classCoverage = totalActivities > 0 
          ? Math.min(100, (totalActivities / estimatedSessions) * 100)
          : 0;
        
        return {
          classCode,
          className: classNames[classCode] || classCode,
          courseCode,
          courseName: courseNames[courseCode] || courseCode,
          studentCount: classStudentCounts[classCode] || 0,
          grades: stats.grades,
          presenceRecords: stats.presenceRecords,
          assessments: stats.assessments,
          comments: stats.comments + (commentCountMap[key] || 0),
          events: eventCountMap[key] || 0,
          lastActivity: stats.lastActivity,
          classCoverage
        };
      });

      // Format daily activity
      const processedDailyActivity = dailyActivity.map((day: DailyActivityDocument) => {
        const date = day._id;
        return {
          date,
          grades: day.grades,
          presenceRecords: day.presenceRecords,
          assessments: day.assessments,
          comments: day.comments + (dailyCommentCountMap[date] || 0),
          events: dailyEventCountMap[date] || 0,
          total: day.grades + 
                day.presenceRecords + 
                day.assessments + 
                day.comments + 
                (dailyCommentCountMap[date] || 0) + 
                (dailyEventCountMap[date] || 0)
        };
      });

      // Add teacher avatar if available
      const teacherInfo = {
        teacherCode,
        teacherName,
        avatar: teacher?.data?.avatar?.path || null
      };

      // Construct the final response
      const result = {
        ...teacherInfo,
        classes: processedClassStats,
        activity: processedDailyActivity
      };

      logger.info(`Successfully fetched detailed activities for teacher: ${teacherCode}`);
      return NextResponse.json(result);
    } catch (dbError) {
      logger.error(`Database error for domain ${domain}:`, dbError);
      return NextResponse.json(
        { error: "Error connecting to the database" },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error("Error fetching teacher detailed activities:", error);
    return NextResponse.json(
      { error: "Failed to fetch teacher detailed activities data" },
      { status: 500 }
    );
  }
} 