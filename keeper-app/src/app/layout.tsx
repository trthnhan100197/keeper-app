import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Keeper",
  description: "Quản lý nhà trọ, chỉ số điện nước và hóa đơn",
};

const THEME_INIT_SCRIPT = `
try {
  var t = localStorage.getItem('keeper-app-theme');
  if (t === 'dark' || t === 'light') {
    document.documentElement.setAttribute('data-theme', t);
  }
} catch (e) {}
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
