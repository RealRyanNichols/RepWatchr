import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RepWatchr - Find, Grade, Source, Share",
    short_name: "RepWatchr",
    description:
      "Political attention feed, public accountability profiles, school-board rosters, voting records, source intake, and citizen grading.",
    start_url: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#bf0d3e",
    icons: [
      {
        src: "/icon.png",
        sizes: "1254x1254",
        type: "image/png",
      },
      {
        src: "/apple-icon.png",
        sizes: "1254x1254",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
