export type SubjectRycina = {
  /** 64 px currentColor mark — use via RycinaEmblem. */
  emblem?: string;
  /** Sage/gold plate — use via Rycina (img). */
  plate?: string;
};

export type EmptyRycinaKind = "reviews" | "saved" | "stats" | "achievements" | "session";

const LDEW_BY_ID: Record<string, SubjectRycina> = {
  "ldew-stomatologia-zachowawcza": {
    plate: "ldew-card-zachowawcza",
    emblem: "ldew-zachowawcza",
  },
  "ldew-endodoncja": { plate: "ldew-card-endodoncja", emblem: "ldew-endodoncja" },
  "ldew-periodontologia": {
    plate: "ldew-card-periodontologia",
    emblem: "ldew-periodontologia",
  },
  "ldew-choroby-sluzowki": { plate: "ldew-card-sluzowka", emblem: "ldew-sluzowka" },
  "ldew-stomatologia-dziecieca": { plate: "ldew-card-pedo", emblem: "ldew-pedo" },
  "ldew-ortodoncja": { plate: "ldew-card-ortodoncja", emblem: "ldew-ortodoncja" },
  "ldew-protetyka": { plate: "ldew-card-protetyka", emblem: "ldew-protetyka" },
  "ldew-chirurgia-stomatologiczna": {
    plate: "ldew-card-chirurgia",
    emblem: "ldew-chirurgia",
  },
  "ldew-chirurgia-szczekowo-twarzowa": {
    plate: "ldew-card-chst",
    emblem: "ldew-chst",
  },
  "ldew-radiologia": { plate: "ldew-card-radiologia", emblem: "ldew-radiologia" },
  "ldew-orzecznictwo": {
    plate: "ldew-card-orzecznictwo",
    emblem: "ldew-orzecznictwo",
  },
};

/** KNNP keys after `stoma-` / `lek-` (or bare canonical ids). */
const KNNP_BY_KEY: Record<string, SubjectRycina> = {
  anatomia: { emblem: "subj-anatomia", plate: "anat-skull-lat" },
  angielski: { emblem: "subj-angielski", plate: "anat-tongue" },
  histologia: { emblem: "subj-histologia", plate: "histo-plate-enamel" },
  biofizyka: { emblem: "subj-biofizyka", plate: "anat-eye" },
  biologia: { emblem: "subj-biologia", plate: "anat-hand" },
  "biologia-mol": { emblem: "subj-biologia-mol", plate: "anat-brain-sagittal" },
  chemia: { plate: "pharma-aconitum" },
  biochemia: { plate: "pharma-hellebore" },
  patologia: { emblem: "subj-patologia", plate: "anat-lungs-line" },
  fizjologia: { emblem: "subj-fizjologia", plate: "anat-heart" },
  "mikrobio-ju": { emblem: "subj-mikrobio-ju", plate: "anat-permanent-arch" },
  farmakologia: { emblem: "subj-farmakologia", plate: "pharma-opium-poppy" },
  zakazne: { emblem: "subj-zakazne", plate: "anat-lungs-line" },
  "prof-humanizm": { emblem: "subj-prof-humanizm", plate: "anat-hand" },
  immunologia: { emblem: "subj-immunologia", plate: "anat-thorax" },
  patofizjologia: { emblem: "subj-patofizjologia", plate: "anat-aorta" },
  socjologia: { emblem: "subj-socjologia", plate: "scene-doctor" },
  "narzad-zucia": { emblem: "subj-narzad-zucia", plate: "anat-masseter" },
};

const EMPTY_BY_KIND: Record<EmptyRycinaKind, string> = {
  reviews: "empty-reviews",
  saved: "empty-saved",
  stats: "empty-stats",
  achievements: "empty-achievements",
  session: "empty-session",
};

const RANK_PREFIX = "rank-";
const ACH_PREFIX = "ach-";
const ACH_WITHOUT_FILE = new Set(["wszechstronny"]);

function knnpKey(subjectId: string): string {
  if (subjectId.startsWith("stoma-") || subjectId.startsWith("lek-")) {
    return subjectId.slice(subjectId.indexOf("-") + 1);
  }
  return subjectId;
}

export function subjectRycina(subjectId: string): SubjectRycina | undefined {
  const ldew = LDEW_BY_ID[subjectId];
  if (ldew) return ldew;
  return KNNP_BY_KEY[knnpKey(subjectId)];
}

export function rankRycinaId(rankId: string): string {
  return `${RANK_PREFIX}${rankId}`;
}

/** Atlas mark for an achievement, or undefined when the SVG was never produced. */
export function achievementRycinaId(achievementId: string): string | undefined {
  if (ACH_WITHOUT_FILE.has(achievementId)) return undefined;
  return `${ACH_PREFIX}${achievementId}`;
}

export function emptyRycinaId(kind: EmptyRycinaKind): string {
  return EMPTY_BY_KIND[kind];
}

export const SESSION_MODE_RYCINA = {
  inteligentnaPlate: "sky-antares",
  przegladEmblem: "mode-przeglad",
  katalogEmblem: "mode-katalog",
  loadingPlate: "sky-antares",
  summaryPlate: "sec-progress-brain",
} as const;

export const DASHBOARD_RYCINA = {
  pulpitPlate: "sky-kalibra",
  statsPlate: "erythroxylon",
  achievementsPlate: "miedzioryt-postacie-kontur",
  settingsPlate: "armillar",
} as const;
