import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "METU-IE Summer Practice Assistant",
  description: "Chatbot for METU Industrial Engineering Summer Practice (IE300/IE400) queries",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full bg-metu-light`}>
        {children}
      </body>
    </html>
  );
}
