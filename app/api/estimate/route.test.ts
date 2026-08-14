import { beforeEach, describe, expect, it, vi } from "vitest";
import Anthropic from "@anthropic-ai/sdk";
import { POST } from "./route";

const generateEstimateWithTiers = vi.fn();
const generateBudgetEstimate = vi.fn();

vi.mock("@/lib/claude", () => ({
  generateEstimateWithTiers: (...args: unknown[]) => generateEstimateWithTiers(...args),
  generateBudgetEstimate: (...args: unknown[]) => generateBudgetEstimate(...args),
}));

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/estimate", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

function makeRawRequest(body: string): Request {
  return new Request("http://localhost/api/estimate", {
    method: "POST",
    body,
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/estimate", () => {
  beforeEach(() => {
    generateEstimateWithTiers.mockReset();
    generateBudgetEstimate.mockReset();
  });

  it("returns 400 when description is missing", async () => {
    const res = await POST(makeRequest({}));

    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/description/i);
    expect(generateEstimateWithTiers).not.toHaveBeenCalled();
  });

  it("returns 400 when description is empty after trimming", async () => {
    const res = await POST(makeRequest({ description: "   " }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid JSON", async () => {
    const res = await POST(makeRawRequest("not json"));
    expect(res.status).toBe(400);
  });

  it("trims the description and returns the generated estimate", async () => {
    const estimate = {
      project: "Build a deck railing",
      tiers: [{ tier: "low" }],
    };
    generateEstimateWithTiers.mockResolvedValue(estimate);

    const res = await POST(makeRequest({ description: "  Build a deck railing  " }));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(estimate);
    expect(generateEstimateWithTiers).toHaveBeenCalledWith("Build a deck railing");
  });

  it("returns 502 when the Anthropic API call fails", async () => {
    generateEstimateWithTiers.mockRejectedValue(
      new Anthropic.RateLimitError(
        429,
        { type: "error", error: { type: "rate_limit_error", message: "slow down" } },
        "slow down",
        new Headers(),
      ),
    );

    const res = await POST(makeRequest({ description: "Build a deck railing" }));
    expect(res.status).toBe(502);
  });

  it("returns 500 for unexpected errors", async () => {
    generateEstimateWithTiers.mockRejectedValue(new Error("boom"));

    const res = await POST(makeRequest({ description: "Build a deck railing" }));
    expect(res.status).toBe(500);
  });

  it("calls generateBudgetEstimate instead of generateEstimateWithTiers when budget is provided", async () => {
    const estimate = { project: "Build a deck railing", budget: 400, realistic: true };
    generateBudgetEstimate.mockResolvedValue(estimate);

    const res = await POST(makeRequest({ description: "Build a deck railing", budget: 400 }));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(estimate);
    expect(generateBudgetEstimate).toHaveBeenCalledWith("Build a deck railing", 400);
    expect(generateEstimateWithTiers).not.toHaveBeenCalled();
  });

  it("returns 400 when budget is not a positive number", async () => {
    const res = await POST(
      makeRequest({ description: "Build a deck railing", budget: -50 }),
    );

    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/budget/i);
    expect(generateBudgetEstimate).not.toHaveBeenCalled();
    expect(generateEstimateWithTiers).not.toHaveBeenCalled();
  });

  it("returns 400 when budget is not a number", async () => {
    const res = await POST(
      makeRequest({ description: "Build a deck railing", budget: "a lot" }),
    );

    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/budget/i);
  });

  it("treats a null budget the same as an omitted budget", async () => {
    const estimate = { project: "Build a deck railing", tiers: [] };
    generateEstimateWithTiers.mockResolvedValue(estimate);

    const res = await POST(
      makeRequest({ description: "Build a deck railing", budget: null }),
    );

    expect(res.status).toBe(200);
    expect(generateEstimateWithTiers).toHaveBeenCalledWith("Build a deck railing");
    expect(generateBudgetEstimate).not.toHaveBeenCalled();
  });
});
