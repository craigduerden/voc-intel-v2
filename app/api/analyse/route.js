import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are a JSON API. You must respond with ONLY a valid JSON object — no preamble, no explanation, no markdown, no backticks, no "Here is..." text. Your entire response must start with { and end with }. Any other output will break the system.

You are a direct response copywriter and Voice of Customer (VoC) research analyst. Search the web for real customer sentiment. Run a maximum of 2 targeted searches then synthesise your findings immediately. Return this JSON structure:

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

Return 4 items per section maximum. Be concise and specific — this goes directly into sales copy.`;

const MAX_TURNS = 4;

export async function POST(request) {
  try {
    const { query, context } = await request.json();

    if (!query?.trim()) {
      return Response.json({ error: "Query is required" }, { status: 400 });
    }

    const userMessage = `Research Voice of Customer sentiment for: "${query}"${context ? `\n\nContext: ${context}` : ""}

Run no more than 2 focused web searches, then return the JSON immediately. Prioritise Reddit, Trustpilot, and Google Reviews.`;

    const messages = [{ role: "user", content: userMessage }];
    const tools = [{ type: "web_search_20250305", name: "web_search" }];

    let inputTokens = 0;
    let outputTokens = 0;

    for (let turn = 0; turn < MAX_TURNS; turn++) {
      const response = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2000,
        system: SYSTEM_PROMPT,
        tools,
        messages,
      });

      const { stop_reason, content, usage } = response;

      if (usage) {
        inputTokens += usage.input_tokens || 0;
        outputTokens += usage.output_tokens || 0;
      }

      messages.push({ role: "assistant", content });

      if (stop_reason === "end_turn") {
        const text = content
          .filter((b) => b.type === "text")
          .map((b) => b.text)
          .join("");

        const clean = text.replace(/<cite[^>]*>|<\/cite>/g, "");
        const match = clean.match(/\{[\s\S]*\}/);

        if (!match) {
          return Response.json({ error: "No JSON in response" }, { status: 500 });
        }

        const parsed = JSON.parse(match[0]);

        // Log usage to Vercel logs
        const estimatedCost = ((inputTokens / 1_000_000) * 0.80) + ((outputTokens / 1_000_000) * 4.00);
        console.log(`VoC request: "${query}" | Input: ${inputTokens} | Output: ${outputTokens} | Est. cost: $${estimatedCost.toFixed(4)}`);

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

        if (toolResults.length > 0) {
          messages.push({ role: "user", content: toolResults });
        }
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
