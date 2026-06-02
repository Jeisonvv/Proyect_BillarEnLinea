import { ImageResponse } from "next/og";
import { socialImageDimensions } from "@/lib/site";

export const runtime = "edge";

const FALLBACK_BACKGROUND = "linear-gradient(135deg, #081917 0%, #10211f 40%, #d59656 100%)";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const src = searchParams.get("src")?.trim();

  if (!src) {
    return new Response("Missing src parameter", { status: 400 });
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          background: FALLBACK_BACKGROUND,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 14% 20%, rgba(255,255,255,0.1), transparent 24%), radial-gradient(circle at 82% 18%, rgba(216,154,91,0.22), transparent 28%), linear-gradient(180deg, rgba(3,8,10,0.08), rgba(3,8,10,0.32))",
          }}
        />
        {/* next/image is not supported inside ImageResponse rendering. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt="Social share image"
          width={socialImageDimensions.width}
          height={socialImageDimensions.height}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
          }}
        />
      </div>
    ),
    {
      width: socialImageDimensions.width,
      height: socialImageDimensions.height,
    },
  );
}