/**
 * Root Layout for Next.js App Router
 * التخطيط الرئيسي لـ Next.js App Router
 * 
 * This component wraps all pages and provides the necessary context providers,
 * global styles, and metadata.
 */
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./global.css"; // Global styles
import { TRPCProvider } from "./lib/trpc/TRPCProvider"; // Import the new TRPC Provider
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SGH CRM Portal - بوابة المستشفى السعودي الألماني",
  description: "نظام إلكتروني متكامل لإدارة حملات التسويق وعلاقات العملاء للمستشفى السعودي الألماني - صنعاء",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className={inter.className}>
        <TRPCProvider>
          <TooltipProvider>
            <Toaster />
            {children}
          </TooltipProvider>
        </TRPCProvider>
      </body>
    </html>
  );
}
