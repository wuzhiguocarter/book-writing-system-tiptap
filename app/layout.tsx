import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BookCraft - Writing System",
  description: "A modern book writing system built with Next.js and TipTap",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
