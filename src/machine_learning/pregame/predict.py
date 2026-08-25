import os
import sys
import json
import math
import argparse
from typing import Any

# Asegurar que la raíz del proyecto esté en sys.path
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from src.machine_learning.shared.constants import (
    AGENT_UUID_TO_NAME_MAP,
    AGENT_NAME_TO_UUID_MAP,
    normalize_agent_identifier,
    get_agent_role,
)
from src.machine_learning.pregame.features import encode_single_composition
from src.machine_learning.pregame.model import load_model_artifact


def get_model_artifact_path() -> str:
    current_dir = os.path.dirname(__file__)
    candidate_paths = [
        os.path.join(current_dir, "artifacts", "draft_model.joblib"),
        os.path.join(PROJECT_ROOT, "src", "machine_learning", "pregame", "artifacts", "draft_model.joblib"),
    ]
    for path_option in candidate_paths:
        if os.path.exists(path_option):
            return path_option
    return candidate_paths[0]


def compute_multinomial_role_harmony(team_agents: list[str]) -> float:
    """
    Calcula la armonía de roles mediante la distribución de probabilidad Multinomial:
    P(n_d, n_i, n_c, n_s | p=0.25) = (k! / (n_d! * n_i! * n_c! * n_s!)) * (0.25^k)
    Normalizada respecto al máximo teórico posible para k agentes en [0, 100%].
    """
    if not team_agents:
        return 50.0

    roles = [get_agent_role(a) for a in team_agents if a]
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

    normalized_harmony = (observed_prob / max_p) * 100.0
    return float(max(5.0, min(100.0, normalized_harmony)))


def compute_pairwise_synergy(team_agents: list[str], pair_stats: dict[str, dict[str, int]]) -> float:
    """
    Calcula la tasa media de victoria de las parejas de agentes a partir de datos reales de partidas,
    aplicando suavizado de Laplace bayesiano con prior 50%: (wins + 1) / (matches + 2).
    """
    cleaned = [normalize_agent_identifier(a) for a in team_agents if a]
    k = len(cleaned)
    if k < 2:
        return 50.0

    pair_scores = []
    for i in range(k):
        for j in range(i + 1, k):
            pair_key = "__".join(sorted([cleaned[i], cleaned[j]]))
            stat = pair_stats.get(pair_key, {"matches": 0, "wins": 0})
            matches = stat.get("matches", 0)
            wins = stat.get("wins", 0)
            smoothed_winrate = ((wins + 1.0) / (matches + 2.0)) * 100.0
            pair_scores.append(smoothed_winrate)

    return float(sum(pair_scores) / len(pair_scores)) if pair_scores else 50.0


def compute_map_meta_score(
    team_agents: list[str],
    target_map_name: str,
    pick_rates: dict[str, dict[str, float]],
) -> float:
    """
    Calcula la tasa media empírica de uso y meta del mapa según las estadísticas oficiales.
    """
    cleaned = [normalize_agent_identifier(a) for a in team_agents if a]
    if not cleaned:
        return 50.0

    map_key = target_map_name.strip().lower()
    map_dict = pick_rates.get(map_key, {})

    rates = [map_dict.get(a, 0.0) for a in cleaned]
    avg_pick = sum(rates) / len(rates) if rates else 0.0
    return float(min(95.0, max(25.0, 30.0 + (avg_pick * 0.95))))


def predict_composition_win_rate(
    model_bundle: dict[str, Any],
    target_map_name: str,
    current_team_agents: list[str],
    enemy_team_agents: list[str] | None = None,
) -> float:
    """
    Calcula la sinergia global del equipo (0 - 100%):
    - 40% Distribución Multinomial de Roles
    - 35% Sinergia Empírica de Parejas
    - 25% Meta del Mapa
    """
    cleaned_allies = [normalize_agent_identifier(a) for a in current_team_agents if a]
    if not cleaned_allies:
        return 50.0

    pick_rates = model_bundle.get("pick_rates", {})
    pair_stats = model_bundle.get("pair_stats", {})

    role_harmony = compute_multinomial_role_harmony(cleaned_allies)
    pairwise_score = compute_pairwise_synergy(cleaned_allies, pair_stats)
    meta_score = compute_map_meta_score(cleaned_allies, target_map_name, pick_rates)

    overall_synergy = (0.40 * role_harmony) + (0.35 * pairwise_score) + (0.25 * meta_score)
    return round(max(10.0, min(98.0, overall_synergy)), 1)


def compute_agent_marginal_impacts(
    model_bundle: dict[str, Any],
    target_map_name: str,
    team_agents: list[str],
    enemy_team_agents: list[str] | None = None,
) -> list[dict[str, Any]]:
    """
    Calcula el Impacto Marginal Individual (Delta / Δ) de cada agente elegido en la composición:
    Δ_i = Sinergia(Equipo_Completo) - Sinergia(Equipo_Sin_Agente_i)
    Un delta positivo (ej. +15.2%) indica que ese pick potenció la sinergia.
    Un delta negativo (ej. -8.5%) indica que ese pick perjudicó o desbalanceó la composición.
    """
    cleaned = [normalize_agent_identifier(a) for a in team_agents if a]
    if not cleaned:
        return []

    full_synergy = predict_composition_win_rate(
        model_bundle, target_map_name, cleaned, enemy_team_agents
    )

    if len(cleaned) == 1:
        agent_name = cleaned[0]
        delta = round(full_synergy - 50.0, 1)
        return [{
            "agent": agent_name,
            "displayName": agent_name.capitalize(),
            "uuid": AGENT_NAME_TO_UUID_MAP.get(agent_name, ""),
            "role": get_agent_role(agent_name),
            "impactDelta": delta,
        }]

    impacts = []
    for i, agent_name in enumerate(cleaned):
        team_without_agent = [a for j, a in enumerate(cleaned) if j != i]
        synergy_without = predict_composition_win_rate(
            model_bundle, target_map_name, team_without_agent, enemy_team_agents
        )
        delta = round(full_synergy - synergy_without, 1)
        impacts.append({
            "agent": agent_name,
            "displayName": agent_name.capitalize(),
            "uuid": AGENT_NAME_TO_UUID_MAP.get(agent_name, ""),
            "role": get_agent_role(agent_name),
            "impactDelta": delta,
            "synergyWithout": synergy_without,
        })

    return impacts


def recommend_agent_picks(
    model_bundle: dict[str, Any],
    target_map_name: str,
    already_picked_agents: list[str],
    enemy_picked_agents: list[str] | None = None,
    top_limit: int | None = None,
) -> list[dict[str, Any]]:
    """
    Evalúa matemáticamente qué candidatos maximizan la sinergia global.
    """
    all_available_maps = model_bundle["maps"]
    all_available_agents = model_bundle["agents"]
    pick_rates = model_bundle.get("pick_rates", {})
    pair_stats = model_bundle.get("pair_stats", {})

    cleaned_allies = [normalize_agent_identifier(a) for a in already_picked_agents if a]
    valid_locked_allies = [a for a in cleaned_allies if a in all_available_agents]
    available_candidates = [a for a in all_available_agents if a not in valid_locked_allies]

    map_key = target_map_name.strip().lower()
    map_pick_rates = pick_rates.get(map_key, {})

    candidate_results = []
    for candidate in available_candidates:
        hypothetical_team = valid_locked_allies + [candidate]

        role_harmony = compute_multinomial_role_harmony(hypothetical_team)
        pairwise_score = compute_pairwise_synergy(hypothetical_team, pair_stats)
        candidate_pick_rate = map_pick_rates.get(candidate, 0.0)
        meta_score = min(95.0, max(25.0, 30.0 + (candidate_pick_rate * 0.95)))

        composite_score = (0.40 * role_harmony) + (0.35 * pairwise_score) + (0.25 * meta_score)

        candidate_results.append({
            "agent": candidate,
            "displayName": candidate.capitalize(),
            "uuid": AGENT_NAME_TO_UUID_MAP.get(candidate, ""),
            "role": get_agent_role(candidate),
            "winRate": round(max(10.0, min(99.0, composite_score)), 1),
            "roleHarmony": round(role_harmony, 1),
            "pairwiseWinRate": round(pairwise_score, 1),
            "metaPickRate": round(candidate_pick_rate, 1),
        })

    candidate_results.sort(key=lambda item: item["winRate"], reverse=True)
    return candidate_results if top_limit is None else candidate_results[:top_limit]


def run_json_prediction(input_json_string: str) -> None:
    try:
        request_payload = json.loads(input_json_string)
        target_map_name = request_payload.get("mapName") or request_payload.get("map") or "Ascent"
        mode_name = str(request_payload.get("mode") or request_payload.get("modeName") or "").strip().lower()
        ally_agents_list = request_payload.get("allies") or request_payload.get("picks") or []

        is_premier_mode = "premier" in mode_name or "tournament" in mode_name
        enemy_agents_list = (request_payload.get("enemies") or []) if is_premier_mode else []

        model_artifact_path = get_model_artifact_path()
        loaded_model_bundle = load_model_artifact(model_artifact_path)

        ranked_recommendations = recommend_agent_picks(
            loaded_model_bundle,
            target_map_name,
            ally_agents_list,
            enemy_picked_agents=enemy_agents_list,
            top_limit=None,
        )
        current_synergy = predict_composition_win_rate(
            loaded_model_bundle,
            target_map_name,
            ally_agents_list,
            enemy_team_agents=enemy_agents_list,
        )
        agent_impacts = compute_agent_marginal_impacts(
            loaded_model_bundle,
            target_map_name,
            ally_agents_list,
            enemy_team_agents=enemy_agents_list,
        )

        response_payload = {
            "success": True,
            "mapName": target_map_name,
            "mode": mode_name or "competitive",
            "currentPicks": [normalize_agent_identifier(a) for a in ally_agents_list if a],
            "enemyPicks": [normalize_agent_identifier(a) for a in enemy_agents_list if a],
            "currentSynergy": current_synergy,
            "recommendations": ranked_recommendations,
            "agentImpacts": agent_impacts,
        }
        print(json.dumps(response_payload))

    except Exception as error:
        error_payload = {
            "success": False,
            "error": str(error),
            "recommendations": [],
            "currentSynergy": 50.0,
            "agentImpacts": [],
        }
        print(json.dumps(error_payload))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Valorant Pre-game Draft Predictor")
    parser.add_argument("--json", type=str, default=None, help="Input JSON")
    parser.add_argument("--map", type=str, default="Ascent", help="Map name")
    parser.add_argument("--mode", type=str, default="competitive", help="Game mode name")
    parser.add_argument("--allies", type=str, default="", nargs="?", help="Allies list comma-separated")
    parser.add_argument("--enemies", type=str, default="", nargs="?", help="Enemies list comma-separated")
    args = parser.parse_args()

    if args.json:
        run_json_prediction(args.json)
    else:
        raw_allies = args.allies or ""
        allies_list = [
            a.strip()
            for a in raw_allies.split(",")
            if a.strip() and a.strip().lower() not in ["none", "null", "undefined", ""]
        ]
        raw_enemies = args.enemies or ""
        enemies_list = [
            a.strip()
            for a in raw_enemies.split(",")
            if a.strip() and a.strip().lower() not in ["none", "null", "undefined", ""]
        ]
        target_map = args.map or "Ascent"
        payload = json.dumps({
            "mapName": target_map,
            "mode": args.mode or "competitive",
            "allies": allies_list,
            "enemies": enemies_list,
        })
        run_json_prediction(payload)
