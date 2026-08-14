import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { DashboardProvider } from "@/context/DashboardContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { AccessibilityProvider } from "@/context/AccessibilityContext";
import Script from "next/script";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ERANI | Profitability Firewall",
  description: "Industrial-grade SwaS ecosystem for agency profitability governance.",
  icons: {
    icon: "/isologo.png",
    apple: "/isologo.png",
  },
};

import IdleTimer from "@/components/IdleTimer";
import SupportWidget from "@/components/SupportWidget";
import FeedbackWidget from "@/components/FeedbackWidget";
import AccessibilityPanel from "@/components/AccessibilityPanel";
import AccessibilityFloatingWidget from "@/components/AccessibilityFloatingWidget";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${montserrat.variable} h-full antialiased font-sans`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground transition-colors duration-300">
        <AccessibilityProvider>
          <ThemeProvider>
            <AuthProvider>
              <DashboardProvider>
                <IdleTimer />
              {/* Background Blobs */}
              <div className="bg-blob-purple w-[600px] h-[600px] -top-40 -right-40" />
              <div className="bg-blob-blue w-[500px] h-[500px] -bottom-20 -left-20" />
              <div className="bg-blob-purple w-[400px] h-[400px] top-1/2 left-1/3 opacity-[0.05]" />
              
              {children}
              <SupportWidget />
              <FeedbackWidget />
              <AccessibilityPanel />
              <AccessibilityFloatingWidget />
            </DashboardProvider>
          </AuthProvider>
        </ThemeProvider>
      </AccessibilityProvider>
        <Script src="https://assets.calendly.com/assets/external/widget.js" strategy="lazyOnload" />
      </body>
    </html>
  );
}


