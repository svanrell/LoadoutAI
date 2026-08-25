import { ValorantMlEngine } from "./src/gateway/valorant-ml-engine";

const engine = ValorantMlEngine.getInstance();
console.log("=== AUDITORÍA DE RENDIMIENTO Y PRECISIÓN ===");
console.log("1. Estado del Motor:", engine.isLoaded() ? "CARGADO EN MEMORIA (OK)" : "ERROR NO CARGADO");

// Test 1: Composición vacía
const t0 = performance.now();
const resEmpty = engine.predict("Ascent", [], "competitive");
const timeEmpty = performance.now() - t0;
console.log(`2. Predicción vacía: ${timeEmpty.toFixed(3)} ms | Sinergia: ${resEmpty.currentSynergy}% | Recomendaciones: ${resEmpty.recommendations.length}`);

// Test 2: Composición estándar competitiva
const t1 = performance.now();
const resComp = engine.predict("Ascent", ["jett", "sova", "omen"], "competitive");
const timeComp = performance.now() - t1;
console.log(`3. Predicción 3 agentes (Ascent): ${timeComp.toFixed(3)} ms | Sinergia: ${resComp.currentSynergy}% | Top Pick: ${resComp.recommendations[0]?.displayName} (${resComp.recommendations[0]?.winRate}%)`);

// Test 3: Composición de 5 agentes
const t2 = performance.now();
const resFull = engine.predict("Haven", ["jett", "breach", "omen", "cypher", "sova"], "competitive");
const timeFull = performance.now() - t2;
console.log(`4. Predicción 5 agentes (Haven): ${timeFull.toFixed(3)} ms | Sinergia: ${resFull.currentSynergy}%`);
console.log("   Deltas individuales:", resFull.agentImpacts.map(a => `${a.displayName}: ${a.impactDelta > 0 ? "+" : ""}${a.impactDelta}%`).join(", "));

// Test 4: Benchmark de 1.000 predicciones intensivas
const iterations = 1000;
const t3 = performance.now();
for (let i = 0; i < iterations; i++) {
  engine.predict("Split", ["raze", "viper", "skye"], "competitive");
}
const totalTime = performance.now() - t3;
const avgTime = totalTime / iterations;
console.log(`5. Benchmark estrés (1.000 inferencias): ${totalTime.toFixed(2)} ms total | Promedio: ${(avgTime * 1000).toFixed(2)} µs (${avgTime.toFixed(4)} ms por llamada)`);
console.log(`   Throughput: ${Math.round(iterations / (totalTime / 1000)).toLocaleString()} predicciones por segundo`);
