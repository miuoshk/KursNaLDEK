#!/usr/bin/env python3
"""Konwersja HISSTO-e2026-1.txt → JSON/SQL histologii KNNP (tylko stomatologia).

Pytania zostają w HIST-* + theme_label=2026 (kafelek wirtualny już istnieje).
5 opcji A–E. tracks = ['stomatologia']. ID: HIST-NN-NNN.
"""
from __future__ import annotations

import json
import re
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(Path.home() / ".codex/skills/ldek-eksport/scripts"))
from batch_parser import LETTER_REF, LETTERS, normalize_quotes, strip_controls  # noqa: E402

SRC = ROOT / "exports" / "HISSTO-e2026-1.txt"
JSON_PATH = ROOT / "exports" / "histologia-batch-stoma-2026-5.json"
SQL_PATH = ROOT / "exports" / "histologia-batch-stoma-2026-5.sql"
AUDIT_PATH = ROOT / "exports" / "histologia-batch-stoma-2026-5-audit.md"

BATCH_LABEL = "e_hist_stoma_2026/5"
SOURCE_EXAM = "Egzamin histologia STOMA SUM 2026 (HISSTO e2026-1)"
THEME_LABEL = "2026"

TEMAT_NR_TO_TOPIC = {n: f"HIST-{n:02d}" for n in range(1, 23)}
TEMAT_NAME_TO_TOPIC = {
    "metody badawcze": "HIST-01",
    "cytoplazma": "HIST-02",
    "jądro komórkowe": "HIST-03",
    "tkanka nabłonkowa": "HIST-04",
    "tkanka łączna": "HIST-05",
    "tkanka tłuszczowa": "HIST-06",
    "chrząstka": "HIST-07",
    "kości": "HIST-08",
    "tkanka nerwowa i układ nerwowy": "HIST-09",
    "tkanka mięśniowa": "HIST-10",
    "układ krążenia": "HIST-11",
    "krew i hemopoeza": "HIST-12",
    "układ odpornościowy i narządy limfatyczne": "HIST-13",
    "układ pokarmowy": "HIST-14",
    "układ oddechowy": "HIST-15",
    "skóra": "HIST-16",
    "układ moczowy": "HIST-17",
    "gruczoły wewnątrzwydzielnicze": "HIST-18",
    "układ rozrodczy": "HIST-19",
    "oko i ucho - specjalne narządy zmysłów": "HIST-20",
    "rozwój zęba": "HIST-21",
    "embriologia ogólna i embriogeneza narządów": "HIST-22",
}

EXPL_FIXES: dict[str, tuple[str, str]] = {}


def _norm_temat(name: str) -> str:
    text = name.lower().replace("–", "-").replace("—", "-")
    return re.sub(r"\s+", " ", text).strip()


def clean_text(text: str) -> str:
    text = strip_controls(text)
    text = re.sub(r"„([^„”\"]*)\"", r"„\1”", text)
    text = normalize_quotes(text)
    return text.strip()


def subtheme_label(raw: str) -> str | None:
    text = clean_text(raw)
    if not text:
        return None
    return text[0].upper() + text[1:]


def parse_source(raw: str) -> list[dict]:
    raw = raw.lstrip("\ufeff")
    blocks = [b.strip() for b in re.split(r"^---\s*$", raw, flags=re.MULTILINE) if b.strip()]
    items = []
    for index, block in enumerate(blocks, 1):
        item: dict = {"_index": index, "options": {}}
        for field, key in (
            ("ID", "id"),
            ("NR_LOKALNY", "nr"),
            ("BATCH", "batch"),
            ("KIERUNEK", "track_raw"),
            ("TEMAT_NR", "temat_nr"),
            ("TEMAT", "temat"),
            ("PODTEMAT", "subtheme"),
            ("PYTANIE", "stem"),
            ("POPRAWNA", "key_raw"),
        ):
            match = re.search(rf"^{field}:\s*(.*)$", block, re.MULTILINE)
            item[key] = match.group(1).strip() if match else ""
        if not item["id"]:
            raise SystemExit(f"blok {index}: brak ID")
        for letter in "ABCDE":
            opt = re.search(
                rf"^{letter}:\s*(.+?)(?=\n[A-E]:|\nPOPRAWNA:)",
                block,
                re.MULTILINE | re.DOTALL,
            )
            if not opt:
                raise SystemExit(f"{item['id']}: brak opcji {letter}")
            item["options"][letter.lower()] = " ".join(opt.group(1).split())
        expl = re.search(r"^WYJAŚNIENIE:\s*\n(.*)\Z", block, re.MULTILINE | re.DOTALL)
        explanation = expl.group(1).strip() if expl else ""
        explanation = re.sub(r"\nFLAGA:.*", "", explanation).strip()
        item["explanation"] = explanation
        if item["track_raw"] != "STO":
            raise SystemExit(f"{item['id']}: KIERUNEK {item['track_raw']!r} ≠ STO")
        by_name = TEMAT_NAME_TO_TOPIC.get(_norm_temat(item["temat"]))
        if not by_name:
            raise SystemExit(f"{item['id']}: nieznany TEMAT {item['temat']!r}")
        nr = int(item["temat_nr"])
        by_nr = TEMAT_NR_TO_TOPIC.get(nr)
        if by_nr != by_name:
            raise SystemExit(
                f"{item['id']}: rozjazd TEMAT_NR {nr}→{by_nr} vs nazwa →{by_name}"
            )
        key = item["key_raw"].lower()
        if key not in item["options"]:
            raise SystemExit(f"{item['id']}: klucz {key!r} poza A–E")
        item["topic_id"] = by_name
        item["key"] = key
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


def leftover_meta(items: list[dict]) -> list[str]:
    out = []
    for item in items:
        if "FLAGA:" in item["explanation"] or "Autor klucza" in item["explanation"]:
            out.append(item["id"])
        hit = LETTER_REF.search(item["explanation"])
        if hit:
            out.append(f"{item['id']}:{hit.group(0)}")
    return out


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
                "theme_label": THEME_LABEL,
                "tracks": ["stomatologia"],
            }
        )
    return rows


def sql_escape(text: str) -> str:
    return text.replace("'", "''")


def dollar_quoted(text: str, tag: str = "$EXPL$") -> str:
    if tag in text:
        for candidate in ("$Q1$", "$Q2$", "$SAFE$"):
            if candidate not in text:
                tag = candidate
                break
        else:
            raise ValueError("kolizja tagu dollar-quotingu")
    return f"{tag}{text}{tag}"


def options_json(options: dict[str, str]) -> str:
    payload = [{"id": letter, "text": clean_text(options[letter])} for letter in LETTERS]
    return json.dumps(payload, ensure_ascii=False)


def build_sql(items: list[dict]) -> str:
    topic_ids = sorted({item["topic_id"] for item in items})
    rows = []
    for seq, item in enumerate(items, 1):
        stem = dollar_quoted(clean_text(item["stem"]), "$STEM$")
        opts = dollar_quoted(options_json(item["options"]), "$OPTS$")
        expl = dollar_quoted(clean_text(item["explanation"]), "$EXPL$")
        sub = subtheme_label(item["subtheme"])
        sub_sql = "NULL" if not sub else dollar_quoted(sub, "$SUB$")
        rows.append(
            f"({seq}, '{item['topic_id']}',\n"
            f"   {stem},\n"
            f"   {opts}::jsonb,\n"
            f"   '{item['key']}',\n"
            f"   {expl},\n"
            f"   {sub_sql}, '{sql_escape(item['id'])}')"
        )
    topic_list = ", ".join(f"'{t}'" for t in topic_ids)
    header = f"""-- ============================================================
-- BATCH: {BATCH_LABEL}  ·  subject_id=histologia  ·  tracks=stomatologia
-- Źródło: HISSTO e2026-1, {len(items)} pytań A–E
-- id = HIST-NN-NNN · theme_label = 2026 (kafelek wirtualny, bez duplikatu)
-- Kafelek histologia-THEME-2026 już istnieje (tracks NULL) — nie nadpisujemy.
-- Wygenerowane przez scripts/build-hissto-e2026-1.py (nie edytować ręcznie)
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
   subtheme_label, source_code, batch_label, source_exam, theme_label, tracks)
SELECT
  n.topic_id || '-' || LPAD((COALESCE(m.mx,0) + ROW_NUMBER() OVER (PARTITION BY n.topic_id ORDER BY n.seq))::text, 3, '0'),
  n.topic_id, n.qtext, n.opts, n.correct, n.expl,
  n.subtheme, n.srccode, '{BATCH_LABEL}', '{sql_escape(SOURCE_EXAM)}',
  '{THEME_LABEL}', ARRAY['stomatologia']::TEXT[]
FROM new_rows n LEFT JOIN maxes m ON m.topic_id = n.topic_id;

UPDATE public.topics t SET question_count = sub.cnt
  FROM (
    SELECT topic_id, COUNT(*)::int AS cnt
      FROM public.questions
     WHERE topic_id IN ({topic_list})
       AND COALESCE(is_active, true) = true
     GROUP BY topic_id
  ) sub
 WHERE t.id = sub.topic_id;

UPDATE public.topics
   SET question_count = 0
 WHERE id = 'histologia-THEME-2026';
"""
    return header + ",\n".join(rows) + footer


def main() -> int:
    items = parse_source(SRC.read_text(encoding="utf-8-sig"))
    print(f"PARSE {SRC.name}: {len(items)}")
    apply_fixes(items)
    leftover = leftover_meta(items)
    if leftover:
        print("ZOSTAŁY META/LITERY:", leftover)
        return 1

    JSON_PATH.write_text(
        json.dumps(to_json_rows(items), ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    SQL_PATH.write_text(build_sql(items), encoding="utf-8")

    by_topic = Counter(i["topic_id"] for i in items)
    lines = [
        "# Audyt batcha histologia STOMA 2026 (egzamin)",
        "",
        f"**SQL:** `{SQL_PATH.relative_to(ROOT)}` · **JSON:** `{JSON_PATH.relative_to(ROOT)}` · **TXT:** `{SRC.relative_to(ROOT)}`",
        "",
        f"- pytań: **{len(items)}** (`{items[0]['id']}` … `{items[-1]['id']}`)",
        "- 5 opcji `a`–`e`",
        "- `tracks = ['stomatologia']` — tylko stoma; lekarz nie widzi tych pytań ani w działach, ani w kafelku 2026",
        "- `theme_label = 2026` → istniejący kafelek `histologia-THEME-2026` (cień `question_count=0`)",
        "- pytania leżą w `HIST-*` (w tym HIST-21 Rozwój zęba)",
        f"- `batch_label = {BATCH_LABEL}` (/1–/4 to wcześniejsze wsady stomy bez theme_label)",
        "",
        "## Rozkład tematów",
        "",
        "| topic_id | n |",
        "|---|---:|",
    ]
    for topic in sorted(by_topic):
        lines.append(f"| `{topic}` | {by_topic[topic]} |")
    lines += [
        "",
        "## Uwagi",
        "",
        "- Mapowanie po nazwie TEMAT, ze sprawdzeniem TEMAT_NR.",
        "- Kafla 2026 nie przestawiamy na stomę — LEK ma już `e_hist_lek_2026/1` pod tym samym kafelkiem.",
        "- Meta-opcje (A, B, C) w treściach odpowiedzi — frontend wyłącza tasowanie.",
        "",
    ]
    AUDIT_PATH.write_text("\n".join(lines), encoding="utf-8")
    print(f"SQL: {SQL_PATH} ({SQL_PATH.stat().st_size} bytes)")
    print(f"JSON: {JSON_PATH}")
    print(f"AUDIT: {AUDIT_PATH}")
    print("ROZKŁAD", dict(by_topic))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
