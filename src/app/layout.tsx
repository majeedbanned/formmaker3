import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toast";
import FloatingChat from "@/components/FloatingChat";

const vazirmatn = Vazirmatn({
  subsets: ["arabic"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-vazirmatn",
});

export const metadata: Metadata = {
  title: "پارسا موز | سیستم مدیریت آموزش",
  description: "سامانه مدیریت آموزش و یادگیری برای مدارس و موسسات آموزشی",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa">
      <body className={`${vazirmatn.className} font-sans`}>
        {children}
        <Toaster />
        <FloatingChat />
      </body>
    </html>
  );
}
