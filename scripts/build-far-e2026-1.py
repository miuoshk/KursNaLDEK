#!/usr/bin/env python3
"""Konwersja FARSTO + FARLEK TXT → TXT fabryki + JSON/SQL farmakologii KNNP.

Nie pisze SQL-a ręcznie: ten skrypt jest jedynym źródłem INSERT-ów.
ID: FARM-NN-NNN (jak produkcja). tracks per kierunek. theme_label=2026.
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
from batch_parser import load as load_factory  # noqa: E402
from validate import validate  # noqa: E402

# TEMAT_NR w plikach egzaminu NIE jest 1:1 z KNNP:
# źródło 13 = przeciwnowotworowe (FARM-19), 14–19 = bakteryjne…toksykologia (FARM-13…18).
FARM_TOPICS = tuple(f"FARM-{n:02d}" for n in range(1, 20))

def _norm_temat(name: str) -> str:
    text = name.lower().replace("–", "-").replace("—", "-")
    return re.sub(r"\s+", " ", text).strip()


TEMAT_NAME_TO_TOPIC = {
    _norm_temat(name): tid
    for name, tid in (
        ("Farmakodynamika, farmakokinetyka i interakcje leków", "FARM-01"),
        ("Autakoidy (aminowe, peptydowe, purynowe, gazowe, lipidowe)", "FARM-02"),
        ("NLPZ, leczenie RZS i dny moczanowej. Opioidowe leki przeciwbólowe", "FARM-03"),
        ("Leki autonomicznego układu nerwowego", "FARM-04"),
        ("Płytki krwi, leki przeciwkrzepliwe, leczenie niedokrwistości", "FARM-05"),
        ("Leki moczopędne. Układ krążenia cz. I - nadciśnienie tętnicze i płucne", "FARM-06"),
        ("Układ krążenia cz. II - HF, dławica, OZW, antyarytmiczne, hipolipemizujące", "FARM-07"),
        ("Leki psychotropowe - przeciwdepresyjne, anksjolityczne, neuroleptyczne", "FARM-08"),
        ("OUN i ObUN - znieczulenie miejscowe i ogólne, miorelaksacja, leki nasenne", "FARM-09"),
        ("Leki przeciwpadaczkowe, zespoły otępienne, choroba Parkinsona", "FARM-10"),
        ("Witaminy, biopierwiastki i suplementy diety", "FARM-11"),
        ("Układ oddechowy - wykrztuśne, przeciwkaszlowe, astma, POChP", "FARM-12"),
        ("Leki przeciwnowotworowe", "FARM-19"),
        ("Leki przeciwbakteryjne i środki odkażające. Farmakologia infekcji", "FARM-13"),
        ("Leki przeciwwirusowe, przeciwgrzybiczne i przeciwpasożytnicze. Medycyna podróży", "FARM-14"),
        ("Leki przeciwwirusowe, przeciwgrzybicze i przeciwpasożytnicze. Medycyna podróży", "FARM-14"),
        ("Leki układu pokarmowego", "FARM-15"),
        ("Hormony - podwzgórze, przysadka, tarczyca, kora nadnerczy, hormony płciowe", "FARM-16"),
        ("Metabolizm wapnia, homeostaza węglowodanowa, leczenie otyłości", "FARM-17"),
        ("Toksykologia", "FARM-18"),
    )
}

SOURCES = (
    {
        "src": Path("/Users/miuoshk/Downloads/FARSTO-e2026-1.txt"),
        "batch_label": "e_farm_stoma_2026/1",
        "source_exam": "Egzamin farmakologia STOMA SUM 2026 (FARSTO e2026-1)",
        "track": "stomatologia",
        "kierunek": "STO",
    },
    {
        "src": Path("/Users/miuoshk/Downloads/FARLEK-e2026-1.txt"),
        "batch_label": "e_farm_lek_2026/1",
        "source_exam": "Egzamin farmakologia LEK SUM 2026 (FARLEK e2026-1)",
        "track": "lekarski",
        "kierunek": "LEK",
    },
)

EXPL_FIXES = {
    "FARSTO-e2026-1-1875": (
        "więc zdania A-C są prawdziwe. Zdanie E uznano za fałszywe, ponieważ w **ciężkiej depresji** (zwłaszcza melancholicznej) przewagę skuteczności mają **TLPD** i **wenlafaksyna**, a **SSRI** pozostają lekami z wyboru w epizodach łagodnych i umiarkowanych. Rozgraniczenie względem **bupropionu** (D) jest jednak dyskusyjne.",
        "więc pierwsze trzy stwierdzenia są prawdziwe. Wariant o escitalopramie w **ciężkiej depresji** uznano za fałszywy, ponieważ (zwłaszcza w postaci melancholicznej) przewagę skuteczności mają **TLPD** i **wenlafaksyna**, a **SSRI** pozostają lekami z wyboru w epizodach łagodnych i umiarkowanych. Rozgraniczenie względem **bupropionu** jest jednak dyskusyjne.",
    ),
    "FARSTO-e2026-1-1878": (
        "Odpowiedzi A, B i D dyskwalifikuje obecność leków **profilaktycznych**",
        "Warianty z propranololem, metoprololem i kwasem walproinowym dyskwalifikuje obecność leków **profilaktycznych**",
    ),
    "FARSTO-e2026-1-1885": (
        "Odpowiedź C dyskwalifikuje **budezonid**",
        "Wariant z terbutaliną dyskwalifikuje **budezonid**",
    ),
    "FARSTO-e2026-1-1899": (
        "to obala odpowiedź A. W **amebiozie bezobjawowej** wystarcza sam lek luminalny, bez **metronidazolu** (B), a zawarty w cząsteczce **jod** zaburza testy czynności tarczycy i może wywołać wole (C). Przy długim stosowaniu opisywano **zapalenie nerwu wzrokowego** i podostrą neuropatię rdzeniowo-wzrokową, stąd ostrożność wskazana w odpowiedzi D.",
        "to obala twierdzenie o aktywności jedynie w tkankach. W **amebiozie bezobjawowej** wystarcza sam lek luminalny, bez **metronidazolu**, a zawarty w cząsteczce **jod** zaburza testy czynności tarczycy i może wywołać wole. Przy długim stosowaniu opisywano **zapalenie nerwu wzrokowego** i podostrą neuropatię rdzeniowo-wzrokową, stąd ostrożność przy zaburzeniach tarczycy i neuropatii wzrokowej.",
    ),
    "FARSTO-e2026-1-1901": (
        "stąd prawidłowe są odpowiedzi B i C.",
        "stąd omijają je podanie podjęzykowe i dożylne.",
    ),
    "FARLEK-e2026-1-1800": (
        "Opcje D i E zamieniają role",
        "Dwa ostatnie warianty zamieniają role",
    ),
    "FARLEK-e2026-1-1841": (
        "Dlatego prawidłowy jest wyłącznie wariant C.",
        "Dlatego prawidłowy jest wyłącznie mechanizm zmniejszonej przepuszczalności błony.",
    ),
}

TRACK_SQL = {
    "stomatologia": "ARRAY['stomatologia']::TEXT[]",
    "lekarski": "ARRAY['lekarski']::TEXT[]",
}


def parse_source(raw: str, meta: dict) -> list[dict]:
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
            raise SystemExit(f"{meta['src'].name} blok {index}: brak ID")
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
        if not item["temat"]:
            raise SystemExit(f"{meta['src'].name} blok {index}: brak TEMAT")
        topic_id = TEMAT_NAME_TO_TOPIC.get(_norm_temat(item["temat"]))
        if not topic_id:
            raise SystemExit(
                f"{item['id']}: nieznany TEMAT {item['temat']!r} (nr {item['temat_nr']})"
            )
        if item["track_raw"] and item["track_raw"] != meta["kierunek"]:
            raise SystemExit(f"{item['id']}: KIERUNEK {item['track_raw']!r} ≠ {meta['kierunek']}")
        item["topic_id"] = topic_id
        item["key"] = item["key_raw"].lower()
        item["batch_label"] = meta["batch_label"]
        item["source_exam"] = meta["source_exam"]
        item["track"] = meta["track"]
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
                "batch_label": item["batch_label"],
                "source_exam": item["source_exam"],
                "theme_label": "2026",
                "tracks": [item["track"]],
            }
        )
    return rows


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
            f"   '{sub}', '{item['id']}', '{item['batch_label']}',\n"
            f"   '{sql_escape(item['source_exam'])}', {TRACK_SQL[item['track']]})"
        )
    topic_list = ", ".join(f"'{t}'" for t in FARM_TOPICS)
    header = f"""-- ============================================================
-- BATCH: e_farm_stoma_2026/1 + e_farm_lek_2026/1  ·  subject_id=farmakologia
-- Źródło: FARSTO e2026-1 + FARLEK e2026-1, {len(items)} pytań
-- id = FARM-NN-NNN · tracks per kierunek · theme_label = 2026
-- Wygenerowane przez scripts/build-far-e2026-1.py (nie edytować ręcznie)
-- ============================================================

WITH new_rows (seq, topic_id, qtext, opts, correct, expl, subtheme, srccode, batch, exam, tracks) AS (
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
  n.subtheme, n.srccode, n.batch, n.exam, '2026', n.tracks
FROM new_rows n LEFT JOIN maxes m ON m.topic_id = n.topic_id;

UPDATE public.topics t SET question_count = sub.cnt
  FROM (SELECT topic_id, COUNT(*) AS cnt FROM public.questions
         WHERE topic_id IN ({topic_list}) AND COALESCE(is_active,true)=true GROUP BY topic_id) sub
 WHERE t.id = sub.topic_id;
"""
    return header + ",\n".join(rows) + footer


def leftover_meta(items: list[dict]) -> list[str]:
    out = []
    for item in items:
        if "FLAGA:" in item["explanation"] or "Autor klucza" in item["explanation"] or "W oryginale" in item["explanation"]:
            out.append(item["id"])
        hit = LETTER_REF.search(item["explanation"])
        if hit:
            out.append(f"{item['id']}:{hit.group(0)}")
    return out


def main() -> int:
    factory_path = ROOT / "exports" / "far-e2026-1-factory.txt"
    sql_path = ROOT / "exports" / "farmakologia-batch-2026-1.sql"
    json_path = ROOT / "exports" / "farmakologia-batch-2026-1.json"
    audit_path = ROOT / "exports" / "farmakologia-batch-2026-1-audit.md"

    items: list[dict] = []
    for meta in SOURCES:
        chunk = parse_source(meta["src"].read_text(encoding="utf-8-sig"), meta)
        items.extend(chunk)
        print(f"PARSE {meta['src'].name}: {len(chunk)}")

    apply_fixes(items)
    factory_path.write_text(to_factory_txt(items), encoding="utf-8")
    parsed, parse_errors = load_factory(factory_path)
    result = validate(parsed, parse_errors, None)
    print("WALIDACJA")
    print(f"  pytań: {result['liczba_pytan']}  klucze: {result['rozklad_kluczy']}")
    print(f"  błędy: {len(result['bledy'])}  ostrzeżenia: {len(result['ostrzezenia'])}")
    for msg in result["bledy"]:
        print("  ERR", msg)
    for msg in result["ostrzezenia"][:25]:
        print("  WARN", msg)
    if result["bledy"]:
        print("LITERY:", leftover_meta(items))
        return 1

    leftover = leftover_meta(items)
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
        "# Audyt batcha farmakologia 2026",
        "",
        f"**SQL:** `{sql_path.relative_to(ROOT)}` · **TXT:** `{factory_path.relative_to(ROOT)}`",
        "",
        f"- pytań: **{len(items)}** (100 STOMA FARSTO-1873…1972 + 100 LEK FARLEK-1773…1872)",
        "- `tracks`: STOMA=`stomatologia`, LEK=`lekarski` (przedmiot współdzielony)",
        "- `theme_label = 2026` → kafelek `farmakologia-THEME-2026`",
        "",
        "## Rozkład tematów",
        "",
        "| topic_id | STO | LEK | suma |",
        "|---|---:|---:|---:|",
    ]
    sto = Counter(i["topic_id"] for i in items if i["track"] == "stomatologia")
    lek = Counter(i["topic_id"] for i in items if i["track"] == "lekarski")
    for topic in sorted(set(sto) | set(lek)):
        lines.append(f"| `{topic}` | {sto[topic]} | {lek[topic]} | {sto[topic] + lek[topic]} |")
    lines += [
        "",
        "## Uwagi",
        "",
        "- Mapowanie działów po nazwie TEMAT (nie TEMAT_NR): źródło 13 = FARM-19, 14–19 = FARM-13…18.",
        "- FARSTO-e2026-1-1875 — usunięte odwołania do liter i linia FLAGA.",
        "- 6 wyjaśnień z odwołaniami do liter A–E przepisane bez liter (tasowanie opcji).",
        "- FARM-19 (przeciwnowotworowe) tylko w FARLEK (3 pytania); FARSTO nr 19 to toksykologia (FARM-18).",
    ]
    audit_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"AUDIT: {audit_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
