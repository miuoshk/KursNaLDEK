/**
 * Import arkusza CEM do poczekalni (INBOX--{subject_id}).
 *
 *   node scripts/import-cem-sheet.mjs arkusz.json
 *
 * JSON:
 * {
 *   "cem_session_id": "ldew-2023-jesien",
 *   "short_code": "d23j",
 *   "subject_id": "ldew-periodontologia",
 *   "questions": [
 *     { "number": 1, "text": "...", "options": {"a":"...","b":"...","c":"...","d":"...","e":"..."},
 *       "correct_option_id": "a", "explanation": "..." }
 *   ]
 * }
 *
 * Nie wstawia reserve_bucket. Wymaga poczekalni i wiersza w cem_sessions.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
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

loadEnvLocal();
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Brak NEXT_PUBLIC_SUPABASE_URL lub SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const file = process.argv[2];
if (!file) {
  console.error("Użycie: node scripts/import-cem-sheet.mjs arkusz.json");
  process.exit(1);
}

const payload = JSON.parse(readFileSync(resolve(file), "utf8"));
const cem_session_id = payload.cem_session_id;
const short_code = payload.short_code;
const subject_id = payload.subject_id;
const questions = payload.questions ?? payload;
if (!cem_session_id || !short_code || !subject_id || !Array.isArray(questions)) {
  console.error("JSON: cem_session_id, short_code, subject_id, questions[]");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });
const { data, error } = await supabase.rpc("import_cem_sheet", {
  p_cem_session_id: cem_session_id,
  p_short_code: short_code,
  p_subject_id: subject_id,
  p_items: questions,
});
if (error) {
  console.error(error.message);
  process.exit(1);
}
console.log(JSON.stringify(data, null, 2));
