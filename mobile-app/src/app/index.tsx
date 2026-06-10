import { useState, useContext } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { AuthContext } from "@/context/AuthContext";
import { loginUser } from "@/services/api";

export default function LoginScreen() {

    const router = useRouter();
    const { login } = useContext(AuthContext);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async () => {

        try {

            const response = await loginUser({
                email,
                password
            });

            login(response.data.token);

            router.replace("/(tabs)/map");

        } catch (error) {
            Alert.alert(
                "Fehler",
                "Ungültige Anmeldedaten"
            );
        }
    };

    return (
        <View style={styles.container}>

            <View style={styles.logoContainer}>
                <Text style={styles.logo}>CityReport</Text>

                <Text style={styles.subtitle}>
                    Melden. Verfolgen. Verbessern.
                </Text>
            </View>

            <View style={styles.card}>

                <Text style={styles.title}>
                    Anmeldung
                </Text>

                <Text style={styles.welcome}>
                    Willkommen zurück
                </Text>

                <TextInput
                    style={styles.input}
                    placeholder="E-Mail"
                    placeholderTextColor="#999"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />

                <View style={styles.passwordContainer}>

                    <TextInput
                        style={styles.passwordInput}
                        placeholder="Passwort"
                        placeholderTextColor="#999"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                    />

                    <TouchableOpacity
                        onPress={() =>
                            setShowPassword(!showPassword)
                        }
                    >
                        <Ionicons
                            name={
                                showPassword
                                    ? "eye-off"
                                    : "eye"
                            }
                            size={22}
                            color="#5D845C"
                        />
                    </TouchableOpacity>

                </View>

                <TouchableOpacity
                    style={styles.loginButton}
                    onPress={handleLogin}
                >
                    <Text style={styles.loginButtonText}>
                        Anmelden
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() =>
                        router.push("/forgot-password")
                    }
                >
                    <Text style={styles.link}>
                        Passwort vergessen?
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() =>
                        router.push("/register")
                    }
                >
                    <Text style={styles.link}>
                        Noch kein Konto? Registrieren
                    </Text>
                </TouchableOpacity>

            </View>

        </View>
    );
}

const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: "#EAF2EC",
        justifyContent: "center",
        padding: 25
    },

    logoContainer: {
        alignItems: "center",
        marginBottom: 40
    },

    logo: {
        fontSize: 38,
        fontWeight: "bold",
        color: "#5D845C"
    },

    subtitle: {
        marginTop: 8,
        color: "#4F4F4F",
        fontSize: 15
    },

    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        padding: 25,
        elevation: 5
    },

    title: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#2F4630"
    },

    welcome: {
        marginTop: 5,
        marginBottom: 25,
        color: "#666"
    },

    input: {
        borderWidth: 1,
        borderColor: "#D9D9D9",
        borderRadius: 12,
        padding: 15,
        marginBottom: 15,
        backgroundColor: "#FAFAFA"
    },

    passwordContainer: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#D9D9D9",
        borderRadius: 12,
        paddingHorizontal: 15,
        marginBottom: 20,
        backgroundColor: "#FAFAFA"
    },

    passwordInput: {
        flex: 1,
        paddingVertical: 15
    },

    loginButton: {
        backgroundColor: "#5D845C",
        padding: 16,
        borderRadius: 12,
        alignItems: "center"
    },

    loginButtonText: {
        color: "white",
        fontWeight: "bold",
        fontSize: 16
    },

    link: {
        textAlign: "center",
        marginTop: 18,
        color: "#5D845C",
        fontWeight: "600"
    }

});