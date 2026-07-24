import React, { useCallback, useContext, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect } from "@react-navigation/native";

import { AuthContext } from "@/context/AuthContext";
import { getCurrentUser, getReports, updateCurrentUser } from "@/services/api";
import { getPendingReports } from "@/services/offline";

export default function ProfileTab() {
  const router = useRouter();
  const auth = useContext(AuthContext) as {
    token?: string | null;
    logout?: () => Promise<void> | void;
    updateAvatar?: (uri: string | null) => Promise<void> | void;
    updateUser?: (user: any | null) => Promise<void> | void;
    user?: { name?: string; email?: string; role?: string } | null;
    avatarUri?: string | null;
  } | null;

  const token = auth?.token ?? null;
  const [displayName, setDisplayName] = useState(auth?.user?.name || "");
  const [email, setEmail] = useState(auth?.user?.email || "");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reportStats, setReportStats] = useState({ total: 0, inProgress: 0 });
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSync, setLastSync] = useState<string>("-");
  const [isBlocked, setIsBlocked] = useState(false);

  const userName = displayName || auth?.user?.name || "Benutzer";
  const userEmail = email || auth?.user?.email || "-";
  const userRole = auth?.user?.role || "citizen";

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        if (!token) {
          setLoading(false);
          return;
        }

        try {
          setLoading(true);
          const [user, reports, pending] = await Promise.all([
            getCurrentUser(token),
            getReports(token),
            getPendingReports(),
          ]);

          setDisplayName(user?.name || "");
          setEmail(user?.email || "");
          setIsBlocked(user?.blocked || false);
          await auth?.updateUser?.(user || null);

          const reportList = Array.isArray(reports) ? reports : [];
          const inProgress = reportList.filter((r) => {
            const status = String(r?.status || "").toLowerCase();
            return ["in prüfung", "in bearbeitung", "in_review", "in_progress", "in progress"].includes(status);
          }).length;

          setReportStats({ total: reportList.length, inProgress });
          setPendingCount(pending.length);
          setLastSync(new Date().toLocaleTimeString("de-DE"));
        } catch {
          // Anzeige bleibt mit letzten bekannten Werten erhalten.
        } finally {
          setLoading(false);
        }
      };

      load();
    }, [token])
  );

  const roleLabel = useMemo(() => {
    if (userRole === "citizen") return "Bürger";
    if (userRole === "caseworker") return "Sachbearbeitung";
    if (userRole === "admin") return "Administration";
    return userRole;
  }, [userRole]);

  const handleSaveProfile = async () => {
    if (!token) return;
    if (!displayName.trim() || !email.trim()) {
      Alert.alert("Fehler", "Name und E-Mail sind erforderlich.");
      return;
    }

    try {
      setSaving(true);
      const updated = await updateCurrentUser(token, {
        name: displayName.trim(),
        email: email.trim(),
        password: password.trim() || undefined,
      });

      await auth?.updateUser?.(updated?.user || null);
      setPassword("");
      Alert.alert("Erfolg", "Profil wurde erfolgreich gespeichert.");
    } catch (err: any) {
      Alert.alert("Fehler", err?.message || "Profil konnte nicht aktualisiert werden.");
    } finally {
      setSaving(false);
    }
  };

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
    { icon: "notifications", title: "Benachrichtigungen", subtitle: "Status-Updates und Hinweise", onPress: () => router.push("/(tabs)/notifications") },
    { icon: "settings", title: "Einstellungen", subtitle: "App-Optionen und Datenschutz", onPress: () => router.push("/(tabs)/settings") },
    { icon: "info", title: "App-Informationen", subtitle: "Version und Systemstatus", onPress: () => Alert.alert("CityReport", "Mobile App • Version 1.0.0") },
  ];

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color="#5D845C" />
      </View>
    );
  }

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
        <Text style={styles.subtitle}>Profilübersicht und Kontoverwaltung</Text>

        <View style={styles.badgeRow}>
          <View style={isBlocked ? styles.badgeBlocked : styles.badge}>
            <MaterialIcons name={isBlocked ? "block" : "verified"} size={16} color={isBlocked ? "#991b1b" : "#166534"} />
            <Text style={isBlocked ? styles.badgeBlockedText : styles.badgeText}>
              {isBlocked ? "Blockiert" : "Aktiv"}
            </Text>
          </View>

          <View style={styles.badgeMuted}>
            <MaterialIcons name="person" size={16} color="#475569" />
            <Text style={styles.badgeMutedText}>{roleLabel}</Text>
          </View>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{reportStats.total}</Text>
          <Text style={styles.statLabel}>Meldungen</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statValue}>{reportStats.inProgress}</Text>
          <Text style={styles.statLabel}>In Bearbeitung</Text>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Profil aktualisieren</Text>

        <Text style={styles.inputLabel}>Name</Text>
        <TextInput
          style={styles.input}
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Name"
          placeholderTextColor="#94a3b8"
        />

        <Text style={styles.inputLabel}>E-Mail</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="E-Mail"
          placeholderTextColor="#94a3b8"
        />

        <Text style={styles.inputLabel}>Neues Passwort (optional)</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="Nur bei Änderung eingeben"
          placeholderTextColor="#94a3b8"
        />

        <TouchableOpacity
          style={[styles.saveButton, saving && { opacity: 0.7 }]}
          activeOpacity={0.85}
          onPress={handleSaveProfile}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>{saving ? "Speichern..." : "Profil speichern"}</Text>
        </TouchableOpacity>
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
          <Text style={styles.infoValue}>{pendingCount > 0 ? "Teilweise offline" : "Online"}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Letzte Synchronisation</Text>
          <Text style={styles.infoValue}>{lastSync}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Warteschlange</Text>
          <Text style={styles.infoValue}>{pendingCount} offen</Text>
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
  badgeBlocked: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#FEE2E2",
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
  badgeBlockedText: {
    color: "#991b1b",
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
  loadingWrap: {
    flex: 1,
    backgroundColor: "#EAF2EC",
    alignItems: "center",
    justifyContent: "center",
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#475569",
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#0f172a",
  },
  saveButton: {
    marginTop: 14,
    backgroundColor: "#5D845C",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 14,
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
