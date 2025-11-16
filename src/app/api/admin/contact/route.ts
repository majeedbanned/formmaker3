import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getCurrentUser } from "@/app/api/chatbot7/config/route";

interface ContactInfo {
  phone: string;
  phoneDesc: string;
  email: string;
  emailDesc: string;
  address: string;
  postalCode: string;
}

interface SocialLink {
  name: string;
  url: string;
  icon: string;
}

interface ContactData {
  sectionTitle: string;
  sectionSubtitle: string;
  sectionDescription: string;
  contactInfo: ContactInfo;
  socialLinks: SocialLink[];
  formTitle: string;
  formDescription: string;
  isVisible: boolean;
  sectionTitleColor: string;
  sectionSubtitleColor: string;
  sectionDescriptionColor: string;
  backgroundGradientFrom: string;
  backgroundGradientTo: string;
  contactInfoTextColor: string;
  contactInfoIconColor: string;
  formBgColor: string;
  formTextColor: string;
  formButtonColor: string;
  formButtonTextColor: string;
}

// GET: Fetch contact data
export async function GET(req: NextRequest) {
  try {
    const domain = req.headers.get("x-domain") || "default";
    // console.log("Contact GET request for domain:", domain);

    const { db } = await connectToDatabase(domain);
    const collection = db.collection("contactConfig");

    let contactData = await collection.findOne({});

    if (!contactData) {
      // Return default data if no configuration exists
      contactData = {
        sectionTitle: "ما آماده پاسخگویی به سوالات شما هستیم",
        sectionSubtitle: "تماس با ما",
        sectionDescription: "برای کسب اطلاعات بیشتر، درخواست دمو یا مشاوره با ما در تماس باشید.",
        contactInfo: {
          phone: "۰۲۱-۸۸۸۸۷۷۷۷",
          phoneDesc: "دوشنبه تا پنجشنبه (۸ صبح تا ۵ بعدازظهر)",
          email: "info@farsamooz.ir",
          emailDesc: "برای دریافت پاسخ سریع با ما تماس بگیرید",
          address: "تهران، خیابان ولیعصر، برج پارسا، طبقه ۱۲",
          postalCode: "۱۴۵۶۷۸۹۳۰۲",
        },
        socialLinks: [
          {
            name: "Instagram",
            url: "#",
            icon: "M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 711.153-1.772A4.902 4.902 0 715.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z",
          },
          {
            name: "Twitter",
            url: "#",
            icon: "M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 712.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 712 18.407a11.616 11.616 0 006.29 1.84",
          },
          {
            name: "LinkedIn",
            url: "#",
            icon: "M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z",
          },
        ],
        formTitle: "ارسال پیام",
        formDescription: "فرم زیر را تکمیل کنید تا کارشناسان ما در اسرع وقت با شما تماس بگیرند.",
        isVisible: true,
        sectionTitleColor: "#FFFFFF",
        sectionSubtitleColor: "#A855F7",
        sectionDescriptionColor: "#D1D5DB",
        backgroundGradientFrom: "#111827",
        backgroundGradientTo: "#111827",
        contactInfoTextColor: "#D1D5DB",
        contactInfoIconColor: "#A855F7",
        formBgColor: "#FFFFFF",
        formTextColor: "#111827",
        formButtonColor: "#4F46E5",
        formButtonTextColor: "#FFFFFF",
      };
    }

    return NextResponse.json({
      success: true,
      contact: contactData,
    });

  } catch (error: any) {
    console.error("Error in contact GET:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST: Save contact data
export async function POST(req: NextRequest) {
  try {
    const domain = req.headers.get("x-domain") || "default";
    // console.log("Contact POST request for domain:", domain);

    // Check if user is authenticated
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check if user is a school admin
    if (currentUser.userType !== "school") {
      return NextResponse.json(
        { success: false, error: "Access denied. School admin role required." },
        { status: 403 }
      );
    }

    const contactData: ContactData = await req.json();
    // console.log("Saving contact data:", contactData);

    const { db } = await connectToDatabase(domain);
    const collection = db.collection("contactConfig");

    // Remove _id if it exists to avoid update conflicts
    delete (contactData as any)._id;

    const result = await collection.replaceOne(
      {},
      contactData,
      { upsert: true }
    );

    // console.log("Contact save result:", result);

    return NextResponse.json({
      success: true,
      message: "Contact data saved successfully",
    });

  } catch (error: any) {
    console.error("Error in contact POST:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
} 