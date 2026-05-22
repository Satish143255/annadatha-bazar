export const STATES_DISTRICTS = {
  Telangana: ["Warangal", "Karimnagar", "Khammam", "Nalgonda", "Adilabad"],
  Maharashtra: ["Nashik", "Pune", "Nagpur", "Aurangabad", "Solapur"],
  Karnataka: ["Mysuru", "Belagavi", "Hubballi", "Mandya", "Tumakuru"],
  Punjab: ["Ludhiana", "Amritsar", "Patiala", "Bathinda", "Jalandhar"],
  "Uttar Pradesh": ["Meerut", "Agra", "Lucknow", "Varanasi", "Kanpur"],
  Gujarat: ["Rajkot", "Surat", "Vadodara", "Anand", "Bhuj"],
};

export const CROPS = [
  { id: "rice", name: "Rice", emoji: "Rice" },
  { id: "wheat", name: "Wheat", emoji: "Wheat" },
  { id: "cotton", name: "Cotton", emoji: "Cotton" },
  { id: "tomato", name: "Tomato", emoji: "Tomato" },
  { id: "onion", name: "Onion", emoji: "Onion" },
  { id: "chili", name: "Chili", emoji: "Chili" },
  { id: "turmeric", name: "Turmeric", emoji: "Turmeric" },
  { id: "sugarcane", name: "Sugarcane", emoji: "Sugarcane" },
  { id: "soybean", name: "Soybean", emoji: "Soybean" },
  { id: "groundnut", name: "Groundnut", emoji: "Groundnut" },
  { id: "maize", name: "Maize", emoji: "Maize" },
  { id: "potato", name: "Potato", emoji: "Potato" },
];

export const CATEGORIES = [
  { id: "crop", label: "Crops", icon: "wheat" },
  { id: "livestock", label: "Livestock", icon: "leaf" },
  { id: "service", label: "Services", icon: "tool" },
  { id: "equipment", label: "Equipment", icon: "tractor" },
  { id: "input", label: "Inputs", icon: "seed" },
  { id: "land", label: "Land", icon: "field" },
  { id: "other", label: "Other", icon: "more" },
];

export const LISTING_CATEGORIES = [
  { id: "crop", label: "Crops", icon: "wheat" },
  { id: "seeds", label: "Seeds", icon: "seed" },
  { id: "fertilizer", label: "Fertilizer", icon: "leaf" },
  { id: "pesticide", label: "Pesticides", icon: "drop" },
  { id: "livestock", label: "Livestock", icon: "leaf" },
  { id: "land", label: "Land", icon: "field" },
  { id: "equipment", label: "Equipment", icon: "tractor" },
  { id: "other", label: "Other", icon: "more" },
];

export const SERVICE_TYPES = [
  { id: "rental", label: "Equipment Rental", icon: "tractor", hint: "Tractor, water pump, rotavator" },
  { id: "harvesting", label: "Harvesting", icon: "wheat", hint: "Combine harvester, threshing" },
  { id: "spraying", label: "Spraying / Drone", icon: "drop", hint: "Pesticide and fertilizer spraying" },
  { id: "veterinary", label: "Veterinary", icon: "vet", hint: "AI, vaccination, home visits" },
  { id: "transport", label: "Transport", icon: "truck", hint: "Mandi pickup, cold storage" },
  { id: "labour", label: "Labour", icon: "user", hint: "Daily wage workers, contract" },
  { id: "soil", label: "Soil & Lab", icon: "field", hint: "Soil and water testing" },
  { id: "other", label: "Other Service", icon: "tool", hint: "Something else" },
];

export const LANGUAGES = [
  { code: "en", name: "English", native: "English" },
  { code: "hi", name: "Hindi", native: "Hindi" },
  { code: "te", name: "Telugu", native: "Telugu" },
  { code: "kn", name: "Kannada", native: "Kannada" },
  { code: "ta", name: "Tamil", native: "Tamil" },
  { code: "ml", name: "Malayalam", native: "Malayalam" },
  { code: "mr", name: "Marathi", native: "Marathi" },
  { code: "gu", name: "Gujarati", native: "Gujarati" },
];
