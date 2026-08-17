"""
predict.py
==========
Responsabilidad:
- Función de inferencia / recomendación en tiempo real.
- Dado un mapa y los agentes ya fijados por aliados, evaluar todos los candidatos restantes
  y devolver un ranking con el winrate estimado.
"""

from typing import List, Tuple, Dict, Any


def recommend_agent_picks(
    model_bundle: Dict[str, Any],
    map_name: str,
    current_picks: List[str],
    top_n: int = 5
) -> List[Tuple[str, float]]:
    """
    Evalúa qué agentes disponibles maximizan la probabilidad de victoria.
    Devuelve una lista ordenada [(agente, winrate_estimado), ...]
    """
    pass
