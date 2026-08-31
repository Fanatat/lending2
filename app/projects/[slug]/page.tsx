import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PROJECTS, getProjectMeta } from "@/lib/projects";
import ProjectShell from "@/components/projects/ProjectShell";
import StaffChatSim from "@/components/projects/StaffChatSim";

export function generateStaticParams() {
  return PROJECTS.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const meta = getProjectMeta(params.slug);
  return { title: meta ? meta.title : "Проект" };
}

export default function ProjectPage({ params }: { params: { slug: string } }) {
  const meta = getProjectMeta(params.slug);
  if (!meta) notFound();

  return (
    <ProjectShell title={meta.title} todo={meta.todo}>
      {meta.slug === "staff" ? (
        <StaffChatSim />
      ) : (
        <p className="text-sm leading-relaxed text-fg-muted">
          Здесь появится полное погружение в проект — материалы, которые
          автор ещё готовит. Пока эта страница подтверждает: маршрут и
          переход-приближение с дашборда работают.
        </p>
      )}
    </ProjectShell>
  );
}
