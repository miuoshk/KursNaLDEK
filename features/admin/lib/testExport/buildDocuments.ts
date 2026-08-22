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
import { parseRichSpans } from "@/features/admin/lib/testExport/stripRichText";
import type { SelectedTestQuestion } from "@/features/admin/lib/testExport/types";

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
        font: "Calibri",
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
            font: "Calibri",
            size: 22,
            bold: true,
          }),
          new TextRun({
            text: `  ·  ${kindLabel}`,
            font: "Calibri",
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
            font: "Calibri",
            size: 18,
            color: "666666",
          }),
          new TextRun({
            text: `  ·  ${formatDatePl(meta.generatedAt)}  ·  Liczba pytań: ${meta.questionCount}`,
            font: "Calibri",
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
          new TextRun({ text: "Strona ", font: "Calibri", size: 16, color: "888888" }),
          new TextRun({ children: [PageNumber.CURRENT], font: "Calibri", size: 16, color: "888888" }),
          new TextRun({ text: " z ", font: "Calibri", size: 16, color: "888888" }),
          new TextRun({
            children: [PageNumber.TOTAL_PAGES],
            font: "Calibri",
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
          font: "Calibri",
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
            font: "Calibri",
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
          font: "Calibri",
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
  const out: Paragraph[] = [
    new Paragraph({
      spacing: { before: 160, after: 80 },
      children: [
        new TextRun({
          text: `${question.number}. `,
          font: "Calibri",
          size: 24,
          bold: true,
        }),
        ...spansToRuns(question.text, { size: 24 }),
      ],
    }),
  ];

  const image = images?.get(question.id);
  if (image === "missing") {
    out.push(
      new Paragraph({
        spacing: { after: 80 },
        indent: { left: convertMillimetersToTwip(8) },
        children: [
          new TextRun({
            text: "[Rycina niedostępna]",
            font: "Calibri",
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
            font: "Calibri",
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
                      font: "Calibri",
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
          run: { font: "Calibri", size: 22 },
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
            font: "Calibri",
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
            font: "Calibri",
            size: 24,
            bold: true,
          }),
          new TextRun({
            text: `   ${question.id}`,
            font: "Calibri",
            size: 16,
            color: "888888",
          }),
        ],
      }),
    );
    children.push(
      new Paragraph({
        spacing: { after: 40 },
        children: spansToRuns(question.text, { size: 20, italics: true, color: "444444" }),
      }),
    );
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
