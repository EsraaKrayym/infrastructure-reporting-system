import { Tabs } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

export default function TabsLayout() {
  return (
      <Tabs
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: "#2563eb",
            tabBarInactiveTintColor: "#999",
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
            name="notifications"
            options={{
              title: "Meldungen",
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
      </Tabs>
  );
}