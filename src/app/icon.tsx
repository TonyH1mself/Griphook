import { ImageResponse } from "next/og";

export const runtime = "edge";

export const size = { width: 512, height: 512 };

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0f172a",
        color: "#f8fafc",
        fontSize: 180,
        fontWeight: 700,
        letterSpacing: "-0.05em",
      }}
    >
      GH
    </div>,
    { ...size },
  );
}
