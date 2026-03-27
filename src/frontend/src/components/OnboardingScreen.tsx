import { Loader2, MapPin, Phone, User } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

interface Props {
  onComplete: (data: {
    name: string;
    phone: string;
    location: string;
  }) => Promise<void>;
  isSaving: boolean;
}

export default function OnboardingScreen({ onComplete, isSaving }: Props) {
  const [name, setName] = useState("Paul");
  const [phone, setPhone] = useState("+234 ");
  const [location, setLocation] = useState("Lagos, Nigeria");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onComplete({ name, phone, location });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <motion.div
        className="w-full max-w-[430px] flex flex-col gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">
            Welcome to Triple A
          </h1>
          <p className="text-muted-foreground mt-2">
            Set up your profile to get started
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="ob-name"
              className="text-sm font-medium text-foreground"
            >
              Your Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                id="ob-name"
                data-ocid="onboarding.input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full h-14 bg-card border border-border rounded-2xl pl-11 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="ob-phone"
              className="text-sm font-medium text-foreground"
            >
              Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                id="ob-phone"
                data-ocid="onboarding_phone.input"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+234 800 000 0000"
                className="w-full h-14 bg-card border border-border rounded-2xl pl-11 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="ob-location"
              className="text-sm font-medium text-foreground"
            >
              Your Location
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                id="ob-location"
                data-ocid="onboarding_location.input"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Lagos, Nigeria"
                className="w-full h-14 bg-card border border-border rounded-2xl pl-11 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
          </div>

          <button
            data-ocid="onboarding.submit_button"
            type="submit"
            disabled={isSaving}
            className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-bold text-lg flex items-center justify-center gap-2 shadow-yellow active:scale-[0.98] transition-transform disabled:opacity-70 mt-2"
          >
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
            {isSaving ? "Saving..." : "Continue"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
