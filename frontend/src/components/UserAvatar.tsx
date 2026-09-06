import React, { useState } from "react";

interface UserAvatarProps {
  name?: string;
  avatarUrl?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  shape?: "square" | "circle";
}

function getInitials(name?: string): string {
  if (!name || !name.trim()) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const sizeClasses = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-9 w-9 text-xs font-semibold",
  lg: "h-11 w-11 text-sm font-bold",
  xl: "h-16 w-16 text-xl font-bold",
};

export default function UserAvatar({
  name = "User",
  avatarUrl,
  size = "md",
  className = "",
  shape = "square",
}: UserAvatarProps) {
  const [imgError, setImgError] = useState(false);
  const initials = getInitials(name);
  const roundedClass = shape === "circle" ? "rounded-full" : "rounded-[5px]";

  // Only consider valid URLs that are not blank
  const hasValidUrl = Boolean(
    avatarUrl &&
    avatarUrl.trim().length > 0 &&
    !avatarUrl.includes("ui-avatars.com/api/?name=&")
  );

  return (
    <div
      className={`relative inline-flex shrink-0 items-center justify-center select-none overflow-hidden border border-[#D8D4CB] bg-[#EDE9DF] text-[#242427] ${roundedClass} ${sizeClasses[size]} ${className}`}
    >
      {hasValidUrl && !imgError ? (
        <img
          src={avatarUrl!}
          alt={name}
          referrerPolicy="no-referrer"
          crossOrigin="anonymous"
          onError={() => setImgError(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="leading-none tracking-wider text-[#242427] font-semibold">
          {initials}
        </span>
      )}
    </div>
  );
}
