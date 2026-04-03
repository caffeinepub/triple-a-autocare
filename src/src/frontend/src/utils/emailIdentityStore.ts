import { Ed25519KeyIdentity } from "@dfinity/identity";
import type { Identity } from "@icp-sdk/core/agent";

const EMAIL_IDENTITY_STORAGE_KEY = "aaa-email-identity-v1";
const listeners = new Set<(identity: Identity | null) => void>();

// ── Persistence helpers ────────────────────────────────────────────────────

function saveIdentityToStorage(identity: Identity): void {
  try {
    const ed = identity as Ed25519KeyIdentity;
    localStorage.setItem(
      EMAIL_IDENTITY_STORAGE_KEY,
      JSON.stringify(ed.toJSON()),
    );
  } catch {
    // If serialization fails, skip persistence gracefully
  }
}

function loadIdentityFromStorage(): Identity | null {
  try {
    const stored = localStorage.getItem(EMAIL_IDENTITY_STORAGE_KEY);
    if (!stored) return null;
    // Ed25519KeyIdentity.fromJSON accepts the JSON string directly
    const identity = Ed25519KeyIdentity.fromJSON(stored);
    console.log(
      "[emailIdentityStore] Restored email identity from localStorage:",
      identity.getPrincipal().toString(),
    );
    return identity as unknown as Identity;
  } catch (e) {
    console.warn("[emailIdentityStore] Failed to restore identity:", e);
    localStorage.removeItem(EMAIL_IDENTITY_STORAGE_KEY);
    return null;
  }
}

// ── Module-level state ─────────────────────────────────────────────────────

// Restore synchronously on module init so the identity is available from
// the very first render (before any React effects run).
let _emailIdentity: Identity | null = loadIdentityFromStorage();

// ── Public API ─────────────────────────────────────────────────────────────

export function setEmailIdentity(identity: Identity | null) {
  _emailIdentity = identity;
  if (identity) {
    saveIdentityToStorage(identity);
  } else {
    localStorage.removeItem(EMAIL_IDENTITY_STORAGE_KEY);
  }
  for (const fn of listeners) fn(identity);
}

export function getEmailIdentity(): Identity | null {
  return _emailIdentity;
}

export function subscribeEmailIdentity(
  fn: (identity: Identity | null) => void,
): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
