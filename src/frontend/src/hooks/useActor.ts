/**
 * Local hook wrapper that binds the backend's createActor function to the
 * generic useActor hook from @caffeineai/core-infrastructure.
 *
 * Typed with BackendActor so all consumers get proper method completion
 * without importing from the protected backend.ts file.
 */
import { useActor as _useActor } from "@caffeineai/core-infrastructure";
import { createActor } from "../backend";
import type { BackendActor } from "../types";

// createActor from backend.ts has the correct signature but returns an
// untyped Backend class. We cast it to align with our typed BackendActor.
const typedCreateActor = createActor as unknown as Parameters<
  typeof _useActor<BackendActor>
>[0];

export function useActor() {
  return _useActor<BackendActor>(typedCreateActor);
}
