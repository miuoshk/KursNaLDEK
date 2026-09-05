export const BATCH_LIMIT = 50;
export const ALLOWED_SOURCES = ["parser", "converter", "writer", "manual"];

export function parseJsonl(text) {
  const items = [];
  const lines = String(text).split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (!line || line.startsWith("#")) continue;
    try {
      items.push(JSON.parse(line));
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      throw new Error(`JSONL linia ${index + 1}: ${reason}`);
    }
  }
  return items;
}

export function chunkItems(items, size = BATCH_LIMIT) {
  if (!Array.isArray(items)) {
    throw new Error("batch must be an array");
  }
  if (!Number.isInteger(size) || size < 1) {
    throw new Error("chunk size must be a positive integer");
  }
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

export function formatApplyReport({
  generatedAt,
  source,
  dryRun,
  file,
  results,
  chunkCount,
}) {
  const applied = results.filter((row) => row.status === "applied").length;
  const previewed = results.filter((row) => row.status === "preview").length;
  const rejected = results.filter((row) => row.status === "rejected").length;
  const lines = [
    `# apply-blocks ${generatedAt}`,
    "",
    `file: ${file}`,
    `source: ${source}`,
    `dry_run: ${dryRun}`,
    `chunks: ${chunkCount}`,
    `total: ${results.length}`,
    `applied: ${applied}`,
    `previewed: ${previewed}`,
    `rejected: ${rejected}`,
    "",
    "## results",
    "",
    "| id | status | reason | render_length |",
    "| --- | --- | --- | --- |",
  ];
  for (const row of results) {
    lines.push(
      `| ${row.id ?? ""} | ${row.status} | ${row.reason ?? ""} | ${
        row.render_length ?? ""
      } |`,
    );
  }
  lines.push("");
  return `${lines.join("\n")}\n`;
}

const RESULT_ROW_RE =
  /^\|\s*([^|]*?)\s*\|\s*(applied|preview|rejected)\s*\|\s*([^|]*?)\s*\|\s*([^|]*?)\s*\|$/;

export function parseApplyReport(markdown) {
  const results = [];
  for (const line of String(markdown).split(/\r?\n/)) {
    const match = line.match(RESULT_ROW_RE);
    if (!match) continue;
    const id = match[1].trim();
    if (!id || id === "id") continue;
    const renderLengthRaw = match[4].trim();
    results.push({
      id,
      status: match[2],
      reason: match[3].trim() || null,
      render_length: renderLengthRaw ? Number(renderLengthRaw) : null,
    });
  }
  return results;
}

export function idsFromReport(markdown, statuses = ["applied"]) {
  const allowed = new Set(statuses);
  return parseApplyReport(markdown)
    .filter((row) => allowed.has(row.status))
    .map((row) => row.id);
}

export function parseIdsFile(text) {
  return String(text)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));
}

export function createServiceClient(createClient, { projectRef, url, serviceKey }) {
  const resolvedUrl = projectRef
    ? `https://${projectRef}.supabase.co`
    : url;
  if (!resolvedUrl || !serviceKey) {
    throw new Error(
      "Brak SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL lub SUPABASE_SERVICE_ROLE_KEY.",
    );
  }
  return createClient(resolvedUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
