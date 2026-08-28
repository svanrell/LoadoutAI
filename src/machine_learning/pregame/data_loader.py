import os
from collections import defaultdict
import pandas as pd


# Ponderación del meta: 2026 tiene 3.5x más peso que 2025
YEAR_WEIGHTS = {2026: 3.5, 2025: 1.0}


def load_dataset(csv_file_path: str) -> pd.DataFrame:
    """Carga un archivo CSV desde una ruta dada."""
    if not os.path.exists(csv_file_path):
        raise FileNotFoundError(f"No se encontró el archivo CSV en la ruta: {csv_file_path}")
    return pd.read_csv(csv_file_path)


def get_year_weight(year: int | float) -> float:
    """Devuelve el peso según el año (3.5x para 2026, 1.0x para 2025)."""
    try:
        return YEAR_WEIGHTS.get(int(year), 1.0)
    except Exception:
        return 1.0


def load_clean_vct_compositions(
    vct_dir: str | None = None,
    min_year: int = 2025,
) -> pd.DataFrame:
    """
    Carga y limpia las composiciones de 5 agentes de cada equipo en partidas oficiales de VCT.
    """
    if vct_dir is None:
        vct_dir = os.path.join(os.path.dirname(__file__), "..", "data", "vct_2021_2026")

    player_stats_file = os.path.join(vct_dir, "player_stats.csv")
    maps_file = os.path.join(vct_dir, "maps.csv")

    if not os.path.exists(player_stats_file) or not os.path.exists(maps_file):
        return pd.DataFrame()

    # Paso 1: Leer estadísticas de jugadores y resultados de mapas
    players_df = pd.read_csv(player_stats_file).dropna(subset=["agent"])
    maps_df = pd.read_csv(maps_file)

    # Paso 2: Filtrar años recientes (>= 2025) y unir con el ganador del mapa
    recent_players = players_df[players_df["year"] >= min_year]
    merged_df = recent_players.merge(
        maps_df[["match_id", "map", "winner"]],
        on=["match_id", "map"],
    )

    # Paso 3: Agrupar los 5 jugadores de cada equipo por partida y mapa
    clean_rows = []
    for (match_id, map_name, team_name), group in merged_df.groupby(["match_id", "map", "team"]):
        agent_list = group["agent"].astype(str).str.strip().str.lower().tolist()
        player_list = group["player"].astype(str).str.strip().tolist()

        # Solo aceptar equipos completos de exactamente 5 jugadores
        if len(agent_list) == 5:
            winner = group["winner"].iloc[0] if "winner" in group.columns else None
            won = int(team_name == winner) if pd.notna(winner) else 0
            year = int(group["year"].iloc[0]) if "year" in group.columns else min_year

            clean_rows.append({
                "match_id": match_id,
                "map_name": str(map_name).strip(),
                "team_name": team_name,
                "players": player_list,
                "agents": agent_list,
                "player_agent_map": dict(zip(player_list, agent_list)),
                "won": won,
                "year": year,
                "weight": get_year_weight(year),
            })

    return pd.DataFrame(clean_rows)


def get_clean_draft_dataset(
    csv_file_path: str | None = None,
    vct_dir: str | None = None,
    min_year: int = 2025,
) -> pd.DataFrame:
    """
    Obtiene el dataset final de composiciones para entrenar la IA.
    """
    vct_df = load_clean_vct_compositions(vct_dir=vct_dir, min_year=min_year)
    if not vct_df.empty:
        return vct_df

    # Fallback si no existiera la carpeta VCT
    if csv_file_path is None:
        csv_file_path = os.path.join(
            os.path.dirname(__file__), "..", "data", "champions_paris_2025", "detailed_matches_player_stats.csv"
        )

    if os.path.exists(csv_file_path):
        raw_df = pd.read_csv(csv_file_path)
        return parse_and_flatten_compositions(raw_df)

    return pd.DataFrame()


def load_agent_pick_rates(
    csv_file_path: str | None = None,
    vct_dir: str | None = None,
    min_year: int = 2025,
) -> dict[str, dict[str, float]]:
    """
    Calcula el % de uso (Pick Rate) de cada agente por mapa ponderando 2026 con 3.5x.
    """
    clean_df = get_clean_draft_dataset(csv_file_path=csv_file_path, vct_dir=vct_dir, min_year=min_year)
    if clean_df.empty:
        return {}

    # Sumar el peso total de equipos jugados en cada mapa
    total_weights_by_map: dict[str, float] = defaultdict(float)
    # Sumar el peso acumulado de cada agente en cada mapa
    agent_weights_by_map: dict[str, dict[str, float]] = defaultdict(lambda: defaultdict(float))

    for _, row in clean_df.iterrows():
        map_key = row["map_name"].strip().lower()
        weight = row["weight"]
        total_weights_by_map[map_key] += weight

        for agent in row["agents"]:
            agent_weights_by_map[map_key][agent] += weight

    # Calcular el porcentaje final
    pick_rates: dict[str, dict[str, float]] = defaultdict(dict)
    for map_key, total_weight in total_weights_by_map.items():
        if total_weight > 0:
            for agent, agent_weight in agent_weights_by_map[map_key].items():
                pick_rates[map_key][agent] = round((agent_weight / total_weight) * 100.0, 1)

    return dict(pick_rates)


def extract_pairwise_win_rates(clean_dataframe: pd.DataFrame) -> dict[str, dict[str, float]]:
    """
    Calcula victorias y partidas de cada pareja de agentes (sinergias).
    """
    pair_stats: dict[str, dict[str, float]] = {}

    for _, row in clean_dataframe.iterrows():
        agents = row["agents"]
        won = row["won"]
        weight = float(row.get("weight", 1.0))

        for i in range(len(agents)):
            for j in range(i + 1, len(agents)):
                pair_key = "__".join(sorted([agents[i], agents[j]]))
                if pair_key not in pair_stats:
                    pair_stats[pair_key] = {"matches": 0.0, "wins": 0.0}

                pair_stats[pair_key]["matches"] += weight
                if won == 1:
                    pair_stats[pair_key]["wins"] += weight

    return {
        pair: {
            "matches": round(stats["matches"], 1),
            "wins": round(stats["wins"], 1),
        }
        for pair, stats in pair_stats.items()
    }


def parse_and_flatten_compositions(raw_dataframe: pd.DataFrame) -> pd.DataFrame:
    """
    Parser auxiliar para datasets antiguos estilo detailed_matches.
    """
    map_df = raw_dataframe[raw_dataframe["stat_type"] == "map"].copy()
    clean_records = []

    for (match_id, map_name, team_name), group in map_df.groupby(["match_id", "map_name", "player_team"]):
        players = group["player_name"].astype(str).str.strip().tolist()
        agents = group["agent"].astype(str).str.strip().str.lower().tolist()

        if len(players) == 5:
            winner = group["map_winner"].iloc[0] if "map_winner" in group.columns else None
            won = int(team_name == winner) if pd.notna(winner) else 0

            clean_records.append({
                "match_id": match_id,
                "map_name": str(map_name).strip(),
                "team_name": team_name,
                "players": players,
                "agents": agents,
                "player_agent_map": dict(zip(players, agents)),
                "won": won,
                "year": 2025,
                "weight": 1.0,
            })

    return pd.DataFrame(clean_records)


