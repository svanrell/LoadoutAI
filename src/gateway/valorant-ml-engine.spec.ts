import { ValorantMlEngine, getAgentRole } from "./valorant-ml-engine";

describe("ValorantMlEngine - agentes de rol desconocido", () => {
  const engine = new ValorantMlEngine();

  it("un agente que no está en la tabla tiene rol 'unknown', no 'duelist'", () => {
    expect(getAgentRole("agente-nuevo")).toBe("unknown");
    expect(getAgentRole("jett")).toBe("duelist");
  });

  it("no cambia la armonía de roles del resto del equipo", () => {
    const team = ["sova", "omen", "killjoy"];
    expect(
      engine.computeMultinomialRoleHarmony([...team, "agente-nuevo"]),
    ).toBe(engine.computeMultinomialRoleHarmony(team));
    expect(engine.computeMultinomialRoleHarmony(["agente-nuevo"])).toBe(50.0);
  });

  it("un candidato desconocido no recibe la bonificación de rol que falta", () => {
    const draft = engine.predict(
      "Ascent",
      ["sova", "killjoy"],
      "competitive",
      [],
    );
    const roles = new Set(draft.recommendations.map((r) => r.role));
    expect(roles.has("unknown")).toBe(false);

    const engineWithNewAgent = new ValorantMlEngine();
    const data = (
      engineWithNewAgent as unknown as { modelData: { agents: string[] } }
    ).modelData;
    data.agents = [...data.agents, "agente-nuevo"];
    const withNew = engineWithNewAgent.predict(
      "Ascent",
      ["sova", "killjoy"],
      "competitive",
      [],
    );
    const newAgent = withNew.recommendations.find(
      (r) => r.agent === "agente-nuevo",
    );
    expect(newAgent?.role).toBe("unknown");
    // Sin datos de uso ni de parejas, y sin bonificación de rol, no puede superar a un controlador
    const bestController = withNew.recommendations.find(
      (r) => r.role === "controller",
    );
    expect(newAgent!.winRate).toBeLessThan(bestController!.winRate);
  });
});
