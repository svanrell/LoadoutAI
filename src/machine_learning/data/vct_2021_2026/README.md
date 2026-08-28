# VCT Valorant — Matches & Player Stats (2021–2026)

Match-, map-, round- and player-level data for **18 international VALORANT Champions Tour
(VCT) LAN events** held between 2021 and 2026 — every Masters and Champions tournament in
the dataset's window. Includes per-player performance stats (rating, ACS, K/D/A, KAST, ADR,
HS%, first kills/deaths), agents played, round-by-round outcomes, map vetoes, and final
standings derivable from the bracket.

## What's inside

One folder per tournament, named `<eventId>-<slug>` (e.g. `449-valorant-champions-2021`).
Each folder contains:

- **`event.json`** — tournament metadata + the full list of its matches.
- **`<matchId>.json`** — one file per match, with per-map and per-player detail.

| | count |
|---|---|
| Tournaments (events) | 18 |
| Matches | 445 |
| Unique players | 406 |
| Player–map stat rows | 11,258 |

Coverage: Masters Reykjavík/Berlin 2021, Champions 2021, Masters Reykjavík/Copenhagen +
Champions 2022, LOCK//IN + Masters Tokyo + Champions 2023, Masters Madrid/Shanghai +
Champions 2024, Masters Bangkok/Toronto + Champions 2025, and Masters Santiago/London +
Champions 2026 (Champions 2026 is included as a scheduled event with no matches played yet).

## Flattened CSVs (start here)

If you don't want to parse nested JSON, five tidy CSVs at the root cover everything:

| file | rows | grain | key columns |
|---|---|---|---|
| `events.csv` | 18 | one tournament | `event_id, title, year, dates, prize, location, status` |
| `matches.csv` | 445 | one match (series) | `match_id, event_id, date, stage, round, team1/2 (+id, score), winner, map_count` |
| `maps.csv` | 1,127 | one map in a match | `match_id, map_index, map, team1/2 (+score), winner` |
| `player_stats.csv` | 11,270 | one player on one map | `match_id, map, player_id, player, team, agent, rating, acs, kills, deaths, assists, kast, adr, hs_percent, first_kills, first_deaths, first_kills_diff` |
| `rounds.csv` | 24,011 | one round on one map | `match_id, map, round_number, round_score, winner (team1/team2), side, win_type` |

Join keys: `event_id` links to `events.csv`; `match_id` links matches → maps → players → rounds.
The raw `<event>/<match>.json` files are included too, for fields not flattened (map vetoes,
VODs/streams, head-to-head history).

## Data dictionary

### `event.json`
| field | description |
|---|---|
| `id`, `title`, `subtitle` | event id, name, tagline |
| `dates`, `prize`, `location`, `status` | human-readable dates, prize pool, host city, completion status |
| `img` | event logo URL |
| `prizes[]` | placement → prize breakdown (often empty) |
| `teams[]` | participating teams: `{name, id, img, seed}` |
| `matches[]` | every match: `{id, date, time, eta, status, round, stage, teams[]{name, region, score}}` |

### `<matchId>.json`
| field | description |
|---|---|
| `teams[]` | the two teams: `{name, id, img, score}` (series score) |
| `map_count` | number of maps in the series |
| `bans[]` | map veto sequence (pick/ban order as strings) |
| `event` | `{id, series, stage, date (ISO 8601), patch, status, img}` |
| `previous_encounters[]` | prior head-to-head meetings (may contain nulls) |
| `videos` | `{streams[]{name,url}, vods[]{name,url}}` |
| `data[]` | **one entry per map played**, see below |

**`data[]` (per map)**
| field | description |
|---|---|
| `map` | map name (e.g. Haven, Ascent) |
| `teams[]` | `{name, score}` — map score |
| `members[]` | 10 players (5 per team), see below |
| `rounds[]` | `{round_number, round_score, winner (team1/team2), side (attack/defense), win_type}` |

**`members[]` (per player, per map)**
| field | description |
|---|---|
| `id`, `name`, `team` | player id, handle, team |
| `agents[]` | agent(s) played: `{title, img}` |
| `rating` | VLR composite performance rating |
| `acs` | average combat score |
| `kills`, `deaths`, `assists` | K / D / A |
| `kast` | % of rounds with kill/assist/survive/traded |
| `adr` | average damage per round |
| `headshot_percent` | headshot % |
| `first_kills`, `first_deaths`, `first_kills_diff` | opening duels won / lost / net |

## Example uses
- Player and team performance analysis across eras and patches
- Agent meta / role trends over time
- Win-condition modelling (rounds, sides, win types, opening duels)
- Match outcome prediction; fantasy/draft tooling; Elo / power rankings

## Collection
Pulled from a public VLR-style stats API (which aggregates publicly available
[vlr.gg](https://www.vlr.gg) match data) via its REST endpoints
(`/events/{id}` and `/matches/{id}`), with a 4–10s delay between requests to respect rate
limits. Raw JSON responses are stored verbatim — no fields were altered.

## License, attribution & disclaimer
- Released under **CC BY-NC-SA 4.0** (attribution, non-commercial, share-alike).
- This is an **unofficial, fan-made** dataset. It is **not affiliated with or endorsed by
  Riot Games or vlr.gg.** VALORANT and VCT are trademarks of Riot Games. Underlying match
  statistics originate from vlr.gg / Riot's published results; please credit vlr.gg as the
  upstream source and use for research/educational purposes.
