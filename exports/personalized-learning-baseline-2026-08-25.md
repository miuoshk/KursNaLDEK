# Personalizowana nauka — raport bazowy

Data pomiaru: 2026-08-25

## Najważniejsze ustalenia

- 333 użytkowników ma co najmniej 1000 łącznych powtórzeń FSRS.
- Mediana zaległych kart wśród aktywnych użytkowników wynosi 631.
- Około 1,26 mln odpowiedzi z Nauki klasycznej zapisano z automatycznym
  `na_pewno`, bez aktualizacji harmonogramu FSRS. Te etykiety nie są
  wiarygodną samooceną i nie mogą trenować modelu.
- Bieżący scheduler używa jednej globalnej retencji 0,90 i limitu 365 dni.
- Pytania mają wyjaśnienia, ale warstwa `learning_outcome` i dystraktorowe
  uzasadnienia są zbyt niepełne, by stanowiły model pojęć.

## Definicja metryki głównej

1. Poprawność przy kolejnej próbie po 7–30 dniach.
2. Wynik na chronionej rezerwie CEM na minutę aktywnej nauki.

Metryki pomocnicze: Brier score i log loss predykcji FSRS, średni czas na
pytanie, ukończenie sesji, liczba aktywnych dni oraz wykonalny backlog.

## Powtarzalny pomiar

- `scripts/2026-08-25-learning-baseline.sql` generuje agregaty produktu,
  trybów, backlogu i pokrycia metadanych.
- `scripts/2026-08-25-export-learning-replay.sql` eksportuje chronologiczną
  historię techniczną bez treści pytań i danych kontaktowych do JSONL.
- `scripts/replay-learning-history.mjs` deterministycznie odbudowuje karty i
  wylicza Brier score, log loss, odroczoną poprawność, czas oraz kalibrację
  pewności.

Replay klasyfikuje Nauki klasycznej obserwacyjnie: błąd jako `Again`,
poprawną odpowiedź jako `Good`. Nie wykorzystuje automatycznego
`na_pewno`.

## Bramka przed włączeniem v2

Pełny replay należy uruchomić na tym samym wycinku historii dla v1 i v2.
Przełączenie odczytu jest dopuszczalne dopiero, gdy v2 nie pogarsza Brier
score, odroczonej poprawności ani czasu na pytanie i nie zwiększa backlogu
ponad ustalony guardrail.
