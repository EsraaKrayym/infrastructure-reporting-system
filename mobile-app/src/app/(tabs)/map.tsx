import React, { useEffect, useMemo, useRef, useState, useContext } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Pressable,
  TextInput,
  Platform,
  Image,
  ScrollView,
} from "react-native";
import * as Location from "expo-location";
import { createReport, getReports, syncPendingReports } from "@/services/api";
import { AuthContext } from "@/context/AuthContext";
import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

const CATEGORY_OPTIONS = [
  { value: "road_damage", label: "Straßenschäden" },
  { value: "street_light", label: "Beleuchtung" },
  { value: "waste", label: "Müll & Sauberkeit" },
  { value: "other", label: "Sonstiges" },
];

export default function MapScreen() {
  const auth = useContext(AuthContext) as { token?: string | null } | null;
  const token = auth?.token ?? null;

  // react-native-maps darf auf web nicht statisch importiert werden
  const isWeb = Platform.OS === "web";
  const [mapsModule, setMapsModule] = useState<any>(null);

  useEffect(() => {
    if (isWeb) return;
    // string concatenation => Metro soll das Modul nicht vorab auf web auflösen
    const m = require("react-native-" + "maps");
    setMapsModule(m);
  }, [isWeb]);

  const MapView = useMemo(() => (mapsModule ? mapsModule.default ?? mapsModule : null), [mapsModule]);
  const Marker = useMemo(() => (mapsModule ? mapsModule.Marker : null), [mapsModule]);
  const Callout = useMemo(() => (mapsModule ? mapsModule.Callout : null), [mapsModule]);

  const mapRef = useRef<any>(null);

  const [reports, setReports] = useState<any[]>([]);
  const [userLocation, setUserLocation] = useState<any>(null);
  const [showHint, setShowHint] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("road_damage");
  const [priority, setPriority] = useState("medium");
  const [photo, setPhoto] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<any>(null);

  const selectedCategoryLabel =
    CATEGORY_OPTIONS.find((item) => item.value === category)?.label || "Infrastrukturmeldung";

  useEffect(() => {
    if (!token) return;
    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (!token) return;

    const runSync = async () => {
      try {
        await syncPendingReports(token);
      } catch {
        // offline/timeout still possible
      }
    };

    runSync();
    const interval = setInterval(runSync, 15000);

    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    getUserLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadReports = async () => {
    if (!token) return;
    const data = await getReports(token);
    setReports(Array.isArray(data) ? data : data.reports || []);
  };

  const openCreateReportModal = () => {
    setDescription("");
    setCategory("road_damage");
    setPriority("medium");
    setPhoto(null);
    setShowHint(false);
    setShowModal(true);
  };

  const sendReport = async () => {
    if (!userLocation) return;

    if (!token) {
      alert("Bitte melden Sie sich an");
      return;
    }

    const payload = {
      title: selectedCategoryLabel,
      category,
      description,
      priority,
      address,
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
      photo: photo || undefined,
    };

    try {
      const result = await createReport(token, payload);

      if (result?.offline) {
        alert("Report offline gespeichert. Er wird gesendet, sobald die Verbindung wiederhergestellt ist.");
      } else {
        alert("Report erfolgreich gesendet");
      }

      setDescription("");
      setCategory("road_damage");
      setPriority("medium");
      setPhoto(null);
      setShowModal(false);
      await loadReports();
    } catch (error: any) {
      alert(error?.message || "Fehler beim Senden");
    }
  };

  const openCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchCameraAsync({ quality: 0.5 });
    if (!result.canceled) {
      const uri = result.assets?.[0]?.uri;
      if (uri) setPhoto(uri);
    }
  };

  const getPriorityColor = (p: string) => {
    switch (p) {
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
            headers: { "User-Agent": "InfrastructureReportingApp/1.0" },
          }
      );

      const data = await response.json();
      const results = Array.isArray(data) ? data : [];
      setSearchResults(results);
      return results;
    } catch {
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
    if (results.length > 0) selectSearchResult(results[0]);
  };

  const getUserLocation = async () => {
    if (isWeb) return;

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return;

    const location = await Location.getCurrentPositionAsync({});
    setUserLocation(location.coords);

    const result = await Location.reverseGeocodeAsync({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    });

    if (result.length > 0) {
      const place = result[0];
      setAddress(`${place.street || ""} ${place.name || ""}`.trim());
    }

    mapRef.current?.animateToRegion({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    });
  };

  // Für Web sollte dieses File eigentlich nicht gerendert werden (map.web.tsx übernimmt).
  if (isWeb) {
    return (
        <View style={styles.webContainer}>
          <Text style={styles.webTitle}>Karte ist im Web nicht verfügbar</Text>
        </View>
    );
  }

  if (!MapView || !Marker || !Callout) {
    return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Lade Karte…</Text>
        </View>
    );
  }

  return (
      <View style={styles.container}>
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

        <TouchableOpacity
            style={styles.fab}
            onPress={openCreateReportModal}
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
              <TouchableOpacity
                  onPress={() => setSelectedReport(null)}
                  style={styles.previewClose}
              >
                <Text style={styles.previewCloseText}>Schließen</Text>
              </TouchableOpacity>
            </View>
        )}

        {showModal && (
            <Pressable style={styles.bottomSheetOverlay} onPress={() => setShowModal(false)}>
              <Pressable
                  style={styles.bottomSheet}
                  onPress={(e) => (e.stopPropagation ? e.stopPropagation() : undefined)}
              >
                <ScrollView
                    contentContainerStyle={styles.bottomSheetContent}
                    showsVerticalScrollIndicator={false}
                >
                  <View style={styles.sheetHeader}>
                    <TouchableOpacity onPress={() => setShowModal(false)}>
                      <MaterialIcons name="close" size={26} color="#333" />
                    </TouchableOpacity>

                    <Text style={styles.sheetTitle}>Schaden melden</Text>
                    <View style={{ width: 26 }} />
                  </View>

                  <Text style={styles.label}>Priorität</Text>
                  <View style={styles.priorityRow}>
                    {["low", "medium", "high"].map((p) => (
                        <TouchableOpacity
                            key={p}
                            onPress={() => setPriority(p)}
                            style={[
                              styles.priorityBtn,
                              {
                                backgroundColor: p === "high" ? "#dc2626" : p === "medium" ? "#f97316" : "#16a34a",
                                opacity: priority === p ? 1 : 0.4,
                              },
                            ]}
                        >
                          <Text style={styles.priorityText}>
                            {p === "low" ? "Niedrig" : p === "medium" ? "Mittel" : "Hoch"}
                          </Text>
                        </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.label}>Kategorie</Text>
                  <View style={styles.categoryRow}>
                    {CATEGORY_OPTIONS.map((c) => (
                      <TouchableOpacity
                        key={c.value}
                        onPress={() => setCategory(c.value)}
                        style={[
                          styles.categoryBtn,
                          category === c.value && styles.categoryBtnActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.categoryBtnText,
                            category === c.value && styles.categoryBtnTextActive,
                          ]}
                        >
                          {c.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.label}>Ort</Text>
                  <TextInput
                      value={address}
                      onChangeText={setAddress}
                      style={styles.input}
                      placeholder="Adresse wird automatisch gesetzt"
                  />

                  <Text style={styles.label}>Beschreibung</Text>
                  <TextInput
                      value={description}
                      onChangeText={setDescription}
                      style={[styles.input, { height: 90 }]}
                      multiline
                      placeholder="Weitere Informationen..."
                  />

                  <TouchableOpacity style={styles.cameraBtn} onPress={openCamera}>
                    <MaterialIcons name="camera-alt" size={20} color="white" />
                    <Text style={{ color: "white", marginLeft: 8 }}>Foto aufnehmen</Text>
                  </TouchableOpacity>

                  {photo && (
                      <View style={styles.photoPreviewCard}>
                        <View style={styles.photoPreviewHeader}>
                          <Text style={styles.photoPreviewTitle}>Foto bereit für Upload ✅</Text>
                          <TouchableOpacity onPress={() => setPhoto(null)}>
                            <Text style={styles.photoRemoveText}>Entfernen</Text>
                          </TouchableOpacity>
                        </View>

                        <Image
                            source={{ uri: photo }}
                            style={styles.photoPreviewImage}
                            resizeMode="cover"
                        />
                      </View>
                  )}

                  <TouchableOpacity style={styles.sendBtn} onPress={sendReport}>
                    <Text style={styles.sendText}>Report senden</Text>
                  </TouchableOpacity>
                </ScrollView>
              </Pressable>
            </Pressable>
        )}
      </View>
  );
}

const styles = StyleSheet.create({
  webContainer: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  webTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },

  container: { flex: 1 },
  map: { flex: 1 },

  callout: {
    maxWidth: 220,
    padding: 10,
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    elevation: 6,
  },
  calloutTitle: {
    fontWeight: "700",
    fontSize: 14,
    marginBottom: 4,
    color: "#111827",
  },
  calloutText: {
    fontSize: 12,
    color: "#374151",
    marginBottom: 6,
  },
  calloutMeta: {
    fontSize: 11,
    color: "#4b5563",
    marginBottom: 2,
  },

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
    backgroundColor: "#5D845CFF",
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
    backgroundColor: "#5D845CFF",
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
    backgroundColor: "#5D845CFF",
    borderRadius: 12,
  },
  previewCloseText: {
    color: "white",
    fontWeight: "700",
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
    paddingTop: 20,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    minHeight: 480,
    maxHeight: "82%",
  },
  bottomSheetContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
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

  label: {
    marginTop: 10,
    marginBottom: 5,
    fontWeight: "600",
  },

  priorityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  priorityBtn: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 15,
  },
  categoryBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#fff",
  },
  categoryBtnActive: {
    backgroundColor: "#5D845CFF",
    borderColor: "#5D845CFF",
  },
  categoryBtnText: {
    color: "#334155",
    fontWeight: "600",
  },
  categoryBtnTextActive: {
    color: "#fff",
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
    backgroundColor: "#5D845CFF",
    padding: 12,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },

  photoPreviewCard: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 14,
    padding: 10,
    backgroundColor: "#f8fafc",
  },
  photoPreviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  photoPreviewTitle: {
    fontWeight: "700",
    color: "#111827",
  },
  photoRemoveText: {
    color: "#dc2626",
    fontWeight: "700",
  },
  photoPreviewImage: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    backgroundColor: "#e5e7eb",
  },

  sendBtn: {
    marginTop: 15,
    backgroundColor: "#5D845CFF",
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
