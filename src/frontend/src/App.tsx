import { Toaster } from "@/components/ui/sonner";
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
  useSaveProfile,
  useSaveUserAppRole,
  useUserAppRole,
  useUserProfile,
} from "./hooks/useQueries";
import BookingsTab from "./pages/BookingsTab";
import HomeTab from "./pages/HomeTab";
import MarketplaceTab from "./pages/MarketplaceTab";
import MechanicDashboard from "./pages/MechanicDashboard";
import MechanicEarningsTab from "./pages/MechanicEarningsTab";
import MechanicJobsTab from "./pages/MechanicJobsTab";
import ProfileTab from "./pages/ProfileTab";

const SEED_KEY = "triple-a-seeded-v1";

function AppContent() {
  const { identity, isInitializing } = useInternetIdentity();
  const { actor } = useActor();
  const [customerTab, setCustomerTab] = useState<CustomerTab>("home");
  const [mechanicTab, setMechanicTab] = useState<MechanicTab>("dashboard");
  const [seeding, setSeeding] = useState(false);
  const queryClient = useQueryClient();

  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

  const { data: profile, isLoading: profileLoading } = useUserProfile();
  const { data: userAppRole, isLoading: roleLoading } = useUserAppRole();
  const saveProfileMutation = useSaveProfile();
  const saveRoleMutation = useSaveUserAppRole();

  const principal = identity?.getPrincipal().toString() ?? "";

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

  const handleSaveProfile = async (data: {
    name: string;
    phone: string;
    location: string;
  }) => {
    if (!actor || !identity) return;
    const profileData: UserProfile = {
      userId: identity.getPrincipal() as unknown as Principal,
      name: data.name,
      phone: data.phone,
      location: data.location,
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
    return <LoginScreen />;
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
        onComplete={async (data) => {
          if (!actor || !identity) return;
          const profileData: UserProfile = {
            userId: identity.getPrincipal() as unknown as Principal,
            name: data.name,
            phone: data.phone,
            location: data.location,
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
        onSelectRole={handleSaveRole}
        isSaving={saveRoleMutation.isPending}
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
              {customerTab === "bookings" && <BookingsTab />}
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
              {mechanicTab === "jobs" && <MechanicJobsTab profile={profile} />}
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
      <div className="flex justify-center">
        <div className="w-full max-w-[430px]">
          {userAppRole === "customer" && (
            <CustomerBottomNav
              activeTab={customerTab}
              onTabChange={setCustomerTab}
            />
          )}
          {userAppRole === "mechanic" && (
            <MechanicBottomNav
              activeTab={mechanicTab}
              onTabChange={setMechanicTab}
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
