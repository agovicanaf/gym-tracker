import type { Metadata, Viewport } from "next";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import "./globals.css";

export const metadata: Metadata = {
  title: "9214.82 | Antrenman Takip",
  description: "Ömer için kişisel antrenman ve ağırlık takip sistemi",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "9214.82",
  },
  icons: {
    icon: [
      { url: "/icons/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
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
      <body className="min-h-full flex flex-col overscroll-none">
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
