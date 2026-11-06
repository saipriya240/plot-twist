export const GENRES = [
  "Romance",
  "Comedy",
  "Drama",
  "Adventure",
  "Coming of Age",
  "Mystery",
  "Slice of Life",
  "A little bit of everything",
];

export const MOODS = [
  "Joyful",
  "Reflective",
  "Adventurous",
  "Calm",
  "Bittersweet",
  "Intense",
  "Playful",
];

export const CHARACTER_CATEGORIES = [
  "Main Character",
  "Best Friend",
  "Family",
  "Special Guest",
  "Supporting Cast",
  "Recurring Character",
];

export const STORYTELLING_STYLES = [
  { value: "cinematic", label: "Cinematic & dramatic", hint: "Big score, slow reveals" },
  { value: "warm", label: "Warm & intimate", hint: "Close-up, honest, tender" },
  { value: "witty", label: "Witty & self-aware", hint: "A narrator who's in on the joke" },
  { value: "poetic", label: "Poetic & reflective", hint: "Quiet voice, long shadows" },
];

export const MEMORY_KINDS = [
  "Everyday moments",
  "People I love",
  "Adventures & travel",
  "Small wins",
  "Big feelings",
  "Places & objects",
];

export const COVERS = [
  "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
];

export const WELCOME_COVER =
  "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1600&q=80";

export const coverFor = (seed = "") => {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) % 99991;
  return COVERS[hash % COVERS.length];
};

export const SEASON_NAMES = [
  "The Beginning",
  "Plot Twist",
  "Becoming Someone New",
  "The In-Between",
  "Everything Changes",
  "A New Chapter",
];

export const pad = (n) => String(n).padStart(2, "0");