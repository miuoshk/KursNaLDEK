# Czego nie ma — i co trzeba dociągnąć, żeby to domknąć

Zamówienie miało około 300 pozycji. Dostarczonych: **278**. Poniżej dokładnie to, czego brakuje,
z powodem i z tym, co konkretnie odblokowuje.

## 1. Szkielet całej postaci — blokuje 5 pozycji

`hero-knnp-skeleton` (jest zamiennik: rdzeń kręgowy) · `ldew-zdrowie-pub` · `anat-skeleton-full` ·
`ach-kwartalna-konsekwencja` (jest zamiennik: klatka piersiowa) · `ach-wszechstronny`

W Grayu na Wikimedia Commons **nie ma szkieletu całej postaci w użytecznej rozdzielczości**.
Potrzebny: **Albinus, *Tabulae sceleti et musculorum corporis humani*, 1747** —
https://commons.wikimedia.org/wiki/Category:Tabulae_sceleti_et_musculorum_corporis_humani

**To jest najbardziej opłacalny pojedynczy plik w całej liście.**

## 2. Szkło laboratoryjne i mikrobiologia — blokuje 8 pozycji

`chem-retort` · `chem-alembic` · `chem-balance` · `chem-flask` ·
`micro-cocci` · `micro-bacilli` · `micro-spirochete` · `micro-microscope`
oraz `subj-chemia`, `subj-biochemia`, `subj-mikrobiologia` z paczki E.

Żaden z pięciu użytych atlasów nie zawiera retorty ani bakterii. To jedyna dziura, której **nie da
się załatać zamiennikiem** z posiadanych materiałów. Świadomie nie podstawiłem komórek nabłonka
jako „bakterii" — na platformie egzaminacyjnej to byłby błąd merytoryczny, a nie skrót.

Potrzebny: atlas aparatury chemicznej XIX w. + atlas bakteriologiczny (np. Wellcome, hasła
`chemical apparatus`, `retort`, `bacteria`, `microscope`).

## 3. Bentley & Trimen tom 3 — blokuje 2 pozycje

`pharma-digitalis` (naparstnica) · `pharma-belladonna` (pokrzyk wilcza jagoda)

Tomy 1 i 2 są pobrane; naparstnica i pokrzyk są w tomie 3. W zamian dołożyłem dwie rośliny spoza
zamówienia z tomu 1: `pharma-aconitum` (tojad) i `pharma-hellebore` (ciemiernik).

## 4. Drobne

| id | czego brakuje |
|---|---|
| `anat-pelvis` | miednicy nie ma w pobranym zestawie, mimo że raport ją wymieniał |
| `anat-liver` | wyprodukowany i **odrzucony po QA** — jedyna dostępna plansza to schemat krążenia wątrobowego płodu, nie sylwetka narządu |
| `mode-inteligentna` | wyprodukowany i **odrzucony po QA** — Skorpion Cellariusa przy 64 px to plama; użyj `sky-antares` jako tła sekcji, a znak trybu weź z Lucide |

## 5. Znane kompromisy w plikach, które JEST

Te pozycje są dostarczone i działają, ale mają wadę, o której warto wiedzieć:

- **Podpisy na mapach nieba (cała paczka I)** — napisy są grawerowane w tę samą płytę co rysunek
  i biegną po łukach. Nie da się ich zdjąć bez zniszczenia siatki. Przy `op 0.22–0.30` czytają się
  jako faktura. **Formalnie łamie to zasadę „zero liter" z §0.**
- **Trzy podpisy kursywą na sercu** (`hero-lek-heart`, `path-lek-heart-lungs`) — leżą na gęstym
  szrafie, OCR ich nie łapie, a `turdsize`, który je zdejmuje, zabiera też kontur serca.
- **Litery przy zębach Blacka** — 1–3 znaki na figurę, te stykające się z zębem przez linijkę
  odniesienia. Reszta zdjęta algorytmem `keep_main`.
- **Rozdzielczość źródeł Graya** — mediana 613 px. SVG skaluje się bez straty, ale brzegi kreski
  mają artefakty JPEG widoczne przy `op 1.0`. Przy docelowych 0.16–0.36 niewidoczne.
  Do druku bym tego nie dał; na dark-only web jest OK.
