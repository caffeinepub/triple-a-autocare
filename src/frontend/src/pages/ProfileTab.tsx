import type { Principal } from "@icp-sdk/core/principal";
import {
  Check,
  Edit3,
  Loader2,
  LogOut,
  MapPin,
  Phone,
  User,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import type { UserProfile } from "../backend";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useUserAppRole } from "../hooks/useQueries";

interface Props {
  profile: UserProfile;
  onSave: (data: {
    name: string;
    phone: string;
    location: string;
  }) => Promise<void>;
  isSaving: boolean;
}

export default function ProfileTab({ profile, onSave, isSaving }: Props) {
  const { clear, identity } = useInternetIdentity();
  const { data: userAppRole } = useUserAppRole();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phone);
  const [location, setLocation] = useState(profile.location);

  useEffect(() => {
    setName(profile.name);
    setPhone(profile.phone);
    setLocation(profile.location);
  }, [profile]);

  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({ name, phone, location });
    setEditing(false);
  };

  const principal = (identity?.getPrincipal() as unknown as Principal)
    ?.toString()
    ?.slice(0, 16);

  const fields = [
    {
      id: "pf-name",
      icon: User,
      label: "Full Name",
      value: name,
      onChange: setName,
      ocid: "profile.name.input",
      type: "text",
    },
    {
      id: "pf-phone",
      icon: Phone,
      label: "Phone Number",
      value: phone,
      onChange: setPhone,
      ocid: "profile.phone.input",
      type: "tel",
    },
    {
      id: "pf-location",
      icon: MapPin,
      label: "Location",
      value: location,
      onChange: setLocation,
      ocid: "profile.location.input",
      type: "text",
    },
  ];

  const roleBadge =
    userAppRole === "mechanic"
      ? "Mechanic"
      : userAppRole === "customer"
        ? "Customer"
        : null;

  return (
    <div className="flex flex-col min-h-full">
      <header className="px-5 pt-12 pb-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Profile</h1>
          <button
            type="button"
            data-ocid="profile.edit.button"
            onClick={() => setEditing((e) => !e)}
            className="w-11 h-11 rounded-full bg-secondary flex items-center justify-center"
          >
            {editing ? (
              <Check className="w-5 h-5 text-primary" />
            ) : (
              <Edit3 className="w-5 h-5 text-foreground" />
            )}
          </button>
        </div>
      </header>

      <div className="px-5 pb-6 flex flex-col gap-6">
        <motion.div
          className="flex flex-col items-center gap-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center shadow-yellow">
            <span className="text-primary-foreground text-3xl font-bold">
              {initials}
            </span>
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
          </div>
        </motion.div>

        <motion.form
          onSubmit={handleSave}
          className="flex flex-col gap-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {fields.map(
            ({ id, icon: Icon, label, value, onChange, ocid, type }) => (
              <div key={label} className="flex flex-col gap-1.5">
                <label
                  htmlFor={id}
                  className="text-sm font-medium text-muted-foreground"
                >
                  {label}
                </label>
                <div className="relative">
                  <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    id={id}
                    data-ocid={ocid}
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={!editing}
                    className="w-full h-14 bg-card border border-border rounded-2xl pl-11 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            ),
          )}

          {editing && (
            <button
              data-ocid="profile.save.submit_button"
              type="submit"
              disabled={isSaving}
              className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-bold text-base flex items-center justify-center gap-2 shadow-yellow active:scale-[0.98] transition-transform disabled:opacity-70"
            >
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          )}
        </motion.form>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-auto flex flex-col gap-3"
        >
          <button
            type="button"
            data-ocid="profile.signout.button"
            onClick={clear}
            className="w-full h-14 rounded-2xl bg-primary/10 border border-primary/30 text-primary font-semibold text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-transform hover:bg-primary/20"
          >
            <LogOut className="w-5 h-5" />
            Log Out
          </button>

          <button
            type="button"
            data-ocid="profile.switch_account.button"
            onClick={clear}
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
