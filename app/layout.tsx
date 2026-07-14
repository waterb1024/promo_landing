import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Landing CMS",
  description: "상세페이지 자동화 플랫폼"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
