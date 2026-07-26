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
  KeyboardAvoidingView,
} from "react-native";
import * as Location from "expo-location";
import { createReport, getReports, syncPendingReports } from "@/services/api";
import { AuthContext } from "@/context/AuthContext";
import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

const getCategoryIconName = (category: string): string => {
  const key = String(category || "").toLowerCase().replace(/\s/g, "_");
  switch (key) {
    case "road_damage":
    case "straßenschäden":
    case "strassenschaden":
      return "engineering";
    case "street_light":
    case "beleuchtung":
      return "emoji-objects";
    case "waste":
    case "müll":
    case "mull":
    case "müll_&_sauberkeit":
    case "mull_&_sauberkeit":
      return "recycling";
    default:
      return "help-outline";
  }
};

const getCategoryColor = (category: string): string => {
  const key = String(category || "").toLowerCase().replace(/\s/g, "_");
  switch (key) {
    case "road_damage":
    case "straßenschäden":
    case "strassenschaden":
      return "#dc2626";
    case "street_light":
    case "beleuchtung":
      return "#f59e0b";
    case "waste":
    case "müll":
    case "mull":
    case "müll_&_sauberkeit":
    case "mull_&_sauberkeit":
      return "#16a34a";
    default:
      return "#6366f1";
  }
};

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
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [address, setAddress] = useState("");
  const [reportLocation, setReportLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("road_damage");
  const [priority, setPriority] = useState("medium");
  const [photo, setPhoto] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [locating, setLocating] = useState(false);

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
    const rawReports = Array.isArray(data) ? data : data.reports || [];
    const normalizedReports = rawReports
      .map((report: any) => ({
        ...report,
        latitude: Number(report?.latitude),
        longitude: Number(report?.longitude),
      }))
      .filter(
        (report: any) => Number.isFinite(report.latitude) && Number.isFinite(report.longitude)
      );

    setReports(normalizedReports);
    return normalizedReports;
  };

  const openCreateReportModal = () => {
    setDescription("");
    setCategory("road_damage");
    setPriority("medium");
    setPhoto(null);
    if (!reportLocation && userLocation) {
      setReportLocation({ latitude: userLocation.latitude, longitude: userLocation.longitude });
    }
    setShowModal(true);
  };

  const resolveLocationFromSearch = async () => {
    const trimmedSearch = search.trim();

    // Wenn Nutzer einen Ort eingibt (z. B. "Berlin"), hat die Suche Priorität
    // vor einer ggf. zuvor gesetzten Standard-Position.
    if (trimmedSearch) {
      const suggestions = await fetchSearchSuggestions(search);
      const first = suggestions?.[0];
      if (first?.lat && first?.lon) {
        const lat = Number.parseFloat(first.lat);
        const lon = Number.parseFloat(first.lon);
        if (Number.isFinite(lat) && Number.isFinite(lon)) {
          const addr = first.address || {};
          const line1 = [addr.road, addr.house_number].filter(Boolean).join(" ");
          const line2 = [addr.postcode, addr.city || addr.town || addr.village || addr.county].filter(Boolean).join(" ");
          const fullAddress = [line1, line2].filter(Boolean).join(", ") || first.display_name;
          setAddress(fullAddress);
          setReportLocation({ latitude: lat, longitude: lon });
          return { latitude: lat, longitude: lon };
        }
      }
    }

    if (reportLocation) return reportLocation;

    return userLocation || null;
  };

  const sendReport = async () => {
    const loc = await resolveLocationFromSearch();
    if (!loc) {
      alert("Standort wird noch ermittelt. Bitte kurz warten.");
      return;
    }

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
      latitude: loc.latitude,
      longitude: loc.longitude,
      photo: photo || undefined,
    };

    try {
      const result = await createReport(token, payload);

      if (result?.offline) {
        alert("Report offline gespeichert. Er wird gesendet, sobald die Verbindung wiederhergestellt ist.");

        const tempId = `offline-${Date.now()}`;
        setReports((prev) => [
          {
            id: tempId,
            title: selectedCategoryLabel,
            description,
            category,
            status: "Neu",
            priority,
            latitude: Number(loc.latitude),
            longitude: Number(loc.longitude),
            address,
            created_at: new Date().toISOString(),
          },
          ...prev,
        ]);
      } else {
        alert("Report erfolgreich gesendet");
      }

      setDescription("");
      setCategory("road_damage");
      setPriority("medium");
      setPhoto(null);
      setShowModal(false);

      const refreshed = await loadReports();
      const createdId = result?.id;
      const createdReport = createdId
        ? (refreshed || []).find((item: any) => String(item.id) === String(createdId))
        : null;

      mapRef.current?.animateToRegion({
        latitude: Number(createdReport?.latitude ?? loc.latitude),
        longitude: Number(createdReport?.longitude ?? loc.longitude),
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
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

  const fetchSearchSuggestions = async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) {
      setSearchResults([]);
      return [];
    }

    try {
      const runSearch = async (q: string) => {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&countrycodes=de&addressdetails=1&limit=6`,
          {
            headers: {
              "User-Agent": "InfrastructureReportingApp/1.0",
              "Accept-Language": "de-DE,de,en",
            },
          }
        );

        const data = await response.json();
        return Array.isArray(data) ? data : [];
      };

      let results = await runSearch(trimmed);

      if (results.length === 0) {
        const postalMatch = trimmed.match(/\b\d{5}\b/);
        if (postalMatch) {
          const plz = postalMatch[0];
          const rest = trimmed.replace(plz, "").replace(/\s+/g, " ").replace(/\s,|,\s/g, ", ").trim();

          // Fallback 1: "10115 Berlin" / "10115 Musterstraße 1"
          if (rest) {
            results = await runSearch(`${plz} ${rest}`.trim());
          }

          // Fallback 2: Nur PLZ, falls Nutzer sehr spezifisch oder ungewöhnlich tippt
          if (results.length === 0) {
            results = await runSearch(plz);
          }
        }
      }

      setSearchResults(results);
      return results;
    } catch {
      setSearchResults([]);
      return [];
    }
  };

  const selectSearchResult = (result: any) => {
    const addr = result.address || {};
    const road = [addr.road, addr.house_number].filter(Boolean).join(" ");
    const city = addr.city || addr.town || addr.village || addr.county || "";
    const fullAddress = [road, city].filter(Boolean).join(", ") || result.display_name.split(",")[0];
    setSearch(fullAddress);
    setAddress(fullAddress);
    setSearchResults([]);

    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);

    setReportLocation({ latitude: lat, longitude: lon });

    mapRef.current?.animateToRegion({
      latitude: lat,
      longitude: lon,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
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
      const street = [place.street, place.streetNumber].filter(Boolean).join(" ");
      const cityPart = [place.postalCode, place.city || place.district].filter(Boolean).join(" ");
      const resolvedAddress = [street, cityPart].filter(Boolean).join(", ").trim();
      setAddress(resolvedAddress || place.name || "");
    }

    mapRef.current?.animateToRegion({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    });
  };

  const refreshModalLocation = async () => {
    if (isWeb) return;
    setLocating(true);
    try {
      const location = await Location.getCurrentPositionAsync({});
      setReportLocation({ latitude: location.coords.latitude, longitude: location.coords.longitude });

      const result = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (result.length > 0) {
        const place = result[0];
        const street = [place.street, place.streetNumber].filter(Boolean).join(" ");
        const cityPart = [place.postalCode, place.city || place.district].filter(Boolean).join(" ");
        const resolvedAddress = [street, cityPart].filter(Boolean).join(", ").trim();
        setAddress(resolvedAddress || place.name || "");
      }
    } catch {
      // ignore
    } finally {
      setLocating(false);
    }
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
                {searchResults.map((result) => {
                    const addr = result.address || {};
                    const line1 = [addr.road, addr.house_number].filter(Boolean).join(" ") || result.name || "";
                    const line2 = [addr.postcode, addr.city || addr.town || addr.village || addr.county].filter(Boolean).join(" ");
                    return (
                        <TouchableOpacity
                            key={result.place_id}
                            style={styles.searchResultItem}
                            onPress={() => selectSearchResult(result)}
                        >
                          <Text style={styles.searchResultTitle} numberOfLines={1}>
                            {line1 || result.display_name.split(",")[0]}
                          </Text>
                          {!!line2 && (
                            <Text style={styles.searchResultSub} numberOfLines={1}>{line2}</Text>
                          )}
                        </TouchableOpacity>
                    );
                })}
              </View>
          )}
        </View>

        <MapView
            ref={mapRef}
            style={styles.map}
            showsUserLocation={true}
            followsUserLocation={false}
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

          {reports.map((report) => {
            const catColor = getCategoryColor(report.category);
            const iconName = getCategoryIconName(report.category);
            return (
              <Marker
                  key={report.id}
                  coordinate={{
                    latitude: Number(report.latitude),
                    longitude: Number(report.longitude),
                  }}
                  onPress={() => setSelectedReport(report)}
              >
                <View style={[styles.customMarker, { backgroundColor: catColor }]}>
                  <MaterialIcons name={iconName as any} size={18} color="#fff" />
                </View>
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
            );
          })}
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
              <KeyboardAvoidingView
                  style={styles.bottomSheetKeyboardWrap}
                  behavior={Platform.OS === "ios" ? "padding" : "height"}
                  keyboardVerticalOffset={Platform.OS === "ios" ? 24 : 0}
              >
                <Pressable
                    style={styles.bottomSheet}
                    onPress={(e) => (e.stopPropagation ? e.stopPropagation() : undefined)}
                >
                  <ScrollView
                      contentContainerStyle={styles.bottomSheetContent}
                      showsVerticalScrollIndicator={false}
                      keyboardShouldPersistTaps="handled"
                      keyboardDismissMode="on-drag"
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
                  <View style={styles.addressRow}>
                    <TextInput
                        value={address}
                        onChangeText={setAddress}
                        style={[styles.input, { flex: 1, marginBottom: 0 }]}
                        placeholder="Adresse wird automatisch gesetzt"
                    />
                    <TouchableOpacity
                        style={styles.locateBtn}
                        onPress={refreshModalLocation}
                        disabled={locating}
                    >
                      <MaterialIcons
                          name={locating ? "hourglass-empty" : "my-location"}
                          size={20}
                          color="#fff"
                      />
                    </TouchableOpacity>
                  </View>
                  {reportLocation && (
                    <Text style={styles.coordsText}>
                      📍 {reportLocation.latitude.toFixed(5)}, {reportLocation.longitude.toFixed(5)}
                    </Text>
                  )}

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
              </KeyboardAvoidingView>
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

  customMarker: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    borderWidth: 2,
    borderColor: "#fff",
  },
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
  searchResultTitle: {
    color: "#111827",
    fontSize: 14,
    fontWeight: "700",
  },
  searchResultSub: {
    color: "#6b7280",
    fontSize: 12,
    marginTop: 2,
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
  bottomSheetKeyboardWrap: {
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
    paddingBottom: 64,
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
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 5,
  },
  locateBtn: {
    backgroundColor: "#5D845C",
    padding: 12,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  coordsText: {
    fontSize: 11,
    color: "#64748b",
    marginBottom: 6,
    marginLeft: 4,
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
