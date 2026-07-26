import { useCallback, useState, useContext } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Modal,
  TouchableOpacity,
  Image,
  ScrollView,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";

import { AuthContext } from "@/context/AuthContext";
import { getReports } from "@/services/api";

export default function ReportsScreen() {

  const API_URL =
      (process.env.EXPO_PUBLIC_API_URL || "").trim() ||
      "https://cityreport-backend.onrender.com/api";

  const { token } = useContext(AuthContext);

  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<any>(null);

  useFocusEffect(
      useCallback(() => {
        loadReports();
      }, [token])
  );

  const loadReports = async () => {

    try {
      if (!token) {
        setReports([]);
        return;
      }

      const data = await getReports(token);

      console.log("REPORTS:", data);

      if (Array.isArray(data)) {
        setReports(data);
      } else {
        setReports([]);
      }

    } catch (err) {

      console.log(err);
      setReports([]);

    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {

    switch (status) {

      case "Erledigt":
        return "#4CAF50";

      case "In Prüfung":
        return "#F4B942";

      default:
        return "#7FB3A8";
    }
  };

  const getStatusMeta = (status: string) => {
    switch (String(status || "").toLowerCase()) {
      case "erledigt":
      case "done":
      case "fixed":
      case "repaired":
        return { label: "Erledigt", color: "#166534", bg: "#DCFCE7", icon: "verified" as const };
      case "in prüfung":
      case "in_review":
        return { label: "In Prüfung", color: "#92400E", bg: "#FEF3C7", icon: "hourglass-top" as const };
      case "in bearbeitung":
      case "in_progress":
      case "in progress":
        return { label: "In Bearbeitung", color: "#1D4ED8", bg: "#DBEAFE", icon: "build-circle" as const };
      case "abgelehnt":
      case "rejected":
        return { label: "Abgelehnt", color: "#991B1B", bg: "#FEE2E2", icon: "block" as const };
      default:
        return { label: "Neu", color: "#0F766E", bg: "#CCFBF1", icon: "fiber-new" as const };
    }
  };

  const getStatusIcon = (status: string) => {

    switch (status) {

      case "Erledigt":
        return "✔";

      case "In Prüfung":
        return "⏳";

      default:
        return "🔍";
    }
  };

  const formatDate = (value: string) => {
    if (!value) return "";
    return new Date(value).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const resolvePhotoUri = (report: any): string | null => {
    const rawPhoto = String(report?.photo || "").trim();
    if (!rawPhoto) return null;
    if (rawPhoto.startsWith("data:image/")) return rawPhoto;
    if (rawPhoto.startsWith("http://") || rawPhoto.startsWith("https://")) return rawPhoto;
    if (!report?.id) return null;
    return `${API_URL}/reports/${report.id}/photo`;
  };

  if (loading) {
    return (
        <View style={styles.loading}>
          <ActivityIndicator
              size="large"
              color="#5D845C"
          />
        </View>
    );
  }

  const offene = reports.filter(
      (r) => r.status === "Neu"
  ).length;

  const pruefung = reports.filter(
      (r) => r.status === "In Prüfung"
  ).length;

  const erledigt = reports.filter(
      (r) => r.status === "Erledigt"
  ).length;

  return (
      <View style={styles.container}>

        <Text style={styles.header}>
           Meldungsübersicht
        </Text>

        <View style={styles.statsRow}>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {offene}
            </Text>
            <Text style={styles.statLabel}>
              Offen
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {pruefung}
            </Text>
            <Text style={styles.statLabel}>
              In Prüfung
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {erledigt}
            </Text>
            <Text style={styles.statLabel}>
              Erledigt
            </Text>
          </View>

        </View>

        <Text style={styles.sectionTitle}>
          Meine Meldungen
        </Text>

        <FlatList
            data={reports}
            keyExtractor={(item, index) =>
                item.id
                    ? item.id.toString()
                    : index.toString()
            }
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                Noch keine Meldungen vorhanden.
              </Text>
            }
            renderItem={({ item }) => (
                <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => setSelectedReport(item)}
                >
                  {(() => {
                    const meta = getStatusMeta(item.status);
                    return (
                  <View
                      style={[
                        styles.reportCard,
                        {
                          borderLeftColor: getStatusColor(item.status)
                        }
                      ]}
                  >

                    <View style={styles.reportTopRow}>
                      <View style={[styles.statusPill, { backgroundColor: meta.bg }]}>
                        <MaterialIcons name={meta.icon} size={14} color={meta.color} />
                        <Text style={[styles.statusPillText, { color: meta.color }]}>
                          {meta.label}
                        </Text>
                      </View>

                      <Text style={styles.reportDate}>
                        {formatDate(item.created_at)}
                      </Text>
                    </View>

                    <Text style={styles.reportSubtitle} numberOfLines={1}>
                      {item.title || item.category || "Meldung"}
                    </Text>

                    <View style={styles.reportBottomRow}>
                      <Text style={styles.reportMetaText}>#{item.id} • {item.category || "Kategorie"}</Text>
                      <MaterialIcons name="chevron-right" size={18} color="#6B7280" />
                    </View>

                  </View>
                    );
                  })()}
                </TouchableOpacity>
            )}
        />

        <Modal
            visible={!!selectedReport}
            transparent
            animationType="fade"
            onRequestClose={() => setSelectedReport(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeaderRow}>
                  <Text style={styles.modalTitle}>
                    {selectedReport?.title || selectedReport?.category || "Meldung"}
                  </Text>

                  <TouchableOpacity
                      style={styles.iconCloseButton}
                      onPress={() => setSelectedReport(null)}
                  >
                    <MaterialIcons name="close" size={20} color="#334155" />
                  </TouchableOpacity>
                </View>

                {(() => {
                  const meta = getStatusMeta(selectedReport?.status);
                  return (
                    <View style={styles.modalMetaRow}>
                      <View style={[styles.statusPill, { backgroundColor: meta.bg }]}>
                        <MaterialIcons name={meta.icon} size={14} color={meta.color} />
                        <Text style={[styles.statusPillText, { color: meta.color }]}>
                          {meta.label}
                        </Text>
                      </View>
                      <Text style={styles.modalReportId}>Meldung #{selectedReport?.id}</Text>
                    </View>
                  );
                })()}

                {resolvePhotoUri(selectedReport) ? (
                    <Image
                        source={{ uri: resolvePhotoUri(selectedReport) as string }}
                        style={styles.modalImage}
                        resizeMode="cover"
                    />
                ) : null}

                <View style={styles.modalInfoCard}>
                  <View style={styles.infoLine}>
                    <MaterialIcons name="event" size={18} color="#64748B" />
                    <Text style={styles.infoLabel}>Datum</Text>
                    <Text style={styles.infoValue}>{formatDate(selectedReport?.created_at) || "-"}</Text>
                  </View>

                  <View style={styles.infoLine}>
                    <MaterialIcons name="sell" size={18} color="#64748B" />
                    <Text style={styles.infoLabel}>Kategorie</Text>
                    <Text style={styles.infoValue}>{selectedReport?.category || "-"}</Text>
                  </View>

                  <View style={styles.infoLine}>
                    <MaterialIcons name="priority-high" size={18} color="#64748B" />
                    <Text style={styles.infoLabel}>Priorität</Text>
                    <Text style={styles.infoValue}>{selectedReport?.priority || "-"}</Text>
                  </View>

                  <View style={styles.infoLine}>
                    <MaterialIcons name="place" size={18} color="#64748B" />
                    <Text style={styles.infoLabel}>Adresse</Text>
                    <Text style={styles.infoValue}>{selectedReport?.address || "-"}</Text>
                  </View>
                </View>

                <View style={styles.descriptionWrap}>
                  <Text style={styles.descriptionTitle}>Beschreibung</Text>
                  <Text style={styles.modalDescription}>
                    {selectedReport?.description || "Keine Beschreibung vorhanden."}
                  </Text>
                </View>

                <TouchableOpacity
                    style={styles.modalCloseButton}
                    onPress={() => setSelectedReport(null)}
                >
                  <Text style={styles.modalCloseText}>Schließen</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>

      </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#EAF2EC",
    padding: 20,
    paddingTop: 60
  },

  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },

  header: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#2F4630",
    marginBottom: 20
  },

  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 25
  },

  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 15,
    alignItems: "center",
    elevation: 3
  },

  statNumber: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#5D845C"
  },

  statLabel: {
    marginTop: 5,
    color: "#666"
  },

  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#2F4630",
    marginBottom: 15
  },

  reportCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    marginBottom: 15,
    borderLeftWidth: 8,
    elevation: 3
  },

  reportTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
  },

  reportTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2F4630"
  },

  reportDate: {
    marginTop: 2,
    color: "#666"
  },

  reportSubtitle: {
    marginTop: 6,
    color: "#374151",
    fontSize: 14,
  },

  reportBottomRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  reportMetaText: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "600",
  },

  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },

  statusPillText: {
    fontSize: 12,
    fontWeight: "800",
  },

  status: {
    marginTop: 10,
    fontSize: 15,
    fontWeight: "bold"
  },

  emptyText: {
    textAlign: "center",
    marginTop: 50,
    color: "#666"
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  modalCard: {
    width: "100%",
    maxWidth: 390,
    maxHeight: "88%",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 16,
    elevation: 8,
  },

  modalHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 10,
  },

  iconCloseButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },

  modalTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
  },

  modalMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  modalReportId: {
    color: "#64748B",
    fontWeight: "700",
    fontSize: 12,
  },

  modalImage: {
    width: "100%",
    height: 190,
    borderRadius: 14,
    marginBottom: 14,
  },

  modalInfoCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: 12,
    gap: 10,
  },

  infoLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  infoLabel: {
    minWidth: 66,
    color: "#64748B",
    fontSize: 13,
    fontWeight: "700",
  },

  infoValue: {
    flex: 1,
    color: "#0F172A",
    fontSize: 13,
    fontWeight: "600",
  },

  descriptionWrap: {
    marginTop: 14,
    backgroundColor: "#FFFFFF",
  },

  descriptionTitle: {
    color: "#334155",
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 6,
  },

  modalDescription: {
    color: "#111827",
    lineHeight: 20,
    fontSize: 14,
  },

  modalCloseButton: {
    marginTop: 18,
    backgroundColor: "#5D845C",
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 12,
  },

  modalCloseText: {
    color: "#FFFFFF",
    fontWeight: "700",
  }
});