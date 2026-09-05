"""
predict.py
==========
Punto de entrada principal por línea de comandos (CLI) para ejecutar
inferencias de sinergia de equipo y recomendaciones de draft desde Python.
"""

import os
import sys

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from src.machine_learning.pregame.predict import run_json_prediction, get_model_artifact_path

if __name__ == "__main__":
    import argparse
    import json

    # Comprobar si el archivo del modelo existe antes de procesar la solicitud
    model_artifact_path = get_model_artifact_path()
    if not os.path.exists(model_artifact_path):
        sys.stderr.write(
            f"Error: No se encontró el artefacto del modelo en '{model_artifact_path}'. "
            f"Ejecuta el entrenamiento para generarlo: python src/machine_learning/pregame/model.py\n"
        )
        sys.exit(1)

    # 1. Configuración de los argumentos aceptados por línea de comandos
    cli_parser = argparse.ArgumentParser(description="Predictor de IA para Valorant")
    cli_parser.add_argument("--json", type=str, default=None, help="Payload de entrada en formato JSON")
    cli_parser.add_argument("--map", type=str, default="Ascent", help="Nombre del mapa (ej. Ascent, Haven)")
    cli_parser.add_argument("--mode", type=str, default="competitive", help="Modo de juego (ej. competitive, premier)")
    cli_parser.add_argument("--allies", type=str, default="", nargs="?", help="Lista de agentes aliados separados por coma")
    cli_parser.add_argument("--enemies", type=str, default="", nargs="?", help="Lista de agentes enemigos separados por coma")
    args = cli_parser.parse_args()

    # 2. Si se pasa JSON directo, ejecutarlo; si no, estructurar los argumentos
    if args.json:
        run_json_prediction(args.json)
    else:
        raw_allies = args.allies or ""
        allies_list = [
            agent.strip()
            for agent in raw_allies.split(",")
            if agent.strip() and agent.strip().lower() not in ["none", "null", "undefined", ""]
        ]
        raw_enemies = args.enemies or ""
        enemies_list = [
            agent.strip()
            for agent in raw_enemies.split(",")
            if agent.strip() and agent.strip().lower() not in ["none", "null", "undefined", ""]
        ]
        target_map = args.map or "Ascent"
        payload = json.dumps({
            "mapName": target_map,
            "mode": args.mode or "competitive",
            "allies": allies_list,
            "enemies": enemies_list,
        })
        run_json_prediction(payload)
