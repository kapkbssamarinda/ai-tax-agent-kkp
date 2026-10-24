import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  loginWithGas,
  fetchUsers,
  addUser,
  updateUser,
  deleteUser
} from './gasAuthService';

describe('gasAuthService', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('loginWithGas', () => {
    it('returns success and user object when GAS responds with success', async () => {
      const mockUser = {
        id: 'staff@kkp.com',
        email: 'staff@kkp.com',
        full_name: 'Staff Tax',
        role: 'analyst',
        picture: 'https://photo.jpg',
        is_active: true
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          message: 'Login berhasil',
          user: mockUser
        })
      });

      const res = await loginWithGas({
        email: 'staff@kkp.com',
        name: 'Staff Tax',
        picture: 'https://photo.jpg'
      });

      expect(res.success).toBe(true);
      expect(res.user.email).toBe('staff@kkp.com');
      expect(res.user.role).toBe('analyst');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: expect.stringContaining('"action":"login"')
        })
      );
    });

    it('returns failure message when user is not whitelisted', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: false,
          message: 'Email belum terdaftar di whitelist'
        })
      });

      const res = await loginWithGas({
        email: 'unknown@gmail.com',
        name: 'Stranger'
      });

      expect(res.success).toBe(false);
      expect(res.message).toContain('whitelist');
    });

    it('handles network / fetch failure gracefully', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network offline'));

      const res = await loginWithGas({
        email: 'staff@kkp.com'
      });

      expect(res.success).toBe(false);
      expect(res.message).toMatch(/koneksi|jaringan|gagal/i);
    });
  });

  describe('fetchUsers', () => {
    it('fetches user list with requesterEmail and secretToken', async () => {
      const mockUsers = [
        { email: 'admin@kkp.com', full_name: 'Admin', role: 'admin', status: 'Active' }
      ];

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          users: mockUsers
        })
      });

      const res = await fetchUsers('admin@kkp.com');
      expect(res.success).toBe(true);
      expect(res.users).toHaveLength(1);
      expect(res.users[0].email).toBe('admin@kkp.com');
    });
  });

  describe('addUser, updateUser, deleteUser', () => {
    it('adds new user successfully', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          message: 'User berhasil didaftarkan'
        })
      });

      const res = await addUser('admin@kkp.com', {
        email: 'newbie@kkp.com',
        fullName: 'Newbie Tax',
        role: 'analyst'
      });

      expect(res.success).toBe(true);
    });

    it('updates user role or status', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          message: 'Data user berhasil diperbarui'
        })
      });

      const res = await updateUser('admin@kkp.com', {
        email: 'staff@kkp.com',
        role: 'admin',
        status: 'Active'
      });

      expect(res.success).toBe(true);
    });

    it('deletes user from whitelist', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          message: 'User berhasil dihapus'
        })
      });

      const res = await deleteUser('admin@kkp.com', 'former@kkp.com');
      expect(res.success).toBe(true);
    });
  });
});

