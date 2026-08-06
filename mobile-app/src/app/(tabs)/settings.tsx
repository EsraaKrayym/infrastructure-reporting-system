import { useContext, useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Switch,
    TouchableOpacity,
    Alert,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
    getLocationEnabled,
    getPushEnabled,
    setLocationEnabled as persistLocationEnabled,
    setPushEnabled as persistPushEnabled,
} from "@/services/preferences";

import { AuthContext } from "@/context/AuthContext";

export default function SettingsScreen() {
    const router = useRouter();
    const auth = useContext(AuthContext) as {
        logout?: () => Promise<void> | void;
        user?: { name?: string; email?: string; role?: string } | null;
    } | null;

    const [pushEnabled, setPushEnabled] = useState(true);
    const [locationEnabled, setLocationEnabled] = useState(true);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        const loadSettings = async () => {
            const [push, location] = await Promise.all([
                getPushEnabled(),
                getLocationEnabled(),
            ]);

            setPushEnabled(push);
            setLocationEnabled(location);
            setLoaded(true);
        };

        loadSettings();
    }, []);

    const handleLogout = async () => {
        Alert.alert("Abmelden", "Möchten Sie sich wirklich abmelden?", [
            { text: "Abbrechen", style: "cancel" },
            {
                text: "Abmelden",
                style: "destructive",
                onPress: async () => {
                    await auth?.logout?.();
                    router.replace("/");
                },
            },
        ]);
    };

    const handleOpenPrivacy = () => {
        Alert.alert(
            "Datenschutz",
            "Standort, Profildaten und Meldungsinformationen werden ausschließlich zur Verarbeitung von Infrastrukturmeldungen verwendet."
        );
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.header}>⚙ Einstellungen</Text>
            <Text style={styles.subHeader}>Kontrolle über Konto, Benachrichtigungen und Datenschutz.</Text>

            <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Benachrichtigungen</Text>

                <View style={styles.row}>
                    <View style={styles.rowLeft}>
                        <MaterialIcons name="notifications-active" size={20} color="#5D845C" />
                        <View>
                            <Text style={styles.rowTitle}>Push-Mitteilungen</Text>
                            <Text style={styles.rowSubtitle}>Statusänderungen sofort erhalten</Text>
                        </View>
                    </View>
                    <Switch
                        value={pushEnabled}
                        onValueChange={(value) => {
                            setPushEnabled(value);
                            if (loaded) persistPushEnabled(value);
                        }}
                        trackColor={{ false: "#cbd5e1", true: "#86efac" }}
                        thumbColor={pushEnabled ? "#16a34a" : "#94a3b8"}
                    />
                </View>

            </View>

            <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>App & Datenschutz</Text>

                <View style={styles.row}>
                    <View style={styles.rowLeft}>
                        <MaterialIcons name="location-on" size={20} color="#5D845C" />
                        <View>
                            <Text style={styles.rowTitle}>Standortzugriff</Text>
                            <Text style={styles.rowSubtitle}>Für Kartenposition und Meldungserstellung</Text>
                        </View>
                    </View>
                    <Switch
                        value={locationEnabled}
                        onValueChange={(value) => {
                            setLocationEnabled(value);
                            if (loaded) persistLocationEnabled(value);
                        }}
                        trackColor={{ false: "#cbd5e1", true: "#86efac" }}
                        thumbColor={locationEnabled ? "#16a34a" : "#94a3b8"}
                    />
                </View>

            </View>

            <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Konto</Text>

                <TouchableOpacity style={styles.actionRow} onPress={() => router.push("/(tabs)/profile")}>
                    <View style={styles.rowLeft}>
                        <MaterialIcons name="person" size={20} color="#5D845C" />
                        <Text style={styles.rowTitle}>Profil bearbeiten</Text>
                    </View>
                    <MaterialIcons name="chevron-right" size={22} color="#94a3b8" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionRow} onPress={() => router.push("/(tabs)/profile")}>
                    <View style={styles.rowLeft}>
                        <MaterialIcons name="lock" size={20} color="#5D845C" />
                        <Text style={styles.rowTitle}>Passwort ändern</Text>
                    </View>
                    <MaterialIcons name="chevron-right" size={22} color="#94a3b8" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionRow} onPress={handleOpenPrivacy}>
                    <View style={styles.rowLeft}>
                        <MaterialIcons name="privacy-tip" size={20} color="#5D845C" />
                        <Text style={styles.rowTitle}>Datenschutz</Text>
                    </View>
                    <MaterialIcons name="chevron-right" size={22} color="#94a3b8" />
                </TouchableOpacity>
            </View>

            <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>System</Text>
                <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>App Version</Text>
                    <Text style={styles.metaValue}>1.0.0</Text>
                </View>
                <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Benutzer</Text>
                    <Text style={styles.metaValue}>{auth?.user?.email || "-"}</Text>
                </View>
                <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Rolle</Text>
                    <Text style={styles.metaValue}>{auth?.user?.role || "citizen"}</Text>
                </View>
            </View>

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.85}>
                <MaterialIcons name="logout" size={20} color="#fff" />
                <Text style={styles.logoutText}>Abmelden</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#EAF2EC",
    },
    content: {
        padding: 20,
        paddingTop: 60,
        paddingBottom: 30,
    },
    header: {
        fontSize: 30,
        fontWeight: "800",
        color: "#2F4630",
    },
    subHeader: {
        marginTop: 6,
        color: "#64748B",
        fontSize: 14,
        marginBottom: 16,
    },
    sectionCard: {
        backgroundColor: "#fff",
        borderRadius: 22,
        padding: 16,
        marginBottom: 14,
        elevation: 4,
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 8,
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: "800",
        color: "#111827",
        marginBottom: 12,
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 10,
    },
    rowLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        flex: 1,
        marginRight: 12,
    },
    rowTitle: {
        fontSize: 15,
        fontWeight: "700",
        color: "#1f2937",
    },
    rowSubtitle: {
        marginTop: 2,
        fontSize: 13,
        color: "#64748B",
    },
    actionRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 14,
        borderTopWidth: 1,
        borderTopColor: "#eef2f7",
    },
    metaRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 8,
    },
    metaLabel: {
        color: "#64748B",
        fontSize: 14,
    },
    metaValue: {
        color: "#111827",
        fontWeight: "700",
        fontSize: 14,
    },
    logoutButton: {
        backgroundColor: "#DC2626",
        borderRadius: 16,
        paddingVertical: 14,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: 8,
        marginTop: 4,
    },
    logoutText: {
        color: "#fff",
        fontSize: 15,
        fontWeight: "800",
    },
});