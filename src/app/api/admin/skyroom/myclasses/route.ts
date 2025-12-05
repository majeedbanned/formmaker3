import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { logger } from "@/lib/logger";
import { ObjectId } from "mongodb";
import { getCurrentUser } from "@/app/api/chatbot7/config/route";

// GET - Get all classes for the current user (with next occurrence based on weekly schedule)
export async function GET(request: NextRequest) {
  try {
    const domain = request.headers.get("x-domain") || "localhost:3000";
    
    // Get current user
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: "لطفاً وارد شوید" },
        { status: 401 }
      );
    }

    const connection = await connectToDatabase(domain);
    const classesCollection = connection.collection("skyroomclasses");

    // Build query based on user type
    let query: any = {
      "data.schoolCode": user.schoolCode,
    };

    if (user.userType === "teacher") {
      query.$or = [
        { "data.selectedTeachers": user.id },
        // Also include classes where this teacher's class is selected
      ];
    } else if (user.userType === "student") {
      // Get student's class codes
      const studentsCollection = connection.collection("students");
      const student = await studentsCollection.findOne({
        _id: new ObjectId(user.id),
        "data.schoolCode": user.schoolCode,
      });

      // Normalize student's class codes:
      // - In some schools it's stored as array of strings
      // - In others as array of objects like { label: "...", value: "9" }
      let studentClassCodes: string[] = [];
      const rawClassCode = student?.data?.classCode;

      if (Array.isArray(rawClassCode)) {
        studentClassCodes = rawClassCode
          .map((item: any) => {
            if (typeof item === "string") return item;
            if (item && typeof item.value === "string") return item.value;
            return null;
          })
          .filter((v: string | null): v is string => !!v);
      } else if (typeof rawClassCode === "string") {
        studentClassCodes = [rawClassCode];
      }

      query.$or = [
        { "data.selectedStudents": user.id },
        { "data.selectedClasses": { $in: studentClassCodes } },
      ];
    } else if (user.userType === "school") {
      // School user: see all classes in this school
      // (no additional $or filter)
    }

    // Find all classes for this user
    const classes = await classesCollection.find(query).toArray();

    // Helper to compute next occurrence based on weekly schedule or single date/time
    const weekdayMap: Record<string, number> = {
      sun: 0,
      mon: 1,
      tue: 2,
      wed: 3,
      thu: 4,
      fri: 5,
      sat: 6,
    };

    const now = new Date();

    const getNextOccurrence = (data: any):
      | {
          date: Date;
          weekday: string;
          startTime: string;
          endTime: string;
          duration: number;
        }
      | null => {
      const slots: any[] = Array.isArray(data.scheduleSlots)
        ? data.scheduleSlots
        : [];

      // If we have weekly schedule slots, use them
      if (slots.length > 0) {
        let best: {
          date: Date;
          weekday: string;
          startTime: string;
          endTime: string;
          duration: number;
        } | null = null;

        for (const slot of slots) {
          const code = String(slot.day || "").toLowerCase();
          const jsDay = weekdayMap[code];
          if (jsDay === undefined || !slot.startTime || !slot.endTime) {
            continue;
          }

          const [sh, sm] = String(slot.startTime).split(":").map(Number);
          const [eh, em] = String(slot.endTime).split(":").map(Number);

          const todayIdx = now.getDay();
          let diff = (jsDay - todayIdx + 7) % 7;

          const occurrence = new Date(now);
          occurrence.setHours(sh || 0, sm || 0, 0, 0);
          if (diff === 0 && occurrence <= now) {
            diff = 7; // move to next week
          }
          occurrence.setDate(occurrence.getDate() + diff);

          const durationMinutes = (eh - sh) * 60 + (em - sm);

          if (!best || occurrence < best.date) {
            best = {
              date: occurrence,
              weekday: code,
              startTime: slot.startTime,
              endTime: slot.endTime,
              duration: durationMinutes > 0 ? durationMinutes : data.duration || 60,
            };
          }
        }

        return best;
      }

      // Fallback: use single stored classDate / classTime
      if (!data.classDate || !data.classTime) return null;

      const baseDate = new Date(data.classDate);
      const [h, m] = String(data.classTime).split(":").map(Number);
      const start = new Date(baseDate);
      start.setHours(h || 0, m || 0, 0, 0);

      const dur = typeof data.duration === "number" ? data.duration : 60;
      const end = new Date(start);
      end.setMinutes(end.getMinutes() + dur);

      if (end < now) {
        return null;
      }

      // Derive weekday code from JS day (approximate mapping)
      const jsDay = start.getDay();
      const reverseMap: Record<number, string> = {
        0: "sun",
        1: "mon",
        2: "tue",
        3: "wed",
        4: "thu",
        5: "fri",
        6: "sat",
      };

      return {
        date: start,
        weekday: reverseMap[jsDay],
        startTime: data.classTime,
        endTime: `${String(
          Math.floor((h || 0) + Math.floor((m || 0 + dur) / 60))
        ).padStart(2, "0")}:${String((m || 0 + dur) % 60).padStart(2, "0")}`,
        duration: dur,
      };
    };

    const resultClasses = classes
      .map((cls) => {
        const data: any = cls.data || {};
        const next = getNextOccurrence(data);
        if (!next) return null;

        return {
          _id: cls._id.toString(),
          className: data.className,
          classDescription: data.classDescription,
          maxUsers: data.maxUsers,
          classType: data.classType || "skyroom",
          skyroomRoomId: data.skyroomRoomId,
          googleMeetLink: data.googleMeetLink,
          adobeConnectUrl: data.adobeConnectUrl,
          adobeConnectScoId: data.adobeConnectScoId,
          scheduleSlots: data.scheduleSlots || [],
          nextDate: next.date.toISOString(),
          nextWeekday: next.weekday,
          nextStartTime: next.startTime,
          nextEndTime: next.endTime,
          duration: next.duration,
        };
      })
      .filter((c): c is NonNullable<typeof c> => !!c)
      .sort(
        (a, b) =>
          new Date(a.nextDate).getTime() - new Date(b.nextDate).getTime()
      );

    return NextResponse.json({
      success: true,
      classes: resultClasses,
    });
  } catch (error) {
    logger.error("Error fetching user's Skyroom classes:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

