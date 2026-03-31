import { Loader2, MapPin, Navigation, Phone, User } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

interface Props {
  role: "customer" | "mechanic";
  onComplete: (data: {
    name: string;
    phone: string;
    location: string;
    latitude?: number;
    longitude?: number;
    address?: string;
  }) => Promise<void>;
  isSaving: boolean;
}

export default function OnboardingScreen({
  role,
  onComplete,
  isSaving,
}: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoError("Unable to get location. Enter manually.");
      return;
    }
    setGeoLoading(true);
    setGeoError("");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setLatitude(lat);
        setLongitude(lon);
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
          );
          const data = await res.json();
          setAddress(data.display_name ?? `${lat}, ${lon}`);
        } catch {
          setAddress(`${lat.toFixed(5)}, ${lon.toFixed(5)}`);
        }
        setGeoLoading(false);
      },
      () => {
        setGeoError("Unable to get location. Enter manually.");
        setGeoLoading(false);
      },
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate all required fields
    if (!name.trim() || !phone.trim() || !address.trim()) {
      setError("Please fill all required fields");
      return;
    }
    if (phone.trim().length < 5) {
      setError("Please enter a valid phone number");
      return;
    }

    try {
      setLoading(true);

      await onComplete({
        name,
        phone,
        location: address,
        latitude,
        longitude,
        address,
      });

      // Navigate to dashboard after successful save.
      // Using location.href is reliable even if React state updates
      // don't trigger a re-render (e.g. actor not ready yet on first load).
      window.location.href = "/";
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Something went wrong. Try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const locationLabel =
    role === "mechanic" ? "Workshop Location" : "Home Address";

  // Disable button while either the local submit or the parent mutation is pending
  const isSubmitting = loading || isSaving;

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
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="ob-address"
              className="text-sm font-medium text-foreground"
            >
              {locationLabel}
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                id="ob-address"
                data-ocid="onboarding_location.input"
                type="text"
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  // Clear coords if user manually types
                  setLatitude(undefined);
                  setLongitude(undefined);
                }}
                placeholder="Enter your address"
                className="w-full h-14 bg-card border border-border rounded-2xl pl-11 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <button
              type="button"
              data-ocid="onboarding.location.button"
              onClick={handleUseCurrentLocation}
              disabled={geoLoading}
              className="flex items-center gap-2 text-sm text-primary font-medium py-2 px-3 rounded-xl bg-primary/10 hover:bg-primary/20 transition-colors disabled:opacity-60 self-start"
            >
              {geoLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Navigation className="w-4 h-4" />
              )}
              {geoLoading ? "Getting location..." : "Use current location"}
            </button>
            {geoError && <p className="text-xs text-destructive">{geoError}</p>}
          </div>

          <button
            data-ocid="onboarding.submit_button"
            type="submit"
            disabled={isSubmitting}
            className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-bold text-lg flex items-center justify-center gap-2 shadow-yellow active:scale-[0.98] transition-transform disabled:opacity-70 mt-2"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
            {isSubmitting ? "Saving..." : "Continue"}
          </button>

          {error && (
            <p className="text-sm text-destructive font-medium text-center -mt-2">
              {error}
            </p>
          )}
        </form>
      </motion.div>
    </div>
  );
}
