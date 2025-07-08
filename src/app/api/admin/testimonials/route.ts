import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getCurrentUser } from "@/app/api/chatbot7/config/route";

interface Testimonial {
  id: string;
  content: string;
  author: string;
  role: string;
  avatar: string;
  rating: number;
}

interface TestimonialsData {
  sectionTitle: string;
  sectionSubtitle: string;
  sectionDescription: string;
  testimonials: Testimonial[];
  isVisible: boolean;
  sectionTitleColor: string;
  sectionSubtitleColor: string;
  sectionDescriptionColor: string;
  backgroundGradientFrom: string;
  backgroundGradientTo: string;
  testimonialBgColor: string;
  testimonialTextColor: string;
  authorNameColor: string;
  authorRoleColor: string;
  starActiveColor: string;
  starInactiveColor: string;
}

const defaultTestimonialsData: TestimonialsData = {
  sectionTitle: "والدین درباره مدارس هوشمند چه می‌گویند",
  sectionSubtitle: "نظرات اولیاء",
  sectionDescription: "صدها خانواده با انتخاب مدرسه هوشمند، تجربه‌ای متفاوت از آموزش برای فرزندان خود رقم زده‌اند.",
  testimonials: [
    {
      id: "1",
      content:
        "از وقتی فرزندم در این مدرسه ثبت‌نام کرده، پیشرفت تحصیلی‌اش چشمگیر بوده. امکانات دیجیتال باعث شده ارتباط نزدیک‌تری با معلمان داشته باشیم.",
      author: "لیلا حسینی",
      role: "مادر دانش‌آموز پایه هشتم",
      avatar: "/images/avatar-1.jpg",
      rating: 5,
    },
    {
      id: "2",
      content:
        "گزارش‌های هفتگی و دسترسی لحظه‌ای به عملکرد درسی باعث شده همیشه در جریان وضعیت درسی فرزندم باشم. حس خوبی‌ست که می‌دانم مدرسه به فکر آینده اوست.",
      author: "رضا شریفی",
      role: "پدر دانش‌آموز کلاس ششم",
      avatar: "/images/avatar-2.jpg",
      rating: 5,
    },
    {
      id: "3",
      content:
        "مدرسه هوشمند یعنی آموزش به‌روز، امنیت بیشتر و ارتباط بهتر با اولیاء. این تجربه باعث شد فرزندم با انگیزه بیشتری درس بخواند.",
      author: "مریم کریمی",
      role: "مادر دانش‌آموز کلاس پنجم",
      avatar: "/images/avatar-3.jpg",
      rating: 4,
    },
    {
      id: "4",
      content:
        "از اپلیکیشن مدرسه گرفته تا جلسات آنلاین با معلمان، همه چیز دقیق و حرفه‌ای انجام می‌شود. این مدرسه واقعاً فراتر از انتظار ما عمل کرده است.",
      author: "حسین عباسی",
      role: "پدر دانش‌آموز دبیرستانی",
      avatar: "/images/avatar-4.jpg",
      rating: 5,
    },
  ],
  isVisible: true,
  sectionTitleColor: "#1F2937",
  sectionSubtitleColor: "#4F46E5",
  sectionDescriptionColor: "#6B7280",
  backgroundGradientFrom: "#EEF2FF",
  backgroundGradientTo: "#FFFFFF",
  testimonialBgColor: "#FFFFFF",
  testimonialTextColor: "#1F2937",
  authorNameColor: "#1F2937",
  authorRoleColor: "#6B7280",
  starActiveColor: "#FBBF24",
  starInactiveColor: "#D1D5DB",
};


export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only allow school admin to access testimonials data
    if (currentUser.userType !== "school") {
      return NextResponse.json(
        { error: "Unauthorized access. Only school admins can manage testimonials." },
        { status: 403 }
      );
    }

    const domain = request.headers.get("x-domain") || "localhost:3000";
    const connection = await connectToDatabase(domain);
    
    const collection = connection.collection("testimonialsConfig");
    const testimonials = await collection.findOne({});
    
    if (testimonials) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { _id, ...testimonialsData } = testimonials;
      return NextResponse.json({ success: true, testimonials: testimonialsData });
    } else {
      return NextResponse.json({ success: true, testimonials: defaultTestimonialsData });
    }
  } catch (error) {
    console.error("Error fetching testimonials data:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch testimonials data" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only allow school admin to update testimonials data
    if (currentUser.userType !== "school") {
      return NextResponse.json(
        { error: "Unauthorized access. Only school admins can manage testimonials." },
        { status: 403 }
      );
    }

    const testimonialsData: TestimonialsData = await request.json();
    
    // Remove _id if it exists to prevent MongoDB errors
    delete (testimonialsData as TestimonialsData & { _id?: string })._id;
    
    const domain = request.headers.get("x-domain") || "localhost:3000";
    const connection = await connectToDatabase(domain);
    
    const collection = connection.collection("testimonialsConfig");
    
    const result = await collection.replaceOne(
      {},
      testimonialsData,
      { upsert: true }
    );
    
    return NextResponse.json({ 
      success: true, 
      message: "Testimonials data saved successfully",
      result 
    });
  } catch (error) {
    console.error("Error saving testimonials data:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save testimonials data" },
      { status: 500 }
    );
  }
} 