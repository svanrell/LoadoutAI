"""
train_draft_model.py
====================
Responsabilidad:
- Ejecutar el pipeline completo de entrenamiento de Machine Learning.
- Cargar datos CSV ➔ Extraer entidades ➔ Construir matriz X e y ➔ Entrenar ➔ Guardar en draft_model.joblib.
"""

import os
import sys

# Asegurar que el directorio raíz del proyecto esté en sys.path
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from src.machine_learning.data_loader import get_clean_draft_dataset
from src.machine_learning.features import extract_unique_entities, build_feature_matrix
from src.machine_learning.model import train_draft_model, save_model_artifact


def run_training_pipeline(dataset_csv_path: str, output_model_artifact_path: str) -> None:
    """
    Orquesta todo el proceso de entrenamiento de principio a fin.
    """
    print("=== INICIANDO PIPELINE DE ENTRENAMIENTO DE IA ===")

    # 1. Cargar y aplanar los datos del CSV
    clean_dataframe = get_clean_draft_dataset(dataset_csv_path)

    # 2. Ingeniería de características (One-Hot Encoding)
    all_maps, all_agents = extract_unique_entities(clean_dataframe)
    features_matrix_X, target_win_rates_y, sample_weights, feature_column_names = build_feature_matrix(
        clean_dataframe, all_maps, all_agents
    )

    # 3. Entrenar el modelo de Random Forest
    trained_model = train_draft_model(features_matrix_X, target_win_rates_y, sample_weights)

    # 4. Empaquetar todo en un bundle para predicciones en tiempo real
    model_bundle = {
        "model": trained_model,
        "maps": all_maps,
        "agents": all_agents,
        "feature_cols": feature_column_names,
    }

    # 5. Guardar el archivo binario final .joblib
    save_model_artifact(model_bundle, output_model_artifact_path)
    print("\n=== PIPELINE COMPLETADO CON ÉXITO ===")


if __name__ == "__main__":
    csv_file_path = os.path.join(PROJECT_ROOT, "frontend", "src", "csv", "map_stat_teams_overview.csv")
    model_output_path = os.path.join(PROJECT_ROOT, "src", "machine_learning", "models", "draft_model.joblib")
    run_training_pipeline(csv_file_path, model_output_path)
