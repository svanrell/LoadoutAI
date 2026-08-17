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
from typing import Dict, Any


def train_draft_model(X: pd.DataFrame, y: pd.Series, sample_weights: pd.Series):
    """
    Divide en train/test, entrena el modelo de Machine Learning y muestra métricas de evaluación.
    Devuelve el modelo entrenado.
    """
    pass


def save_model_artifact(bundle: Dict[str, Any], output_path: str):
    """Guarda en disco el modelo entrenado junto con sus metadatos (mapas, agentes y feature_cols)."""
    pass


def load_model_artifact(model_path: str) -> Dict[str, Any]:
    """Carga desde disco el artefacto guardado del modelo."""
    pass
