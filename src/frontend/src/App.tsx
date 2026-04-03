import { Toaster } from "@/components/ui/sonner";

import type { Principal } from "@icp-sdk/core/principal";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock, LogOut, ShieldX, Wrench } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { UserProfile } from "./backend";
import AdminPanel from "./components/AdminPanel";
import {
  AdminMechanicBottomNav,
  type AdminMechanicTab,
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
import { setEmailIdentity } from "./utils/emailIdentityStore";

const SEED_KEY = "triple-a-seeded-v1";
const USER_PROFILE_KEY = "userProfile";
const CHAT_ACTIVE_STATUSES = ["accepted", "on_the_way", "arrived"];

interface ChatState {
  requestId: string;
  otherPartyName: string;
  otherPartyId?: string;
  userRole: "customer" | "mechanic";
}

// ---- Mechanic Verification Gate ----

function MechanicPendingGate({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <motion.div
        className="flex flex-col items-center gap-6 text-center max-w-sm w-full"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col items-center gap-2 mb-2">
          <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30">
            <Wrench className="w-7 h-7 text-primary" />
          </div>
          <p className="text-primary font-bold text-sm tracking-widest uppercase">
            Triple A AutoCare
          </p>
        </div>

        <div className="w-20 h-20 rounded-full bg-yellow-500/15 border-2 border-yellow-500/30 flex items-center justify-center">
          <Clock className="w-10 h-10 text-yellow-400" />
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-foreground">
            Account Under Review
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Your account is under review. You will be approved shortly.
          </p>
        </div>

        <div className="w-full bg-card border border-border rounded-2xl p-4 text-left flex flex-col gap-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            What happens next?
          </p>
          <div className="flex items-start gap-2">
            <span className="text-yellow-400 text-sm mt-0.5">1.</span>
            <p className="text-foreground text-sm">
              Our team reviews your mechanic application
            </p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-yellow-400 text-sm mt-0.5">2.</span>
            <p className="text-foreground text-sm">
              Once approved, you will start receiving job requests
            </p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-yellow-400 text-sm mt-0.5">3.</span>
            <p className="text-foreground text-sm">
              This usually takes less than 24 hours
            </p>
          </div>
        </div>

        <button
          type="button"
          data-ocid="mechanic.pending.signout.button"
          onClick={onLogout}
          className="w-full h-14 rounded-2xl bg-secondary border border-border text-foreground font-semibold text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-transform hover:bg-secondary/80"
        >
          <LogOut className="w-5 h-5" />
          Log Out
        </button>
      </motion.div>
    </div>
  );
}

function MechanicRejectedGate({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <motion.div
        className="flex flex-col items-center gap-6 text-center max-w-sm w-full"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col items-center gap-2 mb-2">
          <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30">
            <Wrench className="w-7 h-7 text-primary" />
          </div>
          <p className="text-primary font-bold text-sm tracking-widest uppercase">
            Triple A AutoCare
          </p>
        </div>

        <div className="w-20 h-20 rounded-full bg-red-500/15 border-2 border-red-500/30 flex items-center justify-center">
          <ShieldX className="w-10 h-10 text-red-400" />
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-foreground">
            Application Not Approved
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Your application was not approved. Please contact support for more
            information.
          </p>
        </div>

        <div className="w-full bg-card border border-border rounded-2xl p-4 text-left">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Need help?
          </p>
          <p className="text-foreground text-sm">
            Contact our support team at{" "}
            <span className="text-primary font-semibold">
              support@tripleaautocare.ng
            </span>{" "}
            for more information about your application status.
          </p>
        </div>

        <button
          type="button"
          data-ocid="mechanic.rejected.signout.button"
          onClick={onLogout}
          className="w-full h-14 rounded-2xl bg-secondary border border-border text-foreground font-semibold text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-transform hover:bg-secondary/80"
        >
          <LogOut className="w-5 h-5" />
          Log Out
        </button>
      </motion.div>
    </div>
  );
}

// ---- Main App ----

function AppContent() {
  const { identity, isInitializing, clear } = useInternetIdentity();
  const { actor, isFetching: actorFetching } = useActor();
  const [customerTab, setCustomerTab] = useState<CustomerTab>("home");
  const [mechanicTab, setMechanicTab] = useState<MechanicTab>("dashboard");
  const [adminMechanicTab, setAdminMechanicTab] =
    useState<AdminMechanicTab>("dashboard");
  const [showCustomerAdminPanel, setShowCustomerAdminPanel] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const queryClient = useQueryClient();
  const [chatState, setChatState] = useState<ChatState | null>(null);

  const [forcedLoadDone, setForcedLoadDone] = useState(false);
  useEffect(() => {
    const timeout = setTimeout(() => setForcedLoadDone(true), 2000);
    return () => clearTimeout(timeout);
  }, []);

  const [preAuthStep, setPreAuthStep] = useState<"role" | "auth">("role");
  const [selectedRole, setSelectedRole] = useState<"customer" | "mechanic">(
    "customer",
  );
  const [isHandlingPendingRole, setIsHandlingPendingRole] = useState(false);

  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

  const { data: profile, isLoading: profileLoading } = useUserProfile();
  const { data: userAppRole, isLoading: roleLoading } = useUserAppRole();
  const saveProfileMutation = useSaveProfile();
  const saveRoleMutation = useSaveUserAppRole();

  const principal = identity?.getPrincipal().toString() ?? "";

  // Check admin status — backend check + hardcoded admin principal fallback
  const ADMIN_PRINCIPAL =
    "ostvh-u2bau-zuz6r-6gipc-yqwo6-d6dvx-hrwdn-qvdzk-irsyx-wairt-kqe";
  const { data: isAdmin } = useQuery<boolean>({
    queryKey: ["isAdmin", principal],
    queryFn: async () => {
      if (principal === ADMIN_PRINCIPAL) return true;
      if (!actor) return false;
      try {
        return await actor.isCallerAdmin();
      } catch {
        return false;
      }
    },
    enabled: isAuthenticated,
    staleTime: 60_000,
  });

  const localProfileStr = localStorage.getItem(USER_PROFILE_KEY);
  const localProfileData = localProfileStr
    ? (() => {
        try {
          return JSON.parse(localProfileStr);
        } catch {
          return null;
        }
      })()
    : null;
  const localRoleKey = `aaa-app-role-${principal}`;
  const localRole = localStorage.getItem(localRoleKey) as
    | "customer"
    | "mechanic"
    | null;

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional mount-only log
  useEffect(() => {
    const localProfile = localStorage.getItem(USER_PROFILE_KEY);
    console.log("[App] Start check:", {
      isAuthenticated,
      principal,
      hasLocalProfile: !!localProfile,
    });
  }, []);

  useEffect(() => {
    if (!actor || !isAuthenticated) return;
    async function syncBackend() {
      try {
        const data = await actor!.getCallerUserProfile();
        if (data) {
          console.log("\u2705 Synced from backend", data);
        }
      } catch (_e) {
        console.warn("\u26a0\ufe0f Backend not ready, using local data");
      }
    }
    syncBackend();
  }, [actor, isAuthenticated]);

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
  const unreadChat =
    messageTrackingId && activeMessages && !chatState
      ? countUnread(activeMessages, principal)
      : 0;

  const saveRoleMutateRef = useRef(saveRoleMutation.mutate);
  useEffect(() => {
    saveRoleMutateRef.current = saveRoleMutation.mutate;
  });

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

  useEffect(() => {
    if (userAppRole === "mechanic") {
      setMechanicTab("dashboard");
      setAdminMechanicTab("dashboard");
    } else {
      setCustomerTab("home");
    }
  }, [userAppRole]);

  const handleLogout = () => {
    setEmailIdentity(null);
    localStorage.removeItem("userProfile");
    clear();
  };

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

  if (isInitializing) {
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

  if (
    (profileLoading || roleLoading || seeding || actorFetching) &&
    !localProfileStr &&
    !forcedLoadDone
  ) {
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

  console.log("[App] Profile state:", {
    backendProfile: !!profile,
    localProfile: !!localProfileStr,
  });

  const effectiveProfile: UserProfile | null =
    profile ??
    (localProfileData && identity
      ? {
          userId: identity.getPrincipal() as unknown as Principal,
          name: localProfileData.name ?? "",
          phone: localProfileData.phone ?? "",
          location: localProfileData.address ?? "",
          latitude:
            localProfileData.latitude != null
              ? localProfileData.latitude
              : undefined,
          longitude:
            localProfileData.longitude != null
              ? localProfileData.longitude
              : undefined,
          address: localProfileData.address ?? "",
          role: localRole ?? selectedRole,
          totalRatings: BigInt(0),
          ratingsSum: BigInt(0),
        }
      : null);

  const effectiveRole =
    (userAppRole as "customer" | "mechanic" | undefined) ||
    localRole ||
    undefined;

  if (
    (effectiveProfile === null || effectiveProfile === undefined) &&
    !localProfileStr
  ) {
    return (
      <OnboardingScreen
        role={selectedRole}
        onComplete={async (data) => {
          console.log("Saving user profile:", data);

          if (!actor || !identity) {
            throw new Error(
              "Not connected. Please sign in with Internet Identity and try again.",
            );
          }

          const pendingRole = sessionStorage.getItem("pending-role") as
            | "customer"
            | "mechanic"
            | null;
          const roleToSave: "customer" | "mechanic" =
            pendingRole ?? selectedRole;

          const profileData: UserProfile = {
            userId: identity.getPrincipal() as unknown as Principal,
            name: data.name,
            phone: data.phone,
            location: data.location,
            latitude: data.latitude,
            longitude: data.longitude,
            address: data.address,
            role: roleToSave,
            totalRatings: BigInt(0),
            ratingsSum: BigInt(0),
          };

          await saveProfileMutation.mutateAsync(profileData);
          await saveRoleMutation.mutateAsync(roleToSave);

          queryClient.setQueryData(["userAppRole", principal], roleToSave);
          queryClient.setQueryData(["profile"], profileData);

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
          const roleKey = `aaa-app-role-${identity.getPrincipal().toString()}`;
          localStorage.setItem(roleKey, roleToSave);

          if (pendingRole) {
            sessionStorage.removeItem("pending-role");
          }

          console.log("\u2705 Profile saved to backend successfully");

          if (roleToSave === "mechanic") {
            toast.info(
              "Your account is pending review. You will be notified when approved.",
              { duration: 5000 },
            );
          }
        }}
        isSaving={saveProfileMutation.isPending}
      />
    );
  }

  if (!effectiveRole) {
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

  // ---- Mechanic Verification Gate ----
  // Admins bypass the gate so they can still access the dashboard + admin panel.
  if (effectiveRole === "mechanic" && !isAdmin) {
    const verificationStatus =
      (effectiveProfile as any)?.verificationStatus ?? "pending";

    if (verificationStatus === "pending") {
      return <MechanicPendingGate onLogout={handleLogout} />;
    }

    if (verificationStatus === "rejected") {
      return <MechanicRejectedGate onLogout={handleLogout} />;
    }
    // "approved" falls through to normal dashboard
  }

  // ---- Render App ----
  const isMechanicAdmin = effectiveRole === "mechanic" && !!isAdmin;
  const isCustomerAdmin = effectiveRole === "customer" && !!isAdmin;

  // For admin mechanics: derive which content to show from adminMechanicTab
  const currentMechanicView = isMechanicAdmin ? adminMechanicTab : mechanicTab;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex justify-center">
        <div className="w-full max-w-[430px] relative pb-20">
          {effectiveRole === "customer" && (
            <>
              {customerTab === "home" && !showCustomerAdminPanel && (
                <HomeTab profile={effectiveProfile!} />
              )}
              {customerTab === "bookings" && !showCustomerAdminPanel && (
                <BookingsTab
                  profile={effectiveProfile!}
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
              {customerTab === "marketplace" && !showCustomerAdminPanel && (
                <MarketplaceTab />
              )}
              {customerTab === "profile" && !showCustomerAdminPanel && (
                <ProfileTab
                  profile={effectiveProfile!}
                  onSave={handleSaveProfile}
                  isSaving={saveProfileMutation.isPending}
                  isAdmin={!!isAdmin}
                  onAdminPanel={() => setShowCustomerAdminPanel(true)}
                />
              )}
              {isCustomerAdmin && showCustomerAdminPanel && (
                <AdminPanel onBack={() => setShowCustomerAdminPanel(false)} />
              )}
            </>
          )}

          {effectiveRole === "mechanic" && (
            <>
              {currentMechanicView === "dashboard" && (
                <MechanicDashboard profile={effectiveProfile!} />
              )}
              {currentMechanicView === "jobs" && (
                <MechanicJobsTab
                  profile={effectiveProfile!}
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
              {currentMechanicView === "earnings" && <MechanicEarningsTab />}
              {currentMechanicView === "profile" && (
                <ProfileTab
                  profile={effectiveProfile!}
                  onSave={handleSaveProfile}
                  isSaving={saveProfileMutation.isPending}
                  isAdmin={!!isAdmin}
                  onAdminPanel={() => setAdminMechanicTab("admin")}
                />
              )}
              {isMechanicAdmin && currentMechanicView === "admin" && (
                <AdminPanel />
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
          {effectiveRole === "customer" && (
            <CustomerBottomNav
              activeTab={customerTab}
              onTabChange={(tab) => {
                setShowCustomerAdminPanel(false);
                setCustomerTab(tab);
              }}
              badges={{ bookings: unreadChat }}
            />
          )}
          {effectiveRole === "mechanic" && isMechanicAdmin && (
            <AdminMechanicBottomNav
              activeTab={adminMechanicTab}
              onTabChange={setAdminMechanicTab}
              badges={{ jobs: unreadChat }}
            />
          )}
          {effectiveRole === "mechanic" && !isMechanicAdmin && (
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
