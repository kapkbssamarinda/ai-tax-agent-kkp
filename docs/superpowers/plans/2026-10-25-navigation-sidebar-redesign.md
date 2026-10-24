# Redesign Navigation Sidebar & Web-App Title Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the horizontal two-row Topbar into a modern, production-grade Untitled UI Collapsible Navigation Sidebar with a Slim Content Header, and rename the web-app title to **AI-Tax-Agent**.

**Architecture:** Split the monolithic topbar into two focused components: a left collapsible `Sidebar` (Desktop 260px expanded / 72px icon-rail with Radix tooltips + Mobile responsive drawer) and an `AppHeader` (slim top bar for breadcrumb context, Google Drive sync status, and on-demand AI analysis trigger). Update `App.jsx` layout to a full-viewport flex shell and update web-app branding in `index.html`.

**Tech Stack:** React 19, Tailwind CSS v4, `@radix-ui/react-tooltip`, `@radix-ui/react-dropdown-menu`, `lucide-react`, `motion/react`, Vitest, `@testing-library/react`.

**Spec Reference:** Decisions aligned via `/grill-me` & `/brainstorming`:
1. Application Shell: Sidebar Penuh (kiri) + Slim Content Header (atas).
2. Workspace & Action Distribution: Client Switcher di atas Sidebar (Untitled UI Workspace Switcher card) + Utilitas Proyek/Ekspor di Sidebar; Tombol "Analisis AI" dan "Simpan Cloud" di Slim Content Header.
3. User Account Section: Untitled UI Account Card di footer Sidebar lengkap dengan avatar inisial, nama user, email, badge peran (Admin/Analyst), tombol aksi cepat Theme Toggle (Sun/Moon), dan tombol Logout dengan konfirmasi modal.
4. Collapsible Behavior: Collapsible di desktop (260px <-> 72px icon rail) dengan animasi smooth + slide-over drawer di mobile/tablet.

---

## Global Constraints

- **Preserve All Existing Features:** Do not break or drop any existing functionality (Client Master, User Profile, Admin Dashboard, Cloud Sync, .aitax save/load, Excel/CSV export, AI analysis modal, logout confirmation).
- **Anti-Slop UI Standards:** No generic neon/rainbow gradients, no meaningless pulsing dots without state, no excessive glassmorphism. Keep elevation and borders clean and intentional per Untitled UI standards.
- **Accessibility:** Ensure all icon buttons have `aria-label` or `title`, minimum 44x44px touch targets on mobile, keyboard navigable menus, and Radix Tooltips for icon-only collapsed state.
- **Test Integrity:** All 33 test files and 167 existing unit tests must continue to pass, with new comprehensive tests added for `Sidebar` and `AppHeader`.

---

## Review Focus

1. **Collapsed State Tooltips & Accessibility:** When the sidebar is collapsed to 72px, every icon button must show a tooltip so users know what each icon does.
2. **Mobile Drawer State & Overlay:** On screen widths < 1024px (`lg`), the sidebar must hide off-canvas and slide in smoothly when hamburger is clicked, closing on backdrop tap or item selection.
3. **Workspace Switcher Outside Click & Keyboard Escape:** Client switcher dropdown inside the sidebar must close reliably when clicking outside or pressing Escape.
4. **Theme Synchronization:** Theme toggle in the user profile card must immediately toggle between `light` and `dark` classes on `:root` and update `localStorage`.
5. **No Regressions in Workbench Layout:** Data tables in `GL_CLEANER`, `TAX_AGENT`, and `PARTNER_DASHBOARD` must resize cleanly and take advantage of horizontal space when the sidebar is collapsed.

---

## File Structure

- **Modify:**
  - `index.html`: Update `<title>` to `AI-Tax-Agent`.
  - `src/App.jsx`: Update application shell from vertical topbar stack to flexbox sidebar layout; wire state for sidebar collapse and mobile drawer.
  - `src/components/Topbar.jsx`: Deprecate/refactor or keep as backward-compatible wrapper if needed.
- **Create:**
  - `src/components/navigation/Sidebar.jsx`: Full Untitled UI navigation sidebar component (Header, Workspace Switcher, Nav items with badges, Utilitas Proyek/Ekspor, Account Card footer).
  - `src/components/navigation/Sidebar.test.jsx`: Unit test suite covering rendering, navigation events, collapse toggle, workspace switcher, and user logout.
  - `src/components/navigation/AppHeader.jsx`: Slim header for breadcrumb context, mobile hamburger, Cloud Sync status, and Analisis AI button.
  - `src/components/navigation/AppHeader.test.jsx`: Unit test suite for AppHeader component.

---

### Task 1: Update Web-App Title and Branding Metadata

**Files:**
- Modify: `index.html:8`
- Modify: `src/App.jsx:1269-1273`

- [ ] **Step 1:** In `index.html`, update `<title>GL Cleaner</title>` to `<title>AI-Tax-Agent</title>`.
- [ ] **Step 2:** In `src/App.jsx`, update the stage header title from `AI Tax Agent Indonesia — KKP Zaidan Jauhari` to `AI-Tax-Agent — KKP Zaidan Jauhari`.
- [ ] **Step 3:** Run `npm test -- --run` to verify no existing tests break with title update.

---

### Task 2: Build `AppHeader` Component with Tests

**Files:**
- Create: `src/components/navigation/AppHeader.jsx`
- Create: `src/components/navigation/AppHeader.test.jsx`

- [ ] **Step 1:** Write failing tests in `src/components/navigation/AppHeader.test.jsx` covering:
  - Renders view title / breadcrumb based on `viewMode` (`Buku Besar`, `AI Tax & KKP`, `Partner Dashboard`, `Daftar Klien`).
  - Calls `onOpenMobileMenu` when mobile hamburger button is clicked.
  - Renders "Simpan Cloud" button with correct syncing animation state when `onSyncCloud` is passed and `hasData` is true.
  - Renders "Analisis AI" button when `onOpenRunAI` is provided and calls handler on click.
- [ ] **Step 2:** Run `npx vitest run src/components/navigation/AppHeader.test.jsx` to confirm test failures.
- [ ] **Step 3:** Implement `src/components/navigation/AppHeader.jsx`:
  - Include mobile menu toggle (`Menu` icon from `lucide-react`, `lg:hidden`).
  - Include breadcrumb / current section title with client context badge if client active.
  - Include right-side action buttons: "Simpan Cloud" (`Cloud` icon with status pulse) and "Analisis AI" (`Sparkles` icon with accent styling).
- [ ] **Step 4:** Run `npx vitest run src/components/navigation/AppHeader.test.jsx` and ensure all tests pass.

---

### Task 3: Build `Sidebar` Component (Untitled UI Standard) with Tests

**Files:**
- Create: `src/components/navigation/Sidebar.jsx`
- Create: `src/components/navigation/Sidebar.test.jsx`

- [ ] **Step 1:** Write failing tests in `src/components/navigation/Sidebar.test.jsx` covering:
  - Branding header renders "AI-Tax-Agent" and "KAP Zaidan Jauhari".
  - Renders navigation links: "Daftar Klien", "Buku Besar", "AI Tax & KKP", "Partner Dashboard", and "Admin" (if `isAdmin` is true).
  - Highlights the currently active `viewMode` with Untitled UI active styling.
  - Triggers `onSelectViewMode` and `onBackToClientHub` when menu items are clicked.
  - Renders Workspace Switcher card with client name and tax year when `clientInfo` is present.
  - Toggles collapse state when desktop collapse button is clicked.
  - User profile section displays user avatar, full name, role badge, theme toggle button, and logout button.
  - Clicking logout triggers `onSignOut`.
  - Clicking theme toggle triggers `onToggleTheme`.
- [ ] **Step 2:** Run `npx vitest run src/components/navigation/Sidebar.test.jsx` to confirm test failures.
- [ ] **Step 3:** Implement `src/components/navigation/Sidebar.jsx`:
  - **Header:** App logo (`logoImage`), title `AI-Tax-Agent`, subtitle `KAP Zaidan Jauhari`, and desktop collapse toggle button (`PanelLeftClose` / `PanelLeftOpen`).
  - **Workspace Switcher Card:** Compact Untitled UI client card with `Building2` icon, client name, tax year badge, format badge, and switcher dropdown (`projects` list).
  - **Main Nav Items:** Nav buttons with icons (`LayoutGrid`, `Table`, `Scale`, `LayoutDashboard`, `Shield`), active pill indicator (`motion.div` layoutId or crisp Untitled UI active state), and badges (findings count, row count).
  - **Utilitas Data Group:** Proyek (.aitax) dropdown (Simpan/Buka) and Ekspor (Excel/CSV) dropdown, plus Reset workflow button.
  - **Account Footer Card:** Avatar with user initials, full name, email, role badge (`Admin`/`Analyst`), Theme toggle button (Sun/Moon), and Logout button (`LogOut` icon).
  - Radix `Tooltip` support for all buttons in collapsed mode.
- [ ] **Step 4:** Run `npx vitest run src/components/navigation/Sidebar.test.jsx` and ensure all tests pass.

---

### Task 4: Integrate `Sidebar` and `AppHeader` into `App.jsx` Shell

**Files:**
- Modify: `src/App.jsx:1163-1215`
- Modify: `src/components/Topbar.jsx` (maintain compatibility or wrap)
- Test: `src/App.test.jsx`
- Test: `src/components/Topbar.test.jsx`

- [ ] **Step 1:** In `src/App.jsx`, add state for `isSidebarCollapsed` (persisted in `localStorage`, default `false`) and `isMobileMenuOpen` (boolean, default `false`).
- [ ] **Step 2:** Replace the horizontal `Topbar` in `App.jsx` with the responsive `Sidebar` on the left and `AppHeader` at the top of the main content column.
- [ ] **Step 3:** Ensure responsive layout:
  - Sidebar fixed/sticky on desktop (`hidden lg:flex flex-col shrink-0`).
  - Sidebar mobile drawer with backdrop overlay (`fixed inset-0 z-50 lg:hidden`).
  - Main viewport container: `flex-1 flex flex-col min-w-0 h-screen overflow-hidden`.
  - Main content area: `flex-1 overflow-y-auto`.
- [ ] **Step 4:** Keep `src/components/Topbar.jsx` updated or adapter-wrapped so existing tests in `src/components/Topbar.test.jsx` pass seamlessly.
- [ ] **Step 5:** Run `npm test -- --run` across the entire codebase to verify all 33+ test suites pass without regression.

---

### Task 5: Design Polish & Verification (Anti-Slop & Untitled UI Review)

**Files:**
- Check: `src/components/navigation/Sidebar.jsx`
- Check: `src/components/navigation/AppHeader.jsx`
- Check: `src/index.css`

- [ ] **Step 1:** Verify color contrast (4.5:1 ratio for text against surface), focus-visible rings (`focus-visible:ring-2 focus-visible:ring-primary`), and dark/light mode consistency.
- [ ] **Step 2:** Check responsive viewports (Mobile 375px, Tablet 768px, Desktop 1280px, Ultra-wide 1920px) to ensure zero horizontal scroll overflow.
- [ ] **Step 3:** Run linter (`npm run lint` or `npx oxlint`) and build check (`npm run build`) to ensure zero bundle errors or type/syntax issues.
- [ ] **Step 4:** Run `graphify update .` to keep the project knowledge graph current.

