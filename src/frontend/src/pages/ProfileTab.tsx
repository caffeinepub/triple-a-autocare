import type { Principal } from "@icp-sdk/core/principal";
import { Camera, Loader2, LogOut, Shield, Star, Wrench } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { UserProfile } from "../backend";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useCustomerCompletedRequests,
  useMechanicCompletedJobs,
  useUpdateUserProfile,
  useUserAppRole,
} from "../hooks/useQueries";
import { setEmailIdentity } from "../utils/emailIdentityStore";

interface Props {
  profile: UserProfile;
  onSave?: (data: {
    name: string;
    phone: string;
    location: string;
  }) => Promise<void>;
  isSaving?: boolean;
  isAdmin?: boolean;
  onAdminPanel?: () => void;
}

function Avatar({
  src,
  initials,
  size = 80,
}: { src?: string; initials: string; size?: number }) {
  const dim = `${size}px`;
  if (src) {
    return (
      <img
        src={src}
        alt="Profile"
        style={{ width: dim, height: dim }}
        className="rounded-full object-cover border-2 border-primary shadow-lg"
      />
    );
  }
  return (
    <div
      style={{ width: dim, height: dim }}
      className="rounded-full bg-primary flex items-center justify-center shadow-yellow shrink-0"
    >
      <span
        className="text-primary-foreground font-bold"
        style={{ fontSize: size * 0.35 }}
      >
        {initials}
      </span>
    </div>
  );
}

export default function ProfileTab({ profile, isAdmin, onAdminPanel }: Props) {
  const { clear, identity } = useInternetIdentity();
  const { data: userAppRole } = useUserAppRole();
  const updateProfile = useUpdateUserProfile();
  const { data: customerHistory } = useCustomerCompletedRequests();
  const { data: mechanicHistory } = useMechanicCompletedJobs();
  const isMechanic = userAppRole === "mechanic";

  // Compute rating stats — use totalRatings/ratingsSum from profile if available
  const ratingData = (() => {
    const total = Number(profile.totalRatings ?? 0);
    const sum = Number(profile.ratingsSum ?? 0);
    if (total > 0) {
      return { avg: Math.round((sum / total) * 10) / 10, total };
    }
    // Fallback: compute from history
    if (isMechanic) {
      const completed = (mechanicHistory ?? []).filter(
        (r) => r.status === "completed" && r.mechanicRating != null,
      );
      if (completed.length === 0) return null;
      const avg =
        completed.reduce((sum, r) => sum + Number(r.mechanicRating!), 0) /
        completed.length;
      return { avg: Math.round(avg * 10) / 10, total: completed.length };
    }
    const completed = (customerHistory ?? []).filter(
      (r) => r.status === "completed" && r.customerRating != null,
    );
    if (completed.length === 0) return null;
    const avg =
      completed.reduce((sum, r) => sum + Number(r.customerRating!), 0) /
      completed.length;
    return { avg: Math.round(avg * 10) / 10, total: completed.length };
  })();
  const totalCompleted = isMechanic
    ? (mechanicHistory ?? []).filter((r) => r.status === "completed").length
    : (customerHistory ?? []).filter((r) => r.status === "completed").length;

  const [name, setName] = useState(profile.name);
  const [profileImage, setProfileImage] = useState<string | undefined>(
    profile.profileImage,
  );
  const [yearsOfExperience, setYearsOfExperience] = useState<string>(
    profile.yearsOfExperience != null
      ? String(Number(profile.yearsOfExperience))
      : "",
  );
  const [specialties, setSpecialties] = useState<string>(
    profile.specialties ?? "",
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(profile.name);
    setProfileImage(profile.profileImage);
    setYearsOfExperience(
      profile.yearsOfExperience != null
        ? String(Number(profile.yearsOfExperience))
        : "",
    );
    setSpecialties(profile.specialties ?? "");
  }, [profile]);

  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const principal = (identity?.getPrincipal() as unknown as Principal)
    ?.toString()
    ?.slice(0, 16);

  const roleBadge = isMechanic
    ? "Mechanic"
    : userAppRole === "customer"
      ? "Customer"
      : null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setProfileImage(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isMechanic) {
      const yoe = Number(yearsOfExperience);
      if (!yearsOfExperience || Number.isNaN(yoe) || yoe <= 0) {
        toast.error("Years of experience must be a number greater than 0");
        return;
      }
      if (!specialties.trim()) {
        toast.error("Specialization must not be empty");
        return;
      }
    }

    const payload = {
      name: name.trim() || null,
      profileImage: profileImage ?? null,
      yearsOfExperience:
        isMechanic && yearsOfExperience
          ? BigInt(Math.floor(Number(yearsOfExperience)))
          : null,
      specialties: isMechanic ? specialties.trim() || null : null,
    };

    console.log("[ProfileTab] Submitting profile update:", payload);

    try {
      const result = await updateProfile.mutateAsync(payload);
      console.log("[ProfileTab] Backend response:", result);
      toast.success("Profile updated successfully");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to update profile";
      console.error("[ProfileTab] Update error:", err);
      toast.error(msg);
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      <header className="px-5 pt-12 pb-5">
        <h1 className="text-2xl font-bold text-foreground">Profile</h1>
      </header>

      <div className="px-5 pb-8 flex flex-col gap-6">
        {/* Avatar section */}
        <motion.div
          className="flex flex-col items-center gap-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="relative">
            <Avatar src={profileImage} initials={initials} size={88} />
            <button
              type="button"
              data-ocid="profile.upload_button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-md border-2 border-background active:scale-95 transition-transform"
            >
              <Camera className="w-4 h-4 text-primary-foreground" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-foreground">{profile.name}</p>
            {roleBadge && (
              <span className="inline-block mt-1 px-3 py-0.5 rounded-full bg-primary/15 text-primary text-xs font-semibold">
                {roleBadge}
              </span>
            )}
            {principal && (
              <p className="text-muted-foreground text-xs mt-1">
                {principal}...
              </p>
            )}
            {/* Rating stats */}
            <div className="flex items-center gap-4 mt-1">
              {ratingData ? (
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="text-foreground font-bold text-sm">
                    {ratingData.avg}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    ({ratingData.total} rated)
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-muted-foreground/40" />
                  <span className="text-muted-foreground text-xs">
                    No ratings yet
                  </span>
                </div>
              )}
              {totalCompleted > 0 && (
                <span className="text-muted-foreground text-xs">
                  {totalCompleted} job{totalCompleted !== 1 ? "s" : ""}{" "}
                  completed
                </span>
              )}
            </div>
          </div>
        </motion.div>

        {/* Form */}
        <motion.form
          onSubmit={handleSave}
          className="flex flex-col gap-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="pf-name"
              className="text-sm font-medium text-muted-foreground"
            >
              Full Name
            </label>
            <input
              id="pf-name"
              data-ocid="profile.name.input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              className="w-full h-14 bg-card border border-border rounded-2xl px-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Mechanic-only fields */}
          {isMechanic && (
            <>
              <div className="flex items-center gap-2 pt-1">
                <Wrench className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-primary">
                  Mechanic Details
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="pf-yoe"
                  className="text-sm font-medium text-muted-foreground"
                >
                  Years of Experience
                </label>
                <input
                  id="pf-yoe"
                  data-ocid="profile.years_experience.input"
                  type="number"
                  min="1"
                  value={yearsOfExperience}
                  onChange={(e) => setYearsOfExperience(e.target.value)}
                  placeholder="e.g. 5"
                  className="w-full h-14 bg-card border border-border rounded-2xl px-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="pf-specialties"
                  className="text-sm font-medium text-muted-foreground"
                >
                  Specialties
                </label>
                <input
                  id="pf-specialties"
                  data-ocid="profile.specialties.input"
                  type="text"
                  value={specialties}
                  onChange={(e) => setSpecialties(e.target.value)}
                  placeholder="e.g. Toyota, Honda, BMW"
                  className="w-full h-14 bg-card border border-border rounded-2xl px-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </>
          )}

          <button
            data-ocid="profile.save.submit_button"
            type="submit"
            disabled={updateProfile.isPending}
            className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-bold text-base flex items-center justify-center gap-2 shadow-yellow active:scale-[0.98] transition-transform disabled:opacity-70"
          >
            {updateProfile.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : null}
            {updateProfile.isPending ? "Saving..." : "Save Changes"}
          </button>
        </motion.form>

        {/* Account actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col gap-3"
        >
          {isAdmin && (
            <button
              type="button"
              data-ocid="profile.admin_panel.button"
              onClick={() => onAdminPanel?.()}
              className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-bold text-base flex items-center justify-center gap-2 shadow-yellow active:scale-[0.98] transition-transform hover:opacity-90"
            >
              <Shield className="w-5 h-5" />
              Admin Panel
            </button>
          )}

          <button
            type="button"
            data-ocid="profile.signout.button"
            onClick={() => {
              setEmailIdentity(null);
              localStorage.removeItem("userProfile");
              clear();
            }}
            className="w-full h-14 rounded-2xl bg-primary/10 border border-primary/30 text-primary font-semibold text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-transform hover:bg-primary/20"
          >
            <LogOut className="w-5 h-5" />
            Log Out
          </button>

          <button
            type="button"
            data-ocid="profile.switch_account.button"
            onClick={() => {
              setEmailIdentity(null);
              localStorage.removeItem("userProfile");
              clear();
            }}
            className="text-muted-foreground text-sm text-center hover:text-foreground transition-colors py-2"
          >
            Need a different account? Sign in with another
          </button>
        </motion.div>

        <p className="text-muted-foreground text-xs text-center">
          &copy; {new Date().getFullYear()}. Built with ❤️ using{" "}
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
