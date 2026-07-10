import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "LifeGrid",
    short_name: "LifeGrid",
    description: "A calm, focused command center for meaningful life plans.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#020617",
    theme_color: "#020617",
    categories: ["productivity", "lifestyle"],
    icons: [
      {
        src: "/icons/lifegrid-icon.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "any"
      },
      {
        src: "/icons/lifegrid-maskable.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "maskable"
      },
      {
        src: "/icons/apple-touch-icon.svg",
        sizes: "180x180",
        type: "image/svg+xml",
        purpose: "any"
      }
    ],
    shortcuts: [
      {
        name: "Plans",
        short_name: "Plans",
        description: "Open active LifeGrid plans.",
        url: "/goals",
        icons: [{ src: "/icons/lifegrid-icon.svg", sizes: "512x512" }]
      },
      {
        name: "Weekly Check-in",
        short_name: "Check-in",
        description: "Open the weekly check-in.",
        url: "/weekly-review",
        icons: [{ src: "/icons/lifegrid-icon.svg", sizes: "512x512" }]
      },
      {
        name: "Updates",
        short_name: "Updates",
        description: "Open LifeGrid notifications.",
        url: "/notifications",
        icons: [{ src: "/icons/lifegrid-icon.svg", sizes: "512x512" }]
      }
    ]
  };
}
