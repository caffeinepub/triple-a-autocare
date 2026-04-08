/**
 * Re-export useInternetIdentity from @caffeineai/core-infrastructure so that
 * all local hook consumers can import it from "./hooks/useInternetIdentity"
 * without caring about the package path.
 */
export {
  useInternetIdentity,
  type InternetIdentityContext,
  type Status,
} from "@caffeineai/core-infrastructure";
