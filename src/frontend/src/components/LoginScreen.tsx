import {
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  Mail,
  ShieldCheck,
  User,
  Wrench,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { deriveIdentityFromCredentials } from "../utils/emailAuth";

type View = "main" | "email";
type EmailMode = "login" | "signup";

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function LoginScreen() {
  const {
    login,
    isLoggingIn,
    isLoginError,
    loginError,
    loginWithEmailIdentity,
  } = useInternetIdentity();
  const [pendingRole, setPendingRole] = useState<
    "customer" | "mechanic" | null
  >(null);
  const [view, setView] = useState<View>("main");
  const [emailMode, setEmailMode] = useState<EmailMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [isEmailLoading, setIsEmailLoading] = useState(false);

  const handleSignUp = (role: "customer" | "mechanic") => {
    setPendingRole(role);
    sessionStorage.setItem("pending-role", role);
    login();
  };

  const handleEmailSubmit = async () => {
    setEmailError("");
    if (!email.trim() || !validateEmail(email)) {
      setEmailError("Enter a valid email address");
      return;
    }
    if (!password.trim() || password.length < 6) {
      setEmailError("Password must be at least 6 characters");
      return;
    }
    setIsEmailLoading(true);
    try {
      const derivedIdentity = await deriveIdentityFromCredentials(
        email,
        password,
      );
      if (emailMode === "signup") {
        sessionStorage.setItem("pending-role", "customer");
      }
      loginWithEmailIdentity(derivedIdentity);
    } catch (err) {
      setEmailError(
        err instanceof Error ? err.message : "Authentication failed",
      );
    } finally {
      setIsEmailLoading(false);
    }
  };

  const handleBack = () => {
    setView("main");
    setEmail("");
    setPassword("");
    setEmailError("");
    setShowPassword(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-[430px] flex flex-col items-center gap-8">
        <AnimatePresence mode="wait">
          {view === "main" ? (
            <motion.div
              key="main"
              className="w-full flex flex-col items-center gap-8"
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.25 }}
            >
              {/* Logo */}
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

              {/* Hero image */}
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

              {/* Feature grid */}
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

              {/* Auth buttons */}
              <motion.div
                className="w-full flex flex-col gap-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <p className="text-center text-sm text-muted-foreground font-medium">
                  Sign in with Internet Identity
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

                {/* Divider */}
                <div className="flex items-center gap-3 my-1">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground">or</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                {/* Continue with Email */}
                <button
                  type="button"
                  data-ocid="login.email.primary_button"
                  onClick={() => setView("email")}
                  className="w-full h-14 rounded-2xl border border-border bg-card text-foreground font-semibold text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-transform hover:bg-card/80"
                >
                  <Mail className="w-5 h-5 text-muted-foreground" />
                  Continue with Email
                </button>

                <p className="text-muted-foreground text-xs text-center">
                  Secure login via Internet Identity — no password needed
                </p>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="email"
              className="w-full flex flex-col gap-6"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24 }}
              transition={{ duration: 0.25 }}
            >
              {/* Back + Title */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  data-ocid="login.email.close_button"
                  onClick={handleBack}
                  className="w-10 h-10 rounded-xl bg-card flex items-center justify-center hover:bg-secondary transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-foreground" />
                </button>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">
                    {emailMode === "login" ? "Welcome back" : "Create account"}
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    {emailMode === "login"
                      ? "Sign in to your Triple A account"
                      : "Join Triple A AutoCare today"}
                  </p>
                </div>
              </div>

              {/* Mode tabs */}
              <div className="flex bg-card rounded-2xl p-1 gap-1">
                <button
                  type="button"
                  data-ocid="login.email.login.tab"
                  onClick={() => {
                    setEmailMode("login");
                    setEmailError("");
                  }}
                  className={`flex-1 h-10 rounded-xl font-semibold text-sm transition-all ${
                    emailMode === "login"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Log in
                </button>
                <button
                  type="button"
                  data-ocid="login.email.signup.tab"
                  onClick={() => {
                    setEmailMode("signup");
                    setEmailError("");
                  }}
                  className={`flex-1 h-10 rounded-xl font-semibold text-sm transition-all ${
                    emailMode === "signup"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Sign up
                </button>
              </div>

              {/* Form */}
              <div className="flex flex-col gap-4">
                {/* Email */}
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="email-input"
                    className="text-sm font-medium text-foreground"
                  >
                    Email
                  </label>
                  <input
                    id="email-input"
                    data-ocid="login.email.input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="h-14 w-full rounded-2xl bg-card border border-border px-4 text-foreground placeholder:text-muted-foreground text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                </div>

                {/* Password */}
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="password-input"
                    className="text-sm font-medium text-foreground"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password-input"
                      data-ocid="login.password.input"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={
                        emailMode === "signup"
                          ? "Min. 6 characters"
                          : "Your password"
                      }
                      autoComplete={
                        emailMode === "signup"
                          ? "new-password"
                          : "current-password"
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") void handleEmailSubmit();
                      }}
                      className="h-14 w-full rounded-2xl bg-card border border-border px-4 pr-12 text-foreground placeholder:text-muted-foreground text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    />
                    <button
                      type="button"
                      data-ocid="login.password.toggle"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Error */}
                {emailError && (
                  <p
                    data-ocid="login.email.error_state"
                    className="text-destructive text-sm"
                  >
                    {emailError}
                  </p>
                )}

                {/* Submit */}
                <button
                  type="button"
                  data-ocid="login.email.submit_button"
                  onClick={() => void handleEmailSubmit()}
                  disabled={isEmailLoading}
                  className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-bold text-lg flex items-center justify-center gap-2 shadow-yellow active:scale-[0.98] transition-transform disabled:opacity-70 mt-2"
                >
                  {isEmailLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : null}
                  {isEmailLoading
                    ? "Please wait..."
                    : emailMode === "login"
                      ? "Log in"
                      : "Create Account"}
                </button>

                {emailMode === "signup" && (
                  <p className="text-muted-foreground text-xs text-center">
                    You'll be signed up as a customer. Mechanic accounts use
                    Internet Identity.
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
