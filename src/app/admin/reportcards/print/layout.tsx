export default function PrintLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 1cm;
          }
          
          body {
            margin: 0 !important;
            padding: 0 !important;
          }
          
          header,
          nav,
          .sidebar,
          .breadcrumb,
          button,
          .print\\:hidden,
          aside {
            display: none !important;
          }
        }
        
        @media screen {
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
          
          header,
          nav,
          .sidebar,
          .breadcrumb,
          button:not(.print-button),
          aside {
            display: none !important;
          }
        }
      `}</style>
      <div style={{ margin: 0, padding: 0, background: "white", minHeight: "100vh" }}>
        {children}
      </div>
    </>
  );
}

