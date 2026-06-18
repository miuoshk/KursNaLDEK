import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

/** remark/rehype stack: GFM + inline/block LaTeX via KaTeX. */
export const remarkPlugins = [remarkGfm, remarkMath] as const;
export const rehypePlugins = [rehypeKatex] as const;
