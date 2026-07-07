import type { MetadataRoute } from "next";

type RepWatchrManifest = MetadataRoute.Manifest & {
  share_target?: {
    action: string;
    method: "GET" | "POST";
    params: {
      title?: string;
      text?: string;
      url?: string;
    };
  };
};

export default function manifest(): RepWatchrManifest {
  return {
    name: "RepWatchr",
    short_name: "RepWatchr",
    description:
      "Public-record accountability profiles for officials, agencies, boards, and public power.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#06172f",
    theme_color: "#06172f",
    categories: ["news", "productivity", "government"],
    orientation: "portrait-primary",
    icons: [
      {
        src: "/images/repwatchr-logo-america-first.png",
        sizes: "1254x1254",
        type: "image/png",
      },
      {
        src: "/images/repwatchr-logo-america-first.png",
        sizes: "1254x1254",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/images/icon.png",
        sizes: "1254x1254",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Search RepWatchr",
        short_name: "Search",
        description: "Find officials, races, boards, sources, and public records.",
        url: "/search",
        icons: [{ src: "/images/icon.png", sizes: "1254x1254", type: "image/png" }],
      },
      {
        name: "Submit Source",
        short_name: "Source",
        description: "Submit a public source for review.",
        url: "/submit-source",
        icons: [{ src: "/images/icon.png", sizes: "1254x1254", type: "image/png" }],
      },
      {
        name: "Build Source Packet",
        short_name: "Packet",
        description: "Build a source-backed packet.",
        url: "/free-packet",
        icons: [{ src: "/images/icon.png", sizes: "1254x1254", type: "image/png" }],
      },
      {
        name: "Open Dashboard",
        short_name: "Dashboard",
        description: "Open your RepWatchr member dashboard.",
        url: "/dashboard",
        icons: [{ src: "/images/icon.png", sizes: "1254x1254", type: "image/png" }],
      },
    ],
    share_target: {
      action: "/submit-source",
      method: "GET",
      params: {
        title: "title",
        text: "text",
        url: "url",
      },
    },
  };
}
