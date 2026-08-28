import os
from collections import defaultdict
import pandas as pd


def load_dataset(csv_file_path: str) -> pd.DataFrame:
    if not os.path.exists(csv_file_path):
        raise FileNotFoundError(f"No se encontró el archivo CSV en la ruta: {csv_file_path}")
    print(f"Cargando dataset desde: {csv_file_path}")
    return pd.read_csv(csv_file_path)


def load_agent_pick_rates(
    csv_file_path: str | None = None,
    vct_dir: str | None = None,
    min_year: int = 2025,
) -> dict[str, dict[str, float]]:
    """
    Calcula la tasa de uso oficial de cada agente por mapa a partir de los datos reales del meta reciente (2025-2026).
    Devuelve un diccionario { 'map_name': { 'agent_name': pick_rate_percentage } }
    """
    if vct_dir is None:
        vct_dir = os.path.join(os.path.dirname(__file__), "..", "data", "vct_2021_2026")

    player_stats_path = os.path.join(vct_dir, "player_stats.csv")
    maps_path = os.path.join(vct_dir, "maps.csv")

    if os.path.exists(player_stats_path) and os.path.exists(maps_path):
        players_df = pd.read_csv(player_stats_path).dropna(subset=["agent"])
        maps_df = pd.read_csv(maps_path)

        recent_df = players_df[players_df["year"] >= min_year].merge(
            maps_df[["match_id", "map", "winner"]], on=["match_id", "map"]
        )

        clean_records = []
        for (match_id, map_name, team), grp in recent_df.groupby(["match_id", "map", "team"]):
            agents = grp["agent"].astype(str).str.strip().str.lower().tolist()
            if len(agents) == 5:
                clean_records.append({
                    "map_name": str(map_name).strip(),
                    "agents": agents,
                })

        clean_df = pd.DataFrame(clean_records)
        map_counts = clean_df["map_name"].value_counts().to_dict()
        pick_rates: dict[str, dict[str, float]] = defaultdict(dict)

        for map_name, total_team_slots in map_counts.items():
            map_sub = clean_df[clean_df["map_name"] == map_name]
            agent_counts: dict[str, int] = defaultdict(int)
            for agents in map_sub["agents"]:
                for a in agents:
                    agent_counts[a] += 1

            for agent, count in agent_counts.items():
                pick_rates[map_name.lower()][agent] = round((count / total_team_slots) * 100.0, 1)

        return dict(pick_rates)

    # Fallback si no está el archivo vct
    if csv_file_path is None:
        csv_file_path = os.path.join(os.path.dirname(__file__), "..", "data", "champions_paris_2025", "agents_stats.csv")

    if not os.path.exists(csv_file_path):
        print(f"Aviso: no se encontró {csv_file_path}, se asumirán tasas neutras.")
        return {}

    df = pd.read_csv(csv_file_path)
    map_columns = [col for col in df.columns if col not in ["agent_name", "total_utilization"]]

    pick_rates = {}
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


def get_clean_draft_dataset(
    csv_file_path: str | None = None,
    vct_dir: str | None = None,
    min_year: int = 2025,
) -> pd.DataFrame:
    """
    Carga y limpia las composiciones de equipo de 5 jugadores.
    Prioriza el dataset moderno del VCT en src/machine_learning/data/vct_2021_2026/ (2025-2026).
    """
    if vct_dir is None:
        vct_dir = os.path.join(os.path.dirname(__file__), "..", "data", "vct_2021_2026")

    player_stats_path = os.path.join(vct_dir, "player_stats.csv")
    maps_path = os.path.join(vct_dir, "maps.csv")

    if os.path.exists(player_stats_path) and os.path.exists(maps_path):
        print(f"Cargando dataset VCT moderno desde {vct_dir} (años >= {min_year})...")
        players_df = pd.read_csv(player_stats_path).dropna(subset=["agent"])
        maps_df = pd.read_csv(maps_path)

        recent_df = players_df[players_df["year"] >= min_year].merge(
            maps_df[["match_id", "map", "winner"]], on=["match_id", "map"]
        )

        clean_records = []
        for (match_id, map_name, team), grp in recent_df.groupby(["match_id", "map", "team"]):
            agents = grp["agent"].astype(str).str.strip().str.lower().tolist()
            players = grp["player"].astype(str).str.strip().tolist()

            if len(agents) == 5:
                winner = grp["winner"].iloc[0] if "winner" in grp.columns else None
                won = int(team == winner) if pd.notna(winner) else 0

                clean_records.append({
                    "match_id": match_id,
                    "map_name": str(map_name).strip(),
                    "team_name": team,
                    "players": players,
                    "agents": agents,
                    "player_agent_map": dict(zip(players, agents)),
                    "won": won,
                    "year": grp["year"].iloc[0] if "year" in grp.columns else min_year,
                })

        return pd.DataFrame(clean_records)

    # Fallback a detailed_matches_player_stats.csv
    if csv_file_path is None:
        csv_file_path = os.path.join(os.path.dirname(__file__), "..", "data", "champions_paris_2025", "detailed_matches_player_stats.csv")

    raw_dataframe = load_dataset(csv_file_path)
    clean_dataframe = parse_and_flatten_compositions(raw_dataframe)
    return clean_dataframe
