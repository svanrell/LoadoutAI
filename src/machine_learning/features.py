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
    """
    Construye:
    - X: Matriz con columnas dummy para mapas (One-Hot) y agentes (Multi-Hot 0/1).
    - y: Variable objetivo (win_rate).
    - weights: Vector de pesos (times_played) para ponderar las partidas.   
    - feature_cols: Lista con los nombres de todas las columnas de entrada.
    """
    # 1. One-Hot Encoding para mapas (garantiza todas las columnas de all_maps)
    map_dummies = pd.DataFrame(0, index=df.index, columns=[f"map_{m}" for m in all_maps], dtype=int)
    for m in all_maps:
        map_dummies[f"map_{m}"] = (df["map_name"] == m).astype(int)

    # 2. Multi-Hot Encoding para agentes (1 si el agente está en la composición, 0 si no)
    agent_dummies = pd.DataFrame(0, index=df.index, columns=[f"agent_{a}" for a in all_agents], dtype=int)
    for a in all_agents:
        agent_dummies[f"agent_{a}"] = df["agents"].apply(lambda team: int(a in team))

    # 3. Construimos X uniendo las matrices de mapas y agentes
    X = pd.concat([map_dummies, agent_dummies], axis=1)

    # 4. Target (y) y pesos de ponderación (weights)
    y = df["win_rate"]
    weights = df["times_played"]

    # 5. Lista con todas las columnas de entrada
    feature_cols = X.columns.tolist()

    print(f"\nShape de la matriz de features (X): {X.shape}")
    print(f"Shape del target (y): {y.shape}")
    print(f"Shape de los pesos (weights): {weights.shape}")
    print(f"Total de columnas en feature_cols: {len(feature_cols)}")

    return X, y, weights, feature_cols


def encode_single_composition(
    map_name: str, team_agents: list[str], all_maps: list[str], all_agents: list[str], feature_cols: list[str]
) -> pd.DataFrame:
    """Convierte una única composición en el vector numérico exacto que espera el modelo para predecir."""
    pass


if __name__ == "__main__":
    import os
    import sys

    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    if project_root not in sys.path:
        sys.path.insert(0, project_root)

    from src.machine_learning.data_loader import get_clean_draft_dataset

    csv_path = os.path.join(project_root, "frontend", "src", "csv", "map_stat_teams_overview.csv")
    df = get_clean_draft_dataset(csv_path)

    print("\n--- 1. PROBANDO extract_unique_entities() ---")
    maps, agents = extract_unique_entities(df)

    print("\n--- 2. PROBANDO build_feature_matrix() ---")
    X, y, weights, feature_cols = build_feature_matrix(df, maps, agents)
    print("\nPrimeras 5 filas de X:")
    print(X.head())
