import type { Principal } from "@icp-sdk/core/principal";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  MapPin,
  Shield,
  UserCheck,
  UserX,
  Wrench,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { UserProfile } from "../backend";
import { useActor } from "../hooks/useActor";

// Extend UserProfile locally to include verificationStatus (added by backend but not yet in TS interface)
type MechanicProfile = UserProfile & { verificationStatus?: string };

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0] ?? "")
    .join("")
    .toUpperCase();
}

function StatusBadge({ status }: { status?: string }) {
  if (!status || status === "pending") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
        <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
        Pending Review
      </span>
    );
  }
  if (status === "approved") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-500/20 text-green-400 border border-green-500/30">
        <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
        Approved
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30">
        <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
        Rejected
      </span>
    );
  }
  return null;
}

function MechanicCard({
  mechanic,
  index,
  onApprove,
  onReject,
  isUpdating,
}: {
  mechanic: MechanicProfile;
  index: number;
  onApprove: (id: Principal) => Promise<void>;
  onReject: (id: Principal) => Promise<void>;
  isUpdating: boolean;
}) {
  const status = mechanic.verificationStatus;
  const initials = getInitials(mechanic.name || "?");

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06 }}
      data-ocid={`admin.mechanic.item.${index + 1}`}
      className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-3"
    >
      <div className="flex items-start gap-3">
        {mechanic.profileImage ? (
          <img
            src={mechanic.profileImage}
            alt={mechanic.name}
            className="w-12 h-12 rounded-full object-cover border-2 border-border shrink-0"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0 border border-primary/30">
            <span className="text-primary font-bold text-base">{initials}</span>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <p className="font-bold text-foreground text-base leading-tight truncate">
            {mechanic.name || "Unknown Mechanic"}
          </p>
          {mechanic.address && (
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground text-xs truncate">
                {mechanic.address}
              </span>
            </div>
          )}
          {(mechanic.yearsOfExperience || mechanic.specialties) && (
            <p className="text-muted-foreground text-xs mt-0.5 truncate">
              {mechanic.yearsOfExperience
                ? `${Number(mechanic.yearsOfExperience)}yr${Number(mechanic.yearsOfExperience) !== 1 ? "s" : ""} exp`
                : ""}
              {mechanic.yearsOfExperience && mechanic.specialties
                ? " \u00b7 "
                : ""}
              {mechanic.specialties ?? ""}
            </p>
          )}
        </div>

        <div className="shrink-0">
          <StatusBadge status={status} />
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          data-ocid={`admin.approve.primary_button.${index + 1}`}
          disabled={status === "approved" || isUpdating}
          onClick={() => onApprove(mechanic.userId)}
          className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl bg-green-500/15 hover:bg-green-500/25 active:scale-[0.97] text-green-400 font-semibold text-sm border border-green-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isUpdating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <UserCheck className="w-3.5 h-3.5" />
          )}
          Approve
        </button>
        <button
          type="button"
          data-ocid={`admin.reject.delete_button.${index + 1}`}
          disabled={status === "rejected" || isUpdating}
          onClick={() => onReject(mechanic.userId)}
          className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl bg-red-500/15 hover:bg-red-500/25 active:scale-[0.97] text-red-400 font-semibold text-sm border border-red-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isUpdating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <UserX className="w-3.5 h-3.5" />
          )}
          Reject
        </button>
      </div>
    </motion.div>
  );
}

export default function AdminPanel() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const {
    data: mechanics,
    isLoading,
    isError,
  } = useQuery<MechanicProfile[]>({
    queryKey: ["admin", "mechanics"],
    queryFn: async () => {
      if (!actor) return [];
      // getAllMechanics is on the Backend class (not in backendInterface yet), so cast
      return (actor as any).getAllMechanics() as Promise<MechanicProfile[]>;
    },
    enabled: !!actor,
    refetchInterval: 10_000,
  });

  const handleApprove = async (mechanicId: Principal) => {
    if (!actor) return;
    const idStr = mechanicId.toString();
    setUpdatingId(idStr);
    try {
      await (actor as any).updateMechanicVerificationStatus(
        mechanicId,
        "approved",
      );
      await queryClient.invalidateQueries({ queryKey: ["admin", "mechanics"] });
      toast.success("Mechanic approved");
    } catch (err) {
      console.error("[AdminPanel] Approve error:", err);
      toast.error("Failed to approve mechanic");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleReject = async (mechanicId: Principal) => {
    if (!actor) return;
    const idStr = mechanicId.toString();
    setUpdatingId(idStr);
    try {
      await (actor as any).updateMechanicVerificationStatus(
        mechanicId,
        "rejected",
      );
      await queryClient.invalidateQueries({ queryKey: ["admin", "mechanics"] });
      toast.success("Mechanic rejected");
    } catch (err) {
      console.error("[AdminPanel] Reject error:", err);
      toast.error("Failed to reject mechanic");
    } finally {
      setUpdatingId(null);
    }
  };

  const pending = (mechanics ?? []).filter(
    (m) => !m.verificationStatus || m.verificationStatus === "pending",
  );
  const approved = (mechanics ?? []).filter(
    (m) => m.verificationStatus === "approved",
  );
  const rejected = (mechanics ?? []).filter(
    (m) => m.verificationStatus === "rejected",
  );
  const others = [...approved, ...rejected];

  return (
    <div className="flex flex-col min-h-full">
      <header className="px-5 pt-12 pb-5 bg-gradient-to-b from-card to-background">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Admin Panel
            </h1>
            <p className="text-muted-foreground text-xs">
              Mechanic Verification
            </p>
          </div>
        </div>

        {!isLoading && mechanics && (
          <div className="flex gap-3 mt-3">
            <div className="flex-1 bg-card border border-border rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-yellow-400">
                {pending.length}
              </p>
              <p className="text-muted-foreground text-xs mt-0.5">Pending</p>
            </div>
            <div className="flex-1 bg-card border border-border rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-green-400">
                {approved.length}
              </p>
              <p className="text-muted-foreground text-xs mt-0.5">Approved</p>
            </div>
            <div className="flex-1 bg-card border border-border rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-red-400">
                {rejected.length}
              </p>
              <p className="text-muted-foreground text-xs mt-0.5">Rejected</p>
            </div>
          </div>
        )}
      </header>

      <div className="flex flex-col gap-4 px-5 pb-8">
        {isLoading ? (
          <div
            data-ocid="admin.mechanics.loading_state"
            className="flex flex-col items-center justify-center py-20 gap-3"
          >
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground text-sm">
              Loading mechanics...
            </p>
          </div>
        ) : isError ? (
          <div
            data-ocid="admin.mechanics.error_state"
            className="flex flex-col items-center justify-center py-16 gap-3 text-center"
          >
            <XCircle className="w-10 h-10 text-red-400" />
            <p className="text-foreground font-semibold">
              Failed to load mechanics
            </p>
            <p className="text-muted-foreground text-sm">
              Please check your connection
            </p>
          </div>
        ) : !mechanics || mechanics.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            data-ocid="admin.mechanics.empty_state"
            className="flex flex-col items-center justify-center py-20 gap-4 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
              <Wrench className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <p className="text-foreground font-semibold text-lg">
                No mechanics yet
              </p>
              <p className="text-muted-foreground text-sm mt-1">
                No mechanics have signed up yet.
              </p>
            </div>
          </motion.div>
        ) : (
          <>
            {pending.length > 0 && (
              <>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-foreground">
                    Pending Review
                  </h2>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400">
                    {pending.length}
                  </span>
                </div>
                {pending.map((mechanic, i) => (
                  <MechanicCard
                    key={mechanic.userId.toString()}
                    mechanic={mechanic}
                    index={i}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    isUpdating={updatingId === mechanic.userId.toString()}
                  />
                ))}
              </>
            )}

            {others.length > 0 && (
              <>
                <div className="flex items-center gap-2 mt-2">
                  <h2 className="text-base font-bold text-foreground">
                    All Mechanics
                  </h2>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                    {others.length}
                  </span>
                </div>
                {others.map((mechanic, i) => (
                  <MechanicCard
                    key={mechanic.userId.toString()}
                    mechanic={mechanic}
                    index={pending.length + i}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    isUpdating={updatingId === mechanic.userId.toString()}
                  />
                ))}
              </>
            )}
          </>
        )}
      </div>

      <div className="px-5 pb-6 mt-auto">
        <p className="text-muted-foreground text-xs text-center">
          &copy; {new Date().getFullYear()}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            caffeine.ai
          </a>
        </p>
      </div>
    </div>
  );
}
