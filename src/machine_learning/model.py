"""
model.py
========
Responsabilidad:
- Entrenar el algoritmo de Machine Learning (RandomForestRegressor) con ponderación por partidas jugadas.
- Evaluar métricas matemáticas del modelo (R² Score y RMSE).
- Guardar y cargar el artefacto del modelo (.joblib) en disco.
"""

import os
import joblib
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score
from typing import Any


def train_draft_model(
    features_matrix_X: pd.DataFrame, 
    target_win_rates_y: pd.Series, 
    sample_weights: pd.Series
) -> RandomForestRegressor:
    """
    Divide los datos en entrenamiento (80%) y prueba (20%), entrena el Random Forest y muestra métricas.
    """
    # 1. División en datos de entrenamiento (Train) y datos de evaluación (Test)
    X_train, X_test, y_train, y_test, weights_train, weights_test = train_test_split(
        features_matrix_X, target_win_rates_y, sample_weights, test_size=0.2, random_state=42
    )

    # 2. Instanciar el modelo Random Forest (100 árboles de decisión)
    trained_random_forest_model = RandomForestRegressor(n_estimators=100, random_state=42)
    
    # 3. Ajustar el modelo usando los pesos de frecuencia de partidas
    trained_random_forest_model.fit(X_train, y_train, sample_weight=weights_train)

    # 4. Evaluación en los datos de test que el modelo nunca ha visto
    predictions_test = trained_random_forest_model.predict(X_test)
    r2_score_value = r2_score(y_test, predictions_test, sample_weight=weights_test)
    rmse_error_value = float(mean_squared_error(y_test, predictions_test, sample_weight=weights_test) ** 0.5)

    print("\n--- EVALUACIÓN DEL RENDIMIENTO DEL MODELO ---")
    print(f"R² Score (Calidad de ajuste): {r2_score_value:.4f}")
    print(f"RMSE (Error medio estimado):  {rmse_error_value:.4f}%")

    return trained_random_forest_model


def save_model_artifact(model_bundle_dictionary: dict[str, Any], output_file_path: str) -> None:
    """
    Guarda en disco el modelo entrenado junto con sus metadatos (mapas, agentes y nombres de columnas).
    """
    directory_path = os.path.dirname(output_file_path)
    if directory_path:
        os.makedirs(directory_path, exist_ok=True)

    joblib.dump(model_bundle_dictionary, output_file_path)
    print(f"\nArtefacto de IA guardado con éxito en: {output_file_path}")


def load_model_artifact(model_file_path: str, verbose: bool = True) -> dict[str, Any]:
    """
    Carga desde disco el artefacto guardado del modelo para hacer inferencia rápida.
    """
    if not os.path.exists(model_file_path):
        raise FileNotFoundError(f"No se encontró el archivo del modelo en: {model_file_path}")

    loaded_model_bundle = joblib.load(model_file_path)
    if verbose:
        print(f"\nArtefacto de IA cargado correctamente desde: {model_file_path}")
    return loaded_model_bundle
