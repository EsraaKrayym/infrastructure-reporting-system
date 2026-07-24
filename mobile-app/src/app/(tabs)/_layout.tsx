import { Tabs } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

export default function TabsLayout() {
    return (
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
    );
}