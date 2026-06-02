import { useState, useContext } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
} from "react-native";
import { AuthContext } from "../context/AuthContext";
import { loginUser } from "../services/api";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function Login() {
    const { login } = useContext(AuthContext);
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async () => {
        const res = await loginUser(email, password);

        if (res.token) {
            await login(res.token);
            router.replace("/(tabs)/map");
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.logoBox}>
                <Ionicons name="cloud-outline" size={60} color="#c4c4c4" />
                <Text style={styles.logoText}>CityReport</Text>
            </View>

            <Text style={styles.title}>Login</Text>
            <Text style={styles.subtitle}>Schön, Sie wiederzusehen..</Text>

            <Text style={styles.label}>Email</Text>
            <TextInput
                style={styles.input}
                placeholder="example@email.com"
                value={email}
                onChangeText={setEmail}
            />

            <Text style={styles.label}>Passwort eingeben</Text>
            <View style={styles.passwordContainer}>
                <TextInput
                    style={styles.passwordInput}
                    placeholder="••••••••"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons
                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                        size={22}
                        color="#aaa"
                    />
                </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
                <Text style={styles.loginText}>Login</Text>
            </TouchableOpacity>

            <View style={styles.footer}>
                <Text style={styles.forgot}>Passwort vergessen?</Text>
                <Text style={styles.register}>Registrierung</Text>
            </View>
        </View>
    );
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f5f6fa",
        padding: 30,
        justifyContent: "center",
    },
    logoBox: {
        alignItems: "center",
        marginBottom: 30,
    },
    logoText: {
        fontSize: 18,
        color: "#b0b0b0",
        marginTop: 8,
    },
    title: {
        fontSize: 28,
        fontWeight: "600",
        marginBottom: 5,
    },
    subtitle: {
        color: "#8e97a3",
        marginBottom: 25,
    },
    label: {
        color: "#f15b64",
        fontWeight: "500",
        marginBottom: 5,
    },
    input: {
        borderBottomWidth: 1,
        borderColor: "#ddd",
        paddingVertical: 8,
        marginBottom: 20,
    },
    passwordContainer: {
        flexDirection: "row",
        alignItems: "center",
        borderBottomWidth: 1,
        borderColor: "#ddd",
        marginBottom: 30,
    },
    passwordInput: {
        flex: 1,
        paddingVertical: 8,
    },
    loginButton: {
        backgroundColor: "#f15b64",
        padding: 15,
        borderRadius: 8,
        alignItems: "center",
        marginBottom: 30,
    },
    loginText: {
        color: "white",
        fontWeight: "600",
        fontSize: 16,
    },
    footer: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    forgot: {
        color: "#8e97a3",
    },
    register: {
        color: "#f15b64",
        fontWeight: "500",
    },
});