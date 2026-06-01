import { View, StyleSheet, TouchableOpacity, Text } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useEffect, useState, useContext } from "react";
import { getReports } from "../../services/api";
import { AuthContext } from "../../context/AuthContext";
import { useRouter } from "expo-router";

export default function MapScreen() {
    const { token } = useContext(AuthContext);
    const [reports, setReports] = useState<any[]>([]);
    const router = useRouter();

    useEffect(() => {
        if (token) {
            loadReports();
        }
    }, [token]);

    const loadReports = async () => {
        try {
            const data = await getReports(token);

            if (Array.isArray(data)) {
                setReports(data);
            } else if (Array.isArray(data.reports)) {
                setReports(data.reports || data);
            } else {
                setReports([]);
            }

        } catch (error) {
            console.log("Error loading reports:", error);
        }
    };

    return (
        <View style={styles.container}>
            <MapView
                style={styles.map}
                initialRegion={{
                    latitude: 52.52,
                    longitude: 13.405,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                }}
            >
                {reports.map((report) => (
                    <Marker
                        key={report.id}
                        coordinate={{
                            latitude: report.latitude,
                            longitude: report.longitude,
                        }}
                        title={report.title}
                        description={`Status: ${report.status}`}
                    />
                ))}
            </MapView>

            {/* Floating Create Button */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => router.push("/create-report")}
            >
                <Text style={styles.fabText}>+</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },

    map: { flex: 1 },

    fab: {
        position: "absolute",
        bottom: 30,
        right: 20,
        width: 65,
        height: 65,
        borderRadius: 35,
        backgroundColor: "#2563eb",
        justifyContent: "center",
        alignItems: "center",
        elevation: 6,
        shadowColor: "#000",
        shadowOpacity: 0.3,
        shadowRadius: 6,
    },

    fabText: {
        color: "white",
        fontSize: 28,
        fontWeight: "bold",
    },
});