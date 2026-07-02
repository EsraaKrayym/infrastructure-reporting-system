import React, { useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";

import { AuthContext } from "@/context/AuthContext";

export default function ProfileTab() {
  const router = useRouter();
  const auth = useContext(AuthContext) as {
    logout?: () => Promise<void> | void;
    updateAvatar?: (uri: string | null) => Promise<void> | void;
    user?: { name?: string; email?: string; role?: string } | null;
    avatarUri?: string | null;
  } | null;

  const userName = auth?.user?.name || "Benutzer";
  const userEmail = auth?.user?.email || "-";
  const userRole = auth?.user?.role || "citizen";

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

  const handlePickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Berechtigung benötigt", "Bitte erlaube den Zugriff auf deine Fotos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      const uri = result.assets?.[0]?.uri;
      if (uri) {
        await auth?.updateAvatar?.(uri);
      }
    }
  };

  const menuItems = [
    { icon: "description", title: "Meine Meldungen", subtitle: "Alle eigenen Reports anzeigen", onPress: () => router.push("/(tabs)/report") },
    { icon: "notifications", title: "Benachrichtigungen", subtitle: "Status-Updates und Hinweise", onPress: () => Alert.alert("Bald verfügbar", "Diese Funktion folgt in der nächsten Version.") },
    { icon: "lock", title: "Passwort ändern", subtitle: "Kontosicherheit aktualisieren", onPress: () => Alert.alert("Bald verfügbar", "Passwort ändern wird noch implementiert.") },
    { icon: "info", title: "App-Informationen", subtitle: "Version und Systemstatus", onPress: () => Alert.alert("CityReport", "Prototype • Mobile App") },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            {auth?.avatarUri ? (
              <Image source={{ uri: auth.avatarUri }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
            )}
          </View>

          <TouchableOpacity style={styles.avatarPlus} onPress={handlePickAvatar} activeOpacity={0.85}>
            <MaterialIcons name="add" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        <Text style={styles.name}>{userName}</Text>
        <Text style={styles.email}>{userEmail}</Text>
        <Text style={styles.subtitle}>Professioneller Prototyp • Profilübersicht</Text>

        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <MaterialIcons name="verified" size={16} color="#166534" />
            <Text style={styles.badgeText}>Aktiv</Text>
          </View>

          <View style={styles.badgeMuted}>
            <MaterialIcons name="person" size={16} color="#475569" />
            <Text style={styles.badgeMutedText}>{userRole === "citizen" ? "Bürger" : userRole}</Text>
          </View>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>12</Text>
          <Text style={styles.statLabel}>Meldungen</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statValue}>4</Text>
          <Text style={styles.statLabel}>In Bearbeitung</Text>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Konto</Text>

        {menuItems.map((item) => (
          <TouchableOpacity key={item.title} style={styles.menuItem} onPress={item.onPress} activeOpacity={0.8}>
            <View style={styles.menuIcon}>
              <MaterialIcons name={item.icon as any} size={20} color="#5D845C" />
            </View>

            <View style={styles.menuTextBlock}>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
            </View>

            <MaterialIcons name="chevron-right" size={22} color="#94A3B8" />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Schnellinfo</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Verbindung</Text>
          <Text style={styles.infoValue}>Online</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Letzte Synchronisation</Text>
          <Text style={styles.infoValue}>Gerade eben</Text>
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
  heroCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 20,
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
  },
  avatar: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: "#5D845C",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarWrap: {
    width: 96,
    height: 96,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarPlus: {
    position: "absolute",
    right: 2,
    bottom: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#22C55E",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
    elevation: 3,
  },
  avatarText: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "800",
  },
  name: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1F2937",
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
  },
  email: {
    marginTop: 4,
    fontSize: 14,
    color: "#5D845C",
    textAlign: "center",
    fontWeight: "600",
  },
  badgeRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#DCFCE7",
  },
  badgeMuted: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#E2E8F0",
  },
  badgeText: {
    color: "#166534",
    fontWeight: "700",
  },
  badgeMutedText: {
    color: "#475569",
    fontWeight: "700",
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 20,
    paddingVertical: 18,
    alignItems: "center",
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "800",
    color: "#2F4630",
  },
  statLabel: {
    marginTop: 4,
    color: "#64748B",
    fontSize: 13,
  },
  sectionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 18,
    marginTop: 16,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF2F7",
  },
  menuIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#EAF2EC",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  menuTextBlock: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
  menuSubtitle: {
    marginTop: 2,
    fontSize: 13,
    color: "#64748B",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  infoLabel: {
    color: "#64748B",
    fontSize: 14,
  },
  infoValue: {
    color: "#111827",
    fontSize: 14,
    fontWeight: "700",
  },
  logoutButton: {
    marginTop: 18,
    backgroundColor: "#DC2626",
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  logoutText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 15,
  },
});
