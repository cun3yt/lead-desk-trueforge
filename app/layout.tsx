import type { Metadata } from "next";
import { Barlow, Barlow_Condensed, Geist_Mono } from "next/font/google";
import { CopilotKitProvider } from "@copilotkit/react-core/v2";
import "@copilotkit/react-core/v2/styles.css";
import "./globals.css";

const barlow = Barlow({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  subsets: ["latin"],
  weight: ["600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Acme · Fleet maintenance on autopilot",
  description: "Service schedules, work orders and inspections for trucking fleets.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${barlow.variable} ${barlowCondensed.variable} ${geistMono.variable} antialiased`}>
      <body className="min-h-full font-sans">
        {/* Inspector off: keeps the demo screen clean. */}
        <CopilotKitProvider runtimeUrl="/api/copilotkit" enableInspector={false}>
          {children}
        </CopilotKitProvider>
      </body>
    </html>
  );
}
