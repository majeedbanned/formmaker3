import { vazirmatn } from "@/lib/fonts";
import "./../globals.css";
export default function HomeLayout({ children }) {
  return (
    <html>
      <body className={`${vazirmatn.className} antialiased`}>
        <div>
          <header>login Layout Header</header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
