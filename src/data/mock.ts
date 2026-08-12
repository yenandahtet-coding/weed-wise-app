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
  boundingBoxes?: { x: number; y: number; w: number; h: number; confidence: number; class_name: string }[];
  geminiData?: any;
};

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
