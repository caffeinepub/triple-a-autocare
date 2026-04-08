import { useQueryClient } from "@tanstack/react-query";
import {
  Check,
  CheckCircle,
  Loader2,
  MapPin,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { UserProfile } from "../backend";
import type { ExtendedServiceRequest } from "../hooks/useQueries";
import {
  useAcceptServiceRequest,
  useGetUserProfile,
  useMechanicActiveJob,
  useSearchingRequests,
} from "../hooks/useQueries";
import { playNewRequest } from "../utils/sounds";

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("");
}

function RequestCard({
  request,
  onAccept,
  onDecline,
  index,
  disabled,
}: {
  request: ExtendedServiceRequest;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
  index: number;
  disabled: boolean;
}) {
  const customerIdStr = request.customerId?.toString();
  const { data: customerProfile } = useGetUserProfile(customerIdStr);
  const customerAvgRating =
    customerProfile && Number(customerProfile.totalRatings) > 0
      ? Number(customerProfile.ratingsSum) /
        Number(customerProfile.totalRatings)
      : null;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -40, scale: 0.95 }}
      transition={{ duration: 0.35, delay: index * 0.07 }}
      data-ocid={`mechanic.request.item.${index + 1}`}
      className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-4"
    >
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center shrink-0">
          <span className="text-primary-foreground font-bold text-sm">
            {getInitials(request.customerName)}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-foreground text-base leading-tight">
            {request.customerName}
          </p>
          {customerAvgRating != null && (
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-yellow-400 text-xs">⭐</span>
              <span className="text-muted-foreground text-xs font-medium">
                {customerAvgRating.toFixed(1)}
              </span>
              <span className="text-muted-foreground text-xs">
                ({Number(customerProfile?.totalRatings)} ratings)
              </span>
            </div>
          )}
          <div className="flex items-center gap-1 mt-1">
            <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground text-xs truncate">
              {request.location}
            </span>
          </div>
        </div>
        <span className="shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-primary/20 text-primary">
          {request.serviceType}
        </span>
      </div>

      <p className="text-foreground/80 text-sm leading-relaxed">
        {request.issueDescription}
      </p>

      <div className="flex gap-3">
        <button
          type="button"
          data-ocid={`mechanic.accept.primary_button.${index + 1}`}
          onClick={() => onAccept(request.id)}
          disabled={disabled}
          className={`flex-1 flex items-center justify-center gap-2 h-11 rounded-xl bg-green-500 hover:bg-green-600 active:scale-[0.97] text-white font-semibold text-sm transition-all${
            disabled ? " opacity-50 cursor-not-allowed" : ""
          }`}
        >
          <Check className="w-4 h-4" />
          Accept
        </button>
        <button
          type="button"
          data-ocid={`mechanic.decline.delete_button.${index + 1}`}
          onClick={() => onDecline(request.id)}
          disabled={disabled}
          className={`flex-1 flex items-center justify-center gap-2 h-11 rounded-xl bg-red-500 hover:bg-red-600 active:scale-[0.97] text-white font-semibold text-sm transition-all${
            disabled ? " opacity-50 cursor-not-allowed" : ""
          }`}
        >
          <X className="w-4 h-4" />
          Decline
        </button>
      </div>
    </motion.div>
  );
}

interface MechanicDashboardProps {
  profile: UserProfile;
}

export default function MechanicDashboard({ profile }: MechanicDashboardProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [declined, setDeclined] = useState<Set<string>>(new Set());

  const { data: searchingRequests, isLoading } = useSearchingRequests();
  const { data: activeJob } = useMechanicActiveJob();
  const acceptServiceRequest = useAcceptServiceRequest();
  const queryClient = useQueryClient();

  const hasActiveJob =
    !!activeJob &&
    !["completed", "cancelled"].includes(activeJob.status as string);

  console.log("[MechanicDashboard] active job count:", hasActiveJob ? 1 : 0);

  const firstName = profile.name.split(" ")[0];
  const requests = (searchingRequests ?? []).filter((r) => !declined.has(r.id));

  // Play alert sound when new requests arrive
  const prevCountRef = useRef<number | null>(null);
  useEffect(() => {
    const curr = requests.length;
    if (
      prevCountRef.current !== null &&
      curr > prevCountRef.current &&
      isOnline
    ) {
      playNewRequest();
    }
    prevCountRef.current = curr;
  }, [requests.length, isOnline]);

  const handleAccept = async (id: string) => {
    if (hasActiveJob) {
      toast.error("You have an ongoing job. Complete it first.");
      return;
    }
    console.log(
      "[AcceptJob] Accept triggered. requestId:",
      id,
      "mechanicName:",
      profile.name,
    );
    try {
      const result = await acceptServiceRequest.mutateAsync({
        requestId: id,
        mechanicName: profile.name,
      });
      console.log("[AcceptJob] Accept result:", result);
      queryClient.refetchQueries({ queryKey: ["mechanicServiceRequests"] });
      queryClient.refetchQueries({ queryKey: ["customerActiveRequest"] });
      toast.success("Job accepted — check Jobs tab");
    } catch (err) {
      console.error("[AcceptJob] Failed. requestId:", id, "error:", err);
      toast.error("Failed to accept request. Please try again.");
    }
  };

  const handleDecline = (id: string) => {
    const req = requests.find((r) => r.id === id);
    setDeclined((prev) => new Set([...prev, id]));
    toast.error(`Job declined — ${req?.customerName ?? "Customer"}`);
  };

  return (
    <div className="flex flex-col min-h-full">
      <header className="px-5 pt-12 pb-5 bg-gradient-to-b from-card to-background">
        <div className="flex items-start justify-between">
          <div>
            <motion.h1
              className="text-2xl font-bold text-foreground tracking-tight"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
            >
              Welcome, {firstName} 👋
            </motion.h1>
            <motion.p
              className="text-muted-foreground text-sm mt-0.5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
            >
              Mechanic Dashboard
            </motion.p>
          </div>
          <motion.button
            type="button"
            data-ocid="mechanic.status.toggle"
            onClick={() => setIsOnline((v) => !v)}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${
              isOnline
                ? "bg-green-500/20 text-green-400 border-green-500/30"
                : "bg-secondary text-muted-foreground border-border"
            }`}
          >
            {isOnline ? (
              <Wifi className="w-3.5 h-3.5" />
            ) : (
              <WifiOff className="w-3.5 h-3.5" />
            )}
            {isOnline ? "Online" : "Offline"}
          </motion.button>
        </div>

        <motion.div
          className="mt-4 flex items-center gap-3 bg-card rounded-2xl px-4 py-3 border border-border"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <div
            className={`w-2.5 h-2.5 rounded-full ${isOnline ? "bg-green-400 animate-pulse" : "bg-muted-foreground"}`}
          />
          <p className="text-sm text-foreground">
            <span className="font-semibold">{profile.name}</span>
            <span className="text-muted-foreground">
              {" "}
              &mdash;{" "}
              {isOnline
                ? "You are online and receiving requests"
                : "You are offline — go online to receive jobs"}
            </span>
          </p>
        </motion.div>
      </header>

      {hasActiveJob && (
        <div className="mx-5 mb-2 px-4 py-3 rounded-2xl bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 text-sm font-semibold text-center">
          You have an ongoing job
        </div>
      )}

      <div className="flex flex-col gap-4 px-5 pb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">
            Incoming Requests
          </h2>
          {requests.length > 0 && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/20 text-primary">
              {requests.length} pending
            </span>
          )}
        </div>

        {isLoading ? (
          <div
            data-ocid="mechanic.requests.loading_state"
            className="flex justify-center py-16"
          >
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {requests.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                data-ocid="mechanic.requests.empty_state"
                className="flex flex-col items-center justify-center gap-4 py-20 text-center"
              >
                <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <p className="text-foreground font-semibold text-lg">
                    All caught up!
                  </p>
                  <p className="text-muted-foreground text-sm mt-1">
                    No pending requests right now
                  </p>
                </div>
              </motion.div>
            ) : (
              requests.map((req, i) => (
                <RequestCard
                  key={req.id}
                  request={req}
                  index={i}
                  onAccept={handleAccept}
                  onDecline={handleDecline}
                  disabled={hasActiveJob}
                />
              ))
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
