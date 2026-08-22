export type DocxImageType = "jpg" | "png" | "gif" | "bmp";

export type EmbeddedImage = {
  data: Buffer;
  type: DocxImageType;
  width: number;
  height: number;
};

const MAX_WIDTH_PX = 500;

function readU32BE(buf: Buffer, offset: number): number {
  return buf.readUInt32BE(offset);
}

function readU16LE(buf: Buffer, offset: number): number {
  return buf.readUInt16LE(offset);
}

function readU16BE(buf: Buffer, offset: number): number {
  return buf.readUInt16BE(offset);
}

export function sniffImageType(
  buf: Buffer,
  contentType?: string | null,
): DocxImageType | null {
  const ct = (contentType ?? "").toLowerCase();
  if (ct.includes("png")) return "png";
  if (ct.includes("jpeg") || ct.includes("jpg")) return "jpg";
  if (ct.includes("gif")) return "gif";
  if (ct.includes("bmp")) return "bmp";
  if (buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50) return "png";
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8) return "jpg";
  if (buf.length >= 3 && buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) {
    return "gif";
  }
  if (buf.length >= 2 && buf[0] === 0x42 && buf[1] === 0x4d) return "bmp";
  return null;
}

export function readImageSize(
  buf: Buffer,
  type: DocxImageType,
): { width: number; height: number } | null {
  try {
    if (type === "png" && buf.length >= 24) {
      return { width: readU32BE(buf, 16), height: readU32BE(buf, 20) };
    }
    if (type === "gif" && buf.length >= 10) {
      return { width: readU16LE(buf, 6), height: readU16LE(buf, 8) };
    }
    if (type === "bmp" && buf.length >= 26) {
      return { width: buf.readInt32LE(18), height: Math.abs(buf.readInt32LE(22)) };
    }
    if (type === "jpg") {
      let offset = 2;
      while (offset + 9 < buf.length) {
        if (buf[offset] !== 0xff) break;
        const marker = buf[offset + 1];
        const size = readU16BE(buf, offset + 2);
        if (
          marker === 0xc0 ||
          marker === 0xc1 ||
          marker === 0xc2 ||
          marker === 0xc3
        ) {
          return {
            height: readU16BE(buf, offset + 5),
            width: readU16BE(buf, offset + 7),
          };
        }
        offset += 2 + size;
      }
    }
  } catch {
    return null;
  }
  return null;
}

export function fitImageSize(
  width: number,
  height: number,
  maxWidth = MAX_WIDTH_PX,
): { width: number; height: number } {
  const w = width > 0 ? width : maxWidth;
  const h = height > 0 ? height : Math.round(maxWidth * 0.66);
  if (w <= maxWidth) return { width: w, height: h };
  const scale = maxWidth / w;
  return {
    width: Math.round(w * scale),
    height: Math.round(h * scale),
  };
}
