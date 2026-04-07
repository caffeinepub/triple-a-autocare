import { Badge } from "@/components/ui/badge";
import {
  Briefcase,
  History,
  Loader2,
  MapPin,
  MessageCircle,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Variant_on_the_way_arrived_completed_accepted } from "../backend-types";
import type { UserProfile } from "../backend-types";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import type { ExtendedServiceRequest } from "../hooks/useQueries";
import {
  countUnread,
  useCancelServiceRequest,
  useCompleteJob,
  useGetMessages,
  useGetServiceRequests,
  useGetUserProfile,
  useMechanicCompletedJobs,
  useSubmitRating,
  useUpdateServiceRequest,
  useUpdateServiceRequestStatus,
} from "../hooks/useQueries";
import { getEmailIdentity } from "../utils/emailIdentityStore";
import { playSoftNotification } from "../utils/sounds";

const ACTIVE_STATUSES = new Set([
  "searching",
  "accepted",
  "on_the_way",
  "arrived",
  "price_sent",
  "approved",
]);

const CANCEL_ACTIVE_STATUSES = new Set([
  "accepted",
  "on_the_way",
  "arrived",
  "price_sent",
  "approved",
]);

const CANCEL_REASONS = ["Too far", "Busy", "Issue unclear"];

function statusLabel(status: string) {
  switch (status) {
    case "accepted":
      return "Accepted";
    case "on_the_way":
      return "On the Way";
    case "arrived":
      return "Arrived";
    case "price_sent":
      return "Price Sent";
    case "approved":
      return "Approved";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
}

function statusBadgeClass(status: string) {
  switch (status) {
    case "accepted":
      return "bg-yellow-500/20 text-yellow-400";
    case "on_the_way":
      return "bg-blue-500/20 text-blue-400";
    case "arrived":
      return "bg-orange-500/20 text-orange-400";
    case "price_sent":
      return "bg-purple-500/20 text-purple-400";
    case "approved":
      return "bg-green-500/20 text-green-400";
    case "completed":
      return "bg-green-500/20 text-green-400";
    case "cancelled":
      return "bg-red-500/20 text-red-400";
    default:
      return "bg-secondary text-muted-foreground";
  }
}

const CHAT_STATUSES = new Set(["accepted", "on_the_way", "arrived"]);

function CancelJobModal({
  isPending,
  selectedReason,
  onSelectReason,
  onConfirm,
  onClose,
}: {
  isPending: boolean;
  selectedReason: string | null;
  onSelectReason: (r: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end">
      <div className="w-full bg-card rounded-t-3xl p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-foreground">Cancel Job</h3>
          <button
            type="button"
            data-ocid="jobs.cancel.close_button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <p className="text-muted-foreground text-sm">Please select a reason:</p>

        <div className="flex flex-col gap-2">
          {CANCEL_REASONS.map((reason, idx) => (
            <button
              key={reason}
              type="button"
              data-ocid={`jobs.cancel.reason.${idx + 1}`}
              onClick={() => onSelectReason(reason)}
              className={`w-full h-12 rounded-xl border font-medium text-sm flex items-center px-4 transition-all ${
                selectedReason === reason
                  ? "bg-red-500/20 border-red-500/50 text-red-400"
                  : "bg-secondary border-border text-foreground"
              }`}
            >
              {reason}
            </button>
          ))}
        </div>

        <button
          type="button"
          data-ocid="jobs.cancel.confirm_button"
          disabled={!selectedReason || isPending}
          onClick={onConfirm}
          className="w-full h-12 rounded-xl bg-red-500 text-white font-bold text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-40"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Confirm Cancellation
        </button>

        <button
          type="button"
          data-ocid="jobs.cancel.cancel_button"
          onClick={onClose}
          className="w-full h-11 rounded-xl border border-border text-muted-foreground font-semibold text-sm"
        >
          Keep Job
        </button>
      </div>
    </div>
  );
}

function ActiveJobCard({
  job,
  onOpenChat,
  currentUserId,
}: {
  job: ExtendedServiceRequest;
  onOpenChat: (id: string, name: string, partyId?: string) => void;
  currentUserId: string;
}) {
  const updateStatus = useUpdateServiceRequestStatus();
  const updateServiceRequest = useUpdateServiceRequest();
  const completeJob = useCompleteJob();
  const cancelJob = useCancelServiceRequest();
  const { data: chatMessages } = useGetMessages(job.id);
  const customerIdStr = job.customerId?.toString();
  const { data: customerProfile } = useGetUserProfile(customerIdStr);
  const unreadCount = chatMessages
    ? countUnread(chatMessages, currentUserId)
    : 0;
  const [priceInput, setPriceInput] = useState("");
  const [priceError, setPriceError] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);

  const prevStatusRef = useRef<string>(job.status);
  useEffect(() => {
    if (job.status !== prevStatusRef.current) {
      if (job.status === "approved" || job.status === "completed") {
        playSoftNotification();
      }
      prevStatusRef.current = job.status;
    }
  }, [job.status]);

  const handleUpdate = async (
    newStatus: Variant_on_the_way_arrived_completed_accepted,
  ) => {
    try {
      await updateStatus.mutateAsync({ requestId: job.id, newStatus });
      toast.success("Job status updated");
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleConfirmPrice = async () => {
    if (!job.id) {
      toast.error("Missing request ID");
      return;
    }
    if (priceInput.trim() === "") {
      toast.error("Enter a price");
      return;
    }
    const amount = Number(priceInput);
    if (Number.isNaN(amount) || amount <= 0) {
      toast.error("Invalid price");
      return;
    }
    toast.loading("Sending price...", { id: "price-toast" });
    try {
      await updateServiceRequest.mutateAsync({
        requestId: job.id,
        price: BigInt(Math.round(amount)),
        status: "price_sent",
      });
      toast.success("Price sent successfully", { id: "price-toast" });
      setPriceInput("");
      setPriceError(null);
    } catch (err) {
      console.error("[ConfirmPrice] Full error:", err);
      const raw =
        err instanceof Error
          ? err.message
          : typeof err === "string"
            ? err
            : "Unknown error";
      const message = /permission|not authorized/i.test(raw)
        ? "Permission denied"
        : `Error: ${raw}`;
      toast.error(message, { id: "price-toast" });
      setPriceError(message);
    }
  };

  const handleCompleteJob = async () => {
    try {
      await completeJob.mutateAsync(job.id);
      toast.success("Job completed!");
    } catch {
      toast.error("Failed to complete job");
    }
  };

  const handleCancelJob = async () => {
    if (!selectedReason) return;
    try {
      await cancelJob.mutateAsync({
        requestId: job.id,
        cancelledBy: "mechanic",
        reason: selectedReason,
      });
      toast.success("Job cancelled");
      setShowCancelModal(false);
      setSelectedReason(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to cancel";
      toast.error(msg);
    }
  };

  const closeCancelModal = () => {
    setShowCancelModal(false);
    setSelectedReason(null);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        data-ocid="jobs.active.card"
        className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-4"
      >
        <div className="flex items-start gap-3">
          {customerProfile?.profileImage ? (
            <img
              src={customerProfile.profileImage}
              alt={job.customerName}
              className="w-11 h-11 rounded-full object-cover shrink-0 border border-primary/30"
            />
          ) : (
            <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center shrink-0">
              <span className="text-primary-foreground font-bold text-sm">
                {job.customerName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="font-bold text-foreground text-base leading-tight truncate">
                {job.customerName}
              </p>
              <Badge
                className={`shrink-0 text-[10px] px-2 py-0.5 border-0 ${statusBadgeClass(job.status)}`}
              >
                {statusLabel(job.status)}
              </Badge>
            </div>
            <div className="flex items-center gap-1 mt-1">
              <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground text-xs truncate">
                {job.address || job.location}
              </span>
            </div>
          </div>
        </div>

        <p className="text-foreground/80 text-sm leading-relaxed">
          {job.issueDescription}
        </p>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Service:{" "}
            <span className="text-foreground font-medium">
              {job.serviceType}
            </span>
          </span>
          {job.price != null && (
            <span className="text-primary font-bold">
              ₦{Number(job.price).toLocaleString("en-NG")}
            </span>
          )}
        </div>

        {CHAT_STATUSES.has(job.status) && (
          <button
            type="button"
            data-ocid="jobs.chat.button"
            onClick={() =>
              onOpenChat(job.id, job.customerName ?? "Customer", customerIdStr)
            }
            className="w-full py-3 rounded-2xl border border-border text-muted-foreground font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform relative"
          >
            <MessageCircle className="w-4 h-4" />
            Chat with Customer
            {unreadCount > 0 && (
              <span className="absolute top-2 right-3 min-w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold px-1">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
        )}

        {job.status === "accepted" && (
          <button
            type="button"
            data-ocid="jobs.start_trip.button"
            disabled={updateStatus.isPending}
            onClick={() =>
              handleUpdate(
                Variant_on_the_way_arrived_completed_accepted.on_the_way,
              )
            }
            className="w-full h-13 py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-60 shadow-yellow"
          >
            {updateStatus.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : null}
            Start Trip
          </button>
        )}

        {job.status === "on_the_way" && (
          <button
            type="button"
            data-ocid="jobs.arrived.button"
            disabled={updateStatus.isPending}
            onClick={() =>
              handleUpdate(
                Variant_on_the_way_arrived_completed_accepted.arrived,
              )
            }
            className="w-full h-13 py-3.5 rounded-2xl bg-blue-500 text-white font-bold text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-60"
          >
            {updateStatus.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : null}
            Arrived
          </button>
        )}

        {job.status === "arrived" && (
          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold text-foreground">
              Enter Service Price (₦)
            </p>
            <input
              type="number"
              min="0"
              placeholder="e.g. 15000"
              value={priceInput}
              onChange={(e) => setPriceInput(e.target.value)}
              data-ocid="jobs.input"
              className="w-full h-12 rounded-xl bg-secondary border border-border px-4 text-foreground placeholder:text-muted-foreground text-base focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="button"
              data-ocid="jobs.confirm_price.button"
              disabled={updateServiceRequest.isPending}
              onClick={handleConfirmPrice}
              className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-60 shadow-yellow"
            >
              {updateServiceRequest.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : null}
              Confirm Price
            </button>
            {priceError !== null && (
              <div
                data-ocid="jobs.error_state"
                style={{ fontFamily: "monospace", fontSize: "11px" }}
                className="text-red-400 break-all"
              >
                {priceError}
              </div>
            )}
          </div>
        )}

        {job.status === "price_sent" && (
          <div className="w-full py-3 rounded-2xl bg-purple-500/15 text-purple-400 font-semibold text-sm text-center">
            Waiting for customer approval...
          </div>
        )}

        {job.status === "approved" && (
          <button
            type="button"
            data-ocid="jobs.complete.button"
            disabled={completeJob.isPending}
            onClick={handleCompleteJob}
            className="w-full py-3.5 rounded-2xl bg-green-500 text-white font-bold text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-60"
          >
            {completeJob.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : null}
            Complete Job
          </button>
        )}

        {job.status === "completed" && (
          <div className="w-full py-3 rounded-2xl bg-green-500/15 text-green-400 font-bold text-sm text-center">
            ✓ Job Complete
          </div>
        )}

        {CANCEL_ACTIVE_STATUSES.has(job.status) && (
          <button
            type="button"
            data-ocid="jobs.cancel.button"
            onClick={() => setShowCancelModal(true)}
            className="w-full h-10 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          >
            <X className="w-4 h-4" />
            Cancel Job
          </button>
        )}
      </motion.div>

      {showCancelModal && (
        <CancelJobModal
          isPending={cancelJob.isPending}
          selectedReason={selectedReason}
          onSelectReason={setSelectedReason}
          onConfirm={handleCancelJob}
          onClose={closeCancelModal}
        />
      )}
    </>
  );
}

function JobHistoryCard({
  job,
  index,
}: { job: ExtendedServiceRequest; index: number }) {
  const isCompleted = job.status === "completed";
  const isCancelled = job.status === "cancelled";
  const [selectedStars, setSelectedStars] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const submitRating = useSubmitRating();

  const dateStr = job.createdAt
    ? new Date(Number(job.createdAt) / 1_000_000).toLocaleDateString("en-NG", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

  const cancelledByLabel =
    job.cancelledBy === "mechanic"
      ? "Cancelled by you"
      : job.cancelledBy === "customer"
        ? "Cancelled by customer"
        : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      data-ocid={`job_history.item.${index + 1}`}
      className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-2"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground text-sm truncate">
            {job.customerName}
          </p>
          <div className="flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground text-xs truncate">
              {job.address || job.location}
            </span>
          </div>
        </div>
        <span
          className={`text-[11px] font-medium px-2.5 py-1 rounded-full shrink-0 ${
            isCompleted
              ? "bg-green-500/15 text-green-400"
              : "bg-red-500/15 text-red-400"
          }`}
        >
          {isCompleted ? "Completed" : "Cancelled"}
        </span>
      </div>

      <p className="text-foreground/70 text-xs leading-relaxed">
        {job.issueDescription}
      </p>

      <p className="text-xs text-muted-foreground">
        Service:{" "}
        <span className="text-foreground font-medium">{job.serviceType}</span>
      </p>

      {isCancelled && cancelledByLabel && (
        <p className="text-xs text-red-400/80">{cancelledByLabel}</p>
      )}

      <div className="flex items-center justify-between mt-1">
        {job.price != null && isCompleted ? (
          <span className="text-primary font-bold text-sm">
            ₦{Number(job.price).toLocaleString("en-NG")}
          </span>
        ) : (
          <span />
        )}
        {dateStr && (
          <span className="text-xs text-muted-foreground">{dateStr}</span>
        )}
      </div>

      {isCompleted && (
        <div className="mt-2 border-t border-border/50 pt-2">
          {job.customerRating == null ? (
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-medium text-muted-foreground">
                Rate Customer
              </p>
              <div className="flex items-center gap-3">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      data-ocid="job_history.rating.toggle"
                      onClick={() => setSelectedStars(star)}
                      onMouseEnter={() => setHoveredStar(star)}
                      onMouseLeave={() => setHoveredStar(0)}
                      className="text-lg leading-none transition-transform hover:scale-110"
                    >
                      <span
                        className={
                          star <= (hoveredStar || selectedStars)
                            ? "text-yellow-400"
                            : "text-muted-foreground/40"
                        }
                      >
                        ★
                      </span>
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  data-ocid="job_history.rating.submit_button"
                  disabled={selectedStars === 0 || submitRating.isPending}
                  onClick={async () => {
                    if (selectedStars === 0) return;
                    try {
                      await submitRating.mutateAsync({
                        requestId: job.id,
                        rating: selectedStars,
                        raterRole: "mechanic",
                      });
                      toast.success("Rating submitted!");
                    } catch {
                      toast.error("Failed to submit rating");
                    }
                  }}
                  className="text-xs font-semibold bg-primary text-primary-foreground px-3 py-1 rounded-full disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                >
                  {submitRating.isPending ? "..." : "Submit"}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-yellow-400 font-medium">
              You rated: {"★".repeat(Number(job.customerRating))}
              {"☆".repeat(5 - Number(job.customerRating))}
            </p>
          )}
        </div>
      )}
    </motion.div>
  );
}

export default function MechanicJobsTab({
  profile: _profile,
  onOpenChat,
}: {
  profile?: UserProfile;
  onOpenChat?: (requestId: string, name: string, otherPartyId?: string) => void;
}) {
  const { data: jobs, isLoading: jobsLoading } = useGetServiceRequests();
  const { data: historyJobs, isLoading: historyLoading } =
    useMechanicCompletedJobs();
  const { identity: iiIdentity } = useInternetIdentity();
  // Bug fix: use email identity for principal when available
  const currentPrincipal =
    (getEmailIdentity() ?? iiIdentity)?.getPrincipal().toString() ?? "";

  // Active jobs: only ACTIVE_STATUSES
  const activeJobs = (jobs ?? []).filter((j) => ACTIVE_STATUSES.has(j.status));

  // History: completed or cancelled, sorted most recent first
  const jobHistory = (historyJobs ?? []).sort(
    (a, b) => Number(b.createdAt ?? 0) - Number(a.createdAt ?? 0),
  );

  useEffect(() => {
    if (!jobsLoading && jobs !== undefined) {
      console.log(
        "[JobsTab] active jobs count:",
        activeJobs.length,
        "currentPrincipal:",
        currentPrincipal,
      );
    }
  }, [jobs, jobsLoading, currentPrincipal, activeJobs.length]);

  return (
    <div className="flex flex-col min-h-full">
      <header className="px-5 pt-12 pb-5 bg-gradient-to-b from-card to-background">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Jobs & Requests
            </h1>
            <p className="text-muted-foreground text-[11px] mt-0.5">
              Active jobs and history
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-primary" />
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-6 px-5 pb-6">
        {/* Active Jobs Section */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground">Active Jobs</h2>
            {activeJobs.length > 0 && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/20 text-primary">
                {activeJobs.length} active
              </span>
            )}
          </div>

          {jobsLoading ? (
            <div
              data-ocid="jobs.loading_state"
              className="flex justify-center py-16"
            >
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : activeJobs.length > 0 ? (
            <div className="flex flex-col gap-4">
              {activeJobs.map((job) => (
                <ActiveJobCard
                  key={job.id}
                  job={job}
                  onOpenChat={onOpenChat ?? ((_id, _name, _pid) => {})}
                  currentUserId={currentPrincipal}
                />
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              data-ocid="jobs.empty_state"
              className="flex flex-col items-center justify-center gap-4 py-16 text-center rounded-2xl bg-secondary/40 border border-border"
            >
              <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center">
                <Briefcase className="w-7 h-7 text-primary" />
              </div>
              <div>
                <p className="text-foreground font-semibold">No active jobs</p>
                <p className="text-muted-foreground text-sm mt-1">
                  Accept a request from the dashboard
                </p>
              </div>
            </motion.div>
          )}
        </div>

        {/* Job History Section */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-base font-bold text-foreground">Job History</h2>
            {jobHistory.length > 0 && (
              <span className="ml-auto text-xs font-semibold px-2.5 py-0.5 rounded-full bg-secondary text-muted-foreground">
                {jobHistory.length}
              </span>
            )}
          </div>

          {historyLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : jobHistory.length > 0 ? (
            jobHistory.map((job, i) => (
              <JobHistoryCard key={job.id} job={job} index={i} />
            ))
          ) : (
            <div
              data-ocid="jobs.history.empty_state"
              className="flex flex-col items-center gap-3 py-8 text-center rounded-2xl bg-secondary/40 border border-border"
            >
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                <History className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-sm">
                No past services yet
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
