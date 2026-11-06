import { View, ActivityIndicator, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../lib/AuthProvider";
import { colors, radii } from "../theme/tokens";
import SignInScreen from "../screens/SignInScreen";
import VerifyOtpScreen from "../screens/VerifyOtpScreen";
import ProfileSetup from "../screens/ProfileSetup";
import Profile from "../screens/Profile";
import KeepDetail from "../screens/KeepDetail";
import PhotoDetail from "../screens/PhotoDetail";
import CreateKeep from "../screens/CreateKeep";
import CreateKeepCover from "../screens/CreateKeepCover";
import AddPost from "../screens/AddPost";
import EditPost from "../screens/EditPost";
import EditKeep from "../screens/EditKeep";
import EditProfile from "../screens/EditProfile";
import Notifications from "../screens/Notifications";
import Favorites from "../screens/Favorites";
import FollowRequests from "../screens/FollowRequests";
import ManageCoOwners from "../screens/ManageCoOwners";
import Invites from "../screens/Invites";
import PublicProfile from "../screens/PublicProfile";
import OutsiderProfilePreview from "../screens/OutsiderProfilePreview";
import ProfileConnections from "../screens/ProfileConnections";
import Search from "../screens/Search";
import Feed from "../screens/Feed";
import MoveToKeep from "../screens/MoveToKeep";
import IconButton from "../components/IconButton";
import { spacing } from "../theme/tokens";
import type { PrivacyMode } from "../types/database";

export type AuthStackParamList = {
  SignIn: undefined;
  VerifyOtp: { email: string };
};

export type AppStackParamList = {
  Profile: undefined;
  KeepDetail: { keepId: string };
  PhotoDetail: { postId: string };
  CreateKeep: undefined;
  CreateKeepCover: { title: string; privacyMode: PrivacyMode; hiddenFromProfile: boolean };
  AddPost: { keepId: string };
  EditPost: { postId: string };
  EditKeep: { keepId: string };
  EditProfile: undefined;
  Notifications: undefined;
  Favorites: undefined;
  FollowRequests: { keepId: string };
  ManageCoOwners: { keepId: string };
  Invites: undefined;
  PublicProfile: { profileId: string };
  OutsiderProfilePreview: undefined;
  ProfileConnections: { profileId: string; mode: "followers" | "following" };
  Search: undefined;
  Feed: undefined;
  MoveToKeep: { postId: string };
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="SignIn" component={SignInScreen} />
      <AuthStack.Screen name="VerifyOtp" component={VerifyOtpScreen} />
    </AuthStack.Navigator>
  );
}

function MainNavigator() {
  return (
    <AppStack.Navigator screenOptions={{ headerBackButtonDisplayMode: "minimal" }}>
      <AppStack.Screen
        name="Profile"
        component={Profile}
        options={({ navigation }) => ({
          headerTitle: "",
          headerLeft: () => (
            <IconButton name="add" variant="solid" onPress={() => navigation.navigate("CreateKeep")} size={32} />
          ),
          headerLeftContainerStyle: { paddingLeft: spacing.md },
          headerRightContainerStyle: { paddingRight: spacing.md },
        })}
      />
      <AppStack.Screen name="KeepDetail" component={KeepDetail} options={{ headerTitle: "" }} />
      <AppStack.Screen name="PhotoDetail" component={PhotoDetail} options={{ headerTitle: "" }} />
      <AppStack.Screen name="CreateKeep" component={CreateKeep} options={{ title: "New keep" }} />
      <AppStack.Screen name="CreateKeepCover" component={CreateKeepCover} options={{ headerTitle: "" }} />
      <AppStack.Screen name="AddPost" component={AddPost} options={{ title: "Post" }} />
      <AppStack.Screen name="EditPost" component={EditPost} options={{ title: "Edit post" }} />
      <AppStack.Screen name="EditKeep" component={EditKeep} options={{ title: "Edit keep" }} />
      <AppStack.Screen name="EditProfile" component={EditProfile} options={{ title: "Profile settings" }} />
      <AppStack.Screen name="Notifications" component={Notifications} options={{ title: "Notifications" }} />
      <AppStack.Screen name="Favorites" component={Favorites} options={{ title: "Favorites" }} />
      <AppStack.Screen
        name="FollowRequests"
        component={FollowRequests}
        options={{ title: "Follow requests" }}
      />
      <AppStack.Screen
        name="ManageCoOwners"
        component={ManageCoOwners}
        options={{
          headerShown: false,
          presentation: "formSheet",
          sheetAllowedDetents: "fitToContents",
          sheetGrabberVisible: true,
          sheetCornerRadius: radii.lg,
        }}
      />
      <AppStack.Screen name="Invites" component={Invites} options={{ title: "Invites" }} />
      <AppStack.Screen
        name="PublicProfile"
        component={PublicProfile}
        options={{ headerTitle: "" }}
      />
      <AppStack.Screen
        name="OutsiderProfilePreview"
        component={OutsiderProfilePreview}
        options={{ title: "Preview profile" }}
      />
      <AppStack.Screen name="ProfileConnections" component={ProfileConnections} />
      <AppStack.Screen name="Search" component={Search} options={{ headerTitle: "" }} />
      <AppStack.Screen name="Feed" component={Feed} options={{ headerTitle: "" }} />
      <AppStack.Screen name="MoveToKeep" component={MoveToKeep} options={{ title: "Move to..." }} />
    </AppStack.Navigator>
  );
}

export function AppNavigator() {
  const { session, isSessionLoading, profile, isProfileLoading } = useAuth();

  if (isSessionLoading || (session && isProfileLoading)) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {session ? profile ? <MainNavigator /> : <ProfileSetup /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
});
