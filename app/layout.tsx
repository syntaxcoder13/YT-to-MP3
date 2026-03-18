import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "YT to MP3 \uD83C\uDFB5",
  description: "YouTube videos ko MP3 mein convert karo — free & fast",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen antialiased bg-[#0f0f0f] text-white flex flex-col`}>
        <main className="flex-1 flex flex-col items-center justify-center p-4">
          {children}
        </main>
        <footer className="w-full text-center p-6 text-gray-500 text-sm mt-auto">
          ⚠️ For personal use only. Please respect copyright laws.
        </footer>
      </body>
    </html>
  );
}
