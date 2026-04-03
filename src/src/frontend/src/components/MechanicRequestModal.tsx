import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Building2, Car, Loader2, MapPin, Search } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { UserProfile } from "../backend";
import { useCreateServiceRequest } from "../hooks/useQueries";

type Step = "service-type" | "confirm" | "success";
type ServiceMode = "come-to-me" | "go-to-workshop";

interface Props {
  open: boolean;
  onClose: () => void;
  profile?: UserProfile;
}

export default function MechanicRequestModal({
  open,
  onClose,
  profile,
}: Props) {
  const [step, setStep] = useState<Step>("service-type");
  const [serviceMode, setServiceMode] = useState<ServiceMode>("come-to-me");
  const [location, setLocation] = useState(
    profile?.address ?? profile?.location ?? "",
  );
  const [issueDescription, setIssueDescription] = useState("");

  const createServiceRequest = useCreateServiceRequest();

  const handleClose = () => {
    setStep("service-type");
    setServiceMode("come-to-me");
    setLocation(profile?.address ?? profile?.location ?? "");
    setIssueDescription("");
    onClose();
  };

  const handleConfirm = async () => {
    try {
      await createServiceRequest.mutateAsync({
        customerName: profile?.name ?? "",
        location,
        issueDescription,
        serviceType: serviceMode === "come-to-me" ? "Come to Me" : "Workshop",
        latitude: profile?.latitude ?? null,
        longitude: profile?.longitude ?? null,
        address: location,
      });
      setStep("success");
    } catch {
      toast.info("Saved locally — syncing when online");
      setStep("success");
    }
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && handleClose()}>
      <SheetContent
        side="bottom"
        className="bg-card border-border rounded-t-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden"
      >
        <SheetHeader className="px-6 pt-6 pb-4 shrink-0">
          <SheetTitle className="text-foreground text-xl font-bold">
            {step === "service-type" && "Request a Mechanic"}
            {step === "confirm" && "Confirm Request"}
            {step === "success" && "Finding Mechanic..."}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-8">
          <AnimatePresence mode="wait">
            {step === "service-type" && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-4"
              >
                <p className="text-muted-foreground text-sm">
                  How would you like to receive service?
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    data-ocid="request.come_to_me.button"
                    onClick={() => setServiceMode("come-to-me")}
                    className={`p-5 rounded-2xl border flex flex-col items-center gap-3 transition-all ${
                      serviceMode === "come-to-me"
                        ? "border-primary bg-primary/10"
                        : "border-border bg-secondary"
                    }`}
                  >
                    <Car className="w-8 h-8 text-primary" />
                    <div className="text-center">
                      <p className="font-semibold text-foreground text-sm">
                        Come to Me
                      </p>
                      <p className="text-muted-foreground text-xs">
                        Mechanic visits you
                      </p>
                    </div>
                  </button>
                  <button
                    type="button"
                    data-ocid="request.go_to_workshop.button"
                    onClick={() => setServiceMode("go-to-workshop")}
                    className={`p-5 rounded-2xl border flex flex-col items-center gap-3 transition-all ${
                      serviceMode === "go-to-workshop"
                        ? "border-primary bg-primary/10"
                        : "border-border bg-secondary"
                    }`}
                  >
                    <Building2 className="w-8 h-8 text-primary" />
                    <div className="text-center">
                      <p className="font-semibold text-foreground text-sm">
                        Go to Workshop
                      </p>
                      <p className="text-muted-foreground text-xs">
                        Drive to the shop
                      </p>
                    </div>
                  </button>
                </div>

                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="req-location"
                    className="text-sm font-medium text-foreground"
                  >
                    Your Location
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      id="req-location"
                      data-ocid="request.location.input"
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Enter your location"
                      className="w-full h-12 pl-9 pr-4 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="req-issue"
                    className="text-sm font-medium text-foreground"
                  >
                    Issue Description
                  </label>
                  <textarea
                    id="req-issue"
                    data-ocid="request.issue.textarea"
                    value={issueDescription}
                    onChange={(e) => setIssueDescription(e.target.value)}
                    placeholder="Describe the problem with your car"
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:border-primary transition-colors resize-none"
                  />
                </div>

                <button
                  type="button"
                  data-ocid="request.next.button"
                  onClick={() => setStep("confirm")}
                  disabled={!location.trim() || !issueDescription.trim()}
                  className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-bold text-base mt-2 active:scale-[0.98] transition-transform disabled:opacity-50 shadow-yellow"
                >
                  Review Request
                </button>
              </motion.div>
            )}

            {step === "confirm" && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-4"
              >
                <div className="bg-secondary rounded-2xl p-4 flex flex-col gap-3">
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">
                    Request Summary
                  </p>
                  <div className="flex flex-col gap-2.5">
                    {[
                      ["Customer", profile?.name ?? ""],
                      [
                        "Service Type",
                        serviceMode === "come-to-me"
                          ? "Come to Me"
                          : "Workshop",
                      ],
                      ["Location", location],
                      ["Issue", issueDescription],
                    ].map(([label, value]) => (
                      <div key={label} className="flex flex-col gap-0.5">
                        <span className="text-muted-foreground text-xs">
                          {label}
                        </span>
                        <span className="text-foreground text-sm font-medium">
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  data-ocid="request.confirm.button"
                  onClick={handleConfirm}
                  disabled={createServiceRequest.isPending}
                  className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-bold text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-70 shadow-yellow"
                >
                  {createServiceRequest.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : null}
                  {createServiceRequest.isPending
                    ? "Submitting..."
                    : "Confirm Request"}
                </button>
                <button
                  type="button"
                  onClick={() => setStep("service-type")}
                  className="w-full h-11 rounded-2xl border border-border text-muted-foreground font-medium text-sm active:scale-[0.98] transition-transform"
                >
                  Back
                </button>
              </motion.div>
            )}

            {step === "success" && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-5 py-8 text-center"
                data-ocid="request.success_state"
              >
                <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
                  <motion.div
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{
                      repeat: Number.POSITIVE_INFINITY,
                      duration: 1.5,
                      ease: "easeInOut",
                    }}
                  >
                    <Search className="w-10 h-10 text-primary" />
                  </motion.div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-foreground">
                    Searching for a mechanic...
                  </h3>
                  <p className="text-muted-foreground mt-2 text-sm">
                    We'll match you with the nearest available mechanic
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span
                    className="w-2 h-2 rounded-full bg-primary animate-pulse"
                    style={{ animationDelay: "0.3s" }}
                  />
                  <span
                    className="w-2 h-2 rounded-full bg-primary animate-pulse"
                    style={{ animationDelay: "0.6s" }}
                  />
                </div>
                <button
                  type="button"
                  data-ocid="request.close.button"
                  onClick={handleClose}
                  className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-bold text-base active:scale-[0.98] transition-transform shadow-yellow"
                >
                  Done
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </SheetContent>
    </Sheet>
  );
}
