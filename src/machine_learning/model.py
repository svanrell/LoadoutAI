"""
model.py
========
Responsabilidad:
- Entrenar algoritmos de Machine Learning (Random Forest, Ridge, etc.) con sample_weights.
- Evaluar métricas de rendimiento (RMSE, R2).
- Guardar y cargar modelos entrenados (.joblib).
"""

import os
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score


from typing import Any


def train_draft_model(X: pd.DataFrame, y: pd.Series, sample_weights: pd.Series):
    """
    Divide en train/test, entrena un RandomForestRegressor con sample_weights y muestra métricas.
    Devuelve el modelo entrenado.
    """
    # 1. División en train (80%) y test (20%)
    X_train, X_test, y_train, y_test, w_train, w_test = train_test_split(
        X, y, sample_weights, test_size=0.2, random_state=42
    )

    # 2. Creación y entrenamiento del modelo con ponderación de pesos
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X_train, y_train, sample_weight=w_train)

    # 3. Predicciones y cálculo de métricas de evaluación
    y_pred = model.predict(X_test)
    r2 = r2_score(y_test, y_pred, sample_weight=w_test)
    rmse = float(np.sqrt(mean_squared_error(y_test, y_pred, sample_weight=w_test)))

    print("\n--- EVALUACIÓN DEL MODELO ---")
    print(f"R² Score: {r2:.4f}")
    print(f"RMSE:     {rmse:.4f} (Error promedio en predicción de win rate)")

    return model


def save_model_artifact(bundle: dict[str, Any], output_path: str) -> None:
    """Guarda en disco el modelo entrenado junto con sus metadatos (mapas, agentes y feature_cols)."""
    # Asegurar que el directorio de destino exista
    dir_name = os.path.dirname(output_path)
    if dir_name:
        os.makedirs(dir_name, exist_ok=True)

    joblib.dump(bundle, output_path)
    print(f"\nArtefacto del modelo guardado exitosamente en: {output_path}")


def load_model_artifact(model_path: str) -> dict[str, Any]:
    """Carga desde disco el artefacto guardado del modelo."""
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"No se encontró el archivo del modelo en: {model_path}")

    bundle = joblib.load(model_path)
    print(f"\nArtefacto del modelo cargado correctamente desde: {model_path}")
    return bundle

