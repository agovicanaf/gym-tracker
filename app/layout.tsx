import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "9214.82 | Antrenman Takip",
  description: "Ömer için kişisel antrenman ve ağırlık takip sistemi",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "9214.82",
  },
  formatDetection: {
    telephone: false,
  },
};

// viewport-fit=cover + safe-area-inset değişkenleri iOS'ta çentik/Dynamic
// Island ve alttaki home indicator ile içerik çakışmasını önler.
// maximum-scale=1 + user-scalable=no, form alanına dokununca iOS'un
// sayfayı otomatik yakınlaştırmasını (16px altı font'larda tetiklenir)
// engellemeye yardımcı olur; asıl çözüm globals.css'teki 16px input font'u.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0a0a0b",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="tr" className="h-full antialiased">
      <body className="min-h-full flex flex-col overscroll-none">{children}</body>
    </html>
  );
}
