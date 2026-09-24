import { ImageResponse } from "next/og";
import { OG_IMAGE_SIZE, OgImageCard } from "@/lib/ogImage";

// A plain route named og.png rather than an opengraph-image file: static
// export writes metadata images without an extension, and GitHub Pages would
// then serve the preview as application/octet-stream.
export const dynamic = "force-static";

export function GET() {
  return new ImageResponse(<OgImageCard />, { ...OG_IMAGE_SIZE });
}
