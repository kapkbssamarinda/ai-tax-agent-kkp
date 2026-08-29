/**
 * Vercel Serverless Function — Claude API Proxy
 * API key tersimpan aman di Vercel Environment Variables.
 * Rate limiting: 10 panggilan per user per jam.
 *
 * Vercel Environment Variables yang dibutuhkan:
 *   CLAUDE_API_KEY = sk-ant-api03-xxxxx...
 */

// Rate limiter per user (in-memory — reset setiap cold start)
const rateLimitMap = new Map();
const RATE_LIMIT_MAX = 10;        // Maksimum 10 request per user
const RATE_LIMIT_WINDOW = 3600000; // Per 1 jam (3600 detik)

function checkRateLimit(userId) {
  const now = Date.now();
  const key = userId || 'anonymous';
  const timestamps = (rateLimitMap.get(key) || []).filter(t => now - t < RATE_LIMIT_WINDOW);
  if (timestamps.length >= RATE_LIMIT_MAX) {
    const oldestTimestamp = timestamps[0];
    const resetInMinutes = Math.ceil((RATE_LIMIT_WINDOW - (now - oldestTimestamp)) / 60000);
    return { allowed: false, remaining: 0, resetInMinutes };
  }
  timestamps.push(now);
  rateLimitMap.set(key, timestamps);
  return { allowed: true, remaining: RATE_LIMIT_MAX - timestamps.length, resetInMinutes: 0 };
}

export default async function handler(req, res) {
  // Hanya izinkan POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Gunakan POST.' });
  }

  // Ambil API key dari Vercel env
  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'Konfigurasi server: CLAUDE_API_KEY belum diatur di Vercel Environment Variables.'
    });
  }

  // Ambil user_id dari request body untuk rate limiting
  const { model, max_tokens, system, messages, user_id } = req.body;

  // Rate limiting per user
  const rateCheck = checkRateLimit(user_id);
  if (!rateCheck.allowed) {
    return res.status(429).json({
      error: `Batas penggunaan AI tercapai (maksimum ${RATE_LIMIT_MAX} analisis per jam). Silakan coba lagi dalam ${rateCheck.resetInMinutes} menit.`,
      remaining: 0,
      resetInMinutes: rateCheck.resetInMinutes
    });
  }

  // Validasi request body
  if (!model || !messages || !Array.isArray(messages)) {
    return res.status(400).json({
      error: 'Request body tidak valid. Wajib memiliki field: model, messages (array).'
    });
  }

  // Teruskan request ke Anthropic API
  try {
    const anthropicBody = {
      model,
      max_tokens: max_tokens || 4096,
      messages
    };

    if (system && typeof system === 'string' && system.trim().length > 0) {
      anthropicBody.system = system;
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify(anthropicBody)
    });

    const data = await response.json();

    // Sertakan info sisa kuota di response header
    res.setHeader('X-RateLimit-Remaining', String(rateCheck.remaining));

    return res.status(response.ok ? 200 : response.status).json(data);
  } catch (err) {
    console.error('Claude API proxy error:', err);
    return res.status(502).json({
      error: `Gagal menghubungi Anthropic API: ${err.message}`
    });
  }
}

