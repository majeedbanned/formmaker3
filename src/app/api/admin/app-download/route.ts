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
        sectionTitle: "پارسا موز را همیشه همراه داشته باشید",
        sectionSubtitle: "اپلیکیشن موبایل",
        sectionDescription: "با استفاده از اپلیکیشن موبایل پارسا موز، در هر زمان و مکان به سیستم مدیریت آموزشی خود دسترسی داشته باشید. مدیریت کلاس‌ها، پیگیری پیشرفت دانش‌آموزان و ارتباط با والدین را از طریق گوشی هوشمند خود انجام دهید.",
        features: [
          {
            id: "1",
            title: "رابط کاربری ساده و زیبا",
            description: "طراحی شده برای استفاده آسان و سریع توسط معلمان، مدیران، والدین و دانش‌آموزان.",
            icon: "DevicePhoneMobileIcon",
          },
          {
            id: "2",
            title: "سازگار با همه دستگاه‌ها",
            description: "قابل استفاده بر روی گوشی‌های اندروید، آیفون و تبلت‌ها با تجربه کاربری یکسان.",
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