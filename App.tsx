import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "./app/lib/AuthProvider";
import { AppNavigator } from "./app/navigation/AppNavigator";

const queryClient = new QueryClient();

// Only signed media URLs survive an app restart (see app/lib/signedUrlCache.ts)
// — everything else (posts, comments, membership...) should always refetch
// fresh so a cold open never shows stale social data. A restored signed url
// is enough for expo-image to serve the photo straight from its own disk
// cache by cacheKey, even though the url's token is likely stale by then —
// see PostGridTile/KeepCoverCard/PhotoDetail's cacheKey usage.
const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: "keeps-query-cache",
});

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{
            persister,
            maxAge: 24 * 60 * 60 * 1000,
            dehydrateOptions: {
              shouldDehydrateQuery: (query) =>
                query.queryKey[0] === "signedMediaUrl" && query.state.status === "success",
            },
          }}
        >
          <AuthProvider>
            <AppNavigator />
            <StatusBar style="auto" />
          </AuthProvider>
        </PersistQueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
