import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

// GET - Fetch about section content
export async function GET(request: NextRequest) {
  try {
    const domain = request.headers.get("x-domain") || "localhost:3000";
    const connection = await connectToDatabase(domain);
    const collection = connection.collection('website_about');
    
    const aboutContent = await collection.findOne({});

    // If no content exists, return default content
    if (!aboutContent) {
      const defaultContent = {
        title: "درباره مدرسه ما",
        description: "مدرسه ما با هدف ارائه آموزشی باکیفیت و پرورش نسلی آگاه و خلاق تأسیس شده است. ما با تیمی از معلمان دلسوز و کارشناسان آموزشی، محیطی پویا و حمایتگر برای رشد علمی و شخصیتی دانش‌آموزان فراهم کرده‌ایم.",
        benefitsTitle: "چرا مدرسه ما؟",
        benefits: [
          "ارتباط مؤثر و مستمر بین مدرسه، معلمان و والدین",
          "صرفه‌جویی در زمان با فرآیندهای اداری منظم و شفاف",
          "ارائه گزارش‌های دقیق از وضعیت تحصیلی دانش‌آموزان",
          "دسترسی آسان والدین به اطلاعات آموزشی از هر نقطه",
          "پشتیبانی دائمی از دانش‌آموزان و والدین در طول سال تحصیلی"
        ],
        stats: [
          { id: 1, name: "سال سابقه آموزشی", value: "+15" },
          { id: 2, name: "دانش‌آموزان ثبت‌نام‌شده", value: "+1,200" },
          { id: 3, name: "معلمان مجرب", value: "+40" },
          { id: 4, name: "رضایت والدین", value: "97%" }
        ],
        image: {
          url: "/images/about-school.jpg",
          alt: "دانش‌آموزان و کادر آموزشی مدرسه"
        },
        // Style settings
        backgroundColor: "#FFFFFF",
        titleColor: "#111827",
        descriptionColor: "#6B7280",
        benefitsTitleColor: "#111827",
        benefitsTextColor: "#6B7280",
        benefitsIconColor: "#10B981",
        statsBackgroundColor: "#FFFFFF",
        statsNameColor: "#6B7280",
        statsValueColor: "#4F46E5",
        isVisible: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      return NextResponse.json({ success: true, about: defaultContent });
    }

    // Ensure backward compatibility by adding default style values if missing
    const aboutWithDefaults = {
      ...aboutContent,
      backgroundColor: aboutContent.backgroundColor || "#FFFFFF",
      titleColor: aboutContent.titleColor || "#111827",
      descriptionColor: aboutContent.descriptionColor || "#6B7280",
      benefitsTitleColor: aboutContent.benefitsTitleColor || "#111827",
      benefitsTextColor: aboutContent.benefitsTextColor || "#6B7280",
      benefitsIconColor: aboutContent.benefitsIconColor || "#10B981",
      statsBackgroundColor: aboutContent.statsBackgroundColor || "#FFFFFF",
      statsNameColor: aboutContent.statsNameColor || "#6B7280",
      statsValueColor: aboutContent.statsValueColor || "#4F46E5",
      isVisible: aboutContent.isVisible !== undefined ? aboutContent.isVisible : true,
    };

    return NextResponse.json({ success: true, about: aboutWithDefaults });
  } catch (error) {
    console.error('Error fetching about content:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create or update about section content
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      title, 
      description, 
      benefitsTitle,
      benefits,
      stats,
      image,
      isVisible,
      backgroundColor,
      titleColor,
      descriptionColor,
      benefitsTitleColor,
      benefitsTextColor,
      benefitsIconColor,
      statsBackgroundColor,
      statsNameColor,
      statsValueColor
    } = body;

    if (!title || !description) {
      return NextResponse.json(
        { success: false, error: 'Title and description are required' },
        { status: 400 }
      );
    }

    const domain = request.headers.get("x-domain") || "localhost:3000";
    const connection = await connectToDatabase(domain);
    const collection = connection.collection('website_about');

    const aboutData = {
      title,
      description,
      benefitsTitle: benefitsTitle || "مزایای استفاده",
      benefits: benefits || [],
      stats: stats || [],
      image: image || { url: "/images/about-team.jpg", alt: "Our team at work" },
      // Style settings with defaults
      backgroundColor: backgroundColor || "#FFFFFF",
      titleColor: titleColor || "#111827",
      descriptionColor: descriptionColor || "#6B7280",
      benefitsTitleColor: benefitsTitleColor || "#111827",
      benefitsTextColor: benefitsTextColor || "#6B7280",
      benefitsIconColor: benefitsIconColor || "#10B981",
      statsBackgroundColor: statsBackgroundColor || "#FFFFFF",
      statsNameColor: statsNameColor || "#6B7280",
      statsValueColor: statsValueColor || "#4F46E5",
      isVisible: isVisible !== undefined ? isVisible : true,
      isActive: true,
      updatedAt: new Date(),
    };

    // Upsert - update if exists, create if doesn't
    await collection.replaceOne(
      {},
      { ...aboutData, createdAt: new Date() },
      { upsert: true }
    );
    
    return NextResponse.json({
      success: true,
      message: 'About content updated successfully',
      about: aboutData
    });
  } catch (error) {
    console.error('Error updating about content:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 