import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    const domain = request.headers.get("x-domain") || "localhost:3000";
    const { db } = await connectToDatabase(domain);
    const collection = db?.collection("appDownloadConfig");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let appDownload: any = await collection?.findOne({});

    // If no config exists, create default one
    if (!appDownload) {
      const defaultAppDownload = {
        sectionTitle: "اپلیکیشن مدرسه ما را همیشه همراه داشته باشید",
        sectionSubtitle: "اپ موبایل رسمی مدرسه",
        sectionDescription: "با اپلیکیشن موبایل مدرسه، از هر جا و در هر زمان به اطلاعات درسی، کارنامه، برنامه کلاس‌ها و اطلاعیه‌های مدرسه دسترسی داشته باشید. والدین و دانش‌آموزان می‌توانند به‌راحتی در ارتباط باشند و پیشرفت تحصیلی را دنبال کنند.",
        features: [
          {
            id: "1",
            title: "رابط کاربری ساده و جذاب",
            description: "طراحی شده برای سهولت استفاده دانش‌آموزان و والدین، با محیطی کاربرپسند و روان.",
            icon: "DevicePhoneMobileIcon",
          },
          {
            id: "2",
            title: "سازگار با تمام گوشی‌ها",
            description: "قابل نصب روی گوشی‌های اندروید و آیفون، با عملکرد عالی و بدون محدودیت.",
            icon: "DeviceTabletIcon",
          },
        ],
        downloadButtons: [
          {
            id: "1",
            title: "دانلود از App Store",
            subtitle: "iOS",
            link: "#",
            iconUrl: "https://cdn-icons-png.flaticon.com/512/732/732208.png",
            bgColor: "#4F46E5",
            textColor: "#FFFFFF",
          },
          {
            id: "2",
            title: "دانلود از Google Play",
            subtitle: "Android",
            link: "#",
            iconUrl: "https://cdn-icons-png.flaticon.com/512/6124/6124997.png",
            bgColor: "#000000",
            textColor: "#FFFFFF",
          },
        ],
        appScreenshots: ["https://i.ibb.co/TLGBkg6/mobile-app-screen1.png"],
        isVisible: true,
        sectionTitleColor: "#1F2937",
        sectionSubtitleColor: "#4F46E5",
        sectionDescriptionColor: "#6B7280",
        backgroundGradientFrom: "#EEF2FF",
        backgroundGradientTo: "#FFFFFF",
        featureTitleColor: "#1F2937",
        featureDescriptionColor: "#6B7280",
        featureIconBgColor: "#4F46E5",
        featureIconColor: "#FFFFFF",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      

      await collection?.insertOne(defaultAppDownload);
      appDownload = defaultAppDownload;
    }

    return NextResponse.json({
      success: true,
      appDownload,
    });
  } catch (error) {
    console.error("Error fetching app download config:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch app download config" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const appDownloadData = await request.json();
    const domain = request.headers.get("x-domain") || "localhost:3000";
    const { db } = await connectToDatabase(domain);
    const collection = db?.collection("appDownloadConfig");

    // Remove _id from the data to avoid immutable field error
    delete appDownloadData._id;

    // Update the existing document or create a new one
    const result = await collection?.replaceOne(
      {},
      {
        ...appDownloadData,
        updatedAt: new Date(),
      },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      message: "App download config saved successfully",
      result,
    });
  } catch (error) {
    console.error("Error saving app download config:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save app download config" },
      { status: 500 }
    );
  }
} 