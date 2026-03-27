import { Car, Loader2, Wrench } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

interface Props {
  onSelectRole: (role: "customer" | "mechanic") => Promise<void>;
  isSaving: boolean;
}

export default function RoleSelectionScreen({ onSelectRole, isSaving }: Props) {
  const [selected, setSelected] = useState<"customer" | "mechanic" | null>(
    null,
  );

  const handleSelect = async (role: "customer" | "mechanic") => {
    setSelected(role);
    await onSelectRole(role);
  };

  const roles = [
    {
      key: "customer" as const,
      icon: Car,
      title: "Customer",
      description: "Request mechanics, book services, and buy car parts",
      cta: "Continue as Customer",
      ocid: "role.customer.button",
    },
    {
      key: "mechanic" as const,
      icon: Wrench,
      title: "Mechanic",
      description: "Receive job requests, earn money, and manage services",
      cta: "Continue as Mechanic",
      ocid: "role.mechanic.button",
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5 py-12">
      <motion.div
        className="w-full max-w-[430px] flex flex-col gap-8"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {/* Header */}
        <div className="text-center">
          <motion.div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-4 shadow-yellow"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.4 }}
          >
            <Car className="w-8 h-8 text-primary-foreground" />
          </motion.div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            Choose Your Role
          </h1>
          <p className="text-muted-foreground mt-2 text-base">
            Select how you want to use Triple A AutoCare
          </p>
        </div>

        {/* Role Cards */}
        <div className="flex flex-col gap-4">
          {roles.map((role, i) => {
            const Icon = role.icon;
            const isActive = selected === role.key;
            const isLoading = isSaving && isActive;

            return (
              <motion.div
                key={role.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + i * 0.12, duration: 0.4 }}
                className={`bg-card border rounded-2xl p-6 flex flex-col gap-5 transition-all duration-200 ${
                  isActive
                    ? "border-primary shadow-yellow"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">
                      {role.title}
                    </h2>
                    <p className="text-muted-foreground text-sm mt-1 leading-relaxed">
                      {role.description}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  data-ocid={role.ocid}
                  onClick={() => handleSelect(role.key)}
                  disabled={isSaving}
                  className="w-full h-14 rounded-xl bg-primary text-primary-foreground font-bold text-base flex items-center justify-center gap-2 shadow-yellow active:scale-[0.98] transition-all disabled:opacity-70"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : null}
                  {isLoading ? "Saving..." : role.cta}
                </button>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
