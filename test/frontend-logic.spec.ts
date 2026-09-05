import {
  calculateTotalSpend,
  resolveAiRecommendation,
} from "../frontend/src/lib/ingameLogic";
import { isDraftCompleted } from "../frontend/src/lib/pregameLogic";

describe("Frontend Pure Logic & Ingame Economy Suite", () => {
  describe("calculateTotalSpend (Cost 0 Eco/Save Round Fix)", () => {
    it("should return exactly 0 when following AI recommendation with cost 0 (Full Save)", () => {
      const result = calculateTotalSpend({
        isFollowingAiRecommendation: true,
        buyRecommendations: {
          weapon: "Classic",
          shield: "Sin escudo",
          cost: 0,
          abilities: false,
          tactic: "Full Save",
        },
        manualWeaponSpend: 2900,
        manualArmorSpend: 1000,
        manualAbilitiesSpend: 400,
      });

      // Crucial fix: 0 should NOT fallback to manualTotal (4300)
      expect(result).toBe(0);
    });

    it("should return recommendation cost when following AI recommendation with non-zero cost", () => {
      const result = calculateTotalSpend({
        isFollowingAiRecommendation: true,
        buyRecommendations: {
          weapon: "Vandal",
          shield: "Heavy Shields",
          cost: 3900,
          abilities: true,
          tactic: "Full Buy",
        },
        manualWeaponSpend: 0,
        manualArmorSpend: 0,
        manualAbilitiesSpend: 0,
      });

      expect(result).toBe(3900);
    });

    it("should return manual total when not following AI recommendation", () => {
      const result = calculateTotalSpend({
        isFollowingAiRecommendation: false,
        buyRecommendations: {
          weapon: "Vandal",
          shield: "Heavy Shields",
          cost: 3900,
          abilities: true,
          tactic: "Full Buy",
        },
        manualWeaponSpend: 1600,
        manualArmorSpend: 400,
        manualAbilitiesSpend: 200,
      });

      expect(result).toBe(2200);
    });

    it("should fallback to manual total if buyRecommendations is null", () => {
      const result = calculateTotalSpend({
        isFollowingAiRecommendation: true,
        buyRecommendations: null,
        manualWeaponSpend: 800,
        manualArmorSpend: 0,
        manualAbilitiesSpend: 150,
      });

      expect(result).toBe(950);
    });
  });

  describe("resolveAiRecommendation", () => {
    const mockWeapons = [
      {
        displayName: "Classic",
        category: "EEquippableCategory::Sidearm",
        cost: 0,
      },
      {
        displayName: "Ghost",
        category: "EEquippableCategory::Sidearm",
        cost: 500,
      },
      {
        displayName: "Vandal",
        category: "EEquippableCategory::Primary",
        cost: 2900,
      },
      {
        displayName: "Phantom",
        category: "EEquippableCategory::Primary",
        cost: 2900,
      },
    ] as any;

    it("should default to Classic and no armor if recommendation is null or Save", () => {
      const res = resolveAiRecommendation(null, mockWeapons);
      expect(res.sidearmName).toBe("Classic");
      expect(res.primaryName).toBeNull();
      expect(res.armorName).toBeNull();

      const saveRes = resolveAiRecommendation(
        { weapon: "Save", shield: "Sin escudo", cost: 0, abilities: false },
        mockWeapons,
      );
      expect(saveRes.sidearmName).toBe("Classic");
      expect(saveRes.primaryName).toBeNull();
      expect(saveRes.armorName).toBeNull();
    });

    it("should resolve primary weapon and heavy armor for Full Buy", () => {
      const res = resolveAiRecommendation(
        {
          weapon: "Vandal",
          shield: "Heavy Shields",
          cost: 3900,
          abilities: true,
        },
        mockWeapons,
      );
      expect(res.sidearmName).toBe("Classic");
      expect(res.primaryName).toBe("Vandal");
      expect(res.armorName).toBe("ARM. PESADA");
    });
  });

  describe("isDraftCompleted", () => {
    it("should return true only when exactly 5 players have picked", () => {
      expect(isDraftCompleted(0)).toBe(false);
      expect(isDraftCompleted(4)).toBe(false);
      expect(isDraftCompleted(5)).toBe(true);
      expect(isDraftCompleted(6)).toBe(true);
    });
  });
});
