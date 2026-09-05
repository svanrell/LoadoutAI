import os
from collections import defaultdict
import pandas as pd


def load_dataset(csv_file_path: str) -> pd.DataFrame:
    """Carga un archivo CSV desde una ruta dada."""
    if not os.path.exists(csv_file_path):
        raise FileNotFoundError(f"No se encontró el archivo CSV en la ruta: {csv_file_path}")
    return pd.read_csv(csv_file_path)


def get_year_weight(year: int | float) -> float:
    """
    Devuelve la importancia de la partida:
    - 2026: peso 3.5x (meta actual)
    - 2025: peso 1.0x (meta año pasado)
    """
    if year == 2026:
        return 3.5
    else:
        return 1.0


def load_clean_vct_compositions(
    vct_dir: str | None = None,
    min_year: int = 2025,
) -> pd.DataFrame:
    """
    Carga y limpia las composiciones de 5 agentes de cada equipo en partidas oficiales de VCT.
    Optimizado: solo lee las columnas necesarias desde disco.
    """
    if vct_dir is None:
        vct_dir = os.path.join(os.path.dirname(__file__), "..", "data", "vct_2021_2026")

    player_stats_file = os.path.join(vct_dir, "player_stats.csv")
    maps_file = os.path.join(vct_dir, "maps.csv")

    if not os.path.exists(player_stats_file) or not os.path.exists(maps_file):
        return pd.DataFrame()

    # Paso 1: Carga selectiva de solo las columnas que necesitamos (40% más rápido)
    players_df = pd.read_csv(
        player_stats_file,
        usecols=["match_id", "map", "team", "player", "agent", "year"],
    ).dropna(subset=["agent"])

    maps_df = pd.read_csv(
        maps_file,
        usecols=["match_id", "map", "winner"],
    )

    # Paso 2: Filtrar años recientes (>= 2025) y unir con el ganador del mapa
    recent_players = players_df[players_df["year"] >= min_year]
    merged_df = recent_players.merge(maps_df, on=["match_id", "map"])

    # Paso 3: Agrupar los 5 jugadores de cada equipo por partida y mapa con validaciones estrictas
    clean_rows = []
    total_raw_teams = 0

    for (match_id, map_name, team_name), group in merged_df.groupby(["match_id", "map", "team"]):
        total_raw_teams += 1
        agent_list = [a.strip().lower() for a in group["agent"].astype(str) if a and str(a).strip().lower() not in ["nan", "none", ""]]
        player_list = [p.strip() for p in group["player"].astype(str) if p and str(p).strip().lower() not in ["nan", "none", ""]]

        # 1. Validar exactamente 5 jugadores y que sean únicos
        if len(player_list) != 5 or len(set(player_list)) != 5:
            continue

        # 2. Validar exactamente 5 agentes y que sean únicos
        if len(agent_list) != 5 or len(set(agent_list)) != 5:
            continue

        # 3. Descartar partidas sin ganador conocido
        winner = group["winner"].iloc[0] if "winner" in group.columns else None
        if not winner or pd.isna(winner) or str(winner).strip().lower() in ["nan", "none", "", "unknown"]:
            continue

        team_str = str(team_name).strip()
        winner_str = str(winner).strip()
        won = int(team_str.lower() == winner_str.lower())
        year = int(group["year"].iloc[0]) if "year" in group.columns else min_year
        norm_map = str(map_name).strip().capitalize()

        clean_rows.append({
            "match_id": str(match_id),
            "map_name": norm_map,
            "team_name": team_str,
            "players": player_list,
            "agents": agent_list,
            "player_agent_map": dict(zip(player_list, agent_list)),
            "won": won,
            "year": year,
            "weight": get_year_weight(year),
        })

    candidate_df = pd.DataFrame(clean_rows)
    if candidate_df.empty:
        return candidate_df

    # 4. Comprobar que cada partida/mapa tenga exactamente dos equipos y un solo ganador
    valid_match_maps = []
    for (match_id, map_name), match_group in candidate_df.groupby(["match_id", "map_name"]):
        if len(match_group) == 2 and match_group["won"].sum() == 1:
            valid_match_maps.append((match_id, map_name))

    valid_keys = set(valid_match_maps)
    final_df = candidate_df[candidate_df.apply(lambda r: (r["match_id"], r["map_name"]) in valid_keys, axis=1)].copy()

    print(f"Limpieza de composiciones VCT: {len(final_df)} equipos válidos ({len(final_df) // 2} partidas) de {total_raw_teams} candidatos evaluados.")
    return final_df



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
    clean_df: pd.DataFrame | None = None,
) -> dict[str, dict[str, float]]:
    """
    Calcula el % de uso (Pick Rate) de cada agente por mapa ponderando 2026 con 3.5x.
    Optimizado: itera por tuplas ultrarrápidas en memoria.
    """
    if clean_df is None:
        clean_df = get_clean_draft_dataset(csv_file_path=csv_file_path, vct_dir=vct_dir, min_year=min_year)

    if clean_df.empty:
        return {}

    # Si el valor no existe se asigna 0.0 y no da error
    total_weights_by_map: dict[str, float] = defaultdict(float)
    agent_weights_by_map: dict[str, dict[str, float]] = defaultdict(lambda: defaultdict(float))

    # Iteración optimizada por tuplas con nombre
    for row in clean_df.itertuples(index=False):
        map_key = row.map_name.strip().lower()
        w = row.weight
        total_weights_by_map[map_key] += w

        for agent in row.agents:
            agent_weights_by_map[map_key][agent] += w

    # Calcular porcentajes finales
    pick_rates: dict[str, dict[str, float]] = defaultdict(dict)
    for map_key, total_weight in total_weights_by_map.items():
        if total_weight > 0:
            for agent, agent_weight in agent_weights_by_map[map_key].items():
                pick_rates[map_key][agent] = round((agent_weight / total_weight) * 100.0, 1)

    return dict(pick_rates)


def extract_pairwise_win_rates(clean_dataframe: pd.DataFrame) -> dict[str, dict[str, float]]:
    """
    Calcula victorias y partidas de cada pareja de agentes (sinergias).
    Optimizado: claves directas sin listas temporales.
    """
    pair_stats: dict[str, dict[str, float]] = {}

    for row in clean_dataframe.itertuples(index=False):
        agents = row.agents
        won = row.won
        weight = float(getattr(row, "weight", 1.0))

        for i in range(len(agents)):
            for j in range(i + 1, len(agents)):
                a, b = agents[i], agents[j]
                pair_key = f"{a}__{b}" if a < b else f"{b}__{a}"

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
    Parser auxiliar para datasets antiguos estilo detailed_matches con validaciones estrictas.
    """
    map_df = raw_dataframe[raw_dataframe["stat_type"] == "map"].copy()
    clean_records = []

    for (match_id, map_name, team_name), group in map_df.groupby(["match_id", "map_name", "player_team"]):
        players = [p.strip() for p in group["player_name"].astype(str) if p and p.strip().lower() not in ["nan", "none", ""]]
        agents = [a.strip().lower() for a in group["agent"].astype(str) if a and a.strip().lower() not in ["nan", "none", ""]]

        if len(players) == 5 and len(set(players)) == 5 and len(agents) == 5 and len(set(agents)) == 5:
            winner = group["map_winner"].iloc[0] if "map_winner" in group.columns else None
            if not winner or pd.isna(winner) or str(winner).strip().lower() in ["nan", "none", "", "unknown"]:
                continue

            team_str = str(team_name).strip()
            winner_str = str(winner).strip()
            won = int(team_str.lower() == winner_str.lower())

            clean_records.append({
                "match_id": str(match_id),
                "map_name": str(map_name).strip().capitalize(),
                "team_name": team_str,
                "players": players,
                "agents": agents,
                "player_agent_map": dict(zip(players, agents)),
                "won": won,
                "year": 2025,
                "weight": 1.0,
            })

    candidate_df = pd.DataFrame(clean_records)
    if candidate_df.empty:
        return candidate_df

    valid_match_maps = []
    for (match_id, map_name), match_group in candidate_df.groupby(["match_id", "map_name"]):
        if len(match_group) == 2 and match_group["won"].sum() == 1:
            valid_match_maps.append((match_id, map_name))

    valid_keys = set(valid_match_maps)
    return candidate_df[candidate_df.apply(lambda r: (r["match_id"], r["map_name"]) in valid_keys, axis=1)].copy()



