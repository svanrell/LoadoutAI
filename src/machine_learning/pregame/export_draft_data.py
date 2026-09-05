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

    bundle = source if isinstance(source, dict) else (joblib.load(source or JOBLIB_PATH) if os.path.exists(source or JOBLIB_PATH) else None)
    if bundle is None:
        raise FileNotFoundError(f"Error: No se encontró el archivo fuente '{source or JOBLIB_PATH}'")

    model = bundle.get("model")
    feature_cols = bundle.get("feature_cols", [])
    weights = bundle.get("weights", {})
    intercept = float(bundle.get("intercept", 0.0))

    if not weights and model is not None and hasattr(model, "coef_") and len(model.coef_) > 0:
        weights = {col: float(c) for col, c in zip(feature_cols, model.coef_[0])}
        if hasattr(model, "intercept_") and len(model.intercept_) > 0:
            intercept = float(model.intercept_[0])

    data = {
        "model_type": "logistic_regression",
        "weights": weights,
        "intercept": intercept,
        "feature_cols": feature_cols,
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
