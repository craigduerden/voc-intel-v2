import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are a JSON API. You must respond with ONLY a valid JSON object — no preamble, no explanation, no markdown, no backticks, no "Here is..." text. Your entire response must start with { and end with }. Any other output will break the system.

You are also a world-class direct response copywriter and Voice of Customer (VoC) research analyst. When given a product or service, search the web for real customer sentiment from Reddit, Trustpilot, Google Reviews, forums, and review sites. Analyse what you find and return the following JSON structure:

{
  "summary": "2-sentence overview of the market sentiment landscape",
  "painPoints": [
    { "point": "The main frustration", "frequency": "very common", "quote": "example phrase a real customer might say" }
  ],
  "desiredOutcomes": [
    { "point": "What they actually want", "frequency": "common", "quote": "example phrase" }
  ],
  "exactPhrases": [
    { "phrase": "Exact language customers use", "context": "where/how this appears" }
  ],
  "objections": [
    { "objection": "The blocker", "underlyingFear": "What the real fear is" }
  ],
  "trustSignals": [
    { "signal": "What builds trust", "example": "how customers express this" }
  ],
  "copyAngles": [
    { "angle": "Headline or hook idea", "framework": "StoryBrand/Sabri Suby/AIDA/etc", "notes": "why this works" }
  ]
}

Return 4-6 items per section. Base everything on real patterns from web research. Be specific and actionable — this is going directly into sales copy.`;

const MAX_TURNS = 8;

export async function POST(request) {
  try {
    const { query, context } = await request.json();

    if (!query?.trim()) {
      return Response.json({ error: "Query is required" }, { status: 400 });
    }

    const userMessage = `Research Voice of Customer sentiment for: "${query}"${context ? `\n\nAdditional context: ${context}` : ""}

Search Reddit, Trustpilot, Google Reviews, forums, and review sites for real customer feedback. Identify recurring patterns in pain points, desired outcomes, exact language used, objections, trust signals, and suggest copy angles based on what you find.`;

    const messages = [{ role: "user", content: userMessage }];
    const tools = [{ type: "web_search_20250305", name: "web_search" }];

    for (let turn = 0; turn < MAX_TURNS; turn++) {
      const response = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4000,
        system: SYSTEM_PROMPT,
        tools,
        messages,
      });

      const { stop_reason, content } = response;
      messages.push({ role: "assistant", content });

      if (stop_reason === "end_turn") {
        const text = content
          .filter((b) => b.type === "text")
          .map((b) => b.text)
          .join("");

        const match = text.match(/\{[\s\S]*\}/);
        if (!match) {
          return Response.json({ error: "No JSON in response" }, { status: 500 });
        }

        const parsed = JSON.parse(match[0]);
        return Response.json(parsed);
      }

      if (stop_reason === "tool_use" || stop_reason === "pause_turn") {
        const toolResults = content
          .filter((b) => b.type === "tool_use")
          .map((b) => ({
            type: "tool_result",
            tool_use_id: b.id,
            content: b.input ? JSON.stringify(b.input) : "search executed",
          }));

        messages.push({ role: "user", content: toolResults });
        continue;
      }

      return Response.json({ error: `Unexpected stop_reason: ${stop_reason}` }, { status: 500 });
    }

    return Response.json({ error: "Max turns reached" }, { status: 500 });
  } catch (err) {
    console.error("VoC API error:", err);
    return Response.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
