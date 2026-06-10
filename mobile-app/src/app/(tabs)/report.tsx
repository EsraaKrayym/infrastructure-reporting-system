import { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator
} from "react-native";

import { AuthContext } from "@/context/AuthContext";
import { getReports } from "@/services/api";

export default function ReportsScreen() {

  const { token } = useContext(AuthContext);

  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {

    try {

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
          🔔 Meine Meldungen
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

                <View
                    style={[
                      styles.reportCard,
                      {
                        borderLeftColor:
                            getStatusColor(
                                item.status
                            )
                      }
                    ]}
                >

                  <Text style={styles.reportTitle}>
                    {item.title ||
                        item.category ||
                        "Meldung"}
                  </Text>

                  <Text style={styles.reportDate}>
                    {item.created_at
                        ? new Date(
                            item.created_at
                        ).toLocaleDateString()
                        : ""}
                  </Text>

                  <Text
                      style={[
                        styles.status,
                        {
                          color:
                              getStatusColor(
                                  item.status
                              )
                        }
                      ]}
                  >
                    {getStatusIcon(item.status)}
                    {" "}
                    {item.status}
                  </Text>

                </View>
            )}
        />

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

  reportTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2F4630"
  },

  reportDate: {
    marginTop: 5,
    color: "#666"
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
  }
});