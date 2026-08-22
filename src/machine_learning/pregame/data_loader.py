import os
import pandas as pd


def load_dataset(csv_file_path: str) -> pd.DataFrame:
    if not os.path.exists(csv_file_path):
        raise FileNotFoundError(f"No se encontró el archivo CSV en la ruta: {csv_file_path}")
    print(f"Cargando dataset desde: {csv_file_path}")
    return pd.read_csv(csv_file_path)


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
