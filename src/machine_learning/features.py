import pandas as pd


def extract_unique_entities(df: pd.DataFrame) -> tuple[list[str], list[str]]:
    """Extrae la lista ordenada de mapas y agentes únicos presentes en el dataset."""
    maps = sorted(df['map_name'].unique().tolist())
    agents = sorted({agent for agent_list in df['agents'].to_list() for agent in agent_list})
    print(f"Se ha extraído la lista de mapas y agentes")
    print(f"Mapas ({len(maps)}): {maps}")
    print(f"Agentes ({len(agents)}): {agents}")

    return maps, agents


def build_feature_matrix(
    df: pd.DataFrame, all_maps: list[str], all_agents: list[str]
) -> tuple[pd.DataFrame, pd.Series, pd.Series, list[str]]:
    
    map_dummies = pd.DataFrame(0, index=df.index, columns=[f"map_{m}" for m in all_maps], dtype=int)
    for m in all_maps:
        map_dummies[f"map_{m}"] = (df["map_name"] == m).astype(int)
    agent_dummies = pd.DataFrame(0, index=df.index, columns=[f"agent_{a}" for a in all_agents], dtype=int)
    for a in all_agents:
        agent_dummies[f"agent_{a}"] = df["agents"].apply(lambda team: int(a in team))

    X = pd.concat([map_dummies, agent_dummies], axis=1)

    y = df["win_rate"]
    weights = df["times_played"]

    #Lista con todas las columnas de entrada
    feature_cols = X.columns.tolist()

    print(f"\nShape de la matriz de features (X): {X.shape}")
    print(f"Shape del target (y): {y.shape}")
    print(f"Shape de los pesos (weights): {weights.shape}")
    print(f"Total de columnas en feature_cols: {len(feature_cols)}")

    return X, y, weights, feature_cols


def encode_single_composition(
    map_name: str, team_agents: list[str], all_maps: list[str], all_agents: list[str], feature_cols: list[str]
) -> pd.DataFrame:
    map_row = {f"map_{m}": 0 for m in all_maps}
    if map_name in all_maps:
        map_row[f"map_{map_name}"] = 1

    agent_row = {f"agent_{a}": 0 for a in all_agents}
    for agent in team_agents:
        if agent in all_agents:
            agent_row[f"agent_{agent}"] = 1

    # Combina todo en un único diccionario
    combined = {**map_row, **agent_row}

    # Asegura que tenga EXACTAMENTE las columnas de feature_cols y en el MISMO ORDEN
    encoded_row = {col: combined.get(col, 0) for col in feature_cols}

    # Convertimos a DataFrame de una sola fila con el índice 0
    return pd.DataFrame([encoded_row], columns=feature_cols)
