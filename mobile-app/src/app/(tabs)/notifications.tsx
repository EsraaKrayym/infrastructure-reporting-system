import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

type NotificationItem = {
  id: string;
  type: "status" | "system" | "warning";
  title: string;
  message: string;
  time: string;
  read: boolean;
};

export default function NotificationsTab() {
  const [activeFilter, setActiveFilter] = useState<"alle" | "ungelesen" | "status">("alle");
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: "1",
      type: "status",
      title: "Meldung #84 wurde aktualisiert",
      message: "Der Status wurde auf 'In Bearbeitung' geändert.",
      time: "Vor 5 Min.",
      read: false,
    },
    {
      id: "2",
      type: "warning",
      title: "Standortfreigabe erforderlich",
      message: "Bitte aktiviere GPS, um Kartenfunktionen optimal zu nutzen.",
      time: "Vor 1 Std.",
      read: false,
    },
    {
      id: "3",
      type: "system",
      title: "Synchronisierung erfolgreich",
      message: "Alle lokalen Daten wurden mit dem Server abgeglichen.",
      time: "Heute, 08:42",
      read: true,
    },
    {
      id: "4",
      type: "status",
      title: "Meldung #80 abgeschlossen",
      message: "Die Reparatur wurde erfolgreich durchgeführt.",
      time: "Gestern",
      read: true,
    },
  ]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const filteredNotifications = useMemo(() => {
    if (activeFilter === "ungelesen") return notifications.filter((n) => !n.read);
    if (activeFilter === "status") return notifications.filter((n) => n.type === "status");
    return notifications;
  }, [activeFilter, notifications]);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const toggleRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n)));
  };

  const getIcon = (type: NotificationItem["type"]) => {
    switch (type) {
      case "status":
        return "sync";
      case "warning":
        return "warning-amber";
      default:
        return "info";
    }
  };

  const getIconColor = (type: NotificationItem["type"]) => {
    switch (type) {
      case "status":
        return "#2563EB";
      case "warning":
        return "#D97706";
      default:
        return "#0F766E";
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <MaterialIcons name="notifications" size={28} color="#2F4630" />
          <Text style={styles.title}>Benachrichtigungen</Text>
        </View>

        <View style={styles.headerMetaRow}>
          <Text style={styles.subtitle}>{unreadCount} ungelesen</Text>

          <TouchableOpacity style={styles.markAllBtn} onPress={markAllAsRead}>
            <Text style={styles.markAllText}>Alle als gelesen</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.filterRow}>
        {[
          { key: "alle", label: "Alle" },
          { key: "ungelesen", label: "Ungelesen" },
          { key: "status", label: "Status" },
        ].map((filter) => {
          const active = activeFilter === (filter.key as "alle" | "ungelesen" | "status");
          return (
            <TouchableOpacity
              key={filter.key}
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => setActiveFilter(filter.key as "alle" | "ungelesen" | "status")}
            >
              <Text style={[styles.filterText, active && styles.filterTextActive]}>{filter.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {filteredNotifications.length === 0 ? (
        <View style={styles.emptyCard}>
          <MaterialIcons name="notifications-none" size={30} color="#94A3B8" />
          <Text style={styles.emptyTitle}>Keine Benachrichtigungen</Text>
          <Text style={styles.emptyText}>Für diesen Filter sind aktuell keine Einträge vorhanden.</Text>
        </View>
      ) : (
        filteredNotifications.map((item) => (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.9}
            style={[styles.itemCard, !item.read && styles.itemCardUnread]}
            onPress={() => toggleRead(item.id)}
          >
            <View style={[styles.iconWrap, { backgroundColor: `${getIconColor(item.type)}1A` }]}>
              <MaterialIcons name={getIcon(item.type) as any} size={22} color={getIconColor(item.type)} />
            </View>

            <View style={styles.itemBody}>
              <View style={styles.itemTopRow}>
                <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
                {!item.read && <View style={styles.unreadDot} />}
              </View>

              <Text style={styles.itemMessage}>{item.message}</Text>
              <Text style={styles.itemTime}>{item.time}</Text>
            </View>
          </TouchableOpacity>
        ))
      )}
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
  headerRow: {
    gap: 8,
    marginBottom: 14,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#2F4630",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  subtitle: {
    color: "#64748B",
    fontSize: 14,
  },
  headerMetaRow: {
    marginTop: 2,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  markAllBtn: {
    backgroundColor: "#5D845C",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  markAllText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  filterChip: {
    backgroundColor: "#E2E8F0",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filterChipActive: {
    backgroundColor: "#5D845C",
  },
  filterText: {
    color: "#334155",
    fontWeight: "700",
    fontSize: 13,
  },
  filterTextActive: {
    color: "#fff",
  },
  emptyCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
  },
  emptyTitle: {
    marginTop: 10,
    color: "#1F2937",
    fontWeight: "800",
    fontSize: 16,
  },
  emptyText: {
    marginTop: 6,
    color: "#64748B",
    fontSize: 13,
    textAlign: "center",
  },
  itemCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "flex-start",
    elevation: 2,
  },
  itemCardUnread: {
    borderLeftWidth: 5,
    borderLeftColor: "#5D845C",
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  itemBody: {
    flex: 1,
  },
  itemTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  itemTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "800",
    color: "#111827",
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#16A34A",
  },
  itemMessage: {
    marginTop: 4,
    color: "#374151",
    fontSize: 13,
    lineHeight: 18,
  },
  itemTime: {
    marginTop: 8,
    color: "#64748B",
    fontSize: 12,
    fontWeight: "600",
  },
});
