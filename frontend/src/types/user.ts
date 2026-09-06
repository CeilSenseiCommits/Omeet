export interface UserProfile {
  id: string;
  name: string;
  username: string;
  initials: string;
  position: string;
  organization: string;
  location: string;
  about: string;
  skills: string[];
  organizations: string[];
  avatarUrl?: string;
  email?: string;
  friendshipStatus?: "SELF" | "FRIENDS" | "REQUEST_SENT" | "REQUEST_RECEIVED" | "NONE";
  friendshipId?: string | null;
}
