import type { MetadataRoute } from "next";
import { PROJECTS } from "@/lib/projects";
import { pageUrl } from "@/lib/site";

// Static export (GitHub Pages) only writes metadata routes that are static.
export const dynamic = "force-static";

/** Home, its English version and every project page except the hidden easter egg. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: pageUrl("/"), priority: 1 },
    { url: pageUrl("/en"), priority: 0.8 },
    ...PROJECTS.filter((p) => !p.hidden).map((p) => ({
      url: pageUrl(`/projects/${p.slug}`),
      priority: 0.7,
    })),
  ];
}
