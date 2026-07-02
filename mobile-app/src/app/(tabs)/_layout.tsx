import { Tabs } from "expo-router";

export default function TabsLayout() {
    return (
        <Tabs screenOptions={{ headerShown: false }}>

            <Tabs.Screen
                name="map"
                options={{
                    title: "Karte"
                }}
            />

            <Tabs.Screen
                name="report"
                options={{
                    title: "Meldungen"
                }}
            />

            <Tabs.Screen
                name="profile"
                options={{
                    title: "Profil"
                }}
            />

            <Tabs.Screen
                name="settings"
                options={{
                    title: "Einstellungen"
                }}
            />

        </Tabs>
    );
}