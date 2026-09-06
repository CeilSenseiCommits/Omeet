import React, { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import { useAuth } from "../context/AuthContext";
import { Shield, LogOut, CheckCircle2, Video, Building2, Users } from "lucide-react";
import OnboardingCard from "../components/auth/OnboardingCard";

export default function LoginPage() {
  const { user, isAuthenticated, loginWithGoogle, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<"signin" | "create">("signin");
  const [isLoading, setIsLoading] = useState(false);

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

  return (
    <div className="flex min-h-screen bg-[#0C0F17] text-[#F8FAFC]">
      {/* Left Brand Panel (Desktop) */}
      <div className="hidden lg:flex lg:w-5/12 flex-col justify-between border-r border-[#1E2638] bg-[#0F1420] relative overflow-hidden p-10 xl:p-14">
        {/* Luminous atmospheric radial glow inspired by reference */}
        <div 
          className="pointer-events-none absolute -top-32 -left-20 h-96 w-96 rounded-full opacity-30 blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(20, 184, 166, 0.4) 0%, rgba(59, 130, 246, 0.2) 50%, transparent 70%)" }}
        />
        <div 
          className="pointer-events-none absolute -bottom-28 -right-20 h-96 w-96 rounded-full opacity-25 blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(99, 102, 241, 0.35) 0%, transparent 70%)" }}
        />

        <div className="relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-[6px] border border-[#2D3748] bg-[#1A2234] text-sm font-bold text-white shadow-xs">
              Ω
            </div>
            <span className="text-sm font-bold tracking-tight text-white">OMeet</span>
          </div>

          <div className="mt-16 space-y-4">
            <span className="inline-flex items-center gap-1.5 rounded-[4px] border border-[#204E4A] bg-[#0E2E2B]/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#2DD4BF]">
              ✦ Enterprise Collaboration
            </span>
            <h1 className="text-2xl xl:text-3xl font-bold tracking-tight text-white leading-snug">
              Structured workspace for teams that build and operate.
            </h1>
            <p className="text-xs text-[#94A3B8] leading-relaxed max-w-md">
              Secure, hierarchical meetings with clear organizational reporting, real-time presence, and integrated member directories.
            </p>
          </div>

          <div className="mt-12 space-y-3.5 border-t border-[#1E2638] pt-8 max-w-md">
            <div className="flex items-start gap-3">
              <Building2 className="h-4 w-4 text-[#38BDF8] shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-white">Hierarchical Structure</p>
                <p className="text-[11px] text-[#94A3B8] mt-0.5">Role-scoped meetings with executive, departmental, and team visibility.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Video className="h-4 w-4 text-[#38BDF8] shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-white">Low-Latency Video</p>
                <p className="text-[11px] text-[#94A3B8] mt-0.5">Instant or scheduled conferences with synchronized recordings.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Users className="h-4 w-4 text-[#38BDF8] shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-white">Unified Directory</p>
                <p className="text-[11px] text-[#94A3B8] mt-0.5">Direct colleague messaging and personal group sync across devices.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 border-t border-[#1E2638] pt-4 flex items-center justify-between text-[11px] text-[#64748B]">
          <span>Protected by Google OAuth 2.0</span>
          <span>Version 2.0</span>
        </div>
      </div>

      {/* Right Canvas / Form Panel with Soft Teal/Light Gradient Wash */}
      <div 
        className="flex flex-1 flex-col items-center justify-center p-6 sm:p-10 relative overflow-hidden"
        style={{
          background: "radial-gradient(circle at 80% 20%, rgba(20, 184, 166, 0.12), transparent 50%), radial-gradient(circle at 20% 80%, rgba(99, 102, 241, 0.08), transparent 50%), linear-gradient(135deg, #F0F9F8 0%, #F8FAFC 50%, #F1F5F9 100%)"
        }}
      >
        <div className="w-full max-w-md space-y-6 relative z-10">
          {/* Mobile Header */}
          <div className="text-center lg:hidden space-y-2">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-[6px] border border-[#E2E8F0] bg-white text-base font-bold text-[#1E293B] shadow-xs">
              Ω
            </div>
            <h2 className="text-xl font-bold text-[#1E293B]">OMeet Workspace</h2>
            <p className="text-xs text-[#64748B]">Enterprise meetings and organizational collaboration</p>
          </div>

          {/* If user authenticated with Google but not yet onboarded, show the OnboardingCard */}
          {isAuthenticated && user && !user.isOnboarded ? (
            <div className="space-y-4">
              <OnboardingCard onSuccess={() => navigate(destination, { replace: true })} />
              <div className="text-center">
                <button
                  type="button"
                  onClick={logout}
                  className="inline-flex items-center gap-1.5 text-xs text-[#64748B] transition hover:text-[#1E293B]"
                >
                  <LogOut className="h-3 w-3" />
                  Cancel and use a different Google account
                </button>
              </div>
            </div>
          ) : (
            /* Main Auth Card */
            <div className="rounded-[10px] border border-[#E2E8F0] bg-white/95 backdrop-blur-md p-7 shadow-lg space-y-6">
              {/* Tabbed Switcher: Sign In vs Create Account */}
              <div className="grid grid-cols-2 rounded-[6px] border border-[#E2E8F0] bg-[#F1F5F9] p-1 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveTab("signin")}
                  className={`rounded-[5px] py-1.5 transition-all ${
                    activeTab === "signin"
                      ? "bg-white text-[#1E293B] shadow-xs"
                      : "text-[#64748B] hover:text-[#1E293B]"
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("create")}
                  className={`rounded-[5px] py-1.5 transition-all ${
                    activeTab === "create"
                      ? "bg-white text-[#1E293B] shadow-xs"
                      : "text-[#64748B] hover:text-[#1E293B]"
                  }`}
                >
                  Create Account
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-bold text-[#1E293B]">
                    {activeTab === "signin" ? "Sign in to your workspace" : "Create your workspace account"}
                  </h3>
                  <p className="mt-1 text-xs text-[#64748B] leading-relaxed">
                    {activeTab === "signin"
                      ? "Access your registered organizations, meetings, and direct team discussions."
                      : "Connect your Google account to get started immediately."}
                  </p>
                </div>

                {/* Primary Google Auth Button */}
                <button
                  type="button"
                  onClick={() => triggerRealGoogleLogin()}
                  disabled={isLoading}
                  className="flex w-full items-center justify-center gap-2.5 rounded-[6px] border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] hover:border-[#CBD5E1] px-4 py-2.5 text-xs font-semibold text-[#1E293B] transition-all shadow-xs hover:shadow-sm disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#E2E8F0] border-t-[#3B82F6]" />
                  ) : (
                    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
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
                      ? "Connecting…"
                      : activeTab === "signin"
                      ? "Continue with Google"
                      : "Create Account with Google"}
                  </span>
                </button>

              </div>
            </div>
          )}

          <div className="text-center text-[11px] text-[#64748B]">
            <p>Single sign-on encrypted and managed via OAuth 2.0</p>
          </div>
        </div>
      </div>
    </div>
  );
}
