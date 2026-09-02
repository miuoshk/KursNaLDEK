# EVENT — PACZKA K (histologia / chemia / farmakologia / mikrobiologia), tura 2

Zamówienie chciało **całej paczki K z jednego źródła**. To okazało się niewykonalne i mówię wprost
dlaczego: K łączy cztery dziedziny, które w XIX w. miały cztery różne atlasy. Podzieliłem ją więc
na **dwa spójne zestawy**, każdy z jednego źródła — zamiast mieszać pięć atlasów w jednym rzędzie ikon.

## 1. K-histo — 5 pozycji, atlas Gray 1918

| id | motyw | tablica | gzip |
|---|---|---|---|
| histo-epithelium | nabłonek wielowarstwowy w przekroju | Gray0940 | 60 KB |
| histo-bone | **kość w przekroju poprzecznym — systemy Haversa** | Gray0945 | 39 KB |
| histo-cartilage | chrząstka i błona włóknista, warstwy | Gray0964 | 45 KB |
| histo-tooth-germ | ząb w przekroju podłużnym | Gray1005 | 24 KB |
| histo-enamel-organ | trzonowiec w przekroju — szkliwo, zębina, miazga | Gray1006 | 23 KB |

`histo-bone` to najlepsza pozycja tej paczki — klasyczny przekrój z kanałami Haversa, rozpoznawalny
dla każdego, kto zdawał histologię.

**Dwa ostatnie ID to zamienniki.** Zamówienie chciało *zawiązka zęba* i *narządu szkliwotwórczego*,
czyli struktur z odontogenezy. W zestawie nie ma plansz rozwoju zęba — dostajesz **gotowy ząb
w przekroju**, co jest tym samym obiektem po zakończeniu rozwoju, ale nie jest zawiązkiem.
Merytorycznie to różnica, którą student histologii wyłapie.

## 2. K-pharma — 3 pozycje, atlas Bentley & Trimen, *Medicinal Plants* 1880

| id | roślina | strona skanu | tło gzip | emblemat gzip |
|---|---|---|---|---|
| pharma-opium-poppy | **Papaver somniferum** — mak lekarski, kwiat i makówki | vol. 1, s. 158 | 53 KB | 17 KB |
| pharma-aconitum | *Aconitum napellus* — tojad mocny | vol. 1, s. 78 | 35 KB | 6 KB |
| pharma-hellebore | *Helleborus niger* — ciemiernik | vol. 1, s. 38 | 74 KB | 20 KB |

**`pharma-aconitum` i `pharma-hellebore` to nowe ID, których nie ma w zamówieniu.** Dołożyłem je
zamiast dwóch zablokowanych (patrz niżej), bo to równie klasyczne rośliny lecznicze z tego samego
tomu i tej samej ręki litograficznej. Jeśli ich nie chcesz — po prostu ich nie wstawiaj; nic nie psują.

Techniczna uwaga: to **chromolitografie**, czyli plansze w pełnym kolorze. Bez `channel=max`
(opisanego w EVENT-I §2) nie dałoby się z nich wyciągnąć kreski — po zwykłym grayscale zielone liście
i żółte makówki wychodzą ciemniejsze niż rysunek. Znalezienie samej planszy maku wymagało przejścia
przez 561 stron skanu: najpierw wykrywanie stron kolorowych po nasyceniu pikseli, potem contact sheety
co 6 stron, aż trafiłem na tekst „18. PAPAVER SOMNIFERUM" i cofnąłem się do planszy przed nim.
Plansza jest **dwustronicowa** — kwiat na s. 158, makówka na s. 159; wziąłem stronę z kwiatem.

## 3. NIE zrobione — 9 z 17

| id | dlaczego |
|---|---|
| **chem-retort, chem-alembic, chem-balance, chem-flask** | Szkła i aparatury laboratoryjnej XIX w. **nie ma w żadnym z pobranych źródeł.** Ani Gray, ani Black, ani Hunter, ani Cellarius, ani atlas botaniczny nie zawierają retort. To wymaga osobnego atlasu chemicznego — i to jest jedyna prawdziwa dziura, której nie da się załatać zamiennikiem z posiadanych materiałów. |
| **micro-cocci, micro-bacilli, micro-spirochete, micro-microscope** | To samo: brak atlasu mikrobiologicznego i brak ryciny mikroskopu. **Nie podstawiam komórek nabłonka jako bakterii** — z tego samego powodu, dla którego odmówiłem tego w paczce E: to platforma egzaminacyjna, a nie dekoracja. |
| **pharma-digitalis, pharma-belladonna** | Naparstnica (Scrophulariaceae) i pokrzyk (Solanaceae) są w **tomie 3** Bentleya–Trimena. ChatGPT pobrał tomy 1 i 2; tomu 3 zabrakło i sam to odnotował w swoim raporcie. Jeden plik zamyka obie pozycje. |

## 4. Odblokowane przy okazji — ucho

Przeglądając zestaw embriologiczny pod histologię natrafiłem na plansze, których wcześniej nie
zauważyłem: **Gray0904 i Gray0905 to małżowina uszna**, a Gray0920 to ucho wewnętrzne. To domyka
**trzy pozycje, które w poprzednich turach zamknąłem jako niemożliwe**:

| id | paczka | status |
|---|---|---|
| `anat-ear` + `anat-ear-mark` | G-Gray ciało | **odblokowane** — małżowina, czyta się przy 32 px |
| `anat-ear-inner` | G-Gray (nowe ID) | ucho wewnętrzne — ślimak i kanały półkoliste |
| `sec-faq-ear` | A7 | **odblokowane** — ucho jako „słuchanie pytań" |
| `ach-wczesny-ptak` | D2 | **odblokowane** — małżowina jako „wstawać" |

Wcześniej pisałem, że plansz ucha nie ma. **Myliłem się** — były, tylko w zakresie numerów,
którego nie przejrzałem. Poprawiam to teraz zamiast zostawić błędny wpis w evencie.

## 5. Źródła i licencje

Gray, *Anatomy of the Human Body*, 20. wyd. 1918 — domena publiczna (Carter zm. 1897).
Bentley, Robert; Trimen, Henry. *Medicinal Plants*, J. & A. Churchill, London 1880 —
domena publiczna (Bentley zm. 1893, Trimen zm. 1896). Skan: Internet Archive / Wellcome,
JP2, tomy 1–2 w `ryciny_zrodla/misc/`.
