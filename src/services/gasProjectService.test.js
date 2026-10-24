import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  saveProjectToCloud,
  fetchCloudProjects,
  loadProjectFromCloud,
  deleteProjectFromCloud
} from './gasProjectService';

describe('gasProjectService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('saveProjectToCloud mengembalikan error jika snapshot kosong', async () => {
    const res = await saveProjectToCloud(null, { email: 'analyst@kap.com' });
    expect(res.success).toBe(false);
    expect(res.message).toContain('tidak boleh kosong');
  });

  it('saveProjectToCloud mengembalikan error jika user tidak login', async () => {
    const res = await saveProjectToCloud({ clientInfo: { name: 'PT ABC' } }, null);
    expect(res.success).toBe(false);
    expect(res.message).toContain('harus login');
  });

  it('saveProjectToCloud berhasil memanggil fetch dengan payload yang benar', async () => {
    const mockResponse = { success: true, message: 'Saved' };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse
    });

    const snapshot = {
      projectId: 'proj_123',
      clientInfo: { name: 'PT Maju Terus', npwp: '01.234.567.8-999.000', taxYear: '2024' },
      glRows: [{ id: 1 }, { id: 2 }],
      findings: [{ findingId: 'F-1' }]
    };

    const res = await saveProjectToCloud(snapshot, { email: 'staff@kap.com', role: 'analyst' });
    expect(res.success).toBe(true);
    expect(global.fetch).toHaveBeenCalledTimes(1);

    const callArg = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(callArg.action).toBe('saveProject');
    expect(callArg.project_id).toBe('proj_123');
    expect(callArg.client_name).toBe('PT Maju Terus');
    expect(callArg.total_rows).toBe(2);
    expect(callArg.findings_count).toBe(1);
    expect(callArg.user_email).toBe('staff@kap.com');
  });

  it('fetchCloudProjects memanggil endpoint dengan user_email dan user_role', async () => {
    const mockProjects = [{ project_id: 'p1', client_name: 'PT Klien A' }];
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, projects: mockProjects })
    });

    const res = await fetchCloudProjects({ email: 'partner@kap.com', role: 'partner' });
    expect(res.success).toBe(true);
    expect(res.projects).toEqual(mockProjects);

    const callArg = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(callArg.action).toBe('listProjects');
    expect(callArg.user_email).toBe('partner@kap.com');
    expect(callArg.user_role).toBe('partner');
  });

  it('loadProjectFromCloud dan deleteProjectFromCloud menangani network failure dengan graceful message', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network offline'));

    const loadRes = await loadProjectFromCloud('p1', { email: 'user@kap.com' });
    expect(loadRes.success).toBe(false);
    expect(loadRes.message).toContain('Periksa koneksi');

    const delRes = await deleteProjectFromCloud('p1', { email: 'user@kap.com' });
    expect(delRes.success).toBe(false);
    expect(delRes.message).toContain('Periksa koneksi');
  });
});

