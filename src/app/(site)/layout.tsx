import { vazirmatn } from "@/lib/fonts";

export default function HomeLayout({ children }) {
  return (
    <html>
      <body className={`${vazirmatn.className} antialiased`}>
        <div>
          {/* <header>site Layout Header</header> */}
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
