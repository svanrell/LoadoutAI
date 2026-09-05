"""
economy/predict.py
==================
Motor de predicción y recomendaciones económicas para VALORANT en Python.
Contiene catálogo oficial de precios de armamento y lógica de compra para rondas.
"""

from typing import Any

# Precios oficiales de armamento y blindaje en VALORANT
WEAPON_PRICES: dict[str, int] = {
    # Pistolas / Sidearms
    "classic": 0,
    "shorty": 300,
    "frenzy": 450,
    "ghost": 500,
    "sheriff": 800,
    # Subfusiles / SMGs
    "stinger": 1100,
    "spectre": 1600,
    # Escopetas / Shotguns
    "bucky": 850,
    "judge": 1850,
    # Rifles
    "bulldog": 2050,
    "guardian": 2250,
    "phantom": 2900,
    "vandal": 2900,
    # Francotiradores / Snipers
    "marshal": 950,
    "outlaw": 2400,
    "operator": 4700,
    # Ametralladoras pesadas
    "ares": 1600,
    "odin": 3200,
    # Blindajes / Shields
    "light_shields": 400,
    "heavy_shields": 1000,
}


def get_loss_reward(loss_streak: int) -> int:
    """Calcula la recompensa de créditos por derrota según la racha."""
    if loss_streak <= 0:
        return 1900
    if loss_streak == 1:
        return 2400
    return 2900


def recommend_buy_strategy(
    current_credits: int,
    round_number: int,
    loss_streak: int = 0,
) -> dict[str, Any]:
    """
    Genera una recomendación de compra táctica basada en el saldo actual, la ronda y la racha.
    Devuelve la estrategia, armas sugeridas, gasto proyectado y balance posterior.
    """
    credits = max(0, int(current_credits))
    round_num = max(1, int(round_number))
    streak = max(0, int(loss_streak))

    # Ronda pistol (1 y 13)
    if round_num == 1 or round_num == 13:
        return {
            "strategy": "pistol",
            "recommended_primary": None,
            "recommended_sidearm": "ghost",
            "recommended_armor": None,
            "estimated_spend": WEAPON_PRICES["ghost"],
            "leftover_credits": max(0, credits - WEAPON_PRICES["ghost"]),
            "explanation": "Ronda inicial de pistolas: Ghost o Frenzy + utilidad.",
        }

    # Full buy: Vandal / Phantom + Heavy Shields (mínimo 3.900)
    full_buy_threshold = WEAPON_PRICES["vandal"] + WEAPON_PRICES["heavy_shields"]
    if credits >= full_buy_threshold:
        spend = full_buy_threshold
        return {
            "strategy": "full_buy",
            "recommended_primary": "vandal",
            "recommended_sidearm": "classic",
            "recommended_armor": "heavy_shields",
            "estimated_spend": spend,
            "leftover_credits": credits - spend,
            "explanation": "Compra completa de rifle principal y blindaje pesado.",
        }

    # Half buy / Force buy: Spectre o Bulldog + Light Shields (alrededor de 2.000 - 2.500)
    half_buy_spend = WEAPON_PRICES["spectre"] + WEAPON_PRICES["light_shields"]
    min_loss_next = get_loss_reward(streak)
    credits_if_save = credits + min_loss_next

    # Si ahorrando ahora garantizamos full buy la ronda siguiente
    if credits_if_save >= full_buy_threshold and credits < half_buy_spend + 500:
        # Eco / Save
        sidearm = "sheriff" if credits >= 800 + 1000 else "classic"
        spend = WEAPON_PRICES[sidearm]
        return {
            "strategy": "eco",
            "recommended_primary": None,
            "recommended_sidearm": sidearm,
            "recommended_armor": None,
            "estimated_spend": spend,
            "leftover_credits": credits - spend,
            "explanation": "Ronda de ahorro para asegurar Full Buy la ronda siguiente.",
        }

    # Force buy
    return {
        "strategy": "force_buy",
        "recommended_primary": "spectre",
        "recommended_sidearm": "classic",
        "recommended_armor": "light_shields",
        "estimated_spend": half_buy_spend,
        "leftover_credits": max(0, credits - half_buy_spend),
        "explanation": "Compra forzada de subfusil y blindaje ligero para competir la ronda.",
    }


if __name__ == "__main__":
    import argparse
    import json
    import sys

    parser = argparse.ArgumentParser(description="Valorant Economy Buy Recommendation CLI")
    parser.add_argument("--credits", type=int, default=800, help="Current credits balance")
    parser.add_argument("--round", type=int, default=1, help="Round number (1-indexed)")
    parser.add_argument("--streak", type=int, default=0, help="Consecutive loss streak")
    parser.add_argument("--json", type=str, default=None, help="Input JSON payload")
    args = parser.parse_args()

    if args.json:
        try:
            payload = json.loads(args.json)
            c = int(payload.get("credits", 800))
            r = int(payload.get("round", 1))
            s = int(payload.get("streak", 0))
            result = recommend_buy_strategy(c, r, s)
            print(json.dumps({"success": True, "recommendation": result}))
        except Exception as err:
            sys.stderr.write(f"Error parseando JSON: {err}\n")
            print(json.dumps({"success": False, "error": str(err)}))
            sys.exit(1)
    else:
        result = recommend_buy_strategy(args.credits, args.round, args.streak)
        print(json.dumps({"success": True, "recommendation": result}))


