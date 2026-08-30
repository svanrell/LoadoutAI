// ============================================================================
// BASE DE DATOS Y TIPOS DE HABILIDADES POR AGENTE (VALORANT ECONOMY)
// Orden Oficial de Tienda:
// - Izquierda (left)  : Q (Ability1)
// - Centro    (middle): E (Ability2 - Firma)
// - Derecha   (right) : C (Ability3)
// ============================================================================

export type AbilityPosition = "left" | "middle" | "right";
export type AbilitySlot = "Ability1" | "Ability2" | "Ability3";

export interface AgentAbilityDetail {
  id: string;
  slot: AbilitySlot;
  position: AbilityPosition;
  name: {
    es: string;
    en: string;
  };
  cost: number;           // Precio por cada carga comprada
  defaultCharges: number; // Cargas gratuitas con las que inicia cada ronda
  maxCharges: number;     // Capacidad máxima de cargas
  isSignature: boolean;   // Habilidad característica (con recarga / enfriamiento)
  iconFallback?: string;
}

export interface AgentAbilitiesCatalog {
  [agentKey: string]: AgentAbilityDetail[];
}

// ============================================================================
// BASE DE DATOS DETALLADA DE HABILIDADES PARA CADA AGENTE DE VALORANT
// ============================================================================

export const AGENT_ABILITIES_DATABASE: AgentAbilitiesCatalog = {
  // BRIMSTONE (Controlador)
  brimstone: [
    {
      id: "brimstone_incendiary",
      slot: "Ability1",
      position: "left",
      name: { es: "Incendiario", en: "Incendiary" },
      cost: 250,
      defaultCharges: 0,
      maxCharges: 1,
      isSignature: false,
    },
    {
      id: "brimstone_sky_smoke",
      slot: "Ability2",
      position: "middle",
      name: { es: "Cortina de humo", en: "Sky Smoke" },
      cost: 100,
      defaultCharges: 1,
      maxCharges: 3,
      isSignature: true,
    },
    {
      id: "brimstone_stim_beacon",
      slot: "Ability3",
      position: "right",
      name: { es: "Baliza estimulante", en: "Stim Beacon" },
      cost: 200,
      defaultCharges: 0,
      maxCharges: 1,
      isSignature: false,
    },
  ],

  // PHOENIX (Duelista)
  phoenix: [
    {
      id: "phoenix_curveball",
      slot: "Ability1",
      position: "left",
      name: { es: "Bola curva", en: "Curveball" },
      cost: 250,
      defaultCharges: 0,
      maxCharges: 2,
      isSignature: false,
    },
    {
      id: "phoenix_hot_hands",
      slot: "Ability2",
      position: "middle",
      name: { es: "Combustión", en: "Hot Hands" },
      cost: 0,
      defaultCharges: 1,
      maxCharges: 1,
      isSignature: true,
    },
    {
      id: "phoenix_blaze",
      slot: "Ability3",
      position: "right",
      name: { es: "Llamarada", en: "Blaze" },
      cost: 150,
      defaultCharges: 0,
      maxCharges: 1,
      isSignature: false,
    },
  ],

  // SAGE (Centinela)
  sage: [
    {
      id: "sage_slow_orb",
      slot: "Ability1",
      position: "left",
      name: { es: "Orbe de ralentización", en: "Slow Orb" },
      cost: 200,
      defaultCharges: 0,
      maxCharges: 2,
      isSignature: false,
    },
    {
      id: "sage_healing_orb",
      slot: "Ability2",
      position: "middle",
      name: { es: "Orbe de sanación", en: "Healing Orb" },
      cost: 0,
      defaultCharges: 1,
      maxCharges: 1,
      isSignature: true,
    },
    {
      id: "sage_barrier_orb",
      slot: "Ability3",
      position: "right",
      name: { es: "Orbe barrera", en: "Barrier Orb" },
      cost: 400,
      defaultCharges: 0,
      maxCharges: 1,
      isSignature: false,
    },
  ],

  // SOVA (Iniciador)
  sova: [
    {
      id: "sova_shock_bolt",
      slot: "Ability1",
      position: "left",
      name: { es: "Flecha explosiva", en: "Shock Bolt" },
      cost: 150,
      defaultCharges: 0,
      maxCharges: 2,
      isSignature: false,
    },
    {
      id: "sova_recon_bolt",
      slot: "Ability2",
      position: "middle",
      name: { es: "Proyectil de reconocimiento", en: "Recon Bolt" },
      cost: 0,
      defaultCharges: 1,
      maxCharges: 1,
      isSignature: true,
    },
    {
      id: "sova_owl_drone",
      slot: "Ability3",
      position: "right",
      name: { es: "Dron de reconocimiento", en: "Owl Drone" },
      cost: 400,
      defaultCharges: 0,
      maxCharges: 1,
      isSignature: false,
    },
  ],

  // VIPER (Controladora)
  viper: [
    {
      id: "viper_poison_cloud",
      slot: "Ability1",
      position: "left",
      name: { es: "Nube venenosa", en: "Poison Cloud" },
      cost: 200,
      defaultCharges: 0,
      maxCharges: 1,
      isSignature: false,
    },
    {
      id: "viper_toxic_screen",
      slot: "Ability2",
      position: "middle",
      name: { es: "Pantalla tóxica", en: "Toxic Screen" },
      cost: 0,
      defaultCharges: 1,
      maxCharges: 1,
      isSignature: true,
    },
    {
      id: "viper_snake_bite",
      slot: "Ability3",
      position: "right",
      name: { es: "Veneno de serpiente", en: "Snake Bite" },
      cost: 200,
      defaultCharges: 0,
      maxCharges: 2,
      isSignature: false,
    },
  ],

  // CYPHER (Centinela)
  cypher: [
    {
      id: "cypher_cyber_cage",
      slot: "Ability1",
      position: "left",
      name: { es: "Prisión cibernética", en: "Cyber Cage" },
      cost: 100,
      defaultCharges: 0,
      maxCharges: 2,
      isSignature: false,
    },
    {
      id: "cypher_spycam",
      slot: "Ability2",
      position: "middle",
      name: { es: "Cámara espía", en: "Spycam" },
      cost: 0,
      defaultCharges: 1,
      maxCharges: 1,
      isSignature: true,
    },
    {
      id: "cypher_trapwire",
      slot: "Ability3",
      position: "right",
      name: { es: "Cable trampa", en: "Trapwire" },
      cost: 200,
      defaultCharges: 0,
      maxCharges: 2,
      isSignature: false,
    },
  ],

  // REYNA (Duelista)
  reyna: [
    {
      id: "reyna_devour",
      slot: "Ability1",
      position: "left",
      name: { es: "Devorar", en: "Devour" },
      cost: 200,
      defaultCharges: 0,
      maxCharges: 2,
      isSignature: false,
    },
    {
      id: "reyna_dismiss",
      slot: "Ability2",
      position: "middle",
      name: { es: "Despreciar", en: "Dismiss" },
      cost: 200,
      defaultCharges: 1,
      maxCharges: 2,
      isSignature: true,
    },
    {
      id: "reyna_leer",
      slot: "Ability3",
      position: "right",
      name: { es: "Mirada lasciva", en: "Leer" },
      cost: 250,
      defaultCharges: 0,
      maxCharges: 2,
      isSignature: false,
    },
  ],

  // KILLJOY (Centinela)
  killjoy: [
    {
      id: "killjoy_alarmbot",
      slot: "Ability1",
      position: "left",
      name: { es: "Bot de alarma", en: "Alarmbot" },
      cost: 200,
      defaultCharges: 0,
      maxCharges: 1,
      isSignature: false,
    },
    {
      id: "killjoy_turret",
      slot: "Ability2",
      position: "middle",
      name: { es: "Torreta", en: "Turret" },
      cost: 0,
      defaultCharges: 1,
      maxCharges: 1,
      isSignature: true,
    },
    {
      id: "killjoy_nanoswarm",
      slot: "Ability3",
      position: "right",
      name: { es: "Nanoenjambre", en: "Nanoswarm" },
      cost: 200,
      defaultCharges: 0,
      maxCharges: 2,
      isSignature: false,
    },
  ],

  // BREACH (Iniciador)
  breach: [
    {
      id: "breach_flashpoint",
      slot: "Ability1",
      position: "left",
      name: { es: "Explosión cegadora", en: "Flashpoint" },
      cost: 250,
      defaultCharges: 0,
      maxCharges: 2,
      isSignature: false,
    },
    {
      id: "breach_fault_line",
      slot: "Ability2",
      position: "middle",
      name: { es: "Falla", en: "Fault Line" },
      cost: 0,
      defaultCharges: 1,
      maxCharges: 1,
      isSignature: true,
    },
    {
      id: "breach_aftershock",
      slot: "Ability3",
      position: "right",
      name: { es: "Réplica", en: "Aftershock" },
      cost: 200,
      defaultCharges: 0,
      maxCharges: 1,
      isSignature: false,
    },
  ],

  // OMEN (Controlador)
  omen: [
    {
      id: "omen_paranoia",
      slot: "Ability1",
      position: "left",
      name: { es: "Paranoia", en: "Paranoia" },
      cost: 300,
      defaultCharges: 0,
      maxCharges: 1,
      isSignature: false,
    },
    {
      id: "omen_dark_cover",
      slot: "Ability2",
      position: "middle",
      name: { es: "Velo tenebroso", en: "Dark Cover" },
      cost: 150,
      defaultCharges: 1,
      maxCharges: 2,
      isSignature: true,
    },
    {
      id: "omen_shrouded_step",
      slot: "Ability3",
      position: "right",
      name: { es: "Aparición tenebrosa", en: "Shrouded Step" },
      cost: 100,
      defaultCharges: 0,
      maxCharges: 2,
      isSignature: false,
    },
  ],

  // JETT (Duelista)
  jett: [
    {
      id: "jett_updraft",
      slot: "Ability1",
      position: "left",
      name: { es: "Vendaval", en: "Updraft" },
      cost: 150,
      defaultCharges: 0,
      maxCharges: 1,
      isSignature: false,
    },
    {
      id: "jett_tailwind",
      slot: "Ability2",
      position: "middle",
      name: { es: "Viento de cola", en: "Tailwind" },
      cost: 0,
      defaultCharges: 1,
      maxCharges: 1,
      isSignature: true,
    },
    {
      id: "jett_cloudburst",
      slot: "Ability3",
      position: "right",
      name: { es: "Borrasca", en: "Cloudburst" },
      cost: 200,
      defaultCharges: 0,
      maxCharges: 2,
      isSignature: false,
    },
  ],

  // RAZE (Duelista)
  raze: [
    {
      id: "raze_blast_pack",
      slot: "Ability1",
      position: "left",
      name: { es: "Fardo explosivo", en: "Blast Pack" },
      cost: 200,
      defaultCharges: 0,
      maxCharges: 2,
      isSignature: false,
    },
    {
      id: "raze_paint_shells",
      slot: "Ability2",
      position: "middle",
      name: { es: "Balas de pintura", en: "Paint Shells" },
      cost: 0,
      defaultCharges: 1,
      maxCharges: 1,
      isSignature: true,
    },
    {
      id: "raze_boom_bot",
      slot: "Ability3",
      position: "right",
      name: { es: "Bot explosivo", en: "Boom Bot" },
      cost: 300,
      defaultCharges: 0,
      maxCharges: 1,
      isSignature: false,
    },
  ],

  // SKYE (Iniciadora)
  skye: [
    {
      id: "skye_trailblazer",
      slot: "Ability1",
      position: "left",
      name: { es: "Precursor", en: "Trailblazer" },
      cost: 300,
      defaultCharges: 0,
      maxCharges: 1,
      isSignature: false,
    },
    {
      id: "skye_guiding_light",
      slot: "Ability2",
      position: "middle",
      name: { es: "Luz guía", en: "Guiding Light" },
      cost: 250,
      defaultCharges: 1,
      maxCharges: 1,
      isSignature: true,
    },
    {
      id: "skye_regrowth",
      slot: "Ability3",
      position: "right",
      name: { es: "Reforestación", en: "Regrowth" },
      cost: 150,
      defaultCharges: 0,
      maxCharges: 1,
      isSignature: false,
    },
  ],

  // YORU (Duelista)
  yoru: [
    {
      id: "yoru_blindside",
      slot: "Ability1",
      position: "left",
      name: { es: "Punto ciego", en: "Blindside" },
      cost: 250,
      defaultCharges: 0,
      maxCharges: 2,
      isSignature: false,
    },
    {
      id: "yoru_gatecrash",
      slot: "Ability2",
      position: "middle",
      name: { es: "Infiltración", en: "Gatecrash" },
      cost: 150,
      defaultCharges: 1,
      maxCharges: 2,
      isSignature: true,
    },
    {
      id: "yoru_fakeout",
      slot: "Ability3",
      position: "right",
      name: { es: "Engaño", en: "Fakeout" },
      cost: 100,
      defaultCharges: 0,
      maxCharges: 1,
      isSignature: false,
    },
  ],

  // ASTRA (Controladora)
  astra: [
    {
      id: "astra_nova_pulse",
      slot: "Ability1",
      position: "left",
      name: { es: "Pulso nova", en: "Nova Pulse" },
      cost: 150,
      defaultCharges: 0,
      maxCharges: 1,
      isSignature: false,
    },
    {
      id: "astra_nebula",
      slot: "Ability2",
      position: "middle",
      name: { es: "Nebulosa", en: "Nebula" },
      cost: 150,
      defaultCharges: 1,
      maxCharges: 2,
      isSignature: true,
    },
    {
      id: "astra_gravity_well",
      slot: "Ability3",
      position: "right",
      name: { es: "Pozo gravitatorio", en: "Gravity Well" },
      cost: 150,
      defaultCharges: 0,
      maxCharges: 1,
      isSignature: false,
    },
  ],

  // KAY/O (Iniciador)
  kayo: [
    {
      id: "kayo_flash_drive",
      slot: "Ability1",
      position: "left",
      name: { es: "Memoria FLASH", en: "FLASH/drive" },
      cost: 250,
      defaultCharges: 0,
      maxCharges: 2,
      isSignature: false,
    },
    {
      id: "kayo_zero_point",
      slot: "Ability2",
      position: "middle",
      name: { es: "Punto CERO", en: "ZERO/point" },
      cost: 0,
      defaultCharges: 1,
      maxCharges: 1,
      isSignature: true,
    },
    {
      id: "kayo_frag_ment",
      slot: "Ability3",
      position: "right",
      name: { es: "FragMentación", en: "FRAG/ment" },
      cost: 200,
      defaultCharges: 0,
      maxCharges: 1,
      isSignature: false,
    },
  ],
  "kay/o": [
    {
      id: "kayo_flash_drive",
      slot: "Ability1",
      position: "left",
      name: { es: "Memoria FLASH", en: "FLASH/drive" },
      cost: 250,
      defaultCharges: 0,
      maxCharges: 2,
      isSignature: false,
    },
    {
      id: "kayo_zero_point",
      slot: "Ability2",
      position: "middle",
      name: { es: "Punto CERO", en: "ZERO/point" },
      cost: 0,
      defaultCharges: 1,
      maxCharges: 1,
      isSignature: true,
    },
    {
      id: "kayo_frag_ment",
      slot: "Ability3",
      position: "right",
      name: { es: "FragMentación", en: "FRAG/ment" },
      cost: 200,
      defaultCharges: 0,
      maxCharges: 1,
      isSignature: false,
    },
  ],

  // CHAMBER (Centinela)
  chamber: [
    {
      id: "chamber_headhunter",
      slot: "Ability1",
      position: "left",
      name: { es: "Cazador de cabezas", en: "Headhunter" },
      cost: 150,
      defaultCharges: 0,
      maxCharges: 8,
      isSignature: false,
    },
    {
      id: "chamber_rendezvous",
      slot: "Ability2",
      position: "middle",
      name: { es: "Rendez-Vous", en: "Rendezvous" },
      cost: 0,
      defaultCharges: 1,
      maxCharges: 1,
      isSignature: true,
    },
    {
      id: "chamber_trademark",
      slot: "Ability3",
      position: "right",
      name: { es: "Marca registrada", en: "Trademark" },
      cost: 200,
      defaultCharges: 0,
      maxCharges: 1,
      isSignature: false,
    },
  ],

  // NEON (Duelista)
  neon: [
    {
      id: "neon_relay_bolt",
      slot: "Ability1",
      position: "left",
      name: { es: "Explosión de relé", en: "Relay Bolt" },
      cost: 200,
      defaultCharges: 0,
      maxCharges: 2,
      isSignature: false,
    },
    {
      id: "neon_high_gear",
      slot: "Ability2",
      position: "middle",
      name: { es: "A toda máquina", en: "High Gear" },
      cost: 0,
      defaultCharges: 1,
      maxCharges: 1,
      isSignature: true,
    },
    {
      id: "neon_fast_lane",
      slot: "Ability3",
      position: "right",
      name: { es: "Carril rápido", en: "Fast Lane" },
      cost: 300,
      defaultCharges: 0,
      maxCharges: 1,
      isSignature: false,
    },
  ],

  // FADE (Iniciadora)
  fade: [
    {
      id: "fade_seize",
      slot: "Ability1",
      position: "left",
      name: { es: "Capturar", en: "Seize" },
      cost: 200,
      defaultCharges: 0,
      maxCharges: 1,
      isSignature: false,
    },
    {
      id: "fade_haunt",
      slot: "Ability2",
      position: "middle",
      name: { es: "Atormentar", en: "Haunt" },
      cost: 0,
      defaultCharges: 1,
      maxCharges: 1,
      isSignature: true,
    },
    {
      id: "fade_prowler",
      slot: "Ability3",
      position: "right",
      name: { es: "Acechadora", en: "Prowler" },
      cost: 250,
      defaultCharges: 0,
      maxCharges: 2,
      isSignature: false,
    },
  ],

  // HARBOR (Controlador)
  harbor: [
    {
      id: "harbor_cove",
      slot: "Ability1",
      position: "left",
      name: { es: "Cala", en: "Cove" },
      cost: 350,
      defaultCharges: 0,
      maxCharges: 1,
      isSignature: false,
    },
    {
      id: "harbor_high_tide",
      slot: "Ability2",
      position: "middle",
      name: { es: "Marea alta", en: "High Tide" },
      cost: 0,
      defaultCharges: 1,
      maxCharges: 1,
      isSignature: true,
    },
    {
      id: "harbor_cascade",
      slot: "Ability3",
      position: "right",
      name: { es: "Cascada", en: "Cascade" },
      cost: 150,
      defaultCharges: 0,
      maxCharges: 2,
      isSignature: false,
    },
  ],

  // GEKKO (Iniciador)
  gekko: [
    {
      id: "gekko_wingman",
      slot: "Ability1",
      position: "left",
      name: { es: "Wingman", en: "Wingman" },
      cost: 300,
      defaultCharges: 0,
      maxCharges: 1,
      isSignature: false,
    },
    {
      id: "gekko_dizzy",
      slot: "Ability2",
      position: "middle",
      name: { es: "Dizzy", en: "Dizzy" },
      cost: 0,
      defaultCharges: 1,
      maxCharges: 1,
      isSignature: true,
    },
    {
      id: "gekko_mosh_pit",
      slot: "Ability3",
      position: "right",
      name: { es: "Mosh", en: "Mosh Pit" },
      cost: 250,
      defaultCharges: 0,
      maxCharges: 1,
      isSignature: false,
    },
  ],

  // DEADLOCK (Centinela)
  deadlock: [
    {
      id: "deadlock_sonic_sensor",
      slot: "Ability1",
      position: "left",
      name: { es: "Sensor Sónico", en: "Sonic Sensor" },
      cost: 200,
      defaultCharges: 0,
      maxCharges: 2,
      isSignature: false,
    },
    {
      id: "deadlock_barrier_mesh",
      slot: "Ability2",
      position: "middle",
      name: { es: "Malla Barrera", en: "Barrier Mesh" },
      cost: 0,
      defaultCharges: 1,
      maxCharges: 1,
      isSignature: true,
    },
    {
      id: "deadlock_gravnet",
      slot: "Ability3",
      position: "right",
      name: { es: "Red de gravedad", en: "GravNet" },
      cost: 200,
      defaultCharges: 0,
      maxCharges: 1,
      isSignature: false,
    },
  ],

  // ISO (Duelista)
  iso: [
    {
      id: "iso_undercut",
      slot: "Ability1",
      position: "left",
      name: { es: "Socavar", en: "Undercut" },
      cost: 250,
      defaultCharges: 0,
      maxCharges: 2,
      isSignature: false,
    },
    {
      id: "iso_double_tap",
      slot: "Ability2",
      position: "middle",
      name: { es: "Disparo doble", en: "Double Tap" },
      cost: 150,
      defaultCharges: 1,
      maxCharges: 1,
      isSignature: true,
    },
    {
      id: "iso_contingency",
      slot: "Ability3",
      position: "right",
      name: { es: "Contingencia", en: "Contingency" },
      cost: 200,
      defaultCharges: 0,
      maxCharges: 1,
      isSignature: false,
    },
  ],

  // CLOVE (Controlador)
  clove: [
    {
      id: "clove_meddle",
      slot: "Ability1",
      position: "left",
      name: { es: "Carambola", en: "Meddle" },
      cost: 250,
      defaultCharges: 0,
      maxCharges: 1,
      isSignature: false,
    },
    {
      id: "clove_ruse",
      slot: "Ability2",
      position: "middle",
      name: { es: "Treta", en: "Ruse" },
      cost: 0,
      defaultCharges: 1,
      maxCharges: 2,
      isSignature: true,
    },
    {
      id: "clove_pick_me_up",
      slot: "Ability3",
      position: "right",
      name: { es: "Tentempié", en: "Pick-Me-Up" },
      cost: 100,
      defaultCharges: 0,
      maxCharges: 1,
      isSignature: false,
    },
  ],

  // VYSE (Centinela)
  vyse: [
    {
      id: "vyse_razorvine",
      slot: "Ability1",
      position: "left",
      name: { es: "Cortacaminos", en: "Razorvine" },
      cost: 150,
      defaultCharges: 0,
      maxCharges: 2,
      isSignature: false,
    },
    {
      id: "vyse_arc_rose",
      slot: "Ability2",
      position: "middle",
      name: { es: "Rosa Metálica", en: "Arc Rose" },
      cost: 0,
      defaultCharges: 1,
      maxCharges: 1,
      isSignature: true,
    },
    {
      id: "vyse_shear",
      slot: "Ability3",
      position: "right",
      name: { es: "Enredadera Filosa", en: "Shear" },
      cost: 200,
      defaultCharges: 0,
      maxCharges: 1,
      isSignature: false,
    },
  ],

  // TEJO (Iniciador)
  tejo: [
    {
      id: "tejo_stealth_drone",
      slot: "Ability1",
      position: "left",
      name: { es: "Dron de Sigilo", en: "Stealth Drone" },
      cost: 250,
      defaultCharges: 0,
      maxCharges: 1,
      isSignature: false,
    },
    {
      id: "tejo_special_delivery",
      slot: "Ability2",
      position: "middle",
      name: { es: "Envío Especial", en: "Special Delivery" },
      cost: 0,
      defaultCharges: 1,
      maxCharges: 1,
      isSignature: true,
    },
    {
      id: "tejo_guided_salvo",
      slot: "Ability3",
      position: "right",
      name: { es: "Descarga Guiada", en: "Guided Salvo" },
      cost: 200,
      defaultCharges: 0,
      maxCharges: 2,
      isSignature: false,
    },
  ],

  // WAYLAY (Duelista)
  waylay: [
    {
      id: "waylay_saturation",
      slot: "Ability1",
      position: "left",
      name: { es: "Saturación", en: "Saturation" },
      cost: 250,
      defaultCharges: 0,
      maxCharges: 2,
      isSignature: false,
    },
    {
      id: "waylay_light_speed",
      slot: "Ability2",
      position: "middle",
      name: { es: "Velocidad de la Luz", en: "Light Speed" },
      cost: 0,
      defaultCharges: 1,
      maxCharges: 1,
      isSignature: true,
    },
    {
      id: "waylay_refraction",
      slot: "Ability3",
      position: "right",
      name: { es: "Refracción", en: "Refraction" },
      cost: 200,
      defaultCharges: 0,
      maxCharges: 1,
      isSignature: false,
    },
  ],
};

// Fallback genérico para agentes nuevos o no mapeados
export const DEFAULT_FALLBACK_ABILITIES: AgentAbilityDetail[] = [
  {
    id: "generic_ability_left",
    slot: "Ability1",
    position: "left",
    name: { es: "Habilidad Q", en: "Ability Q" },
    cost: 250,
    defaultCharges: 0,
    maxCharges: 2,
    isSignature: false,
  },
  {
    id: "generic_ability_middle",
    slot: "Ability2",
    position: "middle",
    name: { es: "Habilidad E (Firma)", en: "Ability E (Signature)" },
    cost: 0,
    defaultCharges: 1,
    maxCharges: 1,
    isSignature: true,
  },
  {
    id: "generic_ability_right",
    slot: "Ability3",
    position: "right",
    name: { es: "Habilidad C", en: "Ability C" },
    cost: 200,
    defaultCharges: 0,
    maxCharges: 1,
    isSignature: false,
  },
];

/**
 * Función auxiliar para resolver el coste y si es firma de una habilidad
 */
export function getAbilityPrice(
  agentName: string = "",
  abilityName: string = "",
  slot: string = ""
): { cost: number; isSignature: boolean } {
  const normAgent = agentName.trim().toLowerCase();
  const list = AGENT_ABILITIES_DATABASE[normAgent];

  if (list) {
    const found = list.find(
      (a) =>
        a.slot.toLowerCase() === slot.toLowerCase() ||
        (slot.toLowerCase() === "grenade" && a.slot === "Ability3") ||
        a.name.en.toLowerCase() === abilityName.toLowerCase() ||
        a.name.es.toLowerCase() === abilityName.toLowerCase()
    );
    if (found) {
      return { cost: found.cost, isSignature: found.isSignature };
    }
  }

  if (slot.toLowerCase() === "ability2" || abilityName.toLowerCase().includes("signature")) {
    return { cost: 0, isSignature: true };
  }
  return { cost: 200, isSignature: false };
}
