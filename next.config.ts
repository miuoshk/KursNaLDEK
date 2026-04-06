import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const tailwindPkg = path.join(projectRoot, "node_modules", "tailwindcss");

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
    resolveAlias: {
      tailwindcss: tailwindPkg,
    },
  },
};

export default nextConfig;
