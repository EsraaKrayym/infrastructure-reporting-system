import {
    View,
    StyleSheet,
    TouchableOpacity,
    Text,
    Pressable,
    TextInput
} from "react-native";
import MapView, { Marker, Callout } from "react-native-maps";
import * as Location from "expo-location";
import { useEffect, useState, useContext, useRef } from "react";
import { createReport, getReports } from "../../services/api";
import { AuthContext } from "../../context/AuthContext";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

export default function MapScreen() {
    const { token } = useContext(AuthContext);
    const [reports, setReports] = useState<any[]>([]);
    const [userLocation, setUserLocation] = useState<any>(null);
    const [showHint, setShowHint] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [search, setSearch] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const mapRef = useRef<MapView>(null);
    const router = useRouter();
    const [address, setAddress] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState("medium");
    const [photo, setPhoto] = useState(null);
    const [selectedReport, setSelectedReport] = useState<any>(null);

    useEffect(() => {
        if (token) loadReports();
        getUserLocation();
    }, [token]);

    const sendReport = async () => {
        if (!userLocation) return;

        const formData = new FormData();

        formData.append("title", "Meldung vom Mobilgerät");
        formData.append("category", "road_damage");
        formData.append("description", description);
        formData.append("priority", priority);
        formData.append("address", address);
        formData.append("latitude", userLocation.latitude.toString());
        formData.append("longitude", userLocation.longitude.toString());

        if (photo) {
            formData.append("photo", {
                uri: photo,
                type: "image/jpeg",
                name: "report.jpg",
            } as any);
        }

        try {
            const result = await createReport(token, formData);

            if (result.offline) {
                alert("Report offline gespeichert. Er wird gesendet, sobald die Verbindung wiederhergestellt ist.");
            } else {
                alert("Report erfolgreich gesendet");
            }

            setShowModal(false);
            await loadReports();
        } catch (error: any) {
            alert(error.message || "Fehler beim Senden");
        }
    };

    const openCamera = async () => {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) return;

        const result = await ImagePicker.launchCameraAsync({
            quality: 0.5,
        });

        if (!result.canceled) {
            setPhoto(result.assets[0].uri);
        }
    };
    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "high":
                return "#dc2626";
            case "medium":
                return "#f97316";
            case "low":
                return "#16a34a";
            default:
                return "#2563eb";
        }
    };

    const loadReports = async () => {
        const data = await getReports(token);
        setReports(Array.isArray(data) ? data : data.reports || []);
    };

    const fetchSearchSuggestions = async (query: string) => {
        const trimmed = query.trim();
        if (!trimmed) {
            setSearchResults([]);
            return [];
        }

        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(trimmed)}&limit=5`,
                {
                    headers: {
                        "User-Agent": "InfrastructureReportingApp/1.0",
                    },
                }
            );

            const data = await response.json();
            const results = Array.isArray(data) ? data : [];
            setSearchResults(results);
            return results;
        } catch (error) {
            setSearchResults([]);
            return [];
        }
    };

    const selectSearchResult = (result: any) => {
        setSearch(result.display_name);
        setSearchResults([]);
        const lat = parseFloat(result.lat);
        const lon = parseFloat(result.lon);
        mapRef.current?.animateToRegion({
            latitude: lat,
            longitude: lon,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
        });
    };

    const searchLocation = async () => {
        if (!search.trim()) {
            alert("Bitte einen Ort eingeben.");
            return;
        }

        const results = await fetchSearchSuggestions(search);
        if (results.length > 0) {
            selectSearchResult(results[0]);
        }
    };

    const getUserLocation = async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;

        // 1️⃣ Standort holen
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation(location.coords);

        // 2️⃣ Reverse Geocoding (Adresse holen)
        const result = await Location.reverseGeocodeAsync({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
        });

        if (result.length > 0) {
            const place = result[0];
            setAddress(`${place.street || ""} ${place.name || ""}`);
        }

        // 3️⃣ Karte bewegen
        mapRef.current?.animateToRegion({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
        });
    };


    return (
        <View style={styles.container}>

            {/* 🔎 Suchfeld MUSS außerhalb vom MapView */}
            <View style={styles.searchContainer}>
                <View style={styles.searchBox}>
                    <MaterialIcons name="search" size={20} color="#555" />
                    <TextInput
                        placeholder="Ort suchen..."
                        value={search}
                        onChangeText={(text) => {
                            setSearch(text);
                            fetchSearchSuggestions(text);
                        }}
                        style={styles.searchInput}
                        returnKeyType="search"
                        onSubmitEditing={searchLocation}
                    />
                    <TouchableOpacity style={styles.searchButton} onPress={searchLocation}>
                        <Text style={styles.searchButtonText}>Suchen</Text>
                    </TouchableOpacity>
                </View>
                {searchResults.length > 0 && (
                    <View style={styles.searchResults}>
                        {searchResults.map((result) => (
                            <TouchableOpacity
                                key={result.place_id}
                                style={styles.searchResultItem}
                                onPress={() => selectSearchResult(result)}
                            >
                                <Text style={styles.searchResultText} numberOfLines={2}>
                                    {result.display_name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </View>

            <MapView
                ref={mapRef}
                style={styles.map}
                showsUserLocation={true}
                followsUserLocation={true}
                initialRegion={{
                    latitude: 52.52,
                    longitude: 13.405,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                }}
            >

                {userLocation && (
                    <Marker
                        coordinate={{
                            latitude: userLocation.latitude,
                            longitude: userLocation.longitude,
                        }}
                        pinColor="#2563eb"
                        title="Dein Standort"
                    />
                )}

                {reports.map((report) => (
                    <Marker
                        key={report.id}
                        coordinate={{
                            latitude: report.latitude,
                            longitude: report.longitude,
                        }}
                        pinColor={getPriorityColor(report.priority)}
                        onPress={() => setSelectedReport(report)}
                    >
                        <Callout>
                            <View style={styles.callout}>
                                <Text style={styles.calloutTitle}>{report.title}</Text>
                                <Text style={styles.calloutText}>{report.description}</Text>
                                <Text style={styles.calloutMeta}>Status: {report.status}</Text>
                                <Text style={styles.calloutMeta}>Priorität: {report.priority}</Text>
                                <Text style={styles.calloutMeta}>Kategorie: {report.category}</Text>
                            </View>
                        </Callout>
                    </Marker>
                ))}
            </MapView>

            {/* ➕ Button */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => {
                    setShowHint(false);
                    setShowModal(true);
                }}
            >
                <Text style={styles.fabText}>+</Text>
            </TouchableOpacity>

            {selectedReport && (
                <View style={styles.reportPreview}>
                    <Text style={styles.previewTitle}>{selectedReport.title}</Text>
                    <Text style={styles.previewText}>{selectedReport.description}</Text>
                    <View style={styles.previewMetaRow}>
                        <Text style={styles.previewMeta}>Status: {selectedReport.status}</Text>
                        <Text style={styles.previewMeta}>Priorität: {selectedReport.priority}</Text>
                    </View>
                    <TouchableOpacity onPress={() => setSelectedReport(null)} style={styles.previewClose}>
                        <Text style={styles.previewCloseText}>Schließen</Text>
                    </TouchableOpacity>
                </View>
            )}


            {/* 🔥 PROFESSIONELLES BOTTOM SHEET */}
            {showModal && (
                <Pressable
                    style={styles.bottomSheetOverlay}
                    onPress={() => setShowModal(false)}
                >
                    <Pressable
                        style={styles.bottomSheet}
                        onPress={(e) => e.stopPropagation()}
                    >

                        {/* 🔹 Header mit Schließen Icon */}
                        <View style={styles.sheetHeader}>
                            <TouchableOpacity onPress={() => setShowModal(false)}>
                                <MaterialIcons name="close" size={26} color="#333" />
                            </TouchableOpacity>

                            <Text style={styles.sheetTitle}>Schaden melden</Text>

                            <View style={{ width: 26 }} />
                        </View>

                        {/* 🔹 Priorität */}
                        <Text style={styles.label}>Priorität</Text>
                        <View style={styles.priorityRow}>
                            {["low", "medium", "high"].map((p) => (
                                <TouchableOpacity
                                    key={p}
                                    onPress={() => setPriority(p)}
                                    style={[
                                        styles.priorityBtn,
                                        {
                                            backgroundColor:
                                                p === "high"
                                                    ? "#dc2626"
                                                    : p === "medium"
                                                        ? "#f97316"
                                                        : "#16a34a",
                                            opacity: priority === p ? 1 : 0.4,
                                        },
                                    ]}
                                >
                                    <Text style={styles.priorityText}>
                                        {p === "low"
                                            ? "Niedrig"
                                            : p === "medium"
                                                ? "Mittel"
                                                : "Hoch"}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* 🔹 Adresse */}
                        <Text style={styles.label}>Ort</Text>
                        <TextInput
                            value={address}
                            onChangeText={setAddress}
                            style={styles.input}
                            placeholder="Adresse wird automatisch gesetzt"
                        />

                        {/* 🔹 Beschreibung */}
                        <Text style={styles.label}>Beschreibung</Text>
                        <TextInput
                            value={description}
                            onChangeText={setDescription}
                            style={[styles.input, { height: 90 }]}
                            multiline
                            placeholder="Weitere Informationen..."
                        />

                        {/* 🔹 Kamera */}
                        <TouchableOpacity
                            style={styles.cameraBtn}
                            onPress={openCamera}
                        >
                            <MaterialIcons name="camera-alt" size={20} color="white" />
                            <Text style={{ color: "white", marginLeft: 8 }}>
                                Foto aufnehmen
                            </Text>
                        </TouchableOpacity>

                        {/* 🔹 Senden */}
                        <TouchableOpacity style={styles.sendBtn} onPress={sendReport}>
                            <Text style={styles.sendText}>
                                Report senden
                            </Text>
                        </TouchableOpacity>

                    </Pressable>
                </Pressable>
            )}


        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    map: { flex: 1 },

    searchContainer: {
        position: "absolute",
        top: 60,
        left: 15,
        right: 15,
        zIndex: 20,
    },

    searchBox: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "white",
        paddingHorizontal: 15,
        borderRadius: 15,
        elevation: 6,
    },

    searchInput: {
        flex: 1,
        paddingVertical: 10,
        marginLeft: 8,
    },

    searchButton: {
        backgroundColor: "#2563eb",
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 12,
        marginLeft: 10,
    },

    searchButtonText: {
        color: "white",
        fontWeight: "700",
    },

    searchResults: {
        backgroundColor: "white",
        borderRadius: 15,
        paddingVertical: 8,
        marginTop: 8,
        elevation: 6,
        maxHeight: 220,
    },

    searchResultItem: {
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
    },

    searchResultText: {
        color: "#333",
        fontSize: 14,
    },

    fab: {
        position: "absolute",
        bottom: 40,
        right: 20,
        width: 65,
        height: 65,
        borderRadius: 35,
        backgroundColor: "#2563eb",
        justifyContent: "center",
        alignItems: "center",
        elevation: 8,
    },

    fabText: {
        color: "white",
        fontSize: 28,
        fontWeight: "bold",
    },

    reportPreview: {
        position: "absolute",
        bottom: 140,
        left: 15,
        right: 15,
        backgroundColor: "rgba(255,255,255,0.95)",
        borderRadius: 16,
        padding: 14,
        elevation: 8,
    },

    previewTitle: {
        fontSize: 16,
        fontWeight: "700",
        marginBottom: 6,
    },

    previewText: {
        fontSize: 14,
        color: "#444",
        marginBottom: 8,
    },

    previewMetaRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 10,
    },

    previewMeta: {
        fontSize: 13,
        color: "#555",
    },

    previewClose: {
        alignSelf: "flex-end",
        paddingVertical: 8,
        paddingHorizontal: 14,
        backgroundColor: "#2563eb",
        borderRadius: 12,
    },

    previewCloseText: {
        color: "white",
        fontWeight: "700",
    },

    hint: {
        position: "absolute",
        bottom: 120,
        right: 20,
        backgroundColor: "#2563eb",
        padding: 10,
        borderRadius: 10,
        elevation: 6,
    },

    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
    },

    modalBox: {
        width: 300,
        backgroundColor: "white",
        padding: 25,
        borderRadius: 20,
        elevation: 10,
    },

    modalTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 20,
    },

    modalButton: {
        backgroundColor: "#2563eb",
        padding: 12,
        borderRadius: 10,
        alignItems: "center",
    },
    popupBox: {
        width: 330,
        backgroundColor: "#f8fafc",
        padding: 20,
        borderRadius: 25,
        elevation: 10,
    },

    popupTitle: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 15,
        textAlign: "center",
    },

    label: {
        marginTop: 10,
        marginBottom: 5,
        fontWeight: "600",
    },

    bottomSheetOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.4)",
        justifyContent: "flex-end",
    },

    bottomSheet: {
        backgroundColor: "#ffffff",
        padding: 20,
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        minHeight: 480,
    },

    sheetHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 15,
    },

    sheetTitle: {
        fontSize: 20,
        fontWeight: "bold",
    },


    priorityRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 10,
    },

    priorityBtn: {
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 15,
    },

    priorityText: {
        color: "white",
        fontWeight: "bold",
    },

    input: {
        backgroundColor: "#f1f5f9",
        padding: 12,
        borderRadius: 15,
        marginBottom: 5,
    },

    cameraBtn: {
        flexDirection: "row",
        backgroundColor: "#2563eb",
        padding: 12,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 10,
    },

    sendBtn: {
        marginTop: 15,
        backgroundColor: "#1e40af",
        padding: 15,
        borderRadius: 20,
        alignItems: "center",
    },

    sendText: {
        color: "white",
        fontWeight: "bold",
        fontSize: 16,
    },
});