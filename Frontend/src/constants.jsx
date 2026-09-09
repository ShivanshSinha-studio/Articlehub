export const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || "http://localhost:8000";
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

export const CATEGORIES = [
  { label: "All", value: "" },
  { label: "Physics", value: "physics" },
  { label: "Astronomy", value: "astronomy" },
  { label: "Technology", value: "technology" },
  { label: "Biology", value: "biology" },
  { label: "Earth", value: "earth" },
  { label: "Chemistry", value: "chemistry" },
  { label: "Mathematics", value: "mathematics" },
];

export const CATEGORY_DETAILS = {
  physics: {
    title: "Physics",
    short: "Forces, matter, energy, motion, and the rules beneath reality.",
    theme: "physics",
    metric: "Quantum signals",
  },
  astronomy: {
    title: "Astronomy",
    short: "Stars, planets, cosmic maps, deep time, and everything beyond Earth.",
    theme: "astronomy",
    metric: "Deep sky",
  },
  technology: {
    title: "Technology",
    short: "Systems, AI, software, interfaces, and the tools shaping modern life.",
    theme: "technology",
    metric: "Future stack",
  },
  biology: {
    title: "Biology",
    short: "Cells, ecosystems, evolution, bodies, and the living systems around us.",
    theme: "biology",
    metric: "Living code",
  },
  earth: {
    title: "Earth",
    short: "Climate, geology, oceans, terrain, and the planet we are trying to understand.",
    theme: "earth",
    metric: "Planet systems",
  },
  chemistry: {
    title: "Chemistry",
    short: "Reactions, molecules, materials, and the transformations inside matter.",
    theme: "chemistry",
    metric: "Molecular lab",
  },
  mathematics: {
    title: "Mathematics",
    short: "Patterns, proofs, models, numbers, and the language behind structure.",
    theme: "mathematics",
    metric: "Pure logic",
  },
};

export const CATEGORY_ACCENTS = {
  physics: "bg-indigo-50 text-indigo-700 border-indigo-100",
  astronomy: "bg-violet-50 text-violet-700 border-violet-100",
  technology: "bg-cyan-50 text-cyan-700 border-cyan-100",
  biology: "bg-emerald-50 text-emerald-700 border-emerald-100",
  earth: "bg-lime-50 text-lime-700 border-lime-100",
  chemistry: "bg-amber-50 text-amber-800 border-amber-100",
  mathematics: "bg-rose-50 text-rose-700 border-rose-100",
};

export const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1400",
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&q=80&w=1400",
  "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&q=80&w=1400",
  "https://images.unsplash.com/photo-1517976487492-5750f3195933?auto=format&fit=crop&q=80&w=1400",
];
