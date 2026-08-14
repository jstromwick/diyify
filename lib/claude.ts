import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const MODEL = "claude-opus-5";

export interface MaterialBudgetItem {
  item: string;
  estimatedCost: string;
}

export interface EstimateTier {
  tier: "low" | "medium" | "high";
  name: string;
  description: string;
  cost_range: string;
  materials: string[];
  materialsWithBudget: MaterialBudgetItem[];
  time_estimate: string;
  plan: string[];
  video_search_queries: string[];
  safety_notes: string | null;
}

export interface EstimateWithTiers {
  project: string;
  tiers: EstimateTier[];
}

export interface RealisticEstimate {
  project: string;
  budget: number;
  realistic: true;
  withinBudget: {
    cost_range: string;
    materials: string[];
    materialsWithBudget: MaterialBudgetItem[];
    trade_offs: string;
    plan: string[];
    video_search_queries: string[];
    safety_notes: string | null;
  };
  stretchOption: {
    cost_range: string;
    what_you_gain: string;
  };
  savingsOption: {
    cost_range: string;
    what_you_cut: string;
  };
}

export interface UnrealisticEstimate {
  project: string;
  budget: number;
  realistic: false;
  reason: string;
  minRealisticBudget: number;
  whatThatGetsYou: {
    materials: string[];
    materialsWithBudget: MaterialBudgetItem[];
    plan: string[];
    video_search_queries: string[];
    safety_notes: string | null;
  };
}

export type BudgetEstimate = RealisticEstimate | UnrealisticEstimate;

const TIER_ESTIMATE_PROMPT = `You help homeowners plan DIY projects. Given a project description, break it
down into three cost tiers: low, medium, and high. For each tier, give a short, catchy name (2-4
words, e.g. "Weekend Build", "Showroom Finish") and a one-sentence description of the approach, a
realistic cost range, a materials list with individual cost estimates (e.g. "100sqft of tile ~$200"),
a time estimate, a step-by-step plan for completing the work, and 1-3 YouTube search queries someone
could use to find tutorials for that approach. Do not invent YouTube URLs or video titles — only
search queries.

IMPORTANT: Assume all labor that is safe for a DIYer to do is done for free by the user. Only include
material costs and costs for labor that requires a licensed professional or specialized equipment.
The materialsWithBudget items should explain and roughly align with the total cost_range.

For the plan, provide an ordered list of steps (e.g. "1. Demo existing tile", "2. Prepare substrate",
"3. Install new tile", etc.) that outlines the logical order for a DIYer to complete the work. Any
step that involves work requiring a licensed professional or permit inspection must be labeled as
performed by that professional (e.g. "4. Licensed electrician runs new circuit"), not framed as a
DIY task — keep the DIYer's own steps limited to safe preparation, assistance, or follow-up around
that work.

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
            name: {
              type: "string",
              description: "Short, catchy name for this tier's approach, e.g. \"Weekend Build\".",
            },
            description: {
              type: "string",
              description: "One-sentence summary of what this tier's approach involves.",
            },
            cost_range: { type: "string", description: "e.g. \"$150-300\"" },
            materials: { type: "array", items: { type: "string" } },
            materialsWithBudget: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  item: { type: "string", description: "Material or labor description, e.g. \"100sqft of tile\" or \"Electrician labor\"" },
                  estimatedCost: { type: "string", description: "e.g. \"~$200\" or \"$300-400\"" },
                },
                required: ["item", "estimatedCost"],
                additionalProperties: false,
              },
              description: "Materials and costs itemized, roughly explaining the total cost_range. Includes only materials and unsafe labor.",
            },
            time_estimate: { type: "string", description: "e.g. \"1 weekend\"" },
            plan: {
              type: "array",
              items: { type: "string" },
              description: "Ordered steps for completing the work, e.g. [\"1. Demo existing tile\", \"2. Prepare substrate\", \"3. Install new tile\"]",
            },
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
            "name",
            "description",
            "cost_range",
            "materials",
            "materialsWithBudget",
            "time_estimate",
            "plan",
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

const BUDGET_PROMPT = `You help homeowners plan DIY projects against a stated budget. Given a project
description and a budget, first decide whether the budget is realistic for that project.

If it is realistic: propose the best plan achievable at that budget (cost range, materials with itemized
budgets, the trade-offs made to hit this number, a step-by-step work plan, and 1-3 YouTube search queries),
plus a stretch option (what you'd gain by going ~20% over budget) and a savings option (what you'd cut to go
~20% under budget). Do not invent YouTube URLs or video titles — only search queries.

If it is not realistic: say so plainly, don't force a fit or quietly cut safety corners. Explain why in one
or two sentences, state the real minimum realistic budget, and describe what that minimum gets you (materials
with itemized budgets, a step-by-step work plan, and 1-3 YouTube search queries).

IMPORTANT: Assume all labor that is safe for a DIYer to do is done for free by the user. Only include material
costs and costs for labor that requires a licensed professional or specialized equipment. The materialsWithBudget
items should explain and roughly align with the total cost — withinBudget.cost_range when the budget is realistic,
or minRealisticBudget when it isn't. The plan should be an ordered list of steps
(e.g. "1. Demo", "2. Framing", "3. Licensed electrician runs new circuit", "4. Patch and paint") outlining the
logical order for a DIYer to complete the work. Any step requiring a licensed professional or permit inspection
must be labeled as performed by that professional, not framed as a DIY task — keep the DIYer's own steps limited
to safe preparation, assistance, or follow-up around that work.

Standing safety rule: for safety-relevant project categories (electrical, structural, gas lines, and similar),
flag typical permit and licensed-professional requirements — even when the budget is realistic, not only when
rejecting it. Put this in withinBudget.safety_notes when realistic, or whatThatGetsYou.safety_notes when not.
For projects with no such concerns, set safety_notes to null.`;

const BUDGET_ESTIMATE_TOOL: Anthropic.Tool = {
  name: "generate_budget_estimate",
  description:
    "Return a structured DIY project plan for a stated budget: either the best plan achievable " +
    "at that budget (with a stretch and a savings option) if the budget is realistic, or an " +
    "explanation and real minimum budget if it isn't.",
  strict: true,
  input_schema: {
    type: "object",
    properties: {
      project: {
        type: "string",
        description: "The project description, restated concisely.",
      },
      budget: {
        type: "number",
        description: "The user's stated budget, restated.",
      },
      realistic: {
        type: "boolean",
        description: "Whether the stated budget is realistic for this project.",
      },
      withinBudget: {
        type: ["object", "null"],
        description: "Populated when realistic is true; null when realistic is false.",
        properties: {
          cost_range: { type: "string", description: "e.g. \"$350-400\"" },
          materials: { type: "array", items: { type: "string" } },
          materialsWithBudget: {
            type: "array",
            items: {
              type: "object",
              properties: {
                item: { type: "string", description: "Material or labor description, e.g. \"100sqft of tile\" or \"Electrician labor\"" },
                estimatedCost: { type: "string", description: "e.g. \"~$200\" or \"$300-400\"" },
              },
              required: ["item", "estimatedCost"],
              additionalProperties: false,
            },
            description: "Materials and costs itemized, roughly explaining the total cost_range. Includes only materials and unsafe labor.",
          },
          trade_offs: {
            type: "string",
            description: "What's sacrificed to hit this budget vs a higher tier.",
          },
          plan: {
            type: "array",
            items: { type: "string" },
            description: "Ordered steps for completing the work, e.g. [\"1. Demo\", \"2. Framing\", \"3. Electrical\"]",
          },
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
        required: ["cost_range", "materials", "materialsWithBudget", "trade_offs", "plan", "video_search_queries", "safety_notes"],
        additionalProperties: false,
      },
      stretchOption: {
        type: ["object", "null"],
        description: "Populated when realistic is true; null when realistic is false.",
        properties: {
          cost_range: { type: "string", description: "e.g. \"$450-500\"" },
          what_you_gain: { type: "string", description: "What ~20% over budget buys." },
        },
        required: ["cost_range", "what_you_gain"],
        additionalProperties: false,
      },
      savingsOption: {
        type: ["object", "null"],
        description: "Populated when realistic is true; null when realistic is false.",
        properties: {
          cost_range: { type: "string", description: "e.g. \"$250-300\"" },
          what_you_cut: { type: "string", description: "What ~20% under budget cuts." },
        },
        required: ["cost_range", "what_you_cut"],
        additionalProperties: false,
      },
      reason: {
        type: ["string", "null"],
        description:
          "Populated when realistic is false: why the budget doesn't work. Null when realistic is true.",
      },
      minRealisticBudget: {
        type: ["number", "null"],
        description: "Populated when realistic is false: the real minimum budget. Null when realistic is true.",
      },
      whatThatGetsYou: {
        type: ["object", "null"],
        description: "Populated when realistic is false; null when realistic is true.",
        properties: {
          materials: { type: "array", items: { type: "string" } },
          materialsWithBudget: {
            type: "array",
            items: {
              type: "object",
              properties: {
                item: { type: "string", description: "Material or labor description, e.g. \"100sqft of tile\" or \"Electrician labor\"" },
                estimatedCost: { type: "string", description: "e.g. \"~$200\" or \"$300-400\"" },
              },
              required: ["item", "estimatedCost"],
              additionalProperties: false,
            },
            description: "Materials and costs itemized, roughly explaining minRealisticBudget. Includes only materials and unsafe labor.",
          },
          plan: {
            type: "array",
            items: { type: "string" },
            description: "Ordered steps for completing the work, e.g. [\"1. Demo\", \"2. Framing\", \"3. Electrical\"]",
          },
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
        required: ["materials", "materialsWithBudget", "plan", "video_search_queries", "safety_notes"],
        additionalProperties: false,
      },
    },
    required: [
      "project",
      "budget",
      "realistic",
      "withinBudget",
      "stretchOption",
      "savingsOption",
      "reason",
      "minRealisticBudget",
      "whatThatGetsYou",
    ],
    additionalProperties: false,
  },
};

interface RawBudgetToolOutput {
  project: string;
  budget: number;
  realistic: boolean;
  withinBudget: RealisticEstimate["withinBudget"] | null;
  stretchOption: RealisticEstimate["stretchOption"] | null;
  savingsOption: RealisticEstimate["savingsOption"] | null;
  reason: string | null;
  minRealisticBudget: number | null;
  whatThatGetsYou: UnrealisticEstimate["whatThatGetsYou"] | null;
}

export async function generateBudgetEstimate(
  description: string,
  budget: number,
): Promise<BudgetEstimate> {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 8192,
    system: BUDGET_PROMPT,
    tools: [BUDGET_ESTIMATE_TOOL],
    tool_choice: { type: "tool", name: "generate_budget_estimate" },
    messages: [{ role: "user", content: `${description}\n\nBudget: $${budget}` }],
  });

  if (response.stop_reason === "max_tokens") {
    throw new Error("Claude's response was truncated (hit max_tokens) before completing the estimate");
  }

  const toolUse = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
  );
  if (!toolUse) {
    throw new Error("Claude did not return a tool_use block");
  }

  const raw = toolUse.input as RawBudgetToolOutput;

  if (raw.realistic) {
    if (!raw.withinBudget || !raw.stretchOption || !raw.savingsOption) {
      throw new Error("Claude marked the budget realistic but omitted the realistic-budget fields");
    }
    return {
      project: raw.project,
      budget: raw.budget,
      realistic: true,
      withinBudget: raw.withinBudget,
      stretchOption: raw.stretchOption,
      savingsOption: raw.savingsOption,
    };
  }

  if (raw.reason === null || raw.minRealisticBudget === null || !raw.whatThatGetsYou) {
    throw new Error("Claude marked the budget unrealistic but omitted the unrealistic-budget fields");
  }
  return {
    project: raw.project,
    budget: raw.budget,
    realistic: false,
    reason: raw.reason,
    minRealisticBudget: raw.minRealisticBudget,
    whatThatGetsYou: raw.whatThatGetsYou,
  };
}

export async function generateEstimateWithTiers(
  description: string,
): Promise<EstimateWithTiers> {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 8192,
    system: TIER_ESTIMATE_PROMPT,
    tools: [ESTIMATE_TOOL],
    tool_choice: { type: "tool", name: "generate_estimate" },
    messages: [{ role: "user", content: description }],
  });

  if (response.stop_reason === "max_tokens") {
    throw new Error("Claude's response was truncated (hit max_tokens) before completing the estimate");
  }

  const toolUse = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
  );
  if (!toolUse) {
    throw new Error("Claude did not return a tool_use block");
  }

  return toolUse.input as EstimateWithTiers;
}
