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
        title: "درباره پارسا موز",
        description: "پارسا موز با هدف ارتقای کیفیت آموزش و تسهیل فرآیندهای مدیریتی مدارس ایجاد شده است. تیم ما متشکل از متخصصان آموزشی و مهندسان نرم‌افزار، راهکاری جامع برای نیازهای آموزشی امروز طراحی کرده‌اند.",
        benefitsTitle: "مزایای استفاده",
        benefits: [
          "بهبود ارتباط بین معلمان، دانش‌آموزان و والدین",
          "صرفه‌جویی در زمان با اتوماسیون فرآیندهای اداری",
          "تحلیل و گزارش‌گیری جامع از عملکرد آموزشی",
          "دسترسی آسان به اطلاعات از هر دستگاه و هر مکان",
          "پشتیبانی فنی ۲۴/۷ و بروزرسانی‌های منظم"
        ],
        stats: [
          { id: 1, name: "سال تجربه", value: "+10" },
          { id: 2, name: "مدارس", value: "+250" },
          { id: 3, name: "دانش‌آموزان", value: "+45K" },
          { id: 4, name: "رضایت مشتریان", value: "98%" }
        ],
        image: {
          url: "/images/about-team.jpg",
          alt: "Our team at work"
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