"""
pregame/predict.py
==================
Predictor de draft en Python. Es una réplica exacta del motor de Node
(src/gateway/valorant-ml-engine.ts), que es la referencia: mismas fórmulas,
mismos pesos, mismo redondeo y mismo orden de operaciones, para que ambos den
los mismos números con el mismo draft.

Solo necesita draft_data.json (versionado en git); no usa el modelo joblib ni
pandas/scikit-learn.
"""

import os
import sys
import json
import math
import argparse

# Asegurar que la raíz del proyecto esté en sys.path
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from src.machine_learning.shared.constants import (
    AGENT_UUID_TO_NAME_MAP,
    AGENT_NAME_TO_UUID_MAP,
    KNOWN_AGENT_ROLES,
    normalize_agent_identifier,
    get_agent_role,
)

DEFAULT_MAP_NAME = "Ascent"
DEFAULT_MODE_NAME = "competitive"


def get_draft_data_path() -> str:
    return os.path.join(os.path.dirname(os.path.abspath(__file__)), "artifacts", "draft_data.json")


def load_draft_data(draft_data_path: str | None = None) -> dict:
    path = draft_data_path or get_draft_data_path()
    if not os.path.exists(path):
        raise FileNotFoundError(
            f"No se encontró draft_data.json en '{path}'. "
            "Genéralo con el entrenamiento: python src/machine_learning/pregame/model.py"
        )
    with open(path, encoding="utf-8") as f:
        return json.load(f)


# ----------------------------------------------------------------------------
# Equivalentes exactos de JavaScript
# ----------------------------------------------------------------------------

def _js_round(value: float) -> float:
    """Math.round de JavaScript: en empate redondea hacia +infinito (no al par)."""
    floor_value = math.floor(value)
    return float(floor_value + 1 if value - floor_value >= 0.5 else floor_value)


def _round1(value: float) -> float:
    """Math.round(value * 10) / 10"""
    return _js_round(value * 10) / 10


def _clamp_score(value: float) -> float:
    """Math.max(15.0, Math.min(95.0, value))"""
    return max(15.0, min(95.0, value))


def _sequential_sum(values: list[float]) -> float:
    """reduce((a, b) => a + b, 0). sum() no vale: desde Python 3.12 compensa el redondeo."""
    total = 0.0
    for v in values:
        total += v
    return total


def _clean_agents(agents: list[str] | None) -> list[str]:
    """agents.map(normalizeAgentName).filter(Boolean)"""
    cleaned = [normalize_agent_identifier(a) for a in (agents or [])]
    return [a for a in cleaned if a]


def _display_name(agent: str) -> str:
    """agent.charAt(0).toUpperCase() + agent.slice(1)"""
    return agent[:1].upper() + agent[1:]


# ----------------------------------------------------------------------------
# Componentes de la puntuación (mismo orden que valorant-ml-engine.ts)
# ----------------------------------------------------------------------------

def compute_multinomial_role_harmony(team_agents: list[str]) -> float:
    """
    Armonía de roles con la distribución Multinomial (p = 0.25 por rol):
    P(n_d, n_i, n_c, n_s) = (k! / (n_d! * n_i! * n_c! * n_s!)) * (0.25^k),
    normalizada al máximo teórico para k agentes y recortada a [5, 100].
    Los agentes de rol desconocido no cuentan: el cálculo se hace como si no estuvieran.
    """
    roles = [get_agent_role(a) for a in _clean_agents(team_agents)]
    roles = [r for r in roles if r in KNOWN_AGENT_ROLES]
    k = len(roles)
    if k == 0:
        return 50.0

    nd = roles.count("duelist")
    ni = roles.count("initiator")
    nc = roles.count("controller")
    ns = roles.count("sentinel")

    multinomial_coeff = math.factorial(k) / (
        math.factorial(nd) * math.factorial(ni) * math.factorial(nc) * math.factorial(ns)
    )
    observed_prob = multinomial_coeff * (0.25 ** k)

    max_probs_by_k = {
        1: 0.25,
        2: 0.125,
        3: 0.09375,
        4: 0.09375,
        5: 0.05859375,
    }
    max_p = max_probs_by_k.get(k, 0.05859375)
    normalized = (observed_prob / max_p) * 100.0
    return max(5.0, min(100.0, normalized))


def compute_pairwise_synergy(team_agents: list[str], pair_stats: dict) -> float:
    """
    Victoria media de todas las parejas del equipo con suavizado bayesiano
    (prior M=6 hacia el 50%): (wins + 3) / (matches + 6).
    """
    cleaned = _clean_agents(team_agents)
    k = len(cleaned)
    if k < 2:
        return 50.0

    pair_scores = []
    for i in range(k):
        for j in range(i + 1, k):
            pair_key = "__".join(sorted([cleaned[i], cleaned[j]]))
            stat = pair_stats.get(pair_key) or {"matches": 0, "wins": 0}
            smoothed_win_rate = ((stat["wins"] + 3.0) / (stat["matches"] + 6.0)) * 100.0
            pair_scores.append(smoothed_win_rate)

    if not pair_scores:
        return 50.0
    return _sequential_sum(pair_scores) / len(pair_scores)


def compute_map_meta_score(team_agents: list[str], target_map_name: str, pick_rates: dict) -> float:
    """Uso medio de los agentes elegidos en el mapa, escalado a [35, 80]."""
    cleaned = _clean_agents(team_agents)
    if not cleaned:
        return 50.0

    map_key = (target_map_name or DEFAULT_MAP_NAME).strip().lower()
    map_dict = pick_rates.get(map_key) or {}

    rates = [map_dict.get(a) or 0.0 for a in cleaned]
    avg_pick = _sequential_sum(rates) / len(rates) if rates else 0.0
    return min(80.0, max(35.0, 42.0 + avg_pick * 0.35))


def predict_logistic_regression(
    draft_data: dict,
    target_map_name: str,
    ally_agents: list[str],
    enemy_agents: list[str] | None = None,
) -> float:
    """
    Regresión logística con los pesos entrenados:
    z = intercept + w_map + sum(w_diff_aliados) - sum(w_diff_rivales); P = 1 / (1 + e^-z)
    """
    weights = draft_data.get("weights") or {}
    if not weights:
        return 50.0

    z = draft_data.get("intercept") or 0.0

    map_key = f"map_{(target_map_name or DEFAULT_MAP_NAME).strip()}"
    if map_key in weights:
        z += weights[map_key]

    for a in _clean_agents(ally_agents):
        diff_key = f"diff_{a}"
        if diff_key in weights:
            z += weights[diff_key]

    for e in _clean_agents(enemy_agents):
        diff_key = f"diff_{e}"
        if diff_key in weights:
            z -= weights[diff_key]

    prob = 1.0 / (1.0 + math.exp(-z))
    return _round1(_clamp_score(prob * 100.0))


def predict_composition_win_rate(
    draft_data: dict,
    target_map_name: str,
    current_team_agents: list[str],
    enemy_team_agents: list[str] | None = None,
) -> float:
    """
    Sinergia global del equipo:
    40% regresión logística (mapa y enemigos), 20% meta del mapa,
    20% sinergia de parejas y 20% armonía de roles.
    """
    cleaned_allies = _clean_agents(current_team_agents)
    if not cleaned_allies:
        return 50.0

    lr_score = predict_logistic_regression(draft_data, target_map_name, cleaned_allies, enemy_team_agents)
    role_harmony = compute_multinomial_role_harmony(cleaned_allies)
    pairwise_score = compute_pairwise_synergy(cleaned_allies, draft_data.get("pair_stats") or {})
    meta_score = compute_map_meta_score(cleaned_allies, target_map_name, draft_data.get("pick_rates") or {})

    overall = 0.4 * lr_score + 0.2 * meta_score + 0.2 * pairwise_score + 0.2 * role_harmony
    return _round1(_clamp_score(overall))


def compute_agent_marginal_impacts(
    draft_data: dict,
    target_map_name: str,
    team_agents: list[str],
    enemy_team_agents: list[str] | None = None,
) -> list[dict]:
    """Δ_i = Sinergia(equipo completo) - Sinergia(equipo sin el agente i)"""
    cleaned = _clean_agents(team_agents)
    if not cleaned:
        return []

    full_synergy = predict_composition_win_rate(draft_data, target_map_name, cleaned, enemy_team_agents)

    if len(cleaned) == 1:
        agent_name = cleaned[0]
        return [{
            "agent": agent_name,
            "displayName": _display_name(agent_name),
            "uuid": AGENT_NAME_TO_UUID_MAP.get(agent_name, ""),
            "role": get_agent_role(agent_name),
            "impactDelta": _round1(full_synergy - 50.0),
        }]

    impacts = []
    for i, agent_name in enumerate(cleaned):
        team_without = [a for idx, a in enumerate(cleaned) if idx != i]
        synergy_without = predict_composition_win_rate(
            draft_data, target_map_name, team_without, enemy_team_agents
        )
        impacts.append({
            "agent": agent_name,
            "displayName": _display_name(agent_name),
            "uuid": AGENT_NAME_TO_UUID_MAP.get(agent_name, ""),
            "role": get_agent_role(agent_name),
            "impactDelta": _round1(full_synergy - synergy_without),
            "synergyWithout": synergy_without,
        })
    return impacts


def recommend_agent_picks(
    draft_data: dict,
    target_map_name: str,
    already_picked_agents: list[str],
    enemy_picked_agents: list[str] | None = None,
    top_limit: int | None = None,
) -> list[dict]:
    """Candidatos ordenados por sinergia, teniendo en cuenta la composición enemiga."""
    all_agents = draft_data.get("agents") or list(AGENT_UUID_TO_NAME_MAP.values())
    cleaned_allies = _clean_agents(already_picked_agents)
    cleaned_enemies = _clean_agents(enemy_picked_agents)
    locked = set(cleaned_allies) | set(cleaned_enemies)
    available_candidates = [a for a in all_agents if a not in locked]

    map_key = (target_map_name or DEFAULT_MAP_NAME).strip().lower()
    map_pick_rates = (draft_data.get("pick_rates") or {}).get(map_key) or {}
    pair_stats = draft_data.get("pair_stats") or {}

    is_initial_draft = len(cleaned_allies) == 0
    locked_roles = [get_agent_role(a) for a in cleaned_allies]
    has_controller = "controller" in locked_roles
    has_duelist = "duelist" in locked_roles

    candidate_results = []
    for candidate in available_candidates:
        hypothetical_team = cleaned_allies + [candidate]
        candidate_pick_rate = map_pick_rates.get(candidate) or 0.0
        c_role = get_agent_role(candidate)

        lr_score = predict_logistic_regression(draft_data, target_map_name, hypothetical_team, cleaned_enemies)

        role_harmony = 50.0
        pairwise_score = 50.0

        if is_initial_draft and len(cleaned_enemies) == 0:
            composite = lr_score * 0.5 + (43.0 + candidate_pick_rate * 0.18) * 0.5
        else:
            role_harmony = compute_multinomial_role_harmony(hypothetical_team)
            pairwise_score = compute_pairwise_synergy(hypothetical_team, pair_stats)
            candidate_meta = 42.0 + candidate_pick_rate * 0.35

            role_score = 50.0 + (role_harmony - 50.0) * 0.4
            if not has_controller and c_role == "controller":
                role_score += 8.0  # Necesidad de humos
            elif not has_duelist and c_role == "duelist":
                role_score += 4.0

            composite = 0.35 * lr_score + 0.25 * candidate_meta + 0.2 * pairwise_score + 0.2 * role_score

        candidate_results.append({
            "agent": candidate,
            "displayName": _display_name(candidate),
            "uuid": AGENT_NAME_TO_UUID_MAP.get(candidate, ""),
            "role": c_role,
            "winRate": _round1(_clamp_score(composite)),
            "roleHarmony": _round1(role_harmony),
            "pairwiseWinRate": _round1(pairwise_score),
            "metaPickRate": _round1(candidate_pick_rate),
        })

    # sort() de JavaScript y de Python son estables: los empates conservan el orden
    candidate_results.sort(key=lambda item: item["winRate"], reverse=True)
    return candidate_results[:top_limit] if top_limit else candidate_results


def predict(
    draft_data: dict,
    map_name: str,
    allies: list[str],
    mode_name: str = DEFAULT_MODE_NAME,
    enemies: list[str] | None = None,
) -> dict:
    """Predicción completa; mismo resultado que ValorantMlEngine.predict()."""
    target_map = map_name or DEFAULT_MAP_NAME
    target_mode = (mode_name or DEFAULT_MODE_NAME).strip().lower()
    cleaned_allies = _clean_agents(allies)
    cleaned_enemies = _clean_agents(enemies)

    return {
        "success": True,
        "mapName": target_map,
        "mode": target_mode,
        "currentPicks": cleaned_allies,
        "enemyPicks": cleaned_enemies,
        "currentSynergy": predict_composition_win_rate(draft_data, target_map, cleaned_allies, cleaned_enemies),
        "recommendations": recommend_agent_picks(draft_data, target_map, cleaned_allies, cleaned_enemies),
        "agentImpacts": compute_agent_marginal_impacts(draft_data, target_map, cleaned_allies, cleaned_enemies),
    }


def run_json_prediction(input_json_string: str, draft_data_path: str | None = None) -> None:
    try:
        request_payload = json.loads(input_json_string)
        result = predict(
            load_draft_data(draft_data_path),
            request_payload.get("mapName") or request_payload.get("map") or DEFAULT_MAP_NAME,
            request_payload.get("allies") or request_payload.get("picks") or [],
            str(request_payload.get("mode") or request_payload.get("modeName") or DEFAULT_MODE_NAME),
            request_payload.get("enemies") or [],
        )
        print(json.dumps(result))
    except Exception as error:
        print(json.dumps({
            "success": False,
            "error": str(error),
            "recommendations": [],
            "currentSynergy": 50.0,
            "agentImpacts": [],
        }))


def _parse_agent_list(raw: str | None) -> list[str]:
    return [
        a.strip()
        for a in (raw or "").split(",")
        if a.strip() and a.strip().lower() not in ["none", "null", "undefined"]
    ]


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(description="Predictor de draft de Valorant")
    parser.add_argument("--json", type=str, default=None, help="Payload de entrada en formato JSON")
    parser.add_argument("--map", type=str, default=DEFAULT_MAP_NAME, help="Nombre del mapa (ej. Ascent, Haven)")
    parser.add_argument("--mode", type=str, default=DEFAULT_MODE_NAME, help="Modo de juego (ej. competitive, premier)")
    parser.add_argument("--allies", type=str, default="", nargs="?", help="Agentes aliados separados por coma")
    parser.add_argument("--enemies", type=str, default="", nargs="?", help="Agentes enemigos separados por coma")
    args = parser.parse_args(argv)

    if args.json:
        run_json_prediction(args.json)
        return

    run_json_prediction(json.dumps({
        "mapName": args.map or DEFAULT_MAP_NAME,
        "mode": args.mode or DEFAULT_MODE_NAME,
        "allies": _parse_agent_list(args.allies),
        "enemies": _parse_agent_list(args.enemies),
    }))


if __name__ == "__main__":
    main()
