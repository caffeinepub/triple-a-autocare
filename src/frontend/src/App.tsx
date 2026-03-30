import { Toaster } from "@/components/ui/sonner";
import type { Identity } from "@icp-sdk/core/agent";
import type { Principal } from "@icp-sdk/core/principal";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
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
  useGetMessages,
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

interface ChatState {
  requestId: string;
  otherPartyName: string;
  otherPartyId?: string;
  userRole: "customer" | "mechanic";
}

function AppContent() {
  const { identity: iiIdentity, isInitializing } = useInternetIdentity();
  const { actor } = useActor();
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

  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

  const { data: profile, isLoading: profileLoading } = useUserProfile();
  const { data: userAppRole, isLoading: roleLoading } = useUserAppRole();
  const saveProfileMutation = useSaveProfile();
  const saveRoleMutation = useSaveUserAppRole();

  const principal = identity?.getPrincipal().toString() ?? "";

  // Unread chat badge tracking
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  const { data: activeMessages } = useGetMessages(activeRequestId);
  const unreadChat =
    activeRequestId && activeMessages
      ? countUnread(activeMessages, principal)
      : 0;

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

  // Unread badge is computed reactively from activeMessages via useGetMessages

  const handleOpenChat = (state: ChatState) => {
    setActiveRequestId(state.requestId);
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

  if (profileLoading || roleLoading || seeding) {
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

  if (profile === null || profile === undefined) {
    return (
      <OnboardingScreen
        role={selectedRole}
        onComplete={async (data) => {
          if (!actor || !identity) return;
          const profileData: UserProfile = {
            userId: identity.getPrincipal() as unknown as Principal,
            name: data.name,
            phone: data.phone,
            location: data.location,
            latitude: data.latitude,
            longitude: data.longitude,
            address: data.address,
          };
          await saveProfileMutation.mutateAsync(profileData);
          queryClient.setQueryData(["profile"], profileData);

          // Auto-apply pending role from signup button selection
          const pendingRole = sessionStorage.getItem("pending-role") as
            | "customer"
            | "mechanic"
            | null;
          if (pendingRole) {
            sessionStorage.removeItem("pending-role");
            await saveRoleMutation.mutateAsync(pendingRole);
            queryClient.setQueryData(["userAppRole", principal], pendingRole);
          }
        }}
        isSaving={saveProfileMutation.isPending}
      />
    );
  }

  if (!userAppRole) {
    // Fallback: check pending-role from session (existing users re-logging in
    // via a role button but who already have a profile)
    const pendingRole = sessionStorage.getItem("pending-role") as
      | "customer"
      | "mechanic"
      | null;
    if (pendingRole) {
      sessionStorage.removeItem("pending-role");
      handleSaveRole(pendingRole);
      return null;
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
              {customerTab === "home" && <HomeTab profile={profile} />}
              {customerTab === "bookings" && (
                <BookingsTab
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
                  profile={profile}
                  onSave={handleSaveProfile}
                  isSaving={saveProfileMutation.isPending}
                />
              )}
            </>
          )}
          {userAppRole === "mechanic" && (
            <>
              {mechanicTab === "dashboard" && (
                <MechanicDashboard profile={profile} />
              )}
              {mechanicTab === "jobs" && (
                <MechanicJobsTab
                  profile={profile}
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
                  profile={profile}
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
