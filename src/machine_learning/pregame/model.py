import os
import sys
import json
import joblib
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import GroupKFold, cross_val_score

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)


def train_draft_model(
    features_matrix_X: pd.DataFrame,
    target_y: pd.Series,
    sample_weights: pd.Series | None = None,
    groups: pd.Series | None = None,
) -> LogisticRegression:
    """
    Entrena la regresión logística con validación cruzada por grupos (GroupKFold)
    garantizando que ninguna partida/match_id se reparta entre entrenamiento y validación.
    """
    unique_classes = target_y.nunique()
    if unique_classes < 2 or len(target_y) < 10:
        print("Advertencia: Datos insuficientes o clase única detectada. Entrenando modelo básico sin CV.")
        trained_model = LogisticRegression(C=1.0, random_state=42)
        trained_model.fit(features_matrix_X, target_y, sample_weight=sample_weights)
        return trained_model

    num_groups = groups.nunique() if groups is not None else len(target_y)
    n_splits = min(5, max(2, num_groups // 2))

    if groups is not None and num_groups >= 2:
        cv = GroupKFold(n_splits=n_splits)
        fit_params = {}
        if sample_weights is not None:
            fit_params["sample_weight"] = sample_weights

        auc_scores = cross_val_score(
            LogisticRegression(C=1.0, random_state=42),
            features_matrix_X,
            target_y,
            groups=groups,
            cv=cv,
            scoring="roc_auc",
            params=fit_params if fit_params else None,
        )
        acc_scores = cross_val_score(
            LogisticRegression(C=1.0, random_state=42),
            features_matrix_X,
            target_y,
            groups=groups,
            cv=cv,
            scoring="accuracy",
            params=fit_params if fit_params else None,
        )

        print(f"GroupKFold (n_splits={n_splits}) - Partidas agrupadas para evitar fuga de datos:")
        print(f"ROC-AUC Score (Capacidad predictiva): {auc_scores.mean():.4f} (+/- {auc_scores.std():.4f})")
        print(f"Accuracy (Precisión en partidas):    {acc_scores.mean() * 100:.1f}%")
    else:
        print("Aviso: Grupos insuficientes para GroupKFold. Entrenando ajuste directo.")

    trained_model = LogisticRegression(C=1.0, random_state=42)
    trained_model.fit(features_matrix_X, target_y, sample_weight=sample_weights)

    return trained_model


def save_model_artifact(model_bundle: dict, output_file_path: str) -> None:
    directory = os.path.dirname(output_file_path)
    if directory:
        os.makedirs(directory, exist_ok=True)
    joblib.dump(model_bundle, output_file_path)
    print(f"Modelo guardado en: {output_file_path}")


def load_model_artifact(model_file_path: str) -> dict:
    if not os.path.exists(model_file_path):
        raise FileNotFoundError(f"No se encontró el archivo del modelo en: {model_file_path}")
    return joblib.load(model_file_path)


def run_training_pipeline(csv_path: str | None = None, output_path: str | None = None) -> None:
    from src.machine_learning.pregame.data_loader import (
        get_clean_draft_dataset,
        load_agent_pick_rates,
        extract_pairwise_win_rates,
    )
    from src.machine_learning.pregame.features import extract_unique_entities, build_matchup_feature_matrix
    from src.machine_learning.shared.constants import AGENT_NAME_TO_UUID_MAP

    current_dir = os.path.dirname(__file__)
    if csv_path is None:
        csv_path = os.path.join(current_dir, "..", "data", "vct_2021_2026", "player_stats.csv")
    if output_path is None:
        output_path = os.path.join(current_dir, "artifacts", "draft_model.joblib")

    clean_df = get_clean_draft_dataset(csv_file_path=csv_path)
    if clean_df.empty:
        raise ValueError("No se obtuvieron registros válidos del dataset para entrenar el modelo.")

    maps, agents_in_df = extract_unique_entities(clean_df)
    all_agents = sorted(list(set(agents_in_df + list(AGENT_NAME_TO_UUID_MAP.keys()))))

    # Construir matriz con match_groups para GroupKFold
    X, y, feature_cols, sample_weights, match_groups = build_matchup_feature_matrix(
        clean_df, maps, all_agents, return_groups=True
    )

    # Reutilizar clean_df directamente en memoria para evitar relectura de disco
    pick_rates = load_agent_pick_rates(clean_df=clean_df)
    pair_stats = extract_pairwise_win_rates(clean_df)

    model = train_draft_model(X, y, sample_weights=sample_weights, groups=match_groups)

    weights = {}
    intercept = 0.0
    if hasattr(model, "coef_") and len(model.coef_) > 0:
        weights = {col: float(c) for col, c in zip(feature_cols, model.coef_[0])}
    if hasattr(model, "intercept_") and len(model.intercept_) > 0:
        intercept = float(model.intercept_[0])

    bundle = {
        "model": model,
        "model_type": "logistic_regression",
        "weights": weights,
        "intercept": intercept,
        "maps": maps,
        "agents": all_agents,
        "feature_cols": feature_cols,
        "pick_rates": pick_rates,
        "pair_stats": pair_stats,
    }
    save_model_artifact(bundle, output_path)

    # Exportar y validar automáticamente draft_data.json mediante export_draft_data consolidado
    from src.machine_learning.pregame.export_draft_data import export_draft_data
    json_path = os.path.join(current_dir, "artifacts", "draft_data.json")
    export_draft_data(source=bundle, output_path=json_path)

    # Si existe la carpeta dist, sincronizar
    dist_json_path = os.path.join(PROJECT_ROOT, "dist", "machine_learning", "pregame", "artifacts", "draft_data.json")
    if os.path.exists(os.path.dirname(dist_json_path)):
        export_draft_data(source=bundle, output_path=dist_json_path)



if __name__ == "__main__":
    run_training_pipeline()