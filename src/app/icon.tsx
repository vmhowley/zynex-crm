import { ImageResponse } from "next/og";

// Replaces the default Next.js favicon with the Zynex CRM brand mark —
// Zynex indigo rounded square + white "Z" glyph. Matches the sidebar
// logo in `src/components/layout/sidebar.tsx`. Next.js renders this at
// build time and auto-injects <link rel="icon"> into <head>.
//
// This route takes precedence over src/app/favicon.ico, which is the
// Next.js default and can stay on disk harmlessly (or be removed).

export const runtime = "edge";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#3D5BFF",
          borderRadius: 6,
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#ffffff"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 5h16L4 19h16" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
