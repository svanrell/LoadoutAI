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
    return_groups: bool = False,
) -> tuple[pd.DataFrame, pd.Series, list[str], pd.Series] | tuple[pd.DataFrame, pd.Series, list[str], pd.Series, pd.Series]:
    """
    Construye la matriz de enfrentamientos directos (Matchups) donde cada agente se codifica
    de forma diferencial: +1 si está en tu equipo, -1 si está en el equipo rival, 0 si en ambos/ninguno.
    Si return_groups=True, devuelve también la serie match_ids para GroupKFold.
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
                "match_id": str(match_id),
                "map": map_name,
                "ally_agents": team_a["agents"],
                "enemy_agents": team_b["agents"],
                "won": team_a["won"],
                "weight": weight,
            })

            # Perspectiva 2: Equipo B (aliado) vs Equipo A (rival) [Simetría]
            matchups.append({
                "match_id": str(match_id),
                "map": map_name,
                "ally_agents": team_b["agents"],
                "enemy_agents": team_a["agents"],
                "won": team_b["won"],
                "weight": weight,
            })

    # Construir filas de características de forma optimizada en memoria
    X_rows = []
    y_list = []
    weights_list = []
    match_ids_list = []

    for m in matchups:
        map_name = m["map"]
        ally_set = m["ally_agents"]
        enemy_set = m["enemy_agents"]

        # 1. One-hot encoding del mapa activo
        map_dict = {f"map_{mk}": int(map_name == mk) for mk in all_available_maps}

        # 2. Ventaja diferencial de agentes (+1 aliado, -1 rival, 0 neutro) en O(1)
        agent_diff_dict = {
            f"diff_{a}": int(a in ally_set) - int(a in enemy_set)
            for a in all_available_agents
        }

        X_rows.append({**map_dict, **agent_diff_dict})
        y_list.append(int(m["won"]))
        weights_list.append(m["weight"])
        match_ids_list.append(m["match_id"])

    features_matrix_X = pd.DataFrame(X_rows)
    target_y = pd.Series(y_list, dtype=int)
    sample_weights = pd.Series(weights_list, dtype=float)
    feature_column_names = features_matrix_X.columns.tolist()

    if return_groups:
        match_ids = pd.Series(match_ids_list, dtype=str)
        return features_matrix_X, target_y, feature_column_names, sample_weights, match_ids

    return features_matrix_X, target_y, feature_column_names, sample_weights


def encode_single_composition(
    target_map_name: str,
    current_team_agents: list[str],
    all_available_maps: list[str],
    all_available_agents: list[str],
    feature_column_names: list[str],
    enemy_team_agents: list[str] | None = None,
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

