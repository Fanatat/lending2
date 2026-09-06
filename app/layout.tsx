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
import EasterEggCounter from "@/components/effects/EasterEggCounter";
import ProjectTransitionOverlay from "@/components/transitions/ProjectTransitionOverlay";
import PacketPile from "@/components/effects/PacketPile";
import AccessDeniedOverlay from "@/components/sections/allin/AccessDeniedOverlay";
import BranchOverlay from "@/components/easter-eggs/BranchOverlay";
import SudoEasterEgg from "@/components/easter-eggs/SudoEasterEgg";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Привет от Валеры",
  description:
    "Девять автономных систем. Ноль сотрудников, ноль облачных подписок, ноль обещаний.",
  icons: {
    icon: "data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%20100%20100'%3E%3Ctext%20y='.9em'%20font-size='90'%3E%E2%9D%A4%EF%B8%8F%3C/text%3E%3C/svg%3E",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ru"
      className={jetbrainsMono.variable}
      suppressHydrationWarning
    >
      <head>
        {/* Runs before hydration so a reload while SudoEasterEgg's lock is
            engaged shows the lock immediately instead of flashing the
            normal page first. Keys here must match SUDO_LOCK_KEY /
            SUDO_LOCK_HTML_CLASS in components/easter-eggs/SudoEasterEgg.tsx. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem('lab-terminal:sudo-locked')==='1'){document.documentElement.classList.add('sudo-locked-boot');}}catch(e){}`,
          }}
        />
      </head>
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
        <EasterEggCounter />
        <div className="relative z-10">{children}</div>
        <ProjectTransitionOverlay />
        <PacketPile />
        <AccessDeniedOverlay />
        <BranchOverlay />
        <SudoEasterEgg />
      </body>
    </html>
  );
}
