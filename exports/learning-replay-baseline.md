# Replay historii nauki — baseline

Źródło: `/Users/miuoshk/Documents/Cursor/kursnaldek/exports/learning-replay-history.jsonl`  
Wygenerowano: 2026-08-26T02:17:22.599Z

## Główne metryki

- Próby: 2 580 239
- Karty: 1 116 634
- Próby z predykcją FSRS: 1 463 605
- Brier score: 0.1281
- Log loss: 1.1175
- Odroczona poprawność 7–30 dni: 79.0% (n=168 973)
- Średni czas odpowiedzi: 18.7 s
- Backlog na końcu eksportu: 1 042 482 kart

## Tryby sesji

- classic: n=1 265 821, poprawność=79.6%, czas=17.3 s
- intelligent: n=1 314 189, poprawność=76.3%, czas=20.0 s
- osce: n=229, poprawność=81.7%, czas=8.2 s

## Kalibracja deklarowanej pewności

- troche: n=311 820, poprawność=75.6%
- na_pewno: n=765 895, poprawność=96.1%
- nie_wiedzialem: n=236 703, poprawność=13.2%
- brak: n=1 265 821, poprawność=79.6%

## Reguły replayu

- Wejście musi być posortowane po `user_id`, `question_id`, `answered_at`.
- Klasyczna nauka nie korzysta z historycznej automatycznej pewności: poprawna odpowiedź = Good, błąd = Again.
- Brier i log loss liczone są tylko od drugiej próby karty, gdy istnieje predykcja przypomnienia.
- Fuzz jest wyłączony, dzięki czemu replay jest deterministyczny.
