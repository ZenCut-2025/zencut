export const FREE_PLAN_DURATION_MS = 2 * 60 * 60 * 1000;
const FREE_SESSION_STORAGE_KEY_PREFIX = 'yt_studio_free_session_start';

export function isPaidPlan(plan?: string | null) {
  return plan === 'Creator Pro' || plan === 'Studio Agency';
}

export function getFreePlanStorageKey(userId?: string | null) {
  const normalized = (userId || 'guest').trim();
  return `${FREE_SESSION_STORAGE_KEY_PREFIX}_${normalized}`;
}

function getStorage() {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
    return globalThis.localStorage as Storage;
  }
  return null;
}

export function ensureFreePlanSession(userId?: string | null, plan?: string | null, now = Date.now()) {
  if (!userId || isPaidPlan(plan)) {
    clearFreePlanSession(userId);
    return null;
  }

  const existing = getStoredFreePlanStart(userId);
  if (existing) {
    return existing;
  }

  const start = now;
  const storage = getStorage();
  if (storage) {
    storage.setItem(getFreePlanStorageKey(userId), start.toString());
  }
  return start;
}

export function getStoredFreePlanStart(userId?: string | null) {
  const storage = getStorage();
  if (!storage) return null;
  const raw = storage.getItem(getFreePlanStorageKey(userId));
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

export function clearFreePlanSession(userId?: string | null) {
  const storage = getStorage();
  if (!storage) return;
  storage.removeItem(getFreePlanStorageKey(userId));
}

export function getFreePlanState(userId?: string | null, plan?: string | null, now = Date.now()) {
  if (!userId || isPaidPlan(plan)) {
    return {
      startedAt: null,
      isActive: false,
      isExpired: false,
      remainingMs: 0,
      elapsedMs: 0,
      expiresAt: null
    };
  }

  const startedAt = getStoredFreePlanStart(userId) ?? ensureFreePlanSession(userId, plan, now);
  if (!startedAt) {
    return {
      startedAt: null,
      isActive: false,
      isExpired: false,
      remainingMs: 0,
      elapsedMs: 0,
      expiresAt: null
    };
  }

  const elapsedMs = Math.max(0, now - startedAt);
  const remainingMs = Math.max(0, FREE_PLAN_DURATION_MS - elapsedMs);
  const isExpired = remainingMs <= 0;

  return {
    startedAt,
    isActive: !isExpired,
    isExpired,
    remainingMs,
    elapsedMs,
    expiresAt: startedAt + FREE_PLAN_DURATION_MS
  };
}
