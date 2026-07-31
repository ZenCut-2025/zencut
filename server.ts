import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { randomUUID } from 'crypto';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import Stripe from 'stripe';

let stripeClient: Stripe | null = null;
function getStripe(): Stripe | null {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return null;
  return new Stripe(secretKey);
}

dotenv.config();

function getAppUrl(req: express.Request): string {
  const configured = process.env.APP_URL?.trim();
  if (configured && !configured.startsWith('MY_')) {
    return configured.replace(/\/$/, '');
  }
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
  return `${protocol}://${host}`;
}

function getOAuthRedirectUri(req: express.Request): string {
  const configured = process.env.GOOGLE_REDIRECT_URI?.trim();
  if (configured && !configured.startsWith('MY_')) {
    return configured;
  }
  return `${getAppUrl(req)}/api/auth/google/callback`;
}

if (!process.env.YOUTUBE_API_KEY) {
  console.warn('⚠️ YOUTUBE_API_KEY not set');
}

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const oauthSessionStore = new Map<string, { accessToken: string; refreshToken?: string; expiresAt: number }>();
const subscriptionStore = new Map<string, { plan: string; status: string; expiresAt?: number; updatedAt: number }>();

function issueOAuthSessionToken(accessToken: string, refreshToken?: string): string {
  const sessionToken = randomUUID();
  oauthSessionStore.set(sessionToken, {
    accessToken,
    refreshToken,
    expiresAt: Date.now() + 1000 * 60 * 60
  });
  return sessionToken;
}

function resolveOAuthAccessToken(input?: string): string | undefined {
  if (!input) return undefined;

  const cached = oauthSessionStore.get(input);
  if (cached) {
    if (cached.expiresAt <= Date.now()) {
      oauthSessionStore.delete(input);
      return undefined;
    }
    return cached.accessToken;
  }

  return input;
}

function isProAccessGranted(userEmail?: string, sessionToken?: string): boolean {
  if (userEmail && subscriptionStore.has(userEmail.toLowerCase())) {
    const record = subscriptionStore.get(userEmail.toLowerCase());
    if (record && (record.status === 'paid' || record.status === 'active')) {
      if (record.expiresAt && record.expiresAt <= Date.now()) {
        subscriptionStore.delete(userEmail.toLowerCase());
        return false;
      }
      return true;
    }
  }

  if (sessionToken) {
    const tokenRecord = oauthSessionStore.get(sessionToken);
    if (tokenRecord && tokenRecord.expiresAt > Date.now()) {
      return true;
    }
  }

  return false;
}

function setSubscriptionForUser(userEmail: string, plan: string, status: string, expiresAt?: number) {
  if (!userEmail) return;
  subscriptionStore.set(userEmail.toLowerCase(), {
    plan,
    status,
    expiresAt,
    updatedAt: Date.now()
  });
}

app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe) {
    return res.status(500).json({ error: 'Stripe is not configured' });
  }

  if (!webhookSecret) {
    return res.status(500).json({ error: 'STRIPE_WEBHOOK_SECRET is not configured' });
  }

  const signature = req.headers['stripe-signature'];
  if (!signature || typeof signature !== 'string') {
    return res.status(400).json({ error: 'Missing Stripe signature' });
  }

  try {
    const event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      const email = session.customer_details?.email || session.customer_email || session.metadata?.email;
      if (email) {
        setSubscriptionForUser(email, 'Creator Pro', 'paid', Date.now() + 1000 * 60 * 60 * 24 * 30);
      }
    } else if (event.type === 'invoice.paid') {
      const invoice = event.data.object as any;
      const email = invoice.customer_email || invoice.customer?.email || invoice.metadata?.email;
      if (email) {
        setSubscriptionForUser(email, 'Creator Pro', 'paid', Date.now() + 1000 * 60 * 60 * 24 * 30);
      }
    }

    return res.json({ received: true });
  } catch (err: any) {
    console.error('Stripe webhook verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }
});

app.use(express.json({ limit: '10mb' }));

// Helper to extract YouTube Video ID from URL or string
function extractVideoId(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();
  if (trimmed.length === 11 && !trimmed.includes('/') && !trimmed.includes('?')) {
    return trimmed;
  }
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = trimmed.match(regex);
  return match ? match[1] : trimmed;
}

// Helper to safely parse JSON from AI model outputs with automatic sanitization
function safeParseJSON(raw: string): any {
  if (!raw || typeof raw !== 'string') return {};

  let cleaned = raw
    .replace(/^```(?:json)?\s*/gi, '')
    .replace(/\s*```$/gi, '')
    .trim();

  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  // Attempt 1: Standard JSON parse
  try {
    return JSON.parse(cleaned);
  } catch (e1) {
    // Attempt 2: Sanitize common model syntax mistakes (trailing commas, unescaped tab/newlines in strings)
    try {
      let fixed = cleaned
        .replace(/,\s*([}\]])/g, '$1') // trailing commas
        .replace(/[\u0000-\u001F]+/g, (match) => { // unescaped control characters
          if (match === '\n') return '\\n';
          if (match === '\r') return '\\r';
          if (match === '\t') return '\\t';
          return '';
        });
      return JSON.parse(fixed);
    } catch (e2) {
      // Attempt 3: Regex match for outermost JSON structure
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) {
        const sanitized = match[0].replace(/,\s*([}\]])/g, '$1');
        return JSON.parse(sanitized);
      }
      throw e1;
    }
  }
}

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// ----------------------------------------------------
// GOOGLE OAUTH AUTHENTICATION ROUTES
// ----------------------------------------------------
// GOOGLE OAUTH AUTHENTICATION ROUTES
// ----------------------------------------------------

// Get Google OAuth Authorization URL & Status
app.get('/api/auth/google/url', (req, res) => {
  const baseUrl = getAppUrl(req);
  const redirectUri = getOAuthRedirectUri(req);
  const clientId = process.env.GOOGLE_CLIENT_ID || (req.query.clientId as string);

  if (!clientId) {
    return res.json({
      configured: false,
      authUrl: null,
      redirectUri,
      currentOriginUri: `${baseUrl.replace(/\/$/, '')}/api/auth/google/callback`,
      message: 'GOOGLE_CLIENT_ID is not configured in environment variables.'
    });
  }

  // Request profile, email and youtube.readonly scopes for fetching connected YouTube channels
  const scope = encodeURIComponent('openid profile email https://www.googleapis.com/auth/youtube.readonly');
  const stateObj = { redirectUri, timestamp: Date.now() };
  const state = encodeURIComponent(JSON.stringify(stateObj));

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&state=${state}&prompt=select_account`;

  return res.json({
    configured: true,
    authUrl,
    redirectUri,
    currentOriginUri: `${baseUrl.replace(/\/$/, '')}/api/auth/google/callback`
  });
});

// Direct Google OAuth Login Trigger
app.get('/api/auth/google/login', (req, res) => {
  const baseUrl = getAppUrl(req);
  const redirectUri = getOAuthRedirectUri(req);
  const clientId = process.env.GOOGLE_CLIENT_ID || (req.query.clientId as string);

  if (!clientId) {
    return res.status(400).send(`
      <!DOCTYPE html>
      <html>
        <head><title>Google Client ID Missing</title></head>
        <body style="font-family: system-ui, sans-serif; background: #0f172a; color: #fff; padding: 2rem; text-align: center;">
          <h2 style="color: #ef4444;">GOOGLE_CLIENT_ID Not Configured</h2>
          <p style="color: #94a3b8;">Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in environment variables.</p>
          <p style="font-size: 0.85rem; color: #64748b;">Expected Redirect URI: <code>${redirectUri}</code></p>
        </body>
      </html>
    `);
  }

  const scope = encodeURIComponent('openid profile email https://www.googleapis.com/auth/youtube.readonly');
  const stateObj = { redirectUri, timestamp: Date.now() };
  const state = encodeURIComponent(JSON.stringify(stateObj));

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&state=${state}&prompt=select_account`;

  res.redirect(authUrl);
});

// Google OAuth Authorization Code Callback
app.get('/api/auth/google/callback', async (req, res) => {
  const code = req.query.code as string;
  const error = req.query.error as string;
  const stateRaw = req.query.state as string;

  const baseUrl = getAppUrl(req);
  let redirectUri = getOAuthRedirectUri(req);
  if (stateRaw) {
    try {
      const parsedState = JSON.parse(decodeURIComponent(stateRaw));
      if (parsedState.redirectUri) {
        redirectUri = parsedState.redirectUri;
      }
    } catch (e) {
      console.warn('Could not parse state parameter in OAuth callback:', e);
    }
  }

  if (!code || error) {
    return res.redirect('/?auth_error=1');
  }

  let userPayload: any = null;

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('Google OAuth credentials are not configured');
    }

    // Exchange authorization code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.access_token) {
      throw new Error(tokenData.error_description || tokenData.error || 'Failed to exchange Google authorization code');
    }

    // Fetch user profile from Google UserInfo endpoint
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });

    if (!userRes.ok) {
      throw new Error(`Google profile fetch failed with status ${userRes.status}`);
    }

    const profile = await userRes.json();
    const sessionToken = issueOAuthSessionToken(tokenData.access_token, tokenData.refresh_token);
    const email = profile.email || '';
    if (email) {
      setSubscriptionForUser(email, 'Creator Pro', 'active', Date.now() + 1000 * 60 * 60 * 24 * 7);
    }
    userPayload = {
      id: profile.id || `g_${Date.now()}`,
      name: profile.name || profile.given_name || profile.email?.split('@')[0] || 'Google user',
      email,
      avatarUrl: profile.picture,
      plan: 'Creator Pro',
      accessToken: sessionToken,
      sessionToken
    };

    // Fetch user's connected YouTube channel if accessible
    try {
      const channelRes = await fetch('https://www.googleapis.com/youtube/v3/channels?mine=true&part=snippet,contentDetails,statistics', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` }
      });
      if (channelRes.ok) {
        const channelData = await channelRes.json();
        if (channelData.items && channelData.items.length > 0) {
          const ch = channelData.items[0];
          userPayload.channelInfo = {
            id: ch.id,
            title: ch.snippet.title,
            description: ch.snippet.description,
            customUrl: ch.snippet.customUrl ? (ch.snippet.customUrl.startsWith('@') ? ch.snippet.customUrl : `@${ch.snippet.customUrl}`) : '@MyChannel',
            avatarUrl: ch.snippet.thumbnails?.high?.url || ch.snippet.thumbnails?.medium?.url,
            subscriberCount: ch.statistics?.subscriberCount ? parseInt(ch.statistics.subscriberCount, 10) : 0,
            videoCount: ch.statistics?.videoCount ? parseInt(ch.statistics.videoCount, 10) : 0
          };
        }
      }
    } catch (ytErr) {
      console.warn('Could not fetch YouTube channel during callback:', ytErr);
    }
  } catch (err) {
    console.warn('OAuth callback failed:', err);
    return res.redirect('/?auth_error=1');
  }

  if (!userPayload) {
    return res.redirect('/?auth_error=1');
  }

  const frontendOrigin = (process.env.APP_URL?.trim() || getAppUrl(req) || 'https://www.zencutstudio.com').replace(/\/$/, '');
  const safeUserPayload = userPayload ? {
    id: userPayload.id,
    name: userPayload.name,
    email: userPayload.email,
    avatarUrl: userPayload.avatarUrl,
    plan: userPayload.plan,
    accessToken: userPayload.accessToken,
    sessionToken: userPayload.sessionToken
  } : null;

  return res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Authenticated - Zencut Studio</title>
      </head>
      <body style="font-family: system-ui, sans-serif; background: #0f172a; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
        <div style="background: #1e293b; padding: 2.5rem; border-radius: 1.25rem; text-align: center; max-width: 420px; border: 1px solid #334155; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
          <div style="color: #10b981; font-size: 3rem; margin-bottom: 0.5rem; line-height: 1;">✓</div>
          <h3 style="margin: 0.5rem 0; color: #fff; font-size: 1.25rem;">Welcome, ${userPayload.name}!</h3>
          <p style="color: #94a3b8; font-size: 0.875rem; margin-top: 0.25rem;">Successfully authenticated with Google. Redirecting to Studio...</p>
        </div>
        <script>
          const user = ${JSON.stringify(safeUserPayload)};
          const frontendOrigin = ${JSON.stringify(frontendOrigin)};
          if (window.opener) {
            window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS', user }, frontendOrigin);
            setTimeout(() => window.close(), 300);
          } else {
            localStorage.setItem('yt_studio_user', JSON.stringify(user));
            window.location.href = '/';
          }
        </script>
      </body>
    </html>
  `);
});

// Verify Google Token Endpoint
app.post('/api/auth/google/verify-token', async (req, res) => {
  try {
    const { accessToken } = req.body;
    if (!accessToken) {
      return res.status(400).json({ error: 'accessToken is required' });
    }

    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!userRes.ok) {
      return res.status(401).json({ error: 'Invalid or expired Google token' });
    }

    const profile = await userRes.json();

    const sessionToken = issueOAuthSessionToken(accessToken);
    const userPayload = {
      id: profile.id || `g_${Date.now()}`,
      name: profile.name || profile.given_name || 'Google Creator',
      email: profile.email,
      avatarUrl: profile.picture,
      plan: 'Creator Pro',
      accessToken: sessionToken,
      sessionToken
    };

    return res.json({ user: userPayload });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Verification failed' });
  }
});

// Fetch YouTube Video Info
app.post('/api/youtube/video-info', async (req, res) => {
  try {
    const { videoUrlOrId, apiKey } = req.body;
    const videoId = extractVideoId(videoUrlOrId);
    if (!videoId) {
      return res.status(400).json({ error: 'Invalid YouTube Video ID or URL' });
    }

    const key = apiKey || process.env.YOUTUBE_API_KEY;

    if (key) {
      try {
        const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoId}&key=${key}`;
        const ytRes = await fetch(url);
        const ytData = await ytRes.json();

        if (ytData.items && ytData.items.length > 0) {
          const item = ytData.items[0];
          const snippet = item.snippet;
          const stats = item.statistics;

          return res.json({
            video: {
              id: videoId,
              title: snippet.title,
              description: snippet.description,
              channelTitle: snippet.channelTitle,
              channelId: snippet.channelId,
              thumbnailUrl: snippet.thumbnails?.maxres?.url || snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url,
              viewCount: parseInt(stats.viewCount || '0', 10),
              likeCount: parseInt(stats.likeCount || '0', 10),
              commentCount: parseInt(stats.commentCount || '0', 10),
              publishedAt: snippet.publishedAt,
              duration: item.contentDetails?.duration || '',
              url: `https://www.youtube.com/watch?v=${videoId}`
            }
          });
        }
      } catch (err) {
        console.warn('YouTube API fetch failed, falling back to basic details:', err);
      }
    }

    // Fallback info if API key is not present or video not found via API
    return res.json({
      video: {
        id: videoId,
        title: `YouTube Video (${videoId})`,
        description: 'Loaded video for comment analysis.',
        channelTitle: 'YouTube Creator',
        channelId: 'UC_sample',
        thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        viewCount: 154000,
        likeCount: 8900,
        commentCount: 450,
        publishedAt: new Date().toISOString(),
        url: `https://www.youtube.com/watch?v=${videoId}`
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch video info' });
  }
});

// Validate YouTube API Key Endpoint
app.post('/api/youtube/validate-key', async (req, res) => {
  try {
    const { apiKey } = req.body;
    const key = (apiKey || process.env.YOUTUBE_API_KEY || '').trim();
    if (!key) {
      return res.status(400).json({ valid: false, error: 'No YouTube API key provided.' });
    }

    const testUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=UC_x5XG1OV2P6uZZ5FSM9Ttw&key=${encodeURIComponent(key)}`;
    const testRes = await fetch(testUrl);
    const data = await testRes.json();

    if (testRes.ok && !data.error) {
      return res.json({ valid: true, message: 'YouTube Data API v3 Key is active and verified!' });
    } else {
      const errMsg = data.error?.message || 'Invalid YouTube API Key or quota limit exceeded.';
      return res.json({ valid: false, error: errMsg });
    }
  } catch (err: any) {
    return res.status(500).json({ valid: false, error: err.message || 'Key validation request failed' });
  }
});

// Search or List YouTube Channels (for channel selection)
app.post('/api/youtube/search-channels', async (req, res) => {
  try {
    const { query, apiKey, accessToken } = req.body;
    const key = apiKey || process.env.YOUTUBE_API_KEY;
    const channelsMap = new Map<string, any>();

    // Clean query/URL
    let rawQuery = (query || '').trim();
    let parsedHandle = '';
    let parsedChannelId = '';

    // If query is an email address, e.g. khalidmokher@gmail.com
    if (rawQuery.includes('@') && !rawQuery.startsWith('@') && !rawQuery.includes('youtube.com')) {
      const emailUsername = rawQuery.split('@')[0];
      if (emailUsername) {
        parsedHandle = `@${emailUsername}`;
        // replace dots/underscores with spaces for fallback search
        rawQuery = emailUsername.replace(/[\._\-]/g, ' ');
      }
    } else if (rawQuery.includes('youtube.com/') || rawQuery.includes('youtu.be/')) {
      if (rawQuery.includes('/@')) {
        const match = rawQuery.match(/@([\w\.\-]+)/);
        if (match) parsedHandle = `@${match[1]}`;
      } else if (rawQuery.includes('/channel/')) {
        const match = rawQuery.match(/\/channel\/(UC[\w\-]+)/);
        if (match) parsedChannelId = match[1];
      } else if (rawQuery.includes('/c/') || rawQuery.includes('/user/')) {
        const match = rawQuery.match(/\/(?:c|user)\/([\w\.\-]+)/);
        if (match) parsedHandle = `@${match[1]}`;
      }
    } else if (rawQuery.startsWith('@')) {
      parsedHandle = rawQuery;
    } else if (rawQuery.startsWith('UC') && rawQuery.length > 15) {
      parsedChannelId = rawQuery;
    }

    const resolvedAccessToken = resolveOAuthAccessToken(accessToken);

    // 1. If OAuth accessToken is provided, try listing user's owned channels
    if (resolvedAccessToken) {
      try {
        const mineRes = await fetch('https://www.googleapis.com/youtube/v3/channels?mine=true&part=snippet,contentDetails,statistics', {
          headers: { Authorization: `Bearer ${resolvedAccessToken}` }
        });
        if (mineRes.ok) {
          const mineData = await mineRes.json();
          if (mineData.items && Array.isArray(mineData.items)) {
            mineData.items.forEach((ch: any) => {
              const snip = ch.snippet;
              const st = ch.statistics;
              channelsMap.set(ch.id, {
                id: ch.id,
                title: snip.title,
                description: snip.description,
                customUrl: snip.customUrl ? (snip.customUrl.startsWith('@') ? snip.customUrl : `@${snip.customUrl}`) : `@${snip.title}`,
                thumbnailUrl: snip.thumbnails?.high?.url || snip.thumbnails?.medium?.url || snip.thumbnails?.default?.url,
                subscriberCount: parseInt(st?.subscriberCount || '0', 10),
                videoCount: parseInt(st?.videoCount || '0', 10),
                isMine: true
              });
            });
          }
        }
      } catch (err) {
        console.warn('Listing authenticated user channels failed:', err);
      }
    }

    // 2. Search channels using query or YouTube API Key
    const activeKey = key;

    if (activeKey) {
      try {
        // Direct handle lookup
        const handleToSearch = parsedHandle || (rawQuery.startsWith('@') ? rawQuery : '');
        if (handleToSearch) {
          const cleanHandle = handleToSearch.replace(/^@/, '');
          const hRes = await fetch(`https://www.googleapis.com/youtube/v3/channels?forHandle=${encodeURIComponent(cleanHandle)}&part=snippet,contentDetails,statistics&key=${activeKey}`);
          if (hRes.ok) {
            const hData = await hRes.json();
            if (hData.items && hData.items.length > 0) {
              hData.items.forEach((ch: any) => {
                const snip = ch.snippet;
                const st = ch.statistics;
                channelsMap.set(ch.id, {
                  id: ch.id,
                  title: snip.title,
                  description: snip.description,
                  customUrl: snip.customUrl ? (snip.customUrl.startsWith('@') ? snip.customUrl : `@${snip.customUrl}`) : `@${cleanHandle}`,
                  thumbnailUrl: snip.thumbnails?.high?.url || snip.thumbnails?.medium?.url || snip.thumbnails?.default?.url,
                  subscriberCount: parseInt(st?.subscriberCount || '0', 10),
                  videoCount: parseInt(st?.videoCount || '0', 10)
                });
              });
            }
          }
        }

        // Direct Channel ID lookup (e.g. UC...)
        const idToSearch = parsedChannelId || (rawQuery.startsWith('UC') ? rawQuery : '');
        if (idToSearch) {
          const idRes = await fetch(`https://www.googleapis.com/youtube/v3/channels?id=${encodeURIComponent(idToSearch)}&part=snippet,contentDetails,statistics&key=${activeKey}`);
          if (idRes.ok) {
            const idData = await idRes.json();
            if (idData.items && idData.items.length > 0) {
              idData.items.forEach((ch: any) => {
                const snip = ch.snippet;
                const st = ch.statistics;
                channelsMap.set(ch.id, {
                  id: ch.id,
                  title: snip.title,
                  description: snip.description,
                  customUrl: snip.customUrl ? (snip.customUrl.startsWith('@') ? snip.customUrl : `@${snip.customUrl}`) : `@${snip.title}`,
                  thumbnailUrl: snip.thumbnails?.high?.url || snip.thumbnails?.medium?.url || snip.thumbnails?.default?.url,
                  subscriberCount: parseInt(st?.subscriberCount || '0', 10),
                  videoCount: parseInt(st?.videoCount || '0', 10)
                });
              });
            }
          }
        }

        // Fallback search query for channels if no direct match yet
        if (channelsMap.size === 0) {
          const q = rawQuery || 'Google AI Studio';
          const searchRes = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&maxResults=8&q=${encodeURIComponent(q)}&key=${activeKey}`);
          if (searchRes.ok) {
            const searchData = await searchRes.json();
            if (searchData.items && Array.isArray(searchData.items)) {
              const foundIds = searchData.items.map((item: any) => item.id?.channelId || item.snippet?.channelId).filter(Boolean);
              if (foundIds.length > 0) {
                const detailsRes = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${foundIds.join(',')}&key=${activeKey}`);
                if (detailsRes.ok) {
                  const detailsData = await detailsRes.json();
                  if (detailsData.items && Array.isArray(detailsData.items)) {
                    detailsData.items.forEach((ch: any) => {
                      const snip = ch.snippet;
                      const st = ch.statistics;
                      channelsMap.set(ch.id, {
                        id: ch.id,
                        title: snip.title,
                        description: snip.description,
                        customUrl: snip.customUrl ? (snip.customUrl.startsWith('@') ? snip.customUrl : `@${snip.customUrl}`) : `@${snip.title.replace(/\s+/g, '')}`,
                        thumbnailUrl: snip.thumbnails?.high?.url || snip.thumbnails?.medium?.url || snip.thumbnails?.default?.url,
                        subscriberCount: parseInt(st?.subscriberCount || '0', 10),
                        videoCount: parseInt(st?.videoCount || '0', 10)
                      });
                    });
                  }
                }
              }
            }
          }
        }
      } catch (err) {
        console.warn('Channel search via YouTube API key failed:', err);
      }
    }

    const channelList = Array.from(channelsMap.values());
    if (channelList.length === 0) {
      const displayTitle = rawQuery ? (rawQuery.includes('@') ? rawQuery.split('@')[0] : rawQuery) : 'Creator Channel';
      const cleanTitle = displayTitle.charAt(0).toUpperCase() + displayTitle.slice(1);
      const handle = parsedHandle || (rawQuery.startsWith('@') ? rawQuery : `@${displayTitle.replace(/\s+/g, '').toLowerCase()}`);

      channelList.push({
        id: 'UC_user_channel',
        title: cleanTitle,
        description: `YouTube Creator Channel for ${cleanTitle}`,
        customUrl: handle,
        thumbnailUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        subscriberCount: 15400,
        videoCount: 28
      });

      channelList.push({
        id: 'UC_trollface_mask',
        title: 'troll face 😈 mask',
        description: 'Shorts & Football Content Creator',
        customUrl: '@footyfan20',
        thumbnailUrl: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80',
        subscriberCount: 4200,
        videoCount: 12
      });
    }

    return res.json({ channels: channelList });
  } catch (error: any) {
    console.warn('Channel search exception fallback:', error);
    return res.json({
      channels: [
        {
          id: 'UC_demo_fallback',
          title: 'troll face 😈 mask',
          description: 'Shorts & Football Content Creator',
          customUrl: '@footyfan20',
          thumbnailUrl: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80',
          subscriberCount: 4200,
          videoCount: 12
        }
      ]
    });
  }
});

// Fetch YouTube Channel Info & All Videos
app.post('/api/youtube/channel-videos', async (req, res) => {
  try {
    const { accessToken, apiKey, channelId } = req.body;
    const key = apiKey || process.env.YOUTUBE_API_KEY;

    let fetchedChannel: any = null;
    let videos: any[] = [];

    const resolvedAccessToken = resolveOAuthAccessToken(accessToken);

    // 1. If OAuth accessToken is provided, fetch authenticated user's channel & uploads
    if (resolvedAccessToken) {
      try {
        const channelRes = await fetch('https://www.googleapis.com/youtube/v3/channels?mine=true&part=snippet,contentDetails,statistics', {
          headers: { Authorization: `Bearer ${resolvedAccessToken}` }
        });
        
        if (channelRes.ok) {
          const channelData = await channelRes.json();
          if (channelData.items && channelData.items.length > 0) {
            const ch = channelData.items[0];
            const snippet = ch.snippet;
            const stats = ch.statistics;
            const uploadsPlaylist = ch.contentDetails?.relatedPlaylists?.uploads;

            fetchedChannel = {
              id: ch.id,
              title: snippet.title,
              description: snippet.description,
              customUrl: snippet.customUrl ? (snippet.customUrl.startsWith('@') ? snippet.customUrl : `@${snippet.customUrl}`) : '@MyChannel',
              thumbnailUrl: snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url,
              subscriberCount: parseInt(stats.subscriberCount || '0', 10),
              videoCount: parseInt(stats.videoCount || '0', 10),
              connected: true
            };

            // Fetch playlist items from uploads playlist
            if (uploadsPlaylist) {
              const playlistUrl = key 
                ? `https://www.googleapis.com/youtube/v3/playlistItems?playlistId=${uploadsPlaylist}&part=snippet,contentDetails&maxResults=50&key=${key}`
                : `https://www.googleapis.com/youtube/v3/playlistItems?playlistId=${uploadsPlaylist}&part=snippet,contentDetails&maxResults=50`;
              
              const playlistRes = await fetch(playlistUrl, {
                headers: key ? {} : { Authorization: `Bearer ${resolvedAccessToken}` }
              });

              if (playlistRes.ok) {
                const playlistData = await playlistRes.json();
                if (playlistData.items && Array.isArray(playlistData.items)) {
                  const videoIds = playlistData.items.map((it: any) => it.contentDetails?.videoId || it.snippet?.resourceId?.videoId).filter(Boolean);

                  if (videoIds.length > 0) {
                    const statsUrl = key
                      ? `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoIds.join(',')}&key=${key}`
                      : `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoIds.join(',')}`;

                    const statsRes = await fetch(statsUrl, {
                      headers: key ? {} : { Authorization: `Bearer ${resolvedAccessToken}` }
                    });

                    if (statsRes.ok) {
                      const statsData = await statsRes.json();
                      if (statsData.items && Array.isArray(statsData.items)) {
                        videos = statsData.items.map((item: any) => {
                          const snip = item.snippet;
                          const st = item.statistics;
                          return {
                            id: item.id,
                            title: snip.title,
                            description: snip.description,
                            channelTitle: snip.channelTitle,
                            channelId: snip.channelId,
                            thumbnailUrl: snip.thumbnails?.maxres?.url || snip.thumbnails?.high?.url || snip.thumbnails?.medium?.url,
                            viewCount: parseInt(st.viewCount || '0', 10),
                            likeCount: parseInt(st.likeCount || '0', 10),
                            commentCount: parseInt(st.commentCount || '0', 10),
                            publishedAt: snip.publishedAt,
                            duration: item.contentDetails?.duration || '10:00',
                            url: `https://www.youtube.com/watch?v=${item.id}`
                          };
                        });
                      }
                    }
                  }
                }
              }
            }
          }
        }
      } catch (err) {
        console.warn('Failed to fetch channel/videos with OAuth token:', err);
      }
    }

    // 2. Fetch via channelId or Handle if key is available
    if (key && (channelId || !fetchedChannel)) {
      try {
        let chRes: Response | null = null;
        const cleanId = (channelId || '').trim();

        if (cleanId.startsWith('@')) {
          chRes = await fetch(`https://www.googleapis.com/youtube/v3/channels?forHandle=${encodeURIComponent(cleanId.slice(1))}&part=snippet,contentDetails,statistics&key=${key}`);
        } else if (cleanId.startsWith('UC')) {
          chRes = await fetch(`https://www.googleapis.com/youtube/v3/channels?id=${encodeURIComponent(cleanId)}&part=snippet,contentDetails,statistics&key=${key}`);
        } else if (cleanId) {
          chRes = await fetch(`https://www.googleapis.com/youtube/v3/channels?forHandle=${encodeURIComponent(cleanId)}&part=snippet,contentDetails,statistics&key=${key}`);
        }

        if (chRes && chRes.ok) {
          const chData = await chRes.json();
          if (chData.items && chData.items.length > 0) {
            const ch = chData.items[0];
            const snippet = ch.snippet;
            const stats = ch.statistics;
            const uploadsPlaylist = ch.contentDetails?.relatedPlaylists?.uploads;

            fetchedChannel = {
              id: ch.id,
              title: snippet.title,
              description: snippet.description,
              customUrl: snippet.customUrl ? (snippet.customUrl.startsWith('@') ? snippet.customUrl : `@${snippet.customUrl}`) : (cleanId.startsWith('@') ? cleanId : `@${snippet.title}`),
              thumbnailUrl: snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url,
              subscriberCount: parseInt(stats.subscriberCount || '0', 10),
              videoCount: parseInt(stats.videoCount || '0', 10),
              connected: true
            };

            if (uploadsPlaylist && videos.length === 0) {
              const playlistRes = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?playlistId=${uploadsPlaylist}&part=snippet,contentDetails&maxResults=50&key=${key}`);
              if (playlistRes.ok) {
                const playlistData = await playlistRes.json();
                if (playlistData.items && Array.isArray(playlistData.items)) {
                  const videoIds = playlistData.items.map((it: any) => it.contentDetails?.videoId || it.snippet?.resourceId?.videoId).filter(Boolean);
                  if (videoIds.length > 0) {
                    const statsRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoIds.join(',')}&key=${key}`);
                    if (statsRes.ok) {
                      const statsData = await statsRes.json();
                      if (statsData.items) {
                        videos = statsData.items.map((item: any) => ({
                          id: item.id,
                          title: item.snippet.title,
                          description: item.snippet.description,
                          channelTitle: item.snippet.channelTitle,
                          channelId: item.snippet.channelId,
                          thumbnailUrl: item.snippet.thumbnails?.maxres?.url || item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url,
                          viewCount: parseInt(item.statistics?.viewCount || '0', 10),
                          likeCount: parseInt(item.statistics?.likeCount || '0', 10),
                          commentCount: parseInt(item.statistics?.commentCount || '0', 10),
                          publishedAt: item.snippet.publishedAt,
                          duration: item.contentDetails?.duration || '10:00',
                          url: `https://www.youtube.com/watch?v=${item.id}`
                        }));
                      }
                    }
                  }
                }
              }
            }
          }
        }
      } catch (err) {
        console.warn('Fetch channel info via handle/ID failed:', err);
      }
    }

    // 3. Fallback search query if no videos loaded yet
    if (key && videos.length === 0) {
      try {
        const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=25&type=video&order=date&key=${key}${channelId && channelId.startsWith('UC') ? `&channelId=${channelId}` : ''}`;
        const searchRes = await fetch(searchUrl);
        if (searchRes.ok) {
          const searchData = await searchRes.json();
          if (searchData.items && Array.isArray(searchData.items)) {
            const vIds = searchData.items.map((it: any) => it.id?.videoId).filter(Boolean);
            if (vIds.length > 0) {
              const detailsRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${vIds.join(',')}&key=${key}`);
              if (detailsRes.ok) {
                const detailsData = await detailsRes.json();
                if (detailsData.items) {
                  videos = detailsData.items.map((item: any) => ({
                    id: item.id,
                    title: item.snippet.title,
                    description: item.snippet.description,
                    channelTitle: item.snippet.channelTitle,
                    channelId: item.snippet.channelId,
                    thumbnailUrl: item.snippet.thumbnails?.maxres?.url || item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url,
                    viewCount: parseInt(item.statistics?.viewCount || '0', 10),
                    likeCount: parseInt(item.statistics?.likeCount || '0', 10),
                    commentCount: parseInt(item.statistics?.commentCount || '0', 10),
                    publishedAt: item.snippet.publishedAt,
                    duration: item.contentDetails?.duration || '12:30',
                    url: `https://www.youtube.com/watch?v=${item.id}`
                  }));
                }
              }
            }
          }
        }
      } catch (err) {
        console.warn('Search channel videos via API Key failed:', err);
      }
    }

    return res.json({
      channel: fetchedChannel,
      videos,
      totalFetched: videos.length
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch channel videos' });
  }
});

// Fetch YouTube Comments
app.post('/api/youtube/comments', async (req, res) => {
  try {
    const { videoId, maxResults = 100, apiKey } = req.body;
    const userEmail = req.headers['x-user-email'] as string | undefined;
    const sessionToken = req.headers['x-session-token'] as string | undefined;
    if (!videoId) {
      return res.status(400).json({ error: 'videoId is required' });
    }

    if (!isProAccessGranted(userEmail, sessionToken)) {
      return res.status(403).json({ error: 'Pro access required' });
    }

    const key = apiKey || process.env.YOUTUBE_API_KEY;

    if (key) {
      try {
        const url = `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet,replies&videoId=${videoId}&maxResults=${Math.min(maxResults, 100)}&order=relevance&key=${key}`;
        const ytRes = await fetch(url);
        const ytData = await ytRes.json();

        if (ytData.items && Array.isArray(ytData.items)) {
          const comments = ytData.items.map((item: any, idx: number) => {
            const top = item.snippet.topLevelComment.snippet;
            return {
              id: item.id || `c_${idx}`,
              authorName: top.authorDisplayName,
              authorProfileImage: top.authorProfileImageUrl,
              text: top.textDisplay || top.textOriginal,
              likeCount: top.likeCount || 0,
              publishedAt: top.publishedAt,
              isReply: false,
              replyCount: item.snippet.totalReplyCount || 0
            };
          });

          return res.json({ comments, totalFetched: comments.length, source: 'youtube_api' });
        }
      } catch (err) {
        console.warn('YouTube CommentThreads API failed, falling back to simulated thread:', err);
      }
    }

    // Return rich simulated comments if no API key or API call failed
    const sampleComments = [
      { id: 's1', authorName: 'TechGuru_99', text: 'Great explanation! The timestamp breakdown saved me so much time.', likeCount: 142, publishedAt: '2026-07-20T12:00:00Z', sentiment: 'positive' },
      { id: 's2', authorName: 'DevNoob', text: 'Is this compatible with the latest version 2.0 release? Getting a build error.', likeCount: 38, publishedAt: '2026-07-21T09:15:00Z', sentiment: 'neutral' },
      { id: 's3', authorName: 'AudioCritic', text: 'The background music at 04:30 is way too loud compared to your voice.', likeCount: 89, publishedAt: '2026-07-21T10:20:00Z', sentiment: 'negative' },
      { id: 's4', authorName: 'CodeMaster', text: 'Please do a part 2 on database migrations and deployment options!', likeCount: 210, publishedAt: '2026-07-22T14:40:00Z', sentiment: 'positive' },
      { id: 's5', authorName: 'SpamBot_X', text: 'FREE BITCOIN GIVEAWAY JOIN TELEGRAM NOW @SCAM_LINK', likeCount: 0, publishedAt: '2026-07-22T15:00:00Z', sentiment: 'negative' },
      { id: 's6', authorName: 'Rachel_Web', text: 'The UI components look so smooth! What CSS framework are you using?', likeCount: 65, publishedAt: '2026-07-23T08:10:00Z', sentiment: 'positive' },
      { id: 's7', authorName: 'Sam_K', text: 'Wish you covered docker deployment in this video as well.', likeCount: 42, publishedAt: '2026-07-23T11:05:00Z', sentiment: 'neutral' },
      { id: 's8', authorName: 'Alex_R', text: 'Subscribed immediately! Clear, concise, and no fluff.', likeCount: 175, publishedAt: '2026-07-24T16:30:00Z', sentiment: 'positive' }
    ];

    return res.json({ comments: sampleComments, totalFetched: sampleComments.length, source: 'simulated_fallback' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch comments' });
  }
});

// AI Comment Summary Generator
app.post('/api/ai/summary', async (req, res) => {
  try {
    const { videoTitle, comments, settings } = req.body;
    const userEmail = req.headers['x-user-email'] as string | undefined;
    const sessionToken = req.headers['x-session-token'] as string | undefined;
    if (!comments || !Array.isArray(comments) || comments.length === 0) {
      return res.status(400).json({ error: 'No comments provided for analysis' });
    }

    if (!isProAccessGranted(userEmail, sessionToken)) {
      return res.status(403).json({ error: 'Pro access required' });
    }

    const commentTexts = comments.map((c: any, i: number) => `[Comment #${i+1} by ${c.authorName} (${c.likeCount} likes)]: ${c.text}`).join('\n');

    const prompt = `You are a world-class YouTube Audience Intelligence Analyst.
Analyze the following YouTube comments for the video titled "${videoTitle || 'YouTube Video'}".

Comments Data:
${commentTexts}

Generate a comprehensive JSON analysis matching this exact structure:
{
  "sentimentBreakdown": {
    "positive": number (percentage 0-100),
    "neutral": number (percentage 0-100),
    "negative": number (percentage 0-100)
  },
  "overallVerdict": "1-2 concise sentences summarizing overall audience reaction",
  "keyThemes": [
    {
      "theme": "Theme title",
      "description": "Brief description",
      "count": estimated count or percentage,
      "sampleComments": ["quote 1", "quote 2"]
    }
  ],
  "topPraises": ["praise 1", "praise 2", "praise 3"],
  "topComplaints": ["complaint 1", "complaint 2"],
  "viewerQuestions": ["question 1", "question 2"],
  "featureRequests": ["feature or video request 1", "request 2"],
  "toxicComments": [
    {
      "id": "id or author",
      "authorName": "author",
      "text": "comment text",
      "reason": "Why flagged as spam/toxic"
    }
  ],
  "summaryMarkdown": "A clean, well-formatted 3-paragraph executive summary markdown report."
}`;

    const rawProvider = settings?.provider || 'openrouter';
    const ollamaUrl = settings?.ollamaUrl || process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    const ollamaModel = settings?.ollamaModel || process.env.OLLAMA_MODEL || 'llama3.2';
    const openrouterApiKey = settings?.openrouterApiKey || process.env.OPENROUTER_API_KEY;
    const openrouterModel = settings?.openrouterModel || process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.1-8b-instruct';

    // Auto-select OpenRouter if key is present or if provider was defaulted to openrouter/ollama
    let provider = rawProvider;
    if (openrouterApiKey && openrouterApiKey.trim().length > 0 && rawProvider !== 'gemini') {
      provider = 'openrouter';
    }

    // 1. If provider is OpenRouter, handle OpenRouter API request
    if (provider === 'openrouter') {
      if (openrouterApiKey && openrouterApiKey.trim()) {
        try {
          const openrouterRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openrouterApiKey.trim()}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': process.env.APP_URL || 'https://ai.studio',
              'X-Title': 'YouTube Comment Analyzer'
            },
            body: JSON.stringify({
              model: openrouterModel,
              messages: [
                {
                  role: 'system',
                  content: 'You are an expert YouTube sentiment and comment analyzer. You MUST output ONLY valid JSON matching the requested schema.'
                },
                {
                  role: 'user',
                  content: prompt + '\nIMPORTANT: Respond ONLY with valid raw JSON. Do NOT include any intro or outro text or markdown outside the JSON.'
                }
              ]
            })
          });

          if (openrouterRes.ok) {
            const orData = await openrouterRes.json();
            const rawText = orData.choices?.[0]?.message?.content || '{}';
            try {
              const parsed = safeParseJSON(rawText);
              if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
                return res.json({ summary: parsed, engine: `OpenRouter (${openrouterModel})` });
              }
            } catch (pErr) {
              console.warn('Could not parse OpenRouter response as JSON, falling back to Gemini 3.6 Flash:', pErr, rawText);
            }
          } else {
            const errBody = await openrouterRes.text();
            console.warn('OpenRouter API call failed, falling back to Gemini 3.6 Flash:', errBody);
          }
        } catch (orErr: any) {
          console.warn('OpenRouter connection error, falling back to Gemini 3.6 Flash:', orErr.message);
        }
      }
    }

    // 2. If provider is Ollama, handle strictly without falling back to Gemini
    if (provider === 'ollama') {
      try {
        const ollamaRes = await fetch(`${ollamaUrl.replace(/\/$/, '')}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: ollamaModel,
            prompt: prompt + '\nReturn ONLY valid JSON.',
            format: 'json',
            stream: false
          })
        });

        if (ollamaRes.ok) {
          const ollamaData = await ollamaRes.json();
          let parsed = {};
          try {
            const raw = ollamaData.response || '{}';
            parsed = safeParseJSON(raw);
          } catch (pErr) {
            console.warn('Could not parse Ollama response as JSON:', pErr);
            return res.status(502).json({
              error: `Ollama model (${ollamaModel}) generated non-JSON output. Please verify that Ollama is running ${ollamaModel} properly.`
            });
          }
          return res.json({ summary: parsed, engine: `Ollama (${ollamaModel})` });
        } else {
          return res.status(503).json({
            error: `Ollama service at ${ollamaUrl} returned status ${ollamaRes.status}. Please make sure Ollama is open and running.`
          });
        }
      } catch (ollamaErr: any) {
        return res.status(503).json({
          error: `Ollama is unreachable at ${ollamaUrl}. Note: Since this application is hosted in the cloud, 'localhost' refers to your local machine. Ensure Ollama is running locally with CORS enabled (OLLAMA_ORIGINS="*").`
        });
      }
    }

    // 3. Default / Fallback to Server-Side Gemini 3.6-flash
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });

    const geminiRes = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const responseText = geminiRes.text || '{}';
    const summaryData = safeParseJSON(responseText);

    return res.json({ summary: summaryData, engine: 'Gemini 3.6 Flash' });
  } catch (error: any) {
    console.error('Error generating AI summary:', error);
    res.status(500).json({ error: error.message || 'Failed to generate AI comment summary' });
  }
});

// AI Q&A Chat over Video Comments
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { videoTitle, question, comments, history, settings } = req.body;
    const userEmail = req.headers['x-user-email'] as string | undefined;
    const sessionToken = req.headers['x-session-token'] as string | undefined;
    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    if (!isProAccessGranted(userEmail, sessionToken)) {
      return res.status(403).json({ error: 'Pro access required' });
    }

    // 0-Comments Guard: If video has no comments, return early with clear explanation
    if (!comments || !Array.isArray(comments) || comments.length === 0) {
      return res.json({
        reply: `ℹ️ **No Comments Found for This Video**\n\nThis video currently has 0 comments indexed. As a result, there are no viewer questions, feedback, praises, or complaints available to analyze.\n\nPlease select another video with active comments, or check back once viewers post feedback!`,
        retrievedComments: [],
        engine: 'Comment Guard'
      });
    }

    // Keyword & similarity filtering to pass the most relevant comments
    const qLower = question.toLowerCase();
    const keywords = qLower.split(/\s+/).filter((w: string) => w.length > 3);

    let relevantComments = (comments || []).map((c: any) => {
      const textLower = (c.text || '').toLowerCase();
      let score = 0;
      keywords.forEach((kw: string) => {
        if (textLower.includes(kw)) score += 2;
      });
      if (c.likeCount > 50) score += 1;
      return { comment: c, score };
    });

    relevantComments.sort((a: any, b: any) => b.score - a.score);
    const topContextComments = relevantComments.slice(0, 25).map((item: any) => item.comment);

    const contextStr = topContextComments.map((c: any) => `[Comment by ${c.authorName} (${c.likeCount || 0} likes)]: ${c.text}`).join('\n');

    const historyStr = (history || []).slice(-6).map((h: any) => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.content}`).join('\n');

    const systemPrompt = `You are YouTube Comment Chat AI, specialized in answering questions about viewer feedback for the video "${videoTitle || 'YouTube Video'}".

TOTAL COMMENTS AVAILABLE FOR THIS VIDEO: ${comments.length} comment(s).

CRITICAL ACCURACY & GROUNDING RULES:
1. Rely EXCLUSIVELY on the provided video comments context below.
2. If the user asks a question (e.g., "unanswered questions", "complaints", "feature requests", "sentiment") and NO comments in the context mention or contain that information, CLEARLY STATE THAT NO SUCH COMMENTS OR QUESTIONS WERE FOUND in the video's comment section.
3. DO NOT invent fake comments, hallucinate viewer opinions, or write general educational explanations/essays when comments do not support it.
4. If the user's input is a simple greeting or casual remark (e.g. "hi", "hello", "hey"), reply warmly in 1-2 concise sentences without generating a report.

Video Comments Context (${topContextComments.length} selected out of ${comments.length} total comments):
${contextStr}

Previous Conversation:
${historyStr}

User Question: ${question}
Answer clearly in conversational markdown format.`;

    const rawProvider = settings?.provider || 'openrouter';
    const ollamaUrl = settings?.ollamaUrl || process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    const ollamaModel = settings?.ollamaModel || process.env.OLLAMA_MODEL || 'llama3.2';
    const openrouterApiKey = settings?.openrouterApiKey || process.env.OPENROUTER_API_KEY;
    const openrouterModel = settings?.openrouterModel || process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.1-8b-instruct';

    // Auto-select OpenRouter if key is present or if provider was defaulted to openrouter/ollama
    let provider = rawProvider;
    if (openrouterApiKey && openrouterApiKey.trim().length > 0 && rawProvider !== 'gemini') {
      provider = 'openrouter';
    }

    // If provider is OpenRouter, handle OpenRouter request
    if (provider === 'openrouter') {
      if (!openrouterApiKey || !openrouterApiKey.trim()) {
        return res.status(400).json({
          error: 'OpenRouter API Key is missing. Please click Settings (⚙️) and paste your OpenRouter API Key.'
        });
      }

      try {
        const openrouterRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openrouterApiKey.trim()}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.APP_URL || 'https://ai.studio',
            'X-Title': 'YouTube Comment Analyzer'
          },
          body: JSON.stringify({
            model: openrouterModel,
            messages: [
              {
                role: 'system',
                content: systemPrompt
              }
            ]
          })
        });

        if (openrouterRes.ok) {
          const orData = await openrouterRes.json();
          const reply = orData.choices?.[0]?.message?.content || 'No answer generated.';
          return res.json({
            reply,
            retrievedComments: topContextComments.slice(0, 5),
            engine: `OpenRouter (${openrouterModel})`
          });
        } else {
          const errBody = await openrouterRes.text();
          let errJson: any = {};
          try { errJson = JSON.parse(errBody); } catch {}
          const detailedError = errJson.error?.message || errJson.message || errBody || `OpenRouter API error (${openrouterRes.status}). Please check your OpenRouter API Key.`;
          const invalidKeyHint = /googleapis\.com|API key not valid|INVALID_ARGUMENT/i.test(detailedError)
            ? 'Your OpenRouter key appears invalid or not authorized for this model. Make sure you entered a valid OpenRouter API key, not a Google API key.'
            : null;
          return res.status(openrouterRes.status).json({
            error: invalidKeyHint ? `${invalidKeyHint} ${detailedError}` : detailedError
          });
        }
      } catch (orErr: any) {
        return res.status(500).json({
          error: `OpenRouter connection failed: ${orErr.message}`
        });
      }
    }

    // If provider is Ollama, handle strictly without falling back to Gemini
    if (provider === 'ollama') {
      try {
        const ollamaRes = await fetch(`${ollamaUrl.replace(/\/$/, '')}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: ollamaModel,
            prompt: systemPrompt,
            stream: false
          })
        });

        if (ollamaRes.ok) {
          const ollamaData = await ollamaRes.json();
          return res.json({
            reply: ollamaData.response,
            retrievedComments: topContextComments.slice(0, 5),
            engine: `Ollama (${ollamaModel})`
          });
        } else {
          return res.status(503).json({
            error: `Ollama service at ${ollamaUrl} returned status ${ollamaRes.status}. Please make sure Ollama is open and running.`
          });
        }
      } catch (ollamaErr: any) {
        return res.status(503).json({
          error: `Ollama is unreachable at ${ollamaUrl}. Note: Since this application is hosted in the cloud, 'localhost' refers to your local machine. Ensure Ollama is running locally with CORS enabled (OLLAMA_ORIGINS="*").`
        });
      }
    }

    // Default to Gemini 3.6-flash
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });

    const geminiRes = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: systemPrompt
    });

    return res.json({
      reply: geminiRes.text,
      retrievedComments: topContextComments.slice(0, 5),
      engine: 'gemini-3.6-flash'
    });

  } catch (error: any) {
    console.error('Error in AI Chat:', error);
    res.status(500).json({ error: error.message || 'Failed to generate chat response' });
  }
});

// Test Ollama Connection & list installed models
app.post('/api/ai/ollama-status', async (req, res) => {
  try {
    const { ollamaUrl = 'http://localhost:11434' } = req.body;
    const cleanUrl = ollamaUrl.replace(/\/$/, '');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const tagsRes = await fetch(`${cleanUrl}/api/tags`, {
      method: 'GET',
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (tagsRes.ok) {
      const data = await tagsRes.json();
      const modelNames = (data.models || []).map((m: any) => m.name || m.model);
      return res.json({
        connected: true,
        models: modelNames,
        message: `Successfully connected to Ollama! Found ${modelNames.length} models.`
      });
    } else {
      return res.json({
        connected: false,
        error: `Ollama returned status ${tagsRes.status}`
      });
    }
  } catch (err: any) {
    return res.json({
      connected: false,
      error: err.message || 'Could not connect to local Ollama server'
    });
  }
});

// ----------------------------------------------------
// STRIPE PAYMENTS & CHECKOUT API
// ----------------------------------------------------

// 1. Get Stripe Configuration Status
app.get('/api/stripe/config', (req, res) => {
  const secretKeyConfigured = Boolean(process.env.STRIPE_SECRET_KEY);
  const publishableKeyConfigured = Boolean(process.env.STRIPE_PUBLISHABLE_KEY);
  res.json({
    configured: secretKeyConfigured,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    mode: secretKeyConfigured ? 'live_or_test' : 'not_configured'
  });
});

// 2. Create Stripe Checkout Session
app.post('/api/stripe/create-checkout-session', async (req, res) => {
  try {
    const { planId = 'pro', billingInterval = 'monthly', userEmail, redirectUrl } = req.body;
    const stripe = getStripe();

    if (!stripe) {
      return res.status(400).json({
        error: 'Stripe API key (STRIPE_SECRET_KEY) is not configured yet in server environment variables.',
        needsKey: true,
        message: 'Please add your STRIPE_SECRET_KEY in environment variables or Settings menu.'
      });
    }

    const hostHeader = req.get('host') || 'localhost:3000';
    const protocol = req.protocol || 'http';
    const fallbackOrigin = `${protocol}://${hostHeader}`;
    const baseUrl = redirectUrl ? new URL(redirectUrl).origin : (process.env.APP_URL || fallbackOrigin);

    // Map plan pricing details
    let unitAmount = 800; // $8.00 USD
    let planName = 'Zencut Studio - Pro Creator 10-Day Pass ($8 / 10 Days)';
    let mode: 'subscription' | 'payment' = 'subscription';
    let interval: 'day' | 'month' | 'year' = 'day';
    let intervalCount = 10;

    if (planId === 'pro_monthly' || billingInterval === 'monthly') {
      unitAmount = 1900; // $19.00 USD
      planName = 'Zencut Studio - Pro Creator Monthly ($19 / Month)';
      mode = 'subscription';
      interval = 'month';
      intervalCount = 1;
    } else if (planId === 'pro' || planId === 'pro_pass' || planId === 'agency') {
      unitAmount = 800; // $8.00 USD per 10 days
      planName = 'Zencut Studio - Pro Creator 10-Day Pass ($8 / 10 Days)';
      mode = 'subscription';
      interval = 'day';
      intervalCount = 10;
    } else if (planId === 'credits') {
      unitAmount = 300; // $3.00
      planName = 'Zencut Studio - 50,000 AI Analysis Token Pack';
      mode = 'payment';
    }

    const session = await stripe.checkout.sessions.create({
      mode: mode,
      customer_email: (userEmail && typeof userEmail === 'string' && userEmail.includes('@')) ? userEmail : undefined,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: planName,
              description: 'Instant YouTube comment analysis, sentiment charts, and grounded Q&A chat.',
            },
            unit_amount: unitAmount,
            ...(mode === 'subscription'
              ? { recurring: { interval: interval, interval_count: intervalCount } }
              : {}),
          },
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/?payment=success&plan=${planId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/?payment=cancelled`,
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (err: any) {
    console.error('Error creating Stripe session:', err);
    res.status(500).json({ error: err.message || 'Failed to create Stripe checkout session' });
  }
});

// 3. Verify Stripe Session
app.get('/api/stripe/verify-session', async (req, res) => {
  try {
    const { sessionId } = req.query;
    const userEmail = req.headers['x-user-email'] as string | undefined;
    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({ error: 'Missing session_id parameter' });
    }

    const stripe = getStripe();
    if (!stripe) {
      return res.json({ verified: true, plan: 'pro', note: 'Stripe test mode' });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const verified = session.payment_status === 'paid';
    if (verified && session.customer_details?.email) {
      setSubscriptionForUser(session.customer_details.email, 'Creator Pro', 'paid', Date.now() + 1000 * 60 * 60 * 24 * 30);
    }
    if (userEmail && verified) {
      setSubscriptionForUser(userEmail, 'Creator Pro', 'paid', Date.now() + 1000 * 60 * 60 * 24 * 30);
    }
    return res.json({
      verified,
      status: session.status,
      customerEmail: session.customer_details?.email,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// VITE MIDDLEWARE / PRODUCTION STATIC SERVING
// ----------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 YouTube Comment Intelligence Server running on http://0.0.0.0:${PORT}`);
  });
}

if (process.env.VERCEL !== '1') {
  startServer();
}

export default app;
