import { ImageResponse } from "next/og";
import { OG_IMAGE_SIZE, OgImageCard } from "@/lib/ogImage";

export const runtime = "edge";
export const alt = "Привет от Валеры — девять автономных систем, 2 000 ₽/мес";
export const size = OG_IMAGE_SIZE;
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(<OgImageCard />, { ...size });
}
