# EVENT — PACZKA J (narzędzia i satyra) + domknięcie B3, tura 2

Atlas: **Wellcome Collection, ryciny dentystyczne XVII–XIX w.** — jedno źródło na całą paczkę J,
zgodnie z §0 zamówienia („Hunter albo Black — jeden"). Tom Huntera 1771 (38 plansz, 2718–2887 px)
leży w `ryciny_zrodla/hunter/` nietknięty — jego plansze to szczęki i zęby, nie narzędzia,
więc narzędzia i sceny wzięły się z trzech rycin Wellcome z tej samej epoki i tej samej ręki
rytowniczej (miedzioryt / akwaforta).

## 1. Narzędzia — 6 z 6, emblematy `currentColor` 64 px

Wszystkie z jednej planszy: **„Mullets and Forceps for drawing of Teeth"**, XVII w., 3780×2787 px.

| id | motyw | gzip |
|---|---|---|
| tool-forceps | kleszcze | 17 KB |
| tool-key | **pelikan / klucz dentystyczny** — najbardziej charakterystyczne narzędzie epoki | 20 KB |
| tool-mirror | trzonek z lusterkiem | 11 KB |
| tool-probe | „a Tooth Scraper" — zgłębnik / skaler | 9 KB |
| tool-elevator | „3 pointed levatory" — dźwignia trójzębna | 12 KB |
| tool-bow-drill | „a Polychon" — narzędzie obrotowe z korbą | 12 KB |

Użyłem tu `keep_main` z progiem 0.10 (niższym niż przy zębach Blacka), bo narzędzia bywają
dwuczęściowe — sam trzonek i sama końcówka to dwie plamy i obie muszą zostać.

**Uwaga nazewnicza:** plansza jest XVII-wieczna i podpisuje narzędzia po swojemu („mullet",
„levatory", „polychon"). Przypisałem je do ID z zamówienia po funkcji, nie po nazwie historycznej.
`tool-key` to pelikan — poprzednik klucza Garengeota — i jest to najlepszy wizualnie obiekt
całej paczki.

## 2. Sceny — 3 z 3, tła szałwiowe

| id | rycina | viewBox | gzip |
|---|---|---|---|
| scene-extraction | *A tooth-drawer extracting a tooth from a fashionable lady* (M0019458, 4220×2596) | 0 0 1200 900 | 133 KB |
| scene-waiting | *Cabinet de Mr le Brun* — wnętrze z pacjentami i szarlatanem (V0012019, 3316×2788) | 0 0 1200 900 | 98 KB |
| scene-itinerant | ten sam sztych, kadr na siedzącą postać wędrownego dentysty | 0 0 1200 1200 | 124 KB |

`scene-extraction` jest dokładnie tym, o co prosiło zamówienie: **czytelne i trochę gorzkie,
nie cartoon**. Dentysta pracuje nad siedzącą kobietą, obok stoją gapie, pod nogami pies.
Przy `op 0.55` jako figura czyta się natychmiast.

## 3. Domknięcie paczki B3 — cztery pozycje, które wcześniej były zablokowane

| id | motyw | źródło | viewBox | gzip |
|---|---|---|---|---|
| empty-404-dentist | scena ekstrakcji, kadr ciasny na dentystę i pacjentkę | Wellcome M0019458 | 0 0 1200 900 | 117 KB |
| onboarding-welcome | wnętrze gabinetu — „pierwsza wizyta" | Wellcome V0012019 | 0 0 1200 900 | 67 KB |
| empty-achievements | czaszka en face | **Gray190** | 0 0 128 128 | 17 KB |
| empty-saved | pojedynczy ząb | **Black 1890** | 0 0 128 128 | 10 KB |

**`empty-achievements`** było zablokowane w pierwszej dostawie B3, bo nie miałem czaszki od przodu.
Gray190 przyszedł z drugą dostawą i pozycja jest zamknięta.

**`empty-saved`** — zamówienie chciało „tablica atlasu pusta rama + mały ząb". **Ramy nie ma
i nie będzie**: to element graficzny, nie anatomiczny, a rysowanie ramki byłoby rysowaniem od zera.
Dostajesz sam ząb; ramkę zrób w CSS (`border` na karcie), będzie ostrzejsza niż cokolwiek z trace'u.

## 4. Wagi

Sceny ważą 67–133 KB gzip. To dużo, ale to **figury przy `op 0.45–0.55`**, nie tła za tekstem —
zamówienie samo przewiduje dla nich wyższe opacity, więc muszą mieć czym świecić. Największy plik
to `scene-itinerant` (307 KB na dysku), wciąż poniżej twardego limitu 400 KB. Przy `turdsize` 130
scena traci twarze; sprawdziłem 55, 80, 110 i 130.

## 5. Licencja — sprawdzona osobno dla każdej ryciny

Wszystkie trzy ryciny Wellcome mają **Public Domain Mark**. ChatGPT przy kompletowaniu odrzucił
dwie inne pozycje (astrolabium na CC BY-SA i sekstant na CC BY), bo zamówienie wymaga wyłącznie
PD/CC0/PD-Mark — to jest w jego RAPORCIE i jest zgodne z §3 instrukcji.

Hunter, *Natural History of the Human Teeth*, 1771 — domena publiczna, 38 plansz w `hunter/`.
Wellcome Collection, M0009720 / M0019458 / V0012019 — Public Domain Mark.
