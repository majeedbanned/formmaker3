import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

// GET - Fetch teachers section content
export async function GET(request: NextRequest) {
  try {
    const domain = request.headers.get("x-domain") || "localhost:3000";
    const connection = await connectToDatabase(domain);
    const collection = connection.collection('website_teachers');
    
    const teachersContent = await collection.findOne({});

    // If no content exists, return default content
    if (!teachersContent) {
      const defaultContent = {
        title: "تیم آموزشی",
        subtitle: "با متخصصان ما آشنا شوید",
        description: "تیمی از بهترین متخصصان آموزشی و مشاوران تحصیلی در پارسا موز به ارائه خدمات می‌پردازند.",
        teachers: [
          {
            id: 1,
            name: "دکتر علی محمدی",
            role: "مدیر آموزشی",
            bio: "دارای دکترای مدیریت آموزشی از دانشگاه تهران با بیش از ۱۵ سال سابقه مدیریت در مدارس و موسسات آموزشی.",
            avatar: "https://randomuser.me/api/portraits/men/32.jpg",
            subjects: ["مدیریت آموزشی", "برنامه‌ریزی درسی"],
            social: {
              linkedin: "#",
              twitter: "#",
              email: "a.mohammadi@parsamooz.ir"
            }
          },
          {
            id: 2,
            name: "دکتر سارا کریمی",
            role: "متخصص برنامه‌ریزی درسی",
            bio: "فارغ‌التحصیل دانشگاه شهید بهشتی در رشته برنامه‌ریزی آموزشی، با تجربه طراحی برنامه‌های درسی نوآورانه برای مدارس پیشرو.",
            avatar: "https://randomuser.me/api/portraits/women/44.jpg",
            subjects: ["طراحی برنامه درسی", "ارزشیابی آموزشی"],
            social: {
              linkedin: "#",
              twitter: "#",
              email: "s.karimi@parsamooz.ir"
            }
          }
        ],
        linkText: "مشاهده همه اساتید و متخصصین",
        linkUrl: "/team",
        // Style settings
        backgroundColor: "#F9FAFB",
        titleColor: "#4F46E5",
        subtitleColor: "#111827",
        descriptionColor: "#6B7280",
        cardBackgroundColor: "#FFFFFF",
        nameColor: "#111827",
        roleColor: "#4F46E5",
        bioColor: "#6B7280",
        subjectsBackgroundColor: "#EEF2FF",
        subjectsTextColor: "#4F46E5",
        socialIconColor: "#9CA3AF",
        socialIconHoverColor: "#4F46E5",
        linkColor: "#4F46E5",
        isVisible: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      return NextResponse.json({ success: true, teachers: defaultContent });
    }

    // Ensure backward compatibility by adding default style values if missing
    const teachersWithDefaults = {
      ...teachersContent,
      backgroundColor: teachersContent.backgroundColor || "#F9FAFB",
      titleColor: teachersContent.titleColor || "#4F46E5",
      subtitleColor: teachersContent.subtitleColor || "#111827",
      descriptionColor: teachersContent.descriptionColor || "#6B7280",
      cardBackgroundColor: teachersContent.cardBackgroundColor || "#FFFFFF",
      nameColor: teachersContent.nameColor || "#111827",
      roleColor: teachersContent.roleColor || "#4F46E5",
      bioColor: teachersContent.bioColor || "#6B7280",
      subjectsBackgroundColor: teachersContent.subjectsBackgroundColor || "#EEF2FF",
      subjectsTextColor: teachersContent.subjectsTextColor || "#4F46E5",
      socialIconColor: teachersContent.socialIconColor || "#9CA3AF",
      socialIconHoverColor: teachersContent.socialIconHoverColor || "#4F46E5",
      linkColor: teachersContent.linkColor || "#4F46E5",
      isVisible: teachersContent.isVisible !== undefined ? teachersContent.isVisible : true,
    };

    return NextResponse.json({ success: true, teachers: teachersWithDefaults });
  } catch (error) {
    console.error('Error fetching teachers content:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create or update teachers section content
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      title, 
      subtitle, 
      description, 
      teachers,
      linkText,
      linkUrl,
      isVisible,
      backgroundColor,
      titleColor,
      subtitleColor,
      descriptionColor,
      cardBackgroundColor,
      nameColor,
      roleColor,
      bioColor,
      subjectsBackgroundColor,
      subjectsTextColor,
      socialIconColor,
      socialIconHoverColor,
      linkColor
    } = body;

    if (!title || !subtitle || !description) {
      return NextResponse.json(
        { success: false, error: 'Title, subtitle, and description are required' },
        { status: 400 }
      );
    }

    const domain = request.headers.get("x-domain") || "localhost:3000";
    const connection = await connectToDatabase(domain);
    const collection = connection.collection('website_teachers');

    const teachersData = {
      title,
      subtitle,
      description,
      teachers: teachers || [],
      linkText: linkText || "مشاهده همه اساتید و متخصصین",
      linkUrl: linkUrl || "/team",
      // Style settings with defaults
      backgroundColor: backgroundColor || "#F9FAFB",
      titleColor: titleColor || "#4F46E5",
      subtitleColor: subtitleColor || "#111827",
      descriptionColor: descriptionColor || "#6B7280",
      cardBackgroundColor: cardBackgroundColor || "#FFFFFF",
      nameColor: nameColor || "#111827",
      roleColor: roleColor || "#4F46E5",
      bioColor: bioColor || "#6B7280",
      subjectsBackgroundColor: subjectsBackgroundColor || "#EEF2FF",
      subjectsTextColor: subjectsTextColor || "#4F46E5",
      socialIconColor: socialIconColor || "#9CA3AF",
      socialIconHoverColor: socialIconHoverColor || "#4F46E5",
      linkColor: linkColor || "#4F46E5",
      isVisible: isVisible !== undefined ? isVisible : true,
      isActive: true,
      updatedAt: new Date(),
    };

    // Upsert - update if exists, create if doesn't
    await collection.replaceOne(
      {},
      { ...teachersData, createdAt: new Date() },
      { upsert: true }
    );
    
    return NextResponse.json({
      success: true,
      message: 'Teachers content updated successfully',
      teachers: teachersData
    });
  } catch (error) {
    console.error('Error updating teachers content:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 