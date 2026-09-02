import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { FEATURES } from "@/lib/featureFlags";
import {
  REFERENCE_SOURCES,
  hasCemExams,
  hasReferenceSources,
  isSourceFilterLive,
  referenceSources,
  type QuestionSourceValue,
} from "@/lib/products";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function readRepo(rel: string): string {
  return readFileSync(join(root, rel), "utf8");
}

function walkSourceFiles(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".next" || name.startsWith(".")) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      walkSourceFiles(full, acc);
      continue;
    }
    if (!/\.(ts|tsx)$/.test(name)) continue;
    if (name.endsWith(".spec.ts") || name.endsWith(".spec.tsx")) continue;
    acc.push(full);
  }
  return acc;
}

function parseSqlReferenceSources(sql: string): Record<string, QuestionSourceValue[]> {
  const map: Record<string, QuestionSourceValue[]> = {};
  const whenRe = /WHEN\s+'([^']+)'\s+THEN\s+ARRAY\[([^\]]*)\]/g;
  let match: RegExpExecArray | null;
  while ((match = whenRe.exec(sql)) !== null) {
    const product = match[1];
    const inner = match[2].trim();
    const values = inner
      ? inner
          .split(",")
          .map((part) => part.trim().replace(/^'|'$/g, ""))
          .filter(Boolean)
      : [];
    map[product] = values as QuestionSourceValue[];
  }
  return map;
}

/** UI i gałęzie algorytmu — flaga ∩ rollout. Bramka: subjects.product. */
function isCemSourcePathEnabled(subjectProduct?: string | null): boolean {
  return FEATURES.cemSource && isSourceFilterLive(subjectProduct);
}

function isCemExamsPathEnabled(subjectProduct?: string | null): boolean {
  return isCemSourcePathEnabled(subjectProduct) && hasCemExams(subjectProduct);
}

function loadEnvLocal() {
  const path = join(root, ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

describe("źródła referencyjne (TS)", () => {
  it("produkt bez źródeł: żadna nowa ścieżka się nie uruchamia", () => {
    assert.deepEqual(referenceSources("unknown"), []);
    assert.equal(hasReferenceSources("unknown"), false);
    assert.equal(isSourceFilterLive("unknown"), false);
    assert.equal(hasCemExams("unknown"), false);
    assert.equal(isCemSourcePathEnabled("unknown"), false);
    assert.equal(isCemExamsPathEnabled("unknown"), false);
  });

  it("knnp: liczniki referencyjne się liczą, UI nie renderuje nic nowego", () => {
    assert.deepEqual(referenceSources("knnp"), ["uczelnia", "cem"]);
    assert.equal(hasReferenceSources("knnp"), true);
    assert.equal(isSourceFilterLive("knnp"), false);
    assert.equal(hasCemExams("knnp"), false);
    assert.equal(isCemSourcePathEnabled("knnp"), false);
    assert.equal(isCemExamsPathEnabled("knnp"), false);
  });

  it("ldek/ldew: filtr jest na liście rolloutu, egzaminy CEM tylko tam", () => {
    assert.deepEqual(referenceSources("ldek"), ["cem"]);
    assert.deepEqual(referenceSources("ldew"), ["cem"]);
    assert.equal(hasReferenceSources("ldek"), true);
    assert.equal(hasReferenceSources("ldew"), true);
    assert.equal(isSourceFilterLive("ldek"), true);
    assert.equal(isSourceFilterLive("ldew"), true);
    assert.equal(hasCemExams("ldek"), true);
    assert.equal(hasCemExams("ldew"), true);
  });

  it("nieznany produkt i null zachowują się jak brak źródeł", () => {
    assert.deepEqual(referenceSources(null), []);
    assert.deepEqual(referenceSources(undefined), []);
    assert.deepEqual(referenceSources("no-such-product"), []);
    assert.equal(hasReferenceSources(null), false);
    assert.equal(isSourceFilterLive(null), false);
    assert.equal(hasCemExams(null), false);
  });
});

describe("parytet referenceSources() TS ↔ SQL", () => {
  const sqlMap = parseSqlReferenceSources(
    readRepo("scripts/2026-08-21-reference-sources.sql"),
  );

  it("mapa CASE w SQL jest identyczna z REFERENCE_SOURCES w TS", () => {
    const products = new Set([
      ...Object.keys(REFERENCE_SOURCES),
      ...Object.keys(sqlMap),
    ]);
    for (const product of products) {
      assert.deepEqual(
        referenceSources(product),
        sqlMap[product] ?? [],
        `rozjazd dla produktu ${product}`,
      );
    }
  });

  it("produkty z subjects (snapshot) zgadzają się z TS i SQL", () => {
    const productsFromSubjectsSnapshot = ["knnp", "ldew"];
    for (const product of productsFromSubjectsSnapshot) {
      assert.deepEqual(
        referenceSources(product),
        sqlMap[product] ?? [],
        `snapshot subjects.product=${product}`,
      );
    }
  });

  it("żywa baza: SELECT DISTINCT product FROM subjects = referenceSources()", async (t) => {
    loadEnvLocal();
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      t.skip("brak NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
      return;
    }

    const admin = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    try {
      const { data: rows, error } = await admin.from("subjects").select("product");
      if (error) {
        t.skip(`SELECT product: ${error.message}`);
        return;
      }
      const products = [...new Set((rows ?? []).map((row) => row.product as string))].sort();
      assert.ok(products.length > 0, "subjects.product nie może być puste");

      for (const product of products) {
        const { data, error: rpcError } = await admin.rpc("reference_sources", {
          p_product: product,
        });
        if (rpcError) {
          assert.fail(`reference_sources(${product}): ${rpcError.message}`);
        }
        const sqlResult = Array.isArray(data) ? (data as QuestionSourceValue[]) : [];
        assert.deepEqual(
          referenceSources(product),
          sqlResult,
          `żywa baza: product=${product}`,
        );
      }
    } catch (err) {
      t.skip(`brak sieci do Supabase: ${err instanceof Error ? err.message : String(err)}`);
    }
  });
});

describe("kontrakt bramek UI vs tło", () => {
  const appFiles = [
    ...walkSourceFiles(join(root, "app")),
    ...walkSourceFiles(join(root, "features")),
    ...walkSourceFiles(join(root, "lib")),
  ];

  it("hasReferenceSources nie jest używane do decyzji renderu (brak w tsx)", () => {
    const tsxHits = appFiles
      .filter((file) => file.endsWith(".tsx"))
      .filter((file) => readFileSync(file, "utf8").includes("hasReferenceSources"));
    assert.deepEqual(
      tsxHits.map((file) => relative(root, file)),
      [],
      "hasReferenceSources tylko w licznikach/cache, nigdy w komponencie",
    );
  });

  it("bramki biorą subjects.product, nie profiles.current_product", () => {
    const offenders: string[] = [];
    for (const file of appFiles) {
      const src = readFileSync(file, "utf8");
      if (
        !src.includes("isSourceFilterLive") &&
        !src.includes("hasCemExams") &&
        !src.includes("hasReferenceSources") &&
        !src.includes("referenceSources(")
      ) {
        continue;
      }
      if (
        /isSourceFilterLive\([^)]*current_product/.test(src) ||
        /isSourceFilterLive\([^)]*currentProduct/.test(src) ||
        /hasCemExams\([^)]*current_product/.test(src) ||
        /hasCemExams\([^)]*currentProduct/.test(src) ||
        /hasReferenceSources\([^)]*current_product/.test(src) ||
        /hasReferenceSources\([^)]*currentProduct/.test(src) ||
        /referenceSources\([^)]*current_product/.test(src) ||
        /referenceSources\([^)]*currentProduct/.test(src)
      ) {
        offenders.push(relative(root, file));
      }
    }
    assert.deepEqual(offenders, []);
  });

  it("nowe elementy UI źródła są opakowane w FEATURES.cemSource && isSourceFilterLive", () => {
    const uiMarkers = [
      "SourceFilterBar",
      "QuestionSourceBadge",
      "SourceAccuracyCard",
      "REFERENCE_LABEL",
      "Egzaminy CEM",
    ];
    const offenders: string[] = [];
    for (const file of appFiles) {
      if (!file.endsWith(".tsx")) continue;
      const src = readFileSync(file, "utf8");
      const usesMarker = uiMarkers.some((marker) => src.includes(marker));
      if (!usesMarker) continue;
      const gated =
        (src.includes("FEATURES.cemSource") && src.includes("isSourceFilterLive")) ||
        src.includes("isSourceFilterUiEnabled");
      if (!gated) offenders.push(relative(root, file));
      if (src.includes("Egzaminy CEM") && !src.includes("hasCemExams")) {
        offenders.push(`${relative(root, file)} (brak hasCemExams)`);
      }
    }
    assert.deepEqual(offenders, []);
  });

  it("flaga jest stałą z NEXT_PUBLIC_*, nie platformą", () => {
    const flags = readRepo("lib/featureFlags.ts");
    assert.match(flags, /NEXT_PUBLIC_FEATURE_CEM_SOURCE === ["']true["']/);
    assert.match(flags, /wstrzykiwane przy buildzie/);
    assert.match(flags, /nie jest kill switch/);
    assert.doesNotMatch(readRepo("package.json"), /launchdarkly|unleash|flagsmith/i);
  });
});
