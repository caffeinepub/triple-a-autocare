import type { Identity } from "@icp-sdk/core/agent";

let _emailIdentity: Identity | null = null;
const listeners = new Set<(identity: Identity | null) => void>();

export function setEmailIdentity(identity: Identity | null) {
  _emailIdentity = identity;
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
