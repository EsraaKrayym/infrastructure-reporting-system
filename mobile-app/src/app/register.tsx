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
import { registerUser } from "@/services/api";

export default function RegisterScreen() {

    const router = useRouter();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleRegister = async () => {

        try {

            await registerUser({
                name,
                email,
                password
            });

            Alert.alert(
                "Erfolg",
                "Konto erfolgreich erstellt"
            );

            router.replace("/");

        }catch (error: any) {

            console.log(error.response?.data);

            Alert.alert(
                "Fehler",
                JSON.stringify(error.response?.data)
            );
        }
    };

    return (
        <View style={styles.container}>

            <View style={styles.logoContainer}>

                <Text style={styles.logo}>
                    CityReport
                </Text>

                <Text style={styles.subtitle}>
                    Neues Benutzerkonto erstellen
                </Text>

            </View>

            <View style={styles.card}>

                <Text style={styles.title}>
                    Registrierung
                </Text>

                <Text style={styles.description}>
                    Bitte geben Sie Ihre Daten ein.
                </Text>

                <TextInput
                    style={styles.input}
                    placeholder="Name"
                    value={name}
                    onChangeText={setName}
                />

                <TextInput
                    style={styles.input}
                    placeholder="E-Mail"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                />

                <TextInput
                    style={styles.input}
                    placeholder="Passwort"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                />

                <TouchableOpacity
                    style={styles.registerButton}
                    onPress={handleRegister}
                >
                    <Text style={styles.registerButtonText}>
                        Registrieren
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => router.back()}
                >
                    <Text style={styles.link}>
                        Bereits registriert? Anmelden
                    </Text>
                </TouchableOpacity>

            </View>

        </View>
    );
}

const styles = StyleSheet.create({

    container: {
        flex: 1,
        justifyContent: "center",
        padding: 25,
        backgroundColor: "#EAF2EC"
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
        color: "#666",
        fontSize: 15
    },

    card: {
        backgroundColor: "#FFFFFF",
        padding: 25,
        borderRadius: 20,
        elevation: 5
    },

    title: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#2F4630"
    },

    description: {
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

    registerButton: {
        backgroundColor: "#5D845C",
        padding: 16,
        borderRadius: 12,
        alignItems: "center",
        marginTop: 10
    },

    registerButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "bold"
    },

    link: {
        textAlign: "center",
        marginTop: 20,
        color: "#5D845C",
        fontWeight: "600"
    }

});