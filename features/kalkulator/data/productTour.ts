export const PRODUCT_TOUR_STORAGE_KEY = "kalkulator-product-tour-v1";

export type ProductTourTab = "log" | "reports" | "procedures" | "materials";

export type ProductTourStep = {
  tab: ProductTourTab;
  title: string;
  body: string;
};

export const PRODUCT_TOUR_STEPS: readonly ProductTourStep[] = [
  {
    tab: "log",
    title: "Zaloguj wykonanie",
    body: "Wybierz kafel procedury. Koszyk materiałów jest już wypełniony — użyj +/− tylko gdy zużycie odbiega od normy.",
  },
  {
    tab: "reports",
    title: "Raporty i decyzje",
    body: "Po kilku wizytach zobaczysz marże miesięczne, trendy i konkretne rekomendacje — nie samą diagnozę.",
  },
  {
    tab: "procedures",
    title: "Procedury",
    body: "Edytuj ceny, czasy i domyślne koszyki. Marża liczy się na żywo z kosztów gabinetu.",
  },
] as const;
