# Graph Report - ai-tax-agent  (2026-10-25)

## Corpus Check
- 174 files · ~142,274 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: .css 2, .example 1, (none) 1)

## Summary
- 767 nodes · 1756 edges · 48 communities (37 shown, 11 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 35 edges (avg confidence: 0.9)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f58dca7a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- UI Components & Radix Primitives
- Accurate & MYOB Excel Parsers
- App.jsx
- AI Tax Services & Analysis
- main.jsx
- Caveman Compression Scripts
- Caveman Content Validation
- Vercel Serverless API Endpoints
- Cavecrew Delegation Subagents
- Tax Reconciliation & Keyword Scanner
- Caveman CLI & File Backups
- Frontend Runtime Dependencies
- package.json
- Caveman Observability & Workflows
- SOP PDF Generator
- KKP Documentation & Tax Guides
- Frontend Dev & Testing Tooling
- Playwright CI & SDD Workflows
- Caveman Test Suites
- AI Schema Mapping & Guardrails
- Caveman Communication Agent
- Subproject Package Configs
- Subproject Tooling Configs
- Google Auth & GAS Integration
- claude.js
- Lean Build & Safe Refactor Agents
- Compression Token Benchmark
- Caveman Learn & Memory Optimization
- Oxlint Linter Configuration
- SP2DKResponseTab.jsx
- Playwright E2E Test Suite
- Investigate & Verify Skills
- Development Log & Architecture Records
- scripts
- Release Changelog History
- AI Usage & Token Cost Tracking
- Migration Planning Skill
- Initial Tax Agent Architecture Spec
- xlsx-js-style
- vite.config.js
- Favicon & Static Brand Assets
- Vercel Deployment Routing
- Verify Agent Configuration
- @testing-library/jest-dom
- SVG Icon Sprites
- Brand Logo Mark Asset
- Sidebar

## God Nodes (most connected - your core abstractions)
1. `cn()` - 62 edges
2. `react` - 52 edges
3. `App()` - 47 edges
4. `vitest` - 36 edges
5. `AdminDashboard()` - 34 edges
6. `Button` - 32 edges
7. `lucide-react` - 29 edges
8. `Badge()` - 22 edges
9. `@testing-library/react` - 18 edges
10. `PartnerDashboard()` - 18 edges

## Surprising Connections (you probably didn't know these)
- `Task 4: Integrate `Sidebar` and `AppHeader` into `App.jsx` Shell` --references--> `Topbar()`  [INFERRED]
  docs/superpowers/plans/2026-10-25-navigation-sidebar-redesign.md → src/components/Topbar.jsx
- `Task 2: Build `AppHeader` Component with Tests` --references--> `AppHeader()`  [INFERRED]
  docs/superpowers/plans/2026-10-25-navigation-sidebar-redesign.md → src/components/navigation/AppHeader.jsx
- `Task 3: Build `Sidebar` Component (Untitled UI Standard) with Tests` --references--> `Sidebar()`  [INFERRED]
  docs/superpowers/plans/2026-10-25-navigation-sidebar-redesign.md → src/components/navigation/Sidebar.jsx
- `Panduan Penggunaan AI Tax Agent KKP PDF Guide` --semantically_similar_to--> `Buku Panduan Praktis Staff Tax Analyst KKP`  [INFERRED] [semantically similar]
  md/PANDUAN_PENGGUNAAN_AI_TAX_AGENT_KKP.pdf → md/AI_TAX_AND_PARTNER_DASHBOARD_GUIDE.md
- `Global Constraints` --references--> `AppHeader()`  [INFERRED]
  docs/superpowers/plans/2026-10-25-navigation-sidebar-redesign.md → src/components/navigation/AppHeader.jsx

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Cavecrew Subagent Trio** — _agents_skills_cavecrew_skill_subagent_investigator, _agents_skills_cavecrew_skill_subagent_builder, _agents_skills_cavecrew_skill_subagent_reviewer [EXTRACTED 1.00]
- **Google Identity & Google Apps Script Whitelist Authentication Architecture** — docs_superpowers_specs_2026_10_24_google_login_gas_design_spec, docs_superpowers_plans_2026_10_24_google_login_gas_plan, gas_readme_setup_guide, index_google_gsi_script [EXTRACTED 1.00]
- **Hybrid GL Ingestion, Guardrails, & AI Schema Mapping Pipeline** — docs_superpowers_specs_2026_10_25_ai_schema_mapping_xls_guardrail_design_spec, docs_superpowers_plans_2026_10_25_ai_schema_mapping_xls_guardrail_plan, md_plan_import_tempel_excel_plan, _superpowers_sdd_2026_10_25_ai_schema_mapping_xls_guardrail_progress_sdd_ledger [EXTRACTED 1.00]
- **Anti-AI-Slop shadcn/ui & Fluid Motion Redesign System** — docs_superpowers_specs_2026_10_24_ui_redesign_shadcn_motion_design_spec, docs_superpowers_plans_2026_10_24_ui_redesign_shadcn_motion_plan, _superpowers_sdd_2026_10_24_ui_redesign_shadcn_motion_progress_sdd_ledger, index_antifouc [EXTRACTED 1.00]
- **Agent Token Optimization and Efficiency Mechanisms** — _agents_skills_caveman_skill_caveman_mode, _agents_skills_caveman_stats_skill_caveman_stats [INFERRED 0.75]
- **Agent Development & Modification Disciplines** — _agents_skills_investigate_first_skill_investigate_first, _agents_skills_surgical_patch_skill_surgical_patch, _agents_skills_safe_refactor_skill_safe_refactor, _agents_skills_lean_build_skill_lean_build, _agents_skills_verify_and_stop_skill_verify_and_stop [INFERRED 0.85]
- **Caveman Auto-Clarity Safeguards** — _agents_skills_cavecrew_skill_auto_clarity, _agents_skills_caveman_commit_skill_auto_clarity, _agents_skills_caveman_review_skill_auto_clarity [INFERRED 0.85]
- **Caveman Cloud Lifecycle Pipeline** — _agents_skills_caveman_setup_skill_setup, _agents_skills_caveman_discover_skill_discover, _agents_skills_caveman_evidence_review_skill_evidence_review, _agents_skills_caveman_manage_skill_manage [INFERRED 0.85]

## Communities (48 total, 11 thin omitted)

### Community 0 - "UI Components & Radix Primitives"
Cohesion: 0.06
Nodes (76): class-variance-authority, lucide-react, motion, @radix-ui/react-dropdown-menu, @radix-ui/react-tabs, @radix-ui/react-tooltip, react, @testing-library/react (+68 more)

### Community 1 - "Accurate & MYOB Excel Parsers"
Cohesion: 0.07
Nodes (42): vitest, @xmldom/xmldom, parseAccurateExcelRows(), parseAccurateXMLSS(), commonSuffixLength(), isBoilerplate(), parseAccuratePdfJournalText(), ACCOUNT_TYPES (+34 more)

### Community 2 - "App.jsx"
Cohesion: 0.08
Nodes (45): @tanstack/react-virtual, ACCURATE_COLUMNS, App(), DEFAULT_CLIENT_INFO, getInitialTheme(), KRISHAND_COLUMNS, MYOB_COLUMNS, AccountRail() (+37 more)

### Community 3 - "AI Tax Services & Analysis"
Cohesion: 0.11
Nodes (40): AISettingsModal(), PRESET_MODELS, ACCOUNT_CLASSIFICATION_TOOL, aiClassifyAccounts(), analyzeHonorariumClassification(), analyzeTaxFindings(), callClaudeProxy(), callClaudeTaxAnalysis() (+32 more)

### Community 5 - "Caveman Compression Scripts"
Cohesion: 0.12
Nodes (12): build_compress_prompt(), build_fix_prompt(), call_claude(), compress_file(), first_nonblank_line(), is_sensitive_path(), read_source(), split_frontmatter() (+4 more)

### Community 6 - "Caveman Content Validation"
Cohesion: 0.11
Nodes (17): count_bullets(), extract_code_blocks(), extract_fenced_spans(), extract_headings(), extract_indented_code_blocks(), extract_inline_codes(), extract_paths(), extract_urls() (+9 more)

### Community 7 - "Vercel Serverless API Endpoints"
Cohesion: 0.29
Nodes (15): AIUsageMonitoringTab(), loadData(), MONTH_NAMES, supabase, exportUsageLogsToCSV(), fetchFeatureCostBreakdown(), fetchMonthlyUsageSummary(), fetchRecentUsageLogs() (+7 more)

### Community 8 - "Cavecrew Delegation Subagents"
Cohesion: 0.08
Nodes (23): Cavecrew Overview, Cavecrew Model Overrides, Cavecrew Skill, Cavecrew Chaining Patterns, Cavecrew Builder Subagent, Cavecrew Investigator Subagent, Cavecrew Reviewer Subagent, Caveman Commit Overview (+15 more)

### Community 9 - "Tax Reconciliation & Keyword Scanner"
Cohesion: 0.15
Nodes (21): KEYWORD_PRESETS, KeywordScannerTab(), extractTaxBadge(), TaxReconWorkbench(), REGULATION_DATABASE, calculatePartnerDashboardMetrics(), ALIGN, BORDERS (+13 more)

### Community 10 - "Caveman CLI & File Backups"
Cohesion: 0.15
Nodes (8): main(), print_usage(), backup_dir_for(), detect_file_type(), _is_code_line(), _is_json_content(), _is_yaml_content(), should_compress()

### Community 11 - "Frontend Runtime Dependencies"
Cohesion: 0.11
Nodes (19): dependencies, class-variance-authority, clsx, jsonrepair, lucide-react, motion, pdfjs-dist, @radix-ui/react-dialog (+11 more)

### Community 12 - "package.json"
Cohesion: 0.11
Nodes (18): name, private, type, version, clsx, @emnapi/core, @emnapi/runtime, jsdom (+10 more)

### Community 13 - "Caveman Observability & Workflows"
Cohesion: 0.13
Nodes (13): Caveman Discover Skill, Workflow Labeling Convention, Evidence Accounting Buckets, Caveman Evidence Review Skill, Trace Inspection Protocol, Experiment Lifecycle Actions, Caveman Manage Skill, Caveman Optimize Skill (+5 more)

### Community 15 - "KKP Documentation & Tax Guides"
Cohesion: 0.15
Nodes (12): KKP 12-Sheet Standard KAP Workbook Structure, Ekualisasi Beban Jasa vs e-Bupot PPh 23 Module, Ekualisasi Omzet GL vs SPT Masa PPN Module, Buku Panduan Praktis Staff Tax Analyst KKP, Tax Mapping COA Classification Module, Role Selection Gateway (Auditor vs Tax Analyst), Panduan Alur Input Data Staff Tax Analyst SOP, Panduan Penggunaan AI Tax Agent KKP PDF Guide (+4 more)

### Community 16 - "Frontend Dev & Testing Tooling"
Cohesion: 0.12
Nodes (16): devDependencies, @emnapi/core, @emnapi/runtime, jsdom, oxlint, @playwright/test, tailwindcss, @tailwindcss/vite (+8 more)

### Community 17 - "Playwright CI & SDD Workflows"
Cohesion: 0.17
Nodes (9): Playwright Report CI Artifact, Playwright Tests CI Workflow Job, SDD Progress Ledger (UI Redesign shadcn Motion), UI Redesign with shadcn/ui & Fluid Motion Implementation Plan, Core Radix & Tailwind shadcn Component Primitives, Humanized Financial Workbench Aesthetic Archetype, Spatial Continuity & Accessible Spring Motion System, Design Specification: UI/UX Redesign (KAP Zaidan Jauhari) (+1 more)

### Community 18 - "Caveman Test Suites"
Cohesion: 0.23
Nodes (3): md, skillFile, skill

### Community 19 - "AI Schema Mapping & Guardrails"
Cohesion: 0.18
Nodes (10): SDD Progress Ledger (AI Schema Mapping & XLS Guardrail), Task Progression & 162 Vitest Suite Pass, Claude Haiku Schema Mapping Tool Invocation, Generic Dynamic Excel Parser Specification, AI Schema Mapping & Selective XLS Guardrail Plan, Hybrid Ingestion & Claude Haiku Schema Mapping, Selective Legacy XLS Guardrail Modal, AI Schema Mapping & Selective XLS Guardrail Specification (+2 more)

### Community 20 - "Caveman Communication Agent"
Cohesion: 0.17
Nodes (11): Caveman Auto-Clarity Fallback, Caveman Overview README, Caveman Intensity Levels, Caveman Auto-Clarity Safety Policy, Caveman Communication Mode, Caveman Intensity Specifications, Net Savings & Rule Overhead Accounting, Caveman Stats Overview (+3 more)

### Community 21 - "Subproject Package Configs"
Cohesion: 0.20
Nodes (9): description, files, license, name, private, scripts, test, type (+1 more)

### Community 22 - "Subproject Tooling Configs"
Cohesion: 0.20
Nodes (9): description, files, license, name, private, scripts, test, type (+1 more)

### Community 23 - "Google Auth & GAS Integration"
Cohesion: 0.24
Nodes (10): gasAuthService Client Interface & Unit Tests, Google Login & GAS Whitelist Implementation Plan, Client Session Persistence via localStorage, Bootstrap Super Admin Initial Setup Mechanism, GAS Web App API Endpoints Protocol, Design Specification: Google Login & GAS Whitelist, Google Spreadsheet Users & LoginLogs Data Model, GAS Web App Deployment SOP (+2 more)

### Community 24 - "claude.js"
Cohesion: 0.28
Nodes (6): calculateCost(), checkRateLimit(), handler(), PRICING_RATES, rateLimitMap, @supabase/supabase-js

### Community 25 - "Lean Build & Safe Refactor Agents"
Cohesion: 0.22
Nodes (6): Lean Build OpenAI Interface, Lean Build Skill, Safe Refactor OpenAI Interface, Safe Refactor Skill, Surgical Patch OpenAI Interface, Surgical Patch Skill

### Community 26 - "Compression Token Benchmark"
Cohesion: 0.39
Nodes (4): benchmark_pair(), count_tokens(), main(), print_table()

### Community 27 - "Caveman Learn & Memory Optimization"
Cohesion: 0.29
Nodes (6): Caveman Learn Architecture & Binding, Caveman Learn Overview, Cavemem Offload Mechanism, Caveman Learn Skill, Evidence Strength Rungs, Token Sink Classes

### Community 28 - "Oxlint Linter Configuration"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 29 - "SP2DKResponseTab.jsx"
Cohesion: 0.26
Nodes (11): SP2DKResponseTab(), generateSP2DKResponseWithClaude(), calculateSP2DKDeadline(), CAUSE_CATEGORIES, downloadSP2DKWordDocument(), generateFallbackSP2DKResponse(), parseSP2DKText(), SP2DK_DEMO_PRESETS (+3 more)

### Community 31 - "Investigate & Verify Skills"
Cohesion: 0.40
Nodes (3): Investigate First OpenAI Interface, Investigate First Skill, Verify and Stop Skill

### Community 32 - "Development Log & Architecture Records"
Cohesion: 0.40
Nodes (4): GL Cleaner Development Log, Open/Closed Principle Router Parser Pattern, Smart Auto-Detection Architecture for Accurate & MYOB, Web Worker Background Excel Export with Compression

### Community 33 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, build, dev, lint, preview, test

### Community 34 - "Release Changelog History"
Cohesion: 0.50
Nodes (4): GL Cleaner & AI Tax Agent Changelog, Version 2.0.0: Transformation to Dual-Engine AI Tax Agent, Version 2.1.0: SP2DK Tax Audit Response Agent, Version 2.2.0: Smart Client Detector & Styled KKP Excel Engine

### Community 35 - "AI Usage & Token Cost Tracking"
Cohesion: 0.50
Nodes (3): AI Usage Monitoring Plan (Backup Duplicate), Haiku 4.5 vs Sonnet 5 Model Routing Architecture, AI Usage & Token Cost Monitoring Plan

### Community 37 - "Initial Tax Agent Architecture Spec"
Cohesion: 0.67
Nodes (3): Initial AI Tax Agent Architecture Specification, Master System Prompt for Indonesian Tax Compliance, Multi-Agent Tax Team Archetype Framework

### Community 38 - "xlsx-js-style"
Cohesion: 0.33
Nodes (4): @playwright/test, xlsx-js-style, SAMPLE_AUTH_ADMIN, SAMPLE_PROJECT_DRAFT

### Community 39 - "vite.config.js"
Cohesion: 0.40
Nodes (3): @tailwindcss/vite, vite, @vitejs/plugin-react

### Community 47 - "Sidebar"
Cohesion: 0.20
Nodes (12): File Structure, Global Constraints, Redesign Navigation Sidebar & Web-App Title Implementation Plan, Review Focus, Task 1: Update Web-App Title and Branding Metadata, Task 2: Build `AppHeader` Component with Tests, Task 3: Build `Sidebar` Component (Untitled UI Standard) with Tests, Task 4: Integrate `Sidebar` and `AppHeader` into `App.jsx` Shell (+4 more)

## Knowledge Gaps
- **81 isolated node(s):** `@emnapi/core`, `@emnapi/runtime`, `@types/node`, `@types/react`, `@types/react-dom` (+76 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 266 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `vitest` connect `Accurate & MYOB Excel Parsers` to `UI Components & Radix Primitives`, `App.jsx`, `AI Tax Services & Analysis`, `Vercel Serverless API Endpoints`, `Tax Reconciliation & Keyword Scanner`, `package.json`, `Sidebar`, `SP2DKResponseTab.jsx`?**
  _High betweenness centrality (0.074) - this node is a cross-community bridge._
- **What connects `@emnapi/core`, `@emnapi/runtime`, `@types/node` to the rest of the system?**
  _81 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `UI Components & Radix Primitives` be split into smaller, more focused modules?**
  _Cohesion score 0.06394797452919658 - nodes in this community are weakly interconnected._
- **Why does `react` connect `UI Components & Radix Primitives` to `App.jsx`, `AI Tax Services & Analysis`, `main.jsx`, `Vercel Serverless API Endpoints`, `Tax Reconciliation & Keyword Scanner`, `package.json`, `Sidebar`, `SP2DKResponseTab.jsx`?**
  _High betweenness centrality (0.049) - this node is a cross-community bridge._
- **Should `Accurate & MYOB Excel Parsers` be split into smaller, more focused modules?**
  _Cohesion score 0.06804214223002635 - nodes in this community are weakly interconnected._
- **Why does `dependencies` connect `Frontend Runtime Dependencies` to `package.json`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Should `App.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07615018508725542 - nodes in this community are weakly interconnected._