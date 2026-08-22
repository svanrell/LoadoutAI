import os
import joblib
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import StratifiedKFold, cross_val_score
from typing import Any


def train_draft_model(
    features_matrix_X: pd.DataFrame,
    target_y: pd.Series,
) -> LogisticRegression:
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    auc_scores = cross_val_score(
        LogisticRegression(C=1.0, random_state=42),
        features_matrix_X,
        target_y,
        cv=cv,
        scoring="roc_auc",
    )
    acc_scores = cross_val_score(
        LogisticRegression(C=1.0, random_state=42),
        features_matrix_X,
        target_y,
        cv=cv,
        scoring="accuracy",
    )

    print(f"ROC-AUC Score (Capacidad predictiva): {auc_scores.mean():.4f} (+/- {auc_scores.std():.4f})")
    print(f"Accuracy (Precisión en partidas):    {acc_scores.mean() * 100:.1f}%")

    trained_model = LogisticRegression(C=1.0, random_state=42)
    trained_model.fit(features_matrix_X, target_y)

    return trained_model


def save_model_artifact(model_bundle: dict[str, Any], output_file_path: str) -> None:
    directory = os.path.dirname(output_file_path)
    if directory:
        os.makedirs(directory, exist_ok=True)
    joblib.dump(model_bundle, output_file_path)
    print(f"Modelo guardado en: {output_file_path}")


def load_model_artifact(model_file_path: str) -> dict[str, Any]:
    if not os.path.exists(model_file_path):
        raise FileNotFoundError(f"No se encontró el archivo del modelo en: {model_file_path}")
    return joblib.load(model_file_path)


def run_training_pipeline(csv_path: str = None, output_path: str = None) -> None:
    from .data_loader import get_clean_draft_dataset, load_agent_pick_rates
    from .features import extract_unique_entities, build_matchup_feature_matrix

    current_dir = os.path.dirname(__file__)
    if csv_path is None:
        csv_path = os.path.join(current_dir, "..", "csv", "detailed_matches_player_stats.csv")
    if output_path is None:
        output_path = os.path.join(current_dir, "artifacts", "draft_model.joblib")

    clean_df = get_clean_draft_dataset(csv_path)
    maps, agents = extract_unique_entities(clean_df)
    X, y, feature_cols = build_matchup_feature_matrix(clean_df, maps, agents)
    pick_rates = load_agent_pick_rates()

    model = train_draft_model(X, y)

    bundle = {
        "model": model,
        "maps": maps,
        "agents": agents,
        "feature_cols": feature_cols,
        "pick_rates": pick_rates,
    }
    save_model_artifact(bundle, output_path)


if __name__ == "__main__":
    run_training_pipeline()