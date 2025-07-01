import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

// GET - Fetch features section content
export async function GET(request: NextRequest) {
  try {
    const domain = request.headers.get("x-domain") || "localhost:3000";
    const connection = await connectToDatabase(domain);
    const collection = connection.collection('website_features');
    
    const featuresContent = await collection.findOne({});

    // If no content exists, return default content
    if (!featuresContent) {
      const defaultContent = {
        title: "خدمات ویژه مدرسه ما",
        subtitle: "با ما، آینده روشن فرزندتان را تضمین کنید",
        description: "مدرسه ما با ارائه بهترین امکانات آموزشی، محیطی ایده‌آل برای پیشرفت تحصیلی و شخصیتی دانش‌آموزان فراهم کرده است. ما متعهد به پرورش نسل فردا هستیم.",
        features: [
          {
            name: "کلاس‌های استاندارد و پیشرفته",
            description: "کلاس‌های مجهز و معلمان مجرب برای آموزش مفهومی و خلاقانه، متناسب با نیاز هر دانش‌آموز.",
            iconName: "BookOpenIcon"
          },
          {
            name: "ارزیابی حرفه‌ای و کارنامه آنلاین",
            description: "ارائه گزارش دقیق از عملکرد دانش‌آموز به والدین از طریق سیستم کارنامه آنلاین و مشاوره مستمر.",
            iconName: "ClipboardDocumentCheckIcon"
          },
          {
            name: "ارتباط مستمر با والدین",
            description: "اطلاع‌رسانی منظم درباره وضعیت تحصیلی، حضور و فعالیت‌های مدرسه از طریق پیام‌رسان و پنل والدین.",
            iconName: "ChatBubbleLeftRightIcon"
          },
          {
            name: "داشبورد پیشرفت تحصیلی",
            description: "نمایش تصویری و جامع روند پیشرفت دانش‌آموز و کمک به والدین برای تصمیم‌گیری بهتر.",
            iconName: "ChartPieIcon"
          },
          {
            name: "سیستم مدیریت کاربران",
            description: "کنترل کامل دسترسی معلمان، مدیران و والدین برای ارتقاء امنیت و کیفیت مدیریت آموزشی.",
            iconName: "UserGroupIcon"
          },
          {
            name: "برنامه‌ریزی دقیق آموزشی",
            description: "برگزاری کلاس‌ها، امتحانات و رویدادهای آموزشی طبق تقویم هوشمند و به‌روز برای نظم بیشتر.",
            iconName: "CalendarIcon"
          }
        ],
        // Style settings
        backgroundColor: "#F9FAFB",
        titleColor: "#4F46E5",
        subtitleColor: "#111827",
        descriptionColor: "#6B7280",
        cardBackgroundColor: "#FFFFFF",
        cardBorderColor: "#E5E7EB",
        iconBackgroundColor: "#4F46E5",
        iconColor: "#FFFFFF",
        featureTitleColor: "#111827",
        featureDescriptionColor: "#6B7280",
        isVisible: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      return NextResponse.json({ success: true, features: defaultContent });
    }

    // Ensure backward compatibility by adding default style values if missing
    const featuresWithDefaults = {
      ...featuresContent,
      backgroundColor: featuresContent.backgroundColor || "#F9FAFB",
      titleColor: featuresContent.titleColor || "#4F46E5",
      subtitleColor: featuresContent.subtitleColor || "#111827",
      descriptionColor: featuresContent.descriptionColor || "#6B7280",
      cardBackgroundColor: featuresContent.cardBackgroundColor || "#FFFFFF",
      cardBorderColor: featuresContent.cardBorderColor || "#E5E7EB",
      iconBackgroundColor: featuresContent.iconBackgroundColor || "#4F46E5",
      iconColor: featuresContent.iconColor || "#FFFFFF",
      featureTitleColor: featuresContent.featureTitleColor || "#111827",
      featureDescriptionColor: featuresContent.featureDescriptionColor || "#6B7280",
      isVisible: featuresContent.isVisible !== undefined ? featuresContent.isVisible : true,
    };

    return NextResponse.json({ success: true, features: featuresWithDefaults });
  } catch (error) {
    console.error('Error fetching features content:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create or update features section content
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      title, 
      subtitle, 
      description, 
      features,
      isVisible,
      backgroundColor,
      titleColor,
      subtitleColor,
      descriptionColor,
      cardBackgroundColor,
      cardBorderColor,
      iconBackgroundColor,
      iconColor,
      featureTitleColor,
      featureDescriptionColor
    } = body;

    if (!title || !subtitle || !description) {
      return NextResponse.json(
        { success: false, error: 'Title, subtitle, and description are required' },
        { status: 400 }
      );
    }

    const domain = request.headers.get("x-domain") || "localhost:3000";
    const connection = await connectToDatabase(domain);
    const collection = connection.collection('website_features');

    const featuresData = {
      title,
      subtitle,
      description,
      features: features || [],
      // Style settings with defaults
      backgroundColor: backgroundColor || "#F9FAFB",
      titleColor: titleColor || "#4F46E5",
      subtitleColor: subtitleColor || "#111827",
      descriptionColor: descriptionColor || "#6B7280",
      cardBackgroundColor: cardBackgroundColor || "#FFFFFF",
      cardBorderColor: cardBorderColor || "#E5E7EB",
      iconBackgroundColor: iconBackgroundColor || "#4F46E5",
      iconColor: iconColor || "#FFFFFF",
      featureTitleColor: featureTitleColor || "#111827",
      featureDescriptionColor: featureDescriptionColor || "#6B7280",
      isVisible: isVisible !== undefined ? isVisible : true,
      isActive: true,
      updatedAt: new Date(),
    };

    // Upsert - update if exists, create if doesn't
    await collection.replaceOne(
      {},
      { ...featuresData, createdAt: new Date() },
      { upsert: true }
    );
    
    return NextResponse.json({
      success: true,
      message: 'Features content updated successfully',
      features: featuresData
    });
  } catch (error) {
    console.error('Error updating features content:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 