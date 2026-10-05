import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Zynex CRM",
    short_name: "Zynex CRM",
    description: "Bandeja compartida de WhatsApp de Zynex CRM.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#0b1020",
    theme_color: "#3D5BFF",
    lang: "es-DO",
    icons: [
      {
        src: "/zynex-pwa-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
