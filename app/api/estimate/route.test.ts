import { beforeEach, describe, expect, it, vi } from "vitest";
import Anthropic from "@anthropic-ai/sdk";
import { POST } from "./route";

const generateModeAEstimate = vi.fn();

vi.mock("@/lib/claude", () => ({
  generateModeAEstimate: (...args: unknown[]) => generateModeAEstimate(...args),
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
    generateModeAEstimate.mockReset();
  });

  it("returns 400 when description is missing", async () => {
    const res = await POST(makeRequest({}));

    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/description/i);
    expect(generateModeAEstimate).not.toHaveBeenCalled();
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
    generateModeAEstimate.mockResolvedValue(estimate);

    const res = await POST(makeRequest({ description: "  Build a deck railing  " }));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(estimate);
    expect(generateModeAEstimate).toHaveBeenCalledWith("Build a deck railing");
  });

  it("returns 502 when the Anthropic API call fails", async () => {
    generateModeAEstimate.mockRejectedValue(
      new Anthropic.RateLimitError(
        429,
        { type: "error", error: { type: "rate_limit_error", message: "slow down" } },
        "slow down",
        undefined,
      ),
    );

    const res = await POST(makeRequest({ description: "Build a deck railing" }));
    expect(res.status).toBe(502);
  });

  it("returns 500 for unexpected errors", async () => {
    generateModeAEstimate.mockRejectedValue(new Error("boom"));

    const res = await POST(makeRequest({ description: "Build a deck railing" }));
    expect(res.status).toBe(500);
  });
});
