import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { generateModeAEstimate } from "@/lib/claude";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const description =
    typeof body === "object" && body !== null && "description" in body
      ? (body as { description: unknown }).description
      : undefined;

  if (typeof description !== "string" || description.trim().length === 0) {
    return NextResponse.json(
      { error: "\"description\" is required and must be a non-empty string" },
      { status: 400 },
    );
  }

  try {
    const estimate = await generateModeAEstimate(description.trim());
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
