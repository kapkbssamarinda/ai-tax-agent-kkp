# UI Redesign with shadcn/ui & Fluid Motion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the entire AI Tax Agent (KAP Zaidan Jauhari) UI using Tailwind CSS, shadcn/ui component primitives, and fluid motion transitions, strictly adhering to professional anti-AI-slop design principles while maintaining 100% test compatibility.

**Architecture:** We will install and configure Tailwind CSS and Motion alongside Radix UI primitives as reusable components in `src/components/ui/`. We will incrementally replace legacy `App.css` monolithic rules with modular styled components across all views (Auth, Shell, Ingestion, Tax Reconciliation, Partner Dashboard, and Admin), preserving all deterministic tax calculation engines and Google Apps Script integration.

**Tech Stack:** React 19, Vite 8, Tailwind CSS v4, Motion (`motion` / `framer-motion`), Radix UI primitives, Lucide React, Vitest, Testing Library.

**Spec:** [docs/superpowers/specs/2026-10-24-ui-redesign-shadcn-motion-design.md](file:///d:/Project%20Web%20Rama/New_Project/ai-tax-agent/docs/superpowers/specs/2026-10-24-ui-redesign-shadcn-motion-design.md)

---

## Global Constraints

- **Strict Anti-AI Slop:** No purple/indigo gradient backgrounds, no glassmorphism overuse, no decorative fake cards or sparklines, no emoji in UI copy, no all-caps tracking on every header.
- **Data-First Color Allocation:** Chrome remains neutral (slate/navy/zinc). 95% of saturated color is reserved for financial data (discrepancy red, matched green, attention amber).
- **Tabular Precision:** All financial figures must use `font-variant-numeric: tabular-nums` and right alignment.
- **Zero Calculation Regressions:** All 129 existing unit/integration tests for tax logic, parsers, and Google Apps Script authentication must pass after every task.
- **Motion Accessibility:** All animation choreography must respect `@media (prefers-reduced-motion: reduce)`.

---

## Review Focus

1. **Table Layout Stability:** Large general ledger imports (10,000+ rows) in `DataTable.jsx` must not stutter during virtualized scrolling when wrapped in Tailwind and Radix primitives.
2. **Theme Switching Persistence:** Switching between Dark (Navy-Slate default) and Light (Warm Slate) must maintain high contrast (>= 4.5:1 for body, >= 3:1 for headers) across all tabs without flashing unstyled content (FOUC).
3. **Modal & Dropdown Stacking Context:** Radix Dialogs, DropdownMenus, and Tooltips must render cleanly above the virtualized table and sticky topbar without z-index clipping.
4. **Google Sign-In Button Lifecycle:** GIS button container rendering in `LoginPage.jsx` must remain robust across re-renders and window resize events.
5. **Form & SPT Input Responsiveness:** Real-time equalization updates when typing into SPT inputs in `TaxReconWorkbench.jsx` must not trigger input lag or lose focus due to animation re-renders.

---

## Tasks

### Task 1: Foundation Setup — Tailwind CSS v4, Motion, and Utilities

**Files:**
- Create: `src/lib/utils.js`
- Modify: `package.json`
- Modify: `vite.config.js`
- Modify: `src/index.css`
- Test: `src/lib/utils.test.js`

**Interfaces:**
- Consumes: Tailwind CSS v4, `clsx`, `tailwind-merge`, `motion`
- Produces: `cn(...inputs)` utility function, foundational CSS variables for Light & Dark mode tokens.

- [ ] **Step 1: Write unit test for `cn` utility function**

```javascript
// src/lib/utils.test.js
import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn utility', () => {
  it('merges class names correctly', () => {
    expect(cn('px-2 py-1', 'bg-blue-500')).toBe('px-2 py-1 bg-blue-500');
  });

  it('handles tailwind conflicts via tailwind-merge', () => {
    expect(cn('px-2 px-4', 'text-red-500 text-blue-500')).toBe('px-4 text-blue-500');
  });

  it('handles conditional classes properly', () => {
    expect(cn('btn', false && 'hidden', true && 'visible')).toBe('btn visible');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/utils.test.js`
Expected: FAIL with "Cannot find module './utils'"

- [ ] **Step 3: Install dependencies and implement `cn` and theme tokens**

Install required packages:
`npm install -D tailwindcss @tailwindcss/vite`
`npm install clsx tailwind-merge class-variance-authority motion @radix-ui/react-slot`

Configure `vite.config.js` with `@tailwindcss/vite`.
Implement `src/lib/utils.js`:
```javascript
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
```
Update `src/index.css` to import Tailwind and define anti-slop CSS custom tokens for Dark/Light modes.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/utils.test.js`
Expected: PASS

- [ ] **Step 5: Run full test suite to guarantee zero regression**

Run: `npm test`
Expected: All 130 tests PASS

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vite.config.js src/index.css src/lib/utils.js src/lib/utils.test.js
git commit -m "feat(ui): setup tailwind css v4, motion, and design tokens"
```

---

### Task 2: Core shadcn/ui Component Primitives

**Files:**
- Create: `src/components/ui/button.jsx`
- Create: `src/components/ui/card.jsx`
- Create: `src/components/ui/badge.jsx`
- Create: `src/components/ui/input.jsx`
- Create: `src/components/ui/dialog.jsx`
- Create: `src/components/ui/tabs.jsx`
- Create: `src/components/ui/dropdown-menu.jsx`
- Create: `src/components/ui/tooltip.jsx`
- Create: `src/components/ui/table.jsx`
- Test: `src/components/ui/primitives.test.jsx`

**Interfaces:**
- Consumes: Radix UI primitives (`@radix-ui/react-dialog`, `@radix-ui/react-tabs`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-tooltip`), `cn` from `src/lib/utils.js`
- Produces: Standardized, accessible, animated primitives for buttons, cards, badges, inputs, dialogs, tabs, and tables.

- [ ] **Step 1: Write tests for core primitives**

```javascript
// src/components/ui/primitives.test.jsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Button } from './button';
import { Badge } from './badge';
import { Card, CardHeader, CardTitle, CardContent } from './card';

describe('UI Primitives', () => {
  it('renders Button with variants and handles click', () => {
    render(<Button variant="destructive">Hapus</Button>);
    const btn = screen.getByRole('button', { name: /hapus/i });
    expect(btn).toBeInTheDocument();
  });

  it('renders Badge with custom variants', () => {
    render(<Badge variant="success">Sesuai</Badge>);
    expect(screen.getByText('Sesuai')).toBeInTheDocument();
  });

  it('renders Card with header and content', () => {
    render(
      <Card>
        <CardHeader><CardTitle>Ringkasan</CardTitle></CardHeader>
        <CardContent>Konten Pajak</CardContent>
      </Card>
    );
    expect(screen.getByText('Ringkasan')).toBeInTheDocument();
    expect(screen.getByText('Konten Pajak')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/ui/primitives.test.jsx`
Expected: FAIL with module not found.

- [ ] **Step 3: Install Radix UI primitives and implement shadcn/ui components**

Install:
`npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-tabs @radix-ui/react-tooltip`

Implement:
- `button.jsx`: Variants (default, destructive, outline, secondary, ghost, link) with tactile spring hover/active.
- `badge.jsx`: Variants (default, secondary, destructive, outline, success, warning) for tax audit statuses.
- `card.jsx`: Modern flat card with refined 1px border and optional subtle shadow.
- `input.jsx` & `textarea.jsx`: Accessible form controls with clear focus rings.
- `dialog.jsx`: Radix dialog with Motion entrance/exit transitions.
- `tabs.jsx`: Animated tab switcher with sliding underline/pill.
- `dropdown-menu.jsx`: Floating popover menu with keyboard navigation.
- `table.jsx`: Styled semantic table with right-aligned numeric cells.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/components/ui/primitives.test.jsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/
git commit -m "feat(ui): add core shadcn component primitives with motion support"
```

---

### Task 3: Redesign Gateway & Identity — LoginPage & User Modals

**Files:**
- Modify: `src/components/auth/LoginPage.jsx`
- Modify: `src/components/auth/UserProfileModal.jsx`
- Modify: `src/components/auth/LogoutConfirmModal.jsx`
- Test: `src/components/auth/LoginPage.test.jsx`
- Test: `src/components/auth/UserProfileModal.test.jsx`

**Interfaces:**
- Consumes: `useAuth()`, Google Identity Services, `Button`, `Card`, `Badge`, `Dialog` primitives
- Produces: Professional, trustworthy login portal for KAP Zaidan Jauhari with Google OAuth integration and polished user profile/logout dialogs.

- [ ] **Step 1: Verify current LoginPage & UserProfile tests**

Run: `npm test -- src/components/auth/`
Expected: All current tests PASS.

- [ ] **Step 2: Refactor LoginPage.jsx with shadcn/ui & Motion**
- Replace legacy `.login-card` and `.login-page` styles with modern layout:
  - Deep Navy / Slate background with subtle mathematical geometric grid pattern (no neon blobs).
  - Prominent KAP Zaidan Jauhari emblem and official tax partner credential badge.
  - Smooth entrance animation via Motion (`opacity: 0, y: 15` -> `opacity: 1, y: 0`).
  - Google Sign-In button container with status indicator (Online / Menghubungkan).
  - Clear Indonesian compliance notice: "Sistem Terotentikasi & Terenkripsi untuk Kertas Kerja Pajak".

- [ ] **Step 3: Refactor UserProfileModal and LogoutConfirmModal with Radix Dialog**
- Replace custom backdrop/box div implementations with `<Dialog>` / `<DialogContent>` primitives.
- Show Google profile avatar, user email, active role badge (Admin / Analis Pajak), and session expiration indicator.
- Add spring exit transitions.

- [ ] **Step 4: Run tests to verify all auth tests still pass**

Run: `npm test -- src/components/auth/`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/auth/
git commit -m "feat(ui): redesign LoginPage, UserProfileModal, and LogoutConfirmModal"
```

---

### Task 4: Redesign Topbar & Application Shell

**Files:**
- Modify: `src/components/Topbar.jsx`
- Modify: `src/App.jsx`
- Test: `src/components/Topbar.test.jsx` (create if needed)

**Interfaces:**
- Consumes: `step`, `viewMode`, `clientInfo`, `userProfile`, `isAdmin`, theme state.
- Produces: Two-tier sticky application header with fluid navigation tabs, client selector pill, project export dropdown, and theme switcher.

- [ ] **Step 1: Write test for Topbar navigation and interactions**

Verify navigation tab switching (`GL_CLEANER`, `TAX_AGENT`, `PARTNER_DASHBOARD`) and dropdown rendering.

- [ ] **Step 2: Refactor Topbar.jsx**
- Tier 1: Logo KAP Zaidan Jauhari, Client Information Pill (NPWP & Nama Wajib Pajak), GAS Sync Status badge, User Profile trigger, Theme Toggle (with smooth rotation animation), Logout button.
- Tier 2: Animated Navigation Tabs using Motion layoutId so the active tab indicator glides smoothly between tabs. Action buttons (Simpan Project, Export KKP Excel, Reset) styled with shadcn `Button` and `DropdownMenu`.

- [ ] **Step 3: Update App.jsx shell container**
- Wrap views in clean full-screen layout with smooth fade/slide transitions when switching between stages (Upload -> Loading -> Workbench).
- Implement global toast/notification banner.

- [ ] **Step 4: Run tests to verify passing**

Run: `npm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/Topbar.jsx src/App.jsx
git commit -m "feat(ui): redesign Topbar with animated navigation rail and modern shell"
```

---

### Task 5: Redesign Ingestion Deck — Dropzone & PasteImportPanel

**Files:**
- Modify: `src/components/Dropzone.jsx`
- Modify: `src/components/PasteImportPanel.jsx`
- Test: `src/parsers/pasteImportParser.test.js`

**Interfaces:**
- Consumes: File upload event, clipboard paste text, Excel/CSV parser workers.
- Produces: Modern drag-and-drop zone with animated upload states and interactive 3-column paste import modal with live valid/invalid row counters.

- [ ] **Step 1: Refactor Dropzone.jsx**
- Use Radix Card with dashed border that smoothly pulses when dragging a file over.
- Provide clear file format badges (XLSX, XLS, CSV, XML, PDF).
- Tactile file picker button with hover feedback.

- [ ] **Step 2: Refactor PasteImportPanel.jsx**
- Clean modal with full-height editor, mode selector (Auto / Semua Debit / Semua Kredit) using segmented control tabs.
- Live verification counter badge: "125 Baris Valid", "2 Baris Tidak Sesuai Format".
- Progress bar during AI classification.

- [ ] **Step 3: Run parser and component tests**

Run: `npm test -- src/parsers/pasteImportParser.test.js`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/Dropzone.jsx src/components/PasteImportPanel.jsx
git commit -m "feat(ui): redesign file dropzone and paste import panel"
```

---

### Task 6: Redesign General Ledger Workbench & Virtualized Table

**Files:**
- Modify: `src/components/DataTable.jsx`
- Modify: `src/components/AccountRail.jsx`
- Modify: `src/components/WarningsPanel.jsx`

**Interfaces:**
- Consumes: TanStack Virtualizer, GL transaction rows, account filters.
- Produces: High-density, high-performance financial data table with sticky headers, inline filter inputs, tabular numbers, and clean account rail sidebar.

- [ ] **Step 1: Refactor DataTable.jsx**
- Implement clean shadcn table structure with virtualized row containers.
- Align numeric columns (Debit, Kredit, Saldo) to the right with `font-mono tabular-nums`.
- Clean filter inputs with subtle focus rings.
- Empty search state: "Tidak ada transaksi yang cocok dengan filter."

- [ ] **Step 2: Refactor AccountRail.jsx & WarningsPanel.jsx**
- Account list with account code badges and balance indicators.
- Warnings panel with collapsible warning cards (Debit/Kredit tidak seimbang, akun tidak terpetakan).

- [ ] **Step 3: Run full tests and verify performance**

Run: `npm test`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/DataTable.jsx src/components/AccountRail.jsx src/components/WarningsPanel.jsx
git commit -m "feat(ui): redesign virtualized GL data table and account rail"
```

---

### Task 7: Redesign Tax Reconciliation Workbench

**Files:**
- Modify: `src/components/tax/TaxReconWorkbench.jsx`
- Modify: `src/components/tax/KeywordScannerTab.jsx`
- Modify: `src/components/tax/ClientMasterModal.jsx`
- Modify: `src/components/tax/AISettingsModal.jsx`

**Interfaces:**
- Consumes: 4 Reconciliation objects (Revenue vs PPN, Expense vs PPh 23, Payroll vs PPh 21, Final Tax), findings, SPT form updates.
- Produces: Comprehensive tax equalization workspace with interactive summary cards, discrepancy callouts, AI Disambiguation sheet, and KKP generation triggers.

- [ ] **Step 1: Refactor Reconciliation Summary Cards & Tabs**
- 9 tab navigation with Motion sliding indicator.
- 4 Executive Equalization Cards: Omset DPP vs PPN 1111, Biaya Jasa/Sewa vs PPh 23, Biaya Gaji vs PPh 21, Sewa Tanah/Bangunan vs PPh 4(2).
- Highlight discrepancies with crimson badge and match with muted emerald badge.

- [ ] **Step 2: Refactor SPT Masa Input Form & Transaction Drilldown**
- Responsive input grid with formatted Rupiah inputs (`Rp 1.500.000.000`).
- Animated discrepancy breakdown table.
- AI Disambiguation panel for honorarium vs tenaga ahli with confidence indicators.

- [ ] **Step 3: Run tax engine and workbench tests**

Run: `npm test`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/tax/
git commit -m "feat(ui): redesign TaxReconWorkbench with interactive equalization tabs"
```

---

### Task 8: Redesign SP2DK Response Engine & Risk Register

**Files:**
- Modify: `src/components/tax/SP2DKResponseTab.jsx`
- Modify: `src/components/tax/TaxRiskRegister.jsx`

**Interfaces:**
- Consumes: Tax findings, statutory regulation database (`regulationDB.js`), 14-day deadline countdown.
- Produces: Professional tax audit defense drafting station with timeline countdown, legal citation cards, and exportable formal clarification letters.

- [ ] **Step 1: Refactor SP2DK Response Tab**
- 14-day statutory response deadline countdown widget with alert status.
- Accordion-style clarification points matching official Kantor Pelayanan Pajak (KPP) format.
- Regulation citation cards referencing UU KUP & UU HPP with copy-to-clipboard functionality.

- [ ] **Step 2: Refactor Tax Risk Register**
- Risk severity matrix with clean badges (Tinggi, Sedang, Rendah).
- Exposure calculation summary in tabular typography.

- [ ] **Step 3: Run tests**

Run: `npm test`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/tax/SP2DKResponseTab.jsx src/components/tax/TaxRiskRegister.jsx
git commit -m "feat(ui): redesign SP2DK clarification letter engine and risk register"
```

---

### Task 9: Redesign Executive Partner Dashboard

**Files:**
- Modify: `src/components/tax/PartnerDashboard.jsx`
- Test: `src/tax-engine/riskScoring.test.js`

**Interfaces:**
- Consumes: `calculatePartnerDashboardMetrics(findings)`, 4× recon objects, clientInfo.
- Produces: Executive audit summary for KAP Partners with overall exposure card, Top 5 Attention Matters list, and one-click KKP export button.

- [ ] **Step 1: Refactor PartnerDashboard.jsx**
- Hero Section: Client name, NPWP, Tahun Pajak, and Overall Audit Risk Level badge.
- 4 Genuine Metric Blocks (Total Potensi Paparan Pajak, Temuan Berisiko Tinggi, Status Ekualisasi Klop, Efektivitas Dokumen Pendukung) — strictly tied to real calculated data, no fake sparklines.
- Top 5 Partner Attention Matters: Ranked checklist with direct jump links to the corresponding reconciliation tab.
- Comprehensive Equalization Summary Table.

- [ ] **Step 2: Run tests**

Run: `npm test`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/tax/PartnerDashboard.jsx
git commit -m "feat(ui): redesign Partner Dashboard with executive audit cards"
```

---

### Task 10: Redesign Admin Console & User Whitelist Management

**Files:**
- Modify: `src/components/admin/AdminDashboard.jsx`
- Test: `src/components/admin/AdminDashboard.test.jsx`

**Interfaces:**
- Consumes: `gasAuthService`, Google Sheets backend user list, admin role status.
- Produces: Enterprise administration panel for user whitelisting, role assignment, and access control.

- [ ] **Step 1: Verify current AdminDashboard tests**

Run: `npm test -- src/components/admin/`
Expected: PASS (4/4 tests).

- [ ] **Step 2: Refactor AdminDashboard.jsx**
- Clean header with KAP Zaidan Jauhari system administration branding.
- Quick user search bar and role filter segmented tabs (Semua, Admin, Analis Pajak).
- User data table using shadcn table styling with status toggle switches and edit modals.
- Add User slide-over sheet or Radix dialog.

- [ ] **Step 3: Run admin tests to verify zero regression**

Run: `npm test -- src/components/admin/`
Expected: PASS (4/4 tests).

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/
git commit -m "feat(ui): redesign AdminDashboard with modern user management table"
```

---

### Task 11: Cleanup, Verification, Performance & Anti-Slop Audit

**Files:**
- Modify: `src/App.css` (prune obsolete styles, keep any needed overrides)
- Test: Full test suite (`npm test`)
- Build: `npm run build`

**Interfaces:**
- Consumes: All updated components and styles.
- Produces: Production-ready, zero-error build with 100% test pass rate and audited UX.

- [ ] **Step 1: Prune obsolete CSS from App.css**
- Remove unused legacy CSS rules replaced by Tailwind classes while ensuring no styling regressions.

- [ ] **Step 2: Execute Anti-AI Slop Quality Checklist**
- [ ] Palette: Dark Mode is deep navy/slate, Light Mode is warm slate; accent is restrained.
- [ ] No gradient purple/pink backgrounds or floating blur orbs.
- [ ] No decorative emoji in UI text.
- [ ] Numbers formatted with `font-variant-numeric: tabular-nums`.
- [ ] All interactive buttons and inputs have visible focus-visible rings and tactile hover feedback.
- [ ] `@media (prefers-reduced-motion: reduce)` verified.
- [ ] All responsive breakpoints (Desktop, Laptop, Tablet, Mobile) render cleanly without horizontal overflow.

- [ ] **Step 3: Run full automated test suite**

Run: `npm test`
Expected: 100% tests PASS (all 130+ tests).

- [ ] **Step 4: Execute production build**

Run: `npm run build`
Expected: Build succeeds with zero errors.

- [ ] **Step 5: Final Commit**

```bash
git add .
git commit -m "chore(ui): complete UI redesign with shadcn/ui and fluid motion"
```

