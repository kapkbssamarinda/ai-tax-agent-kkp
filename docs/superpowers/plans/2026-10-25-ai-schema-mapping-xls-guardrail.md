# Implementation Plan: AI Schema Mapping & Selective .xls Guardrail

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a hybrid ingestion architecture that selectively guards legacy `.xls` files with unrecognized patterns by prompting users to convert or paste, while providing an AI Schema Mapping workflow for unfamiliar `.xlsx` files using Claude Haiku 4.5 on 10-15 sample rows followed by native local parsing.

**Tech Stack:** React 19, Web Worker, `xlsx-js-style`, Claude API Tool Use, Radix UI Dialog, Tailwind CSS v4, Motion, Vitest, Playwright.

**Spec:** [docs/superpowers/specs/2026-10-25-ai-schema-mapping-xls-guardrail-design.md](file:///d:/Project%20Web%20Rama/New_Project/ai-tax-agent/docs/superpowers/specs/2026-10-25-ai-schema-mapping-xls-guardrail-design.md)

---

## Tasks

### Task 1: Generic Dynamic Excel Parser
**Files:**
- Create: `src/parsers/genericExcelParser.js`
- Test: `src/parsers/genericExcelParser.test.js`

- [ ] **Step 1: Write unit test for genericExcelParser**
  - Verify that given an array of raw Excel rows and a column index mapping `{ dateIdx, coaIdx, accountNameIdx, descIdx, debitIdx, creditIdx, balanceIdx, voucherNoIdx }`, it accurately extracts clean GL transaction objects.
  - Verify handling of row filters (skipping headers before `dataStartRowIndex`, ignoring empty rows).
- [ ] **Step 2: Run test to verify it fails (RED)**
  - Run `npm test -- src/parsers/genericExcelParser.test.js`
- [ ] **Step 3: Implement `genericExcelParser.js` (GREEN)**
  - Use `cleanBalance` and date normalization utilities.
- [ ] **Step 4: Verify test passes**
- [ ] **Step 5: Commit Task 1**

---

### Task 2: AI Schema Mapping Tool in Claude Service
**Files:**
- Modify: `src/services/claudeService.js`
- Test: `src/services/claudeService.test.js`

- [ ] **Step 1: Write test for `detectSchemaWithClaude`**
  - Test tool use with `submit_schema_mapping` extracting column indexes from 10 sample rows.
  - Verify fallback to heuristic detection if API call fails or is cancelled.
- [ ] **Step 2: Run test to verify it fails (RED)**
- [ ] **Step 3: Implement `SCHEMA_MAPPING_TOOL` and `detectSchemaWithClaude` in `claudeService.js` (GREEN)**
  - Send sample rows to Claude Haiku 4.5.
  - Extract and validate returned column indexes.
- [ ] **Step 4: Verify test passes**
- [ ] **Step 5: Commit Task 2**

---

### Task 3: Selective .xls Guardrail Modal
**Files:**
- Create: `src/components/modals/LegacyXlsGuideModal.jsx`
- Test: `src/components/modals/LegacyXlsGuideModal.test.jsx`

- [ ] **Step 1: Write component tests for `LegacyXlsGuideModal`**
  - Verify modal renders warning about legacy `.xls` format.
  - Verify clicking "Beralih ke Tempel dari Excel (3 Kolom)" fires callback `onSwitchToPaste`.
  - Verify clicking "Batal" closes modal.
- [ ] **Step 2: Run test to verify it fails (RED)**
- [ ] **Step 3: Implement `LegacyXlsGuideModal.jsx` using shadcn Dialog & Lucide icons (GREEN)**
- [ ] **Step 4: Verify test passes**
- [ ] **Step 5: Commit Task 3**

---

### Task 4: AI Schema Mapping Confirmation & Verification Dialog
**Files:**
- Create: `src/components/modals/SchemaMappingConfirmModal.jsx`
- Test: `src/components/modals/SchemaMappingConfirmModal.test.jsx`

- [ ] **Step 1: Write component tests for `SchemaMappingConfirmModal`**
  - Verify preview of 10 sample rows.
  - Verify dropdown selectors for Tanggal, Keterangan, Debit, Kredit, COA, etc.
  - Verify validation prevents submitting without essential fields (Tanggal, Keterangan, Nominal).
  - Verify clicking "Terapkan & Proses Data" passes user-confirmed mapping.
- [ ] **Step 2: Run test to verify it fails (RED)**
- [ ] **Step 3: Implement `SchemaMappingConfirmModal.jsx` (GREEN)**
- [ ] **Step 4: Verify test passes**
- [ ] **Step 5: Commit Task 4**

---

### Task 5: Web Worker & App Ingestion Integration
**Files:**
- Modify: `src/parsers/parserWorker.js`
- Modify: `src/App.jsx`
- Test: `src/App.test.jsx`

- [ ] **Step 1: Update `parserWorker.js`**
  - If existing parsers (Accurate, MYOB, Krishand) fail to find valid rows:
    - If file was `.xls`, post message `status: 'unrecognized_legacy_xls', sampleRows: rows.slice(0, 15)`.
    - If file was `.xlsx`, post message `status: 'unrecognized_xlsx', sampleRows: rows.slice(0, 15)`.
  - Add handler for message `type: 'PARSE_WITH_SCHEMA_MAPPING'`, calling `genericExcelParser`.
- [ ] **Step 2: Wire modals into `App.jsx`**
  - When worker reports `unrecognized_legacy_xls`, open `LegacyXlsGuideModal`.
  - When worker reports `unrecognized_xlsx`, prompt user to trigger AI Schema Mapping $\rightarrow$ open `SchemaMappingConfirmModal`.
  - On confirm, post mapping back to worker to parse full GL dataset.
- [ ] **Step 3: Run unit and integration tests**
- [ ] **Step 4: Commit Task 5**

---

### Task 6: Playwright E2E Tests, Regression Suite & Build Verification
**Files:**
- Modify: `tests/tax-agent.spec.ts`

- [ ] **Step 1: Add E2E tests for unrecognized .xls modal and .xlsx schema mapping flow**
- [ ] **Step 2: Run Playwright tests (`npx playwright test`)**
- [ ] **Step 3: Run full test suite (`npm test -- --run`)**
- [ ] **Step 4: Run production build (`npm run build`)**
- [ ] **Step 5: Commit Task 6 & Finalization**

