import os
import json
import joblib

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
ARTIFACT_DIR = os.path.join(os.path.dirname(__file__), "artifacts")
JOBLIB_PATH = os.path.join(ARTIFACT_DIR, "draft_model.joblib")
JSON_PATH = os.path.join(ARTIFACT_DIR, "draft_data.json")

def export_draft_data():
    if not os.path.exists(JOBLIB_PATH):
        print(f"Error: No se encontro el archivo {JOBLIB_PATH}")
        return

    bundle = joblib.load(JOBLIB_PATH)
    data = {
        "maps": bundle.get("maps", []),
        "agents": bundle.get("agents", []),
        "pick_rates": bundle.get("pick_rates", {}),
        "pair_stats": bundle.get("pair_stats", {}),
    }

    with open(JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"Exportado exitosamente a {JSON_PATH} ({os.path.getsize(JSON_PATH)} bytes)")

if __name__ == "__main__":
    export_draft_data()
