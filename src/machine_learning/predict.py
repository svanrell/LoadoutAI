"""
predict.py
==========
Responsabilidad:
- Servir predicciones y recomendaciones de picks en milisegundos.
- Proporcionar la interfaz de comando CLI y JSON para comunicarse con NestJS y el Frontend.
"""

import os
import sys
import json
import argparse
from typing import Any

# Asegurar que la raíz del proyecto esté en sys.path para importaciones
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from src.machine_learning.features import encode_single_composition
from src.machine_learning.model import load_model_artifact

# Mapeo oficial de los identificadores UUID de Riot a nombres de agentes
AGENT_UUID_TO_NAME_MAP: dict[str, str] = {
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

# Diccionario inverso: Nombre ➔ UUID
AGENT_NAME_TO_UUID_MAP = {agent_name: agent_uuid for agent_uuid, agent_name in AGENT_UUID_TO_NAME_MAP.items()}


def normalize_agent_identifier(raw_identifier: str) -> str:
    """
    Convierte cualquier UUID o nombre en mayúsculas/minúsculas al nombre canónico limpio.
    """
    cleaned_string = str(raw_identifier).strip().lower()
    if cleaned_string in AGENT_UUID_TO_NAME_MAP:
        return AGENT_UUID_TO_NAME_MAP[cleaned_string]
    return cleaned_string


def recommend_agent_picks(
    model_bundle: dict[str, Any], 
    target_map_name: str, 
    already_picked_agents: list[str], 
    top_limit: int = 5
) -> list[tuple[str, float]]:
    """
    Evalúa qué agentes disponibles maximizan la probabilidad de victoria para el mapa actual.
    Devuelve una lista ordenada: [(agente, winrate_estimado), ...]
    """
    trained_model = model_bundle["model"]
    all_available_maps = model_bundle["maps"]
    all_available_agents = model_bundle["agents"]
    feature_column_names = model_bundle["feature_cols"]

    # Limpiar y filtrar los agentes ya elegidos
    cleaned_current_picks = [normalize_agent_identifier(agent) for agent in already_picked_agents if agent]
    valid_locked_agents = [agent for agent in cleaned_current_picks if agent in all_available_agents]
    available_candidate_agents = [agent for agent in all_available_agents if agent not in valid_locked_agents]

    candidate_scores_list = []

    # Probar matemáticamente qué pasa si añadimos cada agente disponible
    for candidate_agent in available_candidate_agents:
        hypothetical_team_composition = valid_locked_agents + [candidate_agent]
        encoded_feature_row = encode_single_composition(
            target_map_name, hypothetical_team_composition, all_available_maps, all_available_agents, feature_column_names
        )
        predicted_win_rate = float(trained_model.predict(encoded_feature_row)[0])
        candidate_scores_list.append((candidate_agent, round(predicted_win_rate, 2)))

    # Ordenar de mayor a menor probabilidad de victoria
    candidate_scores_list.sort(key=lambda item: item[1], reverse=True)
    return candidate_scores_list[:top_limit]


def predict_composition_win_rate(
    model_bundle: dict[str, Any], 
    target_map_name: str, 
    current_team_agents: list[str]
) -> float:
    """
    Calcula el Win Rate total estimado para el equipo actual en el mapa dado.
    """
    trained_model = model_bundle["model"]
    all_available_maps = model_bundle["maps"]
    all_available_agents = model_bundle["agents"]
    feature_column_names = model_bundle["feature_cols"]

    cleaned_team_agents = [normalize_agent_identifier(agent) for agent in current_team_agents if agent]
    valid_team_agents = [agent for agent in cleaned_team_agents if agent in all_available_agents]

    if not valid_team_agents:
        return 0.0

    encoded_feature_row = encode_single_composition(
        target_map_name, valid_team_agents, all_available_maps, all_available_agents, feature_column_names
    )
    predicted_win_rate = float(trained_model.predict(encoded_feature_row)[0])
    return round(predicted_win_rate, 2)


def run_json_prediction(input_json_string: str) -> None:
    """
    Lee JSON de entrada enviado por NestJS, ejecuta la inferencia de IA y responde en JSON por stdout.
    """
    try:
        request_payload = json.loads(input_json_string)
        target_map_name = request_payload.get("mapName") or request_payload.get("map") or "Ascent"
        ally_agents_list = request_payload.get("allies") or request_payload.get("picks") or []

        model_artifact_file_path = os.path.join(
            PROJECT_ROOT, "src", "machine_learning", "models", "draft_model.joblib"
        )
        loaded_model_bundle = load_model_artifact(model_artifact_file_path, verbose=False)

        # 1. Obtener los mejores agentes ordenados por Win Rate
        ranked_recommendations = recommend_agent_picks(
            loaded_model_bundle, target_map_name, ally_agents_list, top_limit=25
        )

        # 2. Calcular la sinergia actual del equipo
        current_team_synergy_win_rate = predict_composition_win_rate(
            loaded_model_bundle, target_map_name, ally_agents_list
        )

        # 3. Formatear la lista de recomendaciones con nombres y UUIDs
        formatted_recommendations_list = []
        for agent_name, estimated_win_rate in ranked_recommendations:
            formatted_recommendations_list.append({
                "agent": agent_name,
                "displayName": agent_name.capitalize(),
                "uuid": AGENT_NAME_TO_UUID_MAP.get(agent_name, ""),
                "winRate": estimated_win_rate,
            })

        # 4. Construir la respuesta final JSON
        response_payload = {
            "success": True,
            "mapName": target_map_name,
            "currentPicks": [normalize_agent_identifier(agent) for agent in ally_agents_list if agent],
            "currentSynergy": current_team_synergy_win_rate,
            "recommendations": formatted_recommendations_list,
        }
        print(json.dumps(response_payload))

    except Exception as error_exception:
        error_payload = {
            "success": False,
            "error": str(error_exception),
            "recommendations": [],
            "currentSynergy": 50.0,
        }
        print(json.dumps(error_payload))


if __name__ == "__main__":
    cli_argument_parser = argparse.ArgumentParser(description="Valorant AI Draft Predictor")
    cli_argument_parser.add_argument("--json", type=str, help="Entrada en formato JSON con mapName y allies")
    cli_argument_parser.add_argument("--map", type=str, help="Nombre del mapa")
    cli_argument_parser.add_argument("--allies", type=str, help="Lista de agentes aliados separados por coma")
    parsed_cli_arguments = cli_argument_parser.parse_args()

    if parsed_cli_arguments.json:
        run_json_prediction(parsed_cli_arguments.json)
    elif parsed_cli_arguments.map is not None:
        allies_list = (
            [agent.strip() for agent in parsed_cli_arguments.allies.split(",")]
            if parsed_cli_arguments.allies
            else []
        )
        json_payload = json.dumps({"mapName": parsed_cli_arguments.map, "allies": allies_list})
        run_json_prediction(json_payload)
