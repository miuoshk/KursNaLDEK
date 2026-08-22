export function slugifyTitle(title: string): string {
  const ascii = title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/ł/g, "l")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return ascii || "test";
}

export function formatExportDate(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function testExportFileNames(title: string, date = new Date()) {
  const slug = slugifyTitle(title);
  const day = formatExportDate(date);
  return {
    test: `test-${slug}-${day}.docx`,
    key: `klucz-${slug}-${day}.docx`,
    explanations: `wyjasnienia-${slug}-${day}.docx`,
    zip: `test-${slug}-${day}.zip`,
    manifest: "manifest.json",
  };
}
