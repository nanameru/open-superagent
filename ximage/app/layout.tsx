import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PixelMe - あなたのX投稿からレトロゲーム風ピクセルアバターを生成",
  description: "X（旧Twitter）の投稿内容からあなただけのレトロゲーム風ピクセルアートアバターを生成。AIで遊ぶコミュニティでさらに楽しいAIアプリを発見しよう！",
  keywords: "ピクセルアート, レトロゲーム, アバター生成, AI, X, Twitter, ジェネレーティブAI, Gemini, AIアプリ, AIコミュニティ",
  openGraph: {
    title: "PixelMe - レトロゲーム風ピクセルアバター生成",
    description: "X投稿からレトロゲーム風ピクセルアバターを生成！AIで遊ぶコミュニティでさらに楽しいAIアプリも発見しよう",
    type: "website",
    url: "https://aideasobou.vercel.app",
    images: [
      {
        url: "https://aideasobou.vercel.app/ogp.png",
        width: 1200,
        height: 630,
        alt: "PixelMe - レトロゲーム風ピクセルアバター生成"
      }
    ],
    siteName: "PixelMe - AIアバター生成"
  },
  twitter: {
    card: "summary_large_image",
    title: "PixelMe - レトロゲーム風ピクセルアバター生成",
    description: "X投稿からレトロゲーム風ピクセルアバターを生成！AIで遊ぶコミュニティも要チェック",
    images: ["https://aideasobou.vercel.app/ogp.png"],
    site: "@aideasobou",
    creator: "@aideasobou"
  },
  metadataBase: new URL("https://pixel-me.vercel.app"),
  alternates: {
    canonical: "/"
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-gradient-to-b from-background to-background/80`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
