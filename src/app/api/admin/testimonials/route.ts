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
  sectionTitle: "مدارس در مورد ما چه می‌گویند",
  sectionSubtitle: "نظرات مشتریان",
  sectionDescription: "بیش از ۲۵۰ مدرسه از سراسر کشور به پارسا موز اعتماد کرده‌اند.",
  testimonials: [
    {
      id: "1",
      content: "پارسا موز تحول بزرگی در مدیریت مدرسه ما ایجاد کرد. فرایندهای اداری ساده‌تر شدند و وقت بیشتری برای تمرکز بر آموزش داریم.",
      author: "محمد احمدی",
      role: "مدیر دبیرستان شهید بهشتی",
      avatar: "/images/avatar-1.jpg",
      rating: 5,
    },
    {
      id: "2",
      content: "با استفاده از این سیستم، ارتباط ما با والدین به‌طور چشمگیری بهبود یافته است. آنها از این که به‌سادگی می‌توانند پیشرفت فرزندانشان را پیگیری کنند، بسیار راضی هستند.",
      author: "زهرا محمدی",
      role: "معاون آموزشی دبستان ایران",
      avatar: "/images/avatar-2.jpg",
      rating: 5,
    },
    {
      id: "3",
      content: "داشبوردهای تحلیلی به من کمک می‌کند تا الگوهای پیشرفت دانش‌آموزان را شناسایی کنم و برنامه درسی را برای رفع نیازهای آنها تنظیم کنم.",
      author: "علی رضایی",
      role: "دبیر ریاضی دبیرستان نمونه",
      avatar: "/images/avatar-3.jpg",
      rating: 4,
    },
    {
      id: "4",
      content: "پشتیبانی فنی عالی، رابط کاربری ساده و قابلیت‌های گسترده. پارسا موز قطعاً بهترین سیستم مدیریتی است که تاکنون استفاده کرده‌ام.",
      author: "سارا کریمی",
      role: "مدیر فناوری مدرسه هوشمند",
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