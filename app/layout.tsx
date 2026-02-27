import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "stand.fm 要約",
  description: "stand.fm のエピソードを AI で500字に要約するアプリ",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="bg-gray-50 text-gray-900 min-h-screen">{children}</body>
    </html>
  );
}
