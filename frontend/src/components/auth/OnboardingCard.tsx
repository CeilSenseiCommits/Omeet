import React, { useMemo, useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Globe,
  Sparkles,
  User,
  Phone,
  FileText,
  Camera,
  ArrowRight,
  Users2,
} from "lucide-react";

interface OnboardingCardProps {
  onSuccess: () => void;
}

const COMMON_TIMEZONES = [
  "Asia/Kolkata",
  "America/New_York",
  "America/Los_Angeles",
  "America/Chicago",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Singapore",
  "Asia/Dubai",
  "Australia/Sydney",
  "UTC",
];

export default function OnboardingCard({ onSuccess }: OnboardingCardProps) {
  const { user, checkUsernameAvailable, completeOnboarding } = useAuth();

  const detectedTimezone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch {
      return "UTC";
    }
  }, []);

  const [name, setName] = useState(user?.name || "Google User");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [bio, setBio] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "others">(
    (user?.gender as any) || "male"
  );
  const [timezone, setTimezone] = useState(user?.timezone || detectedTimezone);
  const [avatarType, setAvatarType] = useState<"google" | "initials" | "custom">(
    user?.avatarUrl && !user.avatarUrl.includes("ui-avatars.com")
      ? "google"
      : "initials"
  );
  const [customAvatarUrl, setCustomAvatarUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dynamic alphabet initial badge URL based on current typed name
  const initialsAvatarUrl = useMemo(() => {
    const cleanName = name.trim() || "OMeet User";
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      cleanName
    )}&background=2563eb&color=ffffff&bold=true&size=128`;
  }, [name]);

  const googleAvatarUrl = user?.avatarUrl || initialsAvatarUrl;

  // Selected avatar calculation
  const activeAvatarUrl = useMemo(() => {
    if (avatarType === "google") return googleAvatarUrl;
    if (avatarType === "custom" && customAvatarUrl.trim()) return customAvatarUrl.trim();
    return initialsAvatarUrl;
  }, [avatarType, googleAvatarUrl, initialsAvatarUrl, customAvatarUrl]);

  // Real-time debounced check against Neon PostgreSQL
  const [usernameValidation, setUsernameValidation] = useState<{
    state: "empty" | "error" | "success";
    message: string;
  }>({ state: "empty", message: "" });

  useEffect(() => {
    const raw = username.trim().toLowerCase();
    if (!raw) {
      setUsernameValidation({ state: "empty", message: "" });
      return;
    }

    const validRegex = /^[a-zA-Z0-9_]+$/;
    if (!validRegex.test(raw)) {
      setUsernameValidation({
        state: "error",
        message: "Only letters, numbers, and underscores are allowed",
      });
      return;
    }

    if (raw.length < 3) {
      setUsernameValidation({
        state: "error",
        message: "Username must be at least 3 characters",
      });
      return;
    }

    if (raw.length > 30) {
      setUsernameValidation({
        state: "error",
        message: "Username cannot exceed 30 characters",
      });
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/api/users/check-username?username=${encodeURIComponent(raw)}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.available) {
            setUsernameValidation({
              state: "success",
              message: "Username is available",
            });
          } else {
            setUsernameValidation({
              state: "error",
              message: data.message || "Already used by someone",
            });
          }
          return;
        }
      } catch (e) {
        // Fallback to local check if offline
      }

      const isAvail = checkUsernameAvailable(raw);
      setUsernameValidation({
        state: isAvail ? "success" : "error",
        message: isAvail ? "Username is available" : "Already used by someone",
      });
    }, 200);

    return () => clearTimeout(timer);
  }, [username, checkUsernameAvailable]);

  const isFormValid = usernameValidation.state === "success" && name.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const fullPhone = phone.trim() ? `${countryCode} ${phone.trim()}` : undefined;
      await completeOnboarding({
        name: name.trim(),
        username: username.trim(),
        avatarUrl: activeAvatarUrl,
        phone: fullPhone,
        bio: bio.trim() || undefined,
        gender,
        timezone,
      });
      onSuccess();
    } catch (err) {
      console.error("Failed to complete profile onboarding", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-xl rounded-[32px] border border-zinc-800 bg-zinc-950/90 p-8 shadow-2xl backdrop-blur-2xl">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3.5 py-1 text-xs font-medium text-blue-400">
          <Sparkles className="h-3.5 w-3.5" />
          Step 2 of 2 • Profile Setup
        </div>
        <h2 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Complete Your Profile
        </h2>
        <p className="mt-1.5 text-xs text-zinc-400">
          Personalize your identity so team members can find and connect with you.
        </p>
      </div>

      {/* Verified Google Account Banner */}
      <div className="mt-6 flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/50 p-3.5">
        <div className="flex items-center gap-3">
          <img
            src={activeAvatarUrl}
            alt={name}
            className="h-10 w-10 rounded-full border border-zinc-700 object-cover shadow-sm"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-semibold text-white">{name}</p>
              <span className="flex items-center gap-1 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="h-3 w-3" /> Verified Google
              </span>
            </div>
            <p className="text-xs text-zinc-400">{user?.email || "verified@gmail.com"}</p>
          </div>
        </div>
        <span className="text-[10px] font-mono text-zinc-500">Locked</span>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        {/* Full Name Field */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-medium text-zinc-300">
            <User className="h-3.5 w-3.5 text-zinc-400" />
            Full Display Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Suryansh Rao"
            className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-black/60 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 transition focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            required
          />
        </div>

        {/* Username Field with Red / Green Validation */}
        <div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1.5 text-xs font-medium text-zinc-300">
              <span className="font-mono text-blue-400">@</span>
              Unique Username <span className="text-red-400">*</span>
            </label>
            <span className="text-[10px] text-zinc-500">Used for @mentions & invites</span>
          </div>

          <div className="relative mt-1.5">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-sm text-zinc-500">
              @
            </span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ""))}
              placeholder="choose_username"
              className={`w-full rounded-xl border pl-8 pr-10 py-2.5 text-sm font-mono text-white placeholder-zinc-600 transition focus:outline-none ${
                usernameValidation.state === "error"
                  ? "border-red-500 bg-red-950/20 text-red-200 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                  : usernameValidation.state === "success"
                  ? "border-emerald-500 bg-emerald-950/20 text-emerald-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  : "border-zinc-700 bg-black/60 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              }`}
              required
            />

            {/* Validation Icon */}
            <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2">
              {usernameValidation.state === "error" && (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              {usernameValidation.state === "success" && (
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              )}
            </div>
          </div>

          {/* Real-Time Helper Text */}
          {usernameValidation.state === "error" && (
            <p className="mt-1 text-xs font-medium text-red-400">
              {usernameValidation.message}
            </p>
          )}
          {usernameValidation.state === "success" && (
            <p className="mt-1 text-xs font-medium text-emerald-400">
              {usernameValidation.message}
            </p>
          )}
          {usernameValidation.state === "empty" && (
            <p className="mt-1 text-[11px] text-zinc-500">
              Letters, numbers, and underscores. Min 3 characters.
            </p>
          )}
        </div>

        {/* Profile Photo Selector */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-medium text-zinc-300">
            <Camera className="h-3.5 w-3.5 text-zinc-400" />
            Profile Avatar Style
          </label>

          <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {/* Option 1: Google Photo */}
            <button
              type="button"
              onClick={() => setAvatarType("google")}
              className={`flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition ${
                avatarType === "google"
                  ? "border-blue-500 bg-blue-500/10 text-white shadow-lg shadow-blue-500/10"
                  : "border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700 hover:text-white"
              }`}
            >
              <img
                src={googleAvatarUrl}
                alt="Google"
                className="h-10 w-10 rounded-full border border-zinc-700 object-cover"
              />
              <span className="text-[11px] font-medium">Google Photo</span>
            </button>

            {/* Option 2: Alphabet Initials Badge */}
            <button
              type="button"
              onClick={() => setAvatarType("initials")}
              className={`flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition ${
                avatarType === "initials"
                  ? "border-blue-500 bg-blue-500/10 text-white shadow-lg shadow-blue-500/10"
                  : "border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700 hover:text-white"
              }`}
            >
              <img
                src={initialsAvatarUrl}
                alt="Initials"
                className="h-10 w-10 rounded-full border border-zinc-700 object-cover"
              />
              <span className="text-[11px] font-medium">Initial Badge</span>
            </button>

            {/* Option 3: Custom URL */}
            <button
              type="button"
              onClick={() => setAvatarType("custom")}
              className={`col-span-2 flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition sm:col-span-1 ${
                avatarType === "custom"
                  ? "border-blue-500 bg-blue-500/10 text-white shadow-lg shadow-blue-500/10"
                  : "border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700 hover:text-white"
              }`}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800 text-zinc-400">
                <Globe className="h-4 w-4" />
              </div>
              <span className="text-[11px] font-medium">Custom URL</span>
            </button>
          </div>

          {avatarType === "custom" && (
            <input
              type="url"
              value={customAvatarUrl}
              onChange={(e) => setCustomAvatarUrl(e.target.value)}
              placeholder="https://example.com/avatar.jpg"
              className="mt-2 w-full rounded-xl border border-zinc-700 bg-black/60 px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none"
            />
          )}
        </div>

        {/* Gender Selection (3 options: Male / Female / Others) */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-medium text-zinc-300">
            <Users2 className="h-3.5 w-3.5 text-zinc-400" />
            Gender <span className="text-red-400">*</span>
          </label>
          <div className="mt-1.5 grid grid-cols-3 gap-2">
            {(
              [
                { id: "male", label: "Male" },
                { id: "female", label: "Female" },
                { id: "others", label: "Others" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setGender(opt.id)}
                className={`rounded-xl border py-2.5 text-xs font-medium transition ${
                  gender === opt.id
                    ? "border-blue-500 bg-blue-500/15 text-white shadow-sm shadow-blue-500/20 ring-1 ring-blue-500"
                    : "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700 hover:text-white"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Phone Number (Optional) */}
        <div>
          <label className="flex items-center justify-between text-xs font-medium text-zinc-300">
            <span className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-zinc-400" />
              Phone Number
            </span>
            <span className="text-[10px] text-zinc-500">Optional</span>
          </label>
          <div className="mt-1.5 flex gap-2">
            <select
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              className="rounded-xl border border-zinc-700 bg-black/60 px-2.5 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="+91">+91 (IN)</option>
              <option value="+1">+1 (US)</option>
              <option value="+44">+44 (UK)</option>
              <option value="+49">+49 (DE)</option>
              <option value="+65">+65 (SG)</option>
              <option value="+971">+971 (AE)</option>
            </select>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="98765 43210"
              className="w-full rounded-xl border border-zinc-700 bg-black/60 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 transition focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Brief Intro / Bio (Optional) */}
        <div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1.5 text-xs font-medium text-zinc-300">
              <FileText className="h-3.5 w-3.5 text-zinc-400" />
              Brief Intro / Bio
            </label>
            <span className="text-[10px] text-zinc-500">{bio.length}/255</span>
          </div>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, 255))}
            placeholder="Tell your teammates what you work on or your role..."
            rows={2}
            className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-black/60 px-3.5 py-2 text-xs text-white placeholder-zinc-500 transition focus:border-blue-500 focus:outline-none"
          />
        </div>

        {/* Timezone Dropdown (Auto-detected) */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-medium text-zinc-300">
            <Globe className="h-3.5 w-3.5 text-zinc-400" />
            Timezone (Auto-Detected)
          </label>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-black/60 px-3.5 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
          >
            {COMMON_TIMEZONES.includes(timezone) ? null : (
              <option value={timezone}>{timezone} (Detected)</option>
            )}
            {COMMON_TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz} {tz === detectedTimezone ? "• Current Location" : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!isFormValid || isSubmitting}
          className="group relative mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3.5 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isSubmitting ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
          ) : (
            <>
              <span>Complete Setup & Enter OMeet</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
