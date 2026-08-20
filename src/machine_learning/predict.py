import os
import sys
import json
import argparse
from typing import Any

# Asegurar que la raíz del proyecto esté en sys.path para ejecuciones directas
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from src.machine_learning.features import encode_single_composition
from src.machine_learning.model import load_model_artifact

# Mapeo de UUID oficial de Valorant API a nombres de agentes
AGENT_UUID_TO_NAME: dict[str, str] = {
    "e370fa57-4757-3604-3648-499e1f642d3f": "gekko",
    "dade69b4-4f5a-8528-247b-219e5a1facd6": "fade",
    "5f8d3a7f-467b-97f3-062c-13acf203c006": "breach",
    "cc8b64c8-4b25-4ff9-6e7f-37b4da43d235": "deadlock",
    "b444168c-4e35-8076-db47-ef9bf368f384": "tejo",
    "f94c3b30-42be-e959-889c-5aa313dba261": "raze",
    "22697a3d-45bf-8dd7-4fec-84a9e28c69d7": "chamber",
    "601dbbe7-43ce-be57-2a40-4abd24953621": "kayo",
    "6f2a04ca-43e0-be17-7f36-b3908627744d": "skye",
    "117429e5-47ac-4f3b-bcbf-bd9948622396": "cypher",
    "ded3520f-4264-bfed-162d-b080e2abccf9": "sych",
    "32079440-49bb-49a0-16e7-61604240759e": "sowa",
    "1e58de9c-4950-5125-93e9-a0aee9f98746": "killjoy",
    "95b78ed7-4637-86d9-7e41-71ba8c293152": "harbor",
    "707eab51-4836-f488-046a-cda6bf494859": "viper",
    "eb93336a-449b-9c1b-0a54-a891f7921d69": "phoenix",
    "41fb69c1-4189-7b37-f117-bcaf1e96f1bf": "astra",
    "9f0d8ba9-4140-b941-57d3-a7ad57c65326": "brimstone",
    "0e38b510-41a8-5780-5e8f-568b2a4f2d6c": "iso",
    "bb2a4828-46eb-8cd1-e765-15848195d751": "neon",
    "7f94d92c-4234-0a36-9646-3a87eb8b5c89": "yoru",
    "569fdd95-4d10-43ab-ca70-79becc718b46": "sage",
    "a3bfb854-4341-2d60-70f6-4f8ea40ba333": "reyna",
    "8e253930-4c05-31dd-1b1c-96a76304525a": "omen",
    "add6443a-41bd-e6f4-338b-e698d22d3c03": "jett",
    "1435109b-4395-9d29-a1b4-2b99214736f8": "vyse",
    "deddd6f8-43a4-6154-71be-58d11f5b402e": "sova",
    "df6bb1d9-482d-4c3e-257a-9a9900c7e2b7": "censor",
    "1c5a8947-4959-470a-48d6-69bb12a768e7": "clove",
}

AGENT_NAME_TO_UUID = {v: k for k, v in AGENT_UUID_TO_NAME.items()}


def normalize_agent_name(name_or_uuid: str) -> str:
    """Traduce un UUID o nombre directo a nombre canónico en minúsculas."""
    cleaned = str(name_or_uuid).strip().lower()
    if cleaned in AGENT_UUID_TO_NAME:
        return AGENT_UUID_TO_NAME[cleaned]
    return cleaned


def recommend_agent_picks(
    model_bundle: dict[str, Any], map_name: str, current_picks: list[str], top_n: int = 5
) -> list[tuple[str, float]]:
    """
    Evalúa qué agentes disponibles maximizan la probabilidad de victoria para el mapa dado.
    Devuelve una lista ordenada [(agente, winrate_estimado), ...]
    """
    model = model_bundle["model"]
    all_maps = model_bundle["maps"]
    all_agents = model_bundle["agents"]
    feature_cols = model_bundle["feature_cols"]

    picks_clean = [normalize_agent_name(a) for a in current_picks if a]
    picks_valid = [a for a in picks_clean if a in all_agents]
    available_agents = [a for a in all_agents if a not in picks_valid]

    scores = []

    for candidate in available_agents:
        hypo_team = picks_valid + [candidate]
        X_single = encode_single_composition(map_name, hypo_team, all_maps, all_agents, feature_cols)
        win_rate = float(model.predict(X_single)[0])
        scores.append((candidate, round(win_rate, 2)))

    scores.sort(key=lambda item: item[1], reverse=True)
    return scores[:top_n]


def predict_composition_win_rate(model_bundle: dict[str, Any], map_name: str, team_agents: list[str]) -> float:
    """Calcula el win rate estimado para una composición completa de agentes en un mapa."""
    model = model_bundle["model"]
    all_maps = model_bundle["maps"]
    all_agents = model_bundle["agents"]
    feature_cols = model_bundle["feature_cols"]

    clean_agents = [normalize_agent_name(a) for a in team_agents if a]
    valid_agents = [a for a in clean_agents if a in all_agents]

    if not valid_agents:
        return 0.0

    X_single = encode_single_composition(map_name, valid_agents, all_maps, all_agents, feature_cols)
    return round(float(model.predict(X_single)[0]), 2)


def run_json_prediction(input_json_str: str) -> None:
    """Ejecuta predicción en modo JSON para integración con NestJS/Gateway."""
    try:
        data = json.loads(input_json_str)
        map_name = data.get("mapName") or data.get("map") or "Ascent"
        allies = data.get("allies") or data.get("picks") or []

        model_path = os.path.join(PROJECT_ROOT, "src", "machine_learning", "models", "draft_model.joblib")
        bundle = load_model_artifact(model_path, verbose=False)

        recs = recommend_agent_picks(bundle, map_name, allies, top_n=25)
        synergy_wr = predict_composition_win_rate(bundle, map_name, allies)

        formatted_recs = []
        for agent_name, wr in recs:
            formatted_recs.append({
                "agent": agent_name,
                "displayName": agent_name.capitalize(),
                "uuid": AGENT_NAME_TO_UUID.get(agent_name, ""),
                "winRate": wr,
            })


        output = {
            "success": True,
            "mapName": map_name,
            "currentPicks": [normalize_agent_name(a) for a in allies if a],
            "currentSynergy": synergy_wr,
            "recommendations": formatted_recs,
        }
        print(json.dumps(output))
    except Exception as e:
        error_output = {
            "success": False,
            "error": str(e),
            "recommendations": [],
            "currentSynergy": 50.0,
        }
        print(json.dumps(error_output))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Valorant AI Predictor")
    parser.add_argument("--json", type=str, help="Entrada JSON con mapName y allies")
    parser.add_argument("--map", type=str, help="Nombre del mapa")
    parser.add_argument("--allies", type=str, help="Lista de agentes/UUIDs aliados separados por coma")
    args = parser.parse_args()

    if args.json:
        run_json_prediction(args.json)
    elif args.map is not None:
        allies_list = [a.strip() for a in args.allies.split(",")] if args.allies else []
        payload = json.dumps({"mapName": args.map, "allies": allies_list})
        run_json_prediction(payload)

