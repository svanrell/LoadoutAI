import {
  advanceRoundEconomy,
  calculateLeftoverCredits,
  calculateNextRoundProjection,
  getLossReward,
  getResetCreditsForRound,
  isSpecialResetRound,
  VALORANT_ECONOMY_RULES,
} from "../../frontend/src/data/economyEngine";

describe("Valorant Economy Engine", () => {
  describe("Official Constants & Rules", () => {
    it("should match official Valorant economy parameters", () => {
      expect(VALORANT_ECONOMY_RULES.STARTING_CREDITS).toBe(800);
      expect(VALORANT_ECONOMY_RULES.HALFTIME_STARTING_CREDITS).toBe(800);
      expect(VALORANT_ECONOMY_RULES.OVERTIME_STARTING_CREDITS).toBe(5000);
      expect(VALORANT_ECONOMY_RULES.MAX_CREDITS).toBe(9000);
      expect(VALORANT_ECONOMY_RULES.WIN_REWARD).toBe(3000);
      expect(VALORANT_ECONOMY_RULES.LOSS_REWARD_BASE).toBe(1900);
      expect(VALORANT_ECONOMY_RULES.LOSS_REWARD_TIER_2).toBe(2400);
      expect(VALORANT_ECONOMY_RULES.LOSS_REWARD_TIER_3).toBe(2900);
      expect(VALORANT_ECONOMY_RULES.SPIKE_PLANT_BONUS).toBe(300);
      expect(VALORANT_ECONOMY_RULES.KILL_REWARD).toBe(200);
    });
  });

  describe("Round 1 Initial / Pistol Round", () => {
    it("should start with 800 credits on round 1 and reset loss streak", () => {
      expect(isSpecialResetRound(1)).toBe(true);
      expect(getResetCreditsForRound(1)).toBe(800);

      const result = advanceRoundEconomy({
        previousBank: 0,
        totalSpend: 0,
        outcome: "loss",
        previousLossStreak: 3,
        newRound: 1,
      });

      expect(result.newCredits).toBe(800);
      expect(result.newLossStreak).toBe(0);
    });
  });

  describe("Halftime Round 13", () => {
    it("should reset credits to 800 on round 13 regardless of previous bank", () => {
      expect(isSpecialResetRound(13)).toBe(true);
      expect(getResetCreditsForRound(13)).toBe(800);

      const result = advanceRoundEconomy({
        previousBank: 7500,
        totalSpend: 1000,
        outcome: "win",
        previousLossStreak: 0,
        newRound: 13,
      });

      expect(result.newCredits).toBe(800);
      expect(result.newLossStreak).toBe(0);
    });
  });

  describe("Consecutive Losses (Loss Streak)", () => {
    it("should award 1900 credits for 1st loss (streak 0)", () => {
      expect(getLossReward(0)).toBe(1900);

      const result = advanceRoundEconomy({
        previousBank: 800,
        totalSpend: 800,
        outcome: "loss",
        previousLossStreak: 0,
        newRound: 2,
      });

      expect(result.newCredits).toBe(1900);
      expect(result.newLossStreak).toBe(1);
    });

    it("should award 2400 credits for 2nd consecutive loss (streak 1)", () => {
      expect(getLossReward(1)).toBe(2400);

      const result = advanceRoundEconomy({
        previousBank: 1900,
        totalSpend: 1000,
        outcome: "loss",
        previousLossStreak: 1,
        newRound: 3,
      });

      // leftover 900 + 2400 = 3300
      expect(result.newCredits).toBe(3300);
      expect(result.newLossStreak).toBe(2);
    });

    it("should award 2900 credits for 3+ consecutive losses (streak 2+)", () => {
      expect(getLossReward(2)).toBe(2900);
      expect(getLossReward(5)).toBe(2900);

      const result = advanceRoundEconomy({
        previousBank: 1000,
        totalSpend: 1000,
        outcome: "loss",
        previousLossStreak: 3,
        newRound: 5,
      });

      expect(result.newCredits).toBe(2900);
      expect(result.newLossStreak).toBe(4);
    });
  });

  describe("Round Win", () => {
    it("should award 3000 credits on win and reset loss streak to 0", () => {
      const result = advanceRoundEconomy({
        previousBank: 2000,
        totalSpend: 1500,
        outcome: "win",
        previousLossStreak: 4,
        newRound: 6,
      });

      // leftover 500 + 3000 = 3500
      expect(result.newCredits).toBe(3500);
      expect(result.newLossStreak).toBe(0);
    });
  });

  describe("Overtime (Round 25+)", () => {
    it("should reset credits to 5000 on round 25 and overtime rounds", () => {
      expect(isSpecialResetRound(25)).toBe(true);
      expect(isSpecialResetRound(26)).toBe(true);
      expect(getResetCreditsForRound(25)).toBe(5000);
      expect(getResetCreditsForRound(27)).toBe(5000);

      const result = advanceRoundEconomy({
        previousBank: 9000,
        totalSpend: 3900,
        outcome: "win",
        previousLossStreak: 0,
        newRound: 25,
      });

      expect(result.newCredits).toBe(5000);
      expect(result.newLossStreak).toBe(0);
    });
  });

  describe("Maximum Bank Cap (9000 credits)", () => {
    it("should cap bank balance at 9000 credits", () => {
      const result = advanceRoundEconomy({
        previousBank: 8000,
        totalSpend: 0,
        outcome: "win",
        previousLossStreak: 0,
        newRound: 10,
      });

      // 8000 + 3000 = 11000 -> capped at 9000
      expect(result.newCredits).toBe(9000);
    });
  });

  describe("Spike Plant Bonus", () => {
    it("should award +300 credits team bonus when spike was planted on loss", () => {
      const result = advanceRoundEconomy({
        previousBank: 1000,
        totalSpend: 1000,
        outcome: "loss",
        previousLossStreak: 0,
        newRound: 3,
        spikePlanted: true,
      });

      // 1900 + 300 = 2200
      expect(result.newCredits).toBe(2200);
    });
  });

  describe("Negative Spend Prevention", () => {
    it("should treat negative spend as 0 and not increase bank", () => {
      const leftover = calculateLeftoverCredits(2000, -500);
      expect(leftover).toBe(2000);

      const result = advanceRoundEconomy({
        previousBank: 2000,
        totalSpend: -1000,
        outcome: "loss",
        previousLossStreak: 0,
        newRound: 4,
      });

      // leftover 2000 + 1900 = 3900 (not 4900)
      expect(result.newCredits).toBe(3900);
    });
  });

  describe("Kills Reward", () => {
    it("should award 200 credits per kill", () => {
      const result = advanceRoundEconomy({
        previousBank: 1000,
        totalSpend: 1000,
        outcome: "win",
        previousLossStreak: 0,
        newRound: 5,
        kills: 3,
      });

      // leftover 0 + 3000 (win) + 3*200 (600) = 3600
      expect(result.newCredits).toBe(3600);
    });

    it("should ignore negative kills count", () => {
      const result = advanceRoundEconomy({
        previousBank: 1000,
        totalSpend: 1000,
        outcome: "win",
        previousLossStreak: 0,
        newRound: 5,
        kills: -2,
      });

      expect(result.newCredits).toBe(3000);
    });
  });

  describe("Next Round Projection", () => {
    it("should accurately project min loss and win credits", () => {
      const proj = calculateNextRoundProjection(4000, 2000, 1, false);
      // leftover: 2000
      // min loss: 2000 + 2400 = 4400
      // min win: 2000 + 3000 = 5000
      expect(proj.leftoverCredits).toBe(2000);
      expect(proj.minNextRoundLoss).toBe(4400);
      expect(proj.minNextRoundWin).toBe(5000);
      expect(proj.isCapped).toBe(false);
    });
  });
});
