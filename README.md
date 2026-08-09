# LoadoutAi - Tactical VALORANT Recommendation Engine (Backend API)

**LoadoutAi** is a tactical agent drafting and round economy recommender system for VALORANT, inspired by the concept of *Itero* from League of Legends.

This backend serves as both the live local game-radar and the data ingestion pipeline. It integrates directly with the official Riot Games APIs to fetch high-rank match logs, uses a hybrid strategy to pull rich asset data, and tracks local client status using WebSockets. The output CSV datasets are consumed by a local Python Machine Learning training pipeline to generate recommendation models.

---

## Key Features

1. **Live Local Game Radar (WebSockets)**: 
   - A real-time [ValorantLocalService](file:///c:/Users/chumi/OneDrive/Escritorio/LoadoutAI/valorant-ai/src/gateway/valorant-local.service.ts) polls the local Riot Client `lockfile` to check the game client status.
   - Using a central Socket.io gateway ([ValorantGateway](file:///c:/Users/chumi/OneDrive/Escritorio/LoadoutAI/valorant-ai/src/gateway/valorant.gateway.ts)), it emits live game state transitions (`CLOSED`, `MENU`, `PREGAME`, `INGAME`) and buy phase data (`buy_phase`) directly to the static web dashboard.
   - Automatically parses game client presence data to map queue IDs to their corresponding game mode configurations.
2. **Interactive Agent Draft Coach & Sandbox Simulator**:
   - A visual cyberpunk-themed offline dashboard allows mock drafting, custom map selection, and agent picks configuration.
   - Simulates pregame lockout timers and details agent specifications, roles, and descriptions interactively.
3. **Dynamic Game Mode Rules Engine**:
   - Supports multiple game modes (Competitive, Unrated, Swiftplay, Spike Rush, Deathmatch, Escalation, Custom Game) with automated rules adaptations.
   - Dynamically parses and displays mode rules such as team capacity, half-round side swaps, and custom economy features (buy allowed vs. buy disabled).
4. **Advanced Team Synergy & Vulnerability Alerts**:
   - Implements a real-time composition synergy calculator showing a dynamic graphical SVG gauge with percentage rating.
   - Analyzes team roles (Duelists, Initiators, Controllers, Sentinels) to diagnose and alert for composition vulnerabilities (e.g. missing smokes/controllers, entry power, or info gathering).
5. **Live In-game HUD & Economy Overlay**:
   - Recommends round-by-round purchase options (weapon, shield, abilities) based on current team credits and map strategy.
   - Generates enemy economy predictions (average credit estimation and loadout ranges) and features team ultimate tracking.
6. **Responsive Cyberpunk Mobile UI Refactor**:
   - Custom CSS styling and media queries optimize the draft layout, synergy indicators, and agent selection grids for mobile devices and tablets.
7. **Hybrid Data Ingestion Pipeline**:
   - **Official Riot Games API** (`VAL-MATCH-V1`, `VAL-RANKED-V1`, and `VAL-CONTENT-V1` for acts): Dynamically ingests high-rank MMR leaderboards, live match histories, and active season act IDs.
   - **Unofficial Valorant Database** (`valorant-api.com`): Retrieves rich static game content (costs, coordinate systems, role descriptions, damage models, and ability lists) to build a highly detailed knowledge base for the ML models.
8. **Production Safeguards**: Implements rate-limiting (`@nestjs/throttler` at 20 req/min) to adhere to Riot developer key policies.

---

## Technology Stack

- **Core Framework**: NestJS (TypeScript Node.js)
- **WebSockets**: Socket.io (via `@nestjs/websockets` & `@nestjs/platform-socket.io`)
- **HTTP Client**: Axios with RxJS observables
- **Rate Limiting**: NestJS Throttler
- **Data Exporting**: Local generic, type-safe CSV mapper
- **Testing**: Jest (Unit and End-to-End integration tests)
- **Python ML Pipeline**: Pandas, NumPy, Scikit-learn (Managed via `requirements.txt` / `.venv`)

---

## Project Structure

```bash
src/
├── gateway/              # WebSocket Gateway & Local Client Radar
│   ├── valorant.gateway.ts
│   └── valorant-local.service.ts
├── valorant_api/         # Restructured Hybrid Ingestion Modules
│   ├── agents/           # Agent details and abilities
│   ├── maps/             # Map geometry and coordinates
│   ├── gear/             # Armor/Shield cost and stats
│   ├── weapons/          # Fire rate, cost, and damage ranges
│   ├── content/          # Acts tracking and active act resolution
│   ├── gamemodes/        # Game mode details
│   └── matches/          # Match details extraction and leaderboard MMR retrieval
├── utils/                # Generic type-safe CSV writer
├── main.ts               # Web application bootstraper
├── app.module.ts         # Module imports and declarations
public/                   # Static HTML and styling for the live Radar dashboard
│   ├── index.html        # Main interactive dashboard and HUD overlay UI
│   ├── script.js         # Websocket connection and simulation coach engine
│   └── style.css         # Cyberpunk-themed styles and responsive layouts
contenido/                # Python ML training pipeline (datasets & pickled models)
```

## API & Testing Guides

For more details on integrating and testing, refer to the following comprehensive guides:
- [gateway_documentation.md](file:///c:/Users/chumi/OneDrive/Escritorio/LoadoutAI/valorant-ai/gateway_documentation.md): Comprehensive WebSockets API documentation listing all events and payloads.
- [postman_endpoints_guide.md](file:///c:/Users/chumi/OneDrive/Escritorio/LoadoutAI/valorant-ai/postman_endpoints_guide.md): In-depth guide detailing backend REST endpoints and Postman collections instructions.

---

## Datasets Output (`infoApi/`)

Running the ingestion routines generates clean, normalized datasets inside `/infoApi` for Python ML training:

- **`agents.csv`**: Uuid, displayName, description, developerName, roleName, roleDescription.
- **`maps.csv`**: Uuid, displayName, narrativeDescription, tacticalDescription, coordinates, xMultiplier, yMultiplier, xScalarToAdd, yScalarToAdd.
- **`gear.csv`**: Uuid, displayName, description, cost, categoryText, damageReduction, damageAbsorbed.
- **`weapons.csv`**: Uuid, displayName, category, cost, magazine size, fire rates, wall penetration.
- **`acts.csv`**: Active acts tracking (to resolve leaderboards).
- **`game_modes.csv`**: Game mode configurations and round parameters.
- **`ranked_leaderboard.csv`**: Active leaderboard MMR ratings of top players.
- **`match_metadata.csv`**: Match IDs, maps, lengths, and queues.
- **`match_players.csv`**: Player performance metrics per match (puuid, score, kills, deaths, assists).
- **`match_rounds.csv`**: Round details (winning team, bomb planter, defuser).
- **`match_round_purchases.csv`**: Granular choice per round: weapon, armor, spent credits, remaining credits, and AFK status.

---

## Setup & Running

### 1. Prerequisites
- Node.js (v18.x or higher)
- npm (v9.x or higher)
- Python (v3.10 or higher) with a configured virtual environment
- A valid Riot Games Developer API Key

### 2. Environment Variables (`.env`)
Create a `.env` file at the root:
```env
VALORANT_API_KEY=your_riot_api_key_here
VALORANT_REGION=eu
PORT=3000
```

### 3. Installation
Install the Node.js packages:
```bash
$ npm install
```

Install the Python dependencies inside your virtual environment (`.venv`):
```bash
$ .venv/bin/pip install -r requirements.txt
```

### 4. Running the App
Start the NestJS backend:
```bash
# Development (watch mode)
$ npm run start:dev

# Production build & run
$ npm run build
$ npm run start:prod
```

Once running, open `http://localhost:3000` in your web browser to access the live **Radar LoadoutAi** dashboard interface, which connects to the WebSockets gateway.

### 5. Running Tests
```bash
# Unit tests
$ npm run test

# End-to-end integration tests
$ npm run test:e2e
```
