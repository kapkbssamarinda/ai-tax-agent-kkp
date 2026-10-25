import { test, expect } from '@playwright/test';

const SAMPLE_AUTH_ADMIN = {
  user: {
    id: 'admin@kkp.com',
    email: 'admin@kkp.com',
    full_name: 'Zaidan Jauhari',
    role: 'admin',
    is_active: true
  },
  savedAt: Date.now()
};

const SAMPLE_PROJECT_DRAFT = {
  version: '1.0.0',
  appName: 'AI-Tax-Agent',
  savedAt: new Date().toISOString(),
  clientInfo: {
    name: 'PT Wajib Pajak Bahagia',
    npwp: '01.234.567.8-012.000',
    taxYear: '2024',
    partnerName: 'Zaidan Jauhari, BKP',
    auditDate: '2025-01-15'
  },
  fileMeta: {
    fileName: 'GL_Sample.xlsx',
    sourceFormat: 'Accurate',
    totalRows: 2,
    currentColumns: [
      { key: 'tanggal', label: 'Tanggal' },
      { key: 'coa', label: 'COA' },
      { key: 'namaAkun', label: 'Nama Akun' },
      { key: 'keterangan', label: 'Keterangan' },
      { key: 'debit', label: 'Debit', isNumeric: true },
      { key: 'kredit', label: 'Kredit', isNumeric: true },
      { key: 'balance', label: 'Balance', isNumeric: true }
    ]
  },
  glRows: [
    { id: '1', tanggal: '02/01/2024', coa: '4-1000', namaAkun: 'Penjualan Barang Jadi', debit: 0, kredit: 150000000, balance: 150000000 },
    { id: '2', tanggal: '05/01/2024', coa: '5-2000', namaAkun: 'Beban Jasa Konsultan', debit: 15000000, kredit: 0, balance: 15000000 }
  ],
  taxMappings: [
    { namaAkun: 'Penjualan Barang Jadi', category: 'REVENUE_PPN', coa: '4-1000' },
    { namaAkun: 'Beban Jasa Konsultan', category: 'EXPENSE_PPH23', coa: '5-2000' }
  ],
  revenueRecon: { glRevenueTotal: 150000000, sptDPPTotal: 150000000, difference: 0 },
  expenseRecon: { glExpenseTotal: 15000000, bupotDPPTotal: 15000000, unmatchedDPP: 0 },
  payrollRecon: { glPayrollTotal: 0, sptBrutoTotal: 0, unmatchedBase: 0 },
  finalTaxRecon: { glFinalTaxTotal: 0, bupotDPPTotal: 0, unmatchedBase: 0 },
  findings: [
    {
      id: 'f-1',
      category: 'PPH23',
      taxType: 'PPh 23',
      coa: '5-2000',
      accountName: 'Beban Jasa Konsultan',
      glAmount: 15000000,
      potentialExposure: 300000,
      interestPenalty: 0,
      totalRisk: 300000,
      riskScore: 65,
      riskLevel: 'MEDIUM',
      legalBasis: 'Pasal 23 UU PPh',
      recommendation: 'Lakukan pemotongan PPh 23 2%',
      status: 'REQUIRES DOCUMENT'
    }
  ],
  uiState: { viewMode: 'TAX_AGENT' }
};

test.describe('UI Redesign & Permanent Light Mode Verification', () => {
  test('1. Permanent Swiss Light Mode: no dark class, light canvas background', async ({ page }) => {
    await page.goto('/');

    // Validate html tag has no dark class
    const htmlEl = page.locator('html');
    await expect(htmlEl).not.toHaveClass(/dark/);

    // Validate background is light tone #f4f6fa (rgb(244, 246, 250))
    const bodyBg = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor;
    });
    expect(bodyBg).toBe('rgb(244, 246, 250)');

    // Ensure theme toggle is purged
    await expect(page.getByLabel(/Toggle Mode Gelap\/Terang/i)).not.toBeVisible();
  });

  test('2. Modern Navigation Sidebar & AppHeader: brand typography, action buttons', async ({ page }) => {
    await page.addInitScript(({ auth }) => {
      localStorage.setItem('aitax_auth_session', JSON.stringify(auth));
    }, { auth: SAMPLE_AUTH_ADMIN });

    await page.goto('/');

    // Brand title and badge in Sidebar
    await expect(page.getByText('AI-Tax-Agent', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('KKP', { exact: true })).toBeVisible();

    // AppHeader Cek AI action button with colorful accents
    await expect(page.getByRole('button', { name: /Cek Status Koneksi AI/i })).toBeVisible();

    // User profile section in sidebar
    await expect(page.getByText('Zaidan Jauhari').first()).toBeVisible();
  });

  test('3. Partner Dashboard: colorful KPI ribbons and executive banner', async ({ page }) => {
    await page.addInitScript(({ auth, draft }) => {
      localStorage.setItem('aitax_auth_session', JSON.stringify(auth));
      localStorage.setItem('ai_tax_project_draft_kkp_admin@kkp.com', JSON.stringify(draft));
    }, { auth: SAMPLE_AUTH_ADMIN, draft: SAMPLE_PROJECT_DRAFT });

    await page.goto('/');

    // Restore saved session
    const restoreBtn = page.getByRole('button', { name: /Pulihkan Sesi/i });
    await expect(restoreBtn).toBeVisible();
    await restoreBtn.click();

    // Switch to Partner Dashboard via Sidebar
    const partnerBtn = page.getByRole('button', { name: /Partner Dashboard/i });
    await expect(partnerBtn).toBeVisible();
    await partnerBtn.click();

    // Check Hero Banner
    await expect(page.getByText(/Partner Executive Summary & Risk Dashboard/i)).toBeVisible();
    await expect(page.getByRole('heading', { name: /PT Wajib Pajak Bahagia/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Download KKP 13-Sheet/i })).toBeVisible();

    // Check KPI cards (Semantic UI Segment with color ribbons)
    await expect(page.getByText(/Total Potential Tax Exposure/i)).toBeVisible();
    await expect(page.getByText(/Critical & High Risk Findings/i)).toBeVisible();
    await expect(page.getByText(/Overall Tax Risk Level/i)).toBeVisible();
  });

  test('4. Tax Recon Workbench: AuditStepper and color-coded category tabs', async ({ page }) => {
    await page.addInitScript(({ auth, draft }) => {
      localStorage.setItem('aitax_auth_session', JSON.stringify(auth));
      localStorage.setItem('ai_tax_project_draft_kkp_admin@kkp.com', JSON.stringify(draft));
    }, { auth: SAMPLE_AUTH_ADMIN, draft: SAMPLE_PROJECT_DRAFT });

    await page.goto('/');

    // Restore saved session
    const restoreBtn = page.getByRole('button', { name: /Pulihkan Sesi/i });
    await expect(restoreBtn).toBeVisible();
    await restoreBtn.click();

    // Switch to Tax Recon Workbench (AI Tax & KKP)
    const taxReconBtn = page.getByRole('button', { name: /AI Tax & KKP/i });
    await expect(taxReconBtn).toBeVisible();
    await taxReconBtn.click();

    // Check AuditStepper
    await expect(page.getByText(/Alur Pemeriksaan Pajak & KKP/i)).toBeVisible();
    await expect(page.getByText(/Tahap 3: Rekonsiliasi & Pemeriksaan AI Aktif/i)).toBeVisible();

    // Check vibrant category tabs
    await expect(page.getByRole('tab', { name: /Ekualisasi Omzet vs PPN/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Ekualisasi Biaya vs PPh 23/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Ekualisasi Gaji/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Ekualisasi Sewa/i })).toBeVisible();
  });

  test('5. Client Hub: controls, search, and action buttons', async ({ page }) => {
    await page.addInitScript(({ auth }) => {
      localStorage.setItem('aitax_auth_session', JSON.stringify(auth));
    }, { auth: SAMPLE_AUTH_ADMIN });

    await page.goto('/');

    // Navigate to Client Hub via Sidebar
    await page.getByRole('button', { name: /Daftar Klien/i }).click();

    // Client Hub controls
    await expect(page.getByRole('heading', { name: /Daftar Proyek Klien/i })).toBeVisible();
    await expect(page.getByPlaceholder(/Cari nama klien atau NPWP/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Tambah Klien Baru/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Refresh|Segarkan/i }).first()).toBeVisible();
  });

  test('6. Sidebar Collapse & Expand: no collision, vertical stacked icon and button', async ({ page }) => {
    await page.addInitScript(({ auth }) => {
      localStorage.setItem('aitax_auth_session', JSON.stringify(auth));
    }, { auth: SAMPLE_AUTH_ADMIN });

    await page.goto('/');

    const collapseBtn = page.getByLabel(/Ciutkan sidebar/i);
    await expect(collapseBtn).toBeVisible();
    await collapseBtn.click();

    // In collapsed state, expand button should be visible and accessible
    const expandBtn = page.getByLabel(/Perluas sidebar/i);
    await expect(expandBtn).toBeVisible();

    // Verify logo and expand button do not collide
    const sidebar = page.locator('aside').first();
    await expect(sidebar).toHaveClass(/w-\[72px\]/);

    // Expand sidebar back
    await expandBtn.click();
    await expect(sidebar).toHaveClass(/w-\[260px\]/);
  });

  test('7. Admin Console: executive banner, responsive form, and high-contrast table', async ({ page }) => {
    await page.addInitScript(({ auth }) => {
      localStorage.setItem('aitax_auth_session', JSON.stringify(auth));
    }, { auth: SAMPLE_AUTH_ADMIN });

    await page.goto('/');

    // Open Admin Dashboard via Sidebar
    const adminBtn = page.getByRole('button', { name: /Admin Dashboard/i });
    await expect(adminBtn).toBeVisible();
    await adminBtn.click();

    // Verify Executive Header
    await expect(page.getByRole('heading', { name: /Kelola Pengguna Whitelist KKP/i })).toBeVisible();
    await expect(page.getByText(/Admin Console/i)).toBeVisible();

    // Verify Daftarkan Pengguna Segment Form
    await expect(page.getByText(/Daftarkan Pengguna ke Whitelist/i)).toBeVisible();
    await expect(page.getByPlaceholder(/Contoh: Andi Pratama/i)).toBeVisible();
    await expect(page.getByPlaceholder(/andi@gmail.com/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Tambah ke Whitelist/i })).toBeVisible();

    // Verify Table & Toolbar
    await expect(page.getByText(/Daftar Whitelist Pengguna/i)).toBeVisible();
    await expect(page.getByPlaceholder(/Cari berdasarkan nama lengkap atau email/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Muat Ulang/i })).toBeVisible();
  });
});
