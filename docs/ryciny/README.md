# Ryciny — Kurs na LDEK. Paczka dla Cursora

**278 plików SVG.** Zero rastra, zero fontów, zero elementów `<text>`, żaden plik powyżej 400 KB.
Wszystko z domeny publicznej, wektoryzowane potrace'em z prawdziwych plansz atlasowych —
nigdzie nie ma obrazu AI ani ścieżki pisanej ręcznie.

## Co gdzie leży

```
public-img-ryciny/     ← WSZYSTKIE 278 SVG płasko. To jest to, co kopiujesz do /public/img/ryciny/
wg-paczek/             ← te same pliki, posegregowane wg paczek z zamówienia (do przeglądania)
contact-sheety/        ← podglądy PNG na tle aplikacji #002A27, per paczka
eventy/                ← EVENT-*.md — co z czego powstało, jakie parametry, jakie kompromisy
INDEKS.md              ← tabela wszystkich 278 ID: viewBox, waga, typ kreski
snippet.css            ← gotowy CSS wstawienia
BRAKI.md               ← czego nie ma i czego trzeba, żeby to domknąć
```

**Instalacja to jedna komenda:**

```bash
cp public-img-ryciny/*.svg <projekt>/public/img/ryciny/
```

`wg-paczek/` to **kopie tych samych plików**, nie osobne zasoby — służą tylko do tego, żeby dało się
przejrzeć paczkę A bez przekopywania 278 nazw. Do produkcji bierzesz `public-img-ryciny/`.

## Trzy typy plików — to jedyna rzecz, którą trzeba zapamiętać

| sufiks nazwy | kolor | jak wstawić |
|---|---|---|
| brak sufiksu, kreska `gold` | `#CDB56E` zaszyte w pliku | `<img src>` albo inline — obojętne |
| brak sufiksu, kreska `sage` | `#7FA697` zaszyte w pliku | jw. |
| `-currentColor` albo emblemat 64 px | bierze kolor z CSS | **tylko inline** |

**`<img src="...svg">` nie dziedziczy `currentColor`.** Pliki `currentColor` muszą wejść jako
komponent (`@svgr/webpack`) albo inline w JSX. Jeśli wrzucisz je przez `<img>`, wyrenderują się
na czarno. Kolumna „kreska" w `INDEKS.md` mówi, który plik jest którego typu.

## Opacity

Ryciny są dostarczone w **jednej wadze kreski**. Opacity ustawiasz Ty, w CSS — wartości docelowe
są w `snippet.css` i przy każdej pozycji w `INDEKS.md`:

- **0.28–0.38** — rycina za tekstem
- **0.50–0.65** — rycina jako samodzielna figura (mobile, 404, onboarding)
- **0.16–0.28** — tło karty
- **1.0** — emblemat

## Warianty kadru (paczka M)

Pliki bazowe są kadrowane **prawostronnie** — to jest default z zamówienia, więc nie ma osobnych
plików `-right`. Wariant `-left` istnieje tylko tam, gdzie ma sens; przy sercu, nerwach i mózgu
to **inny kadr, nie odbicie lustrzane** — odbite serce byłoby *situs inversus*, czyli wadą rozwojową.
Szczegóły w `eventy/EVENT-M.md`.

## Licencje

| atlas | co z niego jest | licencja |
|---|---|---|
| Gray, *Anatomy of the Human Body*, 1918 | większość: anatomia, rangi, przedmioty, LDEW | PD (Carter zm. 1897) |
| G.V. Black, *Descriptive Anatomy of the Human Teeth*, 1890 | atlas zębów wg klas, karty cennika | PD (zm. 1915) |
| Cellarius, *Harmonia Macrocosmica*, 1708 | całe niebo: ZENIT, ANTARES, KALIBRA | PD Mark (e-rara.ch) |
| Wellcome Collection, ryciny dentystyczne XVII–XIX w. | narzędzia, sceny, 404, onboarding | PD Mark |
| Bentley & Trimen, *Medicinal Plants*, 1880 | rośliny lecznicze | PD (zm. 1893/1896) |

Pełne odsyłacze do konkretnych tablic — w `eventy/`. Każdy plik źródłowy ma obok siebie
`.meta.json` z licencją w folderze `ryciny_zrodla/`.
