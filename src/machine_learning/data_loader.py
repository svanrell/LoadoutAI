"""
data_loader.py
==============
Responsabilidad:
- Cargar archivos CSV en bruto (raw datasets).
- Desempaquetar y aplanar composiciones de agentes.
- Devolver DataFrames limpios listos para ingeniería de características.
"""

import os
import ast
import pandas as pd


def load_raw_dataset(csv_path: str) -> pd.DataFrame:
    if (os.path.exists(csv_path)):
        print("Se ha encontrado el dataset")
        print(f"Se ha cargado la información del dataset original en la ruta {csv_path}")
        df = pd.read_csv(csv_path)
        return df
    else:
        raise FileNotFoundError(f"No se encontró el archivo: {csv_path}")

def parse_and_flatten_compositions(df_raw: pd.DataFrame) -> pd.DataFrame:
    records = []

    # Recorrer cada fila del DataFrame original
    for _, row in df_raw.iterrows():
        # Parsear las columnas de texto a listas reales de Python
        compositions = ast.literal_eval(row["agent_composition"]) # lista de listas de 5 agentes
        counts = ast.literal_eval(row["agent_composition_played"]) # lista de números
        map_name = str(row["map_name"]).strip()
        win_rate = float(row["map_win_rate"])

        for comp, count in zip(compositions, counts):
            if len(comp) == 5: 
                agents_clean = [a.lower().strip() for a in comp]
                records.append({
                    "map_name": map_name,
                    "win_rate": win_rate,
                    "times_played": int(count),
                    "agents": agents_clean
                })
            else:
                print(f"Se ha omitido una composición que no tiene 5 agentes: {comp}")
                continue
                
    return pd.DataFrame(records)



def get_clean_draft_dataset(csv_path: str) -> pd.DataFrame:
    df_raw = load_raw_dataset(csv_path)
    return parse_and_flatten_compositions(df_raw)

# TEMPORAL
if __name__ == "__main__":
    test_csv = os.path.join("frontend", "src", "csv", "map_stat_teams_overview.csv")
    df_clean = get_clean_draft_dataset(test_csv)
    print("\n--- RESUMEN DEL DATASET APLANADO ---")
    print(f"Total de composiciones individuales: {len(df_clean)}")
    print(f"Columnas resultantes: {list(df_clean.columns)}")
    print("\nPrimeras 3 filas:")
    print(df_clean.head(200))
