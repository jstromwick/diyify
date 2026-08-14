import { beforeEach, describe, expect, it, vi } from "vitest";
import { generateModeAEstimate } from "./claude";

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
          time_estimate: "1 weekend",
          video_search_queries: ["budget deck railing DIY"],
          safety_notes: null,
        },
      ],
    };
    create.mockResolvedValue({
      content: [{ type: "tool_use", id: "toolu_1", name: "generate_estimate", input: estimate }],
    });

    const result = await generateModeAEstimate("Build a deck railing");

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

    await expect(generateModeAEstimate("Build a deck railing")).rejects.toThrow(
      /tool_use/,
    );
  });
});
