import { vazirmatn } from "@/lib/fonts";
import "./../globals.css";

export default function LoginLayout({ children }) {
  return (
    <html lang="fa" dir="rtl">
      <body className={`${vazirmatn.className} antialiased`}>
        <main>{children}</main>
      </body>
    </html>
  );
}
