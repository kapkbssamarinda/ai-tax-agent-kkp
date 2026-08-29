/**
 * Vercel Serverless Function — Admin User Management
 * Menggunakan Supabase service_role key untuk create/delete auth users.
 * HANYA dapat dipanggil oleh admin (validasi via Supabase Auth).
 *
 * Vercel Environment Variables:
 *   SUPABASE_URL         = https://xxx.supabase.co
 *   SUPABASE_SERVICE_KEY  = eyJ... (service_role key, bukan anon key)
 */
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({ error: 'Supabase service key belum dikonfigurasi di server.' });
  }

  // Supabase client dengan service role (bypass RLS, akses admin penuh)
  const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  // Validasi: Ambil token user yang memanggil dan cek apakah dia admin
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token autentikasi tidak ditemukan.' });
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user: callerUser }, error: authError } = await supabaseAdmin.auth.getUser(token);

  if (authError || !callerUser) {
    return res.status(401).json({ error: 'Token tidak valid atau sudah kedaluwarsa.' });
  }

  // Cek role admin di tabel profiles
  const { data: callerProfile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', callerUser.id)
    .single();

  if (!callerProfile || callerProfile.role !== 'admin') {
    return res.status(403).json({ error: 'Akses ditolak. Hanya administrator yang dapat mengelola pengguna.' });
  }

  const { action, email, password, full_name, role, userId, is_active } = req.body;

  // === LIST USERS (Bypass RLS safely for verified admin) ===
  if (action === 'list') {
    const { data: userList, error: listError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (listError) {
      return res.status(500).json({ error: listError.message });
    }
    return res.status(200).json({ users: userList || [] });
  }

  // === CREATE USER ===
  if (action === 'create') {
    if (!email || !password) {
      return res.status(400).json({ error: 'Email dan password wajib diisi.' });
    }

    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Otomatis konfirmasi email
      user_metadata: {
        full_name: full_name || '',
        role: role || 'analyst'
      }
    });

    if (createError) {
      return res.status(400).json({ error: `Gagal membuat pengguna: ${createError.message}` });
    }

    return res.status(201).json({ success: true, user: { id: newUser.user.id, email } });
  }

  // === UPDATE USER (Profile, Role, Password, Active Status) ===
  if (action === 'update') {
    if (!userId) {
      return res.status(400).json({ error: 'userId wajib diisi untuk mengupdate pengguna.' });
    }

    // 1. Update di Supabase Auth (metadata dan password bila ada)
    const updateAuthPayload = {
      user_metadata: {
        full_name: full_name || '',
        role: role || 'analyst'
      }
    };

    if (password && typeof password === 'string' && password.trim().length >= 6) {
      updateAuthPayload.password = password.trim();
    }

    const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      updateAuthPayload
    );

    if (authUpdateError) {
      return res.status(400).json({ error: `Gagal update auth: ${authUpdateError.message}` });
    }

    // 2. Update di tabel profiles
    const profilePayload = {
      full_name: full_name || '',
      role: role || 'analyst',
      updated_at: new Date().toISOString()
    };

    if (typeof is_active === 'boolean') {
      profilePayload.is_active = is_active;
    }

    const { error: profileUpdateError } = await supabaseAdmin
      .from('profiles')
      .update(profilePayload)
      .eq('id', userId);

    if (profileUpdateError) {
      return res.status(400).json({ error: `Gagal update profile: ${profileUpdateError.message}` });
    }

    return res.status(200).json({ success: true });
  }

  // === DELETE USER ===
  if (action === 'delete') {
    if (!userId) {
      return res.status(400).json({ error: 'userId wajib diisi untuk menghapus pengguna.' });
    }

    // Jangan izinkan admin menghapus dirinya sendiri
    if (userId === callerUser.id) {
      return res.status(400).json({ error: 'Anda tidak dapat menghapus akun Anda sendiri.' });
    }

    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      return res.status(400).json({ error: `Gagal menghapus pengguna: ${deleteError.message}` });
    }

    return res.status(200).json({ success: true });
  }

  return res.status(400).json({ error: 'Action tidak dikenali. Gunakan "create", "update", atau "delete".' });
}

