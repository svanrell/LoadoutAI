<div align="center">
  <img src="https://media.valorant-api.com/maps/7eae2e51-4ece-f12b-57fc-92b2dd29d3c4/splash.png" alt="Valorant LoadoutAI Banner" width="100%" style="border-radius: 10px; margin-bottom: 20px;">
  
  <h1 align="center">🔥 LOADOUT AI // TACTICAL RADAR 🔥</h1>
  <p align="center"><strong>The Ultimate VALORANT Agent Drafting & Round Economy Engine</strong></p>
  
  <p align="center">
    <a href="#"><img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS"></a>
    <a href="#"><img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js"></a>
    <a href="#"><img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"></a>
    <a href="#"><img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python ML"></a>
    <a href="#"><img src="https://img.shields.io/badge/Status-RADIANT-ff4655?style=for-the-badge&logo=valorant" alt="Radiant Status"></a>
  </p>
</div>

---

## WHAT IS LOADOUT AI?

**LoadoutAi** is a cutting-edge tactical assistant for VALORANT. Inspired by high-elo coaching tools, it acts as your personal in-game strategist. 

This is not just another tracker. It's a **Real-Time Data Pipeline & ML Engine** that tracks your local game state, analyzes team compositions, and calculates perfect economy rounds using a hybrid Riot Games API strategy.

<div align="center">
  <img src="https://media.valorant-api.com/weapons/29a0cfab-485b-f5d5-779a-b59f85e204a8/displayicon.png" width="300px">
  <br>
  <i>"Know your economy. Win the round."</i>
</div>

---

## BADASS FEATURES

### Live Local Game Radar
Forget alt-tabbing. Our real-time **WebSocket Gateway** polls your local Riot Client `lockfile`. It knows when you are in the menu, drafting agents, or sweating in a live match.

### 1:1 In-Game HUD Overlay
Experience a flawless, pixel-perfect replica of the VALORANT Buy Menu. Complete with responsive auto-scaling, dynamic credit calculations, and weapon stats exactly as they appear in the game.

### Interactive Agent Draft Coach
A cyberpunk-themed dashboard that calculates team synergy on the fly. Missing smokes? No entry fragger? The AI will warn your team before the match even starts with our **Dynamic Synergy Gauge**.

### Python ML Data Ingestion
Feeds on high-rank MMR leaderboards and match histories from the official Riot API. The backend generates clean, normalized datasets (`/infoApi`) ready for Machine Learning training.

---

## THE TECH STACK

We built this with the same precision as a Vandal one-tap:

| Category | Technology |
|---|---|
| **Backend Core** | NestJS (TypeScript Node.js) |
| **Frontend UI** | Next.js (React) + Vanilla CSS Grid/Flex |
| **Real-Time Engine** | Socket.io (`@nestjs/websockets`) |
| **Data Scraping** | Axios + RxJS + Official Riot APIs |
| **Machine Learning**| Python, Pandas, Scikit-learn |

---

## PROJECT STRUCTURE

```bash
valorant-ai/
├── frontend/             # 🎨 Next.js React Dashboard & HUD (New UI!)
├── src/
│   ├── gateway/          # 📡 WebSocket Gateway & Local Client Radar
│   ├── valorant_api/     # 🔄 Hybrid API Ingestion (Agents, Maps, Gear)
│   └── utils/            # 🛠️ Type-safe CSV builders
├── public/               # 📦 Compiled Static Frontend (served by NestJS)
└── contenido/            # 🧠 Python ML training pipeline & models
```

---

## GETTING STARTED

### 1. Prerequisites
- Node.js (v18.x+) & npm
- Python (v3.10+) with `.venv`
- **Riot Games Developer API Key**

### 2. Configure Environment
Create a `.env` file in the root:
```env
VALORANT_API_KEY=YOUR_RIOT_API_KEY_HERE
VALORANT_REGION=eu
PORT=3000
```

### 3. Build & Dominate
Install dependencies and build the ultra-responsive frontend:
```bash
# 1. Install dependencies
npm install

# 2. Build the Next.js frontend (injects into /public)
npm run build:frontend

# 3. Start the Backend Radar Server
npm run start:dev
```
Open **`http://localhost:3000`** and witness the magic.

---

<div align="center">
  <p><i>"I am the hunter." - Sova</i></p>
  <img src="https://media.valorant-api.com/agents/320b2a48-4d9b-a075-30f1-1f93a9b638fa/displayicon.png" width="80px" style="border-radius: 50%; border: 2px solid #ff4655; box-shadow: 0 0 15px rgba(255, 70, 85, 0.5);">
  <br><br>
  <p>Built with ❤️ for the VALORANT Community</p>
</div>
