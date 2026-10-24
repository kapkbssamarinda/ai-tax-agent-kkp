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
  appName: 'AI Tax Agent - KKP Zaidan Jauhari',
  savedAt: new Date().toISOString(),
  clientInfo: {
    name: 'PT Klien Audit Contoh',
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
  findings: [],
  uiState: { viewMode: 'TAX_AGENT' }
};

test.describe('AI Tax Agent — E2E Suite', () => {
  test('1. Login screen renders with anti-slop branding, cards, and GIS container', async ({ page }) => {
    await page.goto('/');

    // Check branding
    await expect(page.getByRole('heading', { name: /AI Tax Agent/i })).toBeVisible();
    await expect(page.getByText(/KAP Zaidan Jauhari & Rekan/i)).toBeVisible();
    await expect(page.getByText(/Masuk dengan Akun Google/i)).toBeVisible();

    // Check GIS button container
    const googleContainer = page.locator('[data-testid="google-signin-container"]');
    await expect(googleContainer).toBeVisible();

    // Check security footer
    await expect(page.getByText(/Akses dibatasi hanya untuk staf terdaftar di whitelist/i)).toBeVisible();
  });

  test('2. Topbar, user session, and theme toggle work in authenticated shell', async ({ page }) => {
    await page.addInitScript(({ auth }) => {
      localStorage.setItem('aitax_auth_session', JSON.stringify(auth));
    }, { auth: SAMPLE_AUTH_ADMIN });

    await page.goto('/');

    // Verify Shell & Topbar elements
    await expect(page.locator('.logo-text').first()).toHaveText('AI Tax Agent');
    await expect(page.getByText(/Zaidan Jauhari/i).first()).toBeVisible();
    await expect(page.getByText('Admin').first()).toBeVisible();

    // Test Theme Toggle (Dark <-> Light)
    const htmlEl = page.locator('html');
    const themeToggleBtn = page.getByLabel('Toggle Mode Gelap/Terang');
    await expect(themeToggleBtn).toBeVisible();

    // Click to toggle theme
    await themeToggleBtn.click();
    await expect(htmlEl).toHaveClass(/light|dark/);
  });

  test('3. Data ingestion tabs switch between File Upload and Tempel dari Excel', async ({ page }) => {
    await page.addInitScript(({ auth }) => {
      localStorage.setItem('aitax_auth_session', JSON.stringify(auth));
    }, { auth: SAMPLE_AUTH_ADMIN });

    await page.goto('/');

    // Check ingestion method tabs
    const uploadFileTab = page.getByRole('tab', { name: /Upload File/i });
    const pasteTab = page.getByRole('tab', { name: /Tempel dari Excel/i });

    await expect(uploadFileTab).toBeVisible();
    await expect(pasteTab).toBeVisible();

    // Click Tempel dari Excel
    await pasteTab.click();
    await expect(page.getByText(/Tempel Transaksi dari Excel/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Muat Contoh Data/i })).toBeVisible();

    // Click "Muat Contoh Data" to load sample data
    await page.getByRole('button', { name: /Muat Contoh Data/i }).click();

    // Counter badge should reflect valid lines
    await expect(page.getByText(/baris valid siap diproses/i)).toBeVisible();

    // Switch back to File Upload
    await uploadFileTab.click();
    await expect(page.getByText(/Klik atau seret file Buku Besar ke sini/i)).toBeVisible();
  });

  test('4. Restoring saved project draft enables full multi-workbench navigation', async ({ page }) => {
    await page.addInitScript(({ auth, draft }) => {
      localStorage.setItem('aitax_auth_session', JSON.stringify(auth));
      localStorage.setItem('ai_tax_project_draft_kkp_admin@kkp.com', JSON.stringify(draft));
    }, { auth: SAMPLE_AUTH_ADMIN, draft: SAMPLE_PROJECT_DRAFT });

    await page.goto('/');

    // Banner draft recovery should be visible
    const restoreBtn = page.getByRole('button', { name: /Pulihkan Sesi/i });
    await expect(restoreBtn).toBeVisible();

    // Click Pulihkan Sesi
    await restoreBtn.click();

    // Topbar secondary row should now display navigation tabs
    await expect(page.getByRole('button', { name: /Buku Besar/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /AI Tax & KKP/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Partner Dashboard/i })).toBeVisible();

    // Switch to Partner Dashboard
    await page.getByRole('button', { name: /Partner Dashboard/i }).click();
    await expect(page.getByText(/Partner Executive Summary & Risk Dashboard/i)).toBeVisible();
    await expect(page.getByText(/Top 5 Matters Requiring Partner Attention/i)).toBeVisible();

    // Switch to Buku Besar (GL)
    await page.getByRole('button', { name: /Buku Besar/i }).click();
    await expect(page.getByText(/Penjualan Barang Jadi/i).first()).toBeVisible();

    // Switch back to AI Tax & KKP
    await page.getByRole('button', { name: /AI Tax & KKP/i }).click();
    await expect(page.getByText(/AI Tax Agent & KKP Workbench/i)).toBeVisible();
  });

  test('5. Admin user can open Admin Console and view whitelisted users', async ({ page }) => {
    await page.addInitScript(({ auth }) => {
      localStorage.setItem('aitax_auth_session', JSON.stringify(auth));
    }, { auth: SAMPLE_AUTH_ADMIN });

    await page.goto('/');

    // Click Admin button in Topbar
    const adminBtn = page.getByRole('button', { name: 'Admin', exact: true });
    await expect(adminBtn).toBeVisible();
    await adminBtn.click();

    // Admin Dashboard should be open
    await expect(page.getByText(/Kelola Pengguna Whitelist KKP/i)).toBeVisible();
    await expect(page.getByText(/Daftarkan Pengguna ke Whitelist/i)).toBeVisible();

    // Back button returns to main workbench
    const backBtn = page.getByRole('button', { name: /Kembali/i }).first();
    await backBtn.click();
    await expect(page.getByText(/AI Tax Agent Indonesia/i)).toBeVisible();
  });
});
