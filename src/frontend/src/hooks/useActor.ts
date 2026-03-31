import type { Identity } from "@icp-sdk/core/agent";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { backendInterface } from "../backend";
import { createActorWithConfig } from "../config";
import {
  getEmailIdentity,
  subscribeEmailIdentity,
} from "../utils/emailIdentityStore";
import { getSecretParameter } from "../utils/urlParams";
import { useInternetIdentity } from "./useInternetIdentity";

const ACTOR_QUERY_KEY = "actor";

export function useActor() {
  const { identity: iiIdentity } = useInternetIdentity();
  const queryClient = useQueryClient();

  // Mirror email identity in React state so the query key updates reactively.
  // Initialised synchronously from the persisted value so the correct
  // principal is available on the very first render (no reload flash).
  const [emailIdentity, setEmailIdentityState] = useState<Identity | null>(
    getEmailIdentity,
  );
  useEffect(() => {
    return subscribeEmailIdentity(setEmailIdentityState);
  }, []);

  // Email identity takes priority over Internet Identity — same pattern as
  // App.tsx — so email-authenticated users always get an authenticated actor.
  const identity = emailIdentity ?? iiIdentity;

  const actorQuery = useQuery<backendInterface>({
    queryKey: [ACTOR_QUERY_KEY, identity?.getPrincipal().toString()],
    queryFn: async () => {
      const isAuthenticated =
        !!identity && !identity.getPrincipal().isAnonymous();

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
    staleTime: Number.POSITIVE_INFINITY,
    enabled: true,
  });

  // When the actor changes, invalidate dependent queries
  useEffect(() => {
    if (actorQuery.data) {
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
