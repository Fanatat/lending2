import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PROJECTS, getProjectMeta, getProjectNeighbours } from "@/lib/projects";
import { SYSTEM_COPY } from "@/lib/systemCopy";
import ProjectShell from "@/components/projects/ProjectShell";
import ProjectWidget from "@/components/projects/ProjectWidget";
import ProjectFlow from "@/components/projects/ProjectFlow";
import StaffDetails from "@/components/sections/staff/StaffDetails";

export function generateStaticParams() {
  return PROJECTS.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const meta = getProjectMeta(params.slug);
  if (!meta) return { title: "Проект" };
  const copy = SYSTEM_COPY[meta.system];
  return {
    title: meta.title,
    description: "details" in copy ? copy.details : copy.title,
    // The bridge is an easter egg on the dashboard; keep its page out of search.
    robots: meta.hidden ? { index: false } : undefined,
  };
}

export default function ProjectPage({ params }: { params: { slug: string } }) {
  const meta = getProjectMeta(params.slug);
  if (!meta) notFound();

  const copy = SYSTEM_COPY[meta.system];
  const { prev, next } = getProjectNeighbours(meta.slug);

  return (
    <ProjectShell
      meta={meta}
      number={copy.number}
      lead={copy.title}
      details={"details" in copy ? copy.details : <StaffDetails />}
      prev={prev}
      next={next}
      widget={<ProjectWidget system={meta.system} />}
      flow={<ProjectFlow lanes={meta.flow} rules={meta.rules} />}
    />
  );
}
