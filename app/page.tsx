import Hero from "@/components/hero/Hero";
import FridaySection from "@/components/sections/friday/FridaySection";
import HP100Section from "@/components/sections/hp100/HP100Section";
import AutopilotSection from "@/components/sections/autopilot/AutopilotSection";
import BridgeSection from "@/components/sections/bridge/BridgeSection";
import AllInSection from "@/components/sections/allin/AllInSection";
import FactorySection from "@/components/sections/factory/FactorySection";
import StaffSection from "@/components/sections/staff/StaffSection";
import PerimeterSection from "@/components/sections/perimeter/PerimeterSection";
import ClosingSection from "@/components/sections/closing/ClosingSection";
import BranchTeaser from "@/components/easter-eggs/BranchTeaser";

export default function HomePage() {
  return (
    <main>
      <Hero />
      <FridaySection />
      <HP100Section />
      <AutopilotSection />
      <BridgeSection />
      <AllInSection />
      <FactorySection />
      <StaffSection />
      <PerimeterSection />
      <ClosingSection />
      <BranchTeaser />
    </main>
  );
}
