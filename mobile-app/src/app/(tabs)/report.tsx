import { useCallback, useState, useContext } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Modal,
  TouchableOpacity,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import { AuthContext } from "@/context/AuthContext";
import { getReports } from "@/services/api";

export default function ReportsScreen() {

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
                  <View
                      style={[
                        styles.reportCard,
                        {
                          borderLeftColor: getStatusColor(item.status)
                        }
                      ]}
                  >

                    <View style={styles.reportTopRow}>
                      <Text style={styles.reportTitle}>
                        {item.status || "Neu"} #{item.id}
                      </Text>

                      <Text style={styles.reportDate}>
                        {formatDate(item.created_at)}
                      </Text>
                    </View>

                    <Text style={styles.reportSubtitle} numberOfLines={1}>
                      {item.title || item.category || "Meldung"}
                    </Text>

                  </View>
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
              <Text style={styles.modalBadge}>
                {selectedReport?.status || "Neu"} #{selectedReport?.id}
              </Text>

              <Text style={styles.modalTitle}>
                {selectedReport?.title || selectedReport?.category || "Meldung"}
              </Text>

              <Text style={styles.modalLine}>
                📅 {formatDate(selectedReport?.created_at)}
              </Text>
              <Text style={styles.modalLine}>
                🏷 Kategorie: {selectedReport?.category || "-"}
              </Text>
              <Text style={styles.modalLine}>
                ⚡ Priorität: {selectedReport?.priority || "-"}
              </Text>
              <Text style={styles.modalLine}>
                📍 Adresse: {selectedReport?.address || "-"}
              </Text>
              <Text style={styles.modalDescription}>
                {selectedReport?.description || "Keine Beschreibung vorhanden."}
              </Text>

              <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setSelectedReport(null)}
              >
                <Text style={styles.modalCloseText}>Schließen</Text>
              </TouchableOpacity>
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
    maxWidth: 360,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    elevation: 8,
  },

  modalBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#EAF2EC",
    color: "#2F4630",
    fontWeight: "800",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 10,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 12,
  },

  modalLine: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 6,
  },

  modalDescription: {
    marginTop: 10,
    color: "#111827",
    lineHeight: 20,
  },

  modalCloseButton: {
    marginTop: 16,
    alignSelf: "flex-end",
    backgroundColor: "#5D845C",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },

  modalCloseText: {
    color: "#FFFFFF",
    fontWeight: "700",
  }
});