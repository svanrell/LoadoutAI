import { spawnSync } from "child_process";
import * as path from "path";
import { ValorantMlEngine, AGENT_NAME_TO_UUID } from "./valorant-ml-engine";
import type { DraftPredictionResult } from "./valorant-ml-engine";

/**
 * Paridad Node ↔ Python: el predictor de Python
 * (src/machine_learning/pregame/predict.py) debe dar exactamente los mismos
 * números que el motor de Node, que es la referencia, con el mismo draft.
 */

const PROJECT_ROOT = path.join(__dirname, "..", "..");

interface Draft {
  map: string;
  allies: string[];
  mode: string;
  enemies: string[];
}

function findPython(): string | null {
  for (const cmd of ["python3", "python"]) {
    const result = spawnSync(cmd, ["--version"], { encoding: "utf8" });
    if (result.status === 0) return cmd;
  }
  return null;
}

const PYTHON = findPython();
// En local se salta si no hay Python; en CI (CI=true) tiene que ejecutarse siempre
if (!PYTHON && process.env.CI) {
  throw new Error("El test de paridad Node ↔ Python necesita Python en CI");
}
const describeWithPython = PYTHON ? describe : describe.skip;

// Ejecuta el predictor de Python una sola vez para todos los drafts
const PY_BATCH_SCRIPT = [
  "import json, sys",
  "sys.path.insert(0, sys.argv[1])",
  "from src.machine_learning.pregame.predict import load_draft_data, predict",
  "data = load_draft_data()",
  "drafts = json.load(sys.stdin)",
  "print(json.dumps([predict(data, d['map'], d['allies'], d['mode'], d['enemies']) for d in drafts]))",
].join("\n");

function runPythonBatch(drafts: Draft[]): unknown[] {
  const result = spawnSync(
    PYTHON as string,
    ["-c", PY_BATCH_SCRIPT, PROJECT_ROOT],
    {
      input: JSON.stringify(drafts),
      encoding: "utf8",
      maxBuffer: 256 * 1024 * 1024,
    },
  );
  if (result.status !== 0) {
    throw new Error(`El predictor de Python falló: ${result.stderr}`);
  }
  return JSON.parse(result.stdout) as unknown[];
}

function runNode(
  engine: ValorantMlEngine,
  draft: Draft,
): DraftPredictionResult {
  const result = engine.predict(
    draft.map,
    draft.allies,
    draft.mode,
    draft.enemies,
  );
  // Mismo paso por JSON que la salida de Python (p. ej. -0 pasa a 0)
  return JSON.parse(JSON.stringify(result)) as DraftPredictionResult;
}

/** Generador pseudoaleatorio con semilla fija (mulberry32) para drafts reproducibles */
function seededRandom(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const KNOWN_AGENTS = Object.keys(AGENT_NAME_TO_UUID);
const MAPS = [
  "Ascent",
  "Bind",
  "Haven",
  "Split",
  "Icebox",
  "Breeze",
  "Fracture",
  "Pearl",
  "Lotus",
  "Sunset",
  "Abyss",
  "Corrode",
  "Mapa Nuevo",
];
const MODES = ["competitive", "unrated", "premier", "swiftplay"];

function randomDrafts(count: number, seed: number): Draft[] {
  const rand = seededRandom(seed);
  const pick = <T>(items: T[]): T => items[Math.floor(rand() * items.length)];
  const drafts: Draft[] = [];

  for (let n = 0; n < count; n++) {
    const pool = [...KNOWN_AGENTS, "agente-nuevo"];
    const takeAgents = (max: number): string[] => {
      const size = Math.floor(rand() * (max + 1));
      const team: string[] = [];
      for (let i = 0; i < size && pool.length > 0; i++) {
        const agent = pool.splice(Math.floor(rand() * pool.length), 1)[0];
        // A veces por UUID, como llegan desde el cliente de Riot
        team.push(
          rand() < 0.3 && AGENT_NAME_TO_UUID[agent]
            ? AGENT_NAME_TO_UUID[agent]
            : agent,
        );
      }
      return team;
    };
    drafts.push({
      map: pick(MAPS),
      allies: takeAgents(5),
      mode: pick(MODES),
      enemies: rand() < 0.5 ? takeAgents(5) : [],
    });
  }
  return drafts;
}

const HAND_PICKED_DRAFTS: Draft[] = [
  { map: "Ascent", allies: [], mode: "competitive", enemies: [] },
  { map: "Bind", allies: ["jett"], mode: "competitive", enemies: [] },
  {
    map: "Haven",
    allies: [
      AGENT_NAME_TO_UUID.sova,
      AGENT_NAME_TO_UUID.omen,
      AGENT_NAME_TO_UUID.killjoy,
    ],
    mode: "competitive",
    enemies: [],
  },
  {
    map: "Lotus",
    allies: ["raze", "fade", "omen", "killjoy", "breach"],
    mode: "competitive",
    enemies: [],
  },
  {
    map: "Split",
    allies: ["jett", "skye", "viper"],
    mode: "competitive",
    enemies: ["raze", "sova", "omen", "cypher"],
  },
  {
    map: "Pearl",
    allies: ["neon", "astra"],
    mode: "premier",
    enemies: ["jett", "harbor"],
  },
  { map: "Sunset", allies: [], mode: "competitive", enemies: ["clove", "iso"] },
  {
    map: "Mapa Nuevo",
    allies: ["sage", "phoenix"],
    mode: "competitive",
    enemies: [],
  },
  {
    map: " bind ",
    allies: ["gekko", "deadlock"],
    mode: " Competitive ",
    enemies: [],
  },
  {
    map: "Icebox",
    allies: ["agente-nuevo", "sova", "viper"],
    mode: "competitive",
    enemies: ["agente-nuevo"],
  },
  {
    map: "Breeze",
    allies: [" JETT ", "Omen", ""],
    mode: "competitive",
    enemies: [],
  },
  {
    map: "Fracture",
    allies: ["sova", "sova"],
    mode: "competitive",
    enemies: [],
  },
];

describeWithPython("Paridad del predictor de draft Node ↔ Python", () => {
  const engine = new ValorantMlEngine();

  it("da los mismos números en los casos concretos", () => {
    const python = runPythonBatch(HAND_PICKED_DRAFTS);
    const node = HAND_PICKED_DRAFTS.map((d) => runNode(engine, d));
    expect(python).toEqual(node);
  });

  it("da los mismos números en 300 drafts aleatorios", () => {
    const drafts = randomDrafts(300, 20261116);
    const python = runPythonBatch(drafts);
    const node = drafts.map((d) => runNode(engine, d));
    expect(python).toEqual(node);
  });

  it("el CLI de Python (predict.py --json) devuelve lo mismo que Node", () => {
    const draft = HAND_PICKED_DRAFTS[4];
    const result = spawnSync(
      PYTHON as string,
      [
        path.join(PROJECT_ROOT, "src", "machine_learning", "predict.py"),
        "--json",
        JSON.stringify({
          mapName: draft.map,
          mode: draft.mode,
          allies: draft.allies,
          enemies: draft.enemies,
        }),
      ],
      { encoding: "utf8" },
    );
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual(runNode(engine, draft));
  });
});
