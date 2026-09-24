"use client";

import dynamic from "next/dynamic";
import type { SystemKey } from "@/lib/systemCopy";
import CartridgeGrid from "@/components/sections/friday/CartridgeGrid";
import AutopilotCard from "@/components/sections/autopilot/AutopilotCard";
import BridgeDiagram from "@/components/sections/bridge/BridgeDiagram";
import PortfolioWidget from "@/components/sections/allin/PortfolioWidget";
import PortfolioHealthCard from "@/components/sections/allin/PortfolioHealthCard";
import StaffChatSim from "./StaffChatSim";

const panel = "w-full border border-line bg-panel";

const HP100Widget = dynamic(() => import("@/components/sections/hp100/HP100Widget"), {
  ssr: false,
  loading: () => <div className={`h-[260px] max-w-sm ${panel}`} />,
});
const ConveyorBelt = dynamic(() => import("@/components/sections/factory/ConveyorBelt"), {
  ssr: false,
  loading: () => <div className={`h-[140px] ${panel}`} />,
});
const PerimeterMap = dynamic(() => import("@/components/sections/perimeter/PerimeterMap"), {
  ssr: false,
  loading: () => <div className={`aspect-square max-w-sm ${panel}`} />,
});

/**
 * The same live widget the system shows on the dashboard, reused on its own
 * page (ProjectCardLink turns inert there, so the cards don't link to
 * themselves).
 */
export default function ProjectWidget({ system }: { system: SystemKey }) {
  switch (system) {
    case "friday":
      return <CartridgeGrid />;
    case "hp100":
      return <HP100Widget />;
    case "autopilot":
      return (
        <div className="flex w-full max-w-sm flex-col items-center gap-6 border border-line bg-panel p-6">
          <AutopilotCard />
        </div>
      );
    case "bridge":
      return <BridgeDiagram />;
    case "allin":
      return (
        <div className="flex flex-wrap items-start gap-4">
          <PortfolioWidget />
          <PortfolioHealthCard />
        </div>
      );
    case "factory":
      return <ConveyorBelt />;
    case "staff":
      return <StaffChatSim />;
    case "perimeter":
      return <PerimeterMap />;
  }
}
