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
