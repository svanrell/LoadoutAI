import os
import pandas as pd


def load_economy_dataset(csv_file_path: str) -> pd.DataFrame:
    if not os.path.exists(csv_file_path):
        raise FileNotFoundError(f"No se encontró el archivo CSV en la ruta: {csv_file_path}")
    df = pd.read_csv(csv_file_path)
    # Filtrar solo mapas individuales (descartar 'All Maps')
    return df[df["map"] != "All Maps"].copy()
