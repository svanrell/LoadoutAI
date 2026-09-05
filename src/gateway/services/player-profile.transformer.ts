import {
  MatchDetailsResponse,
  PlayerHistoryResponse,
  PlayerMmrResponse,
  CompetitiveUpdatesResponse,
  PlayerLoadoutResponse,
  PlayerNameItem,
  SyncedPlayerProfile,
  SyncedMatchItem,
  SyncedAgentStat,
  SyncedCompetitiveUpdate,
  MAX_HISTORY_TIME_WINDOW_MS,
} from "../valorant-history.service";
import {
  resolveMapName,
  resolveQueueName,
  resolveTierName,
} from "../valorant.constants";

export interface ProfileTransformInput {
  puuid: string;
  namesList: PlayerNameItem[];
  mmrData: PlayerMmrResponse | null;
  historyData: PlayerHistoryResponse | null;
  compUpdatesRes: CompetitiveUpdatesResponse | null;
  loadoutData: PlayerLoadoutResponse | null;
  localPresence: {
    playerCardId?: string;
    accountLevel?: number;
    competitiveTier?: number;
    leaderboardPosition?: number;
  } | null;
  detailsList: Array<MatchDetailsResponse | null>;
  region: string;
}

export class PlayerProfileTransformer {
  static formatTimeAgo(timestamp: number): string {
    const diff = Math.max(0, Date.now() - timestamp);
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    return `${months}mo ago`;
  }

  static transform(input: ProfileTransformInput): SyncedPlayerProfile {
    const {
      puuid,
      namesList,
      mmrData,
      compUpdatesRes,
      loadoutData,
      localPresence,
      detailsList,
      region,
    } = input;

    const playerNameItem = namesList[0];
    const gameName = playerNameItem?.GameName || "Player";
    const tagLine = playerNameItem?.TagLine || "LIVE";

    // Extraer rango y rating competitivo
    let currentTier = 0;
    let rankedRating = 0;
    let leaderboardRank = 0;

    if (mmrData?.LatestCompetitiveUpdate) {
      currentTier = mmrData.LatestCompetitiveUpdate.TierAfterUpdate || 0;
      rankedRating =
        mmrData.LatestCompetitiveUpdate.RankedRatingAfterUpdate || 0;
    } else if (mmrData?.QueueSkills?.competitive?.SeasonalInfoBySeasonID) {
      const seasons = Object.values(
        mmrData.QueueSkills.competitive.SeasonalInfoBySeasonID,
      );
      const lastSeason = seasons[seasons.length - 1];
      if (lastSeason) {
        currentTier = lastSeason.CompetitiveTier || 0;
        rankedRating = lastSeason.RankedRating || 0;
        leaderboardRank = lastSeason.LeaderboardRank || 0;
      }
    }

    if (currentTier === 0) {
      if (localPresence?.competitiveTier && localPresence.competitiveTier > 0) {
        currentTier = localPresence.competitiveTier;
      } else if (compUpdatesRes?.Matches && compUpdatesRes.Matches.length > 0) {
        const latestComp = compUpdatesRes.Matches[0];
        if (
          latestComp?.TierAfterUpdate !== undefined &&
          latestComp.TierAfterUpdate > 0
        ) {
          currentTier = latestComp.TierAfterUpdate;
          rankedRating = latestComp.RankedRatingAfterUpdate ?? 0;
        }
      }
    }

    const rankName = resolveTierName(currentTier);

    const now = Date.now();
    const cutoffTime = now - MAX_HISTORY_TIME_WINDOW_MS;

    const matches: SyncedMatchItem[] = [];
    const agentMap: Record<string, { wins: number; total: number }> = {};
    const streak: Array<"W" | "L"> = [];
    let totalWins = 0;

    for (const match of detailsList) {
      if (!match || !match.players || !match.teams) continue;

      const matchStartTime = match.matchInfo.gameStartMillis || 0;
      if (matchStartTime > 0 && matchStartTime < cutoffTime) {
        continue;
      }

      const player = match.players.find((p) => p.subject === puuid);
      if (!player) continue;

      const allyTeam = match.teams.find((t) => t.teamId === player.teamId);
      const enemyTeam = match.teams.find((t) => t.teamId !== player.teamId);

      const isWin = Boolean(allyTeam?.won);
      const scoreWon = allyTeam?.roundsWon ?? 0;
      const scoreLost = enemyTeam?.roundsWon ?? 0;

      if (isWin) {
        totalWins++;
        streak.push("W");
      } else {
        streak.push("L");
      }

      const kills = player.stats?.kills || 0;
      const deaths = player.stats?.deaths || 0;
      const assists = player.stats?.assists || 0;
      const score = player.stats?.score || 0;
      const rounds =
        player.stats?.roundsPlayed || Math.max(1, scoreWon + scoreLost);

      const kd = deaths > 0 ? (kills / deaths).toFixed(2) : kills.toFixed(2);
      const kda = `${kills} / ${deaths} / ${assists}`;
      const acs = Math.round(score / rounds);

      const agentId = player.characterId;
      if (agentId) {
        if (!agentMap[agentId]) {
          agentMap[agentId] = { wins: 0, total: 0 };
        }
        agentMap[agentId].total++;
        if (isWin) agentMap[agentId].wins++;
      }

      let isMvp = false;
      const maxScoreInMatch = Math.max(
        ...match.players.map((p) => p.stats?.score || 0),
      );
      if (score === maxScoreInMatch && score > 0) {
        isMvp = true;
      }

      const sortedPlayers = [...match.players].sort(
        (a, b) => (b.stats?.score || 0) - (a.stats?.score || 0),
      );
      const rankIdx = sortedPlayers.findIndex((p) => p.subject === puuid);
      const placement = isMvp
        ? "MVP"
        : rankIdx >= 0
          ? `${rankIdx + 1}º`
          : "Rank";

      let totalHeadshots = 0;
      let totalShots = 0;
      let totalDamageDealt = 0;
      const totalDamageReceived = 0;

      if (Array.isArray(match.roundResults)) {
        for (const round of match.roundResults) {
          const rPlayer = round.playerStats?.find((ps) => ps.subject === puuid);
          if (rPlayer && Array.isArray(rPlayer.damage)) {
            for (const dmg of rPlayer.damage) {
              totalHeadshots += dmg.headshots || 0;
              totalShots +=
                (dmg.headshots || 0) +
                (dmg.bodyshots || 0) +
                (dmg.legshots || 0);
              totalDamageDealt += dmg.damage || 0;
            }
          }
        }
      }

      const hsPercent =
        totalShots > 0 ? Math.round((totalHeadshots / totalShots) * 100) : 15;
      const damageDelta =
        rounds > 0
          ? Math.round((totalDamageDealt - totalDamageReceived) / rounds)
          : 0;

      const dateObj = new Date(match.matchInfo.gameStartMillis || Date.now());
      const dateTitle = dateObj.toLocaleDateString("es-ES", {
        month: "short",
        day: "numeric",
      });
      const timeAgo = this.formatTimeAgo(dateObj.getTime());

      const rawQueue =
        match.matchInfo.queueID ||
        match.matchInfo.queueId ||
        match.matchInfo.QueueID ||
        "";
      const rawGameMode = match.matchInfo.gameMode || "";
      const rawProvisioningFlow: string =
        match.matchInfo.provisioningFlowID ||
        match.matchInfo.provisioningFlowId ||
        match.matchInfo.provisioningFlow ||
        "";
      const rawCustomGameName =
        match.matchInfo.customGameName || match.matchInfo.CustomGameName || "";
      const isCustomGame =
        match.matchInfo.isCustomGame ||
        rawProvisioningFlow.toLowerCase().includes("custom");

      const maxScore = Math.max(scoreWon, scoreLost);

      const modeName = resolveQueueName(
        rawQueue,
        rawGameMode,
        match.matchInfo.isRanked,
        maxScore,
        rawProvisioningFlow,
        rawCustomGameName,
        isCustomGame,
      );

      matches.push({
        id: match.matchInfo.matchId,
        isWin,
        agentId,
        mapName: resolveMapName(match.matchInfo.mapId),
        modeName,
        placement,
        isMvp,
        scoreWon,
        scoreLost,
        kd,
        kda,
        kills,
        deaths,
        assists,
        acs,
        hsPercent,
        damageDelta,
        gameStartTime: match.matchInfo.gameStartMillis,
        dateTitle,
        timeAgo,
      });
    }

    const topAgents: SyncedAgentStat[] = Object.entries(agentMap)
      .map(([agentId, data]) => ({
        agentId,
        matchesPlayed: data.total,
        wins: data.wins,
        losses: data.total - data.wins,
        winRate: Math.round((data.wins / data.total) * 100),
      }))
      .sort((a, b) => b.matchesPlayed - a.matchesPlayed)
      .slice(0, 3);

    const totalMatches = matches.length;
    const winRate =
      totalMatches > 0 ? Math.round((totalWins / totalMatches) * 100) : 0;

    const competitiveUpdates: SyncedCompetitiveUpdate[] = [];
    const rawCompMatches = compUpdatesRes?.Matches || [];

    for (const cu of rawCompMatches) {
      if (!cu || cu.TierAfterUpdate === undefined) continue;

      const matchStartTime = cu.MatchStartTime || 0;
      if (matchStartTime > 0 && matchStartTime < cutoffTime) {
        continue;
      }

      const tier = cu.TierAfterUpdate;
      const tierName = resolveTierName(tier);
      const dateObj = new Date(cu.MatchStartTime || Date.now());
      const dateStr = dateObj.toLocaleDateString("es-ES", {
        month: "short",
        day: "numeric",
      });
      const timeAgo = this.formatTimeAgo(dateObj.getTime());

      competitiveUpdates.push({
        matchId: cu.MatchID,
        mapName: resolveMapName(cu.MapID),
        matchStartTime: cu.MatchStartTime || Date.now(),
        tier,
        tierName,
        rankedRating: cu.RankedRatingAfterUpdate ?? 0,
        rankedRatingEarned: cu.RankedRatingEarned ?? 0,
        performanceBonus: cu.RankedRatingPerformanceBonus ?? 0,
        movement: cu.CompetitiveMovement || "MOVEMENT_UNKNOWN",
        dateStr,
        timeAgo,
      });
    }

    let playerCardId =
      loadoutData?.Identity?.PlayerCardID || localPresence?.playerCardId || "";
    let accountLevel =
      loadoutData?.Identity?.AccountLevel || localPresence?.accountLevel || 0;

    if (!playerCardId && detailsList.length > 0) {
      for (const match of detailsList) {
        const p = match?.players?.find((pl) => pl.subject === puuid);
        const foundCard =
          p?.playerCard ||
          (p as unknown as Record<string, string>)?.playerCardId ||
          (p as unknown as Record<string, string>)?.PlayerCardID;
        if (foundCard) {
          playerCardId = foundCard;
          if (
            !accountLevel &&
            (p as unknown as Record<string, number>)?.accountLevel
          ) {
            accountLevel = (p as unknown as Record<string, number>)
              .accountLevel;
          }
          break;
        }
      }
    }

    return {
      puuid,
      gameName,
      tagLine,
      region,
      currentTier,
      rankName,
      rankedRating,
      leaderboardRank,
      playerCardId,
      accountLevel,
      totalMatches,
      winRate,
      streak,
      topAgents,
      matches,
      competitiveUpdates,
    };
  }
}
