#!/usr/bin/env python3
"""Konwersja BIOFIZLEK-e2026-1.txt → JSON/SQL biofizyki KNNP (tylko lekarski).

Pytania zostają w BIOF-* + theme_label=2026 (kafelek wirtualny, bez drugiej kopii).
4 opcje A–D, LaTeX/$...$/KaTeX bez zmian. tracks = ['lekarski'].
ID: biofiz-{suffix}-{NNN} (suffix z topic_id po BIOF-).
"""
from __future__ import annotations

import json
import re
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "exports" / "BIOFIZLEK-e2026-1.txt"
JSON_PATH = ROOT / "exports" / "biofizyka-batch-lek-2026-1.json"
SQL_PATH = ROOT / "exports" / "biofizyka-batch-lek-2026-1.sql"
AUDIT_PATH = ROOT / "exports" / "biofizyka-batch-lek-2026-1-audit.md"

BATCH_LABEL = "e_biof_lek_2026/1"
SOURCE_EXAM = "Egzamin biofizyka LEK SUM 2026 (BIOFIZLEK e2026-1)"
THEME_LABEL = "2026"

LETTER_REF = re.compile(
    r"(?i:odpowied\w+|opcj\w+|wariant\w*|podpunk\w*|dystraktor\w*)\s+[A-E]\b"
    r"|\b[A-E]\)\s"
    r"|(?i:punkt)\s+[A-E]\b",
    re.UNICODE,
)
CONTROL_CHARS = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f]")
STRAIGHT_QUOTE = "\u0022"

TEMAT_NAME_TO_TOPIC = {
    "biospektroskopia": "BIOF-C1",
    "optyka cieczy (refrakcja, polaryzacja)": "BIOF-C2",
    "bioreologia (lepkość, wiskozymetria)": "BIOF-C3",
    "biomechanika (sprężystość, dźwignie)": "BIOF-C4",
    "promieniowanie jonizujące, dozymetria": "BIOF-S1",
    "promieniowanie niejonizujące, lasery, rtg": "BIOF-S2",
    "bioakustyka, słuch, usg": "BIOF-S3",
    "błędy pomiarowe": "BIOF-W1",
    "tomografia komputerowa (ct)": "BIOF-W4",
    "obrazowanie rezonansu magnetycznego (mri/nmr)": "BIOF-W5",
    "inne": "BIOF-INNE",
}

EXPL_FIXES = {
    "BIOFIZLEK-74": (
        "Autor klucza wskazał $\\frac{-R}{1-cR}$, co daje znak dodatni i przeczy konwencji znaku refrakcji przyjętej w pytaniu o oko dalekowzroczne.",
        "Wariant $\\frac{-R}{1-cR}$ daje znak dodatni i przeczy konwencji znaku refrakcji przyjętej w pytaniu o oko dalekowzroczne.",
    ),
    "BIOFIZLEK-89": (
        "(opcja A ma odwrócone jednostki)",
        "(wariant z $\\frac{\\mu\\mathrm{m}}{\\mathrm{keV}}$ ma odwrócone jednostki)",
    ),
    "BIOFIZLEK-120": (
        "Autor klucza wskazał UVB, ale promieniowanie o tak dużej energii wzbudza elektrony, a nie drgania atomów w cząsteczce.",
        "Wariant z UVB jest błędny: promieniowanie o tak dużej energii wzbudza elektrony, a nie drgania atomów w cząsteczce.",
    ),
    "BIOFIZLEK-108": (
        "Odpowiedź D podaje jedynie **definicję** oporu, prawdziwą także dla elementów nieliniowych, więc nie oddaje treści prawa.",
        "Wariant o oporze jako stosunku napięcia do natężenia podaje jedynie **definicję** oporu, prawdziwą także dla elementów nieliniowych, więc nie oddaje treści prawa.",
    ),
    "BIOFIZLEK-110": (
        "Opisane w opcji D zjawisko **odwrotne** służy do **generowania** ultradźwięków, a głowica wykorzystuje oba efekty naprzemiennie.",
        "Zjawisko **odwrotne** — odkształcenie po przyłożeniu pola elektrycznego — służy do **generowania** ultradźwięków, a głowica wykorzystuje oba efekty naprzemiennie.",
    ),
    "BIOFIZLEK-132": (
        "gdzie $s$ to **odchylenie standardowe** pojedynczego pomiaru (wzór z opcji A).",
        "gdzie $s$ to **odchylenie standardowe** pojedynczego pomiaru (wzór z dzielnikiem $n-1$).",
    ),
}


def _norm_temat(name: str) -> str:
    text = name.lower().replace("–", "-").replace("—", "-")
    return re.sub(r"\s+", " ", text).strip()


def normalize_quotes(text: str) -> str:
    result, opening = [], True
    for ch in text:
        if ch == STRAIGHT_QUOTE:
            result.append("\u201e" if opening else "\u201d")
            opening = not opening
        else:
            result.append(ch)
    return "".join(result)


def clean_text(text: str) -> str:
    text = CONTROL_CHARS.sub("", text)
    text = re.sub(r"„([^„”\"]*)\"", r"„\1”", text)
    text = normalize_quotes(text)
    return text.strip()


def subtheme_label(raw: str) -> str | None:
    text = clean_text(raw)
    if not text:
        return None
    return text[0].upper() + text[1:]


def topic_suffix(topic_id: str) -> str:
    if not topic_id.startswith("BIOF-"):
        raise ValueError(f"zły topic_id: {topic_id}")
    return topic_id[5:].lower()


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
        for letter in "ABCD":
            opt = re.search(
                rf"^{letter}:\s*(.+?)(?=\n[A-E]:|\nPOPRAWNA:)",
                block,
                re.MULTILINE | re.DOTALL,
            )
            if not opt:
                raise SystemExit(f"{item['id']}: brak opcji {letter}")
            item["options"][letter.lower()] = " ".join(opt.group(1).split())
        if re.search(r"^E:", block, re.MULTILINE):
            raise SystemExit(f"{item['id']}: nieoczekiwana opcja E (batch A–D)")
        expl = re.search(r"^WYJAŚNIENIE:\s*\n(.*)\Z", block, re.MULTILINE | re.DOTALL)
        explanation = expl.group(1).strip() if expl else ""
        explanation = re.sub(r"\nFLAGA:.*", "", explanation).strip()
        item["explanation"] = explanation
        if not item["temat"]:
            raise SystemExit(f"{item['id']}: brak TEMAT")
        topic_id = TEMAT_NAME_TO_TOPIC.get(_norm_temat(item["temat"]))
        if not topic_id:
            raise SystemExit(
                f"{item['id']}: nieznany TEMAT {item['temat']!r} (nr {item['temat_nr']})"
            )
        if item["track_raw"] != "LEK":
            raise SystemExit(f"{item['id']}: KIERUNEK {item['track_raw']!r} ≠ LEK")
        key = item["key_raw"].lower()
        if key not in item["options"]:
            raise SystemExit(f"{item['id']}: klucz {key!r} poza A–D")
        item["topic_id"] = topic_id
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
                    for letter in "abcd"
                ],
                "correct_option_id": item["key"],
                "explanation": clean_text(item["explanation"]),
                "subtheme_label": subtheme_label(item["subtheme"]),
                "source_code": item["id"],
                "batch_label": BATCH_LABEL,
                "source_exam": SOURCE_EXAM,
                "theme_label": THEME_LABEL,
                "tracks": ["lekarski"],
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
    payload = [{"id": letter, "text": clean_text(options[letter])} for letter in "abcd"]
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
-- BATCH: {BATCH_LABEL}  ·  subject_id=biofizyka  ·  tracks=lekarski
-- Źródło: BIOFIZLEK e2026-1, {len(items)} pytań A–D, LaTeX/$...$ bez zmian
-- id = biofiz-{{suffix}}-NNN · theme_label = 2026 (kafelek wirtualny, bez duplikatu)
-- Wygenerowane przez scripts/build-biofizlek-e2026-1.py (nie edytować ręcznie)
-- ============================================================

INSERT INTO public.topics (id, subject_id, name, display_order, question_count, tracks)
VALUES (
  'BIOF-INNE',
  'biofizyka',
  'Inne',
  12,
  0,
  ARRAY['lekarski']::TEXT[]
)
ON CONFLICT (id) DO UPDATE SET
  subject_id    = EXCLUDED.subject_id,
  name          = EXCLUDED.name,
  display_order = EXCLUDED.display_order,
  tracks        = EXCLUDED.tracks;

INSERT INTO public.topics (id, subject_id, name, display_order, question_count, tracks)
VALUES (
  'biofizyka-THEME-2026',
  'biofizyka',
  '2026',
  13,
  0,
  ARRAY['lekarski']::TEXT[]
)
ON CONFLICT (id) DO UPDATE SET
  subject_id    = EXCLUDED.subject_id,
  name          = EXCLUDED.name,
  display_order = EXCLUDED.display_order,
  tracks        = EXCLUDED.tracks;

WITH new_rows (seq, topic_id, qtext, opts, correct, expl, subtheme, srccode) AS (
 VALUES
"""
    footer = f"""
),
maxes AS (
  SELECT q.topic_id,
         COALESCE(
           MAX((regexp_match(q.id, '^biofiz-' || lower(substring(q.topic_id from 6)) || '-([0-9]+)$'))[1]::int),
           0
         ) AS mx
    FROM public.questions q
   WHERE q.topic_id IN ({topic_list})
   GROUP BY q.topic_id
)
INSERT INTO public.questions
  (id, topic_id, text, options, correct_option_id, explanation,
   subtheme_label, source_code, batch_label, source_exam, theme_label, tracks)
SELECT
  'biofiz-' || lower(substring(n.topic_id from 6)) || '-' ||
    LPAD((COALESCE(m.mx,0) + ROW_NUMBER() OVER (PARTITION BY n.topic_id ORDER BY n.seq))::text, 3, '0'),
  n.topic_id, n.qtext, n.opts, n.correct, n.expl,
  n.subtheme, n.srccode, '{BATCH_LABEL}', '{sql_escape(SOURCE_EXAM)}',
  '{THEME_LABEL}', ARRAY['lekarski']::TEXT[]
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
 WHERE id = 'biofizyka-THEME-2026';
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
    for item in items:
        if "$" in item["stem"] + item["explanation"] + "".join(item["options"].values()):
            pass  # LaTeX ma zostać

    JSON_PATH.write_text(
        json.dumps(to_json_rows(items), ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    SQL_PATH.write_text(build_sql(items), encoding="utf-8")

    by_topic = Counter(i["topic_id"] for i in items)
    lines = [
        "# Audyt batcha biofizyka LEK 2026",
        "",
        f"**SQL:** `{SQL_PATH.relative_to(ROOT)}` · **JSON:** `{JSON_PATH.relative_to(ROOT)}` · **TXT:** `{SRC.relative_to(ROOT)}`",
        "",
        f"- pytań: **{len(items)}** (BIOFIZLEK-71 … BIOFIZLEK-{70 + len(items)})",
        "- 4 opcje `a`–`d` (format egzaminu SUM; jak reszta biofizyki)",
        "- LaTeX/`$...$` bez zmian — KaTeX w sesji",
        "- `tracks = ['lekarski']` — kafelek 2026 i pytania tylko na lekarskim",
        "- `theme_label = 2026` → kafelek `biofizyka-THEME-2026` (cien `question_count=0`, bez duplikatu wierszy)",
        "- pytania leżą w `BIOF-*` (plus `BIOF-INNE` na TEMAT „Inne”)",
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
        "- Mapowanie po nazwie TEMAT, nie TEMAT_NR.",
        "- TEMAT „Inne” → nowy dział `BIOF-INNE` (tylko lekarski, display_order 12).",
        "- BIOFIZLEK-74 / 89 / 108 / 110 / 120 / 132 — usunięte odwołania do liter i „Autor klucza” (tasowanie opcji).",
        "- FLAGA: weryfikacja merytoryczna zdjęta z wyjaśnień; treść i klucz bez zmian.",
        "- Nie wykonywać SQL dwa razy: batch_label jest unikatowy, ale INSERT nie ma ON CONFLICT na source_code.",
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
