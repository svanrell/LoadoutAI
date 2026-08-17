"""
features.py
===========
Responsabilidad:
- Transformar texto categórico (nombres de mapas y agentes) en matrices numéricas (One-Hot / Multi-Hot Encoding).
- Construir matrices X (features), y (target), pesos y metadatos de columnas.
"""

import pandas as pd
from typing import Tuple, List, Dict, Any


def extract_unique_entities(df: pd.DataFrame) -> Tuple[List[str], List[str]]:
    """Extrae la lista ordenada de mapas y agentes únicos presentes en el dataset."""
    pass


def build_feature_matrix(
    df: pd.DataFrame, all_maps: List[str], all_agents: List[str]
) -> Tuple[pd.DataFrame, pd.Series, pd.Series, List[str]]:
    """
    Construye:
    - X: Matriz con columnas dummy para mapas (One-Hot) y agentes (Multi-Hot 0/1).
    - y: Variable objetivo (win_rate).
    - weights: Vector de pesos (times_played) para ponderar las partidas.
    - feature_cols: Lista con los nombres de todas las columnas de entrada.
    """
    pass


def encode_single_composition(
    map_name: str, team_agents: List[str], all_maps: List[str], all_agents: List[str], feature_cols: List[str]
) -> pd.DataFrame:
    """Convierte una única composición en el vector numérico exacto que espera el modelo para predecir."""
    pass
