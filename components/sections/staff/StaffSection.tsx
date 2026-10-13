import SectionShell from "@/components/sections/SectionShell";
import SystemStatusLine from "@/components/sections/SystemStatusLine";
import StaffGrid from "./StaffGrid";
import StaffDetails from "./StaffDetails";
import { SYSTEM_COPY } from "@/lib/systemCopy";

export default function StaffSection() {
  return (
    <SectionShell
      id="staff"
      number={SYSTEM_COPY.staff.number}
      title={SYSTEM_COPY.staff.title}
      line={
        <>
          <SystemStatusLine systemId="staff" className="mb-3" />
          Каждый проект требует фокуса. Чтобы он не размывался при переключении между задачами, я поднял отдел, который фактически стал моими заместителями. Пять методологий работы с агентами сравнил на одной задаче и оставил лучшую по результату.
        </>
      }
      details={<StaffDetails />}
    >
      <StaffGrid />
    </SectionShell>
  );
}
