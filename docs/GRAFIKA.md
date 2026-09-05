# Grafika platformy — Kurs na LDEK

Ciemny, leśny interfejs: głęboka zieleń, ciepły krem tekstu, złoto jako akcent. Wszystkie tokeny żyją w `app/globals.css` (`@theme`) i są dostępne jako klasy Tailwind (`bg-background`, `text-brand-gold`, `font-heading` itd.).

## Czcionki

Dwie rodziny z Google Fonts, ładowane w `app/layout.tsx` przez `next/font` (subset `latin` + `latin-ext` — polskie znaki).

| Rola | Rodzina | Wagi | Klasa / token |
|------|---------|------|----------------|
| Nagłówki | **DM Serif Display** | 400 | `font-heading` / `--font-heading` |
| Treść i cały UI | **DM Sans** | 400, 500, 600, 700 | `font-body` / `--font-body` |

Serif tylko na tytułach. Reszta — w tym przyciski, nawigacja, etykiety, wykresy — to DM Sans. Domyślnie `html` ma 15 px, interlinia 1.55.

Skala: `text-heading-xl` (28) → `heading-sm` (18) oraz `text-body-lg` (17) → `body-xs` (11).

## Kolory

Paleta jest ciemna i ciepła. Nie używamy czystej bieli ani czerni.

**Powierzchnie**

| Token | Hex | Do czego |
|-------|-----|----------|
| `background` / `brand-bg` | `#002A27` | tło aplikacji |
| `sidebar` | `#051615` | pasek boczny |
| `card` / `brand-card-1` | `#0a2322` | karty |
| `card-hover` / `brand-card-2` | `#0d2b2a` | hover karty |
| `border` | `#163b39` | linie, obramowania |
| `brand-accent` | `#003932` | ciemniejsza zieleń |
| `brand-accent-2` | `#274E34` | średnia zieleń |

**Akcenty**

| Token | Hex | Do czego |
|-------|-----|----------|
| `brand-gold` | `#C9A84C` | CTA, focus, wykresy, wyróżnienia |
| `brand-sage` | `#367368` | interakcje drugiego rzędu (linki, chipy) |

**Tekst**

| Token | Hex | Do czego |
|-------|-----|----------|
| `primary` | `#E8E0D0` | główny tekst (ciepły krem) |
| `secondary` | `#8B9E8B` | opisy, pomocniczy |
| `muted` | `#5a7a6a` | etykiety, hinty |

**Status:** success `#4ADE80` · error `#F87171` · warning `#FBBF24`.

Ekran wyboru pakietu (`gate-*`) ma osobną, jaśniejszą warstwę tych samych barw (np. złoto `#D9B45B`).

## Jak to działa w kodzie

1. **Tokeny CSS** — `app/globals.css` rejestruje kolory, fonty i promienie w `@theme`. Tailwind v4 robi z nich utility (`bg-card`, `text-primary`, `rounded-btn`).
2. **Fonty** — `next/font` wstrzykuje `--font-body` i `--font-heading` na `<html>`. Fallback w CSS: `"DM Sans"` / `"DM Serif Display"`.
3. **Kształty** — karty `14px` (`rounded-card`), przyciski `8px` (`rounded-btn`), pille `24px` (`rounded-pill`).
4. **Ikony** — tylko Lucide (20 px w nawigacji, 16 px inline). Bez emoji.
5. **Ruch** — 200–300 ms, ease-out (`animate-fade-in`, `animate-slide-up`). Bez bounce.
6. **Focus** — złota obwódka 2 px (`:focus-visible`).

W komponencie: tło `bg-background` / `bg-card`, nagłówek `font-heading text-heading-lg text-primary`, akcja `bg-brand-gold text-brand-bg`, link `text-brand-sage hover:text-brand-gold`.
