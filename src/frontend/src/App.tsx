import { Toaster } from "@/components/ui/sonner";
import type { Identity } from "@icp-sdk/core/agent";
import type { Principal } from "@icp-sdk/core/principal";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import type { UserProfile } from "./backend";
import {
  CustomerBottomNav,
  type CustomerTab,
  MechanicBottomNav,
  type MechanicTab,
} from "./components/BottomNav";
import LoginScreen from "./components/LoginScreen";
import OnboardingScreen from "./components/OnboardingScreen";
import RoleSelectionScreen from "./components/RoleSelectionScreen";
import { useActor } from "./hooks/useActor";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import {
  countUnread,
  useCustomerActiveRequest,
  useGetMessages,
  useGetServiceRequests,
  useSaveProfile,
  useSaveUserAppRole,
  useUserAppRole,
  useUserProfile,
} from "./hooks/useQueries";
import BookingsTab from "./pages/BookingsTab";
import ChatScreen from "./pages/ChatScreen";
import HomeTab from "./pages/HomeTab";
import MarketplaceTab from "./pages/MarketplaceTab";
import MechanicDashboard from "./pages/MechanicDashboard";
import MechanicEarningsTab from "./pages/MechanicEarningsTab";
import MechanicJobsTab from "./pages/MechanicJobsTab";
import ProfileTab from "./pages/ProfileTab";
import {
  getEmailIdentity,
  subscribeEmailIdentity,
} from "./utils/emailIdentityStore";

const SEED_KEY = "triple-a-seeded-v1";
const USER_PROFILE_KEY = "userProfile";
// Statuses where chat is available — used for proactive unread tracking
const CHAT_ACTIVE_STATUSES = ["accepted", "on_the_way", "arrived"];

interface ChatState {
  requestId: string;
  otherPartyName: string;
  otherPartyId?: string;
  userRole: "customer" | "mechanic";
}

function AppContent() {
  const { identity: iiIdentity, isInitializing } = useInternetIdentity();
  // isFetching = actor is still building (async); include in loading guard
  const { actor, isFetching: actorFetching } = useActor();
  const [customerTab, setCustomerTab] = useState<CustomerTab>("home");
  const [mechanicTab, setMechanicTab] = useState<MechanicTab>("dashboard");
  const [seeding, setSeeding] = useState(false);
  const queryClient = useQueryClient();
  const [chatState, setChatState] = useState<ChatState | null>(null);

  // Email identity from email/password auth
  const [emailIdentity, setEmailIdentityState] = useState<Identity | null>(
    getEmailIdentity,
  );
  useEffect(() => {
    return subscribeEmailIdentity(setEmailIdentityState);
  }, []);

  // Use email identity as fallback when II identity is anonymous
  const identity = emailIdentity ?? iiIdentity;

  // Pre-auth two-step flow
  const [preAuthStep, setPreAuthStep] = useState<"role" | "auth">("role");
  const [selectedRole, setSelectedRole] = useState<"customer" | "mechanic">(
    "customer",
  );
  // Track whether we're in the process of saving a pending role from sessionStorage
  const [isHandlingPendingRole, setIsHandlingPendingRole] = useState(false);

  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

  const { data: profile, isLoading: profileLoading } = useUserProfile();
  const { data: userAppRole, isLoading: roleLoading } = useUserAppRole();
  const saveProfileMutation = useSaveProfile();
  const saveRoleMutation = useSaveUserAppRole();

  const principal = identity?.getPrincipal().toString() ?? "";

  // Debug log on app start — runs once on mount, snapshot of initial state
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional mount-only log
  useEffect(() => {
    const localProfile = localStorage.getItem(USER_PROFILE_KEY);
    console.log("[App] Start check:", {
      isAuthenticated,
      principal,
      hasLocalProfile: !!localProfile,
      emailIdentityRestored: !!getEmailIdentity(),
    });
  }, []);

  // Proactive unread chat tracking — poll messages for the current active
  // request even before the user opens chat, so the nav badge stays accurate.
  const { data: customerActiveReq } = useCustomerActiveRequest();
  const { data: mechanicActiveJobs } = useGetServiceRequests();
  const proactiveRequestId =
    userAppRole === "customer"
      ? (customerActiveReq?.id ?? null)
      : ((mechanicActiveJobs ?? []).find((j) =>
          CHAT_ACTIVE_STATUSES.includes(j.status as string),
        )?.id ?? null);
  const messageTrackingId = chatState?.requestId ?? proactiveRequestId;
  const { data: activeMessages } = useGetMessages(messageTrackingId);
  // Only show badge when chat panel is closed
  const unreadChat =
    messageTrackingId && activeMessages && !chatState
      ? countUnread(activeMessages, principal)
      : 0;

  // Use a stable ref to saveRoleMutation.mutate to avoid stale-closure issues
  // in the pending-role useEffect below.
  const saveRoleMutateRef = useRef(saveRoleMutation.mutate);
  useEffect(() => {
    saveRoleMutateRef.current = saveRoleMutation.mutate;
  });

  // Bug fix: handle pending-role from sessionStorage in a useEffect instead
  // of calling the async mutation during the render phase (React anti-pattern).
  useEffect(() => {
    if (
      !userAppRole &&
      !roleLoading &&
      isAuthenticated &&
      !isHandlingPendingRole
    ) {
      const pendingRole = sessionStorage.getItem("pending-role") as
        | "customer"
        | "mechanic"
        | null;
      if (pendingRole) {
        setIsHandlingPendingRole(true);
        sessionStorage.removeItem("pending-role");
        saveRoleMutateRef.current(pendingRole, {
          onSuccess: () => {
            if (pendingRole === "mechanic") setMechanicTab("dashboard");
            else setCustomerTab("home");
          },
          onSettled: () => setIsHandlingPendingRole(false),
        });
      }
    }
  }, [userAppRole, roleLoading, isAuthenticated, isHandlingPendingRole]);

  useEffect(() => {
    if (!actor || !isAuthenticated) return;
    const seeded = localStorage.getItem(SEED_KEY);
    if (seeded) return;
    setSeeding(true);
    actor
      .seedData()
      .then(() => {
        localStorage.setItem(SEED_KEY, "1");
      })
      .catch(console.error)
      .finally(() => setSeeding(false));
  }, [actor, isAuthenticated]);

  // Reset tabs to defaults whenever role changes
  useEffect(() => {
    if (userAppRole === "mechanic") {
      setMechanicTab("dashboard");
    } else {
      setCustomerTab("home");
    }
  }, [userAppRole]);

  const handleOpenChat = (state: ChatState) => {
    setChatState(state);
  };

  const handleCloseChat = () => {
    setChatState(null);
  };

  const handleSaveProfile = async (data: {
    name: string;
    phone: string;
    location: string;
    latitude?: number;
    longitude?: number;
    address?: string;
  }) => {
    if (!actor || !identity) return;
    const profileData: UserProfile = {
      userId: identity.getPrincipal() as unknown as Principal,
      name: data.name,
      phone: data.phone,
      location: data.location,
      latitude: data.latitude,
      longitude: data.longitude,
      address: data.address,
      totalRatings: BigInt(0),
      ratingsSum: BigInt(0),
    };
    await saveProfileMutation.mutateAsync(profileData);
    queryClient.setQueryData(["profile"], profileData);
  };

  const handleSaveRole = async (role: "customer" | "mechanic") => {
    await saveRoleMutation.mutateAsync(role);
    if (role === "mechanic") {
      setMechanicTab("dashboard");
    } else {
      setCustomerTab("home");
    }
  };

  if (isInitializing && !emailIdentity) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground text-sm">Starting up...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (preAuthStep === "role") {
      return (
        <RoleSelectionScreen
          onSelectRole={(role) => {
            setSelectedRole(role);
            setPreAuthStep("auth");
          }}
        />
      );
    }
    return (
      <LoginScreen
        selectedRole={selectedRole}
        onBack={() => setPreAuthStep("role")}
      />
    );
  }

  // CRITICAL: include actorFetching so we never flash onboarding while the
  // actor is still building (profile query is disabled until actor is ready,
  // so profileLoading would be false while profile is still undefined).
  if (profileLoading || roleLoading || seeding || actorFetching) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground text-sm">
            Loading your profile...
          </p>
        </div>
      </div>
    );
  }

  // Check localStorage as a secondary safety net: if the user already
  // completed onboarding but the backend profile fetch hasn't resolved yet
  // (e.g. transient slowness), don't redirect back to onboarding.
  const localProfileStr = localStorage.getItem(USER_PROFILE_KEY);
  console.log("[App] Profile state:", {
    backendProfile: !!profile,
    localProfile: !!localProfileStr,
  });

  if ((profile === null || profile === undefined) && !localProfileStr) {
    // Genuinely new user — no profile anywhere.
    return (
      <OnboardingScreen
        role={selectedRole}
        onComplete={async (data) => {
          console.log("Saving user profile:", data);

          const pendingRole = sessionStorage.getItem("pending-role") as
            | "customer"
            | "mechanic"
            | null;
          const effectiveRole: "customer" | "mechanic" =
            pendingRole ?? selectedRole;

          // STEP 1: ALWAYS save locally first — prevents onboarding loop on reload
          localStorage.setItem(
            USER_PROFILE_KEY,
            JSON.stringify({
              name: data.name,
              phone: data.phone,
              address: data.address,
              latitude: data.latitude,
              longitude: data.longitude,
            }),
          );
          // Also save role locally so it's readable on next load even without backend
          const roleKey = `aaa-app-role-${identity?.getPrincipal().toString() ?? "anon"}`;
          localStorage.setItem(roleKey, effectiveRole);
          console.log("[App] userProfile + role saved to localStorage");

          // STEP 2: Try backend — but don't block user if it fails
          try {
            if (!actor || !identity) {
              console.warn("⚠️ Actor not ready, using local fallback");
            } else {
              const profileData: UserProfile = {
                userId: identity.getPrincipal() as unknown as Principal,
                name: data.name,
                phone: data.phone,
                location: data.location,
                latitude: data.latitude,
                longitude: data.longitude,
                address: data.address,
                role: effectiveRole,
                totalRatings: BigInt(0),
                ratingsSum: BigInt(0),
              };

              await saveProfileMutation.mutateAsync(profileData);

              await saveRoleMutation.mutateAsync(effectiveRole);
              queryClient.setQueryData(
                ["userAppRole", principal],
                effectiveRole,
              );

              if (pendingRole) {
                sessionStorage.removeItem("pending-role");
              }

              queryClient.setQueryData(["profile"], profileData);
            }
            console.log("✅ Backend save success");
          } catch (err) {
            console.warn("⚠️ Backend failed, using local fallback", err);
          }
        }}
        isSaving={saveProfileMutation.isPending}
      />
    );
  }

  // If localStorage says the user has onboarded but the backend profile is
  // still null (e.g. actor just rebuilt after reload), show a brief spinner
  // rather than sending the user back to onboarding.
  if ((profile === null || profile === undefined) && localProfileStr) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground text-sm">
            Loading your account...
          </p>
        </div>
      </div>
    );
  }

  if (!userAppRole) {
    // Show spinner while the pending-role useEffect is running
    if (isHandlingPendingRole || !!sessionStorage.getItem("pending-role")) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p className="text-muted-foreground text-sm">
              Loading your account...
            </p>
          </div>
        </div>
      );
    }

    return (
      <RoleSelectionScreen
        onSelectRole={async (role) => {
          await handleSaveRole(role);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex justify-center">
        <div className="w-full max-w-[430px] relative pb-20">
          {userAppRole === "customer" && (
            <>
              {customerTab === "home" && <HomeTab profile={profile!} />}
              {customerTab === "bookings" && (
                <BookingsTab
                  profile={profile!}
                  onOpenChat={(requestId, otherPartyName, otherPartyId) =>
                    handleOpenChat({
                      requestId,
                      otherPartyName,
                      otherPartyId,
                      userRole: "customer",
                    })
                  }
                />
              )}
              {customerTab === "marketplace" && <MarketplaceTab />}
              {customerTab === "profile" && (
                <ProfileTab
                  profile={profile!}
                  onSave={handleSaveProfile}
                  isSaving={saveProfileMutation.isPending}
                />
              )}
            </>
          )}
          {userAppRole === "mechanic" && (
            <>
              {mechanicTab === "dashboard" && (
                <MechanicDashboard profile={profile!} />
              )}
              {mechanicTab === "jobs" && (
                <MechanicJobsTab
                  profile={profile!}
                  onOpenChat={(requestId, otherPartyName, otherPartyId) =>
                    handleOpenChat({
                      requestId,
                      otherPartyName,
                      otherPartyId,
                      userRole: "mechanic",
                    })
                  }
                />
              )}
              {mechanicTab === "earnings" && <MechanicEarningsTab />}
              {mechanicTab === "profile" && (
                <ProfileTab
                  profile={profile!}
                  onSave={handleSaveProfile}
                  isSaving={saveProfileMutation.isPending}
                />
              )}
            </>
          )}
        </div>
      </div>
      {chatState && (
        <div className="fixed inset-0 z-[60] bg-background">
          <div className="w-full max-w-[430px] mx-auto h-full">
            <ChatScreen
              requestId={chatState.requestId}
              otherPartyName={chatState.otherPartyName}
              otherPartyId={chatState.otherPartyId}
              userRole={chatState.userRole}
              currentUserId={principal}
              onBack={handleCloseChat}
            />
          </div>
        </div>
      )}
      <div className="flex justify-center">
        <div className="w-full max-w-[430px]">
          {userAppRole === "customer" && (
            <CustomerBottomNav
              activeTab={customerTab}
              onTabChange={setCustomerTab}
              badges={{ bookings: unreadChat }}
            />
          )}
          {userAppRole === "mechanic" && (
            <MechanicBottomNav
              activeTab={mechanicTab}
              onTabChange={setMechanicTab}
              badges={{ jobs: unreadChat }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <>
      <AppContent />
      <Toaster />
    </>
  );
}
