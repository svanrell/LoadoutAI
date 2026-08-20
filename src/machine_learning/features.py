"""
features.py
===========
Responsabilidad:
- Transformar datos de texto (nombres de mapas y agentes) en números mediante One-Hot Encoding.
- Crear la matriz de características X, el vector objetivo y (Win Rate) y los pesos de ponderación.
- Codificar composiciones en vivo para predicciones en tiempo real.
"""

import pandas as pd


def extract_unique_entities(clean_dataframe: pd.DataFrame) -> tuple[list[str], list[str]]:
    """
    Extrae la lista ordenada de mapas y agentes únicos presentes en el dataset.
    """
    unique_maps_list = sorted(clean_dataframe["map_name"].unique().tolist())
    unique_agents_list = sorted({agent for agent_team in clean_dataframe["agents"].to_list() for agent in agent_team})

    print(f"Entidades únicas extraídas:")
    print(f"Mapas ({len(unique_maps_list)}): {unique_maps_list}")
    print(f"Agentes ({len(unique_agents_list)}): {unique_agents_list}")

    return unique_maps_list, unique_agents_list


def build_feature_matrix(
    clean_dataframe: pd.DataFrame, 
    all_available_maps: list[str], 
    all_available_agents: list[str]
) -> tuple[pd.DataFrame, pd.Series, pd.Series, list[str]]:
    """
    Construye la matriz matemática X (con 1s y 0s) y el vector de salida y (Win Rate).
    """
    # 1. One-Hot Encoding para mapas: columna map_ascent = 1 si es Ascent, 0 si no
    map_one_hot_dataframe = pd.DataFrame(
        0, index=clean_dataframe.index, columns=[f"map_{map_name}" for map_name in all_available_maps], dtype=int
    )
    for map_name in all_available_maps:
        map_one_hot_dataframe[f"map_{map_name}"] = (clean_dataframe["map_name"] == map_name).astype(int)

    # 2. One-Hot Encoding para agentes: columna agent_jett = 1 si Jett está en el equipo, 0 si no
    agent_one_hot_dataframe = pd.DataFrame(
        0, index=clean_dataframe.index, columns=[f"agent_{agent_name}" for agent_name in all_available_agents], dtype=int
    )
    for agent_name in all_available_agents:
        agent_one_hot_dataframe[f"agent_{agent_name}"] = clean_dataframe["agents"].apply(
            lambda team_members: int(agent_name in team_members)
        )

    # 3. Unir todas las columnas en la gran matriz de características X
    features_matrix_X = pd.concat([map_one_hot_dataframe, agent_one_hot_dataframe], axis=1)

    # 4. Vector objetivo (y) y pesos según partidas jugadas (sample_weights)
    target_win_rates_y = clean_dataframe["win_rate"]
    sample_weights = clean_dataframe["times_played"]

    # Lista con los nombres de todas las columnas en orden exacto
    feature_column_names = features_matrix_X.columns.tolist()

    print(f"\nDimensiones de la matriz de entrada (X): {features_matrix_X.shape}")
    print(f"Dimensiones del objetivo Win Rate (y): {target_win_rates_y.shape}")
    print(f"Dimensiones de los pesos de muestra: {sample_weights.shape}")
    print(f"Total de columnas de características: {len(feature_column_names)}")

    return features_matrix_X, target_win_rates_y, sample_weights, feature_column_names


def encode_single_composition(
    target_map_name: str, 
    current_team_agents: list[str], 
    all_available_maps: list[str], 
    all_available_agents: list[str], 
    feature_column_names: list[str]
) -> pd.DataFrame:
    """
    Convierte una sola composición de partida en tiempo real a una fila con el formato exacto de X.
    """
    # 1. Marcar el mapa activo
    map_feature_dict = {f"map_{map_name}": 0 for map_name in all_available_maps}
    if target_map_name in all_available_maps:
        map_feature_dict[f"map_{target_map_name}"] = 1

    # 2. Marcar los agentes presentes en el equipo
    agent_feature_dict = {f"agent_{agent_name}": 0 for agent_name in all_available_agents}
    for agent_name in current_team_agents:
        if agent_name in all_available_agents:
            agent_feature_dict[f"agent_{agent_name}"] = 1

    # 3. Combinar ambos diccionarios
    all_features_combined = {**map_feature_dict, **agent_feature_dict}

    # 4. Asegurar que las columnas coincidan exactamente en orden con las del entrenamiento
    single_row_encoded = {col: all_features_combined.get(col, 0) for col in feature_column_names}

    # Retornar como DataFrame de 1 sola fila listo para predict()
    return pd.DataFrame([single_row_encoded], columns=feature_column_names)
