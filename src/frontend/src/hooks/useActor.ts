import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import type { backendInterface } from "../backend";
import { createActorWithConfig } from "../config";
import { getEmailIdentity } from "../utils/emailIdentityStore";
import { getSecretParameter } from "../utils/urlParams";
import { useInternetIdentity } from "./useInternetIdentity";

const ACTOR_QUERY_KEY = "actor";
export function useActor() {
  // Bug fix: also check email identity so email-authenticated users get a
  // real actor instead of an anonymous one.
  const { identity: iiIdentity } = useInternetIdentity();
  const emailIdentity = getEmailIdentity();
  const identity =
    emailIdentity && !emailIdentity.getPrincipal().isAnonymous()
      ? emailIdentity
      : iiIdentity;
  const queryClient = useQueryClient();
  // Bug fix: prevent the invalidation effect from re-firing when the actor
  // reference hasn't actually changed (same principal, same instance).
  const prevActorRef = useRef<backendInterface | null>(null);

  const actorQuery = useQuery<backendInterface>({
    queryKey: [ACTOR_QUERY_KEY, identity?.getPrincipal().toString()],
    queryFn: async () => {
      const isAuthenticated = !!identity;

      if (!isAuthenticated) {
        // Return anonymous actor if not authenticated
        return await createActorWithConfig();
      }

      const actorOptions = {
        agentOptions: {
          identity,
        },
      };

      const actor = await createActorWithConfig(actorOptions);
      const adminToken = getSecretParameter("caffeineAdminToken") || "";
      await actor._initializeAccessControlWithSecret(adminToken);
      return actor;
    },
    // Only refetch when identity changes
    staleTime: Number.POSITIVE_INFINITY,
    enabled: true,
  });

  // When the actor changes, invalidate dependent queries
  // biome-ignore lint/correctness/useExhaustiveDependencies: prevActorRef is stable
  useEffect(() => {
    if (actorQuery.data && actorQuery.data !== prevActorRef.current) {
      prevActorRef.current = actorQuery.data;
      queryClient.invalidateQueries({
        predicate: (query) => {
          return !query.queryKey.includes(ACTOR_QUERY_KEY);
        },
      });
      queryClient.refetchQueries({
        predicate: (query) => {
          return !query.queryKey.includes(ACTOR_QUERY_KEY);
        },
      });
    }
  }, [actorQuery.data, queryClient]);

  return {
    actor: actorQuery.data || null,
    isFetching: actorQuery.isFetching,
  };
}
