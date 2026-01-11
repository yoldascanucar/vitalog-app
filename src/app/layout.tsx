import type { Metadata } from "next";
import { Inter, Outfit, Roboto, Lexend } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { BottomNav } from "@/components/BottomNav";
import { AlarmProvider } from "@/context/AlarmContext";
import { SettingsProvider } from "@/context/SettingsContext";
import { SoundActivationBanner } from "@/components/SoundActivationBanner";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const roboto = Roboto({ weight: ["400", "700", "900"], subsets: ["latin"], variable: "--font-roboto" });
const lexend = Lexend({ subsets: ["latin"], variable: "--font-lexend" });

export const metadata: Metadata = {
  title: "İlaç Asistanı",
  description: "Kişisel ilaç takip asistanınız",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0", // Mobile optimization
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className={cn(
        "min-h-screen bg-zinc-100 antialiased overflow-hidden",
        inter.variable,
        outfit.variable,
        roboto.variable,
        lexend.variable
      )}>
        <div className="fixed inset-0 flex items-center justify-center">
          <div className="relative flex h-full w-full flex-col overflow-hidden bg-background shadow-2xl sm:h-[800px] sm:max-w-[480px] sm:rounded-[40px] sm:border-[8px] sm:border-gray-900">
            <SettingsProvider>
              <AlarmProvider>
                <div className="hidden h-8 w-full shrink-0 items-center justify-between bg-black px-6 text-xs font-semibold text-white sm:flex sm:rounded-t-[32px] z-50">
                  <span>9:41</span>
                  <div className="flex gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-white/20"></div>
                    <div className="h-2.5 w-2.5 rounded-full bg-white/20"></div>
                    <div className="h-2.5 w-3.5 rounded-[2px] bg-white"></div>
                  </div>
                </div>

                <SoundActivationBanner />

                <main className="relative flex-1 overflow-y-auto overflow-x-hidden bg-background">
                  {children}
                </main>

                <BottomNav />
              </AlarmProvider>
            </SettingsProvider>

            <div className="absolute bottom-1 left-1/2 pointer-events-none hidden h-1 w-32 -translate-x-1/2 rounded-full bg-black/20 sm:block z-50"></div>
          </div>
        </div>
      </body>
    </html>
  );
}
