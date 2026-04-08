import {
  CalendarDays,
  ChevronRight,
  Search,
  ShoppingBag,
  User,
  Wrench,
  X,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { UserProfile } from "../backend";
import { Variant_cancelled_pending_completed_confirmed } from "../backend";
import MechanicRequestModal from "../components/MechanicRequestModal";
import {
  useCustomerActiveRequest,
  useCustomerCompletedRequests,
  useCustomerRespondToPrice,
  useMechanics,
  useUserBookings,
} from "../hooks/useQueries";
import {
  playMechanicFound,
  playPriceUpdate,
  playSoftNotification,
} from "../utils/sounds";

interface Props {
  profile: UserProfile;
}

const SERVICES = [
  {
    name: "Routine Maintenance",
    desc: "Oil, filters & more",
    price: "₦5,000+",
    icon: Wrench,
  },
  {
    name: "Engine Diagnosis",
    desc: "Full diagnostics scan",
    price: "₦8,000+",
    icon: Search,
  },
  {
    name: "Brake Repairs",
    desc: "Pads, discs & fluid",
    price: "₦6,500+",
    icon: Zap,
  },
];

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/15 text-yellow-400",
  confirmed: "bg-blue-500/15 text-blue-400",
  completed: "bg-green-500/15 text-green-400",
  cancelled: "bg-red-500/15 text-red-400",
};

function formatDate(ts: bigint) {
  return new Date(Number(ts) / 1_000_000).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getRequestStatusDisplay(status: string, mechanicName?: string) {
  switch (status) {
    case "searching":
      return {
        dot: "bg-yellow-400 animate-pulse",
        text: "Searching for mechanic...",
      };
    case "accepted":
      return {
        dot: "bg-green-400",
        text: `Mechanic found${mechanicName ? ` — ${mechanicName}` : ""}`,
      };
    case "on_the_way":
      return {
        dot: "bg-blue-400 animate-pulse",
        text: "Mechanic is on the way",
      };
    case "arrived":
      return { dot: "bg-orange-400", text: "Mechanic has arrived" };
    case "price_sent":
      return {
        dot: "bg-purple-400 animate-pulse",
        text: "Mechanic sent a price quote",
      };
    case "approved":
      return {
        dot: "bg-green-400",
        text: "Price accepted — job in progress",
      };
    case "completed":
      return { dot: "bg-muted-foreground", text: "Service completed" };
    case "cancelled":
      return { dot: "bg-red-400", text: "Request cancelled" };
    default:
      return null;
  }
}

export default function HomeTab({ profile }: Props) {
  const [requestOpen, setRequestOpen] = useState(false);
  const [dismissedRequest, setDismissedRequest] = useState(false);
  const { data: bookings } = useUserBookings();
  const { data: mechanics } = useMechanics();
  const { data: activeRequest } = useCustomerActiveRequest();
  const { data: completedRequests } = useCustomerCompletedRequests();
  const respondToPrice = useCustomerRespondToPrice();

  const customerHasActive =
    !!activeRequest &&
    !["completed", "cancelled"].includes(activeRequest.status as string);

  console.log(
    "[HomeTab] customer active booking count:",
    customerHasActive ? 1 : 0,
  );

  // Track previous status to detect changes and fire sounds
  const prevStatusRef = useRef<string | null>(null);
  const [flashKey, setFlashKey] = useState(0);

  useEffect(() => {
    const prev = prevStatusRef.current;
    const curr = activeRequest?.status ?? null;
    if (curr && curr !== prev && prev !== null) {
      // Trigger visual flash
      setFlashKey((k) => k + 1);

      if (curr === "accepted") {
        playMechanicFound();
      } else if (curr === "price_sent") {
        playPriceUpdate();
      } else if (
        curr === "on_the_way" ||
        curr === "arrived" ||
        curr === "completed"
      ) {
        playSoftNotification();
      }
    }
    prevStatusRef.current = curr;
  }, [activeRequest?.status]);

  const latestBooking = bookings?.[0] ?? null;
  const latestMechanic = mechanics?.find(
    (m) => m.id === latestBooking?.mechanicId,
  );
  const firstName = profile.name.split(" ")[0];

  const showRequestStatus = activeRequest && !dismissedRequest;
  const statusDisplay = activeRequest
    ? getRequestStatusDisplay(activeRequest.status, activeRequest.mechanicName)
    : null;

  const isPriceSent = activeRequest?.status === "price_sent";
  const isTerminal =
    activeRequest?.status === "completed" ||
    activeRequest?.status === "cancelled";

  const handlePriceResponse = async (accept: boolean) => {
    if (!activeRequest) return;
    try {
      await respondToPrice.mutateAsync({ requestId: activeRequest.id, accept });
      toast.success(accept ? "Price accepted!" : "Request cancelled");
    } catch {
      toast.error("Failed to respond");
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      <header className="px-5 pt-12 pb-5 bg-gradient-to-b from-card to-background">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Triple A
            </h1>
            <p className="text-muted-foreground text-[11px] mt-0.5 leading-tight">
              Affordability, Availability, Accountability
            </p>
          </div>
          <button
            type="button"
            data-ocid="home.profile.button"
            className="w-11 h-11 rounded-full bg-primary flex items-center justify-center"
          >
            <User className="w-5 h-5 text-primary-foreground" />
          </button>
        </div>
      </header>

      <div className="flex flex-col gap-6 px-5 pb-6">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h2 className="text-3xl font-bold text-foreground">
            Welcome, {firstName}
          </h2>
          <p className="text-muted-foreground text-base mt-1">
            Need a mobile mechanic? We&apos;re here 24/7.
          </p>
          <div className="relative mt-3">
            <img
              src="/assets/generated/hero-car-transparent.dim_600x320.png"
              alt="Your car"
              className="w-full object-contain max-h-[180px]"
            />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-1.5 rounded-full bg-primary/30 blur-md" />
          </div>
        </motion.div>

        <motion.button
          type="button"
          data-ocid="home.request_mechanic.primary_button"
          onClick={() => {
            if (!customerHasActive) setRequestOpen(true);
          }}
          disabled={customerHasActive}
          className={`w-full h-14 rounded-2xl bg-primary text-primary-foreground font-bold text-lg flex items-center justify-center gap-3 shadow-yellow transition-transform${
            customerHasActive
              ? " opacity-60 cursor-not-allowed"
              : " active:scale-[0.98]"
          }`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          whileTap={customerHasActive ? undefined : { scale: 0.97 }}
        >
          <Wrench className="w-5 h-5" />
          Request Mechanic
        </motion.button>

        {customerHasActive && (
          <p className="text-center text-sm text-yellow-400 font-medium -mt-2">
            You already have an active service
          </p>
        )}

        {showRequestStatus && statusDisplay && (
          <motion.div
            key={flashKey}
            data-ocid="home.live_status.card"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="bg-card rounded-2xl border border-border px-4 py-3 flex flex-col gap-3"
          >
            <div className="flex items-center gap-3">
              <span
                className={`w-2.5 h-2.5 rounded-full shrink-0 ${statusDisplay.dot}`}
              />
              <p className="flex-1 text-foreground text-sm font-medium">
                {statusDisplay.text}
              </p>
              {isTerminal && (
                <button
                  type="button"
                  data-ocid="home.live_status.close_button"
                  onClick={() => setDismissedRequest(true)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {isPriceSent && activeRequest?.price != null && (
              <div className="flex flex-col gap-3 pt-1">
                <div className="bg-secondary rounded-xl px-4 py-3 text-center">
                  <p className="text-muted-foreground text-xs mb-1">
                    Mechanic quoted
                  </p>
                  <p className="text-primary font-bold text-2xl">
                    ₦{Number(activeRequest.price).toLocaleString("en-NG")}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    data-ocid="home.accept_price.button"
                    disabled={respondToPrice.isPending}
                    onClick={() => handlePriceResponse(true)}
                    className="py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform disabled:opacity-60"
                  >
                    Accept Price
                  </button>
                  <button
                    type="button"
                    data-ocid="home.reject_price.button"
                    disabled={respondToPrice.isPending}
                    onClick={() => handlePriceResponse(false)}
                    className="py-3 rounded-xl bg-secondary border border-border text-foreground font-bold text-sm flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform disabled:opacity-60"
                  >
                    Reject
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <div className="grid grid-cols-4 gap-3">
            {[
              {
                icon: CalendarDays,
                label: "Schedule",
                ocid: "home.schedule.button",
                comingSoon: true,
              },
              {
                icon: Zap,
                label: "Emergency",
                ocid: "home.emergency.button",
                comingSoon: true,
              },
              {
                icon: Search,
                label: "Inspection",
                ocid: "home.inspection.button",
                comingSoon: true,
              },
              {
                icon: ShoppingBag,
                label: "Market",
                ocid: "home.market.button",
                comingSoon: false,
              },
            ].map(({ icon: Icon, label, ocid, comingSoon }) => (
              <button
                type="button"
                key={label}
                data-ocid={ocid}
                onClick={() => comingSoon && toast.info("Coming soon")}
                className="flex flex-col items-center gap-2"
              >
                <div className="w-full aspect-square rounded-2xl bg-secondary flex items-center justify-center">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <span className="text-[11px] text-muted-foreground font-medium">
                  {label}
                </span>
              </button>
            ))}
          </div>
        </motion.div>

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-foreground">Our Services</h3>
            <button
              type="button"
              className="text-primary text-sm font-medium flex items-center gap-1"
            >
              See all <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
            {SERVICES.map(({ name, desc, price, icon: Icon }) => (
              <div
                key={name}
                className="min-w-[150px] bg-card rounded-2xl p-4 flex flex-col gap-3 border border-border"
              >
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm leading-tight">
                    {name}
                  </p>
                  <p className="text-muted-foreground text-xs mt-1">{desc}</p>
                </div>
                <p className="text-primary font-bold text-sm">{price}</p>
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
        >
          <h3 className="text-lg font-bold text-foreground mb-3">
            Active Bookings
          </h3>
          {latestBooking &&
          latestBooking.status !==
            Variant_cancelled_pending_completed_confirmed.completed &&
          latestBooking.status !==
            Variant_cancelled_pending_completed_confirmed.cancelled ? (
            <div
              data-ocid="home.active_booking.card"
              className="bg-card rounded-2xl p-4 border border-border flex items-center gap-3"
            >
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                <Wrench className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate">
                  {latestMechanic?.name ?? "Mechanic"}
                </p>
                <p className="text-muted-foreground text-xs">
                  {latestBooking.serviceType} &middot;{" "}
                  {latestBooking.scheduledDate}
                </p>
              </div>
              <span
                className={`text-[11px] font-medium px-2.5 py-1 rounded-full capitalize ${
                  STATUS_COLORS[latestBooking.status] ??
                  "bg-secondary text-muted-foreground"
                }`}
              >
                {latestBooking.status}
              </span>
            </div>
          ) : (
            <div
              data-ocid="home.bookings.empty_state"
              className="bg-card rounded-2xl p-6 border border-border flex flex-col items-center gap-2 text-center"
            >
              <CalendarDays className="w-8 h-8 text-muted-foreground" />
              <p className="text-muted-foreground text-sm">
                No active bookings
              </p>
              <button
                type="button"
                data-ocid="home.book_now.button"
                onClick={() => setRequestOpen(true)}
                className="text-primary text-sm font-semibold"
              >
                Book a mechanic now
              </button>
            </div>
          )}
        </motion.section>

        {completedRequests && completedRequests.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <h3 className="text-lg font-bold text-foreground mb-3">
              Service History
            </h3>
            <div className="flex flex-col gap-3">
              {completedRequests.map((req, i) => (
                <div
                  key={req.id}
                  data-ocid={`home.history.item.${i + 1}`}
                  className="bg-card rounded-2xl p-4 border border-border flex flex-col gap-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-foreground text-sm leading-tight flex-1 truncate">
                      {req.issueDescription}
                    </p>
                    {req.price != null && (
                      <span className="text-primary font-bold text-sm shrink-0">
                        ₦{Number(req.price).toLocaleString("en-NG")}
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground text-xs">
                    {req.mechanicName ?? "Mechanic"} &middot;{" "}
                    {formatDate(req.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          </motion.section>
        )}
      </div>

      <MechanicRequestModal
        open={requestOpen}
        onClose={() => setRequestOpen(false)}
        profile={profile}
      />
    </div>
  );
}
