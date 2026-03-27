import { Loader2, ShieldCheck, User, Wrench, Zap } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function LoginScreen() {
  const { login, isLoggingIn, isLoginError, loginError } =
    useInternetIdentity();
  const [pendingRole, setPendingRole] = useState<
    "customer" | "mechanic" | null
  >(null);

  const handleSignUp = (role: "customer" | "mechanic") => {
    setPendingRole(role);
    sessionStorage.setItem("pending-role", role);
    login();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-[430px] flex flex-col items-center gap-8">
        <motion.div
          className="flex flex-col items-center gap-3"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center shadow-yellow">
            <Wrench className="w-10 h-10 text-primary-foreground" />
          </div>
          <div className="text-center">
            <h1 className="text-4xl font-bold text-foreground tracking-tight">
              Triple A
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Affordability, Availability, Accountability
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <img
            src="/assets/generated/hero-car-transparent.dim_600x320.png"
            alt="Auto service"
            className="w-full max-w-[320px] object-contain"
          />
        </motion.div>

        <motion.div
          className="w-full grid grid-cols-3 gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {[
            { icon: Wrench, label: "Expert Mechanics" },
            { icon: Zap, label: "Fast Response" },
            { icon: ShieldCheck, label: "Verified Pros" },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-2 bg-card rounded-2xl p-3"
            >
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <span className="text-xs text-muted-foreground text-center leading-tight">
                {label}
              </span>
            </div>
          ))}
        </motion.div>

        <motion.div
          className="w-full flex flex-col gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <p className="text-center text-sm text-muted-foreground font-medium">
            Choose your account type to get started
          </p>

          <button
            type="button"
            data-ocid="login.customer.primary_button"
            onClick={() => handleSignUp("customer")}
            disabled={isLoggingIn}
            className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-bold text-lg flex items-center justify-center gap-2 shadow-yellow active:scale-[0.98] transition-transform disabled:opacity-70"
          >
            {isLoggingIn && pendingRole === "customer" ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <User className="w-5 h-5" />
            )}
            {isLoggingIn && pendingRole === "customer"
              ? "Connecting..."
              : "Sign up as Customer"}
          </button>

          <button
            type="button"
            data-ocid="login.mechanic.secondary_button"
            onClick={() => handleSignUp("mechanic")}
            disabled={isLoggingIn}
            className="w-full h-14 rounded-2xl border-2 border-primary text-primary font-bold text-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-70 hover:bg-primary/10"
          >
            {isLoggingIn && pendingRole === "mechanic" ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Wrench className="w-5 h-5" />
            )}
            {isLoggingIn && pendingRole === "mechanic"
              ? "Connecting..."
              : "Sign up as Mechanic"}
          </button>

          {isLoginError && (
            <p
              data-ocid="login.error_state"
              className="text-destructive text-sm text-center"
            >
              {loginError?.message ?? "Login failed. Please try again."}
            </p>
          )}
          <p className="text-muted-foreground text-xs text-center">
            Secure login via Internet Identity — no password needed
          </p>
        </motion.div>

        <p className="text-muted-foreground text-xs text-center pb-4">
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
