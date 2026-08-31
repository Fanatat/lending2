import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/effects/SmoothScroll";
import ParticleDust from "@/components/effects/ParticleDust";
import SmokeField from "@/components/effects/SmokeField";
import CustomCursor from "@/components/effects/CustomCursor";
import ScrollProgress from "@/components/effects/ScrollProgress";
import TrunkNav from "@/components/effects/TrunkNav";
import MatrixModeController from "@/components/effects/MatrixModeController";
import MatrixRain from "@/components/effects/MatrixRain";
import SoundToggle from "@/components/effects/SoundToggle";
import ProjectTransitionOverlay from "@/components/transitions/ProjectTransitionOverlay";
import PacketPile from "@/components/effects/PacketPile";
import AccessDeniedOverlay from "@/components/sections/allin/AccessDeniedOverlay";
import BranchOverlay from "@/components/easter-eggs/BranchOverlay";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Не резюме. Список реализованных задач.",
  description:
    "Девять автономных систем. Ноль сотрудников, ноль облачных подписок, ноль обещаний.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className={jetbrainsMono.variable}>
      <body>
        <SmoothScroll />
        <MatrixModeController />
        <MatrixRain />
        <ParticleDust />
        <SmokeField />
        <ScrollProgress />
        <TrunkNav />
        <CustomCursor />
        <SoundToggle />
        <div className="relative z-10">{children}</div>
        <ProjectTransitionOverlay />
        <PacketPile />
        <AccessDeniedOverlay />
        <BranchOverlay />
      </body>
    </html>
  );
}
