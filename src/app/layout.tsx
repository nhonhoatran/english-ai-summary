import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { CatWidget } from "@/components/cat/cat-widget";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // `template` lets a page set its own tab title while keeping the app name.
  title: {
    default: "Lớp Học Online — Học Tiếng Anh & Trung qua video YouTube",
    template: "%s · Lớp Học Online",
  },
  description:
    "Tạo lớp học trực tuyến từ bất kỳ video YouTube nào: thoại, từ vựng, ngữ pháp, quiz và luyện viết đồng bộ real-time cho cả lớp.",
  applicationName: "Lớp Học Online",
  openGraph: {
    title: "Lớp Học Online — Học Tiếng Anh & Trung qua video YouTube",
    description:
      "Tạo lớp học trực tuyến từ bất kỳ video YouTube nào, học cùng bạn bè real-time.",
    type: "website",
    locale: "vi_VN",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <CatWidget />
      </body>
    </html>
  );
}

