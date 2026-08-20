#!/usr/bin/env python3
"""Konwersja ANATLEK r2026-1 → TXT fabryki + JSON/SQL anatomii KNNP.

Jedno pytanie w bazie: dział tematyczny + theme_label=2026 (kafelek 2026)
+ widok zaliczenia (ANA-ZAL unia, bez kopii). tracks NULL = STOMA i LEK.
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

ANA_TOPICS = (
    "ANA-CZA",
    "ANA-JAM",
    "ANA-KON",
    "ANA-MIE",
    "ANA-NAC",
    "ANA-NER",
    "ANA-OBW",
    "ANA-OUN",
    "ANA-TRZ",
    "ANA-TUL",
)

BATCH_LABEL = "r_anat_2026/1"
SOURCE_EXAM = "Egzamin anatomia LEK SUM 2026 (ANATLEK r2026-1)"


def _norm_temat(name: str) -> str:
    text = name.lower().replace("–", "-").replace("—", "-")
    return re.sub(r"\s+", " ", text).strip()


TEMAT_NAME_TO_TOPIC = {
    _norm_temat(name): tid
    for name, tid in (
        ("Czaszka i kości twarzoczaszki", "ANA-CZA"),
        ("Głowa", "ANA-CZA"),
        ("Mięśnie żucia i mimiczne", "ANA-MIE"),
        ("Naczynia głowy i szyi", "ANA-NAC"),
        ("Nerwy czaszkowe", "ANA-NER"),
        ("Jama ustna i jej struktury", "ANA-JAM"),
        ("Ośrodkowy układ nerwowy", "ANA-OUN"),
        ("Nerwy obwodowe i sploty", "ANA-OBW"),
        ("Anatomia kończyn", "ANA-KON"),
        ("Anatomia tułowia", "ANA-TUL"),
        ("Trzewia", "ANA-TRZ"),
    )
}

EXPL_FIXES = {
    "ANATLEK-313": (
        'Autor klucza wskazał kąt pochwa-trzon; część opracowań mówi ogólnie o "osi macicy", jednak klasycznie',
        "Część opracowań mówi ogólnie o osi macicy, jednak klasycznie",
    ),
}


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
            item["options"][letter.lower()] = " ".join(opt.group(1).split()) if opt else ""
        expl = re.search(r"^WYJAŚNIENIE:\s*\n(.*)\Z", block, re.MULTILINE | re.DOTALL)
        explanation = expl.group(1).strip() if expl else ""
        explanation = re.sub(r"\nFLAGA:.*", "", explanation).strip()
        item["explanation"] = explanation
        if not item["temat"]:
            raise SystemExit(f"{item['id']}: brak TEMAT")
        topic_id = TEMAT_NAME_TO_TOPIC.get(_norm_temat(item["temat"]))
        if not topic_id:
            raise SystemExit(f"{item['id']}: nieznany TEMAT {item['temat']!r}")
        item["topic_id"] = topic_id
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
        src = item["id"]
        if not src.startswith("ANATLEK-r2026-1-"):
            src = f"ANATLEK-r2026-1-{src.replace('ANATLEK-', '')}"
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
                "source_code": src,
                "batch_label": BATCH_LABEL,
                "source_exam": SOURCE_EXAM,
                "theme_label": "2026",
                "tracks": None,
            }
        )
    return rows


def leftover_meta(items: list[dict]) -> list[str]:
    out = []
    for item in items:
        if "FLAGA:" in item["explanation"] or "Autor klucza" in item["explanation"]:
            out.append(item["id"])
        hit = LETTER_REF.search(item["explanation"])
        if hit:
            out.append(f"{item['id']}:{hit.group(0)}")
    return out


def main() -> int:
    src = Path("/Users/miuoshk/Downloads/ANATLEK-r2026-1.txt")
    factory_path = ROOT / "exports" / "anatlek-r2026-1-factory.txt"
    json_path = ROOT / "exports" / "anatomia-batch-lek-r2026-1.json"
    audit_path = ROOT / "exports" / "anatomia-batch-lek-r2026-1-audit.md"

    items = parse_source(src.read_text(encoding="utf-8-sig"))
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
    leftover = leftover_meta(items)
    if result["bledy"] or leftover:
        print("ZOSTAŁY META/LITERY:", leftover)
        return 1

    json_path.write_text(
        json.dumps(to_json_rows(items), ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"JSON: {json_path}")

    lines = [
        "# Audyt batcha anatomia r2026-1",
        "",
        f"**TXT:** `{factory_path.relative_to(ROOT)}` · **JSON:** `{json_path.relative_to(ROOT)}`",
        "",
        f"- pytań: **{len(items)}** (ANATLEK-307 … ANATLEK-350)",
        "- jedno wiersz w bazie: dział `ANA-*` + `theme_label=2026` + unia na `ANA-ZAL`",
        "- `tracks` NULL — stomatologia i lekarski",
        "",
        "## Rozkład tematów",
        "",
        "| topic_id | n |",
        "|---|---:|",
    ]
    for topic, n in sorted(Counter(i["topic_id"] for i in items).items()):
        lines.append(f"| `{topic}` | {n} |")
    lines += [
        "",
        "## Uwagi",
        "",
        "- ANATLEK-313 — usunięte „Autor klucza” i FLAGA.",
        "- ANATLEK-346 — usunięta linia FLAGA.",
        "- `source_code` = `ANATLEK-r2026-1-NNN` (unikat vs stare `ANATLEK-307`).",
    ]
    audit_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"AUDIT: {audit_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
