import React, { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import { defaultGoogleAccounts, useAuth } from "../context/AuthContext";
import { Shield, Sparkles, ArrowRight, UserPlus, LogOut, UserCheck } from "lucide-react";
import OnboardingCard from "../components/auth/OnboardingCard";

export default function LoginPage() {
  const { user, isAuthenticated, loginWithGoogle, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<"signin" | "create">("signin");
  const [isLoading, setIsLoading] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customEmail, setCustomEmail] = useState("");

  const destination = location.state?.from?.pathname || "/";

  // Real Google OAuth Login Hook
  const triggerRealGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoading(true);
      try {
        const userInfoRes = await fetch(
          "https://www.googleapis.com/oauth2/v3/userinfo",
          {
            headers: {
              Authorization: `Bearer ${tokenResponse.access_token}`,
            },
          }
        );

        if (!userInfoRes.ok) {
          throw new Error("Failed to fetch user profile from Google");
        }

        const googleProfile = await userInfoRes.json();

        await loginWithGoogle(
          {
            googleId: googleProfile.sub,
            email: googleProfile.email,
            name: googleProfile.name,
            avatarUrl: googleProfile.picture,
          },
          activeTab === "create"
        );
      } catch (err) {
        console.error("Google authentication error:", err);
      } finally {
        setIsLoading(false);
      }
    },
    onError: (err) => {
      console.error("Google OAuth popup failed:", err);
      setIsLoading(false);
    },
  });

  // If user is authenticated AND already finished profile onboarding, redirect straight to workspace
  if (isAuthenticated && user?.isOnboarded) {
    return <Navigate to="/" replace />;
  }

  // Handle simulated / demo login
  const handleGoogleAuth = async (
    account?: (typeof defaultGoogleAccounts)[0],
    isNew = activeTab === "create"
  ) => {
    setIsLoading(true);
    try {
      await loginWithGoogle(account, isNew);
      // If account was already onboarded, navigate to destination
      if (account?.isOnboarded && !isNew) {
        navigate(destination, { replace: true });
      }
      // If not onboarded, state updates and will render OnboardingCard below!
    } catch (error) {
      console.error("Authentication failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.trim() || !customName.trim()) return;

    setIsLoading(true);
    try {
      await loginWithGoogle(
        {
          name: customName.trim(),
          email: customEmail.trim(),
          isOnboarded: activeTab === "signin",
        },
        activeTab === "create"
      );
      setShowCustomModal(false);
      if (activeTab === "signin") {
        navigate(destination, { replace: true });
      }
    } catch (error) {
      console.error("Custom auth failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-black px-4 py-12 text-white selection:bg-zinc-800">
      {/* Ambient background lighting effects */}
      <div className="pointer-events-none absolute left-1/2 top-1/4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/10 blur-[120px] w-[600px] h-[600px]" />
      <div className="pointer-events-none absolute right-1/4 top-1/3 rounded-full bg-fuchsia-600/10 blur-[140px] w-[500px] h-[500px]" />

      <div className="relative z-10 w-full max-w-md space-y-8">
        {/* Brand & Header */}
        <div className="text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl shadow-blue-500/10">
            <span className="text-2xl font-black tracking-tight text-white">Ω</span>
          </div>

          <h1 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            OMeet Workspace
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Real-time meetings, organization hierarchy, and next-generation collaboration.
          </p>
        </div>

        {/* If user authenticated with Google but not yet onboarded, show the OnboardingCard */}
        {isAuthenticated && user && !user.isOnboarded ? (
          <div className="space-y-4">
            <OnboardingCard onSuccess={() => navigate(destination, { replace: true })} />
            <div className="text-center">
              <button
                type="button"
                onClick={logout}
                className="inline-flex items-center gap-1.5 text-xs text-zinc-500 transition hover:text-zinc-300"
              >
                <LogOut className="h-3 w-3" />
                Cancel and use a different Google account
              </button>
            </div>
          </div>
        ) : (
          /* Main Auth Card */
          <div className="rounded-[32px] border border-zinc-800 bg-zinc-950/80 p-8 shadow-2xl backdrop-blur-xl">
            {/* Tabbed Switcher: Sign In vs Create Account */}
            <div className="grid grid-cols-2 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab("signin")}
                className={`rounded-xl py-2.5 transition ${
                  activeTab === "signin"
                    ? "bg-white text-black shadow"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("create")}
                className={`rounded-xl py-2.5 transition ${
                  activeTab === "create"
                    ? "bg-white text-black shadow"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Create Account
              </button>
            </div>

            <div className="mt-6 space-y-6">
              <div className="text-center">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400">
                  <Shield className="h-3.5 w-3.5" />
                  {activeTab === "signin"
                    ? "Authentication Guard Active"
                    : "Fast 1-Step Onboarding"}
                </span>
                <p className="mt-3 text-xs leading-relaxed text-zinc-400">
                  {activeTab === "signin"
                    ? "Sign in with your Google account to access your organizations, meetings, and team directory."
                    : "Connect your Google account to get started. No passwords to remember or manage."}
                </p>
              </div>

              {/* Primary Google Auth Button */}
              <button
                type="button"
                onClick={() => triggerRealGoogleLogin()}
                disabled={isLoading}
                className="group relative flex w-full items-center justify-center gap-3 rounded-2xl border border-white/15 bg-white px-5 py-4 text-sm font-semibold text-black transition-all hover:bg-zinc-100 hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                ) : (
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                )}
                <span>
                  {isLoading
                    ? "Connecting..."
                    : activeTab === "signin"
                    ? "Continue with Google"
                    : "Create Account with Google"}
                </span>
              </button>

              {/* Demo Accounts Switcher */}
              <div className="space-y-3 pt-2">
                <div className="relative flex items-center justify-center">
                  <div className="w-full border-t border-zinc-800" />
                  <span className="bg-zinc-950 px-3 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                    {activeTab === "signin"
                      ? "Or select existing demo user"
                      : "Or test with demo account"}
                  </span>
                </div>

                <div className="space-y-2">
                  {defaultGoogleAccounts.map((account) => (
                    <button
                      key={account.id}
                      type="button"
                      onClick={() => handleGoogleAuth(account, !account.isOnboarded)}
                      disabled={isLoading}
                      className="flex w-full items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 text-left transition hover:border-zinc-700 hover:bg-zinc-900 disabled:opacity-50"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={account.avatarUrl}
                          alt={account.name}
                          className="h-9 w-9 rounded-full object-cover border border-zinc-700"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-white">{account.name}</p>
                            {account.isOnboarded ? (
                              <span className="flex items-center gap-0.5 text-[10px] text-zinc-400 font-mono">
                                @{account.username}
                              </span>
                            ) : (
                              <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-medium text-amber-400 border border-amber-500/20">
                                Needs Setup
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-zinc-400">{account.email}</p>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-zinc-500" />
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => setShowCustomModal(true)}
                    disabled={isLoading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-800 bg-black/40 p-3 text-xs font-medium text-zinc-400 transition hover:border-zinc-700 hover:text-white"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    Use custom Google identity
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Custom Account Modal */}
        {showCustomModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
              <h3 className="text-lg font-semibold text-white">
                {activeTab === "signin" ? "Custom Google Account" : "New Google Account"}
              </h3>
              <p className="mt-1 text-xs text-zinc-400">
                Enter simulated Google OAuth profile information.
              </p>

              <form onSubmit={handleCustomSubmit} className="mt-5 space-y-4">
                <div>
                  <label className="text-xs font-medium text-zinc-300">Your Full Name</label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="e.g. Alex Miller"
                    className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-black/50 px-3.5 py-2.5 text-sm text-white focus:border-zinc-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-zinc-300">Google Email Address</label>
                  <input
                    type="email"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    placeholder="alex@gmail.com"
                    className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-black/50 px-3.5 py-2.5 text-sm text-white focus:border-zinc-500 focus:outline-none"
                    required
                  />
                </div>

                <div className="mt-6 flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCustomModal(false)}
                    className="rounded-full px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-full bg-white px-5 py-2 text-xs font-semibold text-black hover:bg-zinc-200"
                  >
                    {activeTab === "signin" ? "Sign In" : "Continue to Setup"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Security / System Footer */}
        <div className="text-center text-xs text-zinc-500">
          <p>Protected by Google OAuth 2.0 single sign-on.</p>
          <p className="mt-1">Tokens and active session persisted in client storage.</p>
        </div>
      </div>
    </div>
  );
}
