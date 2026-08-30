# Graph Report - ai-tax-agent  (2026-08-30)

## Corpus Check
- 133 files · ~140,140 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 696 nodes · 1092 edges · 46 communities (34 shown, 12 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 17 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8b9f7ba1`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- App.jsx
- parserWorker.js
- compress.py
- Graphify Knowledge Graph Pipeline
- Claude AI & Semantics Service
- 📘 Buku Panduan Praktis Staff Tax Analyst: Dari Raw GL hingga KKP & Partner Review
- 🏛️ AI Tax Agent & KKP Partner Platform
- Linter & Code Quality Rules
- dependencies
- kkpWorkbookGenerator.js
- claudeService.js
- 📝 Panduan Alur Input Data Staff Tax Analyst (SOP Step-by-Step)
- Caveman Agent Tools & Skills
- AdminDashboard
- Caveman Discover Skill
- SP2DKResponseTab.jsx
- Changelog — GL Cleaner
- Surgical Patch Skill
- NumberedCanvas
- Caveman Learn Skill
- Development Log - GL Cleaner
- Investigate First Skill
- caveman-explore/tests/skill-file.test.mjs
- Application HTML Entry Point
- Graphify Knowledge Graph Rule
- Migration Skill
- caveman-learn/tests/skill-file.test.mjs
- Net Savings & Rule Overhead Accounting
- __init__.py
- graphify.md
- merger-faktur_0c974ac1.md
- Verify and Stop Agent Config
- Social and Navigation SVG Icon Sprite
- Application Secondary Logo Mark PNG
- setupTests.js
- aiUsageService.js
- caveman-explore/package.json
- .oxlintrc.json
- claude.js
- vercel.json
- Langkah Implementasi
- Langkah Implementasi

## God Nodes (most connected - your core abstractions)
1. `react` - 22 edges
2. `Graphify Knowledge Graph Pipeline` - 22 edges
3. `App()` - 21 edges
4. `compress_file()` - 16 edges
5. `cleanBalance()` - 15 edges
6. `validate()` - 14 edges
7. `📘 Buku Panduan Praktis Staff Tax Analyst: Dari Raw GL hingga KKP & Partner Review` - 14 edges
8. `📝 Panduan Alur Input Data Staff Tax Analyst (SOP Step-by-Step)` - 13 edges
9. `AdminDashboard()` - 12 edges
10. `generateKKPWorkbook()` - 12 edges

## Surprising Connections (you probably didn't know these)
- `Application HTML Entry Point` --references--> `GL Cleaner Favicon PNG`  [EXTRACTED]
  index.html → public/favicon.png
- `Cavecrew Reviewer Subagent` --semantically_similar_to--> `Caveman Review Skill`  [INFERRED] [semantically similar]
  .agents/skills/cavecrew/SKILL.md → .agents/skills/caveman-review/SKILL.md
- `GL Cleaner Vector Favicon SVG` --semantically_similar_to--> `GL Cleaner Favicon PNG`  [INFERRED] [semantically similar]
  public/favicon.svg → public/favicon.png
- `Server-Authoritative Execution Gate` --semantically_similar_to--> `Operator Approval Protocol`  [INFERRED] [semantically similar]
  .agents/skills/caveman-manage/SKILL.md → .agents/skills/caveman-discover/SKILL.md
- `Lean Build Skill` --semantically_similar_to--> `Surgical Patch Skill`  [INFERRED] [semantically similar]
  .agents/skills/lean-build/SKILL.md → .agents/skills/surgical-patch/SKILL.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Cavecrew Subagent Trio** — _agents_skills_cavecrew_skill_subagent_investigator, _agents_skills_cavecrew_skill_subagent_builder, _agents_skills_cavecrew_skill_subagent_reviewer [EXTRACTED 1.00]
- **Graphify Core Execution and Query Lifecycle** — _agents_skills_graphify_skill_graphify_pipeline, _agents_skills_graphify_references_query_query_traversal, _agents_skills_graphify_references_update_incremental_update, _agents_skills_graphify_references_exports_mcp_server [EXTRACTED 1.00]
- **Agent Token Optimization and Efficiency Mechanisms** — _agents_skills_caveman_skill_caveman_mode, _agents_skills_caveman_stats_skill_caveman_stats, _agents_skills_graphify_references_exports_token_benchmark [INFERRED 0.75]
- **Agent Development & Modification Disciplines** — _agents_skills_investigate_first_skill_investigate_first, _agents_skills_surgical_patch_skill_surgical_patch, _agents_skills_safe_refactor_skill_safe_refactor, _agents_skills_lean_build_skill_lean_build, _agents_skills_verify_and_stop_skill_verify_and_stop [INFERRED 0.85]
- **Caveman Auto-Clarity Safeguards** — _agents_skills_cavecrew_skill_auto_clarity, _agents_skills_caveman_commit_skill_auto_clarity, _agents_skills_caveman_review_skill_auto_clarity [INFERRED 0.85]
- **Caveman Cloud Lifecycle Pipeline** — _agents_skills_caveman_setup_skill_setup, _agents_skills_caveman_discover_skill_discover, _agents_skills_caveman_evidence_review_skill_evidence_review, _agents_skills_caveman_manage_skill_manage [INFERRED 0.85]

## Communities (46 total, 12 thin omitted)

### Community 0 - "App.jsx"
Cohesion: 0.07
Nodes (42): react, ACCURATE_COLUMNS, App(), DEFAULT_CLIENT_INFO, getInitialTheme(), KRISHAND_COLUMNS, MYOB_COLUMNS, AccountRail() (+34 more)

### Community 1 - "parserWorker.js"
Cohesion: 0.11
Nodes (25): parseAccurateExcelRows(), parseAccurateXMLSS(), commonSuffixLength(), isBoilerplate(), parseAccuratePdfJournalText(), NOTE: this is a running balance accumulated only across rows seen in this…, ACCOUNT_TYPES, isBoilerplate() (+17 more)

### Community 2 - "compress.py"
Cohesion: 0.10
Nodes (37): main(), print_usage(), backup_dir_for(), build_compress_prompt(), build_fix_prompt(), call_claude(), compress_file(), first_nonblank_line() (+29 more)

### Community 3 - "Graphify Knowledge Graph Pipeline"
Cohesion: 0.05
Nodes (39): Caveman Auto-Clarity Fallback, Caveman Overview README, Caveman Intensity Levels, Caveman Auto-Clarity Safety Policy, Caveman Communication Mode, Caveman Compression Rules, Caveman Intensity Specifications, Caveman Stats Skill (+31 more)

### Community 4 - "Claude AI & Semantics Service"
Cohesion: 0.11
Nodes (28): benchmark_pair(), count_tokens(), main(), print_table(), Path, count_bullets(), extract_code_blocks(), extract_fenced_spans() (+20 more)

### Community 5 - "📘 Buku Panduan Praktis Staff Tax Analyst: Dari Raw GL hingga KKP & Partner Review"
Cohesion: 0.06
Nodes (30): Bagaimana AI Membantu Anda?, 📘 Buku Panduan Praktis Staff Tax Analyst: Dari Raw GL hingga KKP & Partner Review, ⚡ Cara Kerja Sistem Tanpa AI (Mode Offline / Deterministik Murni), Cara Menjalankan AI:, 📑 Daftar Modul & Panduan Praktis, Kasus 1: Klien Membayar Jasa Konsultan Hukum Notaris tapi Masuk ke "Biaya Lain-Lain", Kasus 2: Biaya Makan Malam Klien Tanpa Daftar Nominatif, Kasus 3: Omzet GL Lebih Kecil dari DPP PPN karena Ada Uang Muka Penjualan (+22 more)

### Community 6 - "🏛️ AI Tax Agent & KKP Partner Platform"
Cohesion: 0.07
Nodes (28): 10. 💾 Project Save & Load State (.aitax Portable Archive), 11. 🔐 Akses Terpadu & Konfigurasi Pengguna, 1. 🧹 Ingesti & Pembersihan Buku Besar Multi-Format (GL Cleaner), 1. Prasyarat Sistem, 2. Instalasi Proyek, 2. 🏢 Smart Client & Tax Year Auto-Detector, 3. 🏷️ Matriks Pemetaan Pajak (Tax Mapping), 3. Menjalankan Server Pengembangan (Local Dev) (+20 more)

### Community 7 - "Linter & Code Quality Rules"
Cohesion: 0.08
Nodes (27): Cavecrew Overview, Cavecrew Model Overrides, Cavecrew Auto-Clarity Guard, Cavecrew Skill, Cavecrew Chaining Patterns, Cavecrew Builder Subagent, Cavecrew Investigator Subagent, Cavecrew Reviewer Subagent (+19 more)

### Community 8 - "dependencies"
Cohesion: 0.04
Nodes (48): jsdom, jsonrepair, lucide-react, oxlint, dependencies, jsonrepair, lucide-react, pdfjs-dist (+40 more)

### Community 9 - "kkpWorkbookGenerator.js"
Cohesion: 0.12
Nodes (24): KEYWORD_PRESETS, KeywordScannerTab(), extractTaxBadge(), TaxReconWorkbench(), TaxRiskRegister(), REGULATION_DATABASE, ALIGN, BORDERS (+16 more)

### Community 10 - "claudeService.js"
Cohesion: 0.11
Nodes (38): AISettingsModal(), PRESET_MODELS, ACCOUNT_CLASSIFICATION_TOOL, aiClassifyAccounts(), analyzeHonorariumClassification(), analyzeTaxFindings(), callClaudeProxy(), callClaudeTaxAnalysis() (+30 more)

### Community 11 - "📝 Panduan Alur Input Data Staff Tax Analyst (SOP Step-by-Step)"
Cohesion: 0.09
Nodes (22): A. Ekualisasi Omzet vs PPN (Tab 1: `Ekualisasi Omzet vs PPN`), A. Menjalankan Analisis AI Claude (Opsional / Jika Ada API Key), B. Ekualisasi Biaya vs PPh 23 (Tab 2: `Ekualisasi Biaya vs PPh 23`), B. Mengubah Status Telaah Reviewer, 🎯 Checklist & Tips Menghindari Kesalahan Input (Do's & Don'ts), 📑 Daftar Isi, 📌 Gambaran Umum Alur Input, Langkah-langkah Input: (+14 more)

### Community 12 - "Caveman Agent Tools & Skills"
Cohesion: 0.18
Nodes (10): description, files, SKILL.md, license, name, private, scripts, test (+2 more)

### Community 13 - "AdminDashboard"
Cohesion: 0.47
Nodes (8): AdminDashboard(), closeEditModal(), fetchUsers(), getAuthHeader(), handleAddUser(), handleDeleteUser(), handleToggleActive(), handleUpdateUser()

### Community 14 - "Caveman Discover Skill"
Cohesion: 0.13
Nodes (15): Caveman Discover Skill, Operator Approval Protocol, Workflow Labeling Convention, Evidence Accounting Buckets, Caveman Evidence Review Skill, Trace Inspection Protocol, Server-Authoritative Execution Gate, Experiment Lifecycle Actions (+7 more)

### Community 15 - "SP2DKResponseTab.jsx"
Cohesion: 0.28
Nodes (10): SP2DKResponseTab(), calculateSP2DKDeadline(), CAUSE_CATEGORIES, downloadSP2DKWordDocument(), generateFallbackSP2DKResponse(), parseSP2DKText(), SP2DK_DEMO_PRESETS, fmtRupiah() (+2 more)

### Community 16 - "Changelog — GL Cleaner"
Cohesion: 0.09
Nodes (21): [1.0.0] — 2026 (Rilis Awal), [1.1.0] — 2026 (Pengembangan Awal), [1.2.0] — 2026-07-15, [2.0.0] — 2026-08-22, [2.1.0] — 2026-08-23 (Phase 2: SP2DK & Tax Audit Response Agent), [2.2.0] — 2026-08-23 (Smart Client Auto-Detector & Styled KKP Excel Engine), Added, Added (+13 more)

### Community 17 - "Surgical Patch Skill"
Cohesion: 0.22
Nodes (9): Lean Build OpenAI Interface, Lean Build Skill, Lean Build Minimal Architectural Slice, Safe Refactor OpenAI Interface, Safe Refactor Behavior Preservation Boundary, Safe Refactor Skill, Surgical Patch OpenAI Interface, Surgical Patch Narrow Responsible Layer Fix (+1 more)

### Community 19 - "Caveman Learn Skill"
Cohesion: 0.29
Nodes (7): Caveman Learn Architecture & Binding, Caveman Learn Overview, Cavemem Offload Mechanism, Caveman Learn Skill, Never Make Agent Dumber Guard, Evidence Strength Rungs, Token Sink Classes

### Community 20 - "Development Log - GL Cleaner"
Cohesion: 0.29
Nodes (6): 1. Peningkatan Performa: Ekspor Excel Tanpa Lag (Web Worker), 2. Peningkatan UI/UX: "The Command Center" Header & Glassmorphism, 3. Sistem Deteksi Format Pintar (Smart Auto-Detect), 4. Arsitektur Parser Scalable (Pola Router), 5. Refactoring & Pembersihan Kode (Ponytail Audit), Development Log - GL Cleaner

### Community 21 - "Investigate First Skill"
Cohesion: 0.40
Nodes (5): Investigate First OpenAI Interface, Investigate First Evidence-Ranked Hypotheses, Investigate First Skill, Verify and Stop Acceptance Proof, Verify and Stop Skill

### Community 23 - "Application HTML Entry Point"
Cohesion: 0.50
Nodes (4): Application HTML Entry Point, Anti-FOUC Theme Script, GL Cleaner Favicon PNG, GL Cleaner Vector Favicon SVG

### Community 24 - "Graphify Knowledge Graph Rule"
Cohesion: 0.67
Nodes (3): Graphify CLI Commands, Graphify MCP Tools, Graphify Knowledge Graph Rule

### Community 25 - "Migration Skill"
Cohesion: 0.67
Nodes (3): Migration OpenAI Interface, Migration Skill, Reversible Compatibility-Safe Transitions

### Community 37 - "aiUsageService.js"
Cohesion: 0.14
Nodes (26): AIUsageMonitoringTab(), loadData(), MONTH_NAMES, LoginPage(), UserProfileModal(), AuthContext, AuthProvider(), fetchProfile() (+18 more)

### Community 38 - "caveman-explore/package.json"
Cohesion: 0.18
Nodes (10): description, files, SKILL.md, license, name, private, scripts, test (+2 more)

### Community 39 - ".oxlintrc.json"
Cohesion: 0.25
Nodes (7): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema, oxc, warn

### Community 41 - "claude.js"
Cohesion: 0.47
Nodes (5): calculateCost(), checkRateLimit(), handler(), PRICING_RATES, rateLimitMap

### Community 44 - "Langkah Implementasi"
Cohesion: 0.12
Nodes (15): 1. Buat proxy pakai Supabase Edge Function, 2. Sertakan identitas user di setiap request, 3. Log setiap pemanggilan AI ke tabel Supabase, 4. Hitung estimasi cost per panggilan, 5. Bangun dashboard monitoring, 6. Quota & alert (opsional, untuk kontrol cost lebih ketat), Bagian 1: Ekualisasi PPh 21 + Model Routing, Bagian 2: Monitoring Penggunaan AI per User (+7 more)

### Community 45 - "Langkah Implementasi"
Cohesion: 0.12
Nodes (15): 1. Buat proxy pakai Supabase Edge Function, 2. Sertakan identitas user di setiap request, 3. Log setiap pemanggilan AI ke tabel Supabase, 4. Hitung estimasi cost per panggilan, 5. Bangun dashboard monitoring, 6. Quota & alert (opsional, untuk kontrol cost lebih ketat), Bagian 1: Ekualisasi PPh 21 + Model Routing, Bagian 2: Monitoring Penggunaan AI per User (+7 more)

## Knowledge Gaps
- **244 isolated node(s):** `name`, `version`, `license`, `private`, `type` (+239 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `App.jsx` to `aiUsageService.js`, `.oxlintrc.json`, `kkpWorkbookGenerator.js`, `claudeService.js`, `SP2DKResponseTab.jsx`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Why does `AdminDashboard()` connect `AdminDashboard` to `App.jsx`, `aiUsageService.js`?**
  _High betweenness centrality (0.007) - this node is a cross-community bridge._
- **Why does `plugins` connect `.oxlintrc.json` to `App.jsx`?**
  _High betweenness centrality (0.006) - this node is a cross-community bridge._
- **What connects `name`, `version`, `license` to the rest of the system?**
  _244 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06875 - nodes in this community are weakly interconnected._
- **Should `parserWorker.js` be split into smaller, more focused modules?**
  _Cohesion score 0.11382113821138211 - nodes in this community are weakly interconnected._
- **Should `compress.py` be split into smaller, more focused modules?**
  _Cohesion score 0.0951219512195122 - nodes in this community are weakly interconnected._