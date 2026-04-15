import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GripHook",
    short_name: "GripHook",
    description: "Personal finance tracking with bucket-first organization and optional shared buckets.",
    start_url: "/app",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#0f172a",
    lang: "en",
    icons: [
      {
        src: "/icon",
        type: "image/png",
        sizes: "192x192",
        purpose: "any",
      },
      {
        src: "/apple-icon",
        type: "image/png",
        sizes: "180x180",
        purpose: "any",
      },
    ],
  };
}
