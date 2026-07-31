import test from 'node:test';
import assert from 'node:assert/strict';
import { FREE_PLAN_DURATION_MS, ensureFreePlanSession, getFreePlanState, clearFreePlanSession } from './freePlan';

class MemoryStorage {
  private store = new Map<string, string>();
  getItem(key: string) { return this.store.has(key) ? this.store.get(key)! : null; }
  setItem(key: string, value: string) { this.store.set(key, value); }
  removeItem(key: string) { this.store.delete(key); }
  clear() { this.store.clear(); }
}

const storage = new MemoryStorage();
Object.defineProperty(globalThis, 'localStorage', { value: storage, configurable: true });

test('starts a fresh free-plan session for each free user', () => {
  storage.clear();
  const start = ensureFreePlanSession('user-1', 'Free', 1_700_000_000_000);

  assert.equal(start, 1_700_000_000_000);
  const state = getFreePlanState('user-1', 'Free', 1_700_000_000_000 + 60_000);
  assert.equal(state.isExpired, false);
  assert.equal(state.remainingMs, FREE_PLAN_DURATION_MS - 60_000);
});

test('marks the free session as expired after the full window', () => {
  storage.clear();
  ensureFreePlanSession('user-2', 'Free', 1_700_000_000_000);
  const state = getFreePlanState('user-2', 'Free', 1_700_000_000_000 + FREE_PLAN_DURATION_MS + 1);

  assert.equal(state.isExpired, true);
  assert.equal(state.remainingMs, 0);
});

test('clears the free-plan session for upgraded users', () => {
  storage.clear();
  ensureFreePlanSession('user-3', 'Free', 1_700_000_000_000);
  clearFreePlanSession('user-3');

  const state = getFreePlanState('user-3', 'Creator Pro', 1_700_000_000_000 + FREE_PLAN_DURATION_MS);
  assert.equal(state.isExpired, false);
  assert.equal(state.remainingMs, 0);
});
