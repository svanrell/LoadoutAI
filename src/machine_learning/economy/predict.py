WEAPON_PRICES = {
    "vandal": 2900,
    "phantom": 2900,
    "operator": 4700,
    "sheriff": 800,
    "spectre": 1600,
    "guardian": 2250,
    "bulldog": 2050,
    "judge": 1850,
    "ghost": 500,
    "classic": 0,
    "heavy_shield": 1000,
    "light_shield": 400,
}


def recommend_buy_strategy(credits: int, round_number: int, is_attack: bool = True) -> dict:
    """
    Estrategia de compra basada en créditos disponibles y ronda:
    - Save / Eco (< 2000 créditos)
    - Semi-buy / Force buy (2000 - 3800 créditos)
    - Full buy (>= 3900 créditos)
    """
    if round_number == 1 or round_number == 13:
        return {
            "type": "Pistol Round",
            "recommended_weapon": "ghost",
            "shield": "light_shield",
            "advice": "Ronda de pistolas: compra Ghost + Habilidades o Classic + Escudo Ligero."
        }

    if credits >= 3900:
        return {
            "type": "Full Buy",
            "recommended_weapon": "vandal",
            "shield": "heavy_shield",
            "advice": "Compra completa: Vandal/Phantom + Escudo Pesado y todas las habilidades."
        }
    elif credits >= 2400:
        return {
            "type": "Semi Buy / Force Buy",
            "recommended_weapon": "spectre",
            "shield": "light_shield",
            "advice": "Compra media: Spectre/Bulldog + Escudo Ligero. Si el equipo ahorra, guarda para la siguiente."
        }
    else:
        return {
            "type": "Eco / Save",
            "recommended_weapon": "classic",
            "shield": "none",
            "advice": "Ronda de ahorro (Eco): guarda créditos para asegurar Full Buy en la siguiente ronda."
        }
