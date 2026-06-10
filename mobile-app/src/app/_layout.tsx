import { Stack } from "expo-router";
import { AuthProvider } from "../context/AuthContext";

export default function RootLayout() {
    return (
        <AuthProvider>
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />     {/* Login */}
                <Stack.Screen name="(tabs)/map" />    {/* App nach Login */}
            </Stack>
        </AuthProvider>
    );
}