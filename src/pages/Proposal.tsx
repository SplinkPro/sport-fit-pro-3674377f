import React from "react";

export default function Proposal() {
  return (
    <div className="proposal-root" style={{ fontFamily: "'Segoe UI', Arial, sans-serif", background: "#f0f4f8", minHeight: "100vh", padding: "24px 0" }}>
      <style>{`
        @media print {
          .proposal-root { background: white !important; padding: 0 !important; }
          .page { box-shadow: none !important; margin: 0 !important; page-break-after: always; }
          .page:last-child { page-break-after: avoid; }
          .no-print { display: none !important; }
        }
        .page {
          width: 794px;
          min-height: 1123px;
          background: #ffffff;
          margin: 0 auto 32px auto;
          box-shadow: 0 4px 24px rgba(0,0,0,0.13);
          position: relative;
          display: flex;
          flex-direction: column;
        }
        .page-content { flex: 1; padding: 52px 52px 72px 52px; }
        .page-footer {
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 44px;
          background: #1a3a6b;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 52px;
          color: #c8d9f0;
          font-size: 10.5px;
          letter-spacing: 0.04em;
        }
        .cover-header {
          background: linear-gradient(135deg, #0d2b6b 0%, #1a56a0 60%, #1e7ec2 100%);
          padding: 56px 52px 44px 52px;
          color: white;
        }
        h1.doc-title { font-size: 26px; font-weight: 700; color: #fff; margin: 0 0 10px 0; line-height: 1.25; }
        h2.doc-subtitle { font-size: 15px; font-weight: 400; color: #a8c8e8; margin: 0 0 28px 0; }
        .meta-row { display: flex; gap: 36px; margin-top: 4px; }
        .meta-item { font-size: 12px; color: #c8ddf0; }
        .meta-item strong { color: #fff; display: block; font-size: 13px; margin-bottom: 2px; }
        .section-title {
          font-size: 15px; font-weight: 700; color: #0d2b6b;
          border-left: 4px solid #1a56a0; padding-left: 12px;
          margin: 28px 0 14px 0; letter-spacing: 0.01em;
        }
        .section-title.first { margin-top: 0; }
        p.body { font-size: 12.5px; color: #2a3a50; line-height: 1.7; margin: 0 0 12px 0; }
        .highlight-box {
          background: #eef4fb; border: 1px solid #b6d0ed;
          border-radius: 6px; padding: 14px 18px; margin: 14px 0;
        }
        .highlight-box p { margin: 0; font-size: 12px; color: #1a3a6b; line-height: 1.6; }
        .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin: 16px 0; }
        .info-card {
          border: 1px solid #cdddf0; border-radius: 6px; padding: 14px 16px;
          background: #f7fafd;
        }
        .info-card h4 { font-size: 12.5px; font-weight: 700; color: #0d2b6b; margin: 0 0 6px 0; }
        .info-card ul { margin: 0; padding-left: 16px; }
        .info-card ul li { font-size: 11.5px; color: #2a3a50; line-height: 1.6; margin-bottom: 3px; }
        .page-number { font-weight: 600; color: #90b8dc; }
        /* Architecture diagram styles */
        .arch-diagram { margin: 14px 0 8px 0; }
        /* Cost table */
        table.cost-table { width: 100%; border-collapse: collapse; font-size: 11.5px; margin: 14px 0; }
        table.cost-table th {
          background: #0d2b6b; color: white; padding: 9px 12px;
          text-align: left; font-size: 11.5px; font-weight: 600; letter-spacing: 0.03em;
        }
        table.cost-table th:first-child { border-radius: 0; }
        table.cost-table td { padding: 8px 12px; border-bottom: 1px solid #dde9f5; color: #2a3a50; }
        table.cost-table tr:nth-child(even) td { background: #f4f8fd; }
        table.cost-table tr:hover td { background: #e8f0fa; }
        table.cost-table .good { color: #1a7a3a; font-weight: 600; }
        table.cost-table .bad { color: #c0392b; font-weight: 600; }
        table.cost-table .neutral { color: #1a56a0; font-weight: 600; }
        table.cost-table .row-head td:first-child { font-weight: 700; color: #0d2b6b; }
        .recommend-banner {
          background: linear-gradient(90deg, #0d2b6b, #1a56a0);
          color: white; border-radius: 6px; padding: 12px 18px;
          font-size: 12px; margin: 16px 0 0 0;
          display: flex; align-items: center; gap: 12px;
        }
        .recommend-banner strong { font-size: 13px; }
        .badge-model { 
          display: inline-block; padding: 2px 9px; border-radius: 10px;
          font-size: 10.5px; font-weight: 700; letter-spacing: 0.05em;
        }
        .badge-a { background: #fff3cd; color: #7a4f00; }
        .badge-b { background: #d1f0d1; color: #1a5a1a; }
        /* Security section */
        .sec-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin: 12px 0; }
        .sec-card {
          border: 1px solid #cdddf0; border-radius: 6px; padding: 13px 15px;
          background: linear-gradient(135deg, #f7fafd 0%, #eef4fb 100%);
        }
        .sec-card h4 { font-size: 12px; font-weight: 700; color: #0d2b6b; margin: 0 0 8px 0; display: flex; align-items: center; gap: 6px; }
        .sec-card ul { margin: 0; padding-left: 15px; }
        .sec-card li { font-size: 11px; color: #2a3a50; line-height: 1.6; }
        .tradeoff-row { display: grid; grid-template-columns: 120px 1fr 1fr; gap: 0; font-size: 11.5px; }
        .tradeoff-row .label { font-weight: 600; color: #0d2b6b; padding: 7px 10px 7px 0; border-bottom: 1px solid #dde9f5; }
        .tradeoff-row .val { padding: 7px 10px; border-bottom: 1px solid #dde9f5; color: #2a3a50; }
        .tradeoff-row .val.a-col { background: #fffdf5; }
        .tradeoff-row .val.b-col { background: #f5fff5; }
        .tradeoff-header { font-size: 11px; font-weight: 700; color: white; padding: 7px 10px; }
        .tradeoff-header.a-col { background: #7a5500; }
        .tradeoff-header.b-col { background: #1a5a1a; }
        .print-btn {
          position: fixed; bottom: 32px; right: 32px; z-index: 100;
          background: #1a56a0; color: white; border: none;
          border-radius: 50px; padding: 13px 26px; font-size: 14px; font-weight: 600;
          cursor: pointer; box-shadow: 0 4px 18px rgba(26,86,160,0.4);
          display: flex; align-items: center; gap: 8px;
        }
        .print-btn:hover { background: #0d2b6b; }
        .cascade-table { width: 100%; border-collapse: collapse; font-size: 11px; margin: 10px 0; }
        .cascade-table th { background: #1a56a0; color: white; padding: 7px 10px; text-align: right; font-weight: 600; }
        .cascade-table th:first-child { text-align: left; }
        .cascade-table td { padding: 6px 10px; border-bottom: 1px solid #dde9f5; text-align: right; }
        .cascade-table td:first-child { text-align: left; font-weight: 600; color: #0d2b6b; }
        .cascade-table tr:nth-child(even) td { background: #f4f8fd; }
        .sub-label { font-size: 10px; color: #6b8aaa; font-style: italic; }
      `}</style>

      {/* Print Button */}
      <button className="print-btn no-print" onClick={() => window.print()}>
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
        Print / Save PDF
      </button>

      {/* ═══════════════════════════════════════════════════════════ PAGE 1 */}
      <div className="page">
        <div className="cover-header">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: "10.5px", color: "#8ab4d8", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "14px" }}>
                Technical Architecture & Cost Proposal
              </div>
              <h1 className="doc-title">AI-Powered Child Assessment Platform</h1>
              <h2 className="doc-subtitle">Model A vs Model B — Comparative Architecture & Cost Analysis</h2>
              <div className="meta-row">
                <div className="meta-item"><strong>Prepared for</strong>Government of India / State Nodal Agency</div>
                <div className="meta-item"><strong>Prepared by</strong>PGBA Sports Intelligence Lab</div>
                <div className="meta-item"><strong>Date</strong>March 2026</div>
                <div className="meta-item"><strong>Classification</strong>Confidential</div>
              </div>
            </div>
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
              <rect width="64" height="64" rx="12" fill="rgba(255,255,255,0.1)"/>
              <circle cx="32" cy="22" r="10" stroke="rgba(255,255,255,0.6)" strokeWidth="2.5" fill="none"/>
              <path d="M12 52c0-11 40-11 40 0" stroke="rgba(255,255,255,0.6)" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
              <path d="M44 32 L56 24 M44 36 L58 38 M20 32 L8 24 M20 36 L6 38" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="56" cy="24" r="3" fill="#4caf8a"/>
              <circle cx="58" cy="38" r="3" fill="#4caf8a"/>
              <circle cx="8" cy="24" r="3" fill="#4caf8a"/>
              <circle cx="6" cy="38" r="3" fill="#4caf8a"/>
            </svg>
          </div>
        </div>
        <div className="page-content">
          <h3 className="section-title first">Executive Summary</h3>
          <p className="body">
            This document presents a comparative architecture and cost analysis for deploying an AI-powered child assessment platform at government scale — targeting <strong>1 million+ children</strong> across India. The platform leverages machine learning to generate individualized assessment reports, talent profiles, and development pathways from structured test input data.
          </p>
          <p className="body">
            Two deployment architectures are evaluated. <strong>Model A</strong> utilises a cloud-based SaaS stack with proprietary Large Language Model (LLM) APIs hosted on international cloud infrastructure. <strong>Model B</strong> employs an open-source LLM self-hosted on Indian government-approved servers, ensuring data sovereignty and long-term cost efficiency at scale.
          </p>
          <div className="highlight-box">
            <p>
              <strong>Key Finding:</strong> At 1M+ children, Model B (India-hosted open source) delivers <strong>80–92% lower per-child AI cost</strong> vs Model A, while achieving full compliance with India's Digital Personal Data Protection (DPDP) Act 2023. The higher upfront infrastructure investment is recovered within 6–8 months of production operation.
            </p>
          </div>

          <h3 className="section-title">Problem Statement</h3>
          <p className="body">
            Government-scale child assessment programs face three compounding challenges: (1) <strong>cost escalation</strong> as AI query costs multiply with each additional child, (2) <strong>data sovereignty risk</strong> when sensitive child data traverses international cloud infrastructure, and (3) <strong>vendor lock-in</strong> to proprietary AI providers whose pricing models are opaque and subject to change.
          </p>
          <div className="two-col">
            <div className="info-card">
              <h4>🎯 Proposal Objectives</h4>
              <ul>
                <li>Transparent cost modelling at every scale tier</li>
                <li>Security architecture compliance (DPDP Act 2023)</li>
                <li>Scalability design for 10K → 1M+ children</li>
                <li>Vendor independence and IP ownership</li>
                <li>Actionable deployment recommendation</li>
              </ul>
            </div>
            <div className="info-card">
              <h4>📊 Scope of Assessment</h4>
              <ul>
                <li>Physical fitness test data input (11 metrics)</li>
                <li>AI-generated individual athlete reports</li>
                <li>National talent identification screening</li>
                <li>Coach dashboards and batch analytics</li>
                <li>Integration with SAI / State Sports Dept. systems</li>
              </ul>
            </div>
          </div>

          <h3 className="section-title">Proposed Models at a Glance</h3>
          <div className="two-col">
            <div style={{ border: "1.5px solid #f0c060", borderRadius: "6px", padding: "14px 16px", background: "#fffdf7" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <span className="badge-model badge-a">MODEL A</span>
                <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#7a4f00" }}>Cloud SaaS + Proprietary LLM</span>
              </div>
              <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "11.5px", color: "#5a3a00" }}>
                <li>AWS / Azure / GCP hosted application</li>
                <li>OpenAI GPT-4 or Anthropic Claude APIs</li>
                <li>Fastest time-to-deploy (~4 weeks)</li>
                <li>Pay-per-query pricing model</li>
                <li>Data may reside on US/EU servers</li>
              </ul>
            </div>
            <div style={{ border: "1.5px solid #60c060", borderRadius: "6px", padding: "14px 16px", background: "#f7fff7" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <span className="badge-model badge-b">MODEL B</span>
                <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#1a5a1a" }}>India-Hosted Open Source LLM</span>
              </div>
              <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "11.5px", color: "#1a3a1a" }}>
                <li>NIC / Yotta / CtrlS on-prem or Indian cloud</li>
                <li>LLaMA 3 70B or Mistral — self-hosted</li>
                <li>12–16 weeks setup with fine-tuning</li>
                <li>Fixed infra cost regardless of query volume</li>
                <li>100% data stays within Indian jurisdiction</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="page-footer">
          <span>AI-Powered Child Assessment Platform — Architecture &amp; Cost Proposal | Confidential</span>
          <span className="page-number">Page 1 of 4</span>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════ PAGE 2 */}
      <div className="page">
        <div className="page-content">
          <h3 className="section-title first">Architecture Overview — Model A: Cloud SaaS + Proprietary LLM</h3>
          <p className="body" style={{ marginBottom: "10px" }}>
            All compute hosted on international cloud. AI analysis powered by metered API calls to proprietary LLM providers. 
            <span className="badge-model badge-a" style={{ marginLeft: "6px" }}>Best Case</span> assumes aggressive caching and batched prompts. 
            <span className="badge-model" style={{ background: "#fde8e8", color: "#7a1a1a", marginLeft: "6px" }}>Worst Case</span> assumes full query per child, no cache.
          </p>

          {/* Model A Architecture SVG */}
          <div className="arch-diagram">
            <svg viewBox="0 0 690 200" style={{ width: "100%", height: "auto", fontFamily: "Arial, sans-serif" }}>
              {/* Background */}
              <rect width="690" height="200" rx="8" fill="#f7fafd" stroke="#cdddf0" strokeWidth="1"/>
              
              {/* Step boxes */}
              {/* 1: Data Input */}
              <rect x="12" y="60" width="100" height="56" rx="6" fill="#1a56a0" />
              <text x="62" y="83" textAnchor="middle" fill="white" fontSize="10" fontWeight="700">📋 Data</text>
              <text x="62" y="97" textAnchor="middle" fill="white" fontSize="10" fontWeight="700">Input</text>
              <text x="62" y="110" textAnchor="middle" fill="#a8c8e8" fontSize="8.5">11 test metrics</text>
              
              {/* Arrow 1 */}
              <path d="M112 88 L138 88" stroke="#1a56a0" strokeWidth="2" markerEnd="url(#arrowBlue)"/>
              <defs>
                <marker id="arrowBlue" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L8,3 z" fill="#1a56a0"/>
                </marker>
                <marker id="arrowGray" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L8,3 z" fill="#aaa"/>
                </marker>
                <marker id="arrowRed" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L8,3 z" fill="#c0392b"/>
                </marker>
              </defs>
              
              {/* 2: App Server */}
              <rect x="138" y="60" width="108" height="56" rx="6" fill="#1a56a0" />
              <text x="192" y="83" textAnchor="middle" fill="white" fontSize="10" fontWeight="700">☁️ App Server</text>
              <text x="192" y="97" textAnchor="middle" fill="white" fontSize="10" fontWeight="700">(AWS/Azure)</text>
              <text x="192" y="110" textAnchor="middle" fill="#a8c8e8" fontSize="8.5">~$0.05–0.12/child/mo</text>
              
              {/* Arrow 2 with label */}
              <path d="M246 88 L272 88" stroke="#c0392b" strokeWidth="2" markerEnd="url(#arrowRed)"/>
              <text x="259" y="80" textAnchor="middle" fill="#c0392b" fontSize="8" fontWeight="600">🌐 EXTERNAL</text>
              
              {/* 3: LLM API */}
              <rect x="272" y="52" width="120" height="72" rx="6" fill="#c0392b" />
              <text x="332" y="76" textAnchor="middle" fill="white" fontSize="10" fontWeight="700">🤖 Proprietary</text>
              <text x="332" y="90" textAnchor="middle" fill="white" fontSize="10" fontWeight="700">LLM API</text>
              <text x="332" y="104" textAnchor="middle" fill="#ffcccc" fontSize="8.5">GPT-4o / Claude</text>
              <text x="332" y="116" textAnchor="middle" fill="#ffcccc" fontSize="8.5">$0.003–0.015/query</text>
              
              {/* Arrow 3 */}
              <path d="M392 88 L418 88" stroke="#1a56a0" strokeWidth="2" markerEnd="url(#arrowBlue)"/>
              
              {/* 4: Report Engine */}
              <rect x="418" y="60" width="108" height="56" rx="6" fill="#1a56a0" />
              <text x="472" y="83" textAnchor="middle" fill="white" fontSize="10" fontWeight="700">📊 Report</text>
              <text x="472" y="97" textAnchor="middle" fill="white" fontSize="10" fontWeight="700">Generation</text>
              <text x="472" y="110" textAnchor="middle" fill="#a8c8e8" fontSize="8.5">PDF / Dashboard</text>
              
              {/* Arrow 4 */}
              <path d="M526 88 L552 88" stroke="#1a56a0" strokeWidth="2" markerEnd="url(#arrowBlue)"/>
              
              {/* 5: Govt Client */}
              <rect x="552" y="60" width="124" height="56" rx="6" fill="#0d2b6b" />
              <text x="614" y="83" textAnchor="middle" fill="white" fontSize="10" fontWeight="700">🏛️ Govt /</text>
              <text x="614" y="97" textAnchor="middle" fill="white" fontSize="10" fontWeight="700">Coach Portal</text>
              <text x="614" y="110" textAnchor="middle" fill="#a8c8e8" fontSize="8.5">End user dashboard</text>
              
              {/* Best/Worst Case Labels */}
              <rect x="12" y="138" width="200" height="50" rx="5" fill="#fff8e8" stroke="#f0c060" strokeWidth="1"/>
              <text x="22" y="153" fill="#7a4f00" fontSize="9" fontWeight="700">✅ Best Case (cached + batched)</text>
              <text x="22" y="167" fill="#7a4f00" fontSize="8.5">Cost per child: ₹0.25–₹0.80</text>
              <text x="22" y="179" fill="#7a4f00" fontSize="8.5">1M children: ₹2.5L–₹8L/month</text>
              
              <rect x="224" y="138" width="200" height="50" rx="5" fill="#fef2f2" stroke="#c0392b" strokeWidth="1"/>
              <text x="234" y="153" fill="#7a1a1a" fontSize="9" fontWeight="700">⚠️ Worst Case (full query, no cache)</text>
              <text x="234" y="167" fill="#7a1a1a" fontSize="8.5">Cost per child: ₹4.50–₹12.00</text>
              <text x="234" y="179" fill="#7a1a1a" fontSize="8.5">1M children: ₹45L–₹1.2Cr/month</text>
              
              <rect x="436" y="138" width="240" height="50" rx="5" fill="#f0f4fb" stroke="#8ab4d8" strokeWidth="1"/>
              <text x="446" y="153" fill="#0d2b6b" fontSize="9" fontWeight="700">Data Flow Risk</text>
              <text x="446" y="167" fill="#5a7a9a" fontSize="8.5">Child data leaves Indian jurisdiction</text>
              <text x="446" y="179" fill="#5a7a9a" fontSize="8.5">DPDP Act compliance: ⚠️ Requires DPA</text>
            </svg>
          </div>

          <h3 className="section-title">Architecture Overview — Model B: Open Source LLM, India-Hosted</h3>
          <p className="body" style={{ marginBottom: "10px" }}>
            App + LLM entirely hosted on Indian government-approved infrastructure (NIC / Yotta / CtrlS). Open source model fine-tuned on domain data. All compute within Indian jurisdiction. Fixed infra cost regardless of query volume.
          </p>

          {/* Model B Architecture SVG */}
          <div className="arch-diagram">
            <svg viewBox="0 0 690 210" style={{ width: "100%", height: "auto", fontFamily: "Arial, sans-serif" }}>
              <rect width="690" height="210" rx="8" fill="#f5fff5" stroke="#a8d8a8" strokeWidth="1"/>
              {/* Indian boundary box */}
              <rect x="8" y="8" width="674" height="142" rx="8" fill="none" stroke="#2a8a2a" strokeWidth="1.5" strokeDasharray="6 3"/>
              <text x="14" y="22" fill="#2a8a2a" fontSize="9" fontWeight="700">🇮🇳 Indian Jurisdiction — All data remains within India</text>
              
              <defs>
                <marker id="arrowGreen" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L8,3 z" fill="#2a8a2a"/>
                </marker>
              </defs>
              
              {/* 1: Data Input */}
              <rect x="16" y="52" width="100" height="56" rx="6" fill="#1a5a1a" />
              <text x="66" y="75" textAnchor="middle" fill="white" fontSize="10" fontWeight="700">📋 Data</text>
              <text x="66" y="89" textAnchor="middle" fill="white" fontSize="10" fontWeight="700">Input</text>
              <text x="66" y="102" textAnchor="middle" fill="#a8d8a8" fontSize="8.5">11 test metrics</text>
              
              <path d="M116 80 L142 80" stroke="#2a8a2a" strokeWidth="2" markerEnd="url(#arrowGreen)"/>
              
              {/* 2: App Server India */}
              <rect x="142" y="52" width="115" height="56" rx="6" fill="#1a5a1a" />
              <text x="199" y="75" textAnchor="middle" fill="white" fontSize="10" fontWeight="700">🇮🇳 App Server</text>
              <text x="199" y="89" textAnchor="middle" fill="white" fontSize="10" fontWeight="700">NIC / Yotta</text>
              <text x="199" y="102" textAnchor="middle" fill="#a8d8a8" fontSize="8.5">Sovereign cloud</text>
              
              <path d="M257 80 L283 80" stroke="#2a8a2a" strokeWidth="2" markerEnd="url(#arrowGreen)"/>
              
              {/* 3: Local LLM */}
              <rect x="283" y="40" width="130" height="80" rx="6" fill="#2a8a2a" />
              <text x="348" y="64" textAnchor="middle" fill="white" fontSize="10" fontWeight="700">🤖 Open Source</text>
              <text x="348" y="78" textAnchor="middle" fill="white" fontSize="10" fontWeight="700">LLM (Self-hosted)</text>
              <text x="348" y="92" textAnchor="middle" fill="#d0f0d0" fontSize="8.5">LLaMA 3 70B / Mistral</text>
              <text x="348" y="106" textAnchor="middle" fill="#d0f0d0" fontSize="8.5">₹0.0008–₹0.003/query</text>
              
              <path d="M413 80 L439 80" stroke="#2a8a2a" strokeWidth="2" markerEnd="url(#arrowGreen)"/>
              
              {/* 4: Fine-Tune */}
              <rect x="439" y="52" width="108" height="56" rx="6" fill="#1a5a1a" />
              <text x="493" y="75" textAnchor="middle" fill="white" fontSize="10" fontWeight="700">⚙️ Fine-Tuned</text>
              <text x="493" y="89" textAnchor="middle" fill="white" fontSize="10" fontWeight="700">on Domain Data</text>
              <text x="493" y="102" textAnchor="middle" fill="#a8d8a8" fontSize="8.5">Sports + dev norms</text>
              
              <path d="M547 80 L573 80" stroke="#2a8a2a" strokeWidth="2" markerEnd="url(#arrowGreen)"/>
              
              {/* 5: Output */}
              <rect x="573" y="52" width="100" height="56" rx="6" fill="#0d3a0d" />
              <text x="623" y="75" textAnchor="middle" fill="white" fontSize="10" fontWeight="700">📊 Report +</text>
              <text x="623" y="89" textAnchor="middle" fill="white" fontSize="10" fontWeight="700">Dashboard</text>
              <text x="623" y="102" textAnchor="middle" fill="#a8d8a8" fontSize="8.5">Govt portal</text>
              
              {/* GPU node annotation */}
              <rect x="283" y="128" width="130" height="28" rx="4" fill="#e8f8e8" stroke="#2a8a2a" strokeWidth="1"/>
              <text x="348" y="141" textAnchor="middle" fill="#1a5a1a" fontSize="8.5" fontWeight="600">GPU: 4×A100 80GB (minimum)</text>
              <text x="348" y="151" textAnchor="middle" fill="#1a5a1a" fontSize="8">~₹1.8L–₹2.4L/month infra</text>
              
              {/* Cost summary */}
              <rect x="16" y="165" width="210" height="38" rx="5" fill="#e8f8e8" stroke="#2a8a2a" strokeWidth="1"/>
              <text x="26" y="180" fill="#1a5a1a" fontSize="9" fontWeight="700">✅ After Fine-tuning (6–12 weeks)</text>
              <text x="26" y="194" fill="#1a5a1a" fontSize="8.5">Cost per child: ₹0.04–₹0.18 | 1M: ₹40K–₹1.8L/mo</text>
              
              <rect x="238" y="165" width="210" height="38" rx="5" fill="#e8f8e8" stroke="#2a8a2a" strokeWidth="1"/>
              <text x="248" y="180" fill="#1a5a1a" fontSize="9" fontWeight="700">🎯 Fine-Tuning Requirement</text>
              <text x="248" y="194" fill="#1a5a1a" fontSize="8.5">~5,000–20,000 sample reports | One-time: ₹8L–₹20L</text>
              
              <rect x="460" y="165" width="222" height="38" rx="5" fill="#e8f8e8" stroke="#2a8a2a" strokeWidth="1"/>
              <text x="470" y="180" fill="#1a5a1a" fontSize="9" fontWeight="700">🔒 Data Sovereignty</text>
              <text x="470" y="194" fill="#1a5a1a" fontSize="8.5">100% India-hosted | DPDP Act: ✅ Fully Compliant</text>
            </svg>
          </div>

          {/* Cost Cascade Table */}
          <h3 className="section-title">Model B — Cost Cascade Table (per additional 10K children)</h3>
          <table className="cascade-table">
            <thead>
              <tr>
                <th>Scale Tier</th>
                <th>Cumulative Children</th>
                <th>Incremental AI Query Cost/mo</th>
                <th>Infra Scale Required</th>
                <th>Marginal Cost / Child</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Tier 0 — Baseline</td><td style={{textAlign:"right"}}>10,000</td><td style={{textAlign:"right"}}>₹400–₹1,800</td><td style={{textAlign:"right"}}>2× A100 GPU</td><td style={{textAlign:"right"}}>₹0.04–₹0.18</td></tr>
              <tr><td>Tier 1 — Expansion</td><td style={{textAlign:"right"}}>50,000</td><td style={{textAlign:"right"}}>₹2,000–₹9,000</td><td style={{textAlign:"right"}}>2× A100 GPU</td><td style={{textAlign:"right"}}>₹0.04–₹0.18</td></tr>
              <tr><td>Tier 2 — District</td><td style={{textAlign:"right"}}>100,000</td><td style={{textAlign:"right"}}>₹4,000–₹18,000</td><td style={{textAlign:"right"}}>4× A100 GPU</td><td style={{textAlign:"right"}}>₹0.04–₹0.18</td></tr>
              <tr><td>Tier 3 — State</td><td style={{textAlign:"right"}}>500,000</td><td style={{textAlign:"right"}}>₹20,000–₹90,000</td><td style={{textAlign:"right"}}>8× A100 GPU</td><td style={{textAlign:"right"}}>₹0.04–₹0.18</td></tr>
              <tr><td>Tier 4 — National</td><td style={{textAlign:"right"}}>1,000,000</td><td style={{textAlign:"right"}}>₹40,000–₹1.8L</td><td style={{textAlign:"right"}}>16× A100 GPU</td><td style={{textAlign:"right"}}>₹0.04–₹0.18</td></tr>
            </tbody>
          </table>
          <p className="sub-label">* Model B marginal cost per child remains near-constant due to fixed LLM infra. Each GPU tier supports ~60K–80K concurrent children/day. Fine-tuning cost (one-time ₹8L–₹20L) not included above.</p>
        </div>
        <div className="page-footer">
          <span>AI-Powered Child Assessment Platform — Architecture &amp; Cost Proposal | Confidential</span>
          <span className="page-number">Page 2 of 4</span>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════ PAGE 3 */}
      <div className="page">
        <div className="page-content">
          <h3 className="section-title first">Security &amp; Compliance Architecture</h3>
          <p className="body">Both models incorporate enterprise-grade security. However, data sovereignty compliance under India's <strong>Digital Personal Data Protection (DPDP) Act 2023</strong> creates a fundamental divergence in risk profile between the two architectures.</p>
          
          <div className="sec-grid">
            <div className="sec-card">
              <h4><span>🔐</span> Data Privacy &amp; Sovereignty</h4>
              <ul>
                <li><strong>Model A:</strong> Requires Data Processing Agreement (DPA) with foreign cloud &amp; LLM vendor; cross-border transfer under DPDP scrutiny</li>
                <li><strong>Model B:</strong> All PII stays within India; no cross-border transfer; fully DPDP Act 2023 compliant by architecture</li>
                <li>Child biometric and identity data classified as sensitive personal data under DPDP</li>
                <li>Anonymisation + pseudonymisation applied at ingestion layer in both models</li>
              </ul>
            </div>
            <div className="sec-card">
              <h4><span>🛡️</span> Role-Based Access Control (RBAC)</h4>
              <ul>
                <li>4-tier RBAC: National Admin → State Coordinator → District Coach → Viewer</li>
                <li>Athlete data visible only to assigned coach + authorised officials</li>
                <li>All access events logged to immutable audit trail (180-day retention)</li>
                <li>Multi-factor authentication mandatory for State+ level roles</li>
                <li>Session tokens expire in 8 hours; refresh tokens in 7 days</li>
              </ul>
            </div>
            <div className="sec-card">
              <h4><span>🔒</span> Encryption Standards</h4>
              <ul>
                <li>Data at rest: AES-256 encryption on all database volumes</li>
                <li>Data in transit: TLS 1.3 mandatory; TLS 1.2 minimum accepted</li>
                <li>API keys &amp; secrets stored in HashiCorp Vault / AWS KMS (Model A) or on-prem HSM (Model B)</li>
                <li>Database-level column encryption for Aadhaar-linked fields</li>
                <li>Backup encryption with separate key management</li>
              </ul>
            </div>
            <div className="sec-card">
              <h4><span>🏛️</span> Regulatory Compliance</h4>
              <ul>
                <li>DPDP Act 2023 — data fiduciary obligations met</li>
                <li>CERT-In guidelines for incident response (&lt;6 hour reporting)</li>
                <li>MeitY cloud empanelment criteria (for Model B)</li>
                <li>ISO 27001 alignment for security management processes</li>
                <li>Annual third-party security audit recommended</li>
              </ul>
            </div>
          </div>

          <h3 className="section-title">Scalability Architecture</h3>
          <p className="body">Both models are designed for horizontal scalability. The platform uses a microservices architecture with independent scaling of ingestion, AI processing, and reporting layers.</p>
          
          {/* Scalability SVG */}
          <svg viewBox="0 0 690 130" style={{ width: "100%", height: "auto", fontFamily: "Arial, sans-serif", margin: "8px 0" }}>
            <rect width="690" height="130" rx="6" fill="#f7fafd" stroke="#cdddf0" strokeWidth="1"/>
            
            {/* Layer 1: Ingestion */}
            <rect x="12" y="15" width="130" height="100" rx="6" fill="#1a56a0" opacity="0.9"/>
            <text x="77" y="40" textAnchor="middle" fill="white" fontSize="10" fontWeight="700">📥 Ingestion Layer</text>
            <text x="77" y="56" textAnchor="middle" fill="#a8c8e8" fontSize="8.5">Load Balancer</text>
            <text x="77" y="70" textAnchor="middle" fill="#a8c8e8" fontSize="8.5">API Gateway</text>
            <text x="77" y="84" textAnchor="middle" fill="#a8c8e8" fontSize="8.5">Rate Limiting</text>
            <text x="77" y="98" textAnchor="middle" fill="#d0e8ff" fontSize="8.5">Auto-scales: ✅</text>
            
            <path d="M142 65 L168 65" stroke="#1a56a0" strokeWidth="1.5" markerEnd="url(#arrowBlue)"/>
            
            {/* Layer 2: Queue */}
            <rect x="168" y="15" width="130" height="100" rx="6" fill="#0d2b6b" opacity="0.9"/>
            <text x="233" y="40" textAnchor="middle" fill="white" fontSize="10" fontWeight="700">📬 Job Queue</text>
            <text x="233" y="56" textAnchor="middle" fill="#a8c8e8" fontSize="8.5">Redis / RabbitMQ</text>
            <text x="233" y="70" textAnchor="middle" fill="#a8c8e8" fontSize="8.5">Bulk processing</text>
            <text x="233" y="84" textAnchor="middle" fill="#a8c8e8" fontSize="8.5">Priority queues</text>
            <text x="233" y="98" textAnchor="middle" fill="#d0e8ff" fontSize="8.5">Handles: 50K+/hr</text>
            
            <path d="M298 65 L324 65" stroke="#1a56a0" strokeWidth="1.5" markerEnd="url(#arrowBlue)"/>
            
            {/* Layer 3: AI Workers */}
            <rect x="324" y="15" width="140" height="100" rx="6" fill="#1a7a6a" opacity="0.9"/>
            <text x="394" y="40" textAnchor="middle" fill="white" fontSize="10" fontWeight="700">🤖 AI Worker Pool</text>
            <text x="394" y="56" textAnchor="middle" fill="#a8e8d8" fontSize="8.5">Model A: API workers</text>
            <text x="394" y="70" textAnchor="middle" fill="#a8e8d8" fontSize="8.5">Model B: GPU shards</text>
            <text x="394" y="84" textAnchor="middle" fill="#a8e8d8" fontSize="8.5">Horizontal: +N pods</text>
            <text x="394" y="98" textAnchor="middle" fill="#d0f8e8" fontSize="8.5">Throughput: elastic</text>
            
            <path d="M464 65 L490 65" stroke="#1a56a0" strokeWidth="1.5" markerEnd="url(#arrowBlue)"/>
            
            {/* Layer 4: Storage */}
            <rect x="490" y="15" width="130" height="100" rx="6" fill="#1a56a0" opacity="0.9"/>
            <text x="555" y="40" textAnchor="middle" fill="white" fontSize="10" fontWeight="700">🗄️ Storage</text>
            <text x="555" y="56" textAnchor="middle" fill="#a8c8e8" fontSize="8.5">PostgreSQL</text>
            <text x="555" y="70" textAnchor="middle" fill="#a8c8e8" fontSize="8.5">Read replicas</text>
            <text x="555" y="84" textAnchor="middle" fill="#a8c8e8" fontSize="8.5">S3 / MinIO reports</text>
            <text x="555" y="98" textAnchor="middle" fill="#d0e8ff" fontSize="8.5">Petabyte-ready</text>
            
            <path d="M620 65 L646 65" stroke="#1a56a0" strokeWidth="1.5" markerEnd="url(#arrowBlue)"/>
            <rect x="646" y="35" width="38" height="60" rx="5" fill="#0d2b6b"/>
            <text x="665" y="60" textAnchor="middle" fill="white" fontSize="8.5" fontWeight="700">🖥️</text>
            <text x="665" y="74" textAnchor="middle" fill="#a8c8e8" fontSize="7.5">Portal</text>
            <text x="665" y="86" textAnchor="middle" fill="#a8c8e8" fontSize="7.5">Govt</text>
          </svg>

          <h3 className="section-title">Model A vs Model B — Scalability Tradeoffs</h3>
          <div style={{ border: "1px solid #cdddf0", borderRadius: "6px", overflow: "hidden", fontSize: "11.5px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "140px 1fr 1fr" }}>
              <div style={{ background: "#0d2b6b", padding: "8px 10px", color: "white", fontWeight: 700, fontSize: "11px" }}>Parameter</div>
              <div style={{ background: "#7a5500", padding: "8px 10px", color: "white", fontWeight: 700, fontSize: "11px" }}>Model A — Cloud SaaS</div>
              <div style={{ background: "#1a5a1a", padding: "8px 10px", color: "white", fontWeight: 700, fontSize: "11px" }}>Model B — India Open Source</div>
            </div>
            {[
              ["Scale-out method", "Add API workers (minutes)", "Add GPU nodes (hours, pre-order)"],
              ["Cost at 10K children", "₹25K–₹1.2L/mo", "₹1.85L–₹2.5L/mo (incl. infra)"],
              ["Cost at 1M children", "₹25L–₹1.2Cr/mo", "₹2.2L–₹4L/mo (marginal only)"],
              ["Burst capacity", "Unlimited (pay-per-use)", "Limited by GPU inventory"],
              ["SLA / uptime", "99.9% (vendor SLA)", "Depends on NIC/Yotta SLA"],
              ["Vendor dependency", "HIGH — API pricing risk", "LOW — self-controlled"],
              ["Time to scale", "Minutes (auto-scale)", "Days–weeks (hardware)"],
              ["Break-even vs. Model A", "Always cheaper <200K/yr", "Cheaper after ~200K children/yr"],
            ].map(([param, a, b], i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "140px 1fr 1fr" }}>
                <div style={{ background: i%2===0?"#f4f8fd":"white", padding: "7px 10px", fontWeight: 600, color: "#0d2b6b", borderBottom: "1px solid #dde9f5" }}>{param}</div>
                <div style={{ background: i%2===0?"#fffdf5":"#fffef0", padding: "7px 10px", color: "#2a3a50", borderBottom: "1px solid #dde9f5", borderLeft: "1px solid #dde9f5" }}>{a}</div>
                <div style={{ background: i%2===0?"#f5fff5":"#f8fff8", padding: "7px 10px", color: "#2a3a50", borderBottom: "1px solid #dde9f5", borderLeft: "1px solid #dde9f5" }}>{b}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="page-footer">
          <span>AI-Powered Child Assessment Platform — Architecture &amp; Cost Proposal | Confidential</span>
          <span className="page-number">Page 3 of 4</span>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════ PAGE 4 */}
      <div className="page">
        <div className="page-content">
          <h3 className="section-title first">Comprehensive Cost Comparison</h3>
          <p className="body" style={{ marginBottom: "12px" }}>
            All costs in Indian Rupees (₹). Model A costs assume INR/USD rate of ₹83. LLM API costs benchmarked against GPT-4o ($0.0025/1K input tokens) and Claude 3.5 Sonnet ($0.003/1K tokens) as of Q1 2026. Model B assumes 4×A100 80GB GPU cluster on NIC empanelled cloud.
          </p>

          <table className="cost-table">
            <thead>
              <tr>
                <th style={{ width: "30%" }}>Cost Item</th>
                <th style={{ width: "35%" }}>
                  <span className="badge-model badge-a" style={{ marginRight: "6px" }}>MODEL A</span>
                  Cloud SaaS + Proprietary LLM
                </th>
                <th style={{ width: "35%" }}>
                  <span className="badge-model badge-b" style={{ marginRight: "6px" }}>MODEL B</span>
                  Open Source, India-Hosted
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="row-head">
                <td>💡 Cost per child (AI analysis)</td>
                <td><span className="bad">₹2.00–₹12.00</span><br/><span style={{fontSize:"9.5px",color:"#888"}}>Best: ₹0.25 (fully cached) | Worst: ₹12</span></td>
                <td><span className="good">₹0.04–₹0.18</span><br/><span style={{fontSize:"9.5px",color:"#888"}}>After fine-tuning; near-flat with scale</span></td>
              </tr>
              <tr className="row-head">
                <td>🖥️ Hosting cost (monthly)</td>
                <td><span className="neutral">₹80,000–₹2,50,000</span><br/><span style={{fontSize:"9.5px",color:"#888"}}>Scales with active users &amp; storage</span></td>
                <td><span className="neutral">₹1,80,000–₹2,80,000</span><br/><span style={{fontSize:"9.5px",color:"#888"}}>Fixed; includes GPU + app servers</span></td>
              </tr>
              <tr className="row-head">
                <td>🤖 LLM licensing / API cost</td>
                <td><span className="bad">₹3,00,000–₹15,00,000+/mo</span><br/><span style={{fontSize:"9.5px",color:"#888"}}>At 1M children; usage-based, volatile pricing</span></td>
                <td><span className="good">₹0 (open source, self-hosted)</span><br/><span style={{fontSize:"9.5px",color:"#888"}}>LLaMA 3 / Mistral — Apache 2.0 licence</span></td>
              </tr>
              <tr className="row-head">
                <td>⚙️ Fine-tuning cost (one-time)</td>
                <td><span className="neutral">₹0–₹3,00,000</span><br/><span style={{fontSize:"9.5px",color:"#888"}}>Prompt engineering + system prompt dev</span></td>
                <td><span className="neutral">₹8,00,000–₹20,00,000</span><br/><span style={{fontSize:"9.5px",color:"#888"}}>5K–20K labelled samples; 3–4 week GPU run</span></td>
              </tr>
              <tr className="row-head">
                <td>🔧 Infra setup cost (one-time)</td>
                <td><span className="good">₹1,50,000–₹4,00,000</span><br/><span style={{fontSize:"9.5px",color:"#888"}}>Cloud account, DevOps, IaC setup</span></td>
                <td><span className="bad">₹25,00,000–₹60,00,000</span><br/><span style={{fontSize:"9.5px",color:"#888"}}>Server procurement, NIC setup, networking</span></td>
              </tr>
              <tr className="row-head">
                <td>📊 Cost per 10K additional children</td>
                <td><span className="bad">+₹20,000–₹1,20,000/mo</span></td>
                <td><span className="good">+₹400–₹1,800/mo</span></td>
              </tr>
              <tr className="row-head">
                <td>📊 Cost per 100K additional children</td>
                <td><span className="bad">+₹2,00,000–₹12,00,000/mo</span></td>
                <td><span className="good">+₹4,000–₹18,000/mo</span></td>
              </tr>
              <tr className="row-head">
                <td>📊 Cost per 1M additional children</td>
                <td><span className="bad">+₹2,00,00,000–₹12,00,00,000/mo</span><br/><span style={{fontSize:"9.5px",color:"#888"}}>₹2 Cr – ₹12 Cr per month</span></td>
                <td><span className="good">+₹40,000–₹1,80,000/mo</span><br/><span style={{fontSize:"9.5px",color:"#888"}}>+GPU tier upgrade req'd; one-time ₹15L–₹25L</span></td>
              </tr>
              <tr className="row-head">
                <td>🔒 Data sovereignty compliance</td>
                <td><span className="bad">⚠️ Requires DPA + legal review</span><br/><span style={{fontSize:"9.5px",color:"#888"}}>Child PII may transfer outside India</span></td>
                <td><span className="good">✅ Fully DPDP Act 2023 compliant</span><br/><span style={{fontSize:"9.5px",color:"#888"}}>100% data within Indian jurisdiction</span></td>
              </tr>
              <tr className="row-head">
                <td>🔗 Vendor dependency risk</td>
                <td><span className="bad">HIGH — API pricing changes, terms risk</span><br/><span style={{fontSize:"9.5px",color:"#888"}}>OpenAI/Anthropic can change pricing 30-day notice</span></td>
                <td><span className="good">LOW — government owns the stack</span><br/><span style={{fontSize:"9.5px",color:"#888"}}>Open source; no proprietary dependency</span></td>
              </tr>
              <tr className="row-head" style={{ background: "#f0f8ff" }}>
                <td><strong>✅ Recommended for &gt;1M children?</strong></td>
                <td><span className="bad">❌ Not recommended at this scale</span><br/><span style={{fontSize:"9.5px",color:"#888"}}>Cost becomes fiscally unsustainable</span></td>
                <td><span className="good">✅ Strongly recommended</span><br/><span style={{fontSize:"9.5px",color:"#888"}}>Break-even at ~200K children/year</span></td>
              </tr>
            </tbody>
          </table>

          {/* Break-even visual */}
          <h3 className="section-title">Break-Even Analysis</h3>
          <svg viewBox="0 0 690 90" style={{ width: "100%", height: "auto", fontFamily: "Arial, sans-serif", marginBottom: "12px" }}>
            <rect width="690" height="90" rx="6" fill="#f7fafd" stroke="#cdddf0" strokeWidth="1"/>
            {/* Scale axis */}
            {[0,1,2,3,4,5,6].map((i) => (
              <g key={i}>
                <line x1={60 + i*95} y1={15} x2={60 + i*95} y2={65} stroke="#dde9f5" strokeWidth="1"/>
                <text x={60 + i*95} y={75} textAnchor="middle" fill="#6b8aaa" fontSize="8.5">{["10K","50K","100K","200K","500K","1M","2M"][i]}</text>
              </g>
            ))}
            <text x="350" y="84" textAnchor="middle" fill="#0d2b6b" fontSize="8.5" fontWeight="600">Number of Children (Annual)</text>
            
            {/* Model A line (steeply rising) */}
            <polyline points="60,58 155,52 250,44 345,34 440,18 535,8 630,4" fill="none" stroke="#c0392b" strokeWidth="2"/>
            <text x="500" y="15" fill="#c0392b" fontSize="8.5" fontWeight="700">Model A (rising cost)</text>
            
            {/* Model B line (flat after setup) */}
            <polyline points="60,25 155,30 250,35 345,38 440,40 535,41 630,42" fill="none" stroke="#2a8a2a" strokeWidth="2"/>
            <text x="440" y="48" fill="#2a8a2a" fontSize="8.5" fontWeight="700">Model B (near-flat at scale)</text>
            
            {/* Break-even marker */}
            <line x1="345" y1="10" x2="345" y2="65" stroke="#1a56a0" strokeWidth="1.5" strokeDasharray="4 3"/>
            <text x="345" y="12" textAnchor="middle" fill="#1a56a0" fontSize="8" fontWeight="700">Break-even ≈ 200K</text>
            <circle cx="345" cy="36" r="4" fill="#1a56a0"/>
            
            <text x="66" y="22" fill="#6b8aaa" fontSize="8">Monthly cost →</text>
          </svg>

          <div className="recommend-banner">
            <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{flexShrink:0}}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <div>
              <strong>Recommendation: Model B for Government-Scale Deployment</strong>
              <p style={{ margin: "4px 0 0 0", fontSize: "11.5px", color: "#c8ddf0", lineHeight: "1.5" }}>
                For any deployment targeting &gt;200,000 children annually, Model B delivers 80–92% lower AI operating costs, full DPDP Act 2023 compliance, zero vendor lock-in, and long-term IP ownership for the Government of India. Suggested phasing: Model A for 0–6 months (rapid pilot), transition to Model B post fine-tuning for national rollout.
              </p>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "16px", gap: "14px" }}>
            <div style={{ flex: 1, border: "1px solid #cdddf0", borderRadius: "6px", padding: "12px 14px", background: "#f7fafd" }}>
              <div style={{ fontSize: "11.5px", fontWeight: 700, color: "#0d2b6b", marginBottom: "6px" }}>📅 Suggested Phasing</div>
              <div style={{ fontSize: "11px", color: "#2a3a50", lineHeight: "1.6" }}>
                <strong>Phase 1 (Month 0–6):</strong> Model A — Pilot with 10K–50K children, validate reports and coach workflows<br/>
                <strong>Phase 2 (Month 4–9):</strong> Fine-tune open source LLM in parallel on pilot data<br/>
                <strong>Phase 3 (Month 9+):</strong> Migrate to Model B on NIC/Yotta infra for national rollout
              </div>
            </div>
            <div style={{ flex: 1, border: "1px solid #cdddf0", borderRadius: "6px", padding: "12px 14px", background: "#f7fafd" }}>
              <div style={{ fontSize: "11.5px", fontWeight: 700, color: "#0d2b6b", marginBottom: "6px" }}>📞 Next Steps</div>
              <div style={{ fontSize: "11px", color: "#2a3a50", lineHeight: "1.6" }}>
                1. Confirm target state/district for Phase 1 pilot<br/>
                2. Finalise data schema and assessment protocol<br/>
                3. NIC / MeitY empanelled cloud procurement initiation<br/>
                4. Legal review of DPDP Act obligations for Phase 1<br/>
                5. Technical discovery call with engineering team
              </div>
            </div>
          </div>
        </div>
        <div className="page-footer">
          <span>AI-Powered Child Assessment Platform — Architecture &amp; Cost Proposal | Confidential</span>
          <span className="page-number">Page 4 of 4</span>
        </div>
      </div>
    </div>
  );
}
