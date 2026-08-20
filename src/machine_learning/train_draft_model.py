import os
import sys

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from src.machine_learning.data_loader import get_clean_draft_dataset
from src.machine_learning.features import extract_unique_entities, build_feature_matrix
from src.machine_learning.model import train_draft_model, save_model_artifact


def run_training_pipeline(csv_path: str, output_model_path: str):
    print("=== INICIANDO PIPELINE DE ENTRENAMIENTO ===")

    # 1. Cargar y aplanar datos
    df = get_clean_draft_dataset(csv_path)

    # 2. Ingeniería de características
    maps, agents = extract_unique_entities(df)
    X, y, weights, feature_cols = build_feature_matrix(df, maps, agents)

    # 3. Entrenar el modelo
    model = train_draft_model(X, y, weights)

    # 4. Empaquetar y guardar el artefacto
    bundle = {
        "model": model,
        "maps": maps,
        "agents": agents,
        "feature_cols": feature_cols,
    }
    save_model_artifact(bundle, output_model_path)
    print("\n=== PIPELINE COMPLETADO EXITOSAMENTE ===")


if __name__ == "__main__":
    csv_file = os.path.join(PROJECT_ROOT, "frontend", "src", "csv", "map_stat_teams_overview.csv")
    model_file = os.path.join(PROJECT_ROOT, "src", "machine_learning", "models", "draft_model.joblib")
    run_training_pipeline(csv_file, model_file)

