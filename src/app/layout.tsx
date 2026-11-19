import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Peyja · اتصال اینستاگرام با SendBox",
  description:
    "اتصال پیج اینستاگرام از طریق API رسمی (SendBox) و ذخیره خودکار آخرین پست در دیتابیس.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
