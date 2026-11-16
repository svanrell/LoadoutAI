"""
predict.py
==========
Punto de entrada principal por línea de comandos (CLI) para ejecutar
inferencias de sinergia de equipo y recomendaciones de draft desde Python.
Los argumentos y la lógica están en src/machine_learning/pregame/predict.py.
"""

import os
import sys

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from src.machine_learning.pregame.predict import main

if __name__ == "__main__":
    main()
