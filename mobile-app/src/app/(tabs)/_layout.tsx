import { useEffect, useMemo, useState } from "react";
import { Tabs } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { View, Text, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabsLayout() {
    const insets = useSafeAreaInsets();
    const [isOffline, setIsOffline] = useState(false);

    const apiRoot = useMemo(() => {
        const apiUrl =
            (process.env.EXPO_PUBLIC_API_URL || "").trim() ||
            "https://cityreport-backend.onrender.com/api";
        return apiUrl.replace(/\/api\/?$/, "");
    }, []);

    useEffect(() => {
        let isMounted = true;

        const checkConnection = async () => {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 4500);

            try {
                const res = await fetch(`${apiRoot}/`, {
                    method: "GET",
                    signal: controller.signal,
                });

                if (isMounted) {
                    setIsOffline(!res.ok);
                }
            } catch {
                if (isMounted) {
                    setIsOffline(true);
                }
            } finally {
                clearTimeout(timeout);
            }
        };

        checkConnection();
        const interval = setInterval(checkConnection, 12000);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [apiRoot]);

    return (
        <View style={styles.container}>
            {isOffline && (
                <View style={[styles.offlineBanner, { top: Math.max(insets.top, 8) }]}> 
                    <MaterialIcons name="wifi-off" size={14} color="#fff" />
                    <Text style={styles.offlineText}>Offline-Modus</Text>
                </View>
            )}

            <Tabs
                screenOptions={{
                    headerShown: false,
                    tabBarShowLabel: false,
                    tabBarActiveTintColor: "#2F4630",
                    tabBarInactiveTintColor: "#8CA59A",
                    tabBarStyle: {
                        backgroundColor: "#ffffff",
                        borderTopWidth: 0,
                        height: 68,
                        paddingTop: 8,
                        paddingBottom: 10,
                        elevation: 10,
                    },
                }}
            >

                <Tabs.Screen
                    name="map"
                    options={{
                        title: "Karte",
                        tabBarIcon: ({ color, size }) => (
                            <MaterialIcons name="map" size={size} color={color} />
                        ),
                    }}
                />

                <Tabs.Screen
                    name="report"
                    options={{
                        title: "Meldungen",
                        tabBarIcon: ({ color, size }) => (
                            <MaterialIcons name="description" size={size} color={color} />
                        ),
                    }}
                />

                <Tabs.Screen
                    name="notifications"
                    options={{
                        title: "Hinweise",
                        tabBarIcon: ({ color, size }) => (
                            <MaterialIcons name="notifications" size={size} color={color} />
                        ),
                    }}
                />

                <Tabs.Screen
                    name="profile"
                    options={{
                        title: "Profil",
                        tabBarIcon: ({ color, size }) => (
                            <MaterialIcons name="person" size={size} color={color} />
                        ),
                    }}
                />

                <Tabs.Screen
                    name="settings"
                    options={{
                        title: "Einstellungen",
                        tabBarIcon: ({ color, size }) => (
                            <MaterialIcons name="settings" size={size} color={color} />
                        ),
                    }}
                />

            </Tabs>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    offlineBanner: {
        position: "absolute",
        left: 12,
        right: 12,
        zIndex: 100,
        backgroundColor: "#b91c1c",
        borderRadius: 10,
        paddingVertical: 6,
        paddingHorizontal: 10,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
    },
    offlineText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 12,
    },
});