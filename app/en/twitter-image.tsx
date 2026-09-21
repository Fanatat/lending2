import { ImageResponse } from "next/og";
import { OG_IMAGE_SIZE, OgImageCard } from "@/lib/ogImage";

export const runtime = "edge";
export const alt = "Hi, I'm Valery — nine autonomous systems, 2,000 RUB/month";
export const size = OG_IMAGE_SIZE;
export const contentType = "image/png";

export default function TwitterImage() {
  return new ImageResponse(<OgImageCard />, { ...size });
}
