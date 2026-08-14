import { beforeEach, describe, expect, it, vi } from "vitest";
import { generateBudgetEstimate, generateEstimateWithTiers } from "./claude";

const { create } = vi.hoisted(() => ({ create: vi.fn() }));

vi.mock("@anthropic-ai/sdk", () => ({
  default: vi.fn().mockImplementation(function () {
    return { messages: { create } };
  }),
}));

describe("generateModeAEstimate", () => {
  beforeEach(() => {
    create.mockReset();
  });

  it("parses the tool_use block from Claude's response", async () => {
    const estimate = {
      project: "Build a deck railing",
      tiers: [
        {
          tier: "low",
          name: "Weekend Build",
          description: "Pressure-treated lumber with basic balusters.",
          cost_range: "$150-300",
          materials: ["pressure-treated 2x4s"],
          materialsWithBudget: [
            { item: "Pressure-treated 2x4s (50 linear feet)", estimatedCost: "~$150" },
            { item: "Deck screws and hardware", estimatedCost: "~$50" },
            { item: "Basic balusters", estimatedCost: "~$100" },
          ],
          time_estimate: "1 weekend",
          plan: ["1. Measure and cut materials", "2. Install posts", "3. Attach rails", "4. Install balusters"],
          video_search_queries: ["budget deck railing DIY"],
          safety_notes: null,
        },
      ],
    };
    create.mockResolvedValue({
      content: [{ type: "tool_use", id: "toolu_1", name: "generate_estimate", input: estimate }],
    });

    const result = await generateEstimateWithTiers("Build a deck railing");

    expect(result).toEqual(estimate);
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "claude-opus-5",
        tool_choice: { type: "tool", name: "generate_estimate" },
        messages: [{ role: "user", content: "Build a deck railing" }],
      }),
    );
  });

  it("throws when Claude does not return a tool_use block", async () => {
    create.mockResolvedValue({ content: [{ type: "text", text: "oops" }] });

    await expect(generateEstimateWithTiers("Build a deck railing")).rejects.toThrow(
      /tool_use/,
    );
  });

  it("throws when the response was truncated at max_tokens", async () => {
    create.mockResolvedValue({
      stop_reason: "max_tokens",
      content: [
        {
          type: "tool_use",
          id: "toolu_1",
          name: "generate_estimate",
          input: { project: "Full remodel of a 100 sq ft bathroom" },
        },
      ],
    });

    await expect(generateEstimateWithTiers("Full bathroom remodel")).rejects.toThrow(
      /truncated/,
    );
  });
});

describe("generateBudgetEstimate", () => {
  beforeEach(() => {
    create.mockReset();
  });

  it("parses a realistic-budget response into a RealisticEstimate", async () => {
    const raw = {
      project: "Build a deck railing",
      budget: 400,
      realistic: true,
      withinBudget: {
        cost_range: "$350-400",
        materials: ["pressure-treated 2x4s"],
        materialsWithBudget: [
          { item: "Pressure-treated 2x4s (50 linear feet)", estimatedCost: "~$150" },
          { item: "Deck screws and hardware", estimatedCost: "~$50" },
          { item: "Composite balusters", estimatedCost: "~$200" },
        ],
        trade_offs: "Standard pressure-treated wood instead of premium composite",
        plan: ["1. Measure and cut materials", "2. Install posts", "3. Attach rails", "4. Install balusters"],
        video_search_queries: ["deck railing on a budget"],
        safety_notes: null,
      },
      stretchOption: {
        cost_range: "$450-500",
        what_you_gain: "Composite balusters, no repainting needed",
      },
      savingsOption: {
        cost_range: "$250-300",
        what_you_cut: "Simpler baluster spacing, fewer decorative posts",
      },
      reason: null,
      minRealisticBudget: null,
      whatThatGetsYou: null,
    };
    create.mockResolvedValue({
      content: [{ type: "tool_use", id: "toolu_1", name: "generate_budget_estimate", input: raw }],
    });

    const result = await generateBudgetEstimate("Build a deck railing", 400);

    expect(result).toEqual({
      project: raw.project,
      budget: raw.budget,
      realistic: true,
      withinBudget: raw.withinBudget,
      stretchOption: raw.stretchOption,
      savingsOption: raw.savingsOption,
    });
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "claude-opus-5",
        tool_choice: { type: "tool", name: "generate_budget_estimate" },
        messages: [{ role: "user", content: "Build a deck railing\n\nBudget: $400" }],
      }),
    );
  });

  it("parses an unrealistic-budget response into a UnrealisticEstimate", async () => {
    const raw = {
      project: "Rewire a bathroom outlet",
      budget: 50,
      realistic: false,
      withinBudget: null,
      stretchOption: null,
      savingsOption: null,
      reason: "Electrical work requires GFCI-rated components and, in most areas, a permit.",
      minRealisticBudget: 180,
      whatThatGetsYou: {
        materials: ["GFCI outlet", "wire, box, cover plate"],
        materialsWithBudget: [
          { item: "GFCI outlet", estimatedCost: "~$20" },
          { item: "Wire and box", estimatedCost: "~$15" },
          { item: "Permit fee", estimatedCost: "$50-100" },
          { item: "Electrician inspection (if required)", estimatedCost: "$80-150" },
        ],
        plan: [
          "1. Turn off power and remove old outlet",
          "2. Licensed electrician installs new GFCI outlet",
          "3. Schedule permit inspection",
        ],
        video_search_queries: ["install GFCI outlet bathroom code"],
        safety_notes: "GFCI-rated components and a permit are typically required for this work. Check your local building codes.",
      },
    };
    create.mockResolvedValue({
      content: [{ type: "tool_use", id: "toolu_1", name: "generate_budget_estimate", input: raw }],
    });

    const result = await generateBudgetEstimate("Rewire a bathroom outlet", 50);

    expect(result).toEqual({
      project: raw.project,
      budget: raw.budget,
      realistic: false,
      reason: raw.reason,
      minRealisticBudget: raw.minRealisticBudget,
      whatThatGetsYou: raw.whatThatGetsYou,
    });
    if (result.realistic) throw new Error("expected an unrealistic result");
    expect(
      result.whatThatGetsYou.plan.some((step: string) => /licensed electrician/i.test(step)),
    ).toBe(true);
  });

  it("throws when Claude does not return a tool_use block", async () => {
    create.mockResolvedValue({ content: [{ type: "text", text: "oops" }] });

    await expect(generateBudgetEstimate("Build a deck railing", 400)).rejects.toThrow(
      /tool_use/,
    );
  });

  it("throws when realistic is true but the realistic-budget fields are missing", async () => {
    create.mockResolvedValue({
      content: [
        {
          type: "tool_use",
          id: "toolu_1",
          name: "generate_budget_estimate",
          input: {
            project: "Build a deck railing",
            budget: 400,
            realistic: true,
            withinBudget: null,
            stretchOption: null,
            savingsOption: null,
            reason: null,
            minRealisticBudget: null,
            whatThatGetsYou: null,
          },
        },
      ],
    });

    await expect(generateBudgetEstimate("Build a deck railing", 400)).rejects.toThrow(
      /omitted the realistic-budget fields/,
    );
  });

  it("throws when realistic is false but the unrealistic-budget fields are missing", async () => {
    create.mockResolvedValue({
      content: [
        {
          type: "tool_use",
          id: "toolu_1",
          name: "generate_budget_estimate",
          input: {
            project: "Rewire a bathroom outlet",
            budget: 50,
            realistic: false,
            withinBudget: null,
            stretchOption: null,
            savingsOption: null,
            reason: null,
            minRealisticBudget: null,
            whatThatGetsYou: null,
          },
        },
      ],
    });

    await expect(generateBudgetEstimate("Rewire a bathroom outlet", 50)).rejects.toThrow(
      /omitted the unrealistic-budget fields/,
    );
  });

  it("throws when the response was truncated at max_tokens", async () => {
    create.mockResolvedValue({
      stop_reason: "max_tokens",
      content: [
        {
          type: "tool_use",
          id: "toolu_1",
          name: "generate_budget_estimate",
          input: { project: "Full remodel of a 100 sq ft bathroom", budget: 5000 },
        },
      ],
    });

    await expect(generateBudgetEstimate("Full bathroom remodel", 5000)).rejects.toThrow(
      /truncated/,
    );
  });
});
