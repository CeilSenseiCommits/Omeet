import React, { createContext, useContext, useEffect, useState } from "react";

export interface AuthUser {
  id: string;
  googleId: string;
  name: string;
  email: string;
  username: string;
  avatarUrl: string;
  initials: string;
  phone?: string;
  bio?: string;
  gender?: "male" | "female" | "others";
  timezone: string;
  isOnboarded: boolean;
}

export interface OnboardingPayload {
  username: string;
  name: string;
  avatarUrl: string;
  phone?: string;
  bio?: string;
  gender?: "male" | "female" | "others";
  timezone: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithGoogle: (account?: Partial<AuthUser>, isNewAccount?: boolean) => Promise<void>;
  checkUsernameAvailable: (username: string) => boolean;
  completeOnboarding: (data: OnboardingPayload) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = "omeet_auth_user";

// Pre-existing taken usernames to simulate collision checks
const TAKEN_USERNAMES = new Set([
  "suryansh_dev",
  "priya_ml",
  "admin",
  "system",
  "root",
  "omeet",
  "alex_m",
  "sarah_c",
  "john_doe",
]);

export const defaultGoogleAccounts: AuthUser[] = [
  {
    id: "user_suryansh",
    googleId: "gid_104928172948201948271",
    name: "Suryansh Rao",
    email: "suryansh@example.com",
    username: "suryansh_dev",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    initials: "SR",
    phone: "+91 98765 43210",
    bio: "Core Systems Architect & Distributed Systems Engineer",
    timezone: "Asia/Kolkata",
    isOnboarded: true,
  },
  {
    id: "user_priya",
    googleId: "gid_203948572819384729102",
    name: "Priya Sharma",
    email: "priya@openai-research.com",
    username: "priya_ml",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
    initials: "PS",
    phone: "+1 (415) 555-0199",
    bio: "Machine Learning Researcher working on frontier model evaluations",
    timezone: "America/Los_Angeles",
    isOnboarded: true,
  },
  {
    id: "user_new_candidate",
    googleId: "gid_304958291039485729103",
    name: "Dev Patel",
    email: "dev.patel@gmail.com",
    username: "",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
    initials: "DP",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    isOnboarded: false,
  },
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in from localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load auth state from storage", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const checkUsernameAvailable = (username: string): boolean => {
    const normalized = username.trim().toLowerCase();
    if (!normalized || normalized.length < 3) return false;
    return !TAKEN_USERNAMES.has(normalized);
  };

  const loginWithGoogle = async (account?: Partial<AuthUser>, isNewAccount = false) => {
    setIsLoading(true);

    const name = account?.name || "Google User";
    const email = account?.email || "user@gmail.com";
    const googleId = account?.googleId || `gid_${Date.now()}`;
    const detectedTimezone =
      Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

    let backendUser: AuthUser | null = null;

    try {
      const response = await fetch("http://localhost:5000/api/users/google-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          googleId,
          email,
          name,
          avatarUrl: account?.avatarUrl,
          isNewAccount,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          backendUser = data.user;
        }
      }
    } catch (err) {
      console.warn("Backend google-auth unreachable, using local state:", err);
    }

    const selectedAccount: AuthUser = backendUser || {
      id: account?.id || `user_google_${Date.now()}`,
      googleId,
      name,
      email,
      username: isNewAccount ? "" : account?.username || "",
      avatarUrl:
        account?.avatarUrl ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(
          name
        )}&background=2563eb&color=ffffff&bold=true`,
      initials: name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
      phone: account?.phone || "",
      bio: account?.bio || "",
      timezone: account?.timezone || detectedTimezone,
      isOnboarded: isNewAccount ? false : (account?.isOnboarded ?? false),
    };

    setUser(selectedAccount);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedAccount));
    setIsLoading(false);
  };

  const completeOnboarding = async (data: OnboardingPayload) => {
    setIsLoading(true);

    const cleanUsername = data.username.trim().toLowerCase();
    const cleanName = data.name.trim();
    const fullPhone = data.phone?.trim();
    const cleanBio = data.bio?.trim();

    let savedUserData: any = null;

    // Persist to Neon cloud PostgreSQL via our backend API
    try {
      const response = await fetch("http://localhost:5000/api/users/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          googleId: user?.googleId || `gid_${Date.now()}`,
          email: user?.email || "user@gmail.com",
          username: cleanUsername,
          name: cleanName,
          avatarUrl: data.avatarUrl,
          phone: fullPhone,
          bio: cleanBio,
          gender: data.gender,
          timezone: data.timezone,
        }),
      });

      if (response.ok) {
        const json = await response.json();
        savedUserData = json.user;
      } else {
        console.warn("Backend API returned error, continuing with client state:", await response.text());
      }
    } catch (apiError) {
      console.warn("Backend API unreachable, persisting to client storage:", apiError);
    }

    const updatedUser: AuthUser = {
      ...(user || {
        id: `user_${Date.now()}`,
        googleId: `gid_${Date.now()}`,
        email: "user@gmail.com",
      }),
      id: savedUserData?.id || user?.id || `user_${Date.now()}`,
      name: cleanName,
      username: cleanUsername,
      avatarUrl: data.avatarUrl,
      initials: cleanName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
      phone: fullPhone,
      bio: cleanBio,
      gender: data.gender,
      timezone: data.timezone,
      isOnboarded: true,
    };

    // Register this username so it becomes taken in local memory session
    TAKEN_USERNAMES.add(updatedUser.username);

    setUser(updatedUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
    setIsLoading(false);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        loginWithGoogle,
        checkUsernameAvailable,
        completeOnboarding,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
