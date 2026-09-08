import { API_BASE_URL } from "../../lib/api";
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
  const [username, setUsername] = useState(user?.username || "");
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
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Dynamic alphabet initial badge URL based on current typed name
  const initialsAvatarUrl = useMemo(() => {
    const cleanName = name.trim() || "OMeet User";
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      cleanName
    )}&background=252932&color=F3F3EE&bold=true&size=128`;
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
          `${API_BASE_URL}/api/users/check-username?username=${encodeURIComponent(raw)}`
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

    setSubmitError(null);
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
    } catch (err: any) {
      console.error("Failed to complete profile onboarding", err);
      setSubmitError(err.message || "Failed to complete setup on server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-xl rounded-[6px] border border-[#D8D4CB] bg-white p-7 text-[#242427] shadow-xs">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-1.5 rounded-[3px] border border-[#CBD5E1] bg-[#EEF2FF] px-2.5 py-0.5 text-[10px] font-semibold text-[#4963C8]">
          <Sparkles className="h-3 w-3" />
          <span>Profile Setup · Step 2 of 2</span>
        </div>
        <h2 className="mt-2 text-xl font-bold tracking-tight text-[#242427]">
          Complete Your Profile
        </h2>
        <p className="mt-0.5 text-xs text-[#585754]">
          Personalize your identity so team members can discover and connect with you.
        </p>
      </div>

      {/* Error banner if submission failed */}
      {submitError && (
        <div className="mt-4 flex items-start gap-2.5 rounded-[5px] border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          <XCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
          <span>{submitError}</span>
        </div>
      )}

      {/* Verified Google Account Banner */}
      <div className="mt-5 flex items-center justify-between rounded-[5px] border border-[#D8D4CB] bg-[#FAF9F6] p-3">
        <div className="flex items-center gap-2.5">
          <img
            src={activeAvatarUrl}
            alt={name}
            className="h-8 w-8 rounded-[4px] border border-[#D8D4CB] object-cover"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-semibold text-[#242427]">{name}</p>
              <span className="flex items-center gap-1 rounded-[3px] bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 border border-emerald-200">
                <ShieldCheck className="h-3 w-3" /> Verified
              </span>
            </div>
            <p className="text-[11px] text-[#7E7C77]">{user?.email || "verified@gmail.com"}</p>
          </div>
        </div>
        <span className="text-[10px] font-mono text-[#7E7C77]">Locked</span>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        {/* Full Name Field */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-medium text-[#242427]">
            <User className="h-3.5 w-3.5 text-[#7E7C77]" />
            Full Display Name <span className="text-[#B44A4A]">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your full name"
            className="mt-1 w-full rounded-[5px] border border-[#D8D4CB] bg-[#FAF9F6] px-3 py-2 text-xs text-[#242427] placeholder-[#A6A49F] transition focus:border-[#4963C8] focus:bg-white focus:outline-none"
            required
          />
        </div>

        {/* Username Field with Red / Green Validation */}
        <div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1.5 text-xs font-medium text-[#242427]">
              <span className="font-mono text-[#4963C8]">@</span>
              Unique Username <span className="text-[#B44A4A]">*</span>
            </label>
            <span className="text-[10px] text-[#7E7C77]">For mentions & invites</span>
          </div>

          <div className="relative mt-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-[#7E7C77]">
              @
            </span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ""))}
              placeholder="username"
              className={`w-full rounded-[5px] border pl-7 pr-8 py-2 text-xs font-mono text-[#242427] placeholder-[#A6A49F] transition focus:outline-none ${
                usernameValidation.state === "error"
                  ? "border-[#B44A4A] bg-[#FDF2F2] focus:border-[#B44A4A]"
                  : usernameValidation.state === "success"
                  ? "border-emerald-500 bg-emerald-50/50 focus:border-emerald-500"
                  : "border-[#D8D4CB] bg-[#FAF9F6] focus:border-[#4963C8] focus:bg-white"
              }`}
              required
            />

            <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2">
              {usernameValidation.state === "error" && (
                <XCircle className="h-3.5 w-3.5 text-[#B44A4A]" />
              )}
              {usernameValidation.state === "success" && (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              )}
            </div>
          </div>

          {usernameValidation.state === "error" && (
            <p className="mt-1 text-[11px] font-medium text-[#B44A4A]">
              {usernameValidation.message}
            </p>
          )}
          {usernameValidation.state === "success" && (
            <p className="mt-1 text-[11px] font-medium text-emerald-700">
              {usernameValidation.message}
            </p>
          )}
          {usernameValidation.state === "empty" && (
            <p className="mt-1 text-[10px] text-[#7E7C77]">
              Letters, numbers, and underscores. Min 3 characters.
            </p>
          )}
        </div>

        {/* Profile Photo Selector */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-medium text-[#242427]">
            <Camera className="h-3.5 w-3.5 text-[#7E7C77]" />
            Profile Avatar Style
          </label>

          <div className="mt-1.5 grid grid-cols-2 gap-2 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => setAvatarType("google")}
              className={`flex flex-col items-center gap-1.5 rounded-[5px] border p-2.5 text-center transition-colors ${
                avatarType === "google"
                  ? "border-[#4963C8] bg-[#EEF2FF] text-[#242427]"
                  : "border-[#D8D4CB] bg-[#FAF9F6] text-[#585754] hover:bg-white"
              }`}
            >
              <img
                src={googleAvatarUrl}
                alt="Google"
                className="h-8 w-8 rounded-[4px] border border-[#D8D4CB] object-cover"
              />
              <span className="text-[11px] font-medium">Google Photo</span>
            </button>

            <button
              type="button"
              onClick={() => setAvatarType("initials")}
              className={`flex flex-col items-center gap-1.5 rounded-[5px] border p-2.5 text-center transition-colors ${
                avatarType === "initials"
                  ? "border-[#4963C8] bg-[#EEF2FF] text-[#242427]"
                  : "border-[#D8D4CB] bg-[#FAF9F6] text-[#585754] hover:bg-white"
              }`}
            >
              <img
                src={initialsAvatarUrl}
                alt="Initials"
                className="h-8 w-8 rounded-[4px] border border-[#D8D4CB] object-cover"
              />
              <span className="text-[11px] font-medium">Initial Badge</span>
            </button>

            <button
              type="button"
              onClick={() => setAvatarType("custom")}
              className={`col-span-2 flex flex-col items-center gap-1.5 rounded-[5px] border p-2.5 text-center transition-colors sm:col-span-1 ${
                avatarType === "custom"
                  ? "border-[#4963C8] bg-[#EEF2FF] text-[#242427]"
                  : "border-[#D8D4CB] bg-[#FAF9F6] text-[#585754] hover:bg-white"
              }`}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-[4px] border border-[#D8D4CB] bg-white text-[#7E7C77]">
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
              className="mt-1.5 w-full rounded-[5px] border border-[#D8D4CB] bg-[#FAF9F6] px-3 py-1.5 text-xs text-[#242427] placeholder-[#A6A49F] focus:border-[#4963C8] focus:outline-none"
            />
          )}
        </div>

        {/* Gender Selection */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-medium text-[#242427]">
            <Users2 className="h-3.5 w-3.5 text-[#7E7C77]" />
            Gender <span className="text-[#B44A4A]">*</span>
          </label>
          <div className="mt-1 grid grid-cols-3 gap-2">
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
                className={`rounded-[5px] border py-2 text-xs font-medium transition-colors ${
                  gender === opt.id
                    ? "border-[#4963C8] bg-[#EEF2FF] text-[#4963C8] font-semibold"
                    : "border-[#D8D4CB] bg-[#FAF9F6] text-[#585754] hover:bg-white"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Phone Number */}
        <div>
          <label className="flex items-center justify-between text-xs font-medium text-[#242427]">
            <span className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-[#7E7C77]" />
              Phone Number
            </span>
            <span className="text-[10px] text-[#7E7C77]">Optional</span>
          </label>
          <div className="mt-1 flex gap-2">
            <select
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              className="rounded-[5px] border border-[#D8D4CB] bg-[#FAF9F6] px-2 py-1.5 text-xs text-[#242427] focus:border-[#4963C8] focus:outline-none"
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
              className="w-full rounded-[5px] border border-[#D8D4CB] bg-[#FAF9F6] px-3 py-1.5 text-xs text-[#242427] placeholder-[#A6A49F] transition focus:border-[#4963C8] focus:outline-none"
            />
          </div>
        </div>

        {/* Bio */}
        <div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1.5 text-xs font-medium text-[#242427]">
              <FileText className="h-3.5 w-3.5 text-[#7E7C77]" />
              Brief Intro / Bio
            </label>
            <span className="text-[10px] text-[#7E7C77]">{bio.length}/255</span>
          </div>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, 255))}
            placeholder="Tell your teammates what you work on or your role..."
            rows={2}
            className="mt-1 w-full rounded-[5px] border border-[#D8D4CB] bg-[#FAF9F6] px-3 py-1.5 text-xs text-[#242427] placeholder-[#A6A49F] transition focus:border-[#4963C8] focus:outline-none"
          />
        </div>

        {/* Timezone Dropdown */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-medium text-[#242427]">
            <Globe className="h-3.5 w-3.5 text-[#7E7C77]" />
            Timezone (Auto-Detected)
          </label>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="mt-1 w-full rounded-[5px] border border-[#D8D4CB] bg-[#FAF9F6] px-3 py-1.5 text-xs text-[#242427] focus:border-[#4963C8] focus:outline-none"
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
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-[5px] bg-[#4963C8] hover:bg-[#3E56B5] px-4 py-2.5 text-xs font-semibold text-white transition shadow-xs disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isSubmitting ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            <>
              <span>Complete Setup & Enter Workspace</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
