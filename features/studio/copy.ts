export const CONTACT_EMAIL = "info@zenitlabs.pl";
export const PRODUCT_HREF = "https://kursnaldek.pl";

export const studioMeta = {
  title: "Zenit Labs — innowacje w stomatologii i MedEdTech",
  description:
    "Zenit Labs. Oprogramowanie dla stomatologii i edukacji medycznej. Kurs na LDEK, silnik wyjaśnień ANTARES, półfinalista EEC Startup Challenge 2026. info@zenitlabs.pl",
} as const;

export const studioCopy = {
  nav: {
    studio: "Studio",
    work: "Praca",
    contact: "Kontakt",
  },
  hero: {
    award: "Półfinalista EEC Startup Challenge 2026",
    h1: ["Innowacje w stomatologii", "i MedEdTech."],
    lead: "Robimy oprogramowanie dla studentów stomatologii i lekarzy dentystów. Studio powstało wokół jednej dziedziny: jak się jej uczyć i jak z niej korzystać w zawodzie. Pierwszy produkt to Kurs na LDEK.",
    ctaPrimary: "info@zenitlabs.pl",
    ctaSecondary: "Praca",
  },
  purpose: {
    label: "Studio",
    h2: "Oprogramowanie dla stomatologii i edukacji medycznej.",
    paragraphs: [
      "Zenit Labs jest studiem produktowym. Siedzi w nim zespół, który zna LDEK od strony nauki: przedmioty, język pytań i to, jak wygląda wieczór przed terminem.",
      "Chirurgia, protetyka, periodontologia, farmakologia przy fotelu — każda z tych rzeczy ma własny rytm. Pytania, wyjaśnienia i powtórki muszą to unieść. Dlatego silnik, baza i logika powtórek są u nas.",
      "Pracujemy nad kolejnymi narzędziami w tej samej dziedzinie. Kurs na LDEK jest pierwszym, które wyszło do ludzi i ma dziś płacących użytkowników.",
    ],
  },
  focus: {
    h2: "Czym się zajmujemy",
    items: [
      {
        title: "Innowacje",
        body: "Szukamy sposobów, żeby nauka stomatologii szła bliżej tego, jak zapamiętuje się decyzje kliniczne. W Kursie na LDEK widać to w wyjaśnieniach ANTARES i w powtórkach liczonych przez FSRS.",
      },
      {
        title: "Rozwiązania",
        body: "Projektujemy gotowe produkty: od układu ekranu po konto i płatność. Jeden zespół prowadzi Kurs na LDEK od pierwszego pytania do rozliczenia w Stripe.",
      },
      {
        title: "MedEdTech",
        body: "Technologia edukacyjna pisana dla stomatologii. Egzamin, przedmiot, wyjaśnienie i powtórka mówią tym samym językiem od początku do końca.",
      },
    ],
  },
  audience: {
    label: "Dla kogo",
    h2: "Kto z tego korzysta.",
    items: [
      {
        title: "Studenci stomatologii",
        body: "Osoby, które uczą się do LDEK i chcą przechodzić pytania z wyjaśnieniem, a potem wracać do tego, co jeszcze siada.",
      },
      {
        title: "Lekarze dentyści",
        body: "Ci, którzy wracają do materiału po dyplomie albo porządkują wiedzę przed kolejnym egzaminem.",
      },
      {
        title: "Zespoły z pomysłem",
        body: "Ludzie, którzy chcą zbudować kolejne narzędzie w stomatologii albo MedEdTech. Wtedy piszecie na maila i opowiadacie, o co chodzi.",
      },
    ],
  },
  work: {
    label: "Praca",
    h2: "Kurs na LDEK",
    intro:
      "Platforma do nauki do Lekarsko-Dentystycznego Egzaminu Końcowego. Student wchodzi w sesję, rozwiązuje pytania i po odpowiedzi dostaje wyjaśnienie.",
    details: [
      {
        title: "ANTARES",
        body: "Nasz silnik wyjaśnień. Układa uzasadnienie tak, żeby dało się z niego wrócić do tematu: dlaczego ta odpowiedź, skąd ta decyzja, co z tym zrobić przy następnym podobnym pytaniu.",
      },
      {
        title: "Powtórki",
        body: "Odstępy liczy FSRS. System pamięta, które pytanie wraca za wcześnie, a które można odłożyć. Nauka idzie za pamięcią, kalendarzem.",
      },
      {
        title: "Produkt",
        body: "Konta, płatności, katalog pytań i sesja są częścią jednego systemu. Z platformy korzystają dziś płacący użytkownicy.",
      },
    ],
    link: "kursnaldek.pl",
  },
  award: {
    label: "EEC",
    h2: ["Półfinalista", "EEC Startup Challenge", "2026"],
    paragraphs: [
      "EEC Startup Challenge to ścieżka startupowa Europejskiego Kongresu Gospodarczego w Katowicach. W 2026 trafiliśmy do półfinału z Kursem na LDEK.",
    ],
  },
  craft: {
    label: "Od środka",
    h2: "Jak to zbudowaliśmy.",
    paragraphs: [
      "Kurs na LDEK napisaliśmy w Next.js i TypeScript. Dane leżą w Supabase, na Postgresie, z RLS. Płatności idą przez Stripe, hosting przez Vercel.",
      "ANTARES i logika powtórek FSRS są częścią tego samego kodu. Schemat bazy też. Jak coś zmienia się w kursie, zmienia się u nas.",
    ],
    stack:
      "Next.js 16, React 19, TypeScript, Tailwind, Supabase z Postgresem i RLS, Stripe, Vercel.",
  },
  contact: {
    h2: "Kontakt",
    body: "Odpisuje ktoś z zespołu. W sprawie kursu, współpracy albo zwykłego pytania.",
  },
} as const;
