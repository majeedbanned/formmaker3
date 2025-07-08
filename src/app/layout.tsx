import type { Metadata } from "next";
import { vazirmatn } from "@/lib/fonts";
import "./globals.css";
import { Toaster } from "@/components/ui/toast";
import FloatingChat from "@/components/FloatingChat";
import { MathJaxContext } from "better-react-mathjax";

export const metadata: Metadata = {
  title: "  سیستم مدیریت آموزش",
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
        <MathJaxContext>{children}</MathJaxContext>
        <Toaster />
        <FloatingChat />
      </body>
    </html>
  );
}
