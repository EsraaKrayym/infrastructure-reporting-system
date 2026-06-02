import { View, Button } from "react-native";
import { useRouter } from "expo-router";
import { useContext } from "react";
import { AuthContext } from "@/context/AuthContext";

export default function Home() {
    const router = useRouter();
    const { logout } = useContext(AuthContext);

    return (
        <View style={{ padding: 20 }}>
            <Button title="Create Report" onPress={() => router.push("/create-report")} />
            <Button title="My Reports" onPress={() => router.push("/my-reports")} />
            <Button title="Logout" onPress={logout} />
        </View>
    );
}
