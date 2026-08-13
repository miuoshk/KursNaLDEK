#!/usr/bin/env python3
"""Konwersja HISLEK TXT (format zewnętrzny) → TXT fabryki + SQL histologii KNNP.

Nie pisze SQL-a ręcznie: ten skrypt jest jedynym źródłem INSERT-ów.
"""
from __future__ import annotations

import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(Path.home() / ".codex/skills/ldek-eksport/scripts"))

from batch_parser import LETTER_REF, LETTERS, normalize_quotes, strip_controls  # noqa: E402
from batch_parser import load as load_factory  # noqa: E402
from validate import validate  # noqa: E402

TEMAT_MAP = {n: f"HIST-{n:02d}" for n in range(1, 23)}

BATCH_LABEL = "e_hist_lek_2026/1"
SOURCE_EXAM = "Egzamin histologia LEK SUM 2026 (HISLEK e2026-1)"
HIST_TOPICS = tuple(TEMAT_MAP.values())

# Fałszywy LETTER_REF: „SP-A–SP-D)” łapie się jako „D)”.
EXPL_FIXES = {
    "HISLEK-e2026-1-876": (
        "(głównie fosfatydylocholina z białkami SP-A–SP-D)",
        "— głównie fosfatydylocholina z białkami SP-A, SP-B, SP-C i SP-D —",
    ),
}

COMBO_RE = re.compile(
    r"(?i)\b(?:prawidłowe|prawidłowa|fałszywe|wszystkie odpowiedzi|żadn[ea] z powyższych|"
    r"tylko odpowiedzi|odpowiedzi [A-E])"
)


def parse_source(raw: str) -> list[dict]:
    blocks = [b.strip() for b in re.split(r"^---\s*$", raw, flags=re.MULTILINE) if b.strip()]
    items = []
    for index, block in enumerate(blocks, 1):
        item: dict = {"_index": index, "options": {}}
        for field, key in (
            ("ID", "id"),
            ("NR_LOKALNY", "nr"),
            ("BATCH", "batch"),
            ("KIERUNEK", "track"),
            ("TEMAT_NR", "temat_nr"),
            ("TEMAT", "temat"),
            ("PODTEMAT", "subtheme"),
            ("PYTANIE", "stem"),
            ("POPRAWNA", "key_raw"),
        ):
            match = re.search(rf"^{field}:\s*(.*)$", block, re.MULTILINE)
            item[key] = match.group(1).strip() if match else ""
        for letter in "ABCDE":
            opt = re.search(
                rf"^{letter}:\s*(.+?)(?=\n[A-E]:|\nPOPRAWNA:)",
                block,
                re.MULTILINE | re.DOTALL,
            )
            item["options"][letter.lower()] = " ".join(opt.group(1).split()) if opt else ""
        expl = re.search(r"^WYJAŚNIENIE:\s*\n(.*)\Z", block, re.MULTILINE | re.DOTALL)
        explanation = expl.group(1).strip() if expl else ""
        explanation = re.sub(r"\nFLAGA:.*", "", explanation).strip()
        item["explanation"] = explanation
        if not item["temat_nr"]:
            raise SystemExit(f"blok {index}: brak TEMAT_NR")
        nr = int(item["temat_nr"])
        if nr not in TEMAT_MAP:
            raise SystemExit(f"{item['id']}: nieznany TEMAT_NR {nr}")
        item["topic_id"] = TEMAT_MAP[nr]
        item["key"] = item["key_raw"].lower()
        items.append(item)
    return items


def apply_fixes(items: list[dict]) -> None:
    for item in items:
        pair = EXPL_FIXES.get(item["id"])
        if not pair:
            continue
        old, new = pair
        if old not in item["explanation"]:
            raise SystemExit(f"{item['id']}: nie znaleziono fragmentu do naprawy: {old!r}")
        item["explanation"] = item["explanation"].replace(old, new)


def clean_text(text: str) -> str:
    text = strip_controls(text)
    text = re.sub(r"„([^„”\"]*)\"", r"„\1”", text)
    text = normalize_quotes(text)
    return text.strip()


def subtheme_label(raw: str) -> str:
    text = clean_text(raw)
    if not text:
        return ""
    return text[0].upper() + text[1:]


def to_factory_txt(items: list[dict]) -> str:
    chunks = []
    for item in items:
        lines = [
            f"ID: {item['id']}",
            f"TEMAT: {item['topic_id']}",
            "PYTANIE:",
            item["stem"],
        ]
        for letter in "ABCDE":
            lines.append(f"{letter}. {item['options'][letter.lower()]}")
        lines += [
            f"KLUCZ: {item['key']}",
            "WYJAŚNIENIE:",
            item["explanation"],
        ]
        chunks.append("\n".join(lines))
    return "\n---\n".join(chunks) + "\n"


def sql_escape(text: str) -> str:
    return text.replace("'", "''")


def dollar_quoted(text: str, tag: str = "$E$") -> str:
    if tag in text:
        raise ValueError("kolizja tagu dollar-quotingu")
    return f"{tag}{text}{tag}"


def options_json(options: dict[str, str]) -> str:
    payload = [{"id": letter, "text": clean_text(options[letter])} for letter in LETTERS]
    return json.dumps(payload, ensure_ascii=False)


def to_json_rows(items: list[dict]) -> list[dict]:
    rows = []
    for item in items:
        rows.append(
            {
                "topic_id": item["topic_id"],
                "text": clean_text(item["stem"]),
                "options": [
                    {"id": letter, "text": clean_text(item["options"][letter])}
                    for letter in LETTERS
                ],
                "correct_option_id": item["key"],
                "explanation": clean_text(item["explanation"]),
                "subtheme_label": subtheme_label(item["subtheme"]),
                "source_code": item["id"],
                "batch_label": BATCH_LABEL,
                "source_exam": SOURCE_EXAM,
                "theme_label": "2026",
            }
        )
    return rows


def norm_stem(text: str) -> str:
    return re.sub(r"\s+", " ", text.lower()).strip().rstrip(".:")


def stem_similar(a: str, b: str) -> str | None:
    na, nb = norm_stem(a), norm_stem(b)
    if na == nb:
        return "exact_norm"
    if len(na) >= 12 and len(nb) >= 12:
        if na in nb or nb in na:
            return "substring"
        wa = [w for w in na.split() if len(w) > 3]
        wb = {w for w in nb.split() if len(w) > 3}
        if wa and wb:
            ratio = sum(1 for w in wa if w in wb) / min(len(wa), len(wb))
            if ratio >= 0.85 and abs(len(na) - len(nb)) < 25:
                return "fuzzy"
    return None


def dedup(items: list[dict], db: list[dict]) -> dict:
    by_text: dict[str, list[dict]] = defaultdict(list)
    for row in db:
        by_text[row["text"]].append(row)

    exact, near, fresh = [], [], []
    for item in items:
        hits = by_text.get(item["stem"])
        if hits:
            exact.append(
                {"srccode": item["id"], "topic": item["topic_id"], "text": item["stem"], "matches": hits}
            )
            continue
        best = None
        for row in db:
            sim = stem_similar(item["stem"], row["text"])
            if sim and (best is None or sim == "exact_norm"):
                best = {"sim": sim, "row": row}
                if sim == "exact_norm":
                    break
        if best:
            near.append(
                {
                    "srccode": item["id"],
                    "topic": item["topic_id"],
                    "text": item["stem"],
                    "sim": best["sim"],
                    "match": {
                        "id": best["row"]["id"],
                        "topic_id": best["row"]["topic_id"],
                        "text": best["row"]["text"],
                        "source_code": best["row"].get("source_code"),
                        "batch_label": best["row"].get("batch_label"),
                    },
                }
            )
            continue
        fresh.append(item)
    return {"exact": exact, "near": near, "fresh": fresh}


def build_sql(items: list[dict]) -> str:
    rows = []
    for seq, item in enumerate(items, 1):
        stem = sql_escape(clean_text(item["stem"]))
        opts = sql_escape(options_json(item["options"]))
        expl = dollar_quoted(clean_text(item["explanation"]))
        sub = sql_escape(subtheme_label(item["subtheme"]))
        rows.append(
            f"({seq}, '{item['topic_id']}',\n"
            f"   '{stem}',\n"
            f"   '{opts}'::jsonb,\n"
            f"   '{item['key']}',\n"
            f"   {expl},\n"
            f"   '{sub}', '{item['id']}')"
        )
    topic_list = ", ".join(f"'{t}'" for t in HIST_TOPICS)
    header = f"""-- ============================================================
-- BATCH: {BATCH_LABEL}  ·  subject_id=histologia  ·  SHARED (oba kierunki, tracks=NULL)
-- Źródło: {SOURCE_EXAM}, {len(items)} pytań
-- tracks NULL (histologia wspólna) · source_code = oryginalne HISLEK-e2026-1-NNN
-- Self-numbering id per dział = max seq HIST-NN-NNN z bazy + 1
-- theme_label = 2026 (kafelek wirtualny histologia-THEME-2026)
-- Wygenerowane przez scripts/build-hislek-e2026-1.py (nie edytować ręcznie)
-- ============================================================

WITH new_rows (seq, topic_id, qtext, opts, correct, expl, subtheme, srccode) AS (
 VALUES
"""
    footer = f"""
),
maxes AS (
  SELECT topic_id,
         COALESCE(MAX((regexp_match(id, topic_id || '-([0-9]+)$'))[1]::int), 0) AS mx
    FROM public.questions WHERE topic_id IN ({topic_list}) GROUP BY topic_id
)
INSERT INTO public.questions
  (id, topic_id, text, options, correct_option_id, explanation,
   subtheme_label, source_code, batch_label, source_exam, theme_label)
SELECT
  n.topic_id || '-' || LPAD((COALESCE(m.mx,0) + ROW_NUMBER() OVER (PARTITION BY n.topic_id ORDER BY n.seq))::text, 3, '0'),
  n.topic_id, n.qtext, n.opts, n.correct, n.expl,
  n.subtheme, n.srccode, '{BATCH_LABEL}', '{SOURCE_EXAM}', '2026'
FROM new_rows n LEFT JOIN maxes m ON m.topic_id = n.topic_id;

UPDATE public.topics t SET question_count = sub.cnt
  FROM (SELECT topic_id, COUNT(*) AS cnt FROM public.questions
         WHERE topic_id IN ({topic_list}) AND COALESCE(is_active,true)=true GROUP BY topic_id) sub
 WHERE t.id = sub.topic_id;
"""
    return header + ",\n".join(rows) + footer


def main() -> int:
    src = Path("/Users/miuoshk/Downloads/HISLEK-e2026-1.txt")
    db_path = Path("/tmp/hist-db-stems.json")
    factory_path = ROOT / "exports" / "hislek-e2026-1-factory.txt"
    sql_path = ROOT / "exports" / "histologia-batch-lek-2026-1.sql"
    json_path = ROOT / "exports" / "histologia-batch-lek-2026-1.json"
    audit_path = ROOT / "exports" / "histologia-batch-lek-2026-1-audit.md"

    items = parse_source(src.read_text(encoding="utf-8"))
    apply_fixes(items)

    factory_path.write_text(to_factory_txt(items), encoding="utf-8")
    parsed, parse_errors = load_factory(factory_path)
    result = validate(parsed, parse_errors, None)
    print("WALIDACJA")
    print(f"  pytań: {result['liczba_pytan']}  klucze: {result['rozklad_kluczy']}")
    print(f"  błędy: {len(result['bledy'])}  ostrzeżenia: {len(result['ostrzezenia'])}")
    for msg in result["bledy"]:
        print("  ERR", msg)
    for msg in result["ostrzezenia"][:30]:
        print("  WARN", msg)
    if result["bledy"]:
        leftover = []
        for item in items:
            hit = LETTER_REF.search(item["explanation"])
            if hit:
                leftover.append(f"{item['id']}:{hit.group(0)}")
        if leftover:
            print("LITERY:", leftover)
        return 1

    report = {"exact": [], "near": [], "fresh": items}
    if db_path.exists():
        db = json.loads(db_path.read_text(encoding="utf-8"))
        report = dedup(items, db)
        print("DEDUP vs baza")
        print(f"  exact: {len(report['exact'])}  near: {len(report['near'])}  fresh: {len(report['fresh'])}")
        for row in report["exact"]:
            print("  EXACT", row["srccode"], "→", [m["id"] for m in row["matches"]])
        for row in report["near"]:
            print(f"  NEAR[{row['sim']}] {row['srccode']} ↔ {row['match']['id']} ({row['match']['source_code']})")
            print(f"         batch: {row['text'][:80]}")
            print(f"         db:    {row['match']['text'][:80]}")
    else:
        print("DEDUP: brak /tmp/hist-db-stems.json — pomijam")

    leftover = []
    for item in items:
        if "FLAGA:" in item["explanation"] or "Autor klucza" in item["explanation"]:
            leftover.append(item["id"])
        hit = LETTER_REF.search(item["explanation"])
        if hit:
            leftover.append(f"{item['id']}:{hit.group(0)}")
    if leftover:
        print("ZOSTAŁY META/LITERY:", leftover)
        return 1

    json_path.write_text(
        json.dumps(to_json_rows(items), ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    sql_path.write_text(build_sql(items), encoding="utf-8")
    print(f"SQL: {sql_path} ({sql_path.stat().st_size} bytes)")
    print(f"JSON: {json_path}")

    lines = [
        f"# Audyt batcha {BATCH_LABEL}",
        "",
        f"**Źródło:** `{src}` · **SQL:** `{sql_path.relative_to(ROOT)}` · **TXT fabryki:** `{factory_path.relative_to(ROOT)}`",
        "",
        f"- pytań w pliku: **{len(items)}** (HISLEK-e2026-1-844 … HISLEK-e2026-1-903)",
        f"- exact vs baza: {len(report['exact'])}",
        f"- near vs baza: {len(report['near'])}",
        f"- do wstawienia: **{len(items)}** (cały egzamin, bez wycinania near-dupów)",
        "",
        "## Rozkład tematów",
        "",
        "| topic_id | n |",
        "|---|---:|",
    ]
    for topic, n in sorted(Counter(i["topic_id"] for i in items).items()):
        lines.append(f"| `{topic}` | {n} |")
    lines += ["", "## Near-duplikaty (nie wycięte)", ""]
    if not report["near"] and not report["exact"]:
        lines.append("Brak exact/near względem aktywnej histologii.")
    for row in report["exact"] + report["near"]:
        sim = row.get("sim", "exact")
        match = row.get("match") or (row["matches"][0] if row.get("matches") else {})
        lines.append(
            f"- `{row['srccode']}` [{sim}] `{row['topic']}` ↔ `{match.get('id')}` "
            f"({match.get('source_code')}, {match.get('batch_label')})"
        )
    lines += [
        "",
        "## Uwagi",
        "",
        "- `tracks` NULL = histologia wspólna LEK+STOMA (jak anatomia e2026-1).",
        "- `theme_label = 2026` pod kafelek wirtualny `histologia-THEME-2026`.",
        "- ID: `HIST-NN-NNN` (wielkie litery, jak istniejące pytania histologii).",
        "- Meta-opcje (A, B, C itd.) — frontend sam wyłącza shuffle.",
    ]
    audit_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"AUDIT: {audit_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
