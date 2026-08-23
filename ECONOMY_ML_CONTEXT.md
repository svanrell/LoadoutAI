# 📋 Contexto de Machine Learning: Módulo de Economía In-Game

Documento de referencia para retomar en la próxima sesión.

---

## 🎯 1. Resumen de lo completado hoy (Fase 1: Pre-game)

* **Estructura modular creada:**
  - `src/machine_learning/shared/`: Constantes oficiales de Riot, UUIDs y utilidades comunes.
  - `src/machine_learning/pregame/`: Módulo de selección de agentes y draft.
  - `src/machine_learning/economy/`: Módulo de economía y compra in-game (preparado).
  - `src/machine_learning/predict.py`: Punto de entrada raíz conectado con NestJS y React.

* **Modelo de IA Pre-game (`draft_model.joblib`):**
  - Modelo de **Regresión Logística L2** con **Matchup Diferencial** ($X_{\text{aliados}} - X_{\text{rivales}}$).
  - Rendimiento: **`ROC-AUC = 0.7116`** y **`Accuracy = 65.3%`** con 5-Fold Cross Validation.
  - Calibración de recomendaciones: **`70% IA (Sinergia de equipo) + 30% Meta (Pick Rate real del mapa)`**.
  - Probado y verificado en vivo con Electron y NestJS.

---

## 🚀 2. Objetivo para mañana (Fase 2: Economy ML)

Reemplazar los `if/else` manuales por un **Pipeline de Machine Learning real** entrenado con los datos de [`src/machine_learning/csv/economy_data.csv`](file:///c:/Users/chumi/OneDrive/Escritorio/valorant-ai/src/machine_learning/csv/economy_data.csv).

### Interfaz y Datos de Entrada esperados desde la Web:
1. **`credits` (Input numérico):** Créditos que tiene el usuario en la ronda (ej: `800`, `1900`, `2700`, `4200`).
2. **`savedWeapon` (Checkbox/Toggle):** `True` si conservó el arma de la ronda anterior, `False` si murió.
3. **`savedWeaponName`:** Nombre del arma conservada si sobrevivió (ej: `Vandal`, `Phantom`).
4. **`agent`:** Agente que está jugando (para asignar utilidades específicas).
5. **`map`:** Mapa actual en juego (`Bind`, `Ascent`, `Haven`, etc.).

---

## 🏗️ 3. Arquitectura a implementar en `src/machine_learning/economy/`

```text
src/machine_learning/economy/
├── __init__.py
├── data_loader.py    # Parsea economy_data.csv extrayendo winrates reales de Eco/Semi-Buy/Full-Buy por mapa
├── features.py       # Transforma [mapa, créditos, agente, arma_guardada] en matrices numéricas X
├── model.py          # Entrena el modelo de optimización económica y guarda economy_model.joblib
├── predict.py        # Inferencia de IA que calcula la mejor compra y cesta de habilidades
└── artifacts/        # Guarda economy_model.joblib
```

### Lógica del Modelo de ML:
* **Cálculo de Esperanza Matemática:** El modelo calcula para cada opción posible (`Eco`, `Force Buy`, `Full Buy`, `Guardar Arma`) la probabilidad real de victoria $P(\text{Win})$ en ese mapa.
* **Cesta Inteligente:** Devuelve el arma óptima + escudo + habilidades clave del agente maximizando el impacto y protegiendo los créditos de rondas futuras.

---

## 📝 4. Comandos rápidos para probar el proyecto mañana

```powershell
# Iniciar Backend NestJS:
npm run start:prod

# Iniciar Ventana de Electron:
npm run electron

# O en modo desarrollo con Hot-Reload:
npm run start:dev
cd frontend && npm run dev
```
