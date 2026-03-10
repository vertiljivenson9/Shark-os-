import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Shark OS - Web Operating System",
  description: "Shark OS is a privacy-first web-based operating system. Access your files, apps, and tools from anywhere with zero cost.",
  keywords: ["Shark OS", "Web OS", "Operating System", "Browser OS", "Cloud Desktop", "Puter alternative", "Next.js", "React"],
  authors: [{ name: "Shark OS Team" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "Shark OS - Web Operating System",
    description: "A privacy-first web-based operating system with encrypted vault, 20+ apps, and zero cost.",
    url: "https://shark-os.onrender.com",
    siteName: "Shark OS",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Shark OS - Web Operating System",
    description: "A privacy-first web-based operating system with encrypted vault, 20+ apps, and zero cost.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
