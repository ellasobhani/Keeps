import AsyncStorage from "@react-native-async-storage/async-storage";

// Device-local "last seen" cursor for the Feed tab — mirrors
// notificationSeen.ts. Feed.tsx fetches posts newer than this on mount,
// then immediately stamps it to "now", so a session's feed is a frozen
// snapshot of what's new since the tab was last opened.
const keyFor = (profileId: string) => `feed:lastSeen:${profileId}`;

export async function getLastSeenFeedAt(profileId: string): Promise<string | null> {
  return AsyncStorage.getItem(keyFor(profileId));
}

export async function setLastSeenFeedAt(profileId: string, isoDate: string): Promise<void> {
  await AsyncStorage.setItem(keyFor(profileId), isoDate);
}
