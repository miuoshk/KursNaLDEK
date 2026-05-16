# Kurs na LDEK — co jest już zrobione

Stan: maj 2026

## 1. Fundament aplikacji

- Aplikacja działa na `Next.js` (App Router) + `React` + `TypeScript` (strict).
- UI jest zbudowane na `Tailwind CSS`, komponentach własnych i prymitywach `Radix UI`.
- Warstwa danych i autoryzacji działa na `Supabase` (Auth + Postgres + RLS).
- Za animacje odpowiada `Framer Motion`, za wykresy `Recharts`.
- Zaimplementowany jest podział na moduły domenowe (`features/*`) i routing w `app/*`.

## 2. Gotowe obszary produktowe (widoczne dla użytkownika)

### Auth i konto

- Strony logowania i rejestracji (`/login`, `/register`).
- Obsługa logowania, rejestracji i wylogowania przez Supabase.
- Automatyczne tworzenie profilu użytkownika po rejestracji (trigger DB).
- Działa tryb testowy/demo oparty o cookie.

### Pulpit użytkownika

- Główny dashboard z kartami dnia (cel dzienny, streak, powtórki, ranga).
- Sekcja szybkiego startu nauki i kontynuacji.
- Heatmapa aktywności (styl GitHub contributions).
- Wykres postępu/trafności w czasie.
- Sekcja słabych punktów (tematy do poprawy).
- Ostatnie sesje użytkownika.

### Przedmioty i treści

- Lista przedmiotów KNNP z postępem.
- Agregacja postępu ogólnego na poziomie roku.
- Obsługa przedmiotów bez pytań (stan „wkrótce dostępne”).
- Przejście do modułu OSCE z poziomu przedmiotów.

### Sesje nauki

- Start sesji (`inteligentna`, `przegląd`, `katalog`, retry błędnych).
- Przepływ odpowiedzi pytanie po pytaniu.
- Zapisywanie odpowiedzi i czasu na pytanie.
- Widok podsumowania po sesji (`/sesja/[sessionId]/podsumowanie`).
- Możliwość powtórzenia błędnych pytań.

### OSCE

- Osobny moduł OSCE (`/osce/*`).
- Atlas OPG.
- Trening tematów stacji.
- Symulacje OSCE z timerem i wynikami.
- Obsługa typów pytań OSCE (m.in. ordering, image identify, conversion drill).

### Statystyki i osiągnięcia

- Ekran statystyk użytkownika (`/statystyki`) z wykresami.
- Ekran osiągnięć (`/osiagniecia`) z rankingiem/rangami.
- Ekrany ustawień (`/ustawienia`, dashboardowe ustawienia profilu).

### Cennik

- Strona cenowa (`/cennik`) przygotowana pod integrację subskrypcji.

## 3. Inteligentny silnik nauki (ANTARES + FSRS)

- Działa silnik doboru pytań oparty o `FSRS` (`ts-fsrs`).
- Wyliczanie retrievability i pilności powtórek.
- Priorytetyzacja pytań nowych, due i trudnych („leech”).
- Kompozycja sesji z mieszaniem tematów i krzywą trudności.
- Adaptacja środka sesji (mid-session adaptation).
- Wykrywanie zmęczenia użytkownika.
- Kalibracja pewności odpowiedzi.
- Generowanie insightów po sesji.
- Aktualizacja metryk opanowania tematów i gotowości egzaminowej.

## 4. Gamifikacja

- Naliczanie XP za odpowiedzi i ukończenie sesji.
- Aktualizacja streaka dziennego i rekordu streaka.
- System rang (od Praktykanta do Mistrza LDEK).
- Konfiguracja i śledzenie osiągnięć użytkownika.
- Ranking/leaderboard w obszarze gamifikacji.

## 5. Backend i dane

- Zaimplementowane server actions dla flow nauki: `startSession`, `submitAnswer`, `completeSession`.
- Zapisywane są sesje, odpowiedzi i eventy uczenia.
- Utrzymywany jest per-user postęp pytań (`user_question_progress`).
- Działa cache opanowania tematów (`topic_mastery_cache`) oraz metryki profilu.
- Obecna jest struktura danych pod KNNP i OSCE w jednej bazie.
- Dostępne są skrypty seedujące i migracje SQL.

## 6. Bezpieczeństwo i kontrola dostępu

- Włączone RLS na tabelach użytkownika i danych nauki.
- Rozdzielone klienty Supabase: przeglądarkowy, serwerowy i admin.
- Ochrona tras po stronie `proxy.ts` (odpowiednik middleware w Next 16).
- Użytkownik ma dostęp tylko do swoich danych postępu/sesji.

## 7. Panel administracyjny

- Gotowe trasy panelu admina (`/admin`).
- Widok pytań (`/admin/pytania`).
- Widok użytkowników (`/admin/uzytkownicy`).
- Widok błędów (`/admin/bledy`).

## 8. Co to oznacza praktycznie

Na ten moment aplikacja ma gotowy, działający fundament produkcyjny:

- pełny onboarding użytkownika,
- codzienny flow nauki i powtórek,
- OSCE jako osobny moduł egzaminacyjny,
- system postępu i motywacji (XP, streak, rangi, osiągnięcia),
- backend i bezpieczeństwo oparte o Supabase + RLS.

To jest już kompletna baza do dalszego skalowania contentu pytań i rozwoju funkcji premium.
