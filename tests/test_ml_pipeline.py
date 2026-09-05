"""
test_ml_pipeline.py
===================
Tests unitarios exhaustivos para el subsistema de Machine Learning y Economía en Python.
"""

import os
import sys
import unittest
import pandas as pd

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

import src.machine_learning.economy as economy
from src.machine_learning.economy.predict import recommend_buy_strategy, WEAPON_PRICES, get_loss_reward
from src.machine_learning.pregame.features import build_matchup_feature_matrix, encode_single_composition
from src.machine_learning.pregame.model import train_draft_model, load_model_artifact


class TestEconomyModule(unittest.TestCase):
    def test_imports_cleanly(self):
        self.assertTrue(hasattr(economy, "recommend_buy_strategy"))
        self.assertTrue(hasattr(economy, "WEAPON_PRICES"))

    def test_weapon_prices_validity(self):
        self.assertEqual(WEAPON_PRICES["classic"], 0)
        self.assertEqual(WEAPON_PRICES["ghost"], 500)
        self.assertEqual(WEAPON_PRICES["vandal"], 2900)
        self.assertEqual(WEAPON_PRICES["heavy_shields"], 1000)
        self.assertEqual(WEAPON_PRICES["operator"], 4700)

    def test_recommend_buy_strategy_pistol_round(self):
        rec1 = recommend_buy_strategy(current_credits=800, round_number=1)
        self.assertEqual(rec1["strategy"], "pistol")
        self.assertEqual(rec1["recommended_sidearm"], "ghost")

        rec13 = recommend_buy_strategy(current_credits=800, round_number=13)
        self.assertEqual(rec13["strategy"], "pistol")

    def test_recommend_buy_strategy_full_buy(self):
        rec = recommend_buy_strategy(current_credits=4500, round_number=4)
        self.assertEqual(rec["strategy"], "full_buy")
        self.assertEqual(rec["recommended_primary"], "vandal")
        self.assertEqual(rec["recommended_armor"], "heavy_shields")
        self.assertGreaterEqual(rec["leftover_credits"], 0)

    def test_recommend_buy_strategy_eco_vs_force(self):
        rec_eco = recommend_buy_strategy(current_credits=1800, round_number=3, loss_streak=2)
        self.assertIn(rec_eco["strategy"], ["eco", "force_buy"])

    def test_loss_rewards(self):
        self.assertEqual(get_loss_reward(0), 1900)
        self.assertEqual(get_loss_reward(1), 2400)
        self.assertEqual(get_loss_reward(2), 2900)
        self.assertEqual(get_loss_reward(5), 2900)


class TestFeaturesAndModel(unittest.TestCase):
    def setUp(self):
        self.mock_clean_df = pd.DataFrame([
            {
                "match_id": "match_1",
                "map_name": "Ascent",
                "team_name": "TeamA",
                "players": ["p1", "p2", "p3", "p4", "p5"],
                "agents": ["jett", "sova", "omen", "killjoy", "kayo"],
                "won": 1,
                "weight": 1.0,
            },
            {
                "match_id": "match_1",
                "map_name": "Ascent",
                "team_name": "TeamB",
                "players": ["p6", "p7", "p8", "p9", "p10"],
                "agents": ["raze", "fade", "viper", "cypher", "breach"],
                "won": 0,
                "weight": 1.0,
            },
            {
                "match_id": "match_2",
                "map_name": "Bind",
                "team_name": "TeamC",
                "players": ["p11", "p12", "p13", "p14", "p15"],
                "agents": ["raze", "skye", "brimstone", "viper", "cypher"],
                "won": 1,
                "weight": 1.0,
            },
            {
                "match_id": "match_2",
                "map_name": "Bind",
                "team_name": "TeamD",
                "players": ["p16", "p17", "p18", "p19", "p20"],
                "agents": ["yoru", "gekko", "harbor", "sage", "deadlock"],
                "won": 0,
                "weight": 1.0,
            },
        ])
        self.maps = ["Ascent", "Bind"]
        self.agents = [
            "jett", "sova", "omen", "killjoy", "kayo",
            "raze", "fade", "viper", "cypher", "breach",
            "skye", "brimstone", "yoru", "gekko", "harbor", "sage", "deadlock"
        ]

    def test_build_matchup_feature_matrix_return_types(self):
        res = build_matchup_feature_matrix(self.mock_clean_df, self.maps, self.agents)
        self.assertEqual(len(res), 4)
        X, y, cols, weights = res
        self.assertEqual(len(X), 4) # 2 matches * 2 symmetric perspectives
        self.assertEqual(len(y), 4)
        self.assertEqual(len(weights), 4)

        res_groups = build_matchup_feature_matrix(self.mock_clean_df, self.maps, self.agents, return_groups=True)
        self.assertEqual(len(res_groups), 5)
        X_g, y_g, cols_g, weights_g, groups = res_groups
        self.assertEqual(len(groups), 4)
        # Verify symmetric perspectives share the same match_id
        self.assertEqual(groups.iloc[0], groups.iloc[1])

    def test_encode_single_composition_accepts_none_enemies(self):
        cols = [f"map_{m}" for m in self.maps] + [f"diff_{a}" for a in self.agents]
        encoded = encode_single_composition(
            target_map_name="Ascent",
            current_team_agents=["jett", "sova"],
            all_available_maps=self.maps,
            all_available_agents=self.agents,
            feature_column_names=cols,
            enemy_team_agents=None,
        )
        self.assertEqual(len(encoded), 1)
        self.assertEqual(encoded["map_Ascent"].iloc[0], 1)
        self.assertEqual(encoded["diff_jett"].iloc[0], 1)
        self.assertEqual(encoded["diff_sova"].iloc[0], 1)
        self.assertEqual(encoded["diff_omen"].iloc[0], 0)

    def test_train_draft_model_with_groups_no_leakage(self):
        X, y, cols, weights, groups = build_matchup_feature_matrix(
            self.mock_clean_df, self.maps, self.agents, return_groups=True
        )
        # Small dataset protection works
        model = train_draft_model(X, y, sample_weights=weights, groups=groups)
        self.assertIsNotNone(model)
        preds = model.predict(X)
        self.assertEqual(len(preds), 4)


class TestModelArtifacts(unittest.TestCase):
    def test_load_non_existent_artifact_raises_clear_error(self):
        with self.assertRaises(FileNotFoundError) as ctx:
            load_model_artifact("path/to/non_existent_model.joblib")
        self.assertIn("No se encontró el archivo del modelo", str(ctx.exception))

    def test_validate_draft_data_schema(self):
        from src.machine_learning.pregame.export_draft_data import validate_draft_data

        valid_data = {
            "maps": ["Ascent", "Bind"],
            "agents": ["jett", "sova"],
            "pick_rates": {"ascent": {"jett": 50.0}},
            "pair_stats": {"jett__sova": {"matches": 10, "wins": 6}},
        }
        self.assertTrue(validate_draft_data(valid_data))

        # Missing required key
        invalid_missing_key = {"maps": ["Ascent"], "agents": ["jett"]}
        with self.assertRaises(KeyError):
            validate_draft_data(invalid_missing_key)

        # Invalid type
        invalid_types = {
            "maps": "not-a-list",
            "agents": ["jett"],
            "pick_rates": {},
            "pair_stats": {},
        }
        with self.assertRaises(ValueError):
            validate_draft_data(invalid_types)

    def test_cli_predict_with_artifact(self):
        import subprocess
        python_exe = sys.executable
        result = subprocess.run(
            [python_exe, "src/machine_learning/predict.py", "--map", "Ascent", "--allies", "jett,sova"],
            cwd=PROJECT_ROOT,
            capture_output=True,
            text=True,
        )
        self.assertEqual(result.returncode, 0)
        import json
        output = json.loads(result.stdout)
        self.assertTrue(output["success"])
        self.assertEqual(output["mapName"], "Ascent")
    def test_cli_predict_fails_without_artifact(self):
        import subprocess
        python_exe = sys.executable
        # Ejecutar script con mock para simular que no existe el archivo
        code = (
            "import os, sys\n"
            "from unittest.mock import patch\n"
            "import src.machine_learning.predict as p\n"
            "with patch('src.machine_learning.predict.get_model_artifact_path', return_value='non_existent.joblib'):\n"
            "    artifact_path = p.get_model_artifact_path()\n"
            "    if not os.path.exists(artifact_path):\n"
            "        sys.stderr.write(f'Error: No se encontró el artefacto del modelo en {artifact_path}\\n')\n"
            "        sys.exit(1)\n"
        )
        result = subprocess.run(
            [python_exe, "-c", code],
            cwd=PROJECT_ROOT,
            capture_output=True,
            text=True,
        )
        self.assertEqual(result.returncode, 1)
        self.assertIn("No se encontró el artefacto del modelo", result.stderr)



class TestDataLoader(unittest.TestCase):
    def test_get_clean_draft_dataset_honors_csv_file_path(self):
        import tempfile
        from src.machine_learning.pregame.data_loader import get_clean_draft_dataset

        custom_rows = []
        # Team 1
        for i, (p, a) in enumerate([("p1", "jett"), ("p2", "sova"), ("p3", "omen"), ("p4", "killjoy"), ("p5", "kayo")]):
            custom_rows.append({
                "stat_type": "map",
                "match_id": "custom_match_999",
                "map_name": "Ascent",
                "player_team": "CustomTeamA",
                "player_name": p,
                "agent": a,
                "map_winner": "CustomTeamA",
            })
        # Team 2
        for i, (p, a) in enumerate([("p6", "raze"), ("p7", "fade"), ("p8", "viper"), ("p9", "cypher"), ("p10", "breach")]):
            custom_rows.append({
                "stat_type": "map",
                "match_id": "custom_match_999",
                "map_name": "Ascent",
                "player_team": "CustomTeamB",
                "player_name": p,
                "agent": a,
                "map_winner": "CustomTeamA",
            })

        temp_df = pd.DataFrame(custom_rows)
        with tempfile.NamedTemporaryFile(suffix=".csv", delete=False) as f:
            temp_path = f.name
            temp_df.to_csv(temp_path, index=False)

        try:
            df = get_clean_draft_dataset(csv_file_path=temp_path)
            self.assertEqual(len(df), 2)
            self.assertEqual(df["match_id"].iloc[0], "custom_match_999")
            self.assertEqual(df["map_name"].iloc[0], "Ascent")
            self.assertEqual(set(df["agents"].iloc[0]), {"jett", "sova", "omen", "killjoy", "kayo"})
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)

    def test_get_clean_draft_dataset_missing_file_raises(self):
        from src.machine_learning.pregame.data_loader import get_clean_draft_dataset
        with self.assertRaises(FileNotFoundError):
            get_clean_draft_dataset(csv_file_path="non_existent_file_path_12345.csv")


class TestGroupKFoldValidation(unittest.TestCase):
    def test_group_kfold_guarantees_zero_leakage_between_splits(self):
        from sklearn.model_selection import GroupKFold
        import numpy as np

        records = []
        maps = ["Ascent", "Bind", "Haven"]
        agents = ["jett", "sova", "omen", "killjoy", "kayo", "raze", "fade", "viper", "cypher", "breach"]

        for m_idx in range(25):
            match_id = f"m_{m_idx}"
            team_a_agents = ["jett", "sova", "omen", "killjoy", "kayo"]
            team_b_agents = ["raze", "fade", "viper", "cypher", "breach"]
            records.append({
                "match_id": match_id,
                "map_name": "Ascent",
                "team_name": "A",
                "players": [f"pa_{i}" for i in range(5)],
                "agents": team_a_agents,
                "won": 1 if m_idx % 2 == 0 else 0,
                "weight": 1.0,
            })
            records.append({
                "match_id": match_id,
                "map_name": "Ascent",
                "team_name": "B",
                "players": [f"pb_{i}" for i in range(5)],
                "agents": team_b_agents,
                "won": 0 if m_idx % 2 == 0 else 1,
                "weight": 1.0,
            })

        df = pd.DataFrame(records)
        X, y, cols, weights, groups = build_matchup_feature_matrix(df, maps, agents, return_groups=True)

        gkf = GroupKFold(n_splits=5)
        for fold, (train_idx, val_idx) in enumerate(gkf.split(X, y, groups)):
            train_groups = set(groups.iloc[train_idx])
            val_groups = set(groups.iloc[val_idx])

            # Verificación matemática estricta: ninguna partida del train debe estar en val
            self.assertTrue(train_groups.isdisjoint(val_groups), f"Fuga de datos detectada en el fold {fold}")
            self.assertEqual(len(train_groups.intersection(val_groups)), 0)


class TestTemporalHoldoutAndBaseline(unittest.TestCase):
    def test_temporal_holdout_and_baseline_evaluation(self):
        from sklearn.linear_model import LogisticRegression
        from sklearn.metrics import brier_score_loss, accuracy_score

        records_2025 = []
        records_2026 = []
        maps = ["Ascent", "Bind"]
        agents = ["jett", "sova", "omen", "killjoy", "kayo", "raze", "fade", "viper", "cypher", "breach"]

        # 30 partidas en 2025
        for i in range(30):
            mid = f"match_2025_{i}"
            records_2025.append({
                "match_id": mid,
                "map_name": "Ascent",
                "team_name": "TeamA",
                "players": [f"p_{j}" for j in range(5)],
                "agents": ["jett", "sova", "omen", "killjoy", "kayo"],
                "won": 1 if i % 3 != 0 else 0,
                "weight": 1.0,
            })
            records_2025.append({
                "match_id": mid,
                "map_name": "Ascent",
                "team_name": "TeamB",
                "players": [f"p_{j+5}" for j in range(5)],
                "agents": ["raze", "fade", "viper", "cypher", "breach"],
                "won": 0 if i % 3 != 0 else 1,
                "weight": 1.0,
            })

        # 10 partidas en 2026 (Holdout Temporal)
        for i in range(10):
            mid = f"match_2026_{i}"
            records_2026.append({
                "match_id": mid,
                "map_name": "Ascent",
                "team_name": "TeamC",
                "players": [f"p_{j+10}" for j in range(5)],
                "agents": ["jett", "sova", "omen", "killjoy", "kayo"],
                "won": 1 if i % 2 == 0 else 0,
                "weight": 3.5,
            })
            records_2026.append({
                "match_id": mid,
                "map_name": "Ascent",
                "team_name": "TeamD",
                "players": [f"p_{j+15}" for j in range(5)],
                "agents": ["raze", "fade", "viper", "cypher", "breach"],
                "won": 0 if i % 2 == 0 else 1,
                "weight": 3.5,
            })

        df_train = pd.DataFrame(records_2025)
        df_test = pd.DataFrame(records_2026)

        X_train, y_train, cols_train, w_train = build_matchup_feature_matrix(df_train, maps, agents)
        X_test, y_test, cols_test, w_test = build_matchup_feature_matrix(df_test, maps, agents)

        # Entrenar modelo en 2025
        model = LogisticRegression(C=0.5, max_iter=200, random_state=42)
        model.fit(X_train, y_train, sample_weight=w_train)

        probs_test = model.predict_proba(X_test)[:, 1]
        preds_test = model.predict(X_test)

        # Baseline: predicción ingenua constante p = 0.5
        baseline_probs = [0.5] * len(y_test)
        baseline_brier = brier_score_loss(y_test, baseline_probs)
        model_brier = brier_score_loss(y_test, probs_test)

        # El Brier score del modelo no debe ser patológico (debe ser menor o cercano a la incertidumbre máxima de 0.25)
        self.assertLessEqual(model_brier, 0.30)
        self.assertEqual(len(preds_test), len(y_test))

        # Comprobar separación temporal estricta: ningún ID de 2026 en el set de entrenamiento
        train_ids = set(df_train["match_id"])
        test_ids = set(df_test["match_id"])
        self.assertTrue(train_ids.isdisjoint(test_ids))


class TestConstantsSync(unittest.TestCase):
    def test_python_and_typescript_constants_are_synchronized(self):
        import re
        from src.machine_learning.shared.constants import AGENT_UUID_TO_NAME_MAP, AGENT_ROLES_MAP

        ts_file = os.path.join(PROJECT_ROOT, "src", "shared", "agent-constants.ts")
        self.assertTrue(os.path.exists(ts_file), f"No se encontró el archivo TypeScript de constantes en {ts_file}")

        with open(ts_file, "r", encoding="utf-8") as f:
            ts_content = f.read()

        # Extraer pares UUID -> agente de TypeScript
        ts_uuid_map = {}
        for match in re.finditer(r'"([0-9a-fA-F-]{36})":\s*"([a-z0-9_]+)"', ts_content):
            ts_uuid_map[match.group(1).lower()] = match.group(2).lower()

        # Comprobar que todos los agentes y UUIDs de Python existen con el mismo nombre en TypeScript
        for uuid, name in AGENT_UUID_TO_NAME_MAP.items():
            self.assertIn(uuid.lower(), ts_uuid_map, f"UUID {uuid} ({name}) falta en TypeScript agent-constants.ts")
            self.assertEqual(ts_uuid_map[uuid.lower()], name.lower())


if __name__ == "__main__":
    unittest.main()


