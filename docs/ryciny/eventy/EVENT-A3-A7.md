# EVENT — PACZKA A3–A7 (reszta landingu) + B2 (cennik), tura 2

## 1. A3 — sekcja pulpit i karty feature

| id | motyw | tablica | viewBox | gzip |
|---|---|---|---|---|
| sec-pulpit-hand | dłoń (plan, działanie) | Gray0608 | 0 0 1600 1200 | 64 KB |
| sec-pulpit-hand-currentColor | j.w. | | | 64 KB |
| card-goal-target | przekrój gałki ocznej — soczewka jako „ostrość" | Gray869 | 0 0 800 800 | 35 KB |
| card-reviews-clock | tarcza aspektów z promieniami — czyta się jak cyferblat | Cellarius s. 312 | 0 0 800 800 | 59 KB |
| card-rank-laurel | czaszka en face | Gray190 | 0 0 800 800 | 26 KB |

**card-reviews-clock** — zamówienie chciało „przekrój ucha wewnętrznego ALBO klepsydra/sekstant (czas)".
Ucha nie ma, klepsydry nie ma. Wziąłem **tarczę aspektów Cellariusa**: okrąg z podziałką i promieniami
biegnącymi ze środka. To dosłownie wygląda jak cyferblat i mieści się w języku marki (niebo = nawigacja
= pomiar czasu). Jedyne miejsce, gdzie do paczki A weszła plansza spoza Graya — świadomie, bo alternatywą
było nie oddać nic.

## 2. A4 — emblematy kafli pulpitu

| id | motyw | tablica | viewBox | gzip |
|---|---|---|---|---|
| orn-streak-flame | serce jako „życie / ciągłość" (nie płomień Lucide) | Gray491 | 0 0 64 64 | 20 KB |
| orn-goal-circle | krąg piersiowy od góry — „cel / oś" | Gray, krąg piersiowy | 0 0 64 64 | 14 KB |

`orn-goal-circle` zgodnie z uwagą z zamówienia: motyw nieba (róża wiatrów) poszedł do paczki I,
więc tutaj jest **krąg**, tak jak przewidywał zapasowy wariant.

## 3. A5 i A7

| id | motyw | tablica | viewBox | gzip |
|---|---|---|---|---|
| sec-progress-brain | mózg, przekrój strzałkowy pośrodkowy | Gray715 | 0 0 1400 1200 | 54 KB |
| sec-cta-constellation | **sklepienie czaszki od wewnątrz, złożone lustrzanie** | Gray0193 ×2 | 0 0 1800 1000 | 42 KB |

`sec-cta-constellation` — zamówienie samo podpowiadało: „jeśli reszta A jest Gray, wyprodukuj tu
sklepienie czaszki od wewnątrz / calvaria jako »niebo czaszki«". Dokładnie to zrobiłem, tą samą techniką
co `auth-bg-skull`: połowa przekroju odbita lustrzanie w symetryczną rozetę, kadr landscape pod CTA.
Podstawa czaszki jest strukturą obustronnie symetryczną, więc odbicie jest anatomicznie poprawne.

**`sec-faq-ear` NIE zrobione** — wymaga ucha. Plansz ucha nie ma w żadnym z pobranych zestawów
(są tylko embrionalne pęcherzyki słuchowe). To ta sama dziura co `ach-wczesny-ptak` i `subj-biofizyka`
w wariancie akustycznym.

## 4. B2 — cennik

| id | motyw | atlas | viewBox | gzip |
|---|---|---|---|---|
| pricing-bg-scales | sfera armilarna — pomiar, wybór | Cellarius s. 249 | 0 0 1600 1200 | 36 KB |
| pricing-card-30 | siekacz | **Black 1890** | 0 0 800 800 | 12 KB |
| pricing-card-180 | kieł | **Black 1890** | 0 0 800 800 | 17 KB |
| pricing-card-365 | trzonowiec | **Black 1890** | 0 0 800 800 | 35 KB |

**Zmiana atlasu na kartach cennika — uzasadnienie.** Najpierw zrobiłem je z Graya (te same kadry
co rangi w paczce D), żeby trzymać spójność. Po renderze odrzuciłem: karta ma `viewBox 800×800`,
a ząb w Gray1002 zajmuje **40×127 px** — powiększenie dwudziestokrotne daje grubą, poszarpaną plamę
zamiast rytu. W Blacku ten sam ząb ma ~600×1400 px, więc karta 800 px jest w zasięgu źródła.
Zamówienie lokuje „zęby wg klasy" w atlasie Blacka (§0), a strona cennika nie sąsiaduje z odznakami
rang, więc różnica ręki rytowniczej nigdzie się nie zderzy.

**`pricing-bg-scales`** — zamówienie wprost odradzało wagę sprawiedliwości i proponowało
„astrolabium / sekstant (pomiar, wybór)". Sfera armilarna Cellariusa jest instrumentem pomiarowym
z pierścieniem horyzontu — trafia w sens i spina cennik z językiem marki.

## 5. Źródła

Gray 1918 (PD, Carter zm. 1897) — Commons i UNSW Embryology.
Cellarius, *Harmonia Macrocosmica* 1708 (PD Mark) — e-rara.ch.
Black, *Descriptive Anatomy of the Human Teeth* 1890 (PD, zm. 1915) — Internet Archive, 400 ppi.
