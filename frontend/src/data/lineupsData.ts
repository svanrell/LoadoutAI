export type Side = "attack" | "defense";

export interface LineupVideo {
  id: string;
  agent: string; // ej. "sova", "viper", "brimstone", "killjoy"
  map: string;   // ej. "ascent", "bind", "haven", "sunset", "split"
  side: Side;    // "attack" | "defense"
  title: string;
  videoUrl: string; // URL del video / clip
  ability?: string;
  description?: string;
}
