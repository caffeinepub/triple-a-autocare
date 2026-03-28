import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import {
  CalendarDays,
  CheckCircle,
  Clock,
  History,
  Loader2,
  MapPin,
  MessageCircle,
  PlusCircle,
  Wrench,
  X,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Variant_cancelled_pending_completed_confirmed } from "../backend";
import type { Booking } from "../backend";
import MechanicRequestModal from "../components/MechanicRequestModal";
import ReviewModal from "../components/ReviewModal";
import {
  useCancelServiceRequest,
  useCustomerActiveRequest,
  useCustomerCompletedRequests,
  useCustomerRespondToPrice,
  useMechanics,
  useUserBookings,
} from "../hooks/useQueries";
import type { ExtendedServiceRequest } from "../hooks/useQueries";
import {
  playMechanicFound,
  playPriceUpdate,
  playSoftNotification,
} from "../utils/sounds";

const ACTIVE_STATUSES = new Set([
  "searching",
  "accepted",
  "on_the_way",
  "arrived",
  "price_sent",
  "approved",
]);

const CHAT_STATUSES = new Set(["accepted", "on_the_way", "arrived"]);

const CANCEL_STATUSES = new Set([
  "searching",
  "accepted",
  "on_the_way",
  "arrived",
]);

const REQUEST_STATUS_LABELS: Record<string, string> = {
  searching: "Searching for Mechanic",
  accepted: "Mechanic Accepted",
  on_the_way: "On the Way",
  arrived: "Mechanic Arrived",
  price_sent: "Price Sent",
  approved: "Approved",
  cancelled: "Cancelled",
  completed: "Completed",
};

const REQUEST_STATUS_COLORS: Record<string, string> = {
  searching: "bg-yellow-500/15 text-yellow-400",
  accepted: "bg-yellow-500/15 text-yellow-400",
  on_the_way: "bg-blue-500/15 text-blue-400",
  arrived: "bg-orange-500/15 text-orange-400",
  price_sent: "bg-purple-500/15 text-purple-400",
  approved: "bg-green-500/15 text-green-400",
  cancelled: "bg-red-500/15 text-red-400",
  completed: "bg-green-500/15 text-green-400",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/15 text-yellow-400",
  confirmed: "bg-blue-500/15 text-blue-400",
  completed: "bg-green-500/15 text-green-400",
  cancelled: "bg-red-500/15 text-red-400",
};

function ActiveRequestCard({
  request,
  onOpenChat,
}: {
  request: ExtendedServiceRequest;
  onOpenChat: (id: string, name: string) => void;
}) {
  const respondToPrice = useCustomerRespondToPrice();
  const cancelRequest = useCancelServiceRequest();
  const prevStatusRef = useRef<string>(request.status);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  useEffect(() => {
    if (request.status !== prevStatusRef.current) {
      if (request.status === "accepted") {
        playMechanicFound();
      } else if (request.status === "price_sent") {
        playPriceUpdate();
      } else if (
        request.status === "on_the_way" ||
        request.status === "arrived" ||
        request.status === "completed"
      ) {
        playSoftNotification();
      }
      prevStatusRef.current = request.status;
    }
  }, [request.status]);

  const handleRespond = async (accept: boolean) => {
    try {
      await respondToPrice.mutateAsync({
        requestId: request.id,
        accept,
      });
      toast.success(accept ? "Price accepted!" : "Price rejected");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to respond to price";
      toast.error(msg);
    }
  };

  const handleCancel = async () => {
    try {
      await cancelRequest.mutateAsync({
        requestId: request.id,
        cancelledBy: "customer",
      });
      toast.success("Service cancelled");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to cancel";
      toast.error(msg);
    } finally {
      setShowCancelDialog(false);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        data-ocid="bookings.active_request.card"
        className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-3"
      >
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
            <Wrench className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold text-foreground truncate">
                {request.serviceType}
              </p>
              <span
                className={`text-[11px] font-medium px-2.5 py-1 rounded-full capitalize shrink-0 ${
                  REQUEST_STATUS_COLORS[request.status] ??
                  "bg-secondary text-muted-foreground"
                }`}
              >
                {REQUEST_STATUS_LABELS[request.status] ?? request.status}
              </span>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground text-xs truncate">
                {request.address || request.location}
              </span>
            </div>
          </div>
        </div>

        {/* Searching pulse indicator */}
        {request.status === "searching" && (
          <div className="flex items-center gap-2 text-sm text-yellow-400">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-yellow-400" />
            </span>
            Searching for a nearby mechanic...
          </div>
        )}

        <p className="text-foreground/70 text-sm leading-relaxed">
          {request.issueDescription}
        </p>

        {request.mechanicName && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Mechanic:</span>
            <span className="text-foreground font-medium">
              {request.mechanicName}
            </span>
          </div>
        )}

        {/* Chat button */}
        {CHAT_STATUSES.has(request.status) && (
          <button
            type="button"
            data-ocid="bookings.chat.button"
            onClick={() =>
              onOpenChat(request.id, request.mechanicName ?? "Mechanic")
            }
            className="w-full py-3 rounded-2xl border border-border text-muted-foreground font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          >
            <MessageCircle className="w-4 h-4" />
            Chat with Mechanic
          </button>
        )}

        {/* Price section */}
        {request.status === "price_sent" && request.price != null && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between rounded-xl bg-purple-500/10 border border-purple-500/20 px-4 py-3">
              <span className="text-sm text-foreground font-medium">
                Mechanic quoted
              </span>
              <span className="text-primary font-bold text-base">
                ₦{Number(request.price).toLocaleString("en-NG")}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                data-ocid="bookings.accept_price.button"
                disabled={respondToPrice.isPending}
                onClick={() => handleRespond(true)}
                className="flex-1 h-11 rounded-xl bg-green-500 text-white font-bold text-sm flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform disabled:opacity-60"
              >
                {respondToPrice.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                Accept
              </button>
              <button
                type="button"
                data-ocid="bookings.reject_price.button"
                disabled={respondToPrice.isPending}
                onClick={() => handleRespond(false)}
                className="flex-1 h-11 rounded-xl bg-red-500/15 text-red-400 border border-red-500/30 font-bold text-sm flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform disabled:opacity-60"
              >
                <XCircle className="w-4 h-4" />
                Reject
              </button>
            </div>
          </div>
        )}

        {request.status === "approved" && request.price != null && (
          <div className="flex items-center justify-between rounded-xl bg-green-500/10 border border-green-500/20 px-4 py-3">
            <span className="text-sm text-foreground font-medium">
              Price Approved
            </span>
            <span className="text-green-400 font-bold text-base">
              ₦{Number(request.price).toLocaleString("en-NG")}
            </span>
          </div>
        )}

        {/* Cancel button */}
        {CANCEL_STATUSES.has(request.status) && (
          <button
            type="button"
            data-ocid="bookings.cancel.button"
            disabled={cancelRequest.isPending}
            onClick={() => setShowCancelDialog(true)}
            className="w-full h-11 rounded-xl bg-red-500/15 text-red-400 border border-red-500/30 font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-60"
          >
            {cancelRequest.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <X className="w-4 h-4" />
            )}
            {request.status === "searching"
              ? "Cancel Request"
              : "Cancel Service"}
          </button>
        )}
      </motion.div>

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent
          data-ocid="bookings.cancel.dialog"
          className="bg-card border-border"
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              Cancel Service?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to cancel this service? This cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              data-ocid="bookings.cancel.cancel_button"
              className="border-border text-foreground"
            >
              Keep Service
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="bookings.cancel.confirm_button"
              onClick={handleCancel}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              Yes, Cancel
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function HistoryCard({
  request,
  index,
}: { request: ExtendedServiceRequest; index: number }) {
  const isCompleted = request.status === "completed";
  const isCancelled = request.status === "cancelled";

  const dateStr = request.createdAt
    ? new Date(Number(request.createdAt) / 1_000_000).toLocaleDateString(
        "en-NG",
        { day: "numeric", month: "short", year: "numeric" },
      )
    : "";

  const cancelledByLabel =
    request.cancelledBy === "customer"
      ? "Cancelled by you"
      : request.cancelledBy === "mechanic"
        ? "Cancelled by mechanic"
        : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      data-ocid={`history.item.${index + 1}`}
      className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-2"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground text-sm truncate">
            {request.serviceType}
          </p>
          <div className="flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground text-xs truncate">
              {request.address || request.location}
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
        {request.issueDescription}
      </p>

      {request.mechanicName && (
        <p className="text-xs text-muted-foreground">
          Mechanic:{" "}
          <span className="text-foreground font-medium">
            {request.mechanicName}
          </span>
        </p>
      )}

      {isCancelled && cancelledByLabel && (
        <p className="text-xs text-red-400/80">{cancelledByLabel}</p>
      )}

      <div className="flex items-center justify-between mt-1">
        {request.price != null && isCompleted ? (
          <span className="text-primary font-bold text-sm">
            ₦{Number(request.price).toLocaleString("en-NG")}
          </span>
        ) : (
          <span />
        )}
        {dateStr && (
          <span className="text-xs text-muted-foreground">{dateStr}</span>
        )}
      </div>
    </motion.div>
  );
}

function BookingCard({
  booking,
  mechanicName,
  index,
  onReview,
}: {
  booking: Booking;
  mechanicName: string;
  index: number;
  onReview: () => void;
}) {
  const isCompleted =
    booking.status === Variant_cancelled_pending_completed_confirmed.completed;

  return (
    <motion.div
      data-ocid={`booking.item.${index + 1}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-card rounded-2xl p-4 border border-border flex flex-col gap-3"
    >
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center shrink-0">
          <Wrench className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground truncate">
            {mechanicName}
          </p>
          <p className="text-muted-foreground text-xs mt-0.5">
            {booking.serviceType}
          </p>
        </div>
        <span
          className={`text-[11px] font-medium px-2.5 py-1 rounded-full capitalize shrink-0 ${
            STATUS_COLORS[booking.status] ??
            "bg-secondary text-muted-foreground"
          }`}
        >
          {booking.status}
        </span>
      </div>
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <CalendarDays className="w-3.5 h-3.5" />
          <span>{booking.scheduledDate}</span>
        </div>
        <span>·</span>
        <span>{booking.scheduledTime}</span>
      </div>
      {isCompleted && (
        <button
          type="button"
          data-ocid={`booking.review.button.${index + 1}`}
          onClick={onReview}
          className="w-full h-11 rounded-xl border border-primary text-primary font-semibold text-sm active:scale-[0.98] transition-transform"
        >
          ⭐ Rate &amp; Review
        </button>
      )}
    </motion.div>
  );
}

export default function BookingsTab({
  onOpenChat,
}: { onOpenChat?: (requestId: string, name: string) => void }) {
  const { data: bookings, isLoading: bookingsLoading } = useUserBookings();
  const { data: mechanics } = useMechanics();
  const { data: activeRequest, isLoading: requestLoading } =
    useCustomerActiveRequest();
  const { data: serviceHistory, isLoading: historyLoading } =
    useCustomerCompletedRequests();
  const [requestOpen, setRequestOpen] = useState(false);
  const [reviewState, setReviewState] = useState<{
    open: boolean;
    mechanicId: string;
    mechanicName: string;
    bookingId: string;
  } | null>(null);

  const getMechanicName = (id: string) =>
    mechanics?.find((m) => m.id === id)?.name ?? "Unknown Mechanic";

  const isLoading = bookingsLoading || requestLoading;

  // Active request: only show if status is in ACTIVE_STATUSES
  const hasActiveRequest =
    activeRequest != null && ACTIVE_STATUSES.has(activeRequest.status);

  // Sort history most recent first
  const sortedHistory = serviceHistory
    ? [...serviceHistory].sort(
        (a, b) => Number(b.createdAt ?? 0) - Number(a.createdAt ?? 0),
      )
    : [];

  return (
    <div className="flex flex-col min-h-full">
      <header className="px-5 pt-12 pb-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">My Bookings</h1>
          <button
            type="button"
            data-ocid="bookings.new.button"
            onClick={() => setRequestOpen(true)}
            className="flex items-center gap-1.5 h-10 px-4 rounded-full bg-primary text-primary-foreground font-semibold text-sm"
          >
            <PlusCircle className="w-4 h-4" />
            New
          </button>
        </div>
      </header>

      <div className="px-5 pb-6 flex flex-col gap-6">
        {/* Active Bookings Section */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground">
              Active Bookings
            </h2>
            {hasActiveRequest && (
              <Badge className="bg-primary/20 text-primary border-0 text-xs px-2.5 py-0.5">
                1 active
              </Badge>
            )}
          </div>

          {isLoading ? (
            <div
              data-ocid="bookings.loading_state"
              className="flex justify-center py-10"
            >
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : hasActiveRequest ? (
            <ActiveRequestCard
              request={activeRequest}
              onOpenChat={onOpenChat ?? ((_id, _name) => {})}
            />
          ) : (
            <div
              data-ocid="bookings.active.empty_state"
              className="flex flex-col items-center gap-3 py-8 text-center rounded-2xl bg-secondary/40 border border-border"
            >
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                <Clock className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-sm">
                No active bookings
              </p>
            </div>
          )}
        </div>

        {/* Scheduled Bookings Section */}
        {bookings && bookings.length > 0 && (
          <div className="flex flex-col gap-3">
            <h2 className="text-base font-bold text-foreground">
              Scheduled Bookings
            </h2>
            {bookings.map((booking, i) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                mechanicName={getMechanicName(booking.mechanicId)}
                index={i}
                onReview={() =>
                  setReviewState({
                    open: true,
                    mechanicId: booking.mechanicId,
                    mechanicName: getMechanicName(booking.mechanicId),
                    bookingId: booking.id,
                  })
                }
              />
            ))}
          </div>
        )}

        {/* Service History Section */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-base font-bold text-foreground">
              Service History
            </h2>
            {sortedHistory.length > 0 && (
              <span className="ml-auto text-xs font-semibold px-2.5 py-0.5 rounded-full bg-secondary text-muted-foreground">
                {sortedHistory.length}
              </span>
            )}
          </div>

          {historyLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : sortedHistory.length > 0 ? (
            sortedHistory.map((req, i) => (
              <HistoryCard key={req.id} request={req} index={i} />
            ))
          ) : (
            <div
              data-ocid="bookings.history.empty_state"
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

        {!isLoading &&
          !hasActiveRequest &&
          (!bookings || bookings.length === 0) &&
          sortedHistory.length === 0 && (
            <div
              data-ocid="bookings.empty_state"
              className="flex flex-col items-center gap-4 py-10 text-center"
            >
              <button
                type="button"
                data-ocid="bookings.book_now.primary_button"
                onClick={() => setRequestOpen(true)}
                className="h-12 px-8 rounded-2xl bg-primary text-primary-foreground font-bold text-base active:scale-[0.98] transition-transform shadow-yellow"
              >
                Book a Mechanic
              </button>
            </div>
          )}
      </div>

      <MechanicRequestModal
        open={requestOpen}
        onClose={() => setRequestOpen(false)}
      />

      {reviewState && (
        <ReviewModal
          open={reviewState.open}
          onClose={() => setReviewState(null)}
          mechanicId={reviewState.mechanicId}
          mechanicName={reviewState.mechanicName}
          bookingId={reviewState.bookingId}
        />
      )}
    </div>
  );
}
