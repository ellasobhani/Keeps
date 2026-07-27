import AsyncStorage from "@react-native-async-storage/async-storage";

// Device-local "last seen" marker for the Notifications tab — there's no
// server-side read state (see supabase/*.sql, no notifications table), so
// this just tracks when *this device* last opened the screen. Good enough
// for a badge dot; pending invites/requests don't need this at all since
// they're already an unresolved state on the server.
const keyFor = (profileId: string) => `notifications:lastSeen:${profileId}`;

export async function getLastSeenNotificationsAt(profileId: string): Promise<string | null> {
  return AsyncStorage.getItem(keyFor(profileId));
}

export async function setLastSeenNotificationsAt(profileId: string, isoDate: string): Promise<void> {
  await AsyncStorage.setItem(keyFor(profileId), isoDate);
}
