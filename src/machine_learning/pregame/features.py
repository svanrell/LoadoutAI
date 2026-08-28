import pandas as pd


def extract_unique_entities(clean_dataframe: pd.DataFrame) -> tuple[list[str], list[str]]:
    unique_maps_list = sorted(clean_dataframe["map_name"].unique().tolist())
    unique_agents_list = sorted({
        agent for team_agents in clean_dataframe["agents"] for agent in team_agents
    })
    return unique_maps_list, unique_agents_list


def build_matchup_feature_matrix(
    clean_dataframe: pd.DataFrame,
    all_available_maps: list[str],
    all_available_agents: list[str],
) -> tuple[pd.DataFrame, pd.Series, list[str]]:
    """
    Construye la matriz de enfrentamientos directos (Matchups) donde cada agente se codifica
    de forma diferencial: +1 si está en tu equipo, -1 si está en el equipo rival, 0 si en ambos/ninguno.
    """
    matchups = []

    # Agrupar por partido y mapa para encontrar a los dos equipos que compitieron
    for (match_id, map_name), group in clean_dataframe.groupby(["match_id", "map_name"]):
        if len(group) == 2:
            team_a = group.iloc[0]
            team_b = group.iloc[1]
            weight = float(team_a.get("weight", 1.0))

            # Perspectiva 1: Equipo A (aliado) vs Equipo B (rival)
            matchups.append({
                "map": map_name,
                "ally_agents": team_a["agents"],
                "enemy_agents": team_b["agents"],
                "won": team_a["won"],
                "weight": weight,
            })

            # Perspectiva 2: Equipo B (aliado) vs Equipo A (rival) [Simetría]
            matchups.append({
                "map": map_name,
                "ally_agents": team_b["agents"],
                "enemy_agents": team_a["agents"],
                "won": team_b["won"],
                "weight": weight,
            })

    matchup_df = pd.DataFrame(matchups)

    # Construir filas de características
    X_rows = []
    for _, row in matchup_df.iterrows():
        # 1. Mapa activo
        map_dict = {f"map_{m}": int(row["map"] == m) for m in all_available_maps}

        # 2. Ventaja diferencial de agentes (+1 aliado, -1 rival, 0 neutro)
        agent_diff_dict = {
            f"diff_{a}": int(a in row["ally_agents"]) - int(a in row["enemy_agents"])
            for a in all_available_agents
        }

        X_rows.append({**map_dict, **agent_diff_dict})

    features_matrix_X = pd.DataFrame(X_rows)
    target_y = matchup_df["won"].astype(int)
    sample_weights = matchup_df["weight"].astype(float) if "weight" in matchup_df.columns else pd.Series([1.0] * len(matchup_df))
    feature_column_names = features_matrix_X.columns.tolist()

    return features_matrix_X, target_y, feature_column_names, sample_weights


def encode_single_composition(
    target_map_name: str,
    current_team_agents: list[str],
    all_available_maps: list[str],
    all_available_agents: list[str],
    feature_column_names: list[str],
    enemy_team_agents: list[str] = None,
) -> pd.DataFrame:
    """
    Codifica una composición en tiempo real.
    Si se conocen agentes enemigos, se resta su impacto (-1); si no, se asumen neutros (0).
    """
    target_map_name = str(target_map_name).strip()
    normalized_allies = [str(a).strip().lower() for a in current_team_agents]
    normalized_enemies = [str(a).strip().lower() for a in (enemy_team_agents or [])]

    map_dict = {f"map_{m}": int(target_map_name == m) for m in all_available_maps}
    agent_dict = {
        f"diff_{a}": int(a in normalized_allies) - int(a in normalized_enemies)
        for a in all_available_agents
    }

    all_features = {**map_dict, **agent_dict}
    single_row = {col: all_features.get(col, 0) for col in feature_column_names}
    return pd.DataFrame([single_row], columns=feature_column_names)
