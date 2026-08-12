import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const MODEL = "claude-opus-5";

export interface EstimateTier {
  tier: "low" | "medium" | "high";
  cost_range: string;
  materials: string[];
  time_estimate: string;
  video_search_queries: string[];
  safety_notes: string | null;
}

export interface ModeAEstimate {
  project: string;
  tiers: EstimateTier[];
}

const SYSTEM_PROMPT = `You help homeowners plan DIY projects. Given a project description, break it
down into three cost tiers: low, medium, and high. For each tier, give a realistic cost range,
a materials list, a time estimate, and 1-3 YouTube search queries someone could use to find
tutorials for that approach. Do not invent YouTube URLs or video titles — only search queries.

Standing safety rule: for safety-relevant project categories (electrical, structural, gas lines,
and similar), include typical permit and licensed-professional requirements in safety_notes for
every tier, even when the tier looks straightforward. For projects with no such concerns, set
safety_notes to null.`;

const ESTIMATE_TOOL: Anthropic.Tool = {
  name: "generate_estimate",
  description:
    "Return a structured three-tier (low/medium/high) DIY project cost estimate.",
  strict: true,
  input_schema: {
    type: "object",
    properties: {
      project: {
        type: "string",
        description: "The project description, restated concisely.",
      },
      tiers: {
        type: "array",
        description: "Exactly three entries, one each for low, medium, and high.",
        items: {
          type: "object",
          properties: {
            tier: { type: "string", enum: ["low", "medium", "high"] },
            cost_range: { type: "string", description: "e.g. \"$150-300\"" },
            materials: { type: "array", items: { type: "string" } },
            time_estimate: { type: "string", description: "e.g. \"1 weekend\"" },
            video_search_queries: {
              type: "array",
              items: { type: "string" },
              description: "YouTube search queries, not URLs or titles.",
            },
            safety_notes: {
              type: ["string", "null"],
              description:
                "Permit/licensed-professional guidance for safety-relevant categories; null otherwise.",
            },
          },
          required: [
            "tier",
            "cost_range",
            "materials",
            "time_estimate",
            "video_search_queries",
            "safety_notes",
          ],
          additionalProperties: false,
        },
      },
    },
    required: ["project", "tiers"],
    additionalProperties: false,
  },
};

export async function generateModeAEstimate(
  description: string,
): Promise<ModeAEstimate> {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    tools: [ESTIMATE_TOOL],
    tool_choice: { type: "tool", name: "generate_estimate" },
    messages: [{ role: "user", content: description }],
  });

  const toolUse = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
  );
  if (!toolUse) {
    throw new Error("Claude did not return a tool_use block");
  }

  return toolUse.input as ModeAEstimate;
}
