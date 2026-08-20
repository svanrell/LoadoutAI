"""
data_loader.py
==============
Responsabilidad:
- Cargar archivos CSV con estadísticas de partidas de Valorant.
- Desempaquetar y limpiar las composiciones de 5 agentes por equipo.
- Devolver un DataFrame de Pandas listo para la ingeniería de características.
"""

import os
import ast
import pandas as pd


def load_raw_dataset(csv_file_path: str) -> pd.DataFrame:
    """
    Lee el archivo CSV desde el disco y devuelve un DataFrame en bruto.
    """
    if os.path.exists(csv_file_path):
        print("Se ha encontrado el archivo CSV de estadísticas.")
        print(f"Cargando dataset desde: {csv_file_path}")
        raw_dataframe = pd.read_csv(csv_file_path)
        return raw_dataframe
    else:
        raise FileNotFoundError(f"No se encontró el archivo CSV en la ruta: {csv_file_path}")


def parse_and_flatten_compositions(raw_dataframe: pd.DataFrame) -> pd.DataFrame:
    """
    Convierte las columnas de texto con listas de agentes en filas individuales limpias.
    """
    clean_records_list = []

    # Recorrer cada fila del dataset original
    for _, table_row in raw_dataframe.iterrows():
        # ast.literal_eval convierte texto como "['jett', 'omen']" a listas reales de Python
        agent_compositions_list = ast.literal_eval(table_row["agent_composition"])
        games_played_counts = ast.literal_eval(table_row["agent_composition_played"])
        map_name = str(table_row["map_name"]).strip()
        win_rate_percentage = float(table_row["map_win_rate"])

        # Cada mapa tiene múltiples composiciones y partidas jugadas
        for single_composition, times_played in zip(agent_compositions_list, games_played_counts):
            # Solo procesamos equipos completos de 5 agentes
            if len(single_composition) == 5:
                normalized_agents = [agent.lower().strip() for agent in single_composition]
                clean_records_list.append({
                    "map_name": map_name,
                    "win_rate": win_rate_percentage,
                    "times_played": int(times_played),
                    "agents": normalized_agents
                })
            else:
                print(f"Composición descartada por no tener 5 agentes: {single_composition}")
                continue

    return pd.DataFrame(clean_records_list)


def get_clean_draft_dataset(csv_file_path: str) -> pd.DataFrame:
    """
    Función principal de carga: lee el CSV y devuelve el dataset listo para el modelo.
    """
    raw_dataframe = load_raw_dataset(csv_file_path)
    clean_dataframe = parse_and_flatten_compositions(raw_dataframe)
    return clean_dataframe
