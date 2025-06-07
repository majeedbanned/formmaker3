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
        title: "ویژگی‌ها",
        subtitle: "تمام آنچه برای مدیریت آموزشی نیاز دارید",
        description: "پارسا موز با مجموعه‌ای از ابزارهای کارآمد، فرآیند آموزش و یادگیری را برای همه ذینفعان تسهیل می‌کند.",
        features: [
          {
            name: "مدیریت کلاس‌ها",
            description: "کلاس‌ها، دروس و دانش‌آموزان را به آسانی مدیریت کنید. از تقویم درسی تا ارائه تکالیف، همه در یک پلتفرم.",
            iconName: "BookOpenIcon"
          },
          {
            name: "ارزیابی و آزمون‌ها",
            description: "آزمون‌های آنلاین ایجاد کنید، نمرات را ثبت کنید و نتایج را به صورت نمودارهای تحلیلی مشاهده کنید.",
            iconName: "ClipboardDocumentCheckIcon"
          },
          {
            name: "ارتباط با والدین",
            description: "ارتباط موثر با والدین از طریق پیام‌رسان داخلی، گزارش‌دهی خودکار و اطلاع‌رسانی وضعیت تحصیلی.",
            iconName: "ChatBubbleLeftRightIcon"
          },
          {
            name: "داشبورد تحلیلی",
            description: "داشبوردهای تحلیلی پیشرفته برای بررسی پیشرفت دانش‌آموزان، عملکرد کلاسی و روند آموزشی.",
            iconName: "ChartPieIcon"
          },
          {
            name: "مدیریت کاربران",
            description: "تعریف سطوح دسترسی مختلف برای معلمان، مدیران، دانش‌آموزان و والدین با امکان شخصی‌سازی.",
            iconName: "UserGroupIcon"
          },
          {
            name: "برنامه‌ریزی تحصیلی",
            description: "برنامه‌ریزی دروس، امتحانات و رویدادهای آموزشی با تقویم هوشمند و یادآوری‌های خودکار.",
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