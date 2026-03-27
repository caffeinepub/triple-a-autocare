import {
  Briefcase,
  CalendarDays,
  DollarSign,
  Home,
  ShoppingBag,
  User,
  Wrench,
} from "lucide-react";

export type CustomerTab = "home" | "bookings" | "marketplace" | "profile";
export type MechanicTab = "dashboard" | "jobs" | "earnings" | "profile";

const CUSTOMER_TABS: { id: CustomerTab; label: string; icon: typeof Home }[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "bookings", label: "Bookings", icon: CalendarDays },
  { id: "marketplace", label: "Market", icon: ShoppingBag },
  { id: "profile", label: "Profile", icon: User },
];

const MECHANIC_TABS: { id: MechanicTab; label: string; icon: typeof Home }[] = [
  { id: "dashboard", label: "Dashboard", icon: Wrench },
  { id: "jobs", label: "Jobs", icon: Briefcase },
  { id: "earnings", label: "Earnings", icon: DollarSign },
  { id: "profile", label: "Profile", icon: User },
];

function NavBar<T extends string>({
  tabs,
  activeTab,
  onTabChange,
}: {
  tabs: { id: T; label: string; icon: typeof Home }[];
  activeTab: T;
  onTabChange: (tab: T) => void;
}) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-center">
      <div className="w-full max-w-[430px] bg-primary flex items-center">
        {tabs.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              type="button"
              key={id}
              data-ocid={`nav_${id}.tab`}
              onClick={() => onTabChange(id)}
              className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-opacity ${
                isActive ? "opacity-100" : "opacity-60"
              }`}
            >
              <Icon
                className="w-5 h-5 text-primary-foreground"
                strokeWidth={isActive ? 2.5 : 1.8}
              />
              <span
                className={`text-[10px] text-primary-foreground ${
                  isActive ? "font-bold" : "font-medium"
                }`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export function CustomerBottomNav({
  activeTab,
  onTabChange,
}: {
  activeTab: CustomerTab;
  onTabChange: (tab: CustomerTab) => void;
}) {
  return (
    <NavBar
      tabs={CUSTOMER_TABS}
      activeTab={activeTab}
      onTabChange={onTabChange}
    />
  );
}

export function MechanicBottomNav({
  activeTab,
  onTabChange,
}: {
  activeTab: MechanicTab;
  onTabChange: (tab: MechanicTab) => void;
}) {
  return (
    <NavBar
      tabs={MECHANIC_TABS}
      activeTab={activeTab}
      onTabChange={onTabChange}
    />
  );
}

// Legacy default export removed — use CustomerBottomNav or MechanicBottomNav
