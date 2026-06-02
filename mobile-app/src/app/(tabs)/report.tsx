import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform } from "react-native";

import CreateReport from "@/app/create-report";
import MyReports from "@/app/my-reports";

export default function ReportTab() {
  const [mode, setMode] = useState<"create" | "list">("create");

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Report</Text>

      <View style={styles.switchRow}>
        <TouchableOpacity
          style={[styles.switchBtn, mode === "create" && styles.switchBtnActive]}
          onPress={() => setMode("create")}
        >
          <Text style={[styles.switchText, mode === "create" && styles.switchTextActive]}>
            Erstellen
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.switchBtn, mode === "list" && styles.switchBtnActive]}
          onPress={() => setMode("list")}
        >
          <Text style={[styles.switchText, mode === "list" && styles.switchTextActive]}>
            Meine Reports
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {mode === "create" ? <CreateReport /> : <MyReports />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 12 },
  title: {
    fontSize: 20,
    fontWeight: "800",
    marginHorizontal: 16,
    marginBottom: 10,
    color: "#111827",
  },
  switchRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 12,
    gap: 10,
  },
  switchBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
  },
  switchBtnActive: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
  },
  switchText: {
    fontWeight: "700",
    color: "#334155",
  },
  switchTextActive: {
    color: "white",
  },
  content: { flex: 1, paddingHorizontal: 0 },
});
