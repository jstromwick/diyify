import { expect, test } from "@playwright/test";

// Live integration test — hits the real Claude API via /api/estimate (Mode A).
// Requires ANTHROPIC_API_KEY in .env. Not part of `npm test`; run explicitly
// with `npm run test:e2e`. Costs real tokens and is not deterministic, so
// assertions check shape/invariants rather than exact wording.

test.describe("POST /api/estimate (live, Mode A)", () => {
  test("returns three tiers matching the Mode A schema", async ({ request }) => {
    const response = await request.post("/api/estimate", {
      data: { description: "Build a deck railing" },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();

    expect(typeof body.project).toBe("string");
    expect(body.project.length).toBeGreaterThan(0);

    expect(Array.isArray(body.tiers)).toBe(true);
    expect(body.tiers).toHaveLength(3);

    const tierNames = body.tiers.map((t: { tier: string }) => t.tier);
    expect(tierNames.sort()).toEqual(["high", "low", "medium"]);

    for (const tier of body.tiers) {
      expect(typeof tier.cost_range).toBe("string");
      expect(Array.isArray(tier.materials)).toBe(true);
      expect(tier.materials.length).toBeGreaterThan(0);
      expect(typeof tier.time_estimate).toBe("string");
      expect(Array.isArray(tier.video_search_queries)).toBe(true);
      expect(tier.video_search_queries.length).toBeGreaterThan(0);
      expect(tier).toHaveProperty("safety_notes");
    }
  });

  test("flags permit/licensed-professional requirements for a safety-relevant project", async ({
    request,
  }) => {
    const response = await request.post("/api/estimate", {
      data: { description: "Rewire a bathroom outlet" },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();

    const hasSafetyNote = body.tiers.some(
      (t: { safety_notes: string | null }) => !!t.safety_notes,
    );
    expect(hasSafetyNote).toBe(true);
  });

  test("returns 400 when description is missing", async ({ request }) => {
    const response = await request.post("/api/estimate", { data: {} });
    expect(response.status()).toBe(400);
  });
});
