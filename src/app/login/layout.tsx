import "@fontsource/vazirmatn/400.css";
import "@fontsource/vazirmatn/500.css";
import "@fontsource/vazirmatn/700.css";
import "./../globals.css";
export default function HomeLayout({ children }) {
  return (
    <html>
      <body>
        <div>
          <header>login Layout Header</header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
