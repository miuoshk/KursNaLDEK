import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "Kurs na LDEK — nauka, która dostosowuje się do Ciebie";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const mark = await readFile(join(process.cwd(), "public/img/brand/apple-touch-icon.png"));
  const markSrc = `data:image/png;base64,${mark.toString("base64")}`;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#002A27",
        color: "#E8E0D0",
        padding: "76px 84px",
        fontFamily: "serif",
      }}
    >
      <img src={markSrc} width={72} height={72} alt="" />
      <div style={{ display: "flex", flexDirection: "column", maxWidth: 900 }}>
        <div style={{ width: 84, height: 4, background: "#C9A84C", marginBottom: 32 }} />
        <div style={{ fontSize: 72, lineHeight: 1.06, letterSpacing: "-2px" }}>
          Nauka zaczyna się od dobrego pytania.
        </div>
        <div
          style={{
            marginTop: 30,
            color: "#8B9E8B",
            fontFamily: "sans-serif",
            fontSize: 26,
          }}
        >
          Pytania · inteligentne powtórki · świadomy postęp
        </div>
      </div>
    </div>,
    size,
  );
}
