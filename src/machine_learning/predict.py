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
    cli_parser.add_argument("--allies", type=str, default="", nargs="?", help="Allies list comma-separated")
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
        target_map = args.map or "Ascent"
        payload = json.dumps({"mapName": target_map, "allies": allies_list})
        run_json_prediction(payload)
