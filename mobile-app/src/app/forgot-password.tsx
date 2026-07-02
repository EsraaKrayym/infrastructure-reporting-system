import { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert
} from "react-native";
import { useRouter } from "expo-router";

export default function ForgotPasswordScreen() {

    const router = useRouter();
    const [email, setEmail] = useState("");

    const handleResetPassword = async () => {
        if (!email.trim()) {
            Alert.alert("Fehler", "Bitte E-Mail eingeben");
            return;
        }

        Alert.alert(
            "Info",
            "Falls ein Konto mit dieser E-Mail existiert, erhalten Sie einen Link zum Zurücksetzen des Passworts."
        );
    };

    return (
        <View style={styles.container}>

            <View style={styles.logoContainer}>
                <Text style={styles.logo}>CityReport</Text>

                <Text style={styles.subtitle}>
                    Passwort zurücksetzen
                </Text>
            </View>

            <View style={styles.card}>

                <Text style={styles.title}>
                    Passwort vergessen
                </Text>

                <Text style={styles.welcome}>
                    Geben Sie Ihre E-Mail-Adresse ein
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

                <TouchableOpacity
                    style={styles.loginButton}
                    onPress={handleResetPassword}
                >
                    <Text style={styles.loginButtonText}>
                        Link senden
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() =>
                        router.replace("/")
                    }
                >
                    <Text style={styles.link}>
                        Zurück zum Login
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
        marginBottom: 20,
        backgroundColor: "#FAFAFA"
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
