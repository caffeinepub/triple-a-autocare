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
  badges,
}: {
  tabs: { id: T; label: string; icon: typeof Home }[];
  activeTab: T;
  onTabChange: (tab: T) => void;
  badges?: Partial<Record<T, number>>;
}) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-center">
      <div className="w-full max-w-[430px] bg-primary flex items-center">
        {tabs.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          const badgeCount = badges?.[id] ?? 0;
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
              <div className="relative">
                <Icon
                  className="w-5 h-5 text-primary-foreground"
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
                {badgeCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[9px] text-white font-bold">
                    {badgeCount > 9 ? "9+" : badgeCount}
                  </span>
                )}
              </div>
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
  badges,
}: {
  activeTab: CustomerTab;
  onTabChange: (tab: CustomerTab) => void;
  badges?: Partial<Record<CustomerTab, number>>;
}) {
  return (
    <NavBar
      tabs={CUSTOMER_TABS}
      activeTab={activeTab}
      onTabChange={onTabChange}
      badges={badges}
    />
  );
}

export function MechanicBottomNav({
  activeTab,
  onTabChange,
  badges,
}: {
  activeTab: MechanicTab;
  onTabChange: (tab: MechanicTab) => void;
  badges?: Partial<Record<MechanicTab, number>>;
}) {
  return (
    <NavBar
      tabs={MECHANIC_TABS}
      activeTab={activeTab}
      onTabChange={onTabChange}
      badges={badges}
    />
  );
}

// Legacy default export removed — use CustomerBottomNav or MechanicBottomNav
