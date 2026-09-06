const STORAGE_PREFIX = "omeet_seen_notifications_";

/**
 * Retrieves the set of seen notification IDs for a given user.
 */
export function getSeenNotificationIds(userId?: string): Set<string> {
  if (!userId) return new Set();
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${userId}`);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

/**
 * Marks a list of notification IDs as seen, saves to localStorage,
 * and dispatches a window event so all active notification bells update immediately.
 */
export function markNotificationsAsSeen(userId: string | undefined, ids: string[]): void {
  if (!userId || !ids.length) return;
  try {
    const current = getSeenNotificationIds(userId);
    let changed = false;
    for (const id of ids) {
      if (id && !current.has(id)) {
        current.add(id);
        changed = true;
      }
    }
    if (changed) {
      const seenArray = Array.from(current);
      localStorage.setItem(`${STORAGE_PREFIX}${userId}`, JSON.stringify(seenArray));
      window.dispatchEvent(
        new CustomEvent("omeet-notifications-seen", {
          detail: { userId, seenIds: seenArray },
        })
      );
    }
  } catch (err) {
    console.error("Failed to mark notifications as seen:", err);
  }
}
