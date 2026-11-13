import type { Metadata, Viewport } from "next";
import "./globals.css";
import { StoreProvider } from "@/components/StoreProvider";
import { NavBar } from "@/components/layout/NavBar";

export const metadata: Metadata = {
  title: "AI Stylist | 自分だけのクローゼットとAI試着",
  description: "手持ちの服を登録して、自分の全身写真で着せ替え。AIスタイリストがコーデを提案します。",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#f6f4f0" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="min-h-dvh antialiased">
        <StoreProvider>
          <NavBar />
          <main className="mx-auto max-w-6xl px-4 pb-28 pt-4 md:px-6 md:pb-12 md:pt-8">{children}</main>
        </StoreProvider>
      </body>
    </html>
  );
}
