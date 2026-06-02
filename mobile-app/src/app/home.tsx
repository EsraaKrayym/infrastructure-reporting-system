import { View, Button } from "react-native";
import { useRouter } from "expo-router";
import { useContext } from "react";
import { AuthContext } from "@/context/AuthContext";

export default function Home() {
    const router = useRouter();
    const auth = useContext(AuthContext) as { logout?: (() => Promise<void>) } | null;
    const logout = auth?.logout;

    return (
        <View style={{ padding: 20 }}>
            <Button title="Create Report" onPress={() => router.push("/create-report")} />
            <Button title="My Reports" onPress={() => router.push("/my-reports")} />
            <Button
                title="Logout"
                onPress={() => {
                    if (!logout) return;
                    logout();
                }}
            />
        </View>
    );
}
