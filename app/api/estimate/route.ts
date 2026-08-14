import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { generateBudgetEstimate, generateEstimateWithTiers } from "@/lib/claude";

type ParsedEstimateRequest =
  | { ok: true; description: string; budget?: number }
  | { ok: false; error: string };

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = parseEstimateRequest(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const estimate =
      parsed.budget === undefined
        ? await generateEstimateWithTiers(parsed.description)
        : await generateBudgetEstimate(parsed.description, parsed.budget);
    return NextResponse.json(estimate);
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      console.error("Claude API error:", error.status, error.message);
      return NextResponse.json(
        { error: "Failed to generate estimate" },
        { status: 502 },
      );
    }
    console.error("Unexpected error generating estimate:", error);
    return NextResponse.json(
      { error: "Failed to generate estimate" },
      { status: 500 },
    );
  }
}

function parseEstimateRequest(body: unknown): ParsedEstimateRequest {
  const field = (name: string): unknown =>
    typeof body === "object" && body !== null && name in body
      ? (body as Record<string, unknown>)[name]
      : undefined;

  const description = field("description");
  if (typeof description !== "string" || description.trim().length === 0) {
    return { ok: false, error: "\"description\" is required and must be a non-empty string" };
  }

  const rawBudget = field("budget");
  if (rawBudget === undefined || rawBudget === null) {
    return { ok: true, description: description.trim() };
  }
  if (typeof rawBudget !== "number" || !Number.isFinite(rawBudget) || rawBudget <= 0) {
    return { ok: false, error: "\"budget\" must be a positive number when provided" };
  }

  return { ok: true, description: description.trim(), budget: rawBudget };
}
