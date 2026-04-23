"use client";

import { useState } from "react";

const SECTIONS = [
  { key: "painPoints", label: "Pain Points", icon: "⚡", desc: "What they hate / fear / complain about" },
  { key: "desiredOutcomes", label: "Desired Outcomes", icon: "🎯", desc: "What they actually want" },
  { key: "exactPhrases", label: "Exact Phrases", icon: "💬", desc: "Mirror these verbatim in headlines" },
  { key: "objections", label: "Objections", icon: "🚧", desc: "What stops them from buying" },
  { key: "trustSignals", label: "Trust Signals", icon: "🛡️", desc: "What made them finally commit" },
  { key: "copyAngles", label: "Copy Angles", icon: "✍️", desc: "Ready-to-use headline swipes" },
];

export default function VoCTool() {
  const [query, setQuery] = useState("");
  const [context, setContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState("painPoints");
  const [copied, setCopied] = useState(null);

  const handleAnalyse = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch("/api/analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, context }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");

      setResult(data);
      setActiveSection("painPoints");
    } catch (err) {
      setError("Something went wrong. Try again or refine your query.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const copyAll = (section) => {
    const text = result[section].map((item) => Object.values(item).join(" — ")).join("\n");
    navigator.clipboard.writeText(text);
    setCopied(section);
    setTimeout(() => setCopied(null), 2000);
  };

  const activeData = result?.[activeSection] || [];
  const activeMeta = SECTIONS.find((s) => s.key === activeSection);

  return (
    <div style={{ minHeight: "100vh", background: "#f0f2f5", fontFamily: "'Inter', sans-serif", color: "#1a1a2e" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&family=Inter:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .card { background: #fff; border: 1px solid #e2e6ea; border-radius: 14px; padding: 24px; transition: border-color 0.2s, box-shadow 0.2s; }
        .card:hover { border-color: #c8cdd5; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
        .tab-btn { background: none; border: none; cursor: pointer; padding: 9px 14px; border-radius: 8px; font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 500; transition: all 0.2s; color: #6b7280; display: flex; align-items: center; gap: 6px; white-space: nowrap; }
        .tab-btn:hover { background: #f3f4f6; color: #374151; }
        .tab-btn.active { color: #111827; background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,0.1); border-left: 3px solid #9bff8b; }
        .analyse-btn { background: #9bff8b; color: #0d1f0a; border: none; border-radius: 10px; padding: 14px 28px; font-family: 'Outfit', sans-serif; font-size: 15px; font-weight: 700; cursor: pointer; transition: all 0.2s; }
        .analyse-btn:hover:not(:disabled) { background: #7de86e; transform: translateY(-1px); box-shadow: 0 4px 16px rgba(155,255,139,0.4); }
        .analyse-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .copy-btn { background: #f3f4f6; color: #6b7280; border: 1px solid #e5e7eb; border-radius: 6px; padding: 6px 12px; font-family: 'Inter', sans-serif; font-size: 12px; cursor: pointer; transition: all 0.2s; }
        .copy-btn:hover { background: #e5e7eb; color: #374151; }
        .item-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px 18px; margin-bottom: 10px; transition: border-color 0.2s, box-shadow 0.2s; }
        .item-card:hover { border-color: #9bff8b; box-shadow: 0 2px 8px rgba(155,255,139,0.15); }
        .pulse { animation: pulse 1.5s ease-in-out infinite; }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }
        textarea, input[type=text] { background: #f9fafb; border: 1.5px solid #e2e6ea; border-radius: 10px; color: #111827; font-family: 'Inter', sans-serif; font-size: 15px; padding: 13px 16px; width: 100%; outline: none; transition: border-color 0.2s, box-shadow 0.2s; resize: none; }
        textarea:focus, input[type=text]:focus { border-color: #111827; box-shadow: 0 0 0 3px rgba(17,24,39,0.1); background: #fff; }
        textarea::placeholder, input::placeholder { color: #9ca3af; }
      `}</style>

      {/* Header */}
      <div style={{ background: "#111827", borderBottom: "1px solid #1f2937", padding: "16px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }}>
        <img
          src="/logo.svg"
          alt="Call Convert"
          style={{ height: "36px", display: "block" }}
          onError={(e) => { e.target.style.display = "none"; e.target.nextSibling.style.display = "block"; }}
        />
        <span style={{ display: "none", fontFamily: "'Outfit', sans-serif", fontSize: "22px", fontWeight: 800, color: "#fff" }}>Call Convert</span>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: "13px", fontWeight: 600, color: "#9bff8b", letterSpacing: "0.5px", textTransform: "uppercase" }}>VoC Intel</span>
          <span style={{ width: "1px", height: "16px", background: "#374151" }} />
          <span style={{ fontSize: "11px", color: "#6b7280" }}>Copy Intelligence Engine</span>
        </div>
      </div>

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "32px 24px" }}>

        {/* Input */}
        <div className="card" style={{ marginBottom: "24px" }}>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontFamily: "'Outfit', sans-serif", fontSize: "11px", fontWeight: 700, color: "#111827", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "8px" }}>Product or Service</label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleAnalyse()}
              placeholder="e.g. boiler installation, neurodivergent child support app, commercial cleaning leads..."
            />
          </div>
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontFamily: "'Outfit', sans-serif", fontSize: "11px", fontWeight: 700, color: "#111827", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "8px" }}>
              Context <span style={{ color: "#9ca3af", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span>
            </label>
            <textarea
              rows={2}
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Target audience, geography, price point, competitors... anything that sharpens the research"
            />
          </div>
          <button className="analyse-btn" onClick={handleAnalyse} disabled={loading || !query.trim()}>
            {loading ? "Researching..." : "Analyse Sentiment →"}
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="card" style={{ textAlign: "center", padding: "48px 24px" }}>
            <div className="pulse" style={{ fontSize: "32px", marginBottom: "16px" }}>🔍</div>
            <div style={{ color: "#6b7280", fontSize: "14px", marginBottom: "6px" }}>Searching Reddit, Trustpilot, reviews &amp; forums...</div>
            <div style={{ color: "#9ca3af", fontSize: "12px" }}>Identifying recurring patterns in customer sentiment</div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="card" style={{ borderColor: "#fca5a5", background: "#fff5f5" }}>
            <span style={{ color: "#dc2626", fontSize: "13px" }}>⚠ {error}</span>
          </div>
        )}

        {/* Results */}
        {result && (
          <div style={{ animation: "fadeIn 0.4s ease" }}>
            <div className="card" style={{ marginBottom: "20px", borderLeft: "4px solid #9bff8b" }}>
              <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: "11px", fontWeight: 700, color: "#9ca3af", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "8px" }}>Market Sentiment Overview</div>
              <p style={{ color: "#374151", lineHeight: 1.7, fontSize: "14px" }}>{result.summary}</p>
            </div>

            <div style={{ display: "flex", gap: "4px", overflowX: "auto", marginBottom: "16px", paddingBottom: "4px", background: "#e5e7eb", borderRadius: "10px", padding: "4px" }}>
              {SECTIONS.map((s) => (
                <button key={s.key} className={`tab-btn ${activeSection === s.key ? "active" : ""}`} onClick={() => setActiveSection(s.key)}>
                  <span>{s.icon}</span> {s.label}
                  <span style={{ background: activeSection === s.key ? "#f0fdf4" : "#d1d5db", borderRadius: "10px", padding: "1px 7px", fontSize: "11px", color: activeSection === s.key ? "#166534" : "#6b7280", marginLeft: "2px" }}>
                    {result[s.key]?.length || 0}
                  </span>
                </button>
              ))}
            </div>

            <div className="card">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
                <div>
                  <span style={{ fontSize: "18px", marginRight: "8px" }}>{activeMeta.icon}</span>
                  <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: "20px", fontWeight: 800, color: "#111827" }}>{activeMeta.label}</span>
                  <span style={{ fontSize: "12px", color: "#9ca3af", marginLeft: "10px" }}>{activeMeta.desc}</span>
                </div>
                <button className="copy-btn" onClick={() => copyAll(activeSection)}>
                  {copied === activeSection ? "✓ Copied" : "Copy All"}
                </button>
              </div>

              {activeData.map((item, i) => {
                const keys = Object.keys(item);
                const primary = item[keys[0]];
                const rest = keys.slice(1);
                return (
                  <div key={i} className="item-card">
                    <div style={{ fontWeight: 600, fontSize: "14px", color: "#111827", marginBottom: rest.length ? "8px" : 0, lineHeight: 1.5 }}>{primary}</div>
                    {rest.map((k) => (
                      <div key={k} style={{ display: "flex", gap: "8px", marginTop: "5px", alignItems: "flex-start" }}>
                        <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: "11px", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px", minWidth: "90px", paddingTop: "1px" }}>{k}</span>
                        <span style={{ fontSize: "13px", color: "#4b5563", lineHeight: 1.5, fontStyle: k === "quote" || k === "example" ? "italic" : "normal" }}>
                          {k === "quote" || k === "example" ? `"${item[k]}"` : item[k]}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: "16px", padding: "14px 18px", background: "#fff", borderRadius: "10px", border: "1px solid #e2e6ea", display: "flex", gap: "16px", flexWrap: "wrap" }}>
              {[["Pain Points", "→ Villain / Agitate"], ["Outcomes", "→ Promise / Hero"], ["Exact Phrases", "→ Headlines / Subject lines"], ["Objections", "→ Pre-emptive handling"], ["Trust Signals", "→ Social proof section"], ["Copy Angles", "→ Direct to Godfather"]].map(([a, b]) => (
                <div key={a} style={{ fontSize: "12px" }}>
                  <span style={{ color: "#9ca3af" }}>{a}</span>
                  <span style={{ color: "#0d9e00", marginLeft: "6px", fontWeight: 600 }}>{b}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
