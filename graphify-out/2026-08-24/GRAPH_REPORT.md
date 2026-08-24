# Graph Report - ai-tax-agent  (2026-08-24)

## Corpus Check
- 108 files · ~93,480 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 539 nodes · 761 edges · 41 communities (30 shown, 11 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 14 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- App State & Core Routing
- Caveman CLI & Compression Engine
- Caveman Prompt & Rules Engine
- Accurate Accounting Parsers
- Compression Token Benchmarks
- Tax Modals & SP2DK Tab
- Partner Dashboard & Tax Calculations
- Cavecrew Subagent Framework
- UI & PDF Dependencies
- Linting & Testing Tooling
- Caveman Observability & Traces
- Agent Skill Configurations
- Skill Metadata & Package Specs
- AI Tax Architecture & KKP Blueprint
- Lean Build & Safe Refactor Skills
- Tax Analyst Guides & Reconciliation
- Oxlint Code Quality Rules
- Caveman Memory & Learning
- Changelog & Architectural History
- Investigation & Verification Skills
- Client Company Auto-Detection
- Skill File Markdown Tests
- HTML Entry & Theme Assets
- Graphify Knowledge Graph Rules
- Code Migration Protocols
- Skill Runner Entrypoint
- Tax Risk & Anomaly Guides
- Brand Logos & Graphics
- Caveman Cost & Token Stats
- Caveman Python Package Init
- Agent Workflow Automations
- UI Glassmorphism & Worker Rationale
- AI Tax Agent Phased Roadmap
- Navigation Icon Sprite
- Landing Page Hero Graphic
- React Framework Vector Icon
- Vite Bundler Vector Icon

## God Nodes (most connected - your core abstractions)
1. `Graphify Knowledge Graph Pipeline` - 22 edges
2. `compress_file()` - 16 edges
3. `react` - 16 edges
4. `validate()` - 14 edges
5. `cleanBalance()` - 14 edges
6. `📘 Buku Panduan Praktis Staff Tax Analyst: Dari Raw GL hingga KKP & Partner Review` - 14 edges
7. `📝 Panduan Alur Input Data Staff Tax Analyst (SOP Step-by-Step)` - 13 edges
8. `generateKKPWorkbook()` - 12 edges
9. `detect_file_type()` - 9 edges
10. `App()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `Application HTML Entry Point` --references--> `GL Cleaner Favicon PNG`  [EXTRACTED]
  index.html → public/favicon.png
- `Cavecrew Reviewer Subagent` --semantically_similar_to--> `Caveman Review Skill`  [INFERRED] [semantically similar]
  .agents/skills/cavecrew/SKILL.md → .agents/skills/caveman-review/SKILL.md
- `Server-Authoritative Execution Gate` --semantically_similar_to--> `Operator Approval Protocol`  [INFERRED] [semantically similar]
  .agents/skills/caveman-manage/SKILL.md → .agents/skills/caveman-discover/SKILL.md
- `Lean Build Skill` --semantically_similar_to--> `Surgical Patch Skill`  [INFERRED] [semantically similar]
  .agents/skills/lean-build/SKILL.md → .agents/skills/surgical-patch/SKILL.md
- `Surgical Patch Skill` --semantically_similar_to--> `Safe Refactor Skill`  [INFERRED] [semantically similar]
  .agents/skills/surgical-patch/SKILL.md → .agents/skills/safe-refactor/SKILL.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Cavecrew Subagent Trio** — _agents_skills_cavecrew_skill_subagent_investigator, _agents_skills_cavecrew_skill_subagent_builder, _agents_skills_cavecrew_skill_subagent_reviewer [EXTRACTED 1.00]
- **Graphify Core Execution and Query Lifecycle** — _agents_skills_graphify_skill_graphify_pipeline, _agents_skills_graphify_references_query_query_traversal, _agents_skills_graphify_references_update_incremental_update, _agents_skills_graphify_references_exports_mcp_server [EXTRACTED 1.00]
- **Agent Token Optimization and Efficiency Mechanisms** — _agents_skills_caveman_skill_caveman_mode, _agents_skills_caveman_stats_skill_caveman_stats, _agents_skills_graphify_references_exports_token_benchmark [INFERRED 0.75]
- **Agent Development & Modification Disciplines** — _agents_skills_investigate_first_skill_investigate_first, _agents_skills_surgical_patch_skill_surgical_patch, _agents_skills_safe_refactor_skill_safe_refactor, _agents_skills_lean_build_skill_lean_build, _agents_skills_verify_and_stop_skill_verify_and_stop [INFERRED 0.85]
- **Caveman Auto-Clarity Safeguards** — _agents_skills_cavecrew_skill_auto_clarity, _agents_skills_caveman_commit_skill_auto_clarity, _agents_skills_caveman_review_skill_auto_clarity [INFERRED 0.85]
- **Caveman Cloud Lifecycle Pipeline** — _agents_skills_caveman_setup_skill_setup, _agents_skills_caveman_discover_skill_discover, _agents_skills_caveman_evidence_review_skill_evidence_review, _agents_skills_caveman_manage_skill_manage [INFERRED 0.85]

## Communities (41 total, 11 thin omitted)

### Community 0 - "App State & Core Routing"
Cohesion: 0.10
Nodes (21): react, ACCURATE_COLUMNS, App(), getInitialTheme(), KRISHAND_COLUMNS, MYOB_COLUMNS, AccountRail(), DataTable() (+13 more)

### Community 1 - "Caveman CLI & Compression Engine"
Cohesion: 0.10
Nodes (37): main(), print_usage(), backup_dir_for(), build_compress_prompt(), build_fix_prompt(), call_claude(), compress_file(), first_nonblank_line() (+29 more)

### Community 2 - "Caveman Prompt & Rules Engine"
Cohesion: 0.05
Nodes (39): Caveman Auto-Clarity Fallback, Caveman Overview README, Caveman Intensity Levels, Caveman Auto-Clarity Safety Policy, Caveman Communication Mode, Caveman Compression Rules, Caveman Intensity Specifications, Caveman Stats Skill (+31 more)

### Community 3 - "Accurate Accounting Parsers"
Cohesion: 0.11
Nodes (26): parseAccurateExcelRows(), parseAccurateXMLSS(), commonSuffixLength(), isBoilerplate(), parseAccuratePdfJournalText(), NOTE: this is a running balance accumulated only across rows seen in this…, ACCOUNT_TYPES, isBoilerplate() (+18 more)

### Community 4 - "Compression Token Benchmarks"
Cohesion: 0.11
Nodes (28): benchmark_pair(), count_tokens(), main(), print_table(), Path, count_bullets(), extract_code_blocks(), extract_fenced_spans() (+20 more)

### Community 5 - "Tax Modals & SP2DK Tab"
Cohesion: 0.14
Nodes (27): AISettingsModal(), formatRupiah(), SP2DKResponseTab(), analyzeTaxFindings(), callClaudeTaxAnalysis(), extractAndParseClaudeJson(), extractObjectsFromIncompleteJson(), FALLBACK_MODELS (+19 more)

### Community 6 - "Partner Dashboard & Tax Calculations"
Cohesion: 0.13
Nodes (23): PartnerDashboard(), REGULATION_DATABASE, calculateInterestSanction(), calculatePartnerDashboardMetrics(), calculatePPh23Exposure(), reconcileExpenseVsPPh23(), reconcileRevenueVsPPN(), TAX_RATES (+15 more)

### Community 7 - "Cavecrew Subagent Framework"
Cohesion: 0.08
Nodes (27): Cavecrew Overview, Cavecrew Model Overrides, Cavecrew Auto-Clarity Guard, Cavecrew Skill, Cavecrew Chaining Patterns, Cavecrew Builder Subagent, Cavecrew Investigator Subagent, Cavecrew Reviewer Subagent (+19 more)

### Community 8 - "UI & PDF Dependencies"
Cohesion: 0.08
Nodes (25): lucide-react, dependencies, lucide-react, pdfjs-dist, react, react-dom, @tanstack/react-virtual, xlsx-js-style (+17 more)

### Community 9 - "Linting & Testing Tooling"
Cohesion: 0.11
Nodes (19): jsdom, oxlint, devDependencies, jsdom, oxlint, @testing-library/jest-dom, @testing-library/react, @types/react (+11 more)

### Community 10 - "Caveman Observability & Traces"
Cohesion: 0.13
Nodes (15): Caveman Discover Skill, Operator Approval Protocol, Workflow Labeling Convention, Evidence Accounting Buckets, Caveman Evidence Review Skill, Trace Inspection Protocol, Server-Authoritative Execution Gate, Experiment Lifecycle Actions (+7 more)

### Community 11 - "Agent Skill Configurations"
Cohesion: 0.18
Nodes (10): description, files, SKILL.md, license, name, private, scripts, test (+2 more)

### Community 12 - "Skill Metadata & Package Specs"
Cohesion: 0.18
Nodes (10): description, files, SKILL.md, license, name, private, scripts, test (+2 more)

### Community 13 - "AI Tax Architecture & KKP Blueprint"
Cohesion: 0.06
Nodes (30): Bagaimana AI Membantu Anda?, 📘 Buku Panduan Praktis Staff Tax Analyst: Dari Raw GL hingga KKP & Partner Review, ⚡ Cara Kerja Sistem Tanpa AI (Mode Offline / Deterministik Murni), Cara Menjalankan AI:, 📑 Daftar Modul & Panduan Praktis, Kasus 1: Klien Membayar Jasa Konsultan Hukum Notaris tapi Masuk ke "Biaya Lain-Lain", Kasus 2: Biaya Makan Malam Klien Tanpa Daftar Nominatif, Kasus 3: Omzet GL Lebih Kecil dari DPP PPN karena Ada Uang Muka Penjualan (+22 more)

### Community 14 - "Lean Build & Safe Refactor Skills"
Cohesion: 0.22
Nodes (9): Lean Build OpenAI Interface, Lean Build Skill, Lean Build Minimal Architectural Slice, Safe Refactor OpenAI Interface, Safe Refactor Behavior Preservation Boundary, Safe Refactor Skill, Surgical Patch OpenAI Interface, Surgical Patch Narrow Responsible Layer Fix (+1 more)

### Community 15 - "Tax Analyst Guides & Reconciliation"
Cohesion: 0.09
Nodes (22): A. Ekualisasi Omzet vs PPN (Tab 1: `Ekualisasi Omzet vs PPN`), A. Menjalankan Analisis AI Claude (Opsional / Jika Ada API Key), B. Ekualisasi Biaya vs PPh 23 (Tab 2: `Ekualisasi Biaya vs PPh 23`), B. Mengubah Status Telaah Reviewer, 🎯 Checklist & Tips Menghindari Kesalahan Input (Do's & Don'ts), 📑 Daftar Isi, 📌 Gambaran Umum Alur Input, Langkah-langkah Input: (+14 more)

### Community 16 - "Oxlint Code Quality Rules"
Cohesion: 0.25
Nodes (7): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema, oxc, warn

### Community 17 - "Caveman Memory & Learning"
Cohesion: 0.29
Nodes (7): Caveman Learn Architecture & Binding, Caveman Learn Overview, Cavemem Offload Mechanism, Caveman Learn Skill, Never Make Agent Dumber Guard, Evidence Strength Rungs, Token Sink Classes

### Community 18 - "Changelog & Architectural History"
Cohesion: 0.09
Nodes (22): 📑 1. Input & Parsing Buku Besar (GL), 1. Prasyarat Sistem, 2. Instalasi Dependensi, 🏷️ 2. Matriks Pemetaan Pajak (Tax Mapping), 🧾 3. Import & Matching Faktur Pajak, 3. Menjalankan Server Pengembangan (Local Development), 🔍 4. Global Keyword Scanner & Anomaly Detector, 4. Membangun untuk Produksi (Production Build) (+14 more)

### Community 19 - "Investigation & Verification Skills"
Cohesion: 0.40
Nodes (5): Investigate First OpenAI Interface, Investigate First Evidence-Ranked Hypotheses, Investigate First Skill, Verify and Stop Acceptance Proof, Verify and Stop Skill

### Community 20 - "Client Company Auto-Detection"
Cohesion: 0.09
Nodes (21): [1.0.0] — 2026 (Rilis Awal), [1.1.0] — 2026 (Pengembangan Awal), [1.2.0] — 2026-07-15, [2.0.0] — 2026-08-22, [2.1.0] — 2026-08-23 (Phase 2: SP2DK & Tax Audit Response Agent), [2.2.0] — 2026-08-23 (Smart Client Auto-Detector & Styled KKP Excel Engine), Added, Added (+13 more)

### Community 22 - "HTML Entry & Theme Assets"
Cohesion: 0.50
Nodes (4): Application HTML Entry Point, Anti-FOUC Theme Script, GL Cleaner Favicon PNG, GL Cleaner Vector Favicon SVG

### Community 23 - "Graphify Knowledge Graph Rules"
Cohesion: 0.67
Nodes (3): Graphify CLI Commands, Graphify MCP Tools, Graphify Knowledge Graph Rule

### Community 24 - "Code Migration Protocols"
Cohesion: 0.67
Nodes (3): Migration OpenAI Interface, Migration Skill, Reversible Compatibility-Safe Transitions

### Community 26 - "Tax Risk & Anomaly Guides"
Cohesion: 0.29
Nodes (6): 1. Peningkatan Performa: Ekspor Excel Tanpa Lag (Web Worker), 2. Peningkatan UI/UX: "The Command Center" Header & Glassmorphism, 3. Sistem Deteksi Format Pintar (Smart Auto-Detect), 4. Arsitektur Parser Scalable (Pola Router), 5. Refactoring & Pembersihan Kode (Ponytail Audit), Development Log - GL Cleaner

### Community 27 - "Brand Logos & Graphics"
Cohesion: 0.67
Nodes (3): Application Secondary Brand Logo PNG, Application Secondary Logo Mark PNG, Application Brand Logo PNG

## Knowledge Gaps
- **205 isolated node(s):** `name`, `version`, `license`, `private`, `type` (+200 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `App State & Core Routing` to `Oxlint Code Quality Rules`, `Tax Modals & SP2DK Tab`, `Partner Dashboard & Tax Calculations`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **Why does `plugins` connect `Oxlint Code Quality Rules` to `App State & Core Routing`?**
  _High betweenness centrality (0.005) - this node is a cross-community bridge._
- **Why does `validate()` connect `Compression Token Benchmarks` to `Caveman CLI & Compression Engine`?**
  _High betweenness centrality (0.005) - this node is a cross-community bridge._
- **What connects `name`, `version`, `license` to the rest of the system?**
  _205 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App State & Core Routing` be split into smaller, more focused modules?**
  _Cohesion score 0.09957325746799431 - nodes in this community are weakly interconnected._
- **Should `Caveman CLI & Compression Engine` be split into smaller, more focused modules?**
  _Cohesion score 0.0951219512195122 - nodes in this community are weakly interconnected._
- **Should `Caveman Prompt & Rules Engine` be split into smaller, more focused modules?**
  _Cohesion score 0.05128205128205128 - nodes in this community are weakly interconnected._