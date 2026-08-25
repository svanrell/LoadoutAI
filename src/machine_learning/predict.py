import os
import sys

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from src.machine_learning.pregame.predict import run_json_prediction

if __name__ == "__main__":
    import argparse
    import json
    cli_parser = argparse.ArgumentParser(description="Valorant AI Predictor")
    cli_parser.add_argument("--json", type=str, default=None, help="Input JSON")
    cli_parser.add_argument("--map", type=str, default="Ascent", help="Map name")
    cli_parser.add_argument("--mode", type=str, default="competitive", help="Mode name")
    cli_parser.add_argument("--allies", type=str, default="", nargs="?", help="Allies list comma-separated")
    cli_parser.add_argument("--enemies", type=str, default="", nargs="?", help="Enemies list comma-separated")
    args = cli_parser.parse_args()

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
