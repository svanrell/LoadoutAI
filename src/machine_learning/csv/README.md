# Valorant Champions Tour Paris 2025 Dataset

This dataset covers the Valorant Champions 2025 Paris tournament.

Below are the details of each file and its columns.


## event_info.csv

| Column | Description |
|--------|-------------|
| url | URL of the event page. |
| title | The full name of the tournament, 'Valorant Champions 2024'. |
| subtitle | A brief but informative description of the event. |
| dates | The dates the tournament took place. |
| prize_pool | The total prize money for the event. |
| location | The physical location of the tournament. |

## matches.csv

| Column | Description |
|--------|-------------|
| date | The date the match was played. |
| match_id | Unique identifier for each match. |
| time | The time the match started. |
| team1 | Name of the first team. |
| score1 | Score of the first team. |
| team2 | Name of the second team. |
| score2 | Score of the second team. |
| score | Overall score of the match in 'X-Y' format. |
| winner | The winning team. |
| status | The match status (e.g., Completed). |
| week | The week or group stage of the tournament. |
| stage | The stage of the tournament (e.g., Group Stage, Playoffs). |

## player_stats.csv

| Column | Description |
|--------|-------------|
| player | Player's first name. |
| player_name | Player's in-game name. |
| team | The team the player belongs to. |
| player_id | Unique player identifier. |
| agents_count | Number of unique agents played. |
| agents | A list of agents the player used. |
| rounds | Total number of rounds played. |
| rating | Average rating of the player across all games. |
| acs | Average Combat Score. |
| kd_ratio | Kill/Death ratio. |
| kast | Percentage of rounds with a Kill, Assist, Survived, or Traded. |
| adr | Average Damage per Round. |
| kpr | Kills per Round. |
| apr | Assists per Round. |
| fkpr | First Kills per Round. |
| fdpr | First Deaths per Round. |
| hs_percent | Headshot percentage. |
| cl_percent | Clutch percentage. |
| clutches | Number of clutches won out of clutches attempted (e.g., '3/21'). |
| k_max | Maximum number of kills in a single map. |
| kills | Total kills. |
| deaths | Total deaths. |
| assists | Total assists. |
| first_kills | Total first kills. |
| first_deaths | Total first deaths. |

## maps_stats.csv

| Column | Description |
|--------|-------------|
| map_name | Name of the map. |
| times_played | Number of times the map was played in the tournament. |
| attack_win_percent | Win percentage for the attacking side on this map. |
| defense_win_percent | Win percentage for the defending side on this map. |

## agents_stats.csv

| Column | Description |
|--------|-------------|
| agent_name | Name of the agent. |
| total_utilization | The percentage of total rounds played where the agent was picked. |
| [map name] | Utilization percentage of the agent on each specific map. |

## economy_data.csv

| Column | Description |
|--------|-------------|
| map | The map name. |
| Team | The team name. |
| Pistol Won | The number of pistol rounds won by the team on that map. |
| Eco (won) | The total number of economy rounds played, with the number won in parentheses. |
| Semi-eco (won) | The total number of semi-economy rounds played, with the number won in parentheses. |
| Semi-buy (won) | The total number of semi-buy rounds played, with the number won in parentheses. |
| Full buy(won) | The total number of full-buy rounds played, with the number won in parentheses. |
| match_id | The unique identifier for each match. |

## performance_data.csv

| Column | Description |
|--------|-------------|
| Match ID | Unique identifier for the match. |
| Map | The name of the map. |
| Player | Player's in-game name. |
| Team | Team name. |
| Agent | The agent played. |
| 2K | Number of times the player got 2 kills in a single round. |
| 3K | Number of times the player got 3 kills in a single round. |
| 4K | Number of times the player got 4 kills in a single round. |
| 5K | Number of times the player got 5 kills in a single round. |
| 1v1 | Number of 1v1 clutches won. |
| 1v2 | Number of 1v2 clutches won. |
| 1v3 | Number of 1v3 clutches won. |
| 1v4 | Number of 1v4 clutches won. |
| 1v5 | Number of 1v5 clutches won. |
| ECON | Average Economy Rating (per round). |
| PL | Number of plants. |
| DE | Number of defuses. |

## detailed_matches_player_stats.csv

| Column | Description |
|--------|-------------|
| match_id | Unique identifier for each match. |
| event_name | Name of the event. |
| event_stage | The stage of the tournament (e.g., Grand Final). |
| match_date | Date of the match. |
| team1 | Name of the first team. |
| team2 | Name of the second team. |
| score_overall | Overall match score. |
| player_name | Player's in-game name. |
| player_id | Unique player identifier. |
| player_team | Player's team. |
| stat_type | Type of statistic ('map' or 'overall'). |
| agent | The agent played by the player on the map. |
| rating | Player rating for the specific map/match. |
| acs | Average Combat Score. |
| k | Total kills. |
| d | Total deaths. |
| a | Total assists. |
| kd_diff | Kill/Death difference. |
| kast | Percentage of rounds with a Kill, Assist, Survived, or Traded. |
| adr | Average Damage per Round. |
| hs_percent | Headshot percentage. |
| fk | First Kills. |
| fd | First Deaths. |
| fk_fd_diff | First Kill/First Death difference. |
| map_name | The name of the map. |
| map_winner | The team that won the map. |

## detailed_matches_overview.csv

| Column | Description |
|--------|-------------|
| match_id | Unique identifier for each match. |
| match_title | The title of the match (e.g., 'Gen.G vs Sentinels'). |
| event | The name of the event. |
| date | Date of the match. |
| format | Match format (e.g., Bo3). |
| teams | A string listing the two competing teams. |
| score | The final match score. |
| maps_played | Number of maps played in the match. |
| patch | The game patch version the match was played on. |
| pick_ban_info | Details about the map pick and ban phase. |

## detailed_matches_maps.csv

| Column | Description |
|--------|-------------|
| match_id | Unique identifier for the match. |
| map_name | Name of the map. |
| map_order | The order in which the map was played within the match. |
| score | The final score of the map. |
| winner | The team that won the map. |
| duration | The duration of the map. |
| picked_by | The team that picked the map, or 'Decider'. |


---
## 💡 Found this dataset useful?

If this dataset helped you in your project or analysis, consider giving it an upvote on Kaggle to support its visibility.  
Your feedback and suggestions are also welcome—feel free to leave a comment on the dataset page!

## Contribute Your Work

If you create an interesting analysis, visualization, or Kaggle Notebook using this dataset, please share it!  
Your contributions can help the community better understand the Valorant Esports and inspire new research or begineers
