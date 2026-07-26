import { useEffect, useMemo, useState } from "react";
import API, { getReports } from "../services/api";

import { Link } from "react-router-dom";

import {
    MapContainer,
    TileLayer,
    Marker,
    Popup
} from "react-leaflet";
import L from "leaflet";

import "leaflet/dist/leaflet.css";
import "../css/ReportsMap.css";

const uploadBaseUrl = API.defaults.baseURL.replace(/\/api$/, "");

const getPhotoUrl = (report) => {
    if (!report?.photo) return null;
    if (String(report.photo).startsWith("data:image/")) return report.photo;
    return `${uploadBaseUrl}/api/reports/${report.id}/photo`;
};

const getCategoryColor = (category) => {
    const key = String(category || "").toLowerCase().replace(/\s/g, "_");
    if (["road_damage", "straßenschäden", "strassenschaden"].includes(key)) return "#dc2626";
    if (["street_light", "beleuchtung"].includes(key)) return "#f59e0b";
    if (["waste", "müll", "mull", "müll_&_sauberkeit", "mull_&_sauberkeit"].includes(key)) return "#16a34a";
    return "#6366f1";
};

const getCategoryIcon = (category) => {
    const key = String(category || "").toLowerCase().replace(/\s/g, "_");
    if (["road_damage", "straßenschäden", "strassenschaden"].includes(key)) return "🔧";
    if (["street_light", "beleuchtung"].includes(key)) return "💡";
    if (["waste", "müll", "mull", "müll_&_sauberkeit", "mull_&_sauberkeit"].includes(key)) return "♻️";
    return "📍";
};

const getStatusConfig = (status) => {
    const s = String(status || "").toLowerCase();
    if (["neu", "open", "pending"].includes(s)) return { label: "Neu", color: "#2563eb", bg: "#dbeafe", dot: "🔵" };
    if (["in bearbeitung", "in_progress", "in progress", "in_review"].includes(s)) return { label: "In Bearbeitung", color: "#d97706", bg: "#fef3c7", dot: "🟡" };
    if (["erledigt", "repaired", "done", "fixed"].includes(s)) return { label: "Erledigt", color: "#16a34a", bg: "#dcfce7", dot: "🟢" };
    return { label: status || "-", color: "#6b7280", bg: "#f3f4f6", dot: "⚪" };
};

const getPriorityConfig = (priority) => {
    const p = String(priority || "").toLowerCase();
    if (p === "high" || p === "hoch") return { label: "Hoch", color: "#dc2626" };
    if (p === "medium" || p === "mittel") return { label: "Mittel", color: "#f97316" };
    if (p === "low" || p === "niedrig") return { label: "Niedrig", color: "#16a34a" };
    return { label: priority || "-", color: "#6b7280" };
};

const createMarkerIcon = (category) => {
    const color = getCategoryColor(category);
    const icon = getCategoryIcon(category);
    return L.divIcon({
        className: "",
        html: `<div style="
            width:38px;height:38px;border-radius:50%;
            background:${color};
            display:flex;align-items:center;justify-content:center;
            font-size:18px;
            box-shadow:0 2px 8px rgba(0,0,0,0.3);
            border:2.5px solid white;
        ">${icon}</div>`,
        iconSize: [38, 38],
        iconAnchor: [19, 19],
        popupAnchor: [0, -22],
    });
};

export default function ReportsMap({ token }) {

    const [reports, setReports] = useState([]);
    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("alle");
    const [statusFilter, setStatusFilter] = useState("alle");

    const currentUser = JSON.parse(localStorage.getItem("user") || "null");
    const isAdmin = currentUser?.role === "admin";
    const isCaseworker = currentUser?.role === "caseworker";

    useEffect(() => {
        const loadReports = async () => {
            try {
                const res = await getReports(token);
                setReports(res.data);
            } catch (error) {
                console.error(error);
            }
        };

        loadReports();
    }, [token]);

    const normalizeStatus = (status) => {
        const s = String(status || "").toLowerCase();
        if (["neu", "open", "pending"].includes(s)) return "neu";
        if (["in bearbeitung", "in_progress", "in progress", "in_review"].includes(s)) return "in_bearbeitung";
        if (["erledigt", "repaired", "done", "fixed"].includes(s)) return "erledigt";
        return "other";
    };

    const categoryOptions = useMemo(() => {
        const values = Array.from(
            new Set(reports.map((r) => String(r.category || "Allgemein").trim()).filter(Boolean))
        );
        return values.sort((a, b) => a.localeCompare(b));
    }, [reports]);

    const filteredReports = useMemo(() => {
        return reports.filter((report) => {
            const query = search.trim().toLowerCase();
            const matchesSearch =
                !query ||
                String(report.title || "").toLowerCase().includes(query) ||
                String(report.description || "").toLowerCase().includes(query) ||
                String(report.category || "").toLowerCase().includes(query) ||
                String(report.address || "").toLowerCase().includes(query) ||
                String(report.id || "").includes(query);

            const category = String(report.category || "Allgemein").trim();
            const matchesCategory = categoryFilter === "alle" || category === categoryFilter;

            const normalized = normalizeStatus(report.status);
            const matchesStatus = statusFilter === "alle" || normalized === statusFilter;

            return matchesSearch && matchesCategory && matchesStatus;
        });
    }, [reports, search, categoryFilter, statusFilter]);

    const reportsWithCoords = useMemo(() => {
        return filteredReports.filter((r) => {
            const lat = Number(r.latitude);
            const lng = Number(r.longitude);
            return Number.isFinite(lat) && Number.isFinite(lng);
        });
    }, [filteredReports]);

    const mapCenter = useMemo(() => {
        if (reportsWithCoords.length > 0) {
            return [Number(reportsWithCoords[0].latitude), Number(reportsWithCoords[0].longitude)];
        }
        return [52.52, 13.405];
    }, [reportsWithCoords]);

    const exportCsv = () => {
        const rows = filteredReports.map((r) => ({
            id: r.id ?? "",
            title: r.title ?? "",
            description: r.description ?? "",
            category: r.category ?? "",
            address: r.address ?? "",
            status: r.status ?? "",
            priority: r.priority ?? "",
            user_id: r.user_id ?? "",
            latitude: r.latitude ?? "",
            longitude: r.longitude ?? "",
            created_at: r.created_at ?? "",
            photo: r.photo ?? ""
        }));

        const headers = Object.keys(rows[0] || {
            id: "",
            title: "",
            description: "",
            category: "",
            address: "",
            status: "",
            priority: "",
            user_id: "",
            latitude: "",
            longitude: "",
            created_at: "",
            photo: ""
        });

        const escapeCell = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
        const csv = [
            headers.join(","),
            ...rows.map((row) => headers.map((h) => escapeCell(row[h])).join(","))
        ].join("\n");

        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        const now = new Date().toISOString().slice(0, 19).replace(/[T:]/g, "-");
        a.href = url;
        a.download = `reports-map-export-${now}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="layout">

            {/* SIDEBAR */}
            <div className="sidebar">

                <div className="sidebar-header">
                    <h1>CityReport</h1>
                </div>

                <div className="menu">

                    <Link
                        to="/dashboard"
                        className="menu-item"
                    >
                        📊 Dashboard
                    </Link>

                    <Link
                        to="/reports"
                        className="menu-item"
                    >
                        📋 Meldungen
                    </Link>

                    {isAdmin && (
                        <Link
                            to="/users"
                            className="menu-item"
                        >
                            👥 Benutzer
                        </Link>
                    )}

                    {(isAdmin || isCaseworker) && (
                        <Link
                            to="/categories"
                            className="menu-item"
                        >
                            🏷 Kategorien
                        </Link>
                    )}

                    <Link
                        to="/map"
                        className="menu-item active"
                    >
                        🗺 Map
                    </Link>

                    <Link
                        to="/notifications"
                        className="menu-item"
                    >
                        🔔 Benachrichtigungen
                    </Link>

                    <Link
                        to="/statistics"
                        className="menu-item"
                    >
                        📈 Statistiken
                    </Link>

                    <Link
                        to="/settings"
                        className="menu-item"
                    >
                        ⚙ Einstellungen
                    </Link>

                </div>

                <div className="admin-box">

                    <div className="avatar">{String(currentUser?.name || "A").charAt(0).toUpperCase()}</div>

                    <div>
                        <h4>{currentUser?.name || "Benutzer"}</h4>
                        <p>{currentUser?.email || "-"}</p>
                    </div>

                </div>

            </div>

            {/* CONTENT */}
            <div className="main-content">

                <div className="page-header">
                    <h1>Meldungskarte</h1>
                    <p>
                        Alle Bürgermeldungen auf der Karte anzeigen
                    </p>
                </div>

                <div className="filters">

                    <input
                        type="text"
                        placeholder="Meldungen, Kategorien oder Orte suchen..."
                        className="search-input"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />

                    <div className="filter-row">

                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                        >
                            <option value="alle">Alle Kategorien</option>
                            {categoryOptions.map((c) => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>

                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="alle">Alle Status</option>
                            <option value="neu">Neu</option>
                            <option value="in_bearbeitung">In Bearbeitung</option>
                            <option value="erledigt">Erledigt</option>
                        </select>

                        <button className="export-btn" onClick={exportCsv}>
                            CSV Export
                        </button>

                    </div>

                </div>

                <div className="map-card">

                    <div className="map-info">
                        📍 {reportsWithCoords.length} von {filteredReports.length} gefilterten Meldungen auf der Karte
                    </div>

                    {reportsWithCoords.length === 0 ? (
                        <div className="empty-map">
                            Keine Meldungen mit Koordinaten für den aktuellen Filter.
                        </div>
                    ) : (
                        <MapContainer
                            center={mapCenter}
                            zoom={12}
                            className="leaflet-map"
                        >

                            <TileLayer
                                attribution="&copy; OpenStreetMap"
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />

                            {reportsWithCoords.map(report => {
                                const statusCfg = getStatusConfig(report.status);
                                const priCfg = getPriorityConfig(report.priority);
                                const photoUrl = getPhotoUrl(report);
                                const catColor = getCategoryColor(report.category);
                                return (
                                <Marker
                                    key={report.id}
                                    position={[
                                        Number(report.latitude),
                                        Number(report.longitude)
                                    ]}
                                    icon={createMarkerIcon(report.category)}
                                >
                                    <Popup minWidth={280} maxWidth={320}>
                                        <div style={{ fontFamily: "Segoe UI, sans-serif", padding: "2px 0" }}>

                                            {/* Colored header */}
                                            <div style={{ background: catColor, borderRadius: "10px 10px 0 0", padding: "10px 14px", margin: "-14px -14px 12px -14px", display: "flex", alignItems: "center", gap: 8 }}>
                                                <span style={{ fontSize: 20 }}>{getCategoryIcon(report.category)}</span>
                                                <span style={{ color: "white", fontWeight: 700, fontSize: 14, lineHeight: 1.3 }}>{report.title || `Meldung #${report.id}`}</span>
                                            </div>

                                            {/* Status + Priority pills */}
                                            <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
                                                <span style={{ background: statusCfg.bg, color: statusCfg.color, borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 700 }}>
                                                    {statusCfg.dot} {statusCfg.label}
                                                </span>
                                                <span style={{ background: "#f3f4f6", color: priCfg.color, borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 700 }}>
                                                    ⚡ {priCfg.label}
                                                </span>
                                            </div>

                                            {/* Description */}
                                            {report.description && (
                                                <p style={{ fontSize: 13, color: "#374151", marginBottom: 10, lineHeight: 1.5 }}>
                                                    {report.description}
                                                </p>
                                            )}

                                            {/* Info card */}
                                            <div style={{ background: "#f8fafc", borderRadius: 10, padding: "8px 12px", marginBottom: 10 }}>
                                                <div style={{ display: "flex", gap: 6, alignItems: "flex-start", marginBottom: 4 }}>
                                                    <span style={{ fontSize: 13 }}>🏷</span>
                                                    <span style={{ fontSize: 12, color: "#475569" }}><strong>Kategorie:</strong> {report.category || "-"}</span>
                                                </div>
                                                <div style={{ display: "flex", gap: 6, alignItems: "flex-start", marginBottom: 4 }}>
                                                    <span style={{ fontSize: 13 }}>📍</span>
                                                    <span style={{ fontSize: 12, color: "#475569" }}><strong>Adresse:</strong> {report.address || "-"}</span>
                                                </div>
                                                <div style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
                                                    <span style={{ fontSize: 13 }}>🕐</span>
                                                    <span style={{ fontSize: 12, color: "#475569" }}><strong>Datum:</strong> {report.created_at ? new Date(report.created_at).toLocaleDateString("de-DE") : "-"}</span>
                                                </div>
                                            </div>

                                            {/* Photo */}
                                            {photoUrl && (
                                                <img
                                                    src={photoUrl}
                                                    alt={report.title || `Meldung #${report.id}`}
                                                    style={{ width: "100%", borderRadius: 10, objectFit: "cover", maxHeight: 160 }}
                                                />
                                            )}
                                        </div>
                                    </Popup>
                                </Marker>
                                );
                            })}

                        </MapContainer>
                    )}

                </div>

            </div>

        </div>
    );
}