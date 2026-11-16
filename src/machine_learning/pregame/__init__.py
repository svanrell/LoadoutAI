"""
Paquete pregame. Las importaciones son perezosas: importar el predictor
(src.machine_learning.pregame.predict) no carga pandas ni scikit-learn.
"""

import importlib

_LAZY_EXPORTS = {
    "get_clean_draft_dataset": ".data_loader",
    "load_dataset": ".data_loader",
    "parse_and_flatten_compositions": ".data_loader",
    "extract_unique_entities": ".features",
    "build_matchup_feature_matrix": ".features",
    "encode_single_composition": ".features",
    "train_draft_model": ".model",
    "save_model_artifact": ".model",
    "load_model_artifact": ".model",
    "run_training_pipeline": ".model",
    "recommend_agent_picks": ".predict",
    "predict_composition_win_rate": ".predict",
}

__all__ = list(_LAZY_EXPORTS)


def __getattr__(name: str):
    module_name = _LAZY_EXPORTS.get(name)
    if module_name is None:
        raise AttributeError(f"module {__name__!r} has no attribute {name!r}")
    return getattr(importlib.import_module(module_name, __name__), name)
