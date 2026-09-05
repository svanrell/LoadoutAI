import os
import json
import joblib

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
ARTIFACT_DIR = os.path.join(os.path.dirname(__file__), "artifacts")
JOBLIB_PATH = os.path.join(ARTIFACT_DIR, "draft_model.joblib")
JSON_PATH = os.path.join(ARTIFACT_DIR, "draft_data.json")


def validate_draft_data(data: dict) -> bool:
    """
    Valida estrictamente el esquema de datos del artefacto draft_data.json.
    Exige la presencia de maps, agents, pick_rates y pair_stats con tipos válidos.
    """
    if not isinstance(data, dict):
        raise ValueError("El artefacto draft_data debe ser un diccionario.")

    required_keys = ["maps", "agents", "pick_rates", "pair_stats"]
    for key in required_keys:
        if key not in data:
            raise KeyError(f"Clave obligatoria ausente en draft_data: '{key}'")

    if not isinstance(data["maps"], list) or len(data["maps"]) == 0:
        raise ValueError("La propiedad 'maps' debe ser una lista no vacía.")

    if not isinstance(data["agents"], list) or len(data["agents"]) == 0:
        raise ValueError("La propiedad 'agents' debe ser una lista no vacía.")

    if not isinstance(data["pick_rates"], dict):
        raise ValueError("La propiedad 'pick_rates' debe ser un diccionario.")

    if not isinstance(data["pair_stats"], dict):
        raise ValueError("La propiedad 'pair_stats' debe ser un diccionario.")

    return True


def export_draft_data(
    source: dict | str | None = None,
    output_path: str | None = None,
) -> str:
    """
    Exporta y valida el archivo JSON para el motor en tiempo de ejecución.
    Acepta un diccionario ya en memoria o la ruta a un bundle joblib.
    """
    target_path = output_path or JSON_PATH

    if isinstance(source, dict):
        data = {
            "maps": source.get("maps", []),
            "agents": source.get("agents", []),
            "pick_rates": source.get("pick_rates", {}),
            "pair_stats": source.get("pair_stats", {}),
        }
    else:
        src_path = source or JOBLIB_PATH
        if not os.path.exists(src_path):
            raise FileNotFoundError(f"Error: No se encontró el archivo fuente '{src_path}'")
        bundle = joblib.load(src_path)
        data = {
            "maps": bundle.get("maps", []),
            "agents": bundle.get("agents", []),
            "pick_rates": bundle.get("pick_rates", {}),
            "pair_stats": bundle.get("pair_stats", {}),
        }

    validate_draft_data(data)

    os.makedirs(os.path.dirname(target_path), exist_ok=True)
    with open(target_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"Exportado y validado exitosamente a {target_path} ({os.path.getsize(target_path)} bytes)")
    return target_path


if __name__ == "__main__":
    export_draft_data()
