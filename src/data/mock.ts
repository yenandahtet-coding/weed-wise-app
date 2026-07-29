export type Density = "Low" | "Medium" | "High";

export type WeedSpecies = {
  id: string;
  name: string;
  scientific: string;
  herbicide: {
    name: string;
    activeIngredient: string;
    usage: string;
    suitableCrop: string;
    targetWeed: string;
    applicationMethod: string;
    safety: string;
    ratePerAcre: number; // liters per acre
  };
};

export const WEED_SPECIES: WeedSpecies[] = [
  {
    id: "barnyard",
    name: "Barnyard Grass",
    scientific: "Echinochloa crus-galli",
    herbicide: {
      name: "Pretilachlor 50% EC",
      activeIngredient: "Pretilachlor",
      usage: "Pre-emergence application 3-5 days after transplanting",
      suitableCrop: "Rice (paddy)",
      targetWeed: "Barnyard grass and annual grasses",
      applicationMethod: "Foliar spray with knapsack sprayer",
      safety: "Wear gloves, mask and protective clothing. Avoid inhalation.",
      ratePerAcre: 0.6,
    },
  },
  {
    id: "crabgrass",
    name: "Crabgrass",
    scientific: "Digitaria sanguinalis",
    herbicide: {
      name: "Quizalofop-p-ethyl 5% EC",
      activeIngredient: "Quizalofop-p-ethyl",
      usage: "Post-emergence at 3-5 leaf stage of weeds",
      suitableCrop: "Soybean, groundnut, cotton",
      targetWeed: "Grass weeds including crabgrass",
      applicationMethod: "Foliar spray",
      safety: "Keep away from children and livestock. Use PPE.",
      ratePerAcre: 0.4,
    },
  },
  {
    id: "goosegrass",
    name: "Goosegrass",
    scientific: "Eleusine indica",
    herbicide: {
      name: "Glyphosate 41% SL",
      activeIngredient: "Glyphosate",
      usage: "Non-selective post-emergence, before crop planting",
      suitableCrop: "Fallow land preparation",
      targetWeed: "Broad-spectrum weeds",
      applicationMethod: "Directed foliar spray",
      safety: "Avoid drift to crop plants. Wear full PPE.",
      ratePerAcre: 1.0,
    },
  },
  {
    id: "broadleaf",
    name: "Broadleaf Weed",
    scientific: "Amaranthus viridis",
    herbicide: {
      name: "2,4-D Amine 58% SL",
      activeIngredient: "2,4-Dichlorophenoxyacetic acid",
      usage: "Post-emergence 20-25 days after sowing",
      suitableCrop: "Rice, wheat, maize",
      targetWeed: "Broadleaf weeds",
      applicationMethod: "Foliar spray",
      safety: "Do not spray during flowering. Use PPE.",
      ratePerAcre: 0.5,
    },
  },
  {
    id: "nutgrass",
    name: "Nutgrass",
    scientific: "Cyperus rotundus",
    herbicide: {
      name: "Halosulfuron-methyl 75% WG",
      activeIngredient: "Halosulfuron-methyl",
      usage: "Post-emergence at 3-5 leaf stage",
      suitableCrop: "Sugarcane, maize, rice",
      targetWeed: "Nutgrass and sedges",
      applicationMethod: "Foliar spray with surfactant",
      safety: "Store in cool dry place. Wear PPE.",
      ratePerAcre: 0.09,
    },
  },
];

export type DetectionRecord = {
  id: string;
  date: string;
  time: string;
  location: { name: string; lat: number; lng: number };
  image: string;
  weedId: string;
  weedName: string;
  density: Density;
  confidence: number;
  detectedCount: number;
  coverage: number;
  fieldArea: number;
  areaUnit: "Acre" | "Hectare";
};

const IMGS = [
  "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&q=80",
  "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=800&q=80",
  "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800&q=80",
  "https://images.unsplash.com/photo-1444858291040-58f756a3bdd6?w=800&q=80",
  "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&q=80",
  "https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=800&q=80",
  "https://images.unsplash.com/photo-1523741543316-beb7fc7023d8?w=800&q=80",
  "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=800&q=80",
];

const LOCATIONS = [
  { name: "Yangon, Myanmar", lat: 16.8409, lng: 96.1735 },
  { name: "Mandalay, Myanmar", lat: 21.9588, lng: 96.0891 },
  { name: "Bago, Myanmar", lat: 17.335, lng: 96.4815 },
  { name: "Naypyidaw, Myanmar", lat: 19.7633, lng: 96.0785 },
  { name: "Pathein, Myanmar", lat: 16.7833, lng: 94.7333 },
];

const DENSITIES: Density[] = ["Low", "Medium", "High"];

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

export function generateMockRecords(count = 10): DetectionRecord[] {
  const records: DetectionRecord[] = [];
  const today = new Date();
  for (let i = 0; i < count; i++) {
    const weed = WEED_SPECIES[i % WEED_SPECIES.length];
    const density = DENSITIES[i % 3];
    const d = new Date(today);
    d.setDate(d.getDate() - i * 2);
    records.push({
      id: `rec_${i}_${Math.random().toString(36).slice(2, 8)}`,
      date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
      time: `${pad(8 + (i % 10))}:${pad((i * 7) % 60)}`,
      location: LOCATIONS[i % LOCATIONS.length],
      image: IMGS[i % IMGS.length],
      weedId: weed.id,
      weedName: weed.name,
      density,
      confidence: 78 + ((i * 3) % 20),
      detectedCount: 5 + ((i * 4) % 30),
      coverage: 25 + ((i * 7) % 65),
      fieldArea: 1 + (i % 5) * 0.5,
      areaUnit: i % 2 === 0 ? "Acre" : "Hectare",
    });
  }
  return records;
}

const STORAGE_KEY = "agriscan_records";

export function loadRecords(): DetectionRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  const seed = generateMockRecords(10);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
  return seed;
}

export function saveRecord(rec: DetectionRecord) {
  const all = loadRecords();
  all.unshift(rec);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function getRecord(id: string): DetectionRecord | undefined {
  return loadRecords().find((r) => r.id === id);
}

// Session-only current detection (from scan flow)
const CURRENT_KEY = "agriscan_current_detection";
export function setCurrentDetection(rec: DetectionRecord) {
  sessionStorage.setItem(CURRENT_KEY, JSON.stringify(rec));
}
export function getCurrentDetection(): DetectionRecord | null {
  try {
    const raw = sessionStorage.getItem(CURRENT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
