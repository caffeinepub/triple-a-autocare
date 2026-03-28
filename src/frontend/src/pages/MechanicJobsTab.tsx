import { Badge } from "@/components/ui/badge";
import { Briefcase, Loader2, MapPin, MessageCircle } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Variant_on_the_way_arrived_completed_accepted } from "../backend";
import type { UserProfile } from "../backend";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import type { ExtendedServiceRequest } from "../hooks/useQueries";
import {
  useCompleteJob,
  useGetServiceRequests,
  useUpdateServiceRequest,
  useUpdateServiceRequestStatus,
} from "../hooks/useQueries";
import { playSoftNotification } from "../utils/sounds";

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("");
}

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
      return "bg-secondary text-muted-foreground";
    default:
      return "bg-secondary text-muted-foreground";
  }
}

const CHAT_STATUSES = new Set(["accepted", "on_the_way", "arrived"]);

function ActiveJobCard({
  job,
  onOpenChat,
}: {
  job: ExtendedServiceRequest;
  onOpenChat: (id: string, name: string) => void;
}) {
  const updateStatus = useUpdateServiceRequestStatus();
  const updateServiceRequest = useUpdateServiceRequest();
  const completeJob = useCompleteJob();
  const [priceInput, setPriceInput] = useState("");
  const [priceError, setPriceError] = useState<string | null>(null);

  // Play soft sound when job status changes externally (e.g. customer approved)
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      data-ocid="jobs.active.card"
      className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-4"
    >
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center shrink-0">
          <span className="text-primary-foreground font-bold text-sm">
            {getInitials(job.customerName)}
          </span>
        </div>
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
              {job.location}
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
          <span className="text-foreground font-medium">{job.serviceType}</span>
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
          onClick={() => onOpenChat(job.id, job.customerName ?? "Customer")}
          className="w-full py-3 rounded-2xl border border-border text-muted-foreground font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        >
          <MessageCircle className="w-4 h-4" />
          Chat with Customer
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
            handleUpdate(Variant_on_the_way_arrived_completed_accepted.arrived)
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
    </motion.div>
  );
}

export default function MechanicJobsTab({
  profile: _profile,
  onOpenChat,
}: {
  profile?: UserProfile;
  onOpenChat?: (requestId: string, name: string) => void;
}) {
  const { data: jobs, isLoading } = useGetServiceRequests();
  const { identity } = useInternetIdentity();
  const currentPrincipal = identity?.getPrincipal().toString() ?? "";

  const activeJobs = jobs ?? [];

  // Debug: log mechanicId match whenever jobs change
  useEffect(() => {
    if (!isLoading && jobs !== undefined) {
      console.log(
        "[JobsTab] jobs count:",
        jobs.length,
        "currentPrincipal:",
        currentPrincipal,
      );
      for (const job of jobs) {
        const jobMechanicId = job.mechanicId
          ? Array.isArray(job.mechanicId)
            ? (job.mechanicId[0]?.toString() ?? "null")
            : job.mechanicId.toString()
          : "null";
        console.log(
          "[JobsTab] job:",
          job.id,
          "status:",
          job.status,
          "mechanicId:",
          jobMechanicId,
          "match:",
          jobMechanicId === currentPrincipal,
        );
      }
    }
  }, [jobs, isLoading, currentPrincipal]);

  return (
    <div className="flex flex-col min-h-full">
      <header className="px-5 pt-12 pb-5 bg-gradient-to-b from-card to-background">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Jobs & Requests
            </h1>
            <p className="text-muted-foreground text-[11px] mt-0.5">
              Your active and completed jobs
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-primary" />
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-6 px-5 pb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground">Active Jobs</h2>
          {activeJobs.length > 0 && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/20 text-primary">
              {activeJobs.length} active
            </span>
          )}
        </div>

        {isLoading ? (
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
                onOpenChat={onOpenChat ?? ((_id, _name) => {})}
              />
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            data-ocid="jobs.empty_state"
            className="flex flex-col items-center justify-center gap-4 py-20 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
              <Briefcase className="w-8 h-8 text-primary" />
            </div>
            <div>
              <p className="text-foreground font-semibold text-lg">
                No active jobs
              </p>
              <p className="text-muted-foreground text-sm mt-1">
                Accept a request from the dashboard to get started
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
