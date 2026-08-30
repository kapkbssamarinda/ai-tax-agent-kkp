/**
 * Vercel Serverless Function — Claude API Proxy & AI Usage Logger
 * API key tersimpan aman di Vercel Environment Variables.
 * Rate limiting: 10 panggilan per user per jam.
 * Asynchronous Logging ke tabel Supabase ai_usage_logs.
 *
 * Vercel Environment Variables:
 *   CLAUDE_API_KEY       = sk-ant-api03-xxxxx...
 *   SUPABASE_URL         = https://xxx.supabase.co
 *   SUPABASE_SERVICE_KEY = eyJ... (service_role key)
 */
import { createClient } from '@supabase/supabase-js';

// Rate limiter per user (in-memory — reset setiap cold start)
const rateLimitMap = new Map();
const RATE_LIMIT_MAX = 15;        // Maksimum 15 request per user per jam
const RATE_LIMIT_WINDOW = 3600000; // Per 1 jam (3600 detik)

const PRICING_RATES = {
  haiku: { input: 0.25, output: 1.25 }, // USD per 1M tokens
  sonnet: { input: 3.00, output: 15.00 } // USD per 1M tokens
};

function calculateCost(model, inputTokens = 0, outputTokens = 0) {
  const isHaiku = String(model || '').toLowerCase().includes('haiku');
  const tier = isHaiku ? 'haiku' : 'sonnet';
  const rate = PRICING_RATES[tier] || PRICING_RATES.sonnet;
  const cost = (inputTokens / 1_000_000) * rate.input + (outputTokens / 1_000_000) * rate.output;
  return {
    tier,
    estimatedCostUSD: Number(cost.toFixed(6))
  };
}

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

  // Ambil API key dari environment variables
  const apiKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.VITE_CLAUDE_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'Konfigurasi server: CLAUDE_API_KEY / ANTHROPIC_API_KEY belum diatur di Environment Variables.'
    });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  let supabaseAdmin = null;
  if (supabaseUrl && serviceKey) {
    supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
  }

  // Ambil data request body
  const { model, max_tokens, system, messages, user_id, feature, client_name, tax_year } = req.body;

  let effectiveUserId = user_id || null;
  let effectiveEmail = null;
  let effectiveName = null;

  // Verifikasi JWT token jika tersedia di header Authorization
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ') && supabaseAdmin) {
    try {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user: verifiedUser } } = await supabaseAdmin.auth.getUser(token);
      if (verifiedUser) {
        effectiveUserId = verifiedUser.id;
        effectiveEmail = verifiedUser.email;
        effectiveName = verifiedUser.user_metadata?.full_name || verifiedUser.email?.split('@')[0] || '';
      }
    } catch (e) {
      console.warn('Token verification error:', e);
    }
  }

  // Rate limiting per user
  const rateCheck = checkRateLimit(effectiveUserId);
  if (!rateCheck.allowed) {
    return res.status(429).json({
      error: `Batas kecepatan penggunaan AI tercapai (maksimum ${RATE_LIMIT_MAX} analisis per jam). Silakan coba lagi dalam ${rateCheck.resetInMinutes} menit.`,
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

  // Pemeriksaan Kuota Bulanan Staf (jika user_id dan Supabase tersedia)
  if (effectiveUserId && supabaseAdmin) {
    try {
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

      // Cek kuota profil
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('monthly_token_quota, monthly_cost_limit_usd, full_name, email, role')
        .eq('id', effectiveUserId)
        .single();

      if (profile) {
        if (!effectiveEmail) effectiveEmail = profile.email;
        if (!effectiveName) effectiveName = profile.full_name || profile.email?.split('@')[0];

        // Partner / Admin dikecualikan dari batas kuota
        const isExempt = profile.role === 'admin' || profile.role === 'partner';
        if (!isExempt) {
          const quotaLimit = profile.monthly_token_quota || 1000000;
          const costLimit = Number(profile.monthly_cost_limit_usd) || 10.00;

          // Agregasi penggunaan bulan ini
          const { data: usageAgg } = await supabaseAdmin
            .from('ai_usage_logs')
            .select('total_tokens, estimated_cost_usd')
            .eq('user_id', effectiveUserId)
            .gte('created_at', startOfMonth);

          const currentMonthTokens = (usageAgg || []).reduce((acc, row) => acc + (row.total_tokens || 0), 0);
          const currentMonthCost = (usageAgg || []).reduce((acc, row) => acc + Number(row.estimated_cost_usd || 0), 0);

          if (currentMonthTokens >= quotaLimit || currentMonthCost >= costLimit) {
            // Catat log QUOTA_EXCEEDED
            supabaseAdmin.from('ai_usage_logs').insert({
              user_id: effectiveUserId,
              user_email: effectiveEmail,
              user_name: effectiveName,
              feature: feature || 'general',
              model,
              tier: String(model).includes('haiku') ? 'haiku' : 'sonnet',
              input_tokens: 0,
              output_tokens: 0,
              total_tokens: 0,
              estimated_cost_usd: 0,
              client_name: client_name || null,
              tax_year: tax_year || null,
              status: 'QUOTA_EXCEEDED'
            }).then(() => {}).catch(() => {});

            return res.status(403).json({
              error: `Batas kuota bulanan AI staf telah tercapai (${currentMonthTokens.toLocaleString('id-ID')} / ${quotaLimit.toLocaleString('id-ID')} Tokens). Silakan hubungi Partner / Administrator untuk penyesuaian kuota.`,
              quotaExceeded: true,
              currentTokens: currentMonthTokens,
              limitTokens: quotaLimit
            });
          }
        }
      }
    } catch (quotaErr) {
      console.warn('Quota check non-blocking warning:', quotaErr);
    }
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

    // Hitung token dan biaya
    const inputTokens = Number(data.usage?.input_tokens) || 0;
    const outputTokens = Number(data.usage?.output_tokens) || 0;
    const { tier, estimatedCostUSD } = calculateCost(model, inputTokens, outputTokens);

    // Asynchronous Logging ke database Supabase (Non-blocking)
    if (effectiveUserId && supabaseAdmin && response.ok) {
      supabaseAdmin.from('ai_usage_logs').insert({
        user_id: effectiveUserId,
        user_email: effectiveEmail,
        user_name: effectiveName,
        feature: feature || 'general',
        model,
        tier,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        total_tokens: inputTokens + outputTokens,
        estimated_cost_usd: estimatedCostUSD,
        client_name: client_name || null,
        tax_year: tax_year || null,
        status: 'SUCCESS'
      }).then(() => {}).catch(logErr => {
        console.warn('Async usage log insert failed:', logErr.message);
      });
    }

    // Sertakan info header
    res.setHeader('X-RateLimit-Remaining', String(rateCheck.remaining));
    res.setHeader('X-AI-Input-Tokens', String(inputTokens));
    res.setHeader('X-AI-Output-Tokens', String(outputTokens));
    res.setHeader('X-AI-Cost-USD', String(estimatedCostUSD));

    return res.status(response.ok ? 200 : response.status).json(data);
  } catch (err) {
    console.error('Claude API proxy error:', err);
    return res.status(502).json({
      error: `Gagal menghubungi Anthropic API: ${err.message}`
    });
  }
}

