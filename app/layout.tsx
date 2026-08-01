import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AnnouncementBar from "@/components/layout/AnnouncementBar";




const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Charles & Keith | Official Store",
  description: "Shop women's shoes, bags, and accessories.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        {/* 1. Auto-scrolling Announcement Bar at the top */}
        <AnnouncementBar/>

        {/* 2. Main Navigation Header */}

        {/* 3. Main Page Content (flex-1 pushes footer to bottom) */}
        <main className="flex-1">
          {children}
        </main>

        {/* 4. Global Footer */}
        
      </body>
    </html>
  );
}