import os
import sys
import json
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


def recommend_agent_picks(
    model_bundle: dict[str, Any],
    target_map_name: str,
    already_picked_agents: list[str],
    enemy_picked_agents: list[str] = None,
    top_limit: int = 5,
) -> list[dict[str, Any]]:
    """
    Evalúa qué agentes maximizan la probabilidad de victoria y su alineación con el meta del mapa.
    Puntuación = 60% Probabilidad de Victoria IA + 40% Tasa de Uso Real en el Mapa.
    """
    trained_model = model_bundle["model"]
    all_available_maps = model_bundle["maps"]
    all_available_agents = model_bundle["agents"]
    feature_column_names = model_bundle["feature_cols"]
    pick_rates = model_bundle.get("pick_rates", {})

    cleaned_allies = [normalize_agent_identifier(a) for a in already_picked_agents if a]
    valid_locked_allies = [a for a in cleaned_allies if a in all_available_agents]
    cleaned_enemies = [normalize_agent_identifier(a) for a in (enemy_picked_agents or []) if a]
    valid_locked_enemies = [a for a in cleaned_enemies if a in all_available_agents]

    available_candidates = [a for a in all_available_agents if a not in valid_locked_allies]

    map_key = str(target_map_name).strip().lower()
    map_pick_rates = pick_rates.get(map_key, {})

    candidate_results = []
    for candidate in available_candidates:
        hypothetical_team = valid_locked_allies + [candidate]
        encoded_row = encode_single_composition(
            target_map_name,
            hypothetical_team,
            all_available_maps,
            all_available_agents,
            feature_column_names,
            enemy_team_agents=valid_locked_enemies,
        )
        predicted_win_prob = float(trained_model.predict_proba(encoded_row)[0][1]) * 100
        pick_rate = map_pick_rates.get(candidate, 0.0)

        # Puntuación combinada ponderando victoria y popularidad en el meta
        composite_score = (0.70 * predicted_win_prob) + (0.30 * pick_rate)

        candidate_results.append({
            "agent": candidate,
            "displayName": candidate.capitalize(),
            "uuid": AGENT_NAME_TO_UUID_MAP.get(candidate, ""),
            "winRate": round(composite_score, 1),
            "rawWinRate": round(predicted_win_prob, 1),
            "metaPickRate": round(pick_rate, 1),
        })

    candidate_results.sort(key=lambda item: item["winRate"], reverse=True)
    return candidate_results[:top_limit]


def predict_composition_win_rate(
    model_bundle: dict[str, Any],
    target_map_name: str,
    current_team_agents: list[str],
    enemy_team_agents: list[str] = None,
) -> float:
    trained_model = model_bundle["model"]
    all_available_maps = model_bundle["maps"]
    all_available_agents = model_bundle["agents"]
    feature_column_names = model_bundle["feature_cols"]

    cleaned_allies = [normalize_agent_identifier(a) for a in current_team_agents if a]
    valid_allies = [a for a in cleaned_allies if a in all_available_agents]
    cleaned_enemies = [normalize_agent_identifier(a) for a in (enemy_team_agents or []) if a]
    valid_enemies = [a for a in cleaned_enemies if a in all_available_agents]

    if not valid_allies:
        return 50.0

    encoded_row = encode_single_composition(
        target_map_name,
        valid_allies,
        all_available_maps,
        all_available_agents,
        feature_column_names,
        enemy_team_agents=valid_enemies,
    )
    win_prob = float(trained_model.predict_proba(encoded_row)[0][1])
    return round(win_prob * 100, 1)


def run_json_prediction(input_json_string: str) -> None:
    try:
        request_payload = json.loads(input_json_string)
        target_map_name = request_payload.get("mapName") or request_payload.get("map") or "Ascent"
        ally_agents_list = request_payload.get("allies") or request_payload.get("picks") or []
        enemy_agents_list = request_payload.get("enemies") or []

        model_artifact_path = get_model_artifact_path()
        loaded_model_bundle = load_model_artifact(model_artifact_path)

        ranked_recommendations = recommend_agent_picks(
            loaded_model_bundle,
            target_map_name,
            ally_agents_list,
            enemy_picked_agents=enemy_agents_list,
            top_limit=25,
        )
        current_synergy = predict_composition_win_rate(
            loaded_model_bundle,
            target_map_name,
            ally_agents_list,
            enemy_team_agents=enemy_agents_list,
        )

        response_payload = {
            "success": True,
            "mapName": target_map_name,
            "currentPicks": [normalize_agent_identifier(a) for a in ally_agents_list if a],
            "enemyPicks": [normalize_agent_identifier(a) for a in enemy_agents_list if a],
            "currentSynergy": current_synergy,
            "recommendations": ranked_recommendations,
        }
        print(json.dumps(response_payload))

    except Exception as error:
        error_payload = {
            "success": False,
            "error": str(error),
            "recommendations": [],
            "currentSynergy": 50.0,
        }
        print(json.dumps(error_payload))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Valorant Pre-game Draft Predictor")
    parser.add_argument("--json", type=str, default=None, help="Input JSON")
    parser.add_argument("--map", type=str, default="Ascent", help="Map name")
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
        payload = json.dumps({"mapName": target_map, "allies": allies_list, "enemies": enemies_list})
        run_json_prediction(payload)
