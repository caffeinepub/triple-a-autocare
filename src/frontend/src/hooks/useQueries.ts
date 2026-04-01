import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Booking,
  ChatMessage,
  Mechanic,
  Part,
  Review,
  ServiceRequest,
  UserProfile,
} from "../backend";
import {
  Variant_cancelled_pending_completed_confirmed,
  Variant_on_the_way_arrived_completed_accepted,
} from "../backend";
import { getEmailIdentity } from "../utils/emailIdentityStore";
import { useActor } from "./useActor";
import { useInternetIdentity } from "./useInternetIdentity";

/**
 * ExtendedServiceRequest is now just ServiceRequest — the backend wrapper
 * handles all status variants and the price field directly.
 */
export type ExtendedServiceRequest = ServiceRequest & {
  customerRating?: bigint;
  mechanicRating?: bigint;
};

// ---------------------------------------------------------------------------
// Generic backend hooks
// ---------------------------------------------------------------------------

export function useMechanics() {
  const { actor, isFetching } = useActor();
  return useQuery<Mechanic[]>({
    queryKey: ["mechanics"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAvailableMechanics();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUserBookings() {
  const { actor, isFetching } = useActor();
  return useQuery<Booking[]>({
    queryKey: ["bookings"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getUserBookings();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useParts() {
  const { actor, isFetching } = useActor();
  return useQuery<Part[]>({
    queryKey: ["parts"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllParts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUserProfile() {
  const { actor, isFetching } = useActor();
  return useQuery<UserProfile | null>({
    queryKey: ["profile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !isFetching,
  });
}

function getAppRoleKey(principal: string) {
  return `aaa-app-role-${principal}`;
}

export function useUserAppRole() {
  const { identity } = useInternetIdentity();
  const emailPrincipal = getEmailIdentity()?.getPrincipal();
  const iiPrincipal = identity?.getPrincipal();
  const effectivePrincipal =
    emailPrincipal && !emailPrincipal.isAnonymous()
      ? emailPrincipal
      : iiPrincipal;
  const principal = effectivePrincipal?.toString() ?? "";
  const isAuthenticated =
    !!effectivePrincipal && !effectivePrincipal.isAnonymous();

  return useQuery<string>({
    queryKey: ["userAppRole", principal],
    queryFn: () => {
      return localStorage.getItem(getAppRoleKey(principal)) ?? "";
    },
    enabled: isAuthenticated && !!principal,
  });
}

export function useSaveUserAppRole() {
  const { identity } = useInternetIdentity();
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const emailPrincipal = getEmailIdentity()?.getPrincipal();
  const iiPrincipal = identity?.getPrincipal();
  const effectivePrincipal =
    emailPrincipal && !emailPrincipal.isAnonymous()
      ? emailPrincipal
      : iiPrincipal;
  const principal = effectivePrincipal?.toString() ?? "";

  return useMutation({
    mutationFn: async (role: string) => {
      if (!principal) throw new Error("Not authenticated");
      if (role === "") {
        localStorage.removeItem(getAppRoleKey(principal));
      } else {
        localStorage.setItem(getAppRoleKey(principal), role);
      }
      // Also persist role to backend so updateUserProfile can identify mechanic
      if (actor && role) {
        try {
          await actor.saveCallerUserAppRole(role);
        } catch (e) {
          console.warn("[useSaveUserAppRole] backend role save failed:", e);
        }
      }
    },
    onSuccess: (_, role) => {
      queryClient.setQueryData(["userAppRole", principal], role);
    },
  });
}

export function useMechanicReviews(mechanicId: string) {
  const { actor, isFetching } = useActor();
  return useQuery<Review[]>({
    queryKey: ["reviews", mechanicId],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getReviews(mechanicId);
    },
    enabled: !!actor && !isFetching && !!mechanicId,
  });
}

export function useCreateBooking() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      mechanicId: string;
      serviceType: string;
      scheduledDate: string;
      scheduledTime: string;
      notes: string | null;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.createBooking(
        params.mechanicId,
        params.serviceType,
        params.scheduledDate,
        params.scheduledTime,
        params.notes,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}

export function useAddReview() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      mechanicId: string;
      rating: bigint;
      text: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.addReview(params.mechanicId, params.rating, params.text);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["reviews", variables.mechanicId],
      });
    },
  });
}

export function useSaveProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Not connected");
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}

export function useUpdateBookingStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      bookingId: string;
      status: Variant_cancelled_pending_completed_confirmed;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.updateBookingStatus(params.bookingId, params.status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}

// ---------------------------------------------------------------------------
// Profile upgrade hooks
// ---------------------------------------------------------------------------

export function useUpdateUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      name?: string | null;
      profileImage?: string | null;
      yearsOfExperience?: bigint | null;
      specialties?: string | null;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.updateUserProfile(
        params.name ?? null,
        params.profileImage ?? null,
        params.yearsOfExperience ?? null,
        params.specialties ?? null,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}

export function useGetMechanicProfile(mechanicId: string | undefined) {
  const { actor, isFetching } = useActor();
  return useQuery<UserProfile | null>({
    queryKey: ["mechanicProfile", mechanicId],
    queryFn: async () => {
      if (!actor || !mechanicId) return null;
      const { Principal } = await import("@icp-sdk/core/principal");
      return actor.getMechanicPublicProfile(Principal.fromText(mechanicId));
    },
    enabled: !!actor && !isFetching && !!mechanicId,
    staleTime: 30000,
  });
}

export function useGetUserProfile(userId: string | undefined) {
  const { actor, isFetching } = useActor();
  return useQuery<UserProfile | null>({
    queryKey: ["userProfile", userId],
    queryFn: async () => {
      if (!actor || !userId) return null;
      const { Principal } = await import("@icp-sdk/core/principal");
      return actor.getMechanicPublicProfile(Principal.fromText(userId));
    },
    enabled: !!actor && !isFetching && !!userId,
    staleTime: 30000,
  });
}

// ---------------------------------------------------------------------------
// Service Request hooks
// ---------------------------------------------------------------------------

export function useCustomerActiveRequest() {
  const { actor, isFetching } = useActor();
  return useQuery<ExtendedServiceRequest | null>({
    queryKey: ["customerActiveRequest"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCustomerActiveRequest();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 2000,
    staleTime: 0,
    refetchIntervalInBackground: true,
  });
}

export function useSearchingRequests() {
  const { actor, isFetching } = useActor();
  return useQuery<ExtendedServiceRequest[]>({
    queryKey: ["searchingRequests"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getSearchingRequests();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 2000,
    staleTime: 0,
  });
}

export function useMechanicActiveJob() {
  const { actor, isFetching } = useActor();
  return useQuery<ExtendedServiceRequest | null>({
    queryKey: ["mechanicActiveJob"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getMechanicActiveJob();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 5000,
  });
}

export function useCreateServiceRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      customerName: string;
      location: string;
      issueDescription: string;
      serviceType: string;
      latitude?: number | null;
      longitude?: number | null;
      address?: string | null;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.createServiceRequest(
        params.customerName,
        params.location,
        params.issueDescription,
        params.serviceType,
        params.latitude ?? null,
        params.longitude ?? null,
        params.address ?? null,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customerActiveRequest"] });
    },
  });
}

export function useAcceptServiceRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { requestId: string; mechanicName: string }) => {
      if (!actor) throw new Error("Not connected");
      return actor.acceptServiceRequest(params.requestId, params.mechanicName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["searchingRequests"] });
      queryClient.invalidateQueries({ queryKey: ["mechanicActiveJob"] });
      queryClient.refetchQueries({ queryKey: ["customerActiveRequest"] });
      queryClient.invalidateQueries({ queryKey: ["mechanicServiceRequests"] });
      queryClient.refetchQueries({ queryKey: ["mechanicServiceRequests"] });
    },
  });
}

export function useUpdateServiceRequestStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      requestId: string;
      newStatus: Variant_on_the_way_arrived_completed_accepted;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.updateServiceRequestStatus(
        params.requestId,
        params.newStatus,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mechanicActiveJob"] });
      queryClient.invalidateQueries({ queryKey: ["customerActiveRequest"] });
      queryClient.invalidateQueries({ queryKey: ["mechanicServiceRequests"] });
    },
  });
}

export function useSubmitServicePrice() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { requestId: string; price: bigint }) => {
      if (!actor) throw new Error("Not connected");
      return actor.submitServicePrice(params.requestId, params.price);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mechanicActiveJob"] });
      queryClient.invalidateQueries({ queryKey: ["customerActiveRequest"] });
      queryClient.invalidateQueries({ queryKey: ["mechanicServiceRequests"] });
    },
  });
}

export function useCustomerRespondToPrice() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { requestId: string; accept: boolean }) => {
      if (!actor) throw new Error("Not connected");
      return actor.customerRespondToPrice(params.requestId, params.accept);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customerActiveRequest"] });
      queryClient.invalidateQueries({ queryKey: ["mechanicActiveJob"] });
      queryClient.invalidateQueries({ queryKey: ["mechanicServiceRequests"] });
      queryClient.invalidateQueries({
        queryKey: ["customerCompletedRequests"],
      });
    },
  });
}

export function useCompleteJob() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (requestId: string) => {
      if (!actor) throw new Error("Not connected");
      return actor.completeJob(requestId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mechanicActiveJob"] });
      queryClient.invalidateQueries({ queryKey: ["mechanicCompletedJobs"] });
      queryClient.invalidateQueries({ queryKey: ["customerActiveRequest"] });
      queryClient.invalidateQueries({
        queryKey: ["customerCompletedRequests"],
      });
      queryClient.invalidateQueries({ queryKey: ["mechanicServiceRequests"] });
    },
  });
}

export function useCustomerCompletedRequests() {
  const { actor, isFetching } = useActor();
  return useQuery<ExtendedServiceRequest[]>({
    queryKey: ["customerCompletedRequests"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getCustomerCompletedRequests();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 5000,
  });
}

export function useMechanicCompletedJobs() {
  const { actor, isFetching } = useActor();
  return useQuery<ExtendedServiceRequest[]>({
    queryKey: ["mechanicCompletedJobs"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMechanicCompletedJobs();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 5000,
  });
}

export function useGetServiceRequests() {
  const { actor, isFetching } = useActor();
  return useQuery<ExtendedServiceRequest[]>({
    queryKey: ["mechanicServiceRequests"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getServiceRequests();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 3000,
  });
}

export function useUpdateServiceRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      requestId: string;
      price: bigint;
      status: "price_sent";
    }) => {
      if (!actor) throw new Error("Not connected");
      if (!params.requestId) throw new Error("Missing request ID");
      return actor.updateServiceRequest(
        params.requestId,
        params.price,
        params.status,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mechanicServiceRequests"] });
      queryClient.invalidateQueries({ queryKey: ["mechanicActiveJob"] });
      queryClient.invalidateQueries({ queryKey: ["customerActiveRequest"] });
    },
  });
}

export function useCancelServiceRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      requestId: string;
      cancelledBy: string;
      reason?: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.cancelServiceRequest(
        params.requestId,
        params.cancelledBy,
        params.reason ?? null,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customerActiveRequest"] });
      queryClient.invalidateQueries({ queryKey: ["mechanicActiveJob"] });
      queryClient.invalidateQueries({ queryKey: ["mechanicServiceRequests"] });
      queryClient.invalidateQueries({ queryKey: ["searchingRequests"] });
    },
  });
}

export {
  Variant_cancelled_pending_completed_confirmed,
  Variant_on_the_way_arrived_completed_accepted,
};

export function useGetMessages(requestId: string | null) {
  const { actor, isFetching } = useActor();
  return useQuery<ChatMessage[]>({
    queryKey: ["chatMessages", requestId],
    queryFn: async () => {
      if (!actor || !requestId) return [];
      return actor.getMessages(requestId);
    },
    enabled: !!actor && !isFetching && !!requestId,
    refetchInterval: 3000,
  });
}

export function useSendMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { requestId: string; message: string }) => {
      if (!actor) throw new Error("Not connected");
      return actor.sendMessage(params.requestId, params.message);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["chatMessages", variables.requestId],
      });
    },
  });
}

export function useMarkMessagesRead() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (requestId: string) => {
      if (!actor) throw new Error("Not connected");
      return actor.markMessagesRead(requestId);
    },
    onSuccess: (_data, requestId) => {
      queryClient.invalidateQueries({ queryKey: ["chatMessages", requestId] });
    },
  });
}

/** Count unread messages for the current user in a messages array */
export function countUnread(
  messages: ChatMessage[],
  currentUserId: string,
): number {
  return messages.filter(
    (m) => !m.isRead && m.senderId.toString() !== currentUserId,
  ).length;
}

export type { ChatMessage };

export function useSubmitRating() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      requestId: string;
      rating: number;
      raterRole: "customer" | "mechanic";
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.submitRating(
        params.requestId,
        BigInt(params.rating),
        params.raterRole,
      );
    },
    onSuccess: () => {
      // Invalidate first, then immediately refetch so rating shows without
      // waiting for the next background poll cycle
      queryClient.invalidateQueries({
        queryKey: ["customerCompletedRequests"],
      });
      queryClient.invalidateQueries({ queryKey: ["mechanicCompletedJobs"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.refetchQueries({ queryKey: ["customerCompletedRequests"] });
      queryClient.refetchQueries({ queryKey: ["mechanicCompletedJobs"] });
      queryClient.refetchQueries({ queryKey: ["profile"] });
    },
  });
}
