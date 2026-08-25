import os
import pandas as pd


def load_dataset(csv_file_path: str) -> pd.DataFrame:
    if not os.path.exists(csv_file_path):
        raise FileNotFoundError(f"No se encontró el archivo CSV en la ruta: {csv_file_path}")
    print(f"Cargando dataset desde: {csv_file_path}")
    return pd.read_csv(csv_file_path)


def load_agent_pick_rates(csv_file_path: str | None = None) -> dict[str, dict[str, float]]:
    """
    Carga la tasa de uso oficial de cada agente por mapa desde agents_stats.csv.
    Devuelve un diccionario { 'map_name': { 'agent_name': pick_rate_percentage } }
    """
    if csv_file_path is None:
        csv_file_path = os.path.join(os.path.dirname(__file__), "..", "csv", "agents_stats.csv")
    
    if not os.path.exists(csv_file_path):
        print(f"Aviso: no se encontró {csv_file_path}, se asumirán tasas neutras.")
        return {}

    df = pd.read_csv(csv_file_path)
    map_columns = [col for col in df.columns if col not in ["agent_name", "total_utilization"]]
    
    pick_rates: dict[str, dict[str, float]] = {}
    for _, row in df.iterrows():
        agent = str(row["agent_name"]).strip().lower()
        for m in map_columns:
            m_key = m.strip().lower()
            if m_key not in pick_rates:
                pick_rates[m_key] = {}
            pick_rates[m_key][agent] = float(row[m])

    return pick_rates


def extract_pairwise_win_rates(clean_dataframe: pd.DataFrame) -> dict[str, dict[str, int]]:
    """
    Calcula la matriz empírica de partidas y victorias de cada pareja de agentes a partir de datos reales.
    """
    pair_stats: dict[str, dict[str, int]] = {}
    for _, row in clean_dataframe.iterrows():
        agents = row["agents"]
        won = row["won"]
        for i in range(len(agents)):
            for j in range(i + 1, len(agents)):
                pair_key = "__".join(sorted([agents[i], agents[j]]))
                if pair_key not in pair_stats:
                    pair_stats[pair_key] = {"matches": 0, "wins": 0}
                pair_stats[pair_key]["matches"] += 1
                if won == 1:
                    pair_stats[pair_key]["wins"] += 1
    return pair_stats


def parse_and_flatten_compositions(raw_dataframe: pd.DataFrame) -> pd.DataFrame:
    map_dataframe = raw_dataframe[raw_dataframe["stat_type"] == "map"].copy()
    clean_records = []

    grouped_info = map_dataframe.groupby(["match_id", "map_name", "player_team"])

    for (match_id, map_name, team_name), group in grouped_info:
        players_list = group["player_name"].astype(str).str.strip().tolist()
        agents_list = group["agent"].astype(str).str.strip().str.lower().tolist()

        if len(players_list) != 5:
            continue

        player_to_agent = dict(zip(players_list, agents_list))
        map_winner = group["map_winner"].iloc[0] if "map_winner" in group.columns else None
        won = int(team_name == map_winner) if pd.notna(map_winner) else None

        clean_records.append({
            "match_id": match_id,
            "map_name": str(map_name).strip(),
            "team_name": team_name,
            "players": players_list,
            "agents": agents_list,
            "player_agent_map": player_to_agent,
            "won": won,
        })

    return pd.DataFrame(clean_records)


def get_clean_draft_dataset(csv_file_path: str) -> pd.DataFrame:
    raw_dataframe = load_dataset(csv_file_path)
    clean_dataframe = parse_and_flatten_compositions(raw_dataframe)
    return clean_dataframe
