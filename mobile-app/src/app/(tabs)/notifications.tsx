import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function NotificationsTab() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Benachrichtigungen</Text>
      <Text style={styles.body}>Hier kommen deine Benachrichtigungen.</Text>
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
  body: {
    marginHorizontal: 16,
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
  },
});
