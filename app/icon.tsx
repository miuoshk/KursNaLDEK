import { ImageResponse } from "next/og";

export const size = {
  width: 32,
  height: 32,
};
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
        borderRadius: 8,
        background: "#002A27",
        color: "#C9A84C",
        border: "1px solid #367368",
        fontSize: 18,
        fontFamily: "serif",
      }}
    >
      L
    </div>,
    size,
  );
}
