import {
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  Mail,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { deriveIdentityFromCredentials } from "../utils/emailAuth";
import { setEmailIdentity } from "../utils/emailIdentityStore";
import MechanicPartnerAgreementModal from "./MechanicPartnerAgreementModal";
import PrivacyPolicyScreen from "./PrivacyPolicyScreen";
import TermsOfServiceScreen from "./TermsOfServiceScreen";

type View = "main" | "email";
type EmailMode = "login" | "signup";

interface Props {
  selectedRole: "customer" | "mechanic";
  onBack: () => void;
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function LoginScreen({ selectedRole, onBack }: Props) {
  const { login, isLoggingIn, isLoginError, loginError } =
    useInternetIdentity();
  const [view, setView] = useState<View>("main");
  const [emailMode, setEmailMode] = useState<EmailMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [acceptMechanicAgreement, setAcceptMechanicAgreement] = useState(false);
  const [showMechanicAgreement, setShowMechanicAgreement] = useState(false);

  const handleGoogleLogin = () => {
    sessionStorage.setItem("pending-role", selectedRole);
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
    if (emailMode === "signup") {
      if (
        selectedRole === "mechanic" &&
        (!acceptTerms || !acceptMechanicAgreement)
      ) {
        setEmailError("Please accept all agreements to continue");
        return;
      }
      if (selectedRole === "customer" && !acceptTerms) {
        setEmailError("Please accept the Terms and Privacy Policy");
        return;
      }
    }
    setIsEmailLoading(true);
    try {
      const derivedIdentity = await deriveIdentityFromCredentials(
        email,
        password,
      );
      sessionStorage.setItem("pending-role", selectedRole);
      setEmailIdentity(derivedIdentity);
    } catch (err) {
      setEmailError(
        err instanceof Error ? err.message : "Authentication failed",
      );
    } finally {
      setIsEmailLoading(false);
    }
  };

  const handleEmailBack = () => {
    setView("main");
    setEmail("");
    setPassword("");
    setEmailError("");
    setShowPassword(false);
    setAcceptTerms(false);
    setAcceptMechanicAgreement(false);
    setShowMechanicAgreement(false);
  };

  const roleLabel = selectedRole === "mechanic" ? "Mechanic" : "Customer";

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      {/* Terms of Service overlay */}
      <AnimatePresence>
        {showTerms && (
          <TermsOfServiceScreen onBack={() => setShowTerms(false)} />
        )}
      </AnimatePresence>

      {/* Privacy Policy overlay */}
      <AnimatePresence>
        {showPrivacy && (
          <PrivacyPolicyScreen onBack={() => setShowPrivacy(false)} />
        )}
      </AnimatePresence>

      {/* Mechanic Partner Agreement modal */}
      <AnimatePresence>
        {showMechanicAgreement && (
          <MechanicPartnerAgreementModal
            onClose={() => setShowMechanicAgreement(false)}
          />
        )}
      </AnimatePresence>

      <div className="w-full max-w-[430px] flex flex-col items-center gap-8">
        <AnimatePresence mode="wait">
          {view === "main" ? (
            <motion.div
              key="main"
              className="w-full flex flex-col items-center gap-8"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24 }}
              transition={{ duration: 0.25 }}
            >
              {/* Back + Logo */}
              <div className="w-full flex items-center gap-3">
                <button
                  type="button"
                  data-ocid="login.back.button"
                  onClick={onBack}
                  className="w-10 h-10 rounded-xl bg-card flex items-center justify-center hover:bg-secondary transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-foreground" />
                </button>
                <div className="flex-1" />
                <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-yellow">
                  <Wrench className="w-6 h-6 text-primary-foreground" />
                </div>
              </div>

              {/* Title + role badge */}
              <motion.div
                className="w-full flex flex-col items-center gap-3 text-center"
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <h1 className="text-3xl font-bold text-foreground tracking-tight">
                  Welcome to Triple A
                </h1>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/15 border border-primary/30">
                  {selectedRole === "mechanic" ? (
                    <Wrench className="w-4 h-4 text-primary" />
                  ) : (
                    <ShieldCheck className="w-4 h-4 text-primary" />
                  )}
                  <span className="text-sm font-semibold text-primary">
                    Joining as {roleLabel}
                  </span>
                </div>
                <p className="text-muted-foreground text-sm">
                  Choose how you want to sign in
                </p>
              </motion.div>

              {/* Auth buttons */}
              <motion.div
                className="w-full flex flex-col gap-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15 }}
              >
                {/* Continue with Google (Internet Identity) */}
                <button
                  type="button"
                  data-ocid="login.google.primary_button"
                  onClick={handleGoogleLogin}
                  disabled={isLoggingIn}
                  className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-bold text-lg flex items-center justify-center gap-2 shadow-yellow active:scale-[0.98] transition-transform disabled:opacity-70"
                >
                  {isLoggingIn ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <ShieldCheck className="w-5 h-5" />
                  )}
                  {isLoggingIn ? "Connecting..." : "Continue with Google"}
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
                  Secure login — no data shared without your consent
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
                  onClick={handleEmailBack}
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
                      ? `Sign in as ${roleLabel}`
                      : `Sign up as ${roleLabel}`}
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
                    setAcceptTerms(false);
                    setAcceptMechanicAgreement(false);
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
                    setAcceptTerms(false);
                    setAcceptMechanicAgreement(false);
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

                {/* Terms & Privacy (signup only) */}
                {emailMode === "signup" && (
                  <div className="flex flex-col gap-2">
                    <label
                      data-ocid="login.terms.checkbox"
                      className="flex items-start gap-3 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={acceptTerms}
                        onChange={(e) => setAcceptTerms(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-border accent-primary cursor-pointer flex-shrink-0"
                      />
                      <span className="text-xs text-muted-foreground leading-relaxed">
                        I agree to the{" "}
                        <button
                          type="button"
                          data-ocid="login.terms.open_modal_button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowTerms(true);
                          }}
                          className="text-primary hover:underline font-medium"
                        >
                          Terms of Service
                        </button>{" "}
                        and{" "}
                        <button
                          type="button"
                          data-ocid="login.privacy.open_modal_button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowPrivacy(true);
                          }}
                          className="text-primary hover:underline font-medium"
                        >
                          Privacy Policy
                        </button>
                      </span>
                    </label>
                    <p className="text-xs text-muted-foreground/70 leading-relaxed pl-7">
                      By continuing, you acknowledge that TRIPLE A is a platform
                      connecting users with independent mechanics.
                    </p>
                  </div>
                )}

                {/* Mechanic Partner Agreement (mechanic signup only) */}
                {emailMode === "signup" && selectedRole === "mechanic" && (
                  <div className="flex flex-col gap-2 mt-1">
                    <label
                      data-ocid="login.mechanic_agreement.checkbox"
                      className="flex items-start gap-3 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={acceptMechanicAgreement}
                        onChange={(e) =>
                          setAcceptMechanicAgreement(e.target.checked)
                        }
                        className="mt-0.5 h-4 w-4 rounded border-border accent-primary cursor-pointer flex-shrink-0"
                      />
                      <span className="text-xs text-muted-foreground leading-relaxed">
                        I agree to the{" "}
                        <button
                          type="button"
                          data-ocid="login.mechanic_agreement.open_modal_button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowMechanicAgreement(true);
                          }}
                          className="text-primary hover:underline font-medium"
                        >
                          Mechanic Partner Agreement
                        </button>
                      </span>
                    </label>
                    <p className="text-xs text-muted-foreground/70 leading-relaxed pl-7">
                      By continuing, you agree to the Mechanic Partner
                      Agreement.
                    </p>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="button"
                  data-ocid="login.email.submit_button"
                  onClick={() => void handleEmailSubmit()}
                  disabled={
                    isEmailLoading ||
                    (emailMode === "signup" &&
                      selectedRole === "customer" &&
                      !acceptTerms) ||
                    (emailMode === "signup" &&
                      selectedRole === "mechanic" &&
                      (!acceptTerms || !acceptMechanicAgreement))
                  }
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
