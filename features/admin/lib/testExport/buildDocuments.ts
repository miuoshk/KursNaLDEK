import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  ImageRun,
  Packer,
  PageNumber,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  convertMillimetersToTwip,
} from "docx";
import type { EmbeddedImage } from "@/features/admin/lib/testExport/imageMeta";
import { splitQuestionStem } from "@/features/admin/lib/testExport/splitQuestionStem";
import { parseRichSpans } from "@/features/admin/lib/testExport/stripRichText";
import type { SelectedTestQuestion } from "@/features/admin/lib/testExport/types";

const FONT = "Times New Roman";

const PAGE_W = convertMillimetersToTwip(210);
const PAGE_H = convertMillimetersToTwip(297);
const MARGIN = convertMillimetersToTwip(20);
const CONTENT_TWIPS = PAGE_W - MARGIN * 2;

const LIGHT_BORDER = {
  style: BorderStyle.SINGLE,
  size: 4,
  color: "CCCCCC",
};

export type TestDocumentMeta = {
  title: string;
  subtitle?: string;
  generatedAt: Date;
  questionCount: number;
};

export type QuestionImageMap = Map<string, EmbeddedImage | "missing">;

function formatDatePl(date: Date): string {
  return date.toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function optionLetter(id: string): string {
  return /^[a-z]$/i.test(id) ? id.toUpperCase() : id;
}

function sortedOptions(options: { id: string; text: string }[]) {
  return [...options].sort((a, b) => a.id.localeCompare(b.id));
}

function spansToRuns(
  text: string,
  extras?: { bold?: boolean; size?: number; italics?: boolean; color?: string },
): TextRun[] {
  return parseRichSpans(text).map(
    (span) =>
      new TextRun({
        text: span.text,
        font: FONT,
        size: extras?.size ?? 22,
        bold: extras?.bold || span.bold,
        italics: extras?.italics,
        color: extras?.color,
      }),
  );
}

function pageProperties() {
  return {
    page: {
      size: { width: PAGE_W, height: PAGE_H },
      margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN },
    },
  };
}

function header(meta: TestDocumentMeta, kind: "test" | "key" | "explanations") {
  const kindLabel =
    kind === "test"
      ? "Arkusz"
      : kind === "key"
        ? "Klucz odpowiedzi"
        : "Wyjaśnienia";
  return new Header({
    children: [
      new Paragraph({
        spacing: { after: 40 },
        children: [
          new TextRun({
            text: meta.title,
            font: FONT,
            size: 22,
            bold: true,
          }),
          new TextRun({
            text: `  ·  ${kindLabel}`,
            font: FONT,
            size: 20,
            color: "666666",
          }),
        ],
      }),
      new Paragraph({
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 6, color: "C9A84C", space: 4 },
        },
        spacing: { after: 120 },
        children: [
          new TextRun({
            text: "Kurs na LDEK",
            font: FONT,
            size: 18,
            color: "666666",
          }),
          new TextRun({
            text: `  ·  ${formatDatePl(meta.generatedAt)}  ·  Liczba pytań: ${meta.questionCount}`,
            font: FONT,
            size: 18,
            color: "666666",
          }),
        ],
      }),
    ],
  });
}

function footer() {
  return new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [
          new TextRun({ text: "Strona ", font: FONT, size: 16, color: "888888" }),
          new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 16, color: "888888" }),
          new TextRun({ text: " z ", font: FONT, size: 16, color: "888888" }),
          new TextRun({
            children: [PageNumber.TOTAL_PAGES],
            font: FONT,
            size: 16,
            color: "888888",
          }),
        ],
      }),
    ],
  });
}

function titleBlock(meta: TestDocumentMeta, heading: string) {
  const children: Paragraph[] = [
    new Paragraph({
      spacing: { after: 80 },
      children: [
        new TextRun({
          text: heading,
          font: FONT,
          size: 32,
          bold: true,
        }),
      ],
    }),
  ];
  if (meta.subtitle?.trim()) {
    children.push(
      new Paragraph({
        spacing: { after: 80 },
        children: [
          new TextRun({
            text: meta.subtitle.trim(),
            font: FONT,
            size: 22,
            italics: true,
            color: "444444",
          }),
        ],
      }),
    );
  }
  children.push(
    new Paragraph({
      spacing: { after: 280 },
      children: [
        new TextRun({
          text: `${meta.questionCount} pytań  ·  ${formatDatePl(meta.generatedAt)}`,
          font: FONT,
          size: 20,
          color: "555555",
        }),
      ],
    }),
  );
  return children;
}

function questionParagraphs(
  question: SelectedTestQuestion,
  images: QuestionImageMap | undefined,
): Paragraph[] {
  const blocks = splitQuestionStem(question.text);
  const out: Paragraph[] = [];
  let started = false;

  for (let i = 0; i < blocks.length; i += 1) {
    const block = blocks[i]!;
    const next = blocks[i + 1];
    const isFirst = !started;
    started = true;

    if (block.kind === "para") {
      const beforeList = next?.kind === "item";
      out.push(
        new Paragraph({
          spacing: { before: isFirst ? 160 : 80, after: 80 },
          children: [
            ...(isFirst
              ? [
                  new TextRun({
                    text: `${question.number}. `,
                    font: FONT,
                    size: 24,
                    bold: true,
                  }),
                ]
              : []),
            ...spansToRuns(block.text, { size: 24 }),
          ],
        }),
      );
      if (beforeList) {
        out.push(new Paragraph({ spacing: { after: 80 }, children: [] }));
      }
      continue;
    }

    out.push(
      new Paragraph({
        spacing: { before: isFirst ? 160 : 0, after: 60 },
        indent: { left: convertMillimetersToTwip(8), hanging: convertMillimetersToTwip(8) },
        children: [
          ...(isFirst
            ? [
                new TextRun({
                  text: `${question.number}. `,
                  font: FONT,
                  size: 24,
                  bold: true,
                }),
              ]
            : []),
          new TextRun({
            text: `${block.marker}  `,
            font: FONT,
            size: 24,
            bold: true,
          }),
          ...spansToRuns(block.text, { size: 24 }),
        ],
      }),
    );
  }

  if (out.length === 0) {
    out.push(
      new Paragraph({
        spacing: { before: 160, after: 80 },
        children: [
          new TextRun({
            text: `${question.number}. `,
            font: FONT,
            size: 24,
            bold: true,
          }),
        ],
      }),
    );
  }

  const image = images?.get(question.id);
  if (image === "missing") {
    out.push(
      new Paragraph({
        spacing: { after: 80 },
        indent: { left: convertMillimetersToTwip(8) },
        children: [
          new TextRun({
            text: "[Rycina niedostępna]",
            font: FONT,
            size: 20,
            italics: true,
            color: "888888",
          }),
        ],
      }),
    );
  } else if (image) {
    out.push(
      new Paragraph({
        spacing: { after: 80 },
        children: [
          new ImageRun({
            type: image.type,
            data: image.data,
            transformation: { width: image.width, height: image.height },
            altText: {
              name: `Rycina ${question.number}`,
              title: "Rycina",
              description: `Rycina do pytania ${question.number}`,
            },
          }),
        ],
      }),
    );
  }

  for (const opt of sortedOptions(question.options)) {
    out.push(
      new Paragraph({
        spacing: { after: 40 },
        indent: { left: convertMillimetersToTwip(8), hanging: convertMillimetersToTwip(7) },
        children: [
          new TextRun({
            text: `${optionLetter(opt.id)}.  `,
            font: FONT,
            size: 22,
            bold: true,
          }),
          ...spansToRuns(opt.text, { size: 22 }),
        ],
      }),
    );
  }
  return out;
}

function keyTable(questions: SelectedTestQuestion[], columns = 5): Table {
  const cells = questions.map(
    (q) => `${q.number}. ${optionLetter(q.correctOptionId)}`,
  );
  while (cells.length % columns !== 0) cells.push("");
  const rows: TableRow[] = [];
  for (let i = 0; i < cells.length; i += columns) {
    rows.push(
      new TableRow({
        children: cells.slice(i, i + columns).map(
          (label) =>
            new TableCell({
              width: { size: Math.floor(CONTENT_TWIPS / columns), type: WidthType.DXA },
              borders: {
                top: LIGHT_BORDER,
                bottom: LIGHT_BORDER,
                left: LIGHT_BORDER,
                right: LIGHT_BORDER,
              },
              margins: { top: 40, bottom: 40, left: 60, right: 60 },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: label,
                      font: FONT,
                      size: 22,
                    }),
                  ],
                }),
              ],
            }),
        ),
      }),
    );
  }
  return new Table({
    width: { size: CONTENT_TWIPS, type: WidthType.DXA },
    columnWidths: Array.from({ length: columns }, () =>
      Math.floor(CONTENT_TWIPS / columns),
    ),
    rows,
  });
}

function emptyDocDefaults() {
  return {
    styles: {
      default: {
        document: {
          run: { font: FONT, size: 22 },
        },
      },
    },
  };
}

export async function buildTestDocument(input: {
  questions: SelectedTestQuestion[];
  meta: TestDocumentMeta;
  includeKeyAtEnd: boolean;
  images?: QuestionImageMap;
}): Promise<Buffer> {
  const children: (Paragraph | Table)[] = [
    ...titleBlock(input.meta, input.meta.title),
  ];
  for (const question of input.questions) {
    children.push(...questionParagraphs(question, input.images));
  }
  if (input.includeKeyAtEnd && input.questions.length > 0) {
    children.push(
      new Paragraph({
        pageBreakBefore: true,
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: "Klucz odpowiedzi",
            font: FONT,
            size: 28,
            bold: true,
          }),
        ],
      }),
    );
    children.push(keyTable(input.questions));
  }

  const doc = new Document({
    ...emptyDocDefaults(),
    sections: [
      {
        properties: pageProperties(),
        headers: { default: header(input.meta, "test") },
        footers: { default: footer() },
        children,
      },
    ],
  });
  return Buffer.from(await Packer.toBuffer(doc));
}

export async function buildKeyDocument(input: {
  questions: SelectedTestQuestion[];
  meta: TestDocumentMeta;
}): Promise<Buffer> {
  const doc = new Document({
    ...emptyDocDefaults(),
    sections: [
      {
        properties: pageProperties(),
        headers: { default: header(input.meta, "key") },
        footers: { default: footer() },
        children: [
          ...titleBlock(input.meta, "Klucz odpowiedzi"),
          keyTable(input.questions),
        ],
      },
    ],
  });
  return Buffer.from(await Packer.toBuffer(doc));
}

export async function buildExplanationsDocument(input: {
  questions: SelectedTestQuestion[];
  meta: TestDocumentMeta;
}): Promise<Buffer> {
  const children: (Paragraph | Table)[] = [
    ...titleBlock(input.meta, "Wyjaśnienia"),
  ];

  for (const question of input.questions) {
    children.push(
      new Paragraph({
        spacing: { before: 200, after: 60 },
        children: [
          new TextRun({
            text: `${question.number}. ${optionLetter(question.correctOptionId)}`,
            font: FONT,
            size: 24,
            bold: true,
          }),
          new TextRun({
            text: `   ${question.id}`,
            font: FONT,
            size: 16,
            color: "888888",
          }),
        ],
      }),
    );
    const stemBlocks = splitQuestionStem(question.text);
    for (let i = 0; i < stemBlocks.length; i += 1) {
      const block = stemBlocks[i]!;
      const beforeList = stemBlocks[i + 1]?.kind === "item";
      if (block.kind === "para") {
        children.push(
          new Paragraph({
            spacing: { after: beforeList ? 160 : 40 },
            children: spansToRuns(block.text, { size: 20, italics: true, color: "444444" }),
          }),
        );
        continue;
      }
      children.push(
        new Paragraph({
          spacing: { after: 40 },
          indent: { left: convertMillimetersToTwip(8), hanging: convertMillimetersToTwip(8) },
          children: [
            new TextRun({
              text: `${block.marker}  `,
              font: FONT,
              size: 20,
              bold: true,
              italics: true,
              color: "444444",
            }),
            ...spansToRuns(block.text, { size: 20, italics: true, color: "444444" }),
          ],
        }),
      );
    }
    children.push(
      new Paragraph({
        spacing: { after: 80 },
        children: spansToRuns(question.explanation, { size: 22 }),
      }),
    );
  }

  const doc = new Document({
    ...emptyDocDefaults(),
    sections: [
      {
        properties: pageProperties(),
        headers: { default: header(input.meta, "explanations") },
        footers: { default: footer() },
        children,
      },
    ],
  });
  return Buffer.from(await Packer.toBuffer(doc));
}
