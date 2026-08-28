# Machine Learning Datasets

Este directorio centraliza todos los datasets de datos competitivos de Valorant utilizados para entrenar los modelos de Inteligencia Artificial de **Loadout AI**.

---

## 📁 Estructura del Directorio

```
src/machine_learning/data/
├── vct_2021_2026/           <-- Base de datos completa VCT Masters y Champions (2021 - 2026)
│   ├── rounds.csv           <-- 24.011 rondas jugadas con marcador, bando y tipo de victoria
│   ├── player_stats.csv     <-- 11.270 estadísticas de jugadores por mapa y agente
│   ├── maps.csv             <-- 1.127 mapas jugados y sus ganadores
│   ├── matches.csv          <-- 445 partidos / series internacionales
│   ├── events.csv           <-- 18 torneos VCT oficiales
│   └── <eventId>-<slug>/    <-- Carpetas con JSONs detallados por torneo y partido
│
└── champions_paris_2025/    <-- Dataset específico del Champions París 2025
    ├── economy_data.csv     <-- Desglose de rondas Eco, Semi-Eco, Semi-Buy y Full Buy
    ├── agents_stats.csv     <-- Tasas de uso por mapa
    ├── performance_data.csv <-- Clutches 1vX, plantas de Spike y defuses
    └── ...
```

---

## 🤖 Uso en los Modelos de IA

1. **Selección y Sinergias de Agentes (`src/machine_learning/pregame/`)**:
   - Entrena con `vct_2021_2026/` filtrando los años recientes (**2025 - 2026**) para reflejar el meta actual.

2. **Modelo de Economía y Armas (`src/machine_learning/economy/`)**:
   - Utiliza `vct_2021_2026/rounds.csv` para reconstruir los bancos de créditos, rachas y predecir compras óptimas y probabilidades de victoria ronda por ronda.
