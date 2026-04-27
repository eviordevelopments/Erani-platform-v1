import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { DashboardProvider } from "@/context/DashboardContext";
import { ThemeProvider } from "@/context/ThemeContext";
import Script from "next/script";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ERANI | Profitability Firewall",
  description: "Industrial-grade SwaS ecosystem for agency profitability governance.",
  icons: {
    icon: "/isologo.png",
    apple: "/isologo.png",
  },
};

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
        <ThemeProvider>
          <AuthProvider>
            <DashboardProvider>
              {/* Background Blobs */}
              <div className="bg-blob-purple w-[600px] h-[600px] -top-40 -right-40" />
              <div className="bg-blob-blue w-[500px] h-[500px] -bottom-20 -left-20" />
              <div className="bg-blob-purple w-[400px] h-[400px] top-1/2 left-1/3 opacity-[0.05]" />
              
              {children}
            </DashboardProvider>
          </AuthProvider>
        </ThemeProvider>
        <Script src="https://assets.calendly.com/assets/external/widget.js" strategy="lazyOnload" />
      </body>
    </html>
  );
}


