#!/usr/bin/env node
/**
 * Audyt biofizyki: polskie znaki + KaTeX w text / options / explanation.
 *
 *   node scripts/biofizyka-audit-katex-polish.mjs --dry-run
 *   node scripts/biofizyka-audit-katex-polish.mjs --apply
 *
 * Generuje:
 *   exports/biofizyka-pre-katex-polish-rollback.sql
 *   exports/biofizyka-pre-katex-polish-backup.json
 *   scripts/2026-06-18-biofizyka-katex-polish-apply.sql
 *   exports/biofizyka-katex-polish-audit.json
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const SUBJECT_ID = "biofizyka";
const ROLLBACK_SQL = "exports/biofizyka-pre-katex-polish-rollback.sql";
const BACKUP_JSON = "exports/biofizyka-pre-katex-polish-backup.json";
const APPLY_SQL = "scripts/2026-06-18-biofizyka-katex-polish-apply.sql";
const AUDIT_JSON = "exports/biofizyka-katex-polish-audit.json";

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

function escapeSQL(value) {
  return String(value ?? "").replace(/'/g, "''");
}

function toAsciiKey(word) {
  return word
    .toLowerCase()
    .replace(/ą/g, "a")
    .replace(/ć/g, "c")
    .replace(/ę/g, "e")
    .replace(/ł/g, "l")
    .replace(/ń/g, "n")
    .replace(/ó/g, "o")
    .replace(/ś/g, "s")
    .replace(/ź/g, "z")
    .replace(/ż/g, "z");
}

/** Słownik uzupełniający — terminy fizyczno-medyczne często bez ogonków w starym imporcie. */
const STATIC_PL_MAP = new Map(
  Object.entries({
    kazda: "każda",
    kazdy: "każdy",
    kazde: "każde",
    czastka: "cząstka",
    czastki: "cząstki",
    czastek: "cząstek",
    czasteczke: "cząsteczkę",
    czasteczki: "cząsteczki",
    dlugosci: "długości",
    dlugosc: "długość",
    stala: "stała",
    stalej: "stałej",
    staly: "stały",
    predkosc: "prędkość",
    predkosci: "prędkości",
    maja: "mają",
    mial: "miał",
    moga: "mogą",
    krotsza: "krótsza",
    krotszy: "krótszy",
    dluzszy: "dłuższy",
    dluzsza: "dłuższa",
    niz: "niż",
    wieksza: "większa",
    wiekszy: "większy",
    wieksze: "większe",
    mniejsza: "mniejsza",
    mniejszy: "mniejszy",
    mniejsze: "mniejsze",
    swiatlo: "światło",
    swiatla: "światła",
    zdolnosc: "zdolność",
    zalezy: "zależy",
    zaleznosc: "zależność",
    zaleznosci: "zależności",
    wspolczynnik: "współczynnik",
    wspolczynnika: "współczynnika",
    wspolczynnikiem: "współczynnikiem",
    wspolczynniki: "współczynniki",
    zalamania: "załamania",
    zalamanie: "załamanie",
    osrodka: "ośrodka",
    osrodek: "ośrodek",
    osrodkow: "ośrodków",
    wzor: "wzór",
    wzoru: "wzoru",
    wzorem: "wzorem",
    kata: "kąta",
    kat: "kąt",
    katem: "kątem",
    katow: "kątów",
    katowa: "kątowa",
    mozna: "można",
    mozliwe: "możliwe",
    mozliwy: "możliwy",
    mozliwosc: "możliwość",
    rozroznic: "rozróżnić",
    rozroznienia: "rozróżnienia",
    podwojnej: "podwójnej",
    odleglosc: "odległość",
    odleglosci: "odległości",
    plaszczyzny: "płaszczyzny",
    plaszczyzna: "płaszczyzna",
    plaszczyzne: "płaszczyznę",
    plaszczyzn: "płaszczyzn",
    rzeczywisty: "rzeczywisty",
    odwrocony: "odwrócony",
    odwrotnie: "odwrotnie",
    rowniez: "również",
    powiekszenie: "powiększenie",
    ogniskowa: "ogniskowa",
    przenikalnosci: "przenikalności",
    przenikalnosc: "przenikalność",
    dielektrycznej: "dielektrycznej",
    czestotliwosci: "częstotliwości",
    czestotliwosc: "częstotliwość",
    energie: "energie",
    czastek: "cząstek",
    najwieksza: "największa",
    najmniejsza: "najmniejsza",
    dlatego: "dlatego",
    podczerwieni: "podczerwieni",
    dzialaja: "działają",
    zewnetrznym: "zewnętrznym",
    zewnetrznego: "zewnętrznego",
    zewnetrzne: "zewnętrzne",
    wystepuje: "występuje",
    wystepuja: "występują",
    stezeniu: "stężeniu",
    stezenia: "stężenia",
    stezen: "stężeń",
    stezenie: "stężenie",
    proporcjonalna: "proporcjonalna",
    proporcjonalny: "proporcjonalny",
    proporcjonalne: "proporcjonalne",
    proporcjonalna: "proporcjonalna",
    blad: "błąd",
    bledy: "błędy",
    bledow: "błędów",
    dokladnosc: "dokładność",
    dokladna: "dokładna",
    dokladnej: "dokładnej",
    dokladnie: "dokładnie",
    niedokladnosc: "niedokładność",
    srednia: "średnia",
    sredniej: "średniej",
    srednie: "średnie",
    sredni: "średni",
    srednim: "średnim",
    przyblizeniem: "przybliżeniem",
    przyblizona: "przybliżona",
    wartosci: "wartości",
    wartosc: "wartość",
    rzeczywistej: "rzeczywistej",
    rzeczywista: "rzeczywista",
    wielkosci: "wielkości",
    wielkosc: "wielkość",
    mierzonej: "mierzonej",
    pomiarow: "pomiarów",
    pomiarowego: "pomiarowego",
    pomiarowych: "pomiarowych",
    gestosc: "gęstość",
    gestosci: "gęstości",
    cisnienie: "ciśnienie",
    cisnienia: "ciśnienia",
    cisnieniem: "ciśnieniem",
    napiecia: "napięcia",
    napiecie: "napięcie",
    prad: "prąd",
    pradu: "prądu",
    pradem: "prądem",
    pradow: "prądów",
    pradowe: "prądowe",
    ladunkow: "ładunków",
    ladunku: "ładunku",
    ladunki: "ładunki",
    ladunkow: "ładunków",
    przewodnosci: "przewodności",
    przewodnosc: "przewodność",
    wlasciwej: "właściwej",
    wlasciwosci: "właściwości",
    wlasciwosc: "właściwość",
    wydzielane: "wydzielane",
    wydzielane: "wydzielane",
    wskutek: "wskutek",
    przeplywu: "przepływu",
    przeplyw: "przepływ",
    przeplywem: "przepływem",
    komorkowa: "komórkowa",
    komorkowej: "komórkowej",
    komorkowe: "komórkowe",
    komorki: "komórki",
    srodowiska: "środowiska",
    srodowisko: "środowisko",
    zewnetrznego: "zewnętrznego",
    sila: "siła",
    sily: "siły",
    dzialajacy: "działający",
    dzialajaca: "działająca",
    dzialajace: "działające",
    wzdluz: "wzdłuż",
    dazy: "dąży",
    ustawienia: "ustawienia",
    ustawianiu: "ustawianiu",
    ustawiania: "ustawiania",
    trwalych: "trwałych",
    trwale: "trwale",
    wzrostem: "wzrostem",
    temperatury: "temperatury",
    temperatura: "temperatura",
    temperaturze: "temperaturze",
    iloczyn: "iloczyn",
    ladunkiem: "ładunkiem",
    odleglosci: "odległości",
    jednostka: "jednostka",
    relaksacji: "relaksacji",
    wylaczeniu: "wyłączeniu",
    rozne: "różne",
    roznych: "różnych",
    maleje: "maleje",
    wzrostem: "wzrostem",
    polprzewodnik: "półprzewodnik",
    pasmo: "pasmo",
    wzbronione: "wzbronione",
    wzbronionego: "wzbronionego",
    elektrony: "elektrony",
    elektronow: "elektronów",
    wzbudzone: "wzbudzone",
    oscylacyjna: "oscylacyjna",
    rotacyjna: "rotacyjna",
    rotacyjne: "rotacyjne",
    widma: "widma",
    zrodla: "źródła",
    zrodlo: "źródło",
    zrodel: "źródeł",
    promieniow: "promieniow",
    promieniowania: "promieniowania",
    promieniowanie: "promieniowanie",
    napromieniowania: "napromieniowania",
    napromieniowanie: "napromieniowanie",
    bezpieczenstwa: "bezpieczeństwa",
    bezpieczenstwo: "bezpieczeństwo",
    wplyw: "wpływ",
    wplywu: "wpływu",
    wplywa: "wpływa",
    wplywaja: "wpływają",
    oblicz: "oblicz",
    obliczenia: "obliczenia",
    obliczen: "obliczeń",
    rownanie: "równanie",
    rownania: "równania",
    rownaniem: "równaniem",
    poteg: "potęg",
    potega: "potęga",
    potegi: "potęgi",
    pierwiast: "pierwiast",
    logarytm: "logarytm",
    tangens: "tangens",
    sinus: "sinus",
    wspolrzed: "współrzęd",
    wspolrzednych: "współrzędnych",
    wspolpraca: "współpraca",
    wspolczynnikow: "współczynników",
    rozdzielczosc: "rozdzielczość",
    rozdzielczosci: "rozdzielczości",
    glebok: "głębok",
    glebokosc: "głębokość",
    glebokosci: "głębokości",
    grubosc: "grubość",
    grubosci: "grubości",
    szerokosc: "szerokość",
    szerokosci: "szerokości",
    przyklad: "przykład",
    przykladow: "przykładów",
    wyjasn: "wyjaśn",
    dzial: "dział",
    cwiczen: "ćwiczeń",
    cwiczenia: "ćwiczenia",
    tlumacz: "tłumacz",
    indukcj: "indukcj",
    pojemnosc: "pojemność",
    pojemnosci: "pojemności",
    energi: "energi",
    energia: "energia",
    energii: "energii",
    rezystanc: "rezystanc",
    rezystancja: "rezystancja",
    rezystancji: "rezystancji",
    napieci: "napięci",
    elektromagnes: "elektromagnes",
    elektromagnesy: "elektromagnesy",
    zwoje: "zwoje",
    zwoj: "zwoj",
    nieruchome: "nieruchome",
    tworza: "tworzą",
    tylko: "tylko",
    pole: "pole",
    elektryczne: "elektryczne",
    magnetyczne: "magnetyczne",
    magnetycznego: "magnetycznego",
    magnetycznym: "magnetycznym",
    jonizujace: "jonizujące",
    jonizujacy: "jonizujący",
    pochloniete: "pochłonięte",
    pochloniona: "pochłonięta",
    pochloniony: "pochłonięty",
    pochlania: "pochłania",
    pochlanianie: "pochłanianie",
    wspolczynnikow: "współczynników",
    wspolczynnikowi: "współczynnikowi",
    wiazki: "wiązki",
    wiazke: "wiązkę",
    natęzenie: "natężenie",
    natęzenia: "natężenia",
    plaszczyznami: "płaszczyznami",
    skretu: "skrętu",
    skrecenia: "skręcenia",
    skrecenia: "skręcenia",
    polaryzacji: "polaryzacji",
    polaryzatora: "polaryzatora",
    analizatora: "analizatora",
    wychodzacego: "wychodzącego",
    wychodzaca: "wychodząca",
    wychodzacy: "wychodzący",
    wzajemnie: "wzajemnie",
    prostopadle: "prostopadle",
    jednostajnie: "jednostajnie",
    niejednostajnie: "niejednostajnie",
    niejednostajny: "niejednostajny",
    opadajaca: "opadająca",
    opadajacej: "opadającej",
    opadania: "opadania",
    lepkości: "lepkości",
    lepkosci: "lepkości",
    lepkosc: "lepkość",
    lepkosciowa: "lepkościowa",
    lepkosciowy: "lepkościowy",
    lepkosciowej: "lepkościowej",
    lepkosciowego: "lepkościowego",
    liczba: "liczba",
    liczby: "liczby",
    liczbowa: "liczbowa",
    liczbowej: "liczbowej",
    graniczna: "graniczna",
    granicznej: "granicznej",
    graniczne: "graniczne",
    graniczny: "graniczny",
    wyznaczyc: "wyznaczyć",
    wyznaczenia: "wyznaczenia",
    wyznaczen: "wyznaczeń",
    wyliczyc: "wyliczyć",
    przyblizone: "przybliżone",
    przyblizony: "przybliżony",
    przyblizeniu: "przybliżeniu",
    pobrana: "pobrana",
    pobranej: "pobranej",
    pobrany: "pobrany",
    spełnia: "spełnia",
    spelnia: "spełnia",
    spelniony: "spełniony",
    spelnione: "spełnione",
    spelnienia: "spełnienia",
    spelniaja: "spełniają",
    spelnia: "spełnia",
    odwrotnie: "odwrotnie",
    proporcjonalna: "proporcjonalna",
    odwrotnie: "odwrotnie",
    skurczu: "skurczu",
    skurcz: "skurcz",
    obciazenia: "obciążenia",
    obciazenie: "obciążenie",
    obciazeniem: "obciążeniem",
    obciazony: "obciążony",
    miesni: "mięśni",
    miesnia: "mięśnia",
    miesien: "mięsień",
    miesniem: "mięśniem",
    rozwinie: "rozwija",
    rozwijanej: "rozwijanej",
    rozwijane: "rozwijane",
    rozwijany: "rozwijany",
    zaleznosci: "zależności",
    zaleznosc: "zależność",
    zalezy: "zależy",
    niezaleznie: "niezależnie",
    niezaleznosc: "niezależność",
    niezalezna: "niezależna",
    niezalezny: "niezależny",
    niezalezne: "niezależne",
    niezaleznych: "niezależnych",
    niezaleznie: "niezależnie",
    niezaleznie: "niezależnie",
    Brogliea: "Broglie'a",
    brogliea: "Broglie'a",
    odwrotnosc: "odwrotność",
    odwrotnosci: "odwrotności",
    oswietlajacej: "oświetlającej",
    oswietlajaca: "oświetlająca",
    glownej: "głównej",
    glowna: "główna",
    skupiaja: "skupiają",
    uwzglednia: "uwzględnia",
    niepowiekszony: "niepowiększony",
    niezmniejszony: "niezmniejszony",
    powiekszenie: "powiększenie",
    wykladniczo: "wykładniczo",
    rozniczkowe: "różniczkowe",
    maleje: "maleje",
    plaszczyznami: "płaszczyznami",
    miedzy: "między",
    sie: "się",
    blona: "błona",
    dazy: "dąży",
    powstaja: "powstają",
    calkowitemu: "całkowitemu",
    calkowite: "całkowite",
    padajace: "padające",
    ulegaja: "ulegają",
    krotsze: "krótsze",
    wykladniczo: "wykładniczo",
    rozniczkowe: "różniczkowe",
    krotkowzrocznosc: "krótkowzroczność",
    skonczoneosci: "skończonej odległości",
    naprezenie: "naprężenie",
    odksztalcenia: "odkształcenia",
    odksztalcen: "odkształceń",
    odksztalce: "odkształce",
    obowiazuje: "obowiązuje",
    malych: "małych",
    przyspieszane: "przyspieszane",
    siwertach: "siewertach",
    pochlonieta: "pochłonięta",
    pochloni: "pochłoni",
    rownowazna: "równoważna",
    rownowaznej: "równoważnej",
    aktywnosc: "aktywność",
    zywnosci: "żywności",
    kerama: "kerama",
    izobaryczna: "izobaryczna",
    izotermiczna: "izotermiczna",
    izochoryczna: "izochoryczna",
    uklad: "układ",
    zarowno: "zarówno",
    materie: "materię",
    dluzej: "dłużej",
    komorce: "komórce",
    depolaryz: "depolaryz",
    antyneutrino: "antyneutrino",
    uniwersalnym: "uniwersalnym",
    regenerowane: "regenerowane",
    mitochondriach: "mitochondriach",
    hydrolizy: "hydrolizy",
    skurczu: "skurczu",
    adenozynotrifosforan: "adenozynotrifosforan",
    punkt: "punkt",
    daleki: "daleki",
    oka: "oka",
    mierzona: "mierzona",
    dioptriach: "dioptriach",
    normalne: "normalne",
    liczba: "liczba",
    atomowa: "atomowa",
    masowa: "masowa",
    rosnie: "rośnie",
    tla: "tła",
    naturalnego: "naturalnego",
    ekspozycyjna: "ekspozycyjna",
    jonizacje: "jonizacje",
    powietrza: "powietrza",
    promieniowanie: "promieniowanie",
    kosmiczne: "kosmiczne",
    izotopy: "izotopy",
    przemiana: "przemiana",
    wykresie: "wykresie",
    pozioma: "pozioma",
    hiperbola: "hiperbola",
    organizm: "organizm",
    otwarty: "otwarty",
    wymienia: "wymienia",
    otoczeniem: "otoczeniem",
    pokarm: "pokarm",
    tlen: "tlen",
    potencjal: "potencjał",
    czynnosciowy: "czynnościowy",
    neuronach: "neuronach",
    miesniowej: "mięśniowej",
    serca: "serca",
    faza: "faza",
    zalamania: "załamania",
    osrodkow: "ośrodków",
    Abbego: "Abbego",
    Lamberta: "Lamberta",
    Beera: "Beera",
    Malusa: "Malusa",
    Bragga: "Bragga",
    Clapeyrona: "Clapeyrona",
    Svedberga: "Svedberga",
    Poiseuille: "Poiseuille'a",
    Hilla: "Hilla",
    Wiena: "Wiena",
    Gullstranda: "Gullstranda",
    Brewstera: "Brewstera",
    Hounsfielda: "Hounsfielda",
    Faradaya: "Faradaya",
    Ohma: "Ohma",
    Plancka: "Plancka",
    Boltzmanna: "Boltzmanna",
    Stokesa: "Stokesa",
    Reynoldsa: "Reynoldsa",
    Younga: "Younga",
    Hooke: "Hooke'a",
    oszacowaniem: "oszacowaniem",
    oszacowanie: "oszacowanie",
    estymatorem: "estymatorem",
    estymator: "estymator",
    estymacji: "estymacji",
    estymacja: "estymacja",
    rozkład: "rozkład",
    rozklad: "rozkład",
    rozkladu: "rozkładu",
    normalny: "normalny",
    normalna: "normalna",
    normalnej: "normalnej",
    normalnego: "normalnego",
    niepewnosc: "niepewność",
    niepewnosci: "niepewności",
    regresji: "regresji",
    regresja: "regresja",
    liniowa: "liniowa",
    liniowej: "liniowej",
    liniowy: "liniowy",
    liniowe: "liniowe",
    precyzja: "precyzja",
    precyzji: "precyzji",
    systematyczny: "systematyczny",
    systematyczna: "systematyczna",
    systematyczne: "systematyczne",
    losowy: "losowy",
    losowa: "losowa",
    losowe: "losowe",
    losowych: "losowych",
    pomiar: "pomiar",
    pomiaru: "pomiaru",
    pomiary: "pomiary",
    pomiarow: "pomiarów",
    szeregu: "szeregu",
    szereg: "szereg",
    szeregu: "szeregu",
    arytmetyczna: "arytmetyczna",
    arytmetycznej: "arytmetycznej",
    arytmetyczne: "arytmetyczne",
    arytmetyczny: "arytmetyczny",
    mediana: "mediana",
    mediany: "mediany",
    odchylenie: "odchylenie",
    odchylenia: "odchylenia",
    odchylen: "odchyleń",
    standardowe: "standardowe",
    standardowa: "standardowa",
    standardowego: "standardowego",
    standardowej: "standardowej",
    wariancja: "wariancja",
    wariancji: "wariancji",
    korelacja: "korelacja",
    korelacji: "korelacji",
    tomografii: "tomografii",
    tomografia: "tomografia",
    tomograficzna: "tomograficzna",
    tomograficznej: "tomograficznej",
    ultrasonografii: "ultrasonografii",
    ultrasonografia: "ultrasonografia",
    ultrasonograficzna: "ultrasonograficzna",
    echografii: "echografii",
    echografia: "echografia",
    rezonansu: "rezonansu",
    rezonans: "rezonans",
    magnetycznego: "magnetycznego",
    magnetycznym: "magnetycznym",
    magnetyczne: "magnetyczne",
    spin: "spin",
    spinu: "spinu",
    sekwencji: "sekwencji",
    sekwencja: "sekwencja",
    sekwencje: "sekwencje",
    implanty: "implanty",
    implantow: "implantów",
    kontrast: "kontrast",
    kontrastu: "kontrastu",
    kontrastem: "kontrastem",
    kontrastowe: "kontrastowe",
    kontrastowy: "kontrastowy",
    kontrastowa: "kontrastowa",
    detektory: "detektory",
    detektorow: "detektorów",
    detektor: "detektor",
    rekonstrukcja: "rekonstrukcja",
    rekonstrukcji: "rekonstrukcji",
    rekonstrukcje: "rekonstrukcję",
    artefakty: "artefakty",
    artefaktow: "artefaktów",
    artefakt: "artefakt",
    dawka: "dawka",
    dawki: "dawki",
    dawke: "dawkę",
    dawce: "dawce",
    dawek: "dawek",
    dozymetria: "dozymetria",
    dozymetrii: "dozymetrii",
    promieniotwórczość: "promieniotwórczość",
    promieniotworczosc: "promieniotwórczość",
    promieniotwórczy: "promieniotwórczy",
    promieniotworczy: "promieniotwórczy",
    promieniotwórcze: "promieniotwórcze",
    promieniotworcze: "promieniotwórcze",
    jonizujace: "jonizujące",
    jonizujacy: "jonizujący",
    niejonizujace: "niejonizujące",
    niejonizujacy: "niejonizujący",
    mikrofale: "mikrofale",
    mikrofal: "mikrofal",
    laser: "laser",
    lasery: "lasery",
    laserow: "laserów",
    lasera: "lasera",
    anoda: "anoda",
    anody: "anody",
    filtracja: "filtracja",
    filtracji: "filtracji",
    filtracje: "filtrację",
    gabinecie: "gabinecie",
    gabinet: "gabinet",
    bezpieczenstwo: "bezpieczeństwo",
    bezpieczenstwa: "bezpieczeństwa",
    slych: "słuch",
    sluch: "słuch",
    sluchu: "słuchu",
    sluchowe: "słuchowe",
    sluchowy: "słuchowy",
    sluchowa: "słuchowa",
    progi: "progi",
    prog: "próg",
    progu: "progu",
    progow: "progów",
    audiometria: "audiometria",
    audiometrii: "audiometrii",
    fale: "fale",
    fal: "fal",
    fali: "fali",
    dzwiekowe: "dźwiękowe",
    dzwiekowych: "dźwiękowych",
    dzwiekowa: "dźwiękowa",
    dzwiekowy: "dźwiękowy",
    dzwieku: "dźwięku",
    dzwiek: "dźwięk",
    czestotliwosci: "częstotliwości",
    czestotliwosc: "częstotliwość",
    czestotliwosciowa: "częstotliwościowa",
    sondy: "sondy",
    sonda: "sonda",
    sond: "sond",
    doppler: "Doppler",
    dopplera: "Dopplera",
    zastosowania: "zastosowania",
    zastosowanie: "zastosowanie",
    zastosowan: "zastosowań",
    kliniczne: "kliniczne",
    kliniczna: "kliniczna",
    kliniczny: "kliniczny",
    klinicznych: "klinicznych",
    glebokosc: "głębokość",
    glebokosci: "głębokości",
    rozdzielczosc: "rozdzielczość",
    rozdzielczosci: "rozdzielczości",
    rozdzielcza: "rozdzielcza",
    rozdzielczej: "rozdzielczej",
    rozdzielcze: "rozdzielcze",
    rozdzielczy: "rozdzielczy",
    rozdzielczość: "rozdzielczość",
  }),
);

function buildReferenceMap(...texts) {
  const map = new Map(STATIC_PL_MAP);
  for (const text of texts) {
    if (!text) continue;
    const words = text.match(/[\p{L}]+(?:'[\p{L}]+)?/gu) ?? [];
    for (const word of words) {
      if (!/[ąćęłńóśźż]/iu.test(word)) continue;
      const key = toAsciiKey(word);
      // Nie mapuj długich słów ze stemu pytania na krótsze klucze (fałszywe dopasowania).
      if (key.length < 4) continue;
      if (!map.has(key)) {
        map.set(key, word);
      }
    }
  }
  return map;
}

function preserveCase(source, replacement) {
  if (source === source.toUpperCase()) return replacement.toUpperCase();
  if (source[0] === source[0]?.toUpperCase()) {
    return replacement.charAt(0).toUpperCase() + replacement.slice(1);
  }
  return replacement;
}

function postProcessPolish(text) {
  return text
    .replace(/\bkrótsza fale\b/g, "krótsze fale")
    .replace(/\bmają krótsze fale\b/g, "mają krótsze fale");
}

function restorePolishDiacritics(text, referenceTexts) {
  if (!text) return text;
  const map = buildReferenceMap(...referenceTexts, text);
  const restored = text.replace(/[\p{L}]+(?:'[\p{L}]+)?/gu, (word) => {
    if (/[ąćęłńóśźż]/iu.test(word)) return word;
    const key = toAsciiKey(word);
    const repl = map.get(key);
    if (!repl) return word;
    return preserveCase(word, repl);
  });
  return postProcessPolish(restored);
}

const GREEK_UNICODE = {
  α: "\\alpha",
  β: "\\beta",
  γ: "\\gamma",
  δ: "\\delta",
  Δ: "\\Delta",
  ε: "\\epsilon",
  θ: "\\theta",
  λ: "\\lambda",
  μ: "\\mu",
  ν: "\\nu",
  π: "\\pi",
  ρ: "\\rho",
  σ: "\\sigma",
  τ: "\\tau",
  φ: "\\phi",
  ω: "\\omega",
  Ω: "\\Omega",
  Σ: "\\Sigma",
};

function replaceGreekLetters(s) {
  let out = s;
  for (const [u, cmd] of Object.entries(GREEK_UNICODE)) {
    out = out.split(u).join(cmd);
  }
  return out;
}

function normalizeWordGreek(s) {
  return s
    .replace(/\blambda\b/gi, "\\lambda")
    .replace(/\balpha\b/gi, "\\alpha")
    .replace(/\bbeta\b/gi, "\\beta")
    .replace(/\bgamma\b/gi, "\\gamma")
    .replace(/\bomega\b/gi, "\\omega")
    .replace(/\bDelta\b/g, "\\Delta")
    .replace(/\bepsilon\b/gi, "\\epsilon")
    .replace(/\btheta\b/gi, "\\theta")
    .replace(/\bmu\b/gi, "\\mu")
    .replace(/\bnu\b/gi, "\\nu")
    .replace(/\brho\b/gi, "\\rho")
    .replace(/\bsigma\b/gi, "\\sigma")
    .replace(/\btau\b/gi, "\\tau")
    .replace(/\bphi\b/gi, "\\phi")
    .replace(/\bpi\b/gi, "\\pi");
}

const FORMULA_LHS =
  /^[A-Za-z](?:_\{?[A-Za-z0-9]+\}?)?(?:\^\{?\d+\}?)?$|^[A-Za-z]{1,3}\d?$/;

function isFormulaLhs(token) {
  const t = token.trim();
  if (FORMULA_LHS.test(t)) return true;
  if (/^(I|N|E|D|R|T|P|V|A|B|H|M|Q|U|J|W|G|S|L|F|X|Y|Z|Re|NA|LET|SNR|T1|T2|v_k|pV|nRT)$/i.test(t))
    return true;
  return false;
}

function convertFormulaExpression(expr) {
  let s = expr.trim();
  if (!s) return s;

  // Unicode lambda variants
  s = s.replace(/ƛ/g, "\\lambda");
  s = s.replace(/½/g, "\\tfrac{1}{2}");
  s = s.replace(/\bmv2\b/gi, "mv^2");
  s = s.replace(/\bMv2\b/gi, "Mv^2");
  s = s.replace(/\bc2\b/gi, "c^2");
  s = s.replace(/\bmc2\b/gi, "mc^2");

  // Malus / intensity: I = I sin -> I = I_0 sin
  s = s.replace(/\bI\s*=\s*I\s+(sin|cos|tan)/gi, "I = I_0 $1");

  // Remove trailing artifact from I₀ corruption
  s = s.replace(/\s+o\s*$/i, "");

  // Unicode math italic cleanup (𝑠𝑖𝑛 etc.) — strip to ASCII first
  s = s.normalize("NFKD").replace(/\p{M}/gu, "");

  s = replaceGreekLetters(s);
  s = normalizeWordGreek(s);

  s = s
    .replace(/\btg\s*\(/gi, "\\tan(")
    .replace(/\btg\b/gi, "\\tan")
    .replace(/\bsin2\s*\(/gi, "\\sin^2(")
    .replace(/\bcos2\s*\(/gi, "\\cos^2(")
    .replace(/\bsin\s*\(/gi, "\\sin(")
    .replace(/\bcos\s*\(/gi, "\\cos(")
    .replace(/\bcos\^(\d+)/gi, "\\cos^{$1}")
    .replace(/\bsin\^(\d+)/gi, "\\sin^{$1}")
    .replace(/\btan\^(\d+)/gi, "\\tan^{$1}")
    .replace(/\bcos\s*\(/gi, "\\cos(")
    .replace(/\bsin\s*\(/gi, "\\sin(")
    .replace(/\btan\s*\(/gi, "\\tan(")
    .replace(/\bln\s*\(/gi, "\\ln(")
    .replace(/\blog\s*\(/gi, "\\log(")
    .replace(/\bexp\s*\(/gi, "\\exp(");

  s = s.replace(/e\^\(([^)]+)\)/gi, "e^{$1}");
  s = s.replace(/\bI\s*_\s*0\b/g, "I_0");
  s = s.replace(/\bI\s+o\b/gi, "I_0");
  s = s.replace(/\bI\s*\(\s*0\s*\)/g, "I_0");
  s = s.replace(/\bN\s*\(\s*0\s*\)/g, "N_0");

  // Powers: cos^2(, sin^2(, x^2, 10^-9, e-λt
  s = s.replace(/(\w)\^(\d+)/g, "$1^{$2}");
  s = s.replace(/10\s*\^\s*-\s*(\d+)/g, "10^{-$1}");
  s = s.replace(/10\s*\^\s*(\d+)/g, "10^{$1}");
  s = s.replace(/e\s*-\s*\\lambda\s*t/gi, "e^{-\\lambda t}");
  s = s.replace(/e\s*-\s*λ\s*t/gi, "e^{-\\lambda t}");
  s = s.replace(/e\s*-\s*([a-zA-Z])\s*t/g, "e^{-$1 t}");
  s = s.replace(/e\s*\\lambda\s*t/gi, "e^{\\lambda t}");

  // Multiplication
  s = s.replace(/\s*\*\s*/g, " \\cdot ");
  s = s.replace(/\s+x\s+/g, " \\times ");

  // Fractions a/b -> \dfrac — only when no nested parentheses
  s = s.replace(
    /(?<![\\w$])([^\s/()+\-*]+)\s*\/\s*([^\s/()+\-*]+)(?![\\w$])/g,
    (match, num, den) => {
      if (/[ąćęłńóśźż]/i.test(match)) return match;
      if (/[()]/.test(num) || /[()]/.test(den)) return match;
      return `\\dfrac{${num}}{${den}}`;
    },
  );
  // Remaining (expr)/(expr) one level deep
  s = s.replace(
    /(?<![\\w$])\(([^()]+)\)\s*\/\s*\(([^()]+)\)/g,
    "\\dfrac{$1}{$2}",
  );
  s = s.replace(
    /(?<![\\w$])([A-Za-z0-9_^\\{}]+)\s*\/\s*\(([^()]+)\)/g,
    "\\dfrac{$1}{$2}",
  );

  // Subscripts like v_k, T_1
  s = s.replace(/([A-Za-z])_([a-zA-Z0-9]+)/g, "$1_{$2}");

  // Spacing around operators
  s = s.replace(/\s*=\s*/g, " = ");
  s = s.replace(/\s{2,}/g, " ").trim();

  return s;
}

function looksLikeFormula(text) {
  const t = text.trim();
  if (!t) return false;
  if (/\$[^$]+\$/.test(t)) return false;
  if (/^[\p{L}\s,.:;()\-–—]+$/u.test(t) && !/[=^\\/_]/.test(t)) return false;
  return (
    /=/.test(t) ||
    /\^/.test(t) ||
    /_\d/.test(t) ||
    /\\(sin|cos|tan|log|ln|exp|dfrac|lambda|alpha|beta|mu|nu|rho|eta|pi)/.test(t) ||
    /\b(sin|cos|tan|tg|log|ln|exp)\s*\(/i.test(t) ||
    /\b(sin2|cos2|sin\^|cos\^)/i.test(t) ||
    /\be-\s*\\?lambda/i.test(t) ||
    /\d+\s*\/\s*\d+/.test(t) ||
    /^[A-Za-z0-9_\\^+\-*/().,\s\\{}]+$/.test(t.replace(/[αλβγδεθλμπρστφω]/g, "x"))
  );
}

function wrapFormula(text) {
  const inner = convertFormulaExpression(text);
  return `$${inner}$`;
}

function splitByMathSegments(text) {
  const parts = [];
  const re = /\$[^$\n]+\$/g;
  let last = 0;
  for (const m of text.matchAll(re)) {
    if (m.index > last) parts.push({ type: "text", value: text.slice(last, m.index) });
    parts.push({ type: "math", value: m[0] });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({ type: "text", value: text.slice(last) });
  return parts.length ? parts : [{ type: "text", value: text }];
}

function fixBrokenNewlineSymbols(text) {
  return text.replace(/\\n([A-Za-z])/g, (_, g1) => `$${g1}$`);
}

function wrapStemSymbols(text) {
  let s = fixBrokenNewlineSymbols(text);
  // Actual newline before single letter in parens: (\np) -> ($p$)
  s = s.replace(/\(\s*\n\s*([A-Za-z])\s*\)/g, (_, g1) => `($${g1}$)`);
  // Single-letter variables in parens: (α - kąt ...), (h - stała)
  s = s.replace(/\(([αβγδεθλμπρστφωΔΣΩ])\s*[-–—]/g, (_, g1) => `($${g1}$ -`);
  s = s.replace(/\(([a-zA-Z])\s*[-–—]/g, (_, v) => `($${v}$ -`);
  return s;
}

function latexifyTextSegment(segment, { aggressive = false } = {}) {
  let s = fixBrokenNewlineSymbols(segment);

  // Named formulas in explanations: "Wzór Abbego: d = ..."
  s = s.replace(
    /((?:Wzór|równanie|Równanie|wzór|Prawo [^:]+:)\s*)([A-Za-z0-9_\\^+\-*/(). λαβγΔ]+(?:\s*=\s*[A-Za-z0-9_\\^+\-*/(). λαβγΔ]+)+)/gi,
    (match, prefix, expr) => {
      if (expr.includes("$")) return match;
      if (!looksLikeFormula(expr) || expr.length > 100) return match;
      return `${prefix}${wrapFormula(expr)}`;
    },
  );

  // Inline formulas in explanation (lambda = ..., n_1 * sin...)
  s = s.replace(
    /\b(lambda\s*=\s*[^.,;:!?\n]+(?:=\s*[^.,;:!?\n]+)?)/gi,
    (match) => {
      if (match.includes("$")) return match;
      return wrapFormula(convertFormulaExpression(match));
    },
  );

  // Standalone formula after colon in explanation
  s = s.replace(
    /:\s*([A-Za-z\\_^0-9]+\s*=\s*[^.,;:!?\n]+?)(?=[.,;:!?\n]|$)/g,
    (match, expr) => {
      if (expr.includes("$")) return match;
      if (/[ąćęłńóśźż]/i.test(expr)) return match;
      if (!looksLikeFormula(expr.trim()) || expr.length > 70) return match;
      return `: ${wrapFormula(expr.trim())}`;
    },
  );

  // Scientific notation 10^-9
  s = s.replace(/(?<!\$)\b10\s*\^\s*-?\d+\b(?!\$)/g, (m) => wrapFormula(m));

  // Subscript energy notation E_elektronowa
  s = s.replace(
    /\bE_(elektronowa|oscylacyjna|rotacyjna)\b/gi,
    (_, tag) => wrapFormula(`E_{${tag.toLowerCase()}}`),
  );

  return s;
}

function latexifyField(text, { aggressive = false } = {}) {
  if (!text?.trim()) return text;

  const parts = splitByMathSegments(text);
  return parts
    .map((part) =>
      part.type === "math" ? part.value : latexifyTextSegment(part.value, { aggressive }),
    )
    .join("");
}

function latexifyOption(text) {
  if (!text?.trim()) return text;
  let s = text.trim();
  if (s.startsWith("$") && s.endsWith("$")) return s;

  // Pure formula options
  if (looksLikeFormula(s)) {
    return wrapFormula(s);
  }

  // Mixed text + formula rare in options
  return latexifyField(s, { aggressive: true });
}

function processQuestion(row) {
  const references = [row.text, ...(row.options ?? []).map((o) => o.text)];
  const changes = [];

  let text = row.text;
  let explanation = row.explanation;
  let options = (row.options ?? []).map((o) => ({ ...o }));

  const newText = latexifyField(wrapStemSymbols(restorePolishDiacritics(text, references)), {
    aggressive: false,
  });
  if (newText !== text) {
    changes.push("text");
    text = newText;
  }

  const refsForExpl = [row.text, ...options.map((o) => o.text), text];
  const newExpl = latexifyField(
    restorePolishDiacritics(explanation, refsForExpl),
    { aggressive: false },
  );
  if (newExpl !== explanation) {
    changes.push("explanation");
    explanation = newExpl;
  }

  options = options.map((opt) => {
    const restored = restorePolishDiacritics(opt.text, [text, explanation, ...references]);
    const latexed = latexifyOption(restored);
    if (latexed !== opt.text) changes.push(`option-${opt.id}`);
    return { ...opt, text: latexed };
  });

  return {
    ...row,
    text,
    explanation,
    options,
    changed: changes.length > 0,
    changes: [...new Set(changes)],
  };
}

function rowToUpdateSQL(row) {
  const optionsJSON = JSON.stringify(row.options ?? []).replace(/'/g, "''");
  return `UPDATE public.questions
   SET text = '${escapeSQL(row.text)}',
       options = '${optionsJSON}'::jsonb,
       explanation = '${escapeSQL(row.explanation)}'
 WHERE id = '${escapeSQL(row.id)}';`;
}

function rowToRollbackSQL(row) {
  const optionsJSON = JSON.stringify(row.options ?? []).replace(/'/g, "''");
  return `UPDATE public.questions
   SET text = '${escapeSQL(row.text)}',
       options = '${optionsJSON}'::jsonb,
       explanation = '${escapeSQL(row.explanation)}'
 WHERE id = '${escapeSQL(row.id)}';`;
}

async function main() {
  const apply = process.argv.includes("--apply");
  const dryRun = process.argv.includes("--dry-run") || !apply;

  loadEnvLocal();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Brak NEXT_PUBLIC_SUPABASE_URL lub SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const supabase = createClient(url, key);

  const { data: topics, error: topicsError } = await supabase
    .from("topics")
    .select("id")
    .eq("subject_id", SUBJECT_ID);
  if (topicsError) throw topicsError;

  const topicIds = topics.map((t) => t.id);
  const { data: rows, error } = await supabase
    .from("questions")
    .select("*")
    .in("topic_id", topicIds)
    .eq("is_active", true)
    .order("id");
  if (error) throw error;

  console.log(`Pobrano ${rows.length} pytań biofizyki.`);

  const processed = rows.map((row) => processQuestion(row));
  const changed = processed.filter((r) => r.changed);

  mkdirSync(resolve("exports"), { recursive: true });
  mkdirSync(resolve("scripts"), { recursive: true });

  const rollbackHeader = `-- ============================================================
-- ROLLBACK: biofizyka — przed audytem KaTeX + polskie znaki
-- Data:     ${new Date().toISOString()}
-- Pytań:    ${rows.length}
--
-- Przywraca text, options, explanation sprzed edycji.
-- Uruchom w Supabase SQL Editor → Run.
-- ============================================================

BEGIN;

`;

  const rollbackBody = rows.map((row) => rowToRollbackSQL(row)).join("\n\n");
  writeFileSync(
    resolve(ROLLBACK_SQL),
    `${rollbackHeader}${rollbackBody}\n\nCOMMIT;\n`,
    "utf8",
  );

  writeFileSync(
    resolve(BACKUP_JSON),
    JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        subjectId: SUBJECT_ID,
        count: rows.length,
        questions: rows.map((r) => ({
          id: r.id,
          topic_id: r.topic_id,
          text: r.text,
          options: r.options,
          correct_option_id: r.correct_option_id,
          explanation: r.explanation,
        })),
      },
      null,
      2,
    ),
    "utf8",
  );

  const applyHeader = `-- ============================================================
-- APPLY: biofizyka — audyt KaTeX + polskie znaki
-- Data:     ${new Date().toISOString()}
-- Zmienionych pytań: ${changed.length} / ${rows.length}
-- Rollback: ${ROLLBACK_SQL}
-- ============================================================

BEGIN;

`;

  const applyBody = changed.map((row) => rowToUpdateSQL(row)).join("\n\n");
  writeFileSync(
    resolve(APPLY_SQL),
    `${applyHeader}${applyBody}\n\nCOMMIT;\n`,
    "utf8",
  );

  const audit = {
    generatedAt: new Date().toISOString(),
    total: rows.length,
    changed: changed.length,
    unchanged: rows.length - changed.length,
    byTopic: {},
    samples: changed.slice(0, 30).map((r) => ({
      id: r.id,
      topic_id: r.topic_id,
      changes: r.changes,
      before: {
        text: rows.find((x) => x.id === r.id)?.text,
        explanation: rows.find((x) => x.id === r.id)?.explanation?.slice(0, 200),
      },
      after: {
        text: r.text?.slice(0, 200),
        explanation: r.explanation?.slice(0, 200),
      },
    })),
  };

  for (const r of changed) {
    audit.byTopic[r.topic_id] = (audit.byTopic[r.topic_id] ?? 0) + 1;
  }

  writeFileSync(resolve(AUDIT_JSON), JSON.stringify(audit, null, 2), "utf8");

  console.log(`Rollback SQL → ${ROLLBACK_SQL}`);
  console.log(`Backup JSON → ${BACKUP_JSON}`);
  console.log(`Apply SQL   → ${APPLY_SQL} (${changed.length} UPDATE)`);
  console.log(`Audit JSON  → ${AUDIT_JSON}`);

  if (dryRun) {
    console.log("\nDry-run — nic nie zapisano do Supabase.");
    return;
  }

  console.log("\nStosuję zmiany w Supabase…");
  let ok = 0;
  let fail = 0;
  for (const row of changed) {
    const { error: updErr } = await supabase
      .from("questions")
      .update({
        text: row.text,
        options: row.options,
        explanation: row.explanation,
      })
      .eq("id", row.id);
    if (updErr) {
      console.error(`FAIL ${row.id}:`, updErr.message);
      fail += 1;
    } else {
      ok += 1;
    }
  }
  console.log(`Gotowe: ${ok} OK, ${fail} FAIL.`);
  if (fail > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
